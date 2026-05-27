import type { ReservationRecord } from "@/types/reservations";

export function hasCustomerPhone(phone?: string | null): boolean {
  return Boolean(phone?.trim());
}

export function reservationMissingPhone(r: ReservationRecord): boolean {
  return !hasCustomerPhone(r.customer.phone);
}

export function reservationsMissingPhone(
  list: ReservationRecord[]
): ReservationRecord[] {
  return list.filter(reservationMissingPhone);
}
