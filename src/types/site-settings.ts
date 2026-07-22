export type CaseStudy = {
  id: string;
  couple: string;
  /** Ödenecek paket toplamı (güncel fiyatlar + %20 indirim sonrası) */
  total: number;
  location?: string;
  items: string[];
  /** İndirim öncesi ara toplam (gösterim) */
  subtotal?: number;
  /** Paket %20 indirimi tutarı */
  packageDiscount?: number;
  /** Kampanya klip tasarrufu (5.000→3.500 vb.) */
  campaignSavings?: number;
  /** Hediye drone vb. */
  giftSavings?: number;
  quote?: string;
  isActive?: boolean;
};

export type SeasonalRule = {
  id: string;
  name: string;
  /** 1–12 */
  startMonth: number;
  endMonth: number;
  pricePercent: number;
  isActive?: boolean;
};

export type CapacityConfig = {
  enabled: boolean;
  datesLeftThisMonth: number;
  monthLabel?: string;
};

export type SocialConfig = {
  dugunHighlight: string;
  instagramCta: string;
  /** Instagram gönderi/reel permalink — yeni sekmede açılır */
  instagramPostUrls: string[];
};

export type CouponUsageMap = Record<string, number>;

export type SiteSettings = {
  updatedAt: string;
  capacity: CapacityConfig;
  seasonalRules: SeasonalRule[];
  blockedDates: string[];
  caseStudies: CaseStudy[];
  social: SocialConfig;
  couponUsage: CouponUsageMap;
};

import type { LeadLineDetail, LeadStatus } from "@/types/reservations";
import type { MetaAttribution } from "@/lib/meta-attribution";

export type LeadRecord = {
  id: string;
  createdAt: string;
  source: string;
  status?: LeadStatus;
  reservationId?: string;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    weddingDate: string;
    weddingTime?: string;
    note: string;
  };
  cart: {
    selectedIds: string[];
    lineSummary: string[];
    subtotal: number;
    total: number;
    count: number;
  };
  lineDetails?: LeadLineDetail[];
  bundleDiscount?: number;
  couponDiscount?: number;
  couponCode?: string;
  /** Paket oturumu — GA4 sunucu eşleştirme + journey tracking korelasyonu */
  sessionId?: string;
  /** İlk dokunuş reklam kaynağı (§11) */
  utm?: { utm_source?: string; utm_campaign?: string };
  /** _fbp / _fbc — admin onayında Meta CAPI eşleştirme */
  metaAttribution?: MetaAttribution;
};
