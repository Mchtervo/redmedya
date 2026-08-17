import { NextRequest, NextResponse } from "next/server";
import { recordHit } from "@/lib/track/visits-store";

/**
 * Anonim sayfa açılış sayacı — ÇEREZ ONAYI GEREKTİRMEZ.
 *
 * Neden KVKK'ya takılmaz: burada kişisel veri işlenmiyor. session_id, çerez,
 * IP, user-agent, referrer — hiçbiri saklanmıyor. Sadece günlük TOPLAM sayaç
 * artırılıyor. Kişiye ait bir kayıt oluşmuyor, geriye dönük kimse ayırt
 * edilemiyor. Zaman çizelgesi first-party collect ile (PII yok) tutulur.
 */

export const dynamic = "force-dynamic";

/** Basit bot elemesi — panel gerçek trafiği göstersin diye */
const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pingdom|uptime|curl|wget|python-requests|axios|monitor/i;

export async function POST(request: NextRequest) {
  try {
    const ua = request.headers.get("user-agent") ?? "";
    if (!ua || BOT_RE.test(ua)) {
      return NextResponse.json({ ok: true, skipped: "bot" });
    }

    const body = (await request.json().catch(() => ({}))) as {
      path?: string;
      utm_source?: string;
      utm_campaign?: string;
    };

    // Yol normalize: sorgu dizesi ve fragment atılır (PII sızmasın)
    const rawPath = typeof body.path === "string" ? body.path : "";
    const cleanPath = rawPath.split(/[?#]/)[0].slice(0, 120) || "/";

    // Admin trafiği sayaca girmesin
    if (cleanPath.startsWith("/admin")) {
      return NextResponse.json({ ok: true, skipped: "admin" });
    }

    await recordHit({
      path: cleanPath,
      utmSource:
        typeof body.utm_source === "string" ? body.utm_source.slice(0, 60) : undefined,
      utmCampaign:
        typeof body.utm_campaign === "string"
          ? body.utm_campaign.slice(0, 60)
          : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
