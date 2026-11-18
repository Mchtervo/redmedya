/**
 * Günlük rapor (Telegram) ve Telegram komut cevapları.
 */
import type { AiCouple, AiCoupleGrade } from "@/types/ai-couples";
import { upcomingCapacity, getCapacityForDate } from "@/lib/ai-couples/capacity";
import { buildQueue } from "@/lib/ai-couples/queue";
import { displayPhone, GRADE_LABEL, istanbulParts, OUTCOME_LABEL, STATUS_LABEL } from "@/lib/ai-couples/rules";
import { readCouples } from "@/lib/ai-couples/store";

const REJECT = new Set(["not_interested", "booked_elsewhere", "do_not_contact"]);
const OFFER = new Set(["offer_requested", "info_requested"]);

function line(c: AiCouple): string {
  const date = c.weddingDate ? ` · ${c.weddingDate}` : "";
  return `• ${c.name}${date} · ${displayPhone(c.phone)}`;
}

function listGrade(couples: AiCouple[], grade: AiCoupleGrade, max = 10): string {
  const items = couples.filter((c) => c.grade === grade);
  if (!items.length) return "  (yok)";
  const shown = items.slice(0, max).map(line).join("\n");
  return items.length > max ? `${shown}\n  … ve ${items.length - max} çift daha` : shown;
}

export async function buildDailyReport(now = new Date()) {
  const couples = await readCouples();
  const today = istanbulParts(now).day;
  const isToday = (iso?: string) => Boolean(iso) && istanbulParts(new Date(iso!)).day === today;

  const callsToday = couples.flatMap((c) => c.calls.filter((x) => isToday(x.at)));
  const newToday = couples.filter((c) => isToday(c.createdAt)).length;
  const offers = callsToday.filter((x) => OFFER.has(x.outcome)).length;
  const rejected = callsToday.filter((x) => REJECT.has(x.outcome)).length;
  const lockedToday = couples.filter((c) => isToday(c.lockedAt)).length;
  const msgsToday = couples.flatMap((c) => c.messages.filter((m) => m.direction === "out" && isToday(m.at))).length;

  // Yarın 10:30 (İstanbul, UTC+3) itibarıyla aranacaklar
  const tomorrow = new Date(new Date(`${today}T07:30:00Z`).getTime() + 86_400_000);
  const queue = await buildQueue(tomorrow, 10);
  const nextCalls = queue.filter((q) => q.type === "call");

  const data = {
    day: today,
    newCouples: newToday,
    calls: callsToday.length,
    offersRequested: offers,
    rejected,
    blacklistedToday: lockedToday,
    messagesSent: msgsToday,
    counts: {
      hot: couples.filter((c) => c.grade === "hot").length,
      warm: couples.filter((c) => c.grade === "warm").length,
      cold: couples.filter((c) => c.grade === "cold").length,
      blacklist: couples.filter((c) => c.grade === "blacklist").length,
    },
    nextCalls: nextCalls.map((q) => ({ name: q.name, phone: q.phone, reason: q.reason })),
  };

  const text = [
    `📊 RED MEDIA — Günlük AI raporu (${today})`,
    "",
    `🆕 Yeni talep: ${data.newCouples}`,
    `📞 Arama: ${data.calls}`,
    `📨 Teklif / bilgi isteyen: ${data.offersRequested}`,
    `🙅 Reddeden: ${data.rejected}  (kara listeye alınan: ${data.blacklistedToday})`,
    `💬 Giden WhatsApp: ${data.messagesSent}`,
    "",
    `${GRADE_LABEL.hot} (${data.counts.hot})`,
    listGrade(couples, "hot"),
    "",
    `${GRADE_LABEL.warm} (${data.counts.warm})`,
    listGrade(couples, "warm"),
    "",
    `${GRADE_LABEL.cold}: ${data.counts.cold} · ${GRADE_LABEL.blacklist}: ${data.counts.blacklist}`,
    "",
    "⏭️ Sıradaki aramalar:",
    nextCalls.length
      ? nextCalls.map((q) => `• ${q.name} · ${displayPhone(q.phone)} (${q.reason})`).join("\n")
      : "  (yok)",
  ].join("\n");

  return { data, text };
}

export async function coupleDetailText(c: AiCouple): Promise<string> {
  const cap = await getCapacityForDate(c.weddingDate);
  const lastCall = c.calls[c.calls.length - 1];
  return [
    `${GRADE_LABEL[c.grade]} — ${c.name}`,
    `📱 ${displayPhone(c.phone)} · ${c.source}`,
    c.weddingDate ? `💍 ${c.weddingDate}${cap ? ` (o hafta kalan: ${cap.remaining}/${cap.total})` : ""}` : "💍 tarih yok",
    `Durum: ${STATUS_LABEL[c.status]} · Arama: ${c.callCount}`,
    c.contactLocked ? `🚫 ${c.lockReason ?? "İletişim kapalı"}` : "",
    lastCall ? `Son arama: ${OUTCOME_LABEL[lastCall.outcome]}${lastCall.summary ? ` — ${lastCall.summary.slice(0, 300)}` : ""}` : "",
    c.followUpAt && !c.followUpSentAt ? `⏰ Takip: ${c.followUpAt.slice(0, 10)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function capacityText(): Promise<string> {
  const weeks = await upcomingCapacity(10);
  return [
    "📅 Haftalık kontenjan (kalan / toplam)",
    ...weeks.map((w) => `• ${w.weekLabel}: ${w.remaining}/${w.total}`),
  ].join("\n");
}

export function gradeListText(couples: AiCouple[], grade: AiCoupleGrade): string {
  return `${GRADE_LABEL[grade]} (${couples.filter((c) => c.grade === grade).length})\n${listGrade(couples, grade, 25)}`;
}
