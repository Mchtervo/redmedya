import type { BundleDiscount, ServiceItem } from "@/types/cms";
import type { SeasonalRule } from "@/types/site-settings";
import type { SelectedLineItem } from "@/stores/package-store";

import { buyukAlbumPageOptionLabel, type BuyukAlbumPages } from "@/config/albums";
import { DRONE_GIFT_OCCASION_ID } from "@/config/occasions";
import { isCampaignKlipId } from "@/config/campaign-klips";

export const DRONE_GIFT_SERVICE_ID = "drone-dis-cekim";
export const FOTO_DIS_CEKIM_ID = `foto-${DRONE_GIFT_OCCASION_ID}`;
export const VIDEO_DIS_CEKIM_ID = `video-${DRONE_GIFT_OCCASION_ID}`;

function hasAlbumInSelection(
  services: ServiceItem[],
  selectedIds: string[],
  serviceQuantities: Record<string, number>
): boolean {
  return services.some(
    (s) =>
      s.category === "album" &&
      isServiceSelected(s, selectedIds, serviceQuantities)
  );
}

/** 20 sayfa = taban fiyatın %150'si */
export function pagePriceMultiplier(pages: number): number {
  return pages >= 20 ? 1.5 : 1;
}

export function lineTotalFor(
  service: ServiceItem,
  quantity: number,
  pages?: number
): number {
  if (service.pricingType === "quantity") {
    return quantity * (Number(service.unitPrice) || 0);
  }
  if (service.pricingType === "pages") {
    const base = Number(service.price) || 0;
    const p = pages ?? 10;
    return Math.round(base * pagePriceMultiplier(p));
  }
  return Number(service.price) || 0;
}

export function isServiceSelected(
  service: ServiceItem,
  selectedIds: string[],
  serviceQuantities: Record<string, number>
): boolean {
  if (service.pricingType === "quantity") {
    return (serviceQuantities[service.id] ?? 0) > 0;
  }
  return selectedIds.includes(service.id);
}

/** Dış çekim foto + video + en az bir albüm → drone hediye */
export function qualifiesForDroneGift(
  services: ServiceItem[],
  selectedIds: string[],
  serviceQuantities: Record<string, number>
): boolean {
  const hasDisFoto = selectedIds.includes(FOTO_DIS_CEKIM_ID);
  const hasDisVideo = selectedIds.includes(VIDEO_DIS_CEKIM_ID);
  const hasAlbum = hasAlbumInSelection(
    services,
    selectedIds,
    serviceQuantities
  );
  return hasDisFoto && hasDisVideo && hasAlbum;
}

/** Koşul sağlanınca drone'u seçime ekler; sağlanmıyorsa hediye drone'u kaldırır */
export function syncDroneGiftSelection(
  services: ServiceItem[],
  selectedIds: string[],
  serviceQuantities: Record<string, number>
): string[] {
  const eligible = qualifiesForDroneGift(
    services,
    selectedIds,
    serviceQuantities
  );
  const hasDrone = selectedIds.includes(DRONE_GIFT_SERVICE_ID);

  if (eligible && !hasDrone) {
    return [...selectedIds, DRONE_GIFT_SERVICE_ID];
  }
  return selectedIds;
}

export function lineItemExcludesBundleDiscount(item: SelectedLineItem): boolean {
  return Boolean(
    item.excludeFromBundleDiscount ||
      isCampaignKlipId(item.id) ||
      item.isCampaignPrice
  );
}

export function computeLineItems(
  services: ServiceItem[],
  selectedIds: string[],
  serviceQuantities: Record<string, number>,
  servicePages: Record<string, number> = {},
  campaignPricedIds: string[] = []
): SelectedLineItem[] {
  const lines: SelectedLineItem[] = [];
  const droneGift = qualifiesForDroneGift(services, selectedIds, serviceQuantities);

  for (const s of services) {
    if (s.pricingType === "quantity") {
      const quantity = serviceQuantities[s.id] ?? 0;
      if (quantity > 0) {
        const lineTotal = lineTotalFor(s, quantity);
        const name =
          quantity > 1 ? `${s.name} (${quantity} adet)` : `${s.name} (1 adet)`;
        lines.push({ ...s, name, quantity, lineTotal });
      }
      continue;
    }
    if (s.pricingType === "pages" && selectedIds.includes(s.id)) {
      const pages = servicePages[s.id] ?? s.pageOptions?.[0] ?? 10;
      const lineTotal = lineTotalFor(s, 1, pages);
      lines.push({
        ...s,
        name: `${s.name} (${buyukAlbumPageOptionLabel(pages as BuyukAlbumPages)})`,
        quantity: 1,
        lineTotal,
        selectedPages: pages,
      });
      continue;
    }
    if (selectedIds.includes(s.id)) {
      const listTotal = lineTotalFor(s, 1);
      const isGift = droneGift && s.id === DRONE_GIFT_SERVICE_ID;
      const isCampaignPrice =
        campaignPricedIds.includes(s.id) &&
        s.campaignPrice != null &&
        s.campaignPrice > 0;
      const lineTotal = isGift
        ? 0
        : isCampaignPrice
          ? Number(s.campaignPrice)
          : listTotal;
      lines.push({
        ...s,
        quantity: 1,
        lineTotal,
        isGift,
        isCampaignPrice,
        originalLineTotal: isGift || isCampaignPrice ? listTotal : undefined,
        excludeFromBundleDiscount:
          Boolean(s.excludeFromBundleDiscount) || isCampaignKlipId(s.id),
      });
    }
  }
  return lines;
}

