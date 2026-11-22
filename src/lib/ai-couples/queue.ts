/**
 * "Şimdi ne yapılmalı?" kuyruğu — n8n her 5–10 dakikada bir sorar.
 * Kuyruk yalnızca KURALLARA UYAN işleri döndürür; kara liste, saat dışı,
 * arama hakkı dolmuş çiftler hiç görünmez.
 */
import { siteConfig } from "@/config/site";
import type { AiCouple, AiQueueAction } from "@/types/ai-couples";
import { capacitySpeech, getCapacityForDate, monthKeyOf, readCapacityConfig, upcomingCapacity } from "@/lib/ai-couples/capacity";
import {
  buildCatalogMessage,
  buildFollowUpMessage,
  canContact,
  isFollowUpCallDue,
  isCallbackDue,
  isWithinCallWindow,
  isGoodCallWindow,
  INSTAGRAM_URL,
  isSecondCallDue,
  isFollowUpDue,
} from "@/lib/ai-couples/rules";
import { readCouples } from "@/lib/ai-couples/store";
import { historyForAgent } from "@/lib/ai-couples/journey";
import { hitapFor, selamFor } from "@/lib/ai-couples/hitap";
import { buildDepositReminder, buildThinkingNudge, isDepositReminderDue, isThinkingNudgeDue } from "@/lib/ai-couples/nudges";
import { buildFollowLast, buildFollowMsg, buildFollowMsg2, isFollowCallDue, isFollowLastDue, isFollowMsg2Due, isFollowMsgDue } from "@/lib/ai-couples/followup";
import { readAutomation } from "@/lib/ai-couples/automation";

export const CATALOG_PDF = `${siteConfig.url}/redmedia-2027-fiyat-listesi.pdf`;

export const CATALOG_LINKS = {
  packages: `${siteConfig.url}/paket-olustur`,
  gallery: `${siteConfig.url}/galeri`,
};

/** Görüşmede "WhatsApp ekibimiz dönecek" denen sonuçlar → fiyat listesi gider. */
const CATALOG_OUTCOMES = new Set(["info_requested", "offer_requested", "thinking"]);

/** Toplu kampanya çiftlerine katalog, kampanya akışından (aramaya göre kişiselleştirilmiş) gider. */
export const CAMPAIGN_REFS = new Set(["kampanya-2027"]);
/** Kampanya çiftleri sahibi "aramaları başlat" diyene kadar ARANMAZ (yeni gelen talepler aranır). */
export const CAMPAIGN_CALLS_ENABLED = true; // sahibi 19.11.2026: Düğün.com listesi de aransın

/**
 * Arama sonrası WhatsApp artık n8n "RM K" akışından, aramanın notlarına göre kişisel gidiyor.
 * Eski genel katalog mesajı kapalı (aynı çifte iki mesaj gitmesin).
 */
export const CATALOG_VIA_PERSONAL_FLOW = true;

function catalogPending(c: AiCouple): boolean {
  if (CATALOG_VIA_PERSONAL_FLOW) return false;
  if (c.sourceRef && CAMPAIGN_REFS.has(c.sourceRef)) return false;
  const lastInfoCall = [...c.calls].reverse().find((x) => CATALOG_OUTCOMES.has(x.outcome));
  if (!lastInfoCall) return false;
  return !c.messages.some(
    (m) => m.kind === "catalog" && m.direction === "out" && m.at >= lastInfoCall.at
  );
}

/** Yeni talebin "taze" sayıldığı süre: bu süre içinde gelenler en önce aranır */
export const FRESH_LEAD_MS = 48 * 3600 * 1000;

/** Sonradan panele aktarılan eski talep (Düğün.com geçmişinden) "yeni gelen" sayılmaz */
const isBackfill = (c: AiCouple) => /eski talep|kampanyası/i.test(c.note ?? "") || (c.sourceRef !== undefined && CAMPAIGN_REFS.has(c.sourceRef));

/** Gerçekten yeni gelen talep (son 2 saat, hiç aranmamış) — 1 saat içinde aranmalı */
export function isUrgentLead(c: AiCouple, now: Date): boolean {
  return !c.calls.length && c.status === "new" && !isBackfill(c) && now.getTime() - Date.parse(c.createdAt) < 2 * 3600_000;
}

