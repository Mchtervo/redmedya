/**
 * Panel: WhatsApp bağlantı durumu. Bağlı değilse Evolution'dan yeni QR ister (telefondan okutulur).
 * GET → { state: "open" | "close" | "connecting" | ..., qr?: dataURL, pairingCode? }
 */
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { readIntegrations } from "@/lib/ai-couples/integrations";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const { evolutionUrl, evolutionKey, evolutionInstance } = await readIntegrations();
  if (!evolutionUrl || !evolutionKey) return NextResponse.json({ ok: false, error: "WhatsApp bağlantı ayarı yok" }, { status: 503 });
  const base = evolutionUrl.replace(/\/$/, "");
  const inst = encodeURIComponent(evolutionInstance || "redmedia");
  const H = { apikey: evolutionKey };
  const st = (await fetch(`${base}/instance/connectionState/${inst}`, { headers: H, cache: "no-store", signal: AbortSignal.timeout(10000) }).then((r) => r.json()).catch(() => null)) as { instance?: { state?: string } } | null;
  const state = st?.instance?.state ?? "unknown";
  if (state === "open") return NextResponse.json({ ok: true, state });
  const c = (await fetch(`${base}/instance/connect/${inst}`, { headers: H, cache: "no-store", signal: AbortSignal.timeout(15000) }).then((r) => r.json()).catch(() => null)) as { base64?: string; code?: string; pairingCode?: string } | null;
  const qr = c?.base64 ? (c.base64.startsWith("data:") ? c.base64 : `data:image/png;base64,${c.base64}`) : undefined;
  return NextResponse.json({ ok: true, state, qr, pairingCode: c?.pairingCode ?? null });
}
