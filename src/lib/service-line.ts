import type { ServiceItem } from "@/types/cms";
import type { LeadLineDetail } from "@/types/reservations";
import {
  AILE_ALBUM_ID,
  BUYUK_ALBUM_ID,
  buyukAlbumFullLineLabel,
  buyukAlbumPageOptionLabel,
  type BuyukAlbumPages,
} from "@/config/albums";
import { lineTotalFor, pagePriceMultiplier } from "@/lib/package-pricing";

const DEFAULT_AILE_UNIT = 1000;
const DEFAULT_BUYUK_BASE = 2500;

export function serviceItemToLineDetail(
  service: ServiceItem,
  variant?: number
): LeadLineDetail {
  if (service.pricingType === "quantity") {
    const max = service.maxQuantity ?? 2;
    const qty = Math.min(Math.max(1, variant ?? 1), max);
    const unit = Number(service.unitPrice) || DEFAULT_AILE_UNIT;
    return {
      serviceId: service.id,
      label: service.name,
      quantity: qty,
      unitPrice: unit,
      price: unit * qty,
    };
  }

  if (service.pricingType === "pages") {
    const pages = variant === 20 ? 20 : 10;
    const base = Number(service.price) || DEFAULT_BUYUK_BASE;
    const price = lineTotalFor(service, 1, pages);
    return {
      serviceId: service.id,
      label: buyukAlbumFullLineLabel(pages),
      selectedPages: pages,
      listPrice: base,
      price,
    };
  }

  const useCampaign =
    service.campaignPrice != null && service.campaignPrice < service.price;
  const price = useCampaign ? service.campaignPrice! : service.price;
  return {
    serviceId: service.id,
    label: service.name,
    price,
    listPrice: useCampaign ? service.price : undefined,
    quantity: 1,
  };
}

/** Satırda görünen adet (eski kayıtlarda fiyattan tahmin) */
export function resolveLineQuantity(line: LeadLineDetail): number {
  if (line.quantity != null && line.quantity > 0) return line.quantity;
  const fromLabel = line.label.match(/\((\d+)\s*adet\)/i);
  if (fromLabel) return Number(fromLabel[1]) || 1;
  if (line.serviceId === AILE_ALBUM_ID) {
    const unit = line.unitPrice ?? DEFAULT_AILE_UNIT;
    if (line.price > 0 && unit > 0) return Math.round(line.price / unit);
  }
  return line.price > 0 ? 1 : 0;
}

export function resolveLinePages(line: LeadLineDetail): 10 | 20 {
  if (line.selectedPages === 20) return 20;
  if (line.selectedPages === 10) return 10;
  const fromYaprak = line.label.match(/(\d+)\s*yaprak\s*(\d+)\s*sayfa/i);
  if (fromYaprak) {
    const sayfa = Number(fromYaprak[2]);
    return sayfa >= 20 ? 20 : 10;
  }
  const fromLabel = line.label.match(/\((\d+)\s*sayfa\)/i);
  if (fromLabel) {
    const n = Number(fromLabel[1]);
    return n >= 20 ? 20 : 10;
  }
  if (line.serviceId === BUYUK_ALBUM_ID && line.listPrice && line.price > 0) {
    const ratio = line.price / line.listPrice;
    if (ratio >= 1.45) return 20;
  }
  return 10;
}

export function buyukAlbumPriceFromBase(base: number, pages: 10 | 20): number {
  return Math.round(base * pagePriceMultiplier(pages));
}

export function formatLeadLineLabel(line: LeadLineDetail): string {
  if (line.serviceId === BUYUK_ALBUM_ID || line.label.toLowerCase().includes("büyük albüm")) {
    const pages = resolveLinePages(line) as BuyukAlbumPages;
    const base =
      line.label.replace(/\s*\([^)]+\)\s*$/i, "").trim() || "Büyük Albüm";
    return `${base} (${buyukAlbumPageOptionLabel(pages)})`;
  }

  const base = line.label.replace(/\s*\(\d+\s*adet\)\s*$/i, "").trim();
  const q = resolveLineQuantity(line);
  if (q > 1) return `${base} (${q} adet)`;
  if (q === 1 && line.serviceId === AILE_ALBUM_ID) return `${base} (1 adet)`;
  return line.label;
}