/** Yeni form / web talebine aramadan önce WhatsApp haberi gitmeli mi? (henüz aranmamış, hiç yazılmamış, son 12 saatte gelmiş) */
function needsPreCallNotice(c: AiCouple, now: Date): boolean {
  if (c.source !== "meta_form" && c.source !== "web") return false;
  if (c.status !== "new" || c.calls.length || c.contactLocked || c.messagesPaused) return false;
  if (c.messages.some((m) => m.direction === "out")) return false;
  return now.getTime() - Date.parse(c.createdAt) < 12 * 3600_000;
}

export function callPriority(c: AiCouple, now: Date): number {
  if (isUrgentLead(c, now)) return -1; // EN ÖNCE: yeni gelen (Düğün.com / Instagram / Facebook / web)
  const fresh = !c.calls.length && c.status === "new" && !isBackfill(c) && now.getTime() - Date.parse(c.createdAt) < FRESH_LEAD_MS;
  if (fresh) return 0;
  if ((c.busyRetries ?? 0) > 0 && isCallbackDue(c, now)) return 0; // meşgul çıkan yeni çift: hemen tekrar
  if (isSecondCallDue(c, now) || isCallbackDue(c, now)) return 1;
  if (isFollowUpCallDue(c, now) || isFollowCallDue(c, now)) return 2;
  return 3;
}

