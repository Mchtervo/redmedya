/**
 * Admin: sesli asistan görüşmesinin ses kaydını dinle (ElevenLabs'ten bir kez indirilip DATA_DIR'de saklanır).
 * GET /api/admin/ai-recording/conv_xxx  → audio/mpeg
 * Range (bytes=…) desteklenir: tarayıcı süreyi bilir, ileri/geri sarılabilir.
 * Sadece admin oturumu; ElevenLabs anahtarı tarayıcıya hiç gitmez.
 */
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { requireAdminSession } from "@/lib/admin-api";
import { readIntegrations } from "@/lib/ai-couples/integrations";
import { dataPath } from "@/lib/data-dir";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ conv: string }> };

async function loadAudio(conv: string): Promise<Buffer | { status: number; text: string }> {
  const file = dataPath(path.join("ai-recordings", `${conv}.mp3`));
  try {
    return await readFile(file);
  } catch {
    /* önbellekte yok → indir */
  }
  const { elevenlabsKey } = await readIntegrations();
  if (!elevenlabsKey) return { status: 503, text: "Ses anahtarı ayarlı değil" };
  const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conv}/audio`, {
    headers: { "xi-api-key": elevenlabsKey },
    signal: AbortSignal.timeout(90_000),
  }).catch(() => null);
  if (!res || !res.ok) return { status: res?.status === 404 ? 404 : 502, text: "Kayıt henüz hazır değil veya alınamadı" };
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 1000) {
    await mkdir(path.dirname(file), { recursive: true }).catch(() => undefined);
    await writeFile(file, buf).catch(() => undefined);
  }
  return buf;
}

export async function GET(request: Request, { params }: Ctx) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const conv = (await params).conv;
  if (!/^conv_[a-z0-9]{10,60}$/i.test(conv)) return new Response("Geçersiz kayıt", { status: 400 });

  const audio = await loadAudio(conv);
  if (!Buffer.isBuffer(audio)) return new Response(audio.text, { status: audio.status });

  const size = audio.length;
  const base = { "Content-Type": "audio/mpeg", "Accept-Ranges": "bytes", "Cache-Control": "private, max-age=86400" };
  const range = request.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    let start = range[1] ? Number(range[1]) : 0;
    let end = range[2] ? Number(range[2]) : size - 1;
    if (!range[1] && range[2]) {
      // "bytes=-500" → son 500 bayt
      start = Math.max(0, size - Number(range[2]));
      end = size - 1;
    }
    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { ...base, "Content-Range": `bytes */${size}` } });
    }
    end = Math.min(end, size - 1);
    const chunk = audio.subarray(start, end + 1);
    return new Response(new Uint8Array(chunk), {
      status: 206,
      headers: { ...base, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(chunk.length) },
    });
  }
  return new Response(new Uint8Array(audio), { headers: { ...base, "Content-Length": String(size) } });
}
