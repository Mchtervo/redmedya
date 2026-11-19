/**
 * SESSİZ ÇİFT TAKİBİ — telefonda görüşülüp "bilgi / teklif istedi" denen, WhatsApp'tan fiyat giden
 * ama sonra hiç cevap vermeyen çift (kampanya listesi hariç; onu n8n K yürütür):
 *   1) X. gün WhatsApp: tarih + verilen fiyat + kalan yer + kampanya bitiyor / %40 zam → "rezervasyon yapalım mı?"
 *   2) Y. gün TAKİP ARAMASI: asistan "X gün önce görüşmüştük, şu tarih için şu fiyatı vermiştik" diye başlar
 *   3) Z. gün SON WhatsApp
 * Durur: çift yazdı, siz elle yazdınız, rezervasyon / kara liste / ilgilenmiyor, ya da panelden iptal.
 * Gün sayıları panelden (follow-days). Saf fonksiyonlar (tarayıcıda da çalışır).
 */
import type { AiCapacityInfo, AiCallRecord, AiCouple } from "@/types/ai-couples";
import { followDays } from "@/lib/ai-couples/follow-days";
import { hitapFor } from "@/lib/ai-couples/hitap";

export const FU_MSG_MARK = "zamsız fiyattan yararlanmanız için";
export const FU_LAST_MARK = "son kez kısaca hatırlatıyorum";

const DAY = 86_400_000;
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const CAMPAIGN = "kampanya-2027";
const ACTIVE = new Set(["info_requested", "offer_requested"]);

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
  return m ? `${Number(m[3])} ${AYLAR[Number(m[2]) - 1]} ${m[1]}` : "";
}

/** Takibin dayanağı: son "bilgi/teklif istedi" görüşmesi ve sonrasında giden ilk WhatsApp */
export function followAnchor(c: AiCouple): { call: AiCallRecord; at: number } | null {
  if (c.sourceRef === CAMPAIGN || c.sourceRef === "test") return null;
  if (c.contactLocked || c.status === "won" || c.status === "lost") return null;
  const answered = c.calls.filter((x) => x.outcome !== "no_answer");
  const call = answered[answered.length - 1];
  if (!call || !ACTIVE.has(call.outcome)) return null;
  const t = Date.parse(call.at);
  const wa = c.messages.find((m) => m.direction === "out" && m.channel === "whatsapp" && Date.parse(m.at) >= t);
  if (!wa) return null;
  // Çift yazdı ya da siz elle cevap verdiniz → konuşma insanda, otomatik takip yok
  if (c.messages.some((m) => Date.parse(m.at) >= t && (m.direction === "in" || m.kind === "reply"))) return null;
  return { call, at: Date.parse(wa.at) };
}

const sent = (c: AiCouple, mark: string, since: number) => c.messages.some((m) => m.direction === "out" && m.text.includes(mark) && Date.parse(m.at) >= since);
const ageDays = (since: number, now: Date) => (now.getTime() - since) / DAY;

export function isFollowMsgDue(c: AiCouple, now: Date): boolean {
  const a = followAnchor(c);
  if (!a || c.messagesPaused) return false;
  const d = followDays(), age = ageDays(a.at, now);
  return age >= d.msg && age < d.call + 2 && !sent(c, FU_MSG_MARK, a.at);
}

export function isFollowCallDue(c: AiCouple, now: Date): boolean {
  const a = followAnchor(c);
  if (!a || c.callsPaused) return false;
  const d = followDays(), age = ageDays(a.at, now);
  if (age < d.call || age > d.last + 3) return false;
  return !c.calls.some((x) => Date.parse(x.at) > Date.parse(a.call.at)); // görüşmeden sonra henüz aranmadı
}

export function isFollowLastDue(c: AiCouple, now: Date): boolean {
  const a = followAnchor(c);
  if (!a || c.messagesPaused) return false;
  const d = followDays(), age = ageDays(a.at, now);
  return age >= d.last && age < d.last + 5 && !sent(c, FU_LAST_MARK, a.at);
}

function greet(c: AiCouple): string {
  const h = hitapFor(c.name).hitap;
  return h ? `Merhaba ${h},` : "Merhaba,";
}

function agoText(since: number, now: Date): string {
  const n = Math.max(1, Math.round(ageDays(since, now)));
  return n === 1 ? "dün" : `${n} gün önce`;
}

export function buildFollowMsg(c: AiCouple, cap: AiCapacityInfo | null, now: Date): string {
  const a = followAnchor(c);
  const call = a?.call;
  const d = dateText(c);
  const p = quotedPackage(call);
  const ne = p ? `${p.name} paketine ${p.price} erken rezervasyon fiyatı vermiştik` : "2027 erken rezervasyon fiyatlarımızı iletmiştik";
  const yer = cap && cap.remaining > 0 ? ` ${cap.monthLabel} için kampanya fiyatıyla son ${cap.remaining} yerimiz kaldı.` : "";
  return (
    `${greet(c)} RedMedia ekibindenim. ${call ? agoText(Date.parse(call.at), now) : "Geçenlerde"} telefonda görüşmüştük; ${d ? d + " tarihindeki düğününüz için " : ""}${ne}.` +
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
  const ago = agoText(Date.parse(a.call.at), now);
  return (
    `BU BİR TAKİP ARAMASI: ${ago} görüştük${d ? `, düğün ${d}` : ""}${p ? `, ${p.name} paketine ${p.price} fiyat verdik` : ""}; WhatsApp'tan teklif gitti ama cevap gelmedi.` +
    ` Açılışta (kimlik teyidinden sonra) "${ago} görüşmüştük${d ? `, ${d} için` : ""} size fiyat vermiştik" diye hatırlat; tarihlerin dolduğunu, kampanyanın 31 Aralık'ta bittiğini ve %40 zam gelmeden yerini ayırmak isteyip istemediğini sor. Kısa tut, baskı yapma.`
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
  if (!sent(c, FU_MSG_MARK, a.at) && ageDays(a.at, now) < d.call + 2) return c.messagesPaused ? null : `Cevap gelmezse ${when(d.msg)} hatırlatma WhatsApp'ı (tarih + fiyat + %40 zam).`;
  if (!c.calls.some((x) => Date.parse(x.at) > Date.parse(a.call.at)) && ageDays(a.at, now) <= d.last + 3)
    return c.callsPaused ? null : `Cevap gelmezse ${when(d.call)} takip araması ("${agoText(Date.parse(a.call.at), now)} fiyat vermiştik").`;
  if (!sent(c, FU_LAST_MARK, a.at) && ageDays(a.at, now) < d.last + 5) return c.messagesPaused ? null : `Cevap gelmezse ${when(d.last)} son WhatsApp.`;
  return "Takip tamamlandı (hatırlatma + arama + son mesaj) — cevap bekleniyor.";
}
