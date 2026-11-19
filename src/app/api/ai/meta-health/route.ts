/**
 * n8n sağlık kontrolü: Meta anahtarının veri erişimi ne zaman doluyor?
 * GET (Bearer AI anahtarı) → { ok, daysLeft, expiresAt }
 * Doldu ya da 14 günden az kaldıysa n8n Telegram'a uyarır (yenilemek için Facebook ile tekrar izin vermek yeterli).
 */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { readIntegrations } from "@/lib/ai-couples/integrations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const { metaAdsToken } = await readIntegrations();
  if (!metaAdsToken) return NextResponse.json({ ok: false, error: "Meta anahtarı yok" });
  const r = await fetch(
    `https://graph.facebook.com/v21.0/debug_token?input_token=${encodeURIComponent(metaAdsToken)}&access_token=${encodeURIComponent(metaAdsToken)}`,
    { signal: AbortSignal.timeout(20_000) }
  ).catch(() => null);
  const j = (await r?.json().catch(() => ({}))) as { data?: { is_valid?: boolean; expires_at?: number; data_access_expires_at?: number } };
  const d = j.data;
  if (!d) return NextResponse.json({ ok: false, error: "Meta'ya ulaşılamadı" });
  const ends = [d.expires_at, d.data_access_expires_at].filter((x): x is number => typeof x === "number" && x > 0);
  const soonest = ends.length ? Math.min(...ends) * 1000 : null;
  return NextResponse.json({
    ok: true,
    valid: d.is_valid !== false,
    expiresAt: soonest ? new Date(soonest).toISOString() : null,
    daysLeft: soonest ? Math.floor((soonest - Date.now()) / 86_400_000) : null,
  });
}
