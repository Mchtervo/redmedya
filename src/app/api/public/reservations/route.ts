import { NextResponse } from "next/server";

/**
 * Rezervasyon listesi public değildir — müşteri ad/soyad ve ödeme bilgilerini
 * sızdırmamak için herkese kapalı. Admin paneli admin API'sini kullanır.
 */
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
