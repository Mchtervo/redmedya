/**
 * SESSİZ ÇİFT TAKİBİ — bizim SON mesajımıza (otomatik ya da sizin elle yazdığınız) cevap vermeyen çift:
 *   1) X. gün WhatsApp: tarih + verilen fiyat + kalan yer + kampanya bitiyor / %40 zam → "rezervasyon yapalım mı?"
 *   2) Y. gün TAKİP ARAMASI: asistan "X gün önce görüşmüştük / fiyat göndermiştik" diye başlar (kampanya listesi dahil)
 *   3) Z. gün SON WhatsApp (kibar, bir daha rahatsız etmeyiz)
 * Çift yazarsa takip durur (siz dönersiniz); siz yazar da çift yine susarsa takip sizin mesajınızdan yeniden başlar.
 * "Düşüneyim" diyenin kendi takibi var (3. gün mesaj, 7. gün arama). Kara liste / rezervasyon / ilgilenmiyor / panelden iptal → yok.
 * Gün sayıları panelden (follow-days). Saf fonksiyonlar (tarayıcıda da çalışır).
 */
import type { AiCapacityInfo, AiCallRecord, AiCouple, AiMessageRecord } from "@/types/ai-couples";
import { followDays } from "@/lib/ai-couples/follow-days";
import { hitapFor } from "@/lib/ai-couples/hitap";

export const FU_MSG_MARK = "zamsız fiyattan yararlanmanız için";
export const FU_LAST_MARK = "son kez kısaca hatırlatıyorum";
/** Takip / hatırlatma türü mesajlar (yeni takip dayanağı sayılmaz; "hatırlatma gitti" sayılır) */
const REMINDER_MARKS = [
  FU_MSG_MARK,
  "biraz düşünmek istediğinizi söylemiştiniz", // düşünüyor hatırlatması
  "24 saatliğine sizin adınıza ayırmıştık", // kapora hatırlatması
  "fiyat listemize göz atabildiniz", // kampanya 48. saat takibi
  "iki kez ulaşmaya", // 2 arama açılmadı son mesajı
];

const DAY = 86_400_000;
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

const PRICE: [RegExp, string, string][] = [
  [/alb[üu]m/i, "Fotoğraf + Klip + Albüm", "14.000 TL"],
  [/klip|video/i, "Fotoğraf + Klip", "9.000 TL"],
  [/foto/i, "Fotoğraf", "5.000 TL"],
];

export function quotedPackage(call: AiCallRecord | undefined): { name: string; price: string } | null {
  const p = call?.notes?.paket;
  if (!p) return null;
  const hit = PRICE.find(([re]) => re.test(p));
  return hit ? { name: hit[1], price: hit[2] } : null;
}

function dateText(c: AiCouple): string {
  const m = c.weddingDate?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${Number(m[3])} ${AYLAR[Number(m[2]) - 1]} ${m[1]}`;
  const n = (c.note ?? "").match(/Düğün: ([^·\n]+)/);
  return n && !/belli değil/i.test(n[1]) ? n[1].trim() : "";
}

const isReminder = (m: AiMessageRecord) => REMINDER_MARKS.some((k) => m.text.includes(k)) || m.text.includes(FU_LAST_MARK);
const lastAnswered = (c: AiCouple) => [...c.calls].reverse().find((x) => x.outcome !== "no_answer");

/** Takibin dayanağı: çiftin son cevabından sonra bizim attığımız SON (hatırlatma olmayan) WhatsApp mesajı */
export function followAnchor(c: AiCouple): { msg: AiMessageRecord; at: number; call?: AiCallRecord } | null {
  if (c.sourceRef === "test") return null;
  if (c.contactLocked || c.status === "won" || c.status === "lost" || c.status === "thinking") return null;
  if ((c.note ?? "").includes("Numara hatalı")) return null;
  const msgs = c.messages;
  if (!msgs.length || msgs[msgs.length - 1].direction === "in") return null; // çift yazdı → siz dönün
  let anchor: AiMessageRecord | null = null;
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    if (m.direction === "in") break;
    if (m.channel !== "whatsapp" || m.text.startsWith("[") || isReminder(m)) continue;
    anchor = m;
    break;
  }
  if (!anchor) return null;
  // Son arama mesajdan sonraysa ve "sonra arayın" planı varsa o yürür
  if (c.callbackRequested) return null;
  return { msg: anchor, at: Date.parse(anchor.at), call: lastAnswered(c) };
}

const sentAfter = (c: AiCouple, since: number, test: (m: AiMessageRecord) => boolean) =>
  c.messages.some((m) => m.direction === "out" && Date.parse(m.at) >= since && test(m));
const ageDays = (since: number, now: Date) => (now.getTime() - since) / DAY;
const calledAfter = (c: AiCouple, since: number) => c.calls.some((x) => Date.parse(x.at) > since);

export function isFollowMsgDue(c: AiCouple, now: Date): boolean {
  const a = followAnchor(c);
  if (!a || c.messagesPaused) return false;
  const d = followDays(), age = ageDays(a.at, now);
  return age >= d.msg && age < d.call + 2 && !sentAfter(c, a.at, (m) => REMINDER_MARKS.some((k) => m.text.includes(k)));
}

export function isFollowCallDue(c: AiCouple, now: Date): boolean {
  const a = followAnchor(c);
  if (!a || c.callsPaused) return false;
  const d = followDays(), age = ageDays(a.at, now);
  return age >= d.call && age <= d.last + 3 && !calledAfter(c, a.at);
}

export function isFollowLastDue(c: AiCouple, now: Date): boolean {
  const a = followAnchor(c);
  if (!a || c.messagesPaused) return false;
  const d = followDays(), age = ageDays(a.at, now);
  return age >= d.last && age < d.last + 5 && !sentAfter(c, a.at, (m) => m.text.includes(FU_LAST_MARK));
}

function greet(c: AiCouple): string {
  const h = hitapFor(c.name).hitap;
  return h ? `Merhaba ${h},` : "Merhaba,";
}

function agoText(since: number, now: Date): string {
  const n = Math.max(1, Math.round(ageDays(since, now)));
  return n === 1 ? "dün" : `${n} gün önce`;
}

/** "3 gün önce telefonda görüşmüştük" ya da "3 gün önce size WhatsApp'tan yazmıştık" */
function contactText(a: NonNullable<ReturnType<typeof followAnchor>>, now: Date): string {
  const talked = a.call && Math.abs(Date.parse(a.call.at) - a.at) < 2 * DAY;
  return talked ? `${agoText(Date.parse(a.call!.at), now)} telefonda görüşmüştük` : `${agoText(a.at, now)} size WhatsApp'tan yazmıştık`;
}

