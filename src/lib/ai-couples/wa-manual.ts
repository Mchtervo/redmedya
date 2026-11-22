/**
 * WhatsApp kısıtlıyken (manuel mod): sistemin müşteriye atacağı her WhatsApp mesajı Telegram'a kopyala-gönder olarak gelir.
 * Başlık (isim, numara, ne mesajı, tek dokunuşla wa.me linki) + ayrı mesajda sadece metin. Aynı mesaj 24 saatte bir kez.
 */
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import { tgApi, tgChatId, waLink } from "@/lib/ai-couples/wa-drafts";
import type { AiCouple } from "@/types/ai-couples";

const FILE = dataPath("ai-wa-manual.json");
const PDF_URL = "https://redmediadugun.com/redmedia-2027-fiyat-listesi.pdf";
const norm = (t: string) => t.toLocaleLowerCase("tr-TR").replace(/[^\p{L}\p{N}]+/gu, " ").trim().slice(0, 200);
const KIND: Record<string, string> = { welcome: "Karşılama", catalog: "Fiyat listesi", follow_up: "Takip", reply: "Onayladığınız cevap", ai: "Asistan cevabı", other: "Otomatik mesaj" };

let chain: Promise<unknown> = Promise.resolve();

/** Döner: true = Telegram'a yeni iletildi, false = son 24 saatte zaten iletilmişti */
export async function forwardManual(c: AiCouple, text: string, kind: string): Promise<boolean> {
  const key = `${c.id}|${norm(text)}`;
  const run = chain.then(async () => {
    let seen: Record<string, string> = {};
    try {
      seen = JSON.parse(await readFile(FILE, "utf-8")) as Record<string, string>;
    } catch {
      seen = {};
    }
    const now = Date.now();
    for (const [k, at] of Object.entries(seen)) if (now - Date.parse(at) > 3 * 86400_000) delete seen[k];
    if (seen[key] && now - Date.parse(seen[key]) < 24 * 3600_000) return false;
    seen[key] = new Date().toISOString();
    await mkdir(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(seen), "utf-8");
    await rename(tmp, FILE);
    return true;
  });
  chain = run.catch(() => undefined);
  if (!(await run)) return false;
  const chatId = tgChatId();
  if (!chatId) return true;
  const phone = c.phone.replace(/^90(\d{3})(\d{3})(\d{2})(\d{2})$/, "0$1 $2 $3 $4");
  const isPdf = /^\[(PDF|belge)\]/i.test(text);
  const body = isPdf ? `Fiyat listemiz: ${PDF_URL}` : text;
  await tgApi("sendMessage", {
    chat_id: chatId,
    disable_web_page_preview: true,
    text: `📋 KOPYALA-GÖNDER (WhatsApp kısıtlı) — ${c.name} · ${phone}\n🏷️ ${KIND[kind] ?? "Mesaj"}${isPdf ? " (PDF yerine link gönderin)" : ""}\n\n📲 Tek dokunuşla (mesaj hazır açılır): ${waLink(c.phone, body)}\n\nYa da aşağıdaki mesajı basılı tutup kopyalayın 👇`,
  });
  await tgApi("sendMessage", { chat_id: chatId, text: body, disable_web_page_preview: true });
  return true;
}
