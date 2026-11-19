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
  isSecondCallDue,
  isFollowUpDue,
} from "@/lib/ai-couples/rules";
import { readCouples } from "@/lib/ai-couples/store";

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

  // 3) Aranacaklar: yeni gelenler (eskiden yeniye) + "tekrar arayın" diyenler
  const months = await upcomingCapacity(14, cfg);
  const callable = couples
    .filter((c) => !(c.sourceRef && CAMPAIGN_REFS.has(c.sourceRef) && !CAMPAIGN_CALLS_ENABLED))
    .filter((c) => (c.status === "new" || c.callbackRequested || isFollowUpCallDue(c, now) || isSecondCallDue(c, now)) && canContact(c, "call", now).allowed)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
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
      followUp: isFollowUpCallDue(c, now),
      reason: isSecondCallDue(c, now)
        ? "1. arama açılmadı, WhatsApp’a da dönmedi — 2. (son) arama"
        : isFollowUpCallDue(c, now)
        ? "Düşüneyim dedi — 1 hafta sonra tekrar arama"
        : c.callbackRequested
          ? "Tekrar aranmak istedi"
          : "Yeni talep",
    });
  }

  return actions.slice(0, limit);
}