export async function buildQueue(now = new Date(), limit = 20): Promise<AiQueueAction[]> {
  const [all, cfg] = await Promise.all([readCouples(), readCapacityConfig(), readAutomation()]); // readAutomation: takip günlerini yükler
  // Panelden açılan test çiftleri (sourceRef "test") otomatik aranmaz, hatırlatma almaz
  const couples = all.filter((c) => c.sourceRef !== "test");
  const actions: AiQueueAction[] = [];

  // 0) Yeni form / web talebi: aramadan ÖNCE WhatsApp'tan haber ver (numarayı tanısın → açma ihtimali artar).
  //    Gece geldiyse "sabah arayacağız". Düğün.com talebine aynı işi Düğün.com SMS'i yapıyor.
  const night = !isWithinCallWindow(now);
  for (const c of couples) {
    if (!needsPreCallNotice(c, now)) continue;
    const h = hitapFor(c.name).hitap;
    const hi = `Merhaba${h ? " " + h : ""}, RedMedia ekibindenim. Talebiniz bize ulaştı, teşekkür ederiz 🤍`;
    actions.push({
      type: "whatsapp",
      kind: "welcome",
      night: true,
      coupleId: c.id,
      name: c.name,
      phone: c.phone,
      text: night
        ? `${hi} Sabah 09:30'dan itibaren sizi 0312 963 23 47 numaramızdan arayıp tarihinizin müsaitliğini ve fiyatlarımızı ileteceğiz. Size uygun bir saat varsa buraya yazmanız yeterli, o saatte arayalım.\n\nÇalışmalarımız: ${INSTAGRAM_URL}`
        : `${hi} Birkaç dakika içinde sizi 0312 963 23 47 numaramızdan arayıp tarihinizin müsaitliğini ve fiyatlarımızı ileteceğiz. Şu an müsait değilseniz uygun saati buraya yazmanız yeterli, o saatte arayalım.\n\nÇalışmalarımız: ${INSTAGRAM_URL}`,
      reason: night ? "Gece gelen form talebi — anında karşılama" : "Yeni form talebi — aramadan önce haber",
    });
  }

  // 0b) WhatsApp'tan "şu saatte arayın" yazan çifte onay ("Tamamdır, o saatte arıyoruz")
  for (const c of couples) {
    const cb = [...c.timeline].reverse().find((e) => e.type === "callback");
    if (!cb || !cb.text.includes("WhatsApp'tan yazdı") || !c.callbackRequested || !c.callbackAt) continue;
    if (Date.parse(c.callbackAt) <= now.getTime() || c.messagesPaused || c.contactLocked) continue;
    if (c.messages.some((m) => m.direction === "out" && m.at >= cb.at)) continue;
    const label = new Date(c.callbackAt).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
    actions.push({ type: "whatsapp", kind: "welcome", night: true, coupleId: c.id, name: c.name, phone: c.phone, text: `Tamamdır, ${label} civarında sizi 0312 963 23 47 numaramızdan arıyoruz 🤍`, reason: "WhatsApp'tan saat verdi — onay" });
  }

  // 1) Bilgi isteyen çifte katalog (en acil)
  for (const c of couples) {
    if (!catalogPending(c) || !canContact(c, "whatsapp", now).allowed) continue;
    actions.push({
      type: "whatsapp",
      kind: "catalog",
      coupleId: c.id,
      name: c.name,
      phone: c.phone,
      text: buildCatalogMessage(c, CATALOG_LINKS),
      mediaUrl: CATALOG_PDF,
      fileName: "RedMedia-2027-Fiyat-Listesi.pdf",
      reason: "Görüşme sonrası fiyat listesi",
    });
  }

  // 2) 7. gün takip mesajları
  for (const c of couples) {
    if (!isFollowUpDue(c, now) || !canContact(c, "whatsapp", now).allowed) continue;
    const cap = await getCapacityForDate(c.weddingDate, cfg);
    actions.push({
      type: "whatsapp",
      kind: "follow_up",
      coupleId: c.id,
      name: c.name,
      phone: c.phone,
      text: buildFollowUpMessage(c, cap),
      reason: "Ilık — 7 gün doldu",
    });
  }

  // 2b) Kapora hatırlatması ("tarihi tutalım" dedi, ~20 saat geçti) ve "düşüneyim" diyene 3. gün hatırlatması
  // WhatsApp kısıtlanmasın: otomatik hatırlatmalar arası en az 10 dk, günde en fazla 15 (kampanya ve sahibinin cevapları hariç)
  const autoOut = couples.flatMap((c) => c.messages.filter((m) => m.direction === "out" && m.channel === "whatsapp" && m.kind === "other" && !m.text.startsWith("[")).map((m) => Date.parse(m.at)));
  const lastAuto = autoOut.length ? Math.max(...autoOut) : 0;
  const todayStart = new Date(new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" }) + "T00:00:00+03:00").getTime();
  const reminderRoom = now.getTime() - lastAuto >= 10 * 60_000 && autoOut.filter((t) => t >= todayStart).length < 15;
  for (const c of couples) {
    if (!reminderRoom) break;
    if (!canContact(c, "whatsapp", now).allowed) continue;
    if (isDepositReminderDue(c, now)) {
      actions.push({ type: "whatsapp", kind: "other", coupleId: c.id, name: c.name, phone: c.phone, text: buildDepositReminder(c), reason: "Tarih tuttu — kapora hatırlatması" });
    } else if (isThinkingNudgeDue(c, now)) {
      const cap = await getCapacityForDate(c.weddingDate, cfg);
      actions.push({ type: "whatsapp", kind: "other", coupleId: c.id, name: c.name, phone: c.phone, text: buildThinkingNudge(c, cap), reason: "Düşünüyor — 3. gün hatırlatma" });
    } else if (isFollowMsgDue(c, now)) {
      const cap = await getCapacityForDate(c.weddingDate, cfg);
      actions.push({ type: "whatsapp", kind: "other", coupleId: c.id, name: c.name, phone: c.phone, text: buildFollowMsg(c, cap, now), reason: "Teklif sonrası cevap yok — hatırlatma (tarih + fiyat + %40 zam)" });
    } else if (isFollowMsg2Due(c, now)) {
      const cap = await getCapacityForDate(c.weddingDate, cfg);
      actions.push({ type: "whatsapp", kind: "other", coupleId: c.id, name: c.name, phone: c.phone, text: buildFollowMsg2(c, cap), reason: "WhatsApp'ı tercih etti, cevap yok — 2. hatırlatma" });
    } else if (isFollowLastDue(c, now)) {
      const cap = await getCapacityForDate(c.weddingDate, cfg);
      actions.push({ type: "whatsapp", kind: "other", coupleId: c.id, name: c.name, phone: c.phone, text: buildFollowLast(c, cap), reason: "Teklif sonrası cevap yok — son mesaj" });
    }
  }

  // 3) Aranacaklar: yeni gelenler (eskiden yeniye) + "tekrar arayın" diyenler
  const months = await upcomingCapacity(14, cfg);
  const testCallbacks = all.filter((c) => c.sourceRef === "test" && isCallbackDue(c, now));
  const callable = [...couples, ...testCallbacks]
    .filter((c) => !c.callsPaused)
    // WhatsApp'tan son 24 saatte yazan çift yazışmanın içinde: kendisi saat istemediyse ARAMA (WhatsApp'tan devam)
    .filter((c) => isCallbackDue(c, now) || !c.messages.some((m) => m.direction === "in" && m.channel !== "instagram" && now.getTime() - Date.parse(m.at) < 24 * 3600_000)) // Instagram DM: aranmak için numara verdi → arama engellenmez
    // Yeni gelen talep, meşgul tekrarı ve müşterinin istediği saat HEMEN; eski liste / takip / tekrar denemeler sadece "iyi saat"te (öğle 12–14, akşam 18–20:30)
    .filter((c) => callPriority(c, now) <= 0 || isCallbackDue(c, now) || isGoodCallWindow(now))
    .filter((c) => !needsPreCallNotice(c, now) || now.getTime() - Date.parse(c.createdAt) > 4 * 60_000) // önce "birazdan arıyoruz" WhatsApp'ı
    .filter((c) => !(c.sourceRef && CAMPAIGN_REFS.has(c.sourceRef) && !CAMPAIGN_CALLS_ENABLED) || isFollowCallDue(c, now) || isFollowUpCallDue(c, now) || isCallbackDue(c, now) || isSecondCallDue(c, now))
    .filter((c) => (c.status === "new" || (CAMPAIGN_CALLS_ENABLED && c.sourceRef !== undefined && CAMPAIGN_REFS.has(c.sourceRef) && !c.calls.length) || isCallbackDue(c, now) || isFollowUpCallDue(c, now) || isSecondCallDue(c, now) || isFollowCallDue(c, now)) && canContact(c, "call", now).allowed)
    // Öncelik: rakiplerden önce ulaşmak için
    //  0) Son 48 saatte gelen, hiç aranmamış YENİ talepler — en uzun bekleyen önce
    //  1) 2. arama zamanı gelenler / "tekrar arayın" diyenler
    //  2) "Düşüneyim" dedi, 1 hafta doldu
    //  3) Daha eski, hiç aranmamış talepler
    // Aynı öncelikte: yeni gelenlerde en yeni talep önce (sıcakken), diğerlerinde en uzun bekleyen önce
    // Aynı öncelikte: talebi EN YENİ olan önce (kaynağındaki gerçek talep tarihi; yoksa panele giriş tarihi) — sıcak olan önce aranır
    .sort((a, b) => callPriority(a, now) - callPriority(b, now) || (b.leadAt ?? b.createdAt).localeCompare(a.leadAt ?? a.createdAt));
  for (const c of callable) {
    actions.push({
      type: "call",
      coupleId: c.id,
      name: c.name,
      phone: c.phone,
      weddingDate: c.weddingDate,
      source: c.source,
      capacity: await getCapacityForDate(c.weddingDate, cfg),
      capacitySpeech: capacitySpeech(months, monthKeyOf(c.weddingDate)),
      selam: selamFor(c.name),
      // Son arama sonucu / meşgul kaydı zamanı: n8n "arama sürüyor" kilidini buna göre açar
      lastResultAt: [c.calls.at(-1)?.at, [...c.timeline].reverse().find((e) => e.type === "busy")?.at].filter(Boolean).sort().at(-1),
      history: historyForAgent(c),
      urgent: isUrgentLead(c, now) || undefined,
      followUp: isFollowUpCallDue(c, now),
      reason: isSecondCallDue(c, now)
        ? `${c.calls.length} arama açılmadı, WhatsApp’a da dönmedi — ${c.calls.length + 1}. deneme (farklı saat)`
        : isFollowUpCallDue(c, now)
        ? "Düşüneyim dedi — 1 hafta sonra tekrar arama"
        : (c.busyRetries ?? 0) > 0
          ? `Hat meşguldü — tekrar deneme (${c.busyRetries}/2)`
          : c.callbackRequested
          ? "Tekrar aranmak istedi"
          : "Yeni talep",
    });
  }

  // Aramalar ve WhatsApp işleri ayrı sınırlanır: çok WhatsApp birikince aramalar (yeni talepler dahil) listeden düşmesin
  const calls = actions.filter((a) => a.type === "call").slice(0, limit);
  const others = actions.filter((a) => a.type !== "call").slice(0, limit);
  return [...others, ...calls];
}
