import { NextRequest, NextResponse } from "next/server";
import { getReservationById } from "@/lib/reservations-store";
import { formatWeddingDateDisplay } from "@/lib/date-format";

/** Halka açık özet — telefon yok */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const r = await getReservationById(id);
  if (!r) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  return NextResponse.json({
    id: r.id,
    couple: [r.customer.firstName, r.customer.lastName].filter(Boolean).join(" "),
    weddingDate: r.customer.weddingDate,
    weddingDateLabel: formatWeddingDateDisplay(r.customer.weddingDate),
    services: r.services
      .filter((s) => !s.excluded)
      .map((s) => ({
        label: s.label,
        price: s.price,
        listPrice: s.listPrice,
        isGift: s.isGift,
      })),
    subtotal: r.subtotal,
    bundleDiscount: r.bundleDiscount,
    couponDiscount: r.couponDiscount,
    total: r.total,
    depositAmount: r.depositAmount,
    remainingAmount: r.remainingAmount,
  });
}
