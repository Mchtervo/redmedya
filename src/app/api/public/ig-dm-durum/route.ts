/**
 * Instagram DM bağlantısının durumu (gizli değer DÖNMEZ; yalnız evet/hayır ve izin adları).
 * ?abone=1 → sayfayı uygulamanın mesaj bildirimlerine abone eder (tekrar çağrılması zararsız).
 */
import { NextResponse } from "next/server";
import { IG_DM_MOD, IG_DM_TEST, META_PAGE_ID, sayfaAnahtariAl } from "@/lib/instagram-dm";
import { readIntegrations } from "@/lib/ai-couples/integrations";

export const dynamic = "force-dynamic";
const G = "https://graph.facebook.com/v21.0";

export async function GET(request: Request) {
  const { metaAdsToken } = await readIntegrations();
  const anahtar = await sayfaAnahtariAl();
  const out: Record<string, unknown> = { mod: IG_DM_MOD, testKullaniciSayisi: IG_DM_TEST.length, kayitliMetaAnahtari: Boolean(metaAdsToken), sayfaAnahtari: Boolean(anahtar) };
  if (anahtar) {
    const dbg = (await fetch(`${G}/debug_token?input_token=${encodeURIComponent(anahtar)}&access_token=${encodeURIComponent(anahtar)}`).then((r) => r.json()).catch(() => null)) as { data?: { type?: string; scopes?: string[]; is_valid?: boolean; expires_at?: number; profile_id?: string } } | null;
    out.anahtarTuru = dbg?.data?.type;
    out.gecerli = dbg?.data?.is_valid;
    out.bitis = dbg?.data?.expires_at ? new Date(dbg.data.expires_at * 1000).toISOString() : "süresiz";
    out.izinler = dbg?.data?.scopes;
    out.dmIzni = Boolean(dbg?.data?.scopes?.includes("instagram_manage_messages"));
    if (new URL(request.url).searchParams.get("abone") === "1") {
      out.aboneOl = await fetch(`${G}/${META_PAGE_ID}/subscribed_apps?subscribed_fields=messages&access_token=${encodeURIComponent(anahtar)}`, { method: "POST" }).then((r) => r.json()).catch((e) => String(e));
    }
    out.sayfaAbonelikleri = await fetch(`${G}/${META_PAGE_ID}/subscribed_apps?access_token=${encodeURIComponent(anahtar)}`).then((r) => r.json()).then((j: { data?: { name?: string; subscribed_fields?: string[] }[] }) => j.data?.map((a) => `${a.name}: ${(a.subscribed_fields ?? []).join(",")}`)).catch(() => null);
  }
  return NextResponse.json(out);
}
