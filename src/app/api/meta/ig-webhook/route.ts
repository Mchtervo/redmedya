/**
 * Meta (Instagram) webhook: DM'ler buraya gelir.
 * GET  → Meta'nın doğrulaması (hub.verify_token = metaVerifyToken)
 * POST → X-Hub-Signature-256 imzası uygulama gizli anahtarıyla doğrulanır; mesajlar Instagram asistanına iletilir.
 * Meta'ya her zaman hızlı 200 döneriz (cevap arka planda üretilir).
 */
import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { readIntegrations } from "@/lib/ai-couples/integrations";
import { onIgEcho, onIgInbound } from "@/lib/ai-couples/ig-agent";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const u = new URL(request.url);
  const { metaVerifyToken } = await readIntegrations();
  if (u.searchParams.get("hub.mode") === "subscribe" && metaVerifyToken && u.searchParams.get("hub.verify_token") === metaVerifyToken) {
    return new NextResponse(u.searchParams.get("hub.challenge") ?? "", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return new NextResponse("forbidden", { status: 403 });
}

type IgEvent = {
  sender?: { id?: string };
  recipient?: { id?: string };
  timestamp?: number;
  message?: { mid?: string; text?: string; is_echo?: boolean; app_id?: number | string; is_deleted?: boolean; attachments?: { type?: string }[] };
};

export async function POST(request: Request) {
  const raw = await request.text();
  const { metaAppSecret } = await readIntegrations();
  const sig = request.headers.get("x-hub-signature-256") ?? "";
  if (!metaAppSecret || !sig.startsWith("sha256=")) return new NextResponse("no", { status: 401 });
  const expected = createHmac("sha256", metaAppSecret).update(raw).digest("hex");
  const got = sig.slice(7);
  if (got.length !== expected.length || !timingSafeEqual(Buffer.from(got), Buffer.from(expected))) return new NextResponse("bad signature", { status: 401 });

  let body: { object?: string; entry?: { id?: string; messaging?: IgEvent[] }[] } = {};
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true });
  }
  if (body.object !== "instagram" && body.object !== "page") return NextResponse.json({ ok: true });
  for (const entry of body.entry ?? []) {
    for (const ev of entry.messaging ?? []) {
      const m = ev.message;
      if (!m || m.is_deleted) continue;
      const at = new Date(ev.timestamp || Date.now()).toISOString();
      const text = m.text?.trim() || (m.attachments?.length ? `[${m.attachments[0]?.type ?? "ek"}]` : "");
      if (!text) continue;
      if (m.is_echo) {
        // sayfadan giden: alıcı müşteri
        if (ev.recipient?.id) void onIgEcho(ev.recipient.id, text, at, m.app_id ? String(m.app_id) : undefined).catch(() => undefined);
      } else if (ev.sender?.id) {
        void onIgInbound(ev.sender.id, text, at).catch((e) => console.error("[ig-webhook]", e));
      }
    }
  }
  return NextResponse.json({ ok: true });
}
