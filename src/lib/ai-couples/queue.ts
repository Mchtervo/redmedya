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
  isSecondCallDue,
  isFollowUpDue,
} from "@/lib/ai-couples/rules";
import { readCouples } from "@/lib/ai-couples/store";
import { historyForAgent } from "@/lib/ai-couples/journey";
import { selamFor } from "@/lib/ai-couples/hitap";
import { buildDepositReminder, buildThinkingNudge, isDepositReminderDue, isThinkingNudgeDue } from "@/lib/ai-couples/nudges";

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
export const CAMPAIGN_CALLS_ENABLED = false;

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

export function callPriority(c: AiCouple, now: Date): number {
  const fresh = !c.calls.length && c.status === "new" && now.getTime() - Date.parse(c.createdAt) < FRESH_LEAD_MS;
  if (fresh) return 0;
  if ((c.busyRetries ?? 0) > 0 && isCallbackDue(c, now)) return 0; // meşgul çıkan yeni çift: hemen tekrar
  if (isSecondCallDue(c, now) || isCallbackDue(c, now)) return 1;
  if (isFollowUpCallDue(c, now)) return 2;
  return 3;
}

export async function buildQueue(now = new Date(), limit = 20): Promise<AiQueueAction[]> {
  const [couples, cfg] = await Promise.all([readCouples(), readCapacityConfig()]);
  const actions: AiQueueAction[] = [];

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
  for (const c of couples) {
    if (!canContact(c, "whatsapp", now).allowed) continue;
    if (isDepositReminderDue(c, now)) {
      actions.push({ type: "whatsapp", kind: "other", coupleId: c.id, name: c.name, phone: c.phone, text: buildDepositReminder(c), reason: "Tarih tuttu — kapora hatırlatması" });
    } else if (isThinkingNudgeDue(c, now)) {
      const cap = await getCapacityForDate(c.weddingDate, cfg);
      actions.push({ type: "whatsapp", kind: "other", coupleId: c.id, name: c.name, phone: c.phone, text: buildThinkingNudge(c, cap), reason: "Düşünüyor — 3. gün hatırlatma" });
    }
  }

  // 3) Aranacaklar: yeni gelenler (eskiden yeniye) + "tekrar arayın" diyenler
  const months = await upcomingCapacity(14, cfg);
  const callable = couples
    .filter((c) => !(c.sourceRef && CAMPAIGN_REFS.has(c.sourceRef) && !CAMPAIGN_CALLS_ENABLED))
    .filter((c) => (c.status === "new" || isCallbackDue(c, now) || isFollowUpCallDue(c, now) || isSecondCallDue(c, now)) && canContact(c, "call", now).allowed)
    // Öncelik: rakiplerden önce ulaşmak için
    //  0) Son 48 saatte gelen, hiç aranmamış YENİ talepler — en uzun bekleyen önce
    //  1) 2. arama zamanı gelenler / "tekrar arayın" diyenler
    //  2) "Düşüneyim" dedi, 1 hafta doldu
    //  3) Daha eski, hiç aranmamış talepler
    .sort((a, b) => callPriority(a, now) - callPriority(b, now) || a.createdAt.localeCompare(b.createdAt));
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
      history: historyForAgent(c),
      followUp: isFollowUpCallDue(c, now),
      reason: isSecondCallDue(c, now)
        ? "1. arama açılmadı, WhatsApp’a da dönmedi — 2. (son) arama"
        : isFollowUpCallDue(c, now)
        ? "Düşüneyim dedi — 1 hafta sonra tekrar arama"
        : (c.busyRetries ?? 0) > 0
          ? `Hat meşguldü — tekrar deneme (${c.busyRetries}/2)`
          : c.callbackRequested
          ? "Tekrar aranmak istedi"
          : "Yeni talep",
    });
  }

  return actions.slice(0, limit);
}