export function computeSelectedCount(
  services: ServiceItem[],
  selectedIds: string[],
  serviceQuantities: Record<string, number>
): number {
  let count = 0;
  for (const s of services) {
    if (isServiceSelected(s, selectedIds, serviceQuantities)) count += 1;
  }
  return count;
}

/** Tek kademe: en az 1 hizmette sabit yüzde (varsayılan %20) */
export function calcBundleDiscount(
  count: number,
  subtotal: number,
  tiers: BundleDiscount[]
) {
  if (count < 1 || subtotal <= 0) return { percent: 0, amount: 0 };
  const tier = [...tiers]
    .sort((a, b) => b.minServices - a.minServices)
    .find((b) => count >= b.minServices);
  if (!tier) return { percent: 0, amount: 0 };
  const amount = Math.round(subtotal * (tier.percent / 100));
  return { percent: tier.percent, amount };
}

export function computePackageTotals(
  services: ServiceItem[],
  selectedIds: string[],
  serviceQuantities: Record<string, number>,
  bundleDiscounts: BundleDiscount[],
  coupon: { type: "PERCENTAGE" | "FIXED"; value: number } | null,
  servicePages: Record<string, number> = {},
  campaignPricedIds: string[] = [],
  weddingDate = "",
  seasonalRules: SeasonalRule[] = []
) {
  const lineItems = computeLineItems(
    services,
    selectedIds,
    serviceQuantities,
    servicePages,
    campaignPricedIds
  );
  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountableSubtotal = lineItems
    .filter((item) => !lineItemExcludesBundleDiscount(item))
    .reduce((sum, item) => sum + item.lineTotal, 0);
  const count = computeSelectedCount(services, selectedIds, serviceQuantities);
  const bundle = calcBundleDiscount(count, discountableSubtotal, bundleDiscounts);
  const afterBundle = subtotal - bundle.amount;
  const droneGiftActive = qualifiesForDroneGift(
    services,
    selectedIds,
    serviceQuantities
  );
  const droneGiftClaimed = lineItems.some(
    (l) => l.id === DRONE_GIFT_SERVICE_ID && l.isGift
  );

  let couponDiscount = 0;
  if (coupon && afterBundle > 0) {
    if (coupon.type === "PERCENTAGE") {
      couponDiscount = Math.round(afterBundle * (coupon.value / 100));
    } else {
      couponDiscount = Math.min(coupon.value, afterBundle);
    }
  }

  /** Sepet fiyatına sezon farkı uygulanmaz (admin ayarı yalnızca bilgi amaçlı kalabilir) */
  const seasonalPercent = 0;
  const seasonalSurcharge = 0;
  void weddingDate;
  void seasonalRules;

  const total = Math.max(0, subtotal - bundle.amount - couponDiscount);
  const giftSavings = lineItems.reduce(
    (sum, l) => sum + (l.isGift ? (l.originalLineTotal ?? 0) : 0),
    0
  );
  const bundleExcludedTotal = subtotal - discountableSubtotal;

  const campaignKlipLines = lineItems.filter(
    (l) => l.isCampaignPrice && (l.originalLineTotal ?? 0) > l.lineTotal
  );
  const campaignKlipSavings = campaignKlipLines.reduce(
    (sum, l) => sum + ((l.originalLineTotal ?? 0) - l.lineTotal),
    0
  );
  /** Sepet indirimi + kampanya klip list fiyat farkı + hediye drone */
  const totalSavings = Math.max(
    0,
    bundle.amount + couponDiscount + campaignKlipSavings + giftSavings
  );

  return {
    lineItems,
    subtotal,
    discountableSubtotal,
    bundleExcludedTotal,
    count,
    bundle,
    couponDiscount,
    total,
    droneGiftActive,
    droneGiftClaimed,
    giftSavings,
    campaignKlipLines,
    campaignKlipSavings,
    totalSavings,
    seasonalSurcharge,
    seasonalPercent,
  };
}

/** Store ve hook'lar için tek kaynak */
export function getPackagePricingSnapshot(state: {
  services: ServiceItem[];
  selectedIds: string[];
  serviceQuantities: Record<string, number>;
  servicePages: Record<string, number>;
  campaignPricedIds: string[];
  bundleDiscounts: BundleDiscount[];
  coupon: { type: "PERCENTAGE" | "FIXED"; value: number } | null;
  weddingDate?: string;
  seasonalRules?: SeasonalRule[];
}) {
  return computePackageTotals(
    state.services,
    state.selectedIds,
    state.serviceQuantities,
    state.bundleDiscounts,
    state.coupon,
    state.servicePages,
    state.campaignPricedIds,
    state.weddingDate ?? "",
    state.seasonalRules ?? []
  );
}
