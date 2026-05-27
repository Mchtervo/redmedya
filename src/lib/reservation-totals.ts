import type { LeadLineDetail } from "@/types/reservations";

export function sumActiveServices(services: LeadLineDetail[]): number {
  return services
    .filter((s) => !s.excluded && s.label.trim())
    .reduce((sum, s) => sum + (s.isGift ? 0 : Number(s.price) || 0), 0);
}

export function computePayableTotal(
  subtotal: number,
  bundleDiscount: number,
  couponDiscount: number
): number {
  return Math.max(0, subtotal - bundleDiscount - couponDiscount);
}

/** Paket toplamı girildiğinde ara toplamdan indirim tutarını çıkarır */
export function inferBundleDiscountFromTotal(
  subtotal: number,
  total: number,
  couponDiscount: number
): number {
  return Math.max(0, subtotal - total - couponDiscount);
}

export function bundleDiscountPercent(
  subtotal: number,
  bundleDiscount: number
): number | null {
  if (subtotal <= 0 || bundleDiscount <= 0) return null;
  return Math.round((bundleDiscount / subtotal) * 1000) / 10;
}

export function bundleDiscountFromPercent(
  subtotal: number,
  percent: number
): number {
  if (subtotal <= 0 || percent <= 0) return 0;
  return Math.round((subtotal * percent) / 100);
}
