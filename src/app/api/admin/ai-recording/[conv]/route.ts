/**
 * Admin: sesli asistan görüşmesinin ses kaydını dinle (ElevenLabs'ten aktarılır).
 * GET /api/admin/ai-recording/conv_xxx  → audio/mpeg
 * Sadece admin oturumu; ElevenLabs anahtarı tarayıcıya hiç gitmez.
 */
import { requireAdminSession } from "@/lib/admin-api";
import { readIntegrations } from "@/lib/ai-couples/integrations";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ conv: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const conv = (await params).conv;
  if (!/^conv_[a-z0-9]{10,60}$/i.test(conv)) return new Response("Geçersiz kayıt", { status: 400 });
  const { elevenlabsKey } = await readIntegrations();
  if (!elevenlabsKey) return new Response("Ses anahtarı ayarlı değil", { status: 503 });
  const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conv}/audio`, {
    headers: { "xi-api-key": elevenlabsKey },
    signal: AbortSignal.timeout(60_000),
  }).catch(() => null);
  if (!res || !res.ok || !res.body) return new Response("Kayıt alınamadı", { status: res?.status === 404 ? 404 : 502 });
  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "audio/mpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