export function buildFollowMsg(c: AiCouple, cap: AiCapacityInfo | null, now: Date): string {
  const a = followAnchor(c);
  const d = dateText(c);
  const p = quotedPackage(a?.call);
  const ne = p ? `${p.name} paketine ${p.price} erken rezervasyon fiyatı vermiştik` : "2027 erken rezervasyon fiyatlarımızı iletmiştik";
  const yer = cap && cap.remaining > 0 ? ` ${cap.monthLabel} için kampanya fiyatıyla son ${cap.remaining} yerimiz kaldı.` : "";
  return (
    `${greet(c)} RedMedia ekibindenim. ${a ? contactText(a, now) : "Geçenlerde görüşmüştük"}; ${d ? d + " tarihindeki düğününüz için " : ""}${ne}.` +
    `${yer} Tarihler hızla doluyor ve kampanyamız 31 Aralık'ta bitiyor; sonrasında fiyatlara %40 zam geliyor.` +
    ` Tarihiniz dolmadan, ${FU_MSG_MARK} rezervasyonunuzu şimdiden yapalım mı? 1.000 TL kapora ile tarihiniz sabitleniyor, kalan ödeme çekim günü.`
  );
}

export function buildFollowLast(c: AiCouple, cap: AiCapacityInfo | null): string {
  const d = dateText(c);
  const p = quotedPackage(followAnchor(c)?.call);
  const yer = cap && cap.remaining > 0 ? ` (${cap.monthLabel} için son ${cap.remaining} yer)` : "";
  return (
    `${greet(c)} RedMedia ekibindenim, ${FU_LAST_MARK}: ${d ? d + " için " : ""}${p ? `${p.name} ${p.price}` : "erken rezervasyon"} fiyatımız kampanya bitene kadar geçerli${yer}.` +
    ` Yerinizi ayırmak isterseniz buraya "evet" yazmanız yeterli, gerisini biz hallederiz. Başka bir planınız olduysa da sorun değil, bir daha rahatsız etmeyeceğiz. Mutluluklar dileriz 🤍`
  );
}

/** Sesli asistan için takip araması notu ({{gecmis}} içine) */
export function followCallNote(c: AiCouple, now: Date): string {
  const a = followAnchor(c);
  if (!a) return "";
  const d = dateText(c);
  const p = quotedPackage(a.call);
  const ct = contactText(a, now);
  return (
    `BU BİR TAKİP ARAMASI: ${ct}${d ? `, düğün ${d}` : ""}${p ? `, ${p.name} paketine ${p.price} fiyat verdik` : ", 2027 fiyatlarını gönderdik"}; cevap gelmedi.` +
    ` Açılışta (kimlik teyidinden sonra) "${ct}${d ? `, ${d} için` : ""} size fiyat bilgisi vermiştik" diye hatırlat; tarihlerin dolduğunu, kampanyanın 31 Aralık'ta bittiğini ve %40 zam gelmeden yerini ayırmak isteyip istemediğini sor. Kısa tut, baskı yapma.`
  );
}

/** Panel / Hareketler için: sıradaki takip adımı ne zaman */
export function followStepText(c: AiCouple, now: Date): string | null {
  const a = followAnchor(c);
  if (!a) return null;
  const d = followDays();
  const when = (days: number) => {
    const t = new Date(a.at + days * DAY);
    return t.getTime() <= now.getTime() ? "şimdi" : t.toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long", day: "numeric", month: "long" });
  };
  const age = ageDays(a.at, now);
  if (!sentAfter(c, a.at, (m) => REMINDER_MARKS.some((k) => m.text.includes(k))) && age < d.call + 2 && !c.messagesPaused)
    return `Cevap gelmezse ${when(d.msg)} hatırlatma WhatsApp'ı (tarih + fiyat + %40 zam).`;
  if (!calledAfter(c, a.at) && age <= d.last + 3 && !c.callsPaused) return `Cevap gelmezse ${when(d.call)} takip araması.`;
  if (!sentAfter(c, a.at, (m) => m.text.includes(FU_LAST_MARK)) && age < d.last + 5 && !c.messagesPaused) return `Cevap gelmezse ${when(d.last)} son WhatsApp.`;
  return null;
}
