/**
 * Ara hatırlatmalar (WhatsApp, n8n "RM D" kuyruktan gönderir):
 *  - "Düşüneyim" diyen çifte 3. gün kısa hatırlatma (1 hafta sonra zaten tekrar aranıyor)
 *  - "Tarihi tutalım" diyen çifte ~20 saat sonra kapora hatırlatması
 * Kara liste, rezervasyon yapan, ilgilenmeyen, son durumdan sonra yazmış çift → GÖNDERİLMEZ.
 * Her hatırlatma bir kez gider (metindeki işaretten anlaşılır).
 */
import type { AiCapacityInfo, AiCouple } from "@/types/ai-couples";
import { hitapFor } from "@/lib/ai-couples/hitap";

export const NUDGE_MARK = "biraz düşünmek istediğinizi söylemiştiniz";
export const DEPOSIT_MARK = "24 saatliğine sizin adınıza ayırmıştık";

const DAY = 86_400_000;
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

const ts = (iso: string) => Date.parse(iso);
const blocked = (c: AiCouple) => c.contactLocked || c.status === "won" || c.status === "lost";
const sentAfter = (c: AiCouple, mark: string, since: number) =>
  c.messages.some((m) => m.direction === "out" && m.text.includes(mark) && ts(m.at) >= since);
const wroteAfter = (c: AiCouple, since: number) => c.messages.some((m) => m.direction === "in" && ts(m.at) >= since);

function greet(c: AiCouple): string {
  const h = hitapFor(c.name).hitap;
  return h ? `Merhaba ${h},` : "Merhaba,";
}

function dateText(c: AiCouple): string {
  const m = c.weddingDate?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${Number(m[3])} ${AYLAR[Number(m[2]) - 1]} ${m[1]}` : "";
}

/** Düşüneyim dedi → 3 gün geçti, o zamandan beri yazmadı, 1 haftalık tekrar araması henüz olmadı */
export function isThinkingNudgeDue(c: AiCouple, now: Date): boolean {
  if (blocked(c) || c.status !== "thinking") return false;
  const t = [...c.timeline].reverse().find((e) => e.type === "thinking");
  if (!t) return false;
  const since = ts(t.at);
  const age = now.getTime() - since;
  if (age < 3 * DAY || age > 6 * DAY) return false;
  if (wroteAfter(c, since)) return false;
  if (c.followUpSentAt) return false;
  return !sentAfter(c, NUDGE_MARK, since);
}

export function buildThinkingNudge(c: AiCouple, cap: AiCapacityInfo | null): string {
  const yer = cap && cap.remaining > 0 ? ` ${cap.monthLabel} için kampanya fiyatıyla son ${cap.remaining} yerimiz kaldı.` : "";
  return (
    `${greet(c)} RedMedia ekibindenim. Geçen görüşmemizde ${NUDGE_MARK}, rahatsız etmemek için kısaca yazıyorum.` +
    `${yer} 2027 erken rezervasyon fiyatlarımız henüz zamlanmadı; tarihinizi 1.000 TL kapora ile şimdiden sabitleyebilirsiniz.` +
    ` Aklınıza takılan bir şey olursa buradan yazmanız yeterli.`
  );
}

/** "Tarihi 24 saat tutalım" dedi → ~20 saat geçti, rezervasyon yok, o zamandan beri yazmadı, görüşme sonrası WhatsApp gitmiş */
export function isDepositReminderDue(c: AiCouple, now: Date): boolean {
  if (blocked(c)) return false;
  const call = [...c.calls].reverse().find((x) => x.notes?.tarihTut);
  if (!call) return false;
  const since = ts(call.at);
  const age = now.getTime() - since;
  if (age < 20 * 3600_000 || age > 4 * DAY) return false;
  if (wroteAfter(c, since)) return false;
  const waAfterCall = c.messages.some((m) => m.direction === "out" && m.channel === "whatsapp" && ts(m.at) >= since);
  if (!waAfterCall) return false;
  return !sentAfter(c, DEPOSIT_MARK, since);
}

export function buildDepositReminder(c: AiCouple): string {
  const d = dateText(c);
  return (
    `${greet(c)} RedMedia ekibindenim. Dünkü görüşmemizde ${d ? d + " için " : ""}tarihinizi ${DEPOSIT_MARK}.` +
    ` Tarihinizi kesinleştirmek için 1.000 TL kapora yeterli; kalan ödeme çekimden hemen sonra alınıyor. Ödeme bilgilerini hemen buradan iletebiliriz.` +
    ` Sormak istediğiniz bir şey varsa yazmanız yeterli.`
  );
}
