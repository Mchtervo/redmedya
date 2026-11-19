/**
 * Çiftin yolculuğu: "ne oldu" (geçmiş özeti) ve "sırada ne var" (sonraki adım + nedeni).
 * Panel, Telegram (/bul) ve sesli asistan (arama öncesi bağlam) aynı mantığı kullanır;
 * böylece arama, SMS ve WhatsApp birbirinden haberdar çalışır.
 * Saf fonksiyonlar — sunucu ve tarayıcıda çalışır.
 */
import type { AiCouple } from "@/types/ai-couples";
import { CALL_WINDOW, isWithinCallWindow, OUTCOME_LABEL, SECOND_CALL_GAP_MS, istanbulParts, isFollowUpCallDue } from "@/lib/ai-couples/rules";

const CAMPAIGN_REF = "kampanya-2027";

function hhmm(d: Date): string {
  return d.toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" });
}
function dayWord(d: Date, now: Date): string {
  const a = istanbulParts(d).day, b = istanbulParts(now).day;
  if (a === b) return "bugün";
  const tomorrow = istanbulParts(new Date(now.getTime() + 86_400_000)).day;
  if (a === tomorrow) return "yarın";
  return d.toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long" });
}

/** İlk uygun arama anı (09:30–20:30 İstanbul) — verilen andan itibaren. */
export function nextCallSlot(from: Date): Date {
  if (isWithinCallWindow(from)) return from;
  const { hour, minute } = istanbulParts(from);
  const afterEnd = hour * 60 + minute >= CALL_WINDOW.endHour * 60 + CALL_WINDOW.endMinute;
  // Bir sonraki açılış (09:30, İstanbul = UTC+3)
  const base = new Date(from.getTime() + (afterEnd ? 86_400_000 : 0));
  const day = istanbulParts(base).day; // YYYY-MM-DD
  return new Date(`${day}T${String(CALL_WINDOW.startHour).padStart(2, "0")}:${String(CALL_WINDOW.startMinute).padStart(2, "0")}:00+03:00`);
}

function when(d: Date, now: Date): string {
  if (d.getTime() <= now.getTime() + 5 * 60_000) return "birkaç dakika içinde";
  return `${dayWord(d, now)} ${hhmm(d)}`;
}

export type NextStep = { text: string; tone: "action" | "wait" | "done" | "stop" | "you" };

