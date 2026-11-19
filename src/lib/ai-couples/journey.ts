/**
 * Çiftin yolculuğu: "ne oldu" (geçmiş özeti) ve "sırada ne var" (sonraki adım + nedeni).
 * Panel, Telegram (/bul) ve sesli asistan (arama öncesi bağlam) aynı mantığı kullanır;
 * böylece arama, SMS ve WhatsApp birbirinden haberdar çalışır.
 * Saf fonksiyonlar — sunucu ve tarayıcıda çalışır.
 */
import type { AiCouple } from "@/types/ai-couples";
import { followCallNote, followStepText, isFollowCallDue } from "@/lib/ai-couples/followup";
import { CALL_WINDOW, isWithinCallWindow, OUTCOME_LABEL, istanbulParts, isFollowUpCallDue } from "@/lib/ai-couples/rules";

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
  if ((c.note ?? "").includes("yanlış numara")) return { text: "Yanlış numara (telefonda söyledi) — bir daha aranmaz, mesaj gitmez.", tone: "stop" };
  if ((c.note ?? "").includes("Numara hatalı")) return { text: "Numara hatalı (WhatsApp yok) — otomatik işlem yok.", tone: "stop" };
  if (c.status === "lost") return { text: "İlgilenmediğini söyledi — takip durdu.", tone: "stop" };

  if (c.callsPaused && c.messagesPaused) return { text: "Otomatik arama ve mesaj iptal edildi (panelden) — sadece siz yazarsanız / ararsanız.", tone: "stop" };
  if (c.callsPaused) return { text: "Otomatik arama iptal edildi (panelden) — aranmayacak." + (c.messagesPaused ? "" : " Otomatik WhatsApp açık."), tone: "stop" };
  if (c.messagesPaused && !c.calls.length) return { text: "Otomatik WhatsApp iptal edildi — sadece arama yapılır.", tone: "wait" };

  const msgs = c.messages;
  const last = msgs[msgs.length - 1];
  if (last?.direction === "in" && c.callbackRequested && c.callbackAt && Date.parse(c.callbackAt) > now.getTime()) {
    return { text: `WhatsApp'tan saat verdi — ${new Date(c.callbackAt).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long", hour: "2-digit", minute: "2-digit" })} aranacak (onay mesajı otomatik gider).`, tone: "action" };
  }
  if (last?.direction === "in") return { text: "Çift yazdı — SİZ dönün (otomatik cevap yok).", tone: "you" };

  const calls = c.calls;
  const lastCall = calls[calls.length - 1];
  const waOut = (since: number) => msgs.some((m) => m.direction === "out" && m.channel === "whatsapp" && Date.parse(m.at) >= since);
  const offNote = callsEnabled ? "" : " (otomatik arama KAPALI — panelden başlatın)";

  // Toplu kampanya çiftleri: önce WhatsApp, arama sahibi açınca
  if (c.sourceRef === CAMPAIGN_REF && !calls.length) {
    const first = msgs.find((m) => m.direction === "out" && m.channel === "whatsapp");
    if (!first) return { text: "Kampanya WhatsApp sırasında (09:00–21:00, panelde ayarlı günlük sınır ve aralıkla).", tone: "wait" };
    const followSent = msgs.some((m) => m.direction === "out" && m.text.includes("fiyat listemize göz atabildiniz"));
    if (followSent) {
      const fu = followStepText(c, now);
      return { text: `Takip mesajı da gitti — cevap bekleniyor.${fu ? " " + fu : ""}`, tone: fu?.includes("şimdi") ? "action" : "wait" };
    }
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
      ? { text: /eski talep|kampanyası/i.test(c.note ?? "") ? "Arama sırasında — öğle (12–14) ya da akşam (18–20:30) saatinde aranacak. Ardından WhatsApp." : `1. arama ${when(nextCallSlot(now), now)}. Ardından WhatsApp.`, tone: "action" }
      : { text: "Aranmayı bekliyor — otomatik arama KAPALI (panelden başlatın). Aramadan WhatsApp gitmez.", tone: "you" };
  }
  const inAns = [...c.timeline].reverse().find((e) => e.type === "inbound");
  if (inAns && inAns.at > lastCall.at && lastCall.outcome === "no_answer") {
    return { text: "Bizi geri aradı, telefonda görüşüldü — otomatik tekrar arama yok. Gerekirse siz yazın / arayın.", tone: "you" };
  }
  const lastAt = Date.parse(lastCall.at);
  if (!waOut(lastAt)) {
    if (lastCall.outcome === "no_answer" && calls.length <= 2 && !msgs.some((m) => m.direction === "out" && m.text.includes("iki kez ulaşmaya"))) {
      return calls.length >= 2
        ? { text: "2. arama da açılmadı — hatırlatma WhatsApp'ı birkaç dakika içinde (09:00–21:00).", tone: "action" }
        : { text: "1. arama açılmadı — \"aradık, ulaşamadık\" WhatsApp'ı birkaç dakika içinde (09:00–21:00).", tone: "action" };
    }
    if (lastCall.outcome !== "no_answer")
      return { text: `Görüşüldü (${OUTCOME_LABEL[lastCall.outcome]}) — notlara göre WhatsApp birkaç dakika içinde.`, tone: "action" };
  }
  if (lastCall.outcome === "no_answer" && calls.length === 1) {
    return { text: `WhatsApp'a dönmezse 2. deneme bir sonraki uygun saatte (öğle 12–14 ya da akşam 18–20:30)${offNote}. Dönerse aranmayacak.`, tone: "wait" };
  }
  if (lastCall.outcome === "no_answer" && calls.every((x) => x.outcome === "no_answer") && !c.callsPaused) {
    if (calls.length === 2) return { text: `2 arama açılmadı — WhatsApp'a dönmezse 3. deneme ertesi gün öğle ya da akşam saatinde${offNote}.`, tone: "wait" };
    if (calls.length === 3) return { text: `3 arama açılmadı — son (4.) deneme ertesi gün öğle ya da akşam saatinde${offNote}.`, tone: "wait" };
  }
  if (lastCall.outcome === "no_answer") return { text: `${calls.length} arama açılmadı — bir daha aranmayacak. Takip WhatsApp'tan, cevap bekleniyor.`, tone: "done" };
  const inb = [...c.timeline].reverse().find((e) => e.type === "inbound" || e.type === "inbound_missed");
  if (inb?.type === "inbound_missed" && c.callbackRequested && inb.at > lastCall.at) {
    const at = nextCallSlot(new Date(Math.max(now.getTime(), Date.parse(c.callbackAt ?? "") || 0)));
    return { text: `Bizi geri aradı, açılmadı — asistan ${when(at, now)} geri arayacak${offNote}.`, tone: "action" };
  }
  if (lastCall.outcome === "callback_requested" || c.callbackRequested) {
    const at = nextCallSlot(new Date(Math.max(now.getTime(), Date.parse(c.callbackAt ?? "") || 0)));
    return { text: `Sonra arayın dedi — tekrar arama ${when(at, now)}${offNote}.`, tone: "action" };
  }
  const fu = followStepText(c, now);
  if (fu) return { text: `Teklif gitti, cevap bekleniyor. ${fu}`, tone: fu.includes("şimdi") ? "action" : "wait" };
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
          : `${callNo}. aramada görüşüldü (${OUTCOME_LABEL[e.x.outcome]})${n?.paket ? `, ilgilendiği paket: ${n.paket}` : ""}${n?.ekstralar ? `, ekstralar: ${n.ekstralar}` : ""}${n?.itiraz ? `, itirazı: ${n.itiraz}` : ""}${e.x.summary ? ` — özet: ${e.x.summary.split("\n")[0].replace(/\s+/g, " ").slice(0, 220)}` : ""}.`
      );
    } else if (e.m.direction === "out" && e.m.kind === "welcome" && e.m.channel === "whatsapp") {
      parts.push(e.m.text.startsWith("Tamamdır") ? "Çift WhatsApp'tan bu saati yazdı, onay mesajı gönderildi." : "WhatsApp'tan \"sizi 0312'li numaramızdan arayacağız\" haberi gönderildi.");
    } else if (e.m.direction === "out" && e.m.text.startsWith("[✓")) {
      parts.push("Çiftin mesajına ekibimiz telefondan cevap verdi.");
    } else if (e.m.direction === "out" && e.m.kind === "reply") {
      parts.push(`Ekibimiz WhatsApp'tan yazdı: "${e.m.text.replace(/\s+/g, " ").slice(0, 120)}".`);
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
  const busy = c.timeline.filter((e) => e.type === "busy").length;
  if (busy) parts.push(`Daha önce ${busy} kez aradığımızda hat meşguldü.`);
  const lastIn = [...c.timeline].reverse().find((e) => e.type === "inbound" || e.type === "inbound_missed");
  if (lastIn?.type === "inbound") parts.push("Çift bizi geri aradı ve ekibimizle telefonda görüştü.");
  const missedIn = lastIn?.type === "inbound_missed" && c.callbackRequested && !c.calls.some((x) => x.at > lastIn.at);
  if (missedIn) parts.push('Çift az önce bizi GERİ ARADI ama açılamadı; kimlik teyidinden sonra "bizi aramışsınız, hemen dönüyorum" diye başla.');
  const cb = [...c.timeline].reverse().find((e) => e.type === "callback");
  if (cb && c.callbackRequested && !missedIn) parts.push(`Çift bu saatte aranmak istemişti — ${cb.text.replace(/^Tekrar arama zamanı: /, "")}; "istediğiniz saatte arıyorum" diye başla.`);
  // WhatsApp'tan teklif zaten gittiyse (ve ondan sonra telefonda konuşulmadıysa) asistan teklifi baştan anlatmasın
  const offer = c.messages.find((m) => m.direction === "out" && m.channel === "whatsapp" && /TL/.test(m.text) && !m.text.startsWith("["));
  if (offer && !c.calls.some((x) => x.outcome !== "no_answer" && x.at > offer.at)) {
    const d = new Date(offer.at).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long" });
    parts.push(`TEKLİF ZATEN GÖNDERİLDİ: ${d} tarihinde WhatsApp'tan 2027 fiyatlarımız ve teklifimiz gitti.`);
  }
  const dg = (c.note ?? "").match(/Düğün.com yazışma: [^·]+/);
  if (dg) parts.push(dg[0].trim() + " — bunu bildiğini belli et, sorusu varsa cevapla.");
  if (isFollowCallDue(c, new Date())) parts.push(followCallNote(c, new Date()));
  const dedup = parts.filter((p, i) => p !== parts[i - 1]);
  return dedup.length ? dedup.join(" ") : "İlk temas — daha önce görüşülmedi.";
}
