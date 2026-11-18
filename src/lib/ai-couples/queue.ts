/**
 * "Şimdi ne yapılmalı?" kuyruğu — n8n her 5–10 dakikada bir sorar.
 * Kuyruk yalnızca KURALLARA UYAN işleri döndürür; kara liste, saat dışı,
 * arama hakkı dolmuş çiftler hiç görünmez.
 */
import { siteConfig } from "@/config/site";
import type { AiCouple, AiQueueAction } from "@/types/ai-couples";
import { getCapacityForDate, readCapacityConfig } from "@/lib/ai-couples/capacity";
import {
  buildCatalogMessage,
  buildFollowUpMessage,
  canContact,
  isFollowUpDue,
} from "@/lib/ai-couples/rules";
import { readCouples } from "@/lib/ai-couples/store";

export const CATALOG_LINKS = {
  packages: `${siteConfig.url}/paket-olustur`,
  gallery: `${siteConfig.url}/galeri`,
};

function catalogPending(c: AiCouple): boolean {
  const lastInfoCall = [...c.calls].reverse().find((x) => x.outcome === "info_requested");
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
      reason: "Telefonda bilgi istedi",
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
  const callable = couples
    .filter((c) => (c.status === "new" || c.callbackRequested) && canContact(c, "call", now).allowed)
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
      reason: c.callbackRequested ? "Tekrar aranmak istedi" : "Yeni talep",
    });
  }

  return actions.slice(0, limit);
}
