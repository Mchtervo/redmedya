import { trackMetaEvent, trackCustomEvent, type PixelCustomerData } from "@/lib/meta-pixel";
import {
  hasFiredOnce,
  markFiredOnce,
  reservationPurchaseEventId,
  reservationScheduleEventId,
  stableFunnelEventId,
} from "@/lib/meta-tracking";
import { getSessionId } from "@/lib/track/session";
import { track } from "@/lib/track/tracker";
import { trackFunnelEvent } from "@/lib/analytics/client";

/**
 * Ana funnel Meta olayları (tekil + stabil event_id):
 * ViewContent → PackageBuild → AddToCart → InitiateCheckout → Schedule
 * + Purchase (WhatsApp paket gönderimi = Ads Manager alışveriş)
 * + WhatsAppClick (custom + CAPI, gerçek WA tıklaması)
 */

export type PixelCustomer = PixelCustomerData;

function sid(): string {
  return getSessionId() || "anon";
}

function customerWithExternal(customer?: PixelCustomer): PixelCustomer | undefined {
  if (!customer) return { externalId: sid() };
  return { ...customer, externalId: customer.externalId ?? sid() };
}

/** /paket-olustur — bir kez (browser + CAPI, aynı event_id) */
export function pixelViewContentPaket(): void {
  const key = "view_content_paket";
  if (hasFiredOnce(key)) return;
  markFiredOnce(key);
  const eventId = stableFunnelEventId("view_content", sid(), "paket");
  trackMetaEvent(
    "ViewContent",
    { content_name: "package_builder_v2", content_category: "wedding_package" },
    customerWithExternal(),
    { eventId, mirrorCapi: true }
  );
  trackFunnelEvent("ViewContent", {
    metadata: { content_name: "package_builder_v2" },
  });
}

/** İlk paket/plato seçimi — bir kez */
export function pixelPackageBuild(contentName: string, value: number): void {
  const key = "package_build";
  if (hasFiredOnce(key)) return;
  markFiredOnce(key);
  const eventId = stableFunnelEventId("package_build", sid());
  trackCustomEvent(
    "PackageBuild",
    { content_name: contentName, value, currency: "TRY" },
    customerWithExternal(),
    { eventId, mirrorCapi: true }
  );
  trackFunnelEvent("PackageBuild", {
    metadata: { content_name: contentName.slice(0, 80) },
  });
}

/** Step1 Devam (paket seçili) — bir kez */
export function pixelAddToCartMain(packageName: string, total: number): void {
  const key = "add_to_cart";
  if (hasFiredOnce(key)) return;
  markFiredOnce(key);
  const eventId = stableFunnelEventId("add_to_cart", sid());
  trackMetaEvent(
    "AddToCart",
    { content_name: packageName, value: total },
    customerWithExternal(),
    { eventId, mirrorCapi: true }
  );
  trackFunnelEvent("AddToCart", {
    metadata: { content_name: packageName.slice(0, 80), total },
  });
}

/** Form adımına bilinçli geçiş — bir kez */
export function pixelInitiateCheckout(total: number): void {
  const key = "initiate_checkout";
  if (hasFiredOnce(key)) return;
  markFiredOnce(key);
  const eventId = stableFunnelEventId("checkout", sid());
  trackMetaEvent(
    "InitiateCheckout",
    { value: total, content_name: "reservation_form" },
    customerWithExternal(),
    { eventId, mirrorCapi: true }
  );
  trackFunnelEvent("InitiateCheckout", {
    metadata: { content_name: "reservation_form", total },
  });
}

/**
 * Backend lead kaydı sonrası.
 * CAPI sunucuda; browser fbq aynı reservation_<id> (mirror kapalı).
 */
export function pixelSchedule(
  leadOrReservationId: string,
  total: number,
  customer?: PixelCustomer,
  opts?: { mirrorCapi?: boolean }
): void {
  const eventId = reservationScheduleEventId(leadOrReservationId);
  const key = `schedule_${eventId}`;
  if (hasFiredOnce(key)) return;
  markFiredOnce(key);
  try {
    trackMetaEvent(
      "Schedule",
      {
        content_name: "wedding_reservation_request",
        value: total,
        order_id: leadOrReservationId,
      },
      customerWithExternal(customer),
      { eventId, mirrorCapi: opts?.mirrorCapi ?? false }
    );
  } catch {
    /* ignore */
  }
  try {
    trackFunnelEvent("Schedule", {
      metadata: { total },
    });
  } catch {
    /* ignore */
  }
}

/**
 * Paket WhatsApp'a gönderildi → Ads Manager "İnternet Sitesi Alışveriş".
 * CAPI sunucuda; browser fbq aynı purchase_<leadId> (mirror kapalı).
 */
export function pixelPurchase(
  leadId: string,
  total: number,
  customer?: PixelCustomer,
  opts?: { mirrorCapi?: boolean }
): void {
  const eventId = reservationPurchaseEventId(leadId);
  const key = `purchase_${eventId}`;
  if (hasFiredOnce(key)) return;
  markFiredOnce(key);
  try {
    trackMetaEvent(
      "Purchase",
      {
        content_name: "whatsapp_package_send",
        value: total,
        currency: "TRY",
        order_id: leadId,
      },
      customerWithExternal(customer),
      { eventId, mirrorCapi: opts?.mirrorCapi ?? false }
    );
  } catch {
    /* ignore */
  }
}

/** @deprecated Lead Meta'ya gönderilmez (Schedule + Purchase kullan). */
export function pixelLead(_total: number, _customer?: PixelCustomer): void {
  // no-op — legacy çağrılar Meta Lead üretmesin
}

/** Gerçek WhatsApp tıklaması — custom + CAPI. Lead/Contact yok. */
export function pixelWhatsAppClick(
  contentName: string,
  total?: number,
  customer?: PixelCustomer
): void {
  const eventId = `whatsapp_${sid()}_${Date.now()}`;
  try {
    trackCustomEvent(
      "WhatsAppClick",
      {
        content_name: contentName,
        ...(total != null ? { value: total, currency: "TRY" } : {}),
      },
      customerWithExternal(customer),
      { eventId, mirrorCapi: true }
    );
  } catch {
    /* fbq/CAPI hatası iç analytics'i durdurmasın */
  }
  try {
    trackFunnelEvent("WhatsAppClick", {
      metadata: {
        content_name: contentName.slice(0, 80),
        ...(total != null ? { total } : {}),
      },
    });
  } catch {
    /* ignore */
  }
}

/** @deprecated Contact kaldırıldı — yalnızca WhatsAppClick */
export function pixelLockDate(
  total: number,
  customer?: PixelCustomer
): void {
  pixelWhatsAppClick("tarihimi_kilitle", total, customer);
}

/** İç journey — Meta'ya GİTMEZ */
export function pixelStepView(step: number): void {
  track("package_step_view", { step });
}
