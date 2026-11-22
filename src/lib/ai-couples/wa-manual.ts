/**
 * WhatsApp kısıtlıyken (manuel mod): sistemin müşteriye atacağı her WhatsApp mesajı Telegram'a kopyala-gönder olarak gelir.
 * Başlık (isim, numara, ne mesajı, tek dokunuşla wa.me linki) + ayrı mesajda sadece metin. Aynı mesaj 24 saatte bir kez.
 */
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import { tgApi, tgChatId, waLink } from "@/lib/ai-couples/wa-drafts";
import type { AiCouple, AiCapacityInfo } from "@/types/ai-couples";
import { hitapFor } from "@/lib/ai-couples/hitap";

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

const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const PAKET = [
  { ad: "Fotoğraf + klip + albüm", now: "14.000", normal: "19.600", re: /alb[üu]m/i },
  { ad: "Fotoğraf + sinematik klip", now: "9.000", normal: "12.600", re: /klip|video|sinematik/i },
  { ad: "Fotoğraf", now: "5.000", normal: "7.000", re: /foto/i },
];
const greet = (c: AiCouple) => { const h = hitapFor(c.name).hitap; return h ? `Merhaba ${h}` : "Merhaba"; };
const dateTxt = (c: AiCouple) => { const m = c.weddingDate?.match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${Number(m[3])} ${AYLAR[Number(m[2]) - 1]} ${m[1]}` : ""; };

/** Manuel modda K akışının yerine: yeni talep karşılaması ve arama sonrası mesaj (kısa) */
export function manualExtras(c: AiCouple, months: AiCapacityInfo[], now = Date.now()): { kind: string; text: string } | null {
  if (c.sourceRef === "test" || c.contactLocked || c.messagesPaused || c.status === "won" || c.status === "lost") return null;
  const waOut = c.messages.filter((m) => m.direction === "out" && m.channel === "whatsapp" && !m.text.startsWith("["));
  const last = c.calls[c.calls.length - 1];
  const d = dateTxt(c);
  const dTxt = d ? `${d} tarihindeki düğününüz` : "düğününüz";
  // 1) Arama sonrası (son 6 saatte arandı, aramadan sonra WhatsApp gitmedi)
  if (last && now - Date.parse(last.at) < 6 * 3600_000 && !waOut.some((m) => m.at > last.at)) {
    const answered = last.outcome !== "no_answer";
    const pk = answered ? PAKET.find((p) => p.re.test(last.notes?.paket ?? "")) : undefined;
    const mk2 = c.weddingDate ? c.weddingDate.slice(0, 7) : "";
    const m = months.find((x) => x.monthKey === mk2);
    const yer = m && m.remaining > 0 && m.remaining <= 5 ? ` ${m.monthLabel} için kampanya fiyatından son ${m.remaining} yer kaldı.` : "";
    const fiyat = pk ? `Konuştuğumuz ${pk.ad.toLowerCase()} paketi: ${pk.now} TL (normali ${pk.normal} TL).` : "Fotoğraf 7.000 yerine 5.000 TL, fotoğraf + sinematik klip 12.600 yerine 9.000 TL, fotoğraf + klip + albüm 19.600 yerine 14.000 TL.";
    if (last.outcome === "callback_requested") return { kind: "other", text: `${greet(c)}, RedMedia ekibindenim. Az önce aradığımızda müsait değildiniz, söylediğiniz zamanda tekrar arayacağız 🤍 Bu arada ${dTxt} için kampanya fiyatlarımız: ${fiyat} Fiyat listemiz: ${PDF_URL}` };
    if (answered) return { kind: "other", text: `${greet(c)}, RedMedia ekibindenim. Az önce telefonda görüştük, ilginiz için teşekkürler 🤍 ${fiyat}${yer} Fiyat listemiz: ${PDF_URL} Aklınıza takılan olursa buradan yazabilirsiniz.` };
    return { kind: "other", text: `${greet(c)}, RedMedia ekibindenim. Sizi az önce aradık ama ulaşamadık. ${dTxt[0].toUpperCase() + dTxt.slice(1)} için kampanya fiyatlarımız: ${fiyat}${yer} Fiyat listemiz: ${PDF_URL} Uygun olduğunuz saati yazarsanız arayalım ya da buradan yazışabiliriz 🙂` };
  }
  // 2) Yeni talep karşılaması (son 24 saatte geldi, henüz hiç WhatsApp gitmedi, aranmadı; kampanya listesi hariç)
  if (c.sourceRef !== "kampanya-2027" && !waOut.length && !c.calls.length && now - Date.parse(c.createdAt) < 24 * 3600_000 && !c.messages.some((m) => m.direction === "in")) {
    return { kind: "welcome", text: `${greet(c)}, RedMedia ekibindenim. Talebiniz bize ulaştı, teşekkür ederiz 🤍 Kısa süre içinde 0312 963 23 47 numaramızdan sizi arayacağız; isterseniz buradan da yazabilirsiniz.` };
  }
  return null;
}
