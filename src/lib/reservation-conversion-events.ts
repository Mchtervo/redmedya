import type { ReservationRecord } from "@/types/reservations";
import type { LeadRecord } from "@/types/site-settings";
import { ga4ClientIdFromLead, sendGa4ServerEvent } from "@/lib/ga4-server";

export type ConversionRequestContext = {
  clientIp?: string;
  clientUserAgent?: string;
};

/**
 * Admin teklif onayı → yalnızca GA4 (sunucu).
 *
 * Meta'ya Purchase / Lead / AddToCart / ReservationApproved GÖNDERİLMEZ.
 * Online ödeme yok; funnel final conversion = Schedule (public lead kaydı).
 */
export async function fireReservationApprovedConversions(
  reservation: ReservationRecord,
  lead: LeadRecord | null,
  _ctx?: ConversionRequestContext
): Promise<void> {
  const value = Math.max(0, reservation.total);
  const gaClientId = ga4ClientIdFromLead(
    reservation.leadId,
    lead?.sessionId
  );

  const tasks: Promise<unknown>[] = [
    sendGa4ServerEvent("reservation_approved", {
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
    }),
  ];

  const results = await Promise.allSettled(tasks);
  if (process.env.NODE_ENV === "development") {
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length) {
      console.debug("[conversion-events]", failed);
    }
  }
}