/** Sırada ne var? `callsEnabled`: otomatik arama açık mı (panel bilir; bilinmiyorsa true kabul). */
export function nextStep(c: AiCouple, now = new Date(), callsEnabled = true): NextStep {
  if (c.contactLocked) return { text: `Durdu — ${c.lockReason ?? "iletişim kapalı"}. Arama ve mesaj yok.`, tone: "stop" };
  if (c.status === "won") return { text: "Rezervasyon yaptı. Satış iletişimi yok.", tone: "done" };
  if ((c.note ?? "").includes("Numara hatalı")) return { text: "Numara hatalı (WhatsApp yok) — otomatik işlem yok.", tone: "stop" };
  if (c.status === "lost") return { text: "İlgilenmediğini söyledi — takip durdu.", tone: "stop" };

  const msgs = c.messages;
  const last = msgs[msgs.length - 1];
  if (last?.direction === "in") return { text: "Çift yazdı — SİZ dönün (otomatik cevap yok).", tone: "you" };

  const calls = c.calls;
  const lastCall = calls[calls.length - 1];
  const waOut = (since: number) => msgs.some((m) => m.direction === "out" && m.channel === "whatsapp" && Date.parse(m.at) >= since);
  const offNote = callsEnabled ? "" : " (otomatik arama KAPALI — panelden başlatın)";

  // Toplu kampanya çiftleri: önce WhatsApp, arama sahibi açınca
  if (c.sourceRef === CAMPAIGN_REF && !calls.length) {
    const first = msgs.find((m) => m.direction === "out" && m.channel === "whatsapp");
    if (!first) return { text: "Kampanya WhatsApp sırasında (09:00–20:40, günde 40, 3-4 dk arayla).", tone: "wait" };
    const followSent = msgs.some((m) => m.direction === "out" && m.text.includes("fiyat listemize göz atabildiniz"));
    if (followSent) return { text: "Takip mesajı da gitti — cevap bekleniyor. Kampanya aramaları sahibi başlatınca.", tone: "wait" };
    return { text: `Cevap gelmezse ${when(new Date(Date.parse(first.at) + 48 * 3600e3), now)} takip mesajı.`, tone: "wait" };
  }

  if (c.followUpAt && !c.followUpSentAt && isFollowUpCallDue(c, now)) {
    return { text: `Düşünüyordu — 1 hafta doldu: tekrar arama ${when(nextCallSlot(now), now)}${offNote}.`, tone: "action" };
  }
  if (c.followUpAt && !c.followUpSentAt) {
    return { text: `Düşünüyor — ${when(nextCallSlot(new Date(c.followUpAt)), now)} 1 kez tekrar aranacak.`, tone: "wait" };
  }

  if ((c.busyRetries ?? 0) > 0 && c.callbackRequested) {
    const at = nextCallSlot(new Date(Math.max(now.getTime(), Date.parse(c.callbackAt ?? "") || 0)));
    return { text: `Hat meşguldü — ${when(at, now)} tekrar aranacak (${c.busyRetries}/2)${offNote}.`, tone: "action" };
  }
  if (!calls.length) {
    return callsEnabled
      ? { text: `1. arama ${when(nextCallSlot(now), now)}. Ardından WhatsApp.`, tone: "action" }
      : { text: "Aranmayı bekliyor — otomatik arama KAPALI (panelden başlatın). Aramadan WhatsApp gitmez.", tone: "you" };
  }
  const lastAt = Date.parse(lastCall.at);
  if (!waOut(lastAt)) {
    if (lastCall.outcome === "no_answer") {
      return calls.length >= 2
        ? { text: "2. arama da açılmadı — SON WhatsApp mesajı birkaç dakika içinde (09:00–21:00).", tone: "action" }
        : { text: "1. arama açılmadı — \"aradık, ulaşamadık\" WhatsApp'ı birkaç dakika içinde (09:00–21:00).", tone: "action" };
    }
    return { text: `Görüşüldü (${OUTCOME_LABEL[lastCall.outcome]}) — notlara göre WhatsApp birkaç dakika içinde.`, tone: "action" };
  }
  if (lastCall.outcome === "no_answer" && calls.length === 1) {
    const due = nextCallSlot(new Date(Math.max(now.getTime(), lastAt + SECOND_CALL_GAP_MS)));
    return { text: `WhatsApp'a dönmezse 2. (son) arama ${when(due, now)}${offNote}. Dönerse aranmayacak.`, tone: "wait" };
  }
  if (lastCall.outcome === "no_answer") return { text: "2 arama + son mesaj tamam — bir daha aranmayacak. Cevap bekleniyor.", tone: "done" };
  if (lastCall.outcome === "callback_requested" || c.callbackRequested) {
    const at = nextCallSlot(new Date(Math.max(now.getTime(), Date.parse(c.callbackAt ?? "") || 0)));
    return { text: `Sonra arayın dedi — tekrar arama ${when(at, now)}${offNote}.`, tone: "action" };
  }
  return { text: "Görüşüldü, WhatsApp gitti — çiftin cevabı bekleniyor.", tone: "done" };
}

/** Sesli asistan için kısa geçmiş: "Düğün.com'dan SMS gönderildi. 1. arama açılmadı. WhatsApp'tan fiyat listesi gönderildi, cevap yok." */
export function historyForAgent(c: AiCouple): string {
  const parts: string[] = [];
  const ev = [
    ...c.calls.map((x) => ({ at: x.at, t: "call" as const, x })),
    ...c.messages.map((m) => ({ at: m.at, t: "msg" as const, m })),
  ].sort((a, b) => a.at.localeCompare(b.at));
  let callNo = 0;
  for (const e of ev) {
    if (e.t === "call") {
      callNo++;
      const n = e.x.notes;
      parts.push(
        e.x.outcome === "no_answer"
          ? `${callNo}. arama açılmadı.`
          : `${callNo}. aramada görüşüldü (${OUTCOME_LABEL[e.x.outcome]})${n?.paket ? `, ilgilendiği paket: ${n.paket}` : ""}${n?.ekstralar ? `, ekstralar: ${n.ekstralar}` : ""}${n?.itiraz ? `, itirazı: ${n.itiraz}` : ""}.`
      );
    } else if (e.m.direction === "out") {
      parts.push(
        e.m.channel === "sms" ? "Düğün.com'dan karşılama SMS'i gönderildi." :
        e.m.channel === "dugun_com" ? "Düğün.com'dan karşılama e-postası gönderildi." :
        e.m.text.includes("iki kez ulaşmaya") ? "WhatsApp'tan son hatırlatma mesajı gönderildi." :
        "WhatsApp'tan fiyat listesi ve kampanya bilgisi gönderildi."
      );
    } else {
      parts.push(`Çift WhatsApp'tan yazdı: "${e.m.text.replace(/\s+/g, " ").slice(0, 120)}".`);
    }
  }
  const dedup = parts.filter((p, i) => p !== parts[i - 1]);
  return dedup.length ? dedup.join(" ") : "İlk temas — daha önce görüşülmedi.";
}
