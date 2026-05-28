import { NextResponse } from "next/server";

/**
 * Public rezervasyon detayı kapatıldı — müşteri PII ve ödeme verilerini
 * sızdırıyordu. Müşteriye paylaşım için ileride token bazlı bir uç noktayla
 * geri eklenebilir (örn. /api/public/reservations/[id]/[token]).
 */
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
