/**
 * Sesli asistan aracı: "Bu tarih müsait mi?"
 * GET ?date=YYYY-MM-DD  (Authorization: Bearer <AI anahtarı>)
 * → { ok, available, reason, cevap, alternatives, month }
 * Takvimdeki rezervasyonlar + elle kapatılan günler + aylık kontenjan birlikte değerlendirilir.
 * Asistan çifte tarih hakkında bir şey söylemeden ÖNCE bunu çağırır.
 */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { checkDate } from "@/lib/ai-couples/capacity";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const date = new URL(request.url).searchParams.get("date") ?? "";
  const r = await checkDate(date);
  if (!r) {
    return NextResponse.json(
      { ok: false, available: false, cevap: "Tarihi anlayamadım; gün, ay ve yılı tekrar teyit edin." },
      { status: 400 }
    );
  }
  return NextResponse.json({
    ok: true,
    available: r.available,
    reason: r.reason,
    cevap: r.cevap,
    dateLabel: r.dateLabel,
    alternatives: r.alternatives,
    month: { label: r.month.monthLabel, remaining: r.month.remaining, total: r.month.total },
  });
}
