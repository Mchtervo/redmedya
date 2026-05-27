import { appendReservation } from "@/lib/reservations-store";
import { upsertFromReservation } from "@/lib/rehber-store";
import { getLeadById, updateLead } from "@/lib/leads-store";
import { markDraftWhatsAppClicked } from "@/lib/package-drafts-store";
import { fireReservationApprovedConversions } from "@/lib/reservation-conversion-events";
import type { ConversionRequestContext } from "@/lib/reservation-conversion-events";
import type { LeadRecord } from "@/types/site-settings";
import type { LeadLineDetail } from "@/types/reservations";
import type { ReservationRecord } from "@/types/reservations";
import type { CustomerInfo } from "@/stores/package-store";
import { normalizeCustomerName } from "@/lib/customer-name";

export type CreateReservationInput = {
  customer: CustomerInfo;
  services: LeadLineDetail[];
  subtotal: number;
  bundleDiscount: number;
  couponDiscount: number;
  total: number;
  depositAmount: number;
  shootingLocation?: string;
  shootingNote?: string;
  studioOwned?: boolean;
  couponCode?: string;
  leadId?: string;
  draftSessionId?: string;
  source?: "lead" | "manual" | "draft";
  /** Admin onay API — Meta CAPI / GA4 eşleştirme */
  conversionContext?: ConversionRequestContext;
};

export async function createReservation(
  input: CreateReservationInput
): Promise<ReservationRecord> {
  const deposit = Math.max(0, Number(input.depositAmount) || 0);
  const total = Math.max(0, Number(input.total) || 0);
  const remaining = Math.max(0, total - deposit);

  const leadId =
    input.leadId ??
    (input.source === "manual"
      ? `manual-${Date.now()}`
      : input.draftSessionId
        ? `draft-${input.draftSessionId}`
        : `manual-${Date.now()}`);

  const customer = normalizeCustomerName(input.customer);

  const reservation: ReservationRecord = {
    id: `res-${Date.now()}`,
    leadId,
    createdAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    customer,
    services: input.services,
    subtotal: Number(input.subtotal) || 0,
    bundleDiscount: Number(input.bundleDiscount) || 0,
    couponDiscount: Number(input.couponDiscount) || 0,
    couponCode: input.couponCode,
    total,
    depositAmount: deposit,
    remainingAmount: remaining,
    note: customer.note,
    shootingLocation: input.shootingLocation,
    shootingNote: input.shootingNote,
    studioOwned: Boolean(input.studioOwned),
  };

  await appendReservation(reservation);
  await upsertFromReservation(reservation);

  let leadForConversion: LeadRecord | null = null;
  if (input.leadId) {
    leadForConversion = (await getLeadById(input.leadId)) ?? null;
    await updateLead(input.leadId, {
      status: "approved",
      reservationId: reservation.id,
      lineDetails: input.services,
    });
    void fireReservationApprovedConversions(
      reservation,
      leadForConversion,
      input.conversionContext
    );
  }

  if (input.draftSessionId) {
    await markDraftWhatsAppClicked(input.draftSessionId);
  }

  return reservation;
}
