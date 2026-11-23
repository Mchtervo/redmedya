/**
 * WhatsApp'ta gönderilen / gelen BELGE (PDF) ve FOTOĞRAFLARI okur.
 * Amaç: asistan "fiyat listesi PDF'i gitti", "müşteri rakip teklifin ekran görüntüsünü attı" gibi şeyleri
 * yazı mesajı gibi bilsin; içeriği bilmediği için "fiyat ileteyim mi" diye saçmalamasın.
 *
 * Dosya Evolution'dan indirilir, Claude bir kez okur, özet DATA_DIR/ai-wa-media.json'da saklanır
 * (aynı dosya tekrar gelirse ücretsiz ve anında).
 */
import { createHash } from "crypto";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import { readIntegrations } from "@/lib/ai-couples/integrations";

const FILE = dataPath("ai-wa-media.json");
const MODEL = "claude-sonnet-5-5";
type Cache = Record<string, { at: string; name: string; summary: string }>;

export type WaMediaMeta = { kind: "document" | "image"; fileName?: string; mime?: string; size?: number };

export { docNote } from "@/lib/ai-couples/doc-note";

async function readCache(): Promise<Cache> {
  try {
    return JSON.parse(await readFile(FILE, "utf-8")) as Cache;
  } catch {
    return {};
  }
}
let chain: Promise<unknown> = Promise.resolve();
function saveCache(key: string, v: Cache[string]): Promise<void> {
  const run = chain.then(async () => {
    const c = await readCache();
    c[key] = v;
    const keys = Object.keys(c);
    if (keys.length > 400) for (const k of keys.slice(0, keys.length - 400)) delete c[k];
    await mkdir(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(c, null, 1), "utf-8");
    await rename(tmp, FILE);
  });
  chain = run.catch(() => undefined);
  return run;
}

/** Evolution'dan dosyayı indir (base64) */
async function download(waId: string): Promise<{ base64: string; mime: string } | null> {
  const { evolutionUrl, evolutionKey, evolutionInstance } = await readIntegrations();
  if (!evolutionUrl || !evolutionKey) return null;
  const res = await fetch(`${evolutionUrl.replace(/\/$/, "")}/chat/getBase64FromMediaMessage/${encodeURIComponent(evolutionInstance || "redmedia")}`, {
    method: "POST",
    headers: { apikey: evolutionKey, "Content-Type": "application/json" },
    body: JSON.stringify({ message: { key: { id: waId } }, convertToMp4: false }),
    signal: AbortSignal.timeout(25_000),
  }).catch(() => null);
  if (!res?.ok) return null;
  const j = (await res.json().catch(() => null)) as { base64?: string; mimetype?: string } | null;
  if (!j?.base64) return null;
  return { base64: j.base64, mime: String(j.mimetype || "").split(";")[0].trim() };
}

/**
 * Dosyanın içeriğini 1-3 cümleyle özetler (fiyatlar, paketler, kimin teklifi). Okunamazsa null.
 * fromMe: dosyayı biz mi gönderdik (true) müşteri mi (false).
 */
export async function describeWaMedia(waId: string, meta: WaMediaMeta, fromMe: boolean): Promise<string | null> {
  const nameKey = meta.fileName && meta.size ? `n:${meta.fileName}|${meta.size}` : "";
  const cache = await readCache();
  if (nameKey && cache[nameKey]) return cache[nameKey].summary;
  if (meta.kind === "document" && meta.mime && !/pdf/i.test(meta.mime)) return null; // sadece PDF okunur
  if (meta.size && meta.size > 9_000_000) return null;

  const file = await download(waId);
  if (!file || file.base64.length > 12_500_000) return null;
  const sha = `s:${createHash("sha256").update(file.base64).digest("hex").slice(0, 32)}`;
  if (cache[sha]) {
    if (nameKey) await saveCache(nameKey, cache[sha]).catch(() => undefined);
    return cache[sha].summary;
  }
  const mime = file.mime || meta.mime || "";
  const isPdf = /pdf/i.test(mime) || (meta.kind === "document" && !mime);
  const isImage = /^image\/(jpeg|png|webp|gif)$/i.test(mime);
  if (!isPdf && !isImage) return null;

  const { anthropicKey } = await readIntegrations();
  if (!anthropicKey) return null;
  const block = isPdf
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: file.base64 } }
    : { type: "image", source: { type: "base64", media_type: mime.toLowerCase(), data: file.base64 } };
  const who = fromMe ? "Bu dosyayı BİZ (Red Media) müşteriye gönderdik." : "Bu dosyayı MÜŞTERİ bize gönderdi.";
  const task = `RED MEDIA, Ankara'da düğün fotoğrafı ve videosu çeken bir stüdyo. Bir müşteriyle WhatsApp yazışmasında bu ${isPdf ? "belge" : "fotoğraf"} paylaşıldı. ${who}${meta.fileName ? ` Dosya adı: ${meta.fileName}.` : ""}
Satış temsilcisinin yazışmayı hatırlaması için içeriği Türkçe, EN FAZLA 550 karakterle, tek paragraf yaz:
- Ne olduğu (fiyat listesi / paket teklifi / başka firmanın teklifi / dekont / ekran görüntüsü / düğün yeri, kıyafet, örnek poz fotoğrafı…).
- İçindeki TÜM paket adları, fiyatlar, tutarlar, tarihler, firma adı — rakamları aynen yaz.
- Dekont / ödeme ise: tutar, tarih, gönderen ad.
Yorum, tavsiye, selamlama yazma; görmediğin şeyi uydurma. Okunamıyorsa sadece "okunamadı" yaz.`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 1500, output_config: { effort: "low" }, messages: [{ role: "user", content: [block, { type: "text", text: task }] }] }),
    signal: AbortSignal.timeout(50_000),
  }).catch(() => null);
  if (!res?.ok) return null;
  const j = (await res.json().catch(() => null)) as { content?: { type: string; text?: string }[] } | null;
  const summary = (j?.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join(" ").replace(/\s+/g, " ").trim().slice(0, 700);
  if (!summary || /^okunamad[ıi]\.?$/i.test(summary)) return null;
  const rec = { at: new Date().toISOString(), name: meta.fileName ?? (isPdf ? "belge" : "fotoğraf"), summary };
  await saveCache(sha, rec).catch(() => undefined);
  if (nameKey) await saveCache(nameKey, rec).catch(() => undefined);
  return summary;
}
