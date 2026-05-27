import type { ReservationRecord } from "@/types/reservations";
import type { LeadRecord } from "@/types/site-settings";
import { siteConfig } from "@/config/site";
import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { ga4ClientIdFromLead, sendGa4ServerEvent } from "@/lib/ga4-server";

export type ConversionRequestContext = {
  clientIp?: string;
  clientUserAgent?: string;
};

function lineToContents(services: ReservationRecord["services"]) {
  return services
    .filter((s) => !s.excluded && s.price >= 0)
    .map((s) => ({
      id: s.serviceId || s.label.slice(0, 40),
      quantity: s.quantity && s.quantity > 0 ? s.quantity : 1,
      item_price: s.price > 0 ? s.price : undefined,
    }));
}

function contentIds(services: ReservationRecord["services"]): string[] {
  return services
    .filter((s) => !s.excluded && s.serviceId)
    .map((s) => s.serviceId!)
    .filter(Boolean);
}

/**
 * Admin teklif onayı → Meta CAPI + GA4 (sunucu).
 * Reklamlar için: Purchase (satış) + AddToCart (sepet kalemleri) + Lead.
 */
export async function fireReservationApprovedConversions(
  reservation: ReservationRecord,
  lead: LeadRecord | null,
  ctx?: ConversionRequestContext
): Promise<void> {
  const eventIdBase = `approve-${reservation.leadId}-${reservation.id}`;
  const value = Math.max(0, reservation.total);
  const contents = lineToContents(reservation.services);
  const ids = contentIds(reservation.services);
  const numItems = contents.reduce((n, c) => n + c.quantity, 0) || 1;

  const userData = {
    phone: reservation.customer.phone,
    firstName: reservation.customer.firstName,
    lastName: reservation.customer.lastName,
    fbp: lead?.metaAttribution?.fbp,
    fbc: lead?.metaAttribution?.fbc,
    clientIp: ctx?.clientIp,
    clientUserAgent: ctx?.clientUserAgent,
  };

  const customBase = {
    value,
    currency: "TRY" as const,
    contentIds: ids.length ? ids : undefined,
    contents: contents.length ? contents : undefined,
    numItems,
    orderId: reservation.id,
    contentName: "admin_onayli_paket",
  };

  const tasks: Promise<unknown>[] = [
    sendMetaCapiEvent("Purchase", {
      eventId: `${eventIdBase}-purchase`,
      userData,
      customData: customBase,
      eventSourceUrl: `${siteConfig.url}/admin`,
    }),
    sendMetaCapiEvent("Lead", {
      eventId: `${eventIdBase}-lead`,
      userData,
      customData: {
        ...customBase,
        contentName: "admin_onayli_lead",
      },
    }),
  ];

  const activeLines = reservation.services.filter((s) => !s.excluded);
  activeLines.forEach((line, i) => {
    const item = contents[i] ?? {
      id: line.serviceId || line.label.slice(0, 40),
      quantity: line.quantity && line.quantity > 0 ? line.quantity : 1,
      item_price: line.price > 0 ? line.price : undefined,
    };
    tasks.push(
      sendMetaCapiEvent("AddToCart", {
        eventId: `${eventIdBase}-atc-${i}`,
        userData,
        customData: {
          currency: "TRY",
          value: item.item_price ?? line.price ?? 0,
          contentIds: item.id ? [item.id] : undefined,
          contents: [item],
          contentName: line.label,
          numItems: item.quantity,
        },
      })
    );
  });

  tasks.push(
    sendMetaCapiEvent("ReservationApproved", {
      eventId: `${eventIdBase}-custom`,
      userData,
      customData: customBase,
    })
  );

  const gaClientId = ga4ClientIdFromLead(
    reservation.leadId,
    lead?.sessionId
  );
  tasks.push(
    sendGa4ServerEvent("purchase", {
      clientId: gaClientId,
      value,
      currency: "TRY",
      transactionId: reservation.id,
      items: reservation.services
        .filter((s) => !s.excluded)
        .map((s) => ({
          item_id: s.serviceId,
          item_name: s.label,
          price: s.price,
          quantity: s.quantity ?? 1,
        })),
    })
  );

  tasks.push(
    sendGa4ServerEvent("generate_lead", {
      clientId: gaClientId,
      value,
      currency: "TRY",
    })
  );

  const results = await Promise.allSettled(tasks);
  if (process.env.NODE_ENV === "development") {
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length) {
      console.debug("[conversion-events]", failed);
    }
  }
}
