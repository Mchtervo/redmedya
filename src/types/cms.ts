export type ServiceBadge = "popular" | "best-value" | "most-chosen";

export type ServicePricingType = "fixed" | "quantity" | "pages";

export type ServiceItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: "foto" | "video" | "album" | "extra";
  /** foto/video için etkinlik: gelin alma, kına, salon vb. */
  occasion?: string;
  pricingType?: ServicePricingType;
  /** pricingType: pages — örn. [10, 20]; 20 sayfa varsayılan %50 zam */
  pageOptions?: number[];
  unitPrice?: number;
  maxQuantity?: number;
  isPopular?: boolean;
  badge?: ServiceBadge;
  upsellHint?: string;
  recommendation?: string;
  isActive?: boolean;
  sortOrder?: number;
  /** Kampanya butonu ile eklenince uygulanan fiyat (liste fiyatı `price`) */
  campaignPrice?: number;
  /** Paket % indirimine dahil edilmez */
  excludeFromBundleDiscount?: boolean;
};

export type BundleDiscount = {
  minServices: number;
  percent: number;
  message: string;
};

export type CouponConfig = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  isActive: boolean;
  description?: string;
};

export type CampaignConfig = {
  active: boolean;
  message: string;
  ctaLabel: string;
  ctaHref: string;
};

export type SiteCmsConfig = {
  services: ServiceItem[];
  bundleDiscounts: BundleDiscount[];
  coupons: CouponConfig[];
  campaign: CampaignConfig;
  updatedAt: string;
};
