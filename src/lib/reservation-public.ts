import type { PublicWeddingPreview } from "@/types/reservations";
import type { ReservationRecord } from "@/types/reservations";

export function reservationToPublicPreview(
  r: ReservationRecord
): PublicWeddingPreview | null {
  if (!r.customer.weddingDate?.trim()) return null;
  const couple = [r.customer.firstName, r.customer.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (!couple) return null;
  const d = new Date(r.customer.weddingDate);
  if (Number.isNaN(d.getTime())) return null;
  const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return {
    id: r.id,
    couple,
    weddingDate: r.customer.weddingDate,
    monthKey,
    total: r.total,
    depositAmount: r.depositAmount,
    remainingAmount: r.remainingAmount,
    serviceCount: r.services.length,
  };
}

export function sortPublicWeddings(
  items: PublicWeddingPreview[]
): PublicWeddingPreview[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return [...items].sort((a, b) => {
    const da = new Date(a.weddingDate).getTime();
    const db = new Date(b.weddingDate).getTime();
    const aFuture = da >= now.getTime();
    const bFuture = db >= now.getTime();
    if (aFuture && !bFuture) return -1;
    if (!aFuture && bFuture) return 1;
    return da - db;
  });
}

export function groupByMonth(
  items: PublicWeddingPreview[]
): Map<string, PublicWeddingPreview[]> {
  const map = new Map<string, PublicWeddingPreview[]>();
  for (const item of items) {
    const list = map.get(item.monthKey) ?? [];
    list.push(item);
    map.set(item.monthKey, list);
  }
  return map;
}

export function formatMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  return new Date(y, m - 1, 1).toLocaleDateString("tr-TR", {
    month: "long",
    year: "numeric",
  });
}
