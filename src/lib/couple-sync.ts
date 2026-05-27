import {
  deleteReservation,
  getReservationById,
  updateReservation,
} from "@/lib/reservations-store";
import {
  getRehberById,
  removeRehberByReservationId,
  updateRehberContact,
  upsertFromReservation,
} from "@/lib/rehber-store";
import { clearReservationFromLeads, updateLead } from "@/lib/leads-store";
import { normalizeCustomerName } from "@/lib/customer-name";
import type { RehberContact } from "@/types/reservations";
import type { ReservationRecord } from "@/types/reservations";

function withNormalizedCustomer(
  patch: Partial<ReservationRecord>
): Partial<ReservationRecord> {
  if (!patch.customer) return patch;
  return { ...patch, customer: normalizeCustomerName(patch.customer) };
}

export async function patchReservationAndSyncRehber(
  id: string,
  patch: Partial<ReservationRecord>
): Promise<ReservationRecord | null> {
  const updated = await updateReservation(id, withNormalizedCustomer(patch));
  if (updated) {
    await upsertFromReservation(updated);
    if (updated.leadId && !updated.leadId.startsWith("manual-")) {
      await updateLead(updated.leadId, {
        customer: updated.customer,
        lineDetails: updated.services,
      });
    }
  }
  return updated;
}

export async function patchRehberAndSyncReservation(
  id: string,
  patch: Partial<RehberContact>
): Promise<RehberContact | null> {
  const updated = await updateRehberContact(id, patch);
  if (!updated?.reservationId) return updated;

  await updateReservation(updated.reservationId, {
    customer: {
      firstName: updated.firstName,
      lastName: updated.lastName,
      phone: updated.phone,
      weddingDate: updated.weddingDate ?? "",
      note: updated.note ?? "",
    },
    shootingLocation: updated.shootingLocation,
    shootingNote: updated.shootingNote,
  });

  const res = await getReservationById(updated.reservationId);
  if (res) await upsertFromReservation(res);

  return updated;
}

export async function deleteReservationAndSync(
  id: string
): Promise<boolean> {
  const ok = await deleteReservation(id);
  if (!ok) return false;
  await removeRehberByReservationId(id);
  await clearReservationFromLeads(id);
  return true;
}

export { getRehberById };
