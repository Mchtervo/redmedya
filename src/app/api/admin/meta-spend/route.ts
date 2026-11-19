/**
 * Admin: Meta reklam harcaması (kampanya + reklam bazında) — Satış Analizi sayfası kullanır.
 * GET ?since=YYYY-MM-DD&until=YYYY-MM-DD  (varsayılan: son 90 gün)
 * Anahtar sunucuda (DATA_DIR/ai-integrations.json); tarayıcıya gitmez. 10 dk önbellek.
 */
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { readIntegrations } from "@/lib/ai-couples/integrations";

export const dynamic = "force-dynamic";

type Row = { campaign: string; ad: string; spend: number; impressions: number; clicks: number; leads: number; messages: number };
const cache = new Map<string, { at: number; data: unknown }>();

const DAY = /^\d{4}-\d{2}-\d{2}$/;

function actionValue(actions: { action_type: string; value: string }[] | undefined, types: string[]): number {
  return (actions ?? []).filter((a) => types.includes(a.action_type)).reduce((s, a) => s + Number(a.value || 0), 0);
}

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const { metaAdsToken, metaAdAccountId } = await readIntegrations();
  if (!metaAdsToken || !metaAdAccountId) return NextResponse.json({ ok: false, error: "Reklam hesabı bağlı değil" }, { status: 503 });

  const url = new URL(request.url);
  const ist = (ms: number) => new Date(ms).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
  const today = ist(Date.now());
  const since = DAY.test(url.searchParams.get("since") ?? "") ? url.searchParams.get("since")! : ist(Date.now() - 90 * 86_400_000);
  const until = DAY.test(url.searchParams.get("until") ?? "") ? url.searchParams.get("until")! : today;
  // lifetime=1 → kampanyaların BAŞINDAN BERİ toplam harcaması (rezervasyon başına maliyet için)
  const lifetime = url.searchParams.get("lifetime") === "1";
  const key = lifetime ? "lifetime" : `${since}_${until}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 10 * 60_000) return NextResponse.json(hit.data);

  const params = new URLSearchParams({
    level: lifetime ? "campaign" : "ad",
    fields: lifetime ? "campaign_name,spend,impressions,clicks,actions" : "campaign_name,ad_name,spend,impressions,clicks,actions",
    ...(lifetime ? { date_preset: "maximum" } : { time_range: JSON.stringify({ since, until }) }),
    limit: "500",
    access_token: metaAdsToken,
  });
  const res = await fetch(`https://graph.facebook.com/v21.0/${metaAdAccountId}/insights?${params}`, { signal: AbortSignal.timeout(30_000) }).catch(() => null);
  const j = (await res?.json().catch(() => ({}))) as {
    data?: { campaign_name: string; ad_name: string; spend: string; impressions: string; clicks: string; actions?: { action_type: string; value: string }[] }[];
    error?: { message?: string; code?: number };
  };
  if (!res?.ok || !j.data) {
    const msg = j?.error?.code === 190 ? "Meta anahtarı geçersiz — yeniden bağlanmalı" : j?.error?.message ?? "Meta'ya ulaşılamadı";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
  const rows: Row[] = j.data.map((d) => ({
    campaign: d.campaign_name,
    ad: d.ad_name ?? "",
    spend: Number(d.spend || 0),
    impressions: Number(d.impressions || 0),
    clicks: Number(d.clicks || 0),
    // Aynı form başvurusu birden fazla türde dönebilir → tek tür say (önce "lead")
    leads: actionValue(d.actions, ["lead"]) || actionValue(d.actions, ["onsite_conversion.lead_grouped"]) || actionValue(d.actions, ["leadgen_grouped"]),
    messages: actionValue(d.actions, ["onsite_conversion.messaging_conversation_started_7d"]),
  }));
  const data = { ok: true, since: lifetime ? "başlangıç" : since, until, currency: "TRY", rows };
  cache.set(key, { at: Date.now(), data });
  return NextResponse.json(data);
}
