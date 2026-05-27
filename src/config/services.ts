export type {
  ServiceBadge,
  ServicePricingType,
  ServiceItem,
  BundleDiscount,
  CouponConfig,
  CampaignConfig,
} from "@/types/cms";

export { getDefaultCmsConfig } from "@/lib/cms-defaults";

import { getDefaultCmsConfig } from "@/lib/cms-defaults";

const _cms = getDefaultCmsConfig();

/** Geriye dönük uyumluluk */
export const defaultServices = _cms.services;
export const bundleDiscounts = _cms.bundleDiscounts;

export const badgeLabels: Record<
  import("@/types/cms").ServiceBadge,
  string
> = {
  popular: "En Popüler",
  "best-value": "En İyi Değer",
  "most-chosen": "En Çok Seçilen",
};
