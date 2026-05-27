import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getDefaultCmsConfig } from "@/lib/cms-defaults";
import {
  computeLineItems,
  computeSelectedCount,
  getPackagePricingSnapshot,
  syncDroneGiftSelection,
} from "@/lib/package-pricing";
import type {
  BundleDiscount,
  CampaignConfig,
  CouponConfig,
  ServiceItem,
} from "@/types/cms";
import type { SeasonalRule } from "@/types/site-settings";
import { trackAnalytics } from "@/lib/analytics";
import {
  AILE_ALBUM_ID,
  BUYUK_ALBUM_ID,
  canAddAileAlbum,
  hasBuyukAlbumSelected,
} from "@/lib/album-rules";
import {
  KLIP_GELIN_ALMA_ID,
  standardVideoIdForCampaignKlip,
} from "@/config/campaign-klips";
import { qualifiesForKlipCampaign } from "@/lib/package-campaign-klips";
import { FOTO_GELIN_ALMA_ID } from "@/lib/package-drone-bundle-offer";

function withoutDuplicateOccasionVideo(selectedIds: string[], klipId: string) {
  const videoId = standardVideoIdForCampaignKlip(klipId);
  if (!videoId) return selectedIds;
  return selectedIds.filter((sid) => sid !== videoId);
}

function normalizeService(s: ServiceItem): ServiceItem {
  return {
    ...s,
    price: Number(s.price) || 0,
    unitPrice: s.unitPrice != null ? Number(s.unitPrice) : undefined,
  };
}

/** Adetli hizmetler selectedIds'de olmamalı; 0 adet = seçili sayılmaz */
function sanitizeSelection(
  services: ServiceItem[],
  selectedIds: string[],
  serviceQuantities: Record<string, number>
) {
  const quantityIds = new Set(
    services.filter((s) => s.pricingType === "quantity").map((s) => s.id)
  );
  const cleanSelected = selectedIds.filter((id) => !quantityIds.has(id));
  const cleanQuantities = { ...serviceQuantities };
  for (const id of quantityIds) {
    const qty = cleanQuantities[id] ?? 0;
    if (qty <= 0) {
      delete cleanQuantities[id];
    }
  }
  return {
    selectedIds: cleanSelected,
    serviceQuantities: cleanQuantities,
  };
}

function sanitizePages(
  services: ServiceItem[],
  selectedIds: string[],
  servicePages: Record<string, number>
) {
  const cleanPages = { ...servicePages };
  const selected = new Set(selectedIds);
  for (const id of Object.keys(cleanPages)) {
    if (!selected.has(id)) delete cleanPages[id];
  }
  for (const s of services) {
    if (s.pricingType === "pages" && selected.has(s.id) && cleanPages[s.id] == null) {
      cleanPages[s.id] = s.pageOptions?.[0] ?? 10;
    }
  }
  return cleanPages;
}

function withDroneSync(state: {
  services: ServiceItem[];
  selectedIds: string[];
  serviceQuantities: Record<string, number>;
}): string[] {
  return syncDroneGiftSelection(
    state.services,
    state.selectedIds,
    state.serviceQuantities
  );
}

export type CustomerInfo = {
  firstName: string;
  lastName: string;
  phone: string;
  weddingDate: string;
  /** Düğün / çekim başlangıç saati (HH:mm) */
  weddingTime?: string;
  note: string;
};

export type SelectedLineItem = ServiceItem & {
  quantity: number;
  lineTotal: number;
  isGift?: boolean;
  isCampaignPrice?: boolean;
  originalLineTotal?: number;
  excludeFromBundleDiscount?: boolean;
  selectedPages?: number;
};

type CouponState = {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
} | null;

type PublicCmsPayload = {
  services: ServiceItem[];
  bundleDiscounts: BundleDiscount[];
  coupons: CouponConfig[];
  campaign: CampaignConfig;
};

const defaults = getDefaultCmsConfig();

type PackageState = {
  services: ServiceItem[];
  bundleDiscounts: BundleDiscount[];
  coupons: CouponConfig[];
  campaign: CampaignConfig;
  selectedIds: string[];
  /** Kampanya butonu ile 3.500₺ eklenen klip hizmetleri */
  campaignPricedIds: string[];
  serviceQuantities: Record<string, number>;
  servicePages: Record<string, number>;
  coupon: CouponState;
  customer: CustomerInfo;
  cmsLoaded: boolean;
  seasonalRules: SeasonalRule[];

  hydrateFromCms: (payload: PublicCmsPayload) => void;
  hydrateSiteSettings: (payload: { seasonalRules: SeasonalRule[] }) => void;
  toggleService: (id: string) => void;
  addCampaignKlip: (id: string) => void;
  applyDroneAlbumBundle: (options?: { addGelinAlma?: boolean }) => void;
  setServiceQuantity: (id: string, quantity: number) => void;
  setServicePages: (id: string, pages: number) => void;
  setCoupon: (coupon: CouponState) => void;
  clearCoupon: () => void;
  setCustomer: (partial: Partial<CustomerInfo>) => void;
  reset: () => void;

  getSelectedCount: () => number;
  getSelectedLineItems: () => SelectedLineItem[];
  getSubtotal: () => number;
  getBundleDiscount: () => { percent: number; amount: number };
  getCouponDiscount: () => number;
  getTotal: () => number;
  getDiscountPercent: () => number;
  applyCouponCode: (code: string) => boolean;
};

const emptyCustomer: CustomerInfo = {
  firstName: "",
  lastName: "",
  phone: "",
  weddingDate: "",
  note: "",
};

export const usePackageStore = create<PackageState>()(
  persist(
    (set, get) => ({
      services: defaults.services,
      bundleDiscounts: defaults.bundleDiscounts,
      coupons: defaults.coupons,
      campaign: defaults.campaign,
      selectedIds: [],
      campaignPricedIds: [],
      serviceQuantities: {},
      servicePages: {},
      coupon: null,
      customer: emptyCustomer,
      cmsLoaded: false,
      seasonalRules: [],

      hydrateSiteSettings: (payload) =>
        set({ seasonalRules: payload.seasonalRules ?? [] }),

      hydrateFromCms: (payload) =>
        set((state) => {
          const services = payload.services.map(normalizeService);
          const validIds = new Set(services.map((s) => s.id));
          let selectedIds = state.selectedIds
            .map((id) => {
              if (id === "drone-cekimi") return "drone-dis-cekim";
              if (id === "omuz-kamerasi") return "";
              return id;
            })
            .filter(Boolean)
            .filter((id) => validIds.has(id));
          const campaignPricedIds = state.campaignPricedIds.filter((id) =>
            validIds.has(id)
          );
          const sanitized = sanitizeSelection(
            services,
            selectedIds,
            state.serviceQuantities
          );
          const servicePages = sanitizePages(
            services,
            sanitized.selectedIds,
            state.servicePages
          );
          const syncedIds = withDroneSync({
            services,
            selectedIds: sanitized.selectedIds,
            serviceQuantities: sanitized.serviceQuantities,
          });
          return {
            services,
            bundleDiscounts: payload.bundleDiscounts,
            coupons: payload.coupons,
            campaign: payload.campaign,
            cmsLoaded: true,
            ...sanitized,
            selectedIds: syncedIds,
            campaignPricedIds,
            servicePages,
          };
        }),

      toggleService: (id) =>
        set((state) => {
          const service = state.services.find((s) => s.id === id);
          const isRemoving = state.selectedIds.includes(id);
          let selectedIds = state.selectedIds;
          let campaignPricedIds = state.campaignPricedIds;
          let serviceQuantities = { ...state.serviceQuantities };
          const servicePages = { ...state.servicePages };

          if (isRemoving) {
            delete servicePages[id];
            selectedIds = selectedIds.filter((s) => s !== id);
            campaignPricedIds = campaignPricedIds.filter((s) => s !== id);
            const removedBuyuk =
              id === BUYUK_ALBUM_ID ||
              state.services.find((s) => s.id === id)?.pricingType === "pages";
            if (
              removedBuyuk ||
              !hasBuyukAlbumSelected(selectedIds, state.services)
            ) {
              delete serviceQuantities[AILE_ALBUM_ID];
            }
          } else {
            if (service?.pricingType === "pages") {
              servicePages[id] = servicePages[id] ?? service.pageOptions?.[0] ?? 10;
            }
            selectedIds = [...selectedIds, id];
            selectedIds = withoutDuplicateOccasionVideo(selectedIds, id);
          }

          selectedIds = withDroneSync({
            services: state.services,
            selectedIds,
            serviceQuantities,
          });
          return { selectedIds, servicePages, campaignPricedIds, serviceQuantities };
        }),

      applyDroneAlbumBundle: (options) =>
        set((state) => {
          let selectedIds = [...state.selectedIds];
          const servicePages = { ...state.servicePages };
          const serviceQuantities = { ...state.serviceQuantities, [AILE_ALBUM_ID]: 2 };
          let campaignPricedIds = [...state.campaignPricedIds];

          const buyukId =
            state.services.find(
              (s) => s.id === BUYUK_ALBUM_ID || s.pricingType === "pages"
            )?.id ?? BUYUK_ALBUM_ID;

          if (!hasBuyukAlbumSelected(selectedIds, state.services)) {
            if (!selectedIds.includes(buyukId)) {
              selectedIds = [...selectedIds, buyukId];
            }
            servicePages[buyukId] = servicePages[buyukId] ?? 10;
          }

          if (options?.addGelinAlma && !selectedIds.includes(FOTO_GELIN_ALMA_ID)) {
            selectedIds = [...selectedIds, FOTO_GELIN_ALMA_ID];
          }

          selectedIds = withDroneSync({
            services: state.services,
            selectedIds,
            serviceQuantities,
          });

          if (options?.addGelinAlma) {
            const klip = state.services.find((s) => s.id === KLIP_GELIN_ALMA_ID);
            if (
              klip?.campaignPrice &&
              qualifiesForKlipCampaign(
                state.services,
                selectedIds,
                serviceQuantities
              ) &&
              !selectedIds.includes(KLIP_GELIN_ALMA_ID)
            ) {
              selectedIds = [...selectedIds, KLIP_GELIN_ALMA_ID];
              selectedIds = withoutDuplicateOccasionVideo(
                selectedIds,
                KLIP_GELIN_ALMA_ID
              );
              if (!campaignPricedIds.includes(KLIP_GELIN_ALMA_ID)) {
                campaignPricedIds = [...campaignPricedIds, KLIP_GELIN_ALMA_ID];
              }
            }
          }

          trackAnalytics("drone_bundle_apply", {
            add_gelin_alma: Boolean(options?.addGelinAlma),
          });
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("redmedya-drone-bundle-applied"));
          }

          return {
            selectedIds,
            servicePages,
            serviceQuantities,
            campaignPricedIds,
          };
        }),

      addCampaignKlip: (id) =>
        set((state) => {
          const service = state.services.find((s) => s.id === id);
          if (!service?.campaignPrice) return state;

          let selectedIds = state.selectedIds.includes(id)
            ? state.selectedIds
            : [...state.selectedIds, id];
          selectedIds = withoutDuplicateOccasionVideo(selectedIds, id);
          const campaignPricedIds = state.campaignPricedIds.includes(id)
            ? state.campaignPricedIds
            : [...state.campaignPricedIds, id];

          selectedIds = withDroneSync({
            services: state.services,
            selectedIds,
            serviceQuantities: state.serviceQuantities,
          });
          trackAnalytics("campaign_klip_add", { service_id: id });
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("redmedya-campaign-klip-added", {
                detail: { serviceId: id, name: service.name },
              })
            );
          }
          return { selectedIds, campaignPricedIds };
        }),

      setServicePages: (id, pages) =>
        set((state) => {
          const service = state.services.find((s) => s.id === id);
          const allowed = service?.pageOptions ?? [10, 20];
          const p = allowed.includes(pages) ? pages : (allowed[0] ?? 10);
          const servicePages = { ...state.servicePages, [id]: p };
          let selectedIds = state.selectedIds.includes(id)
            ? state.selectedIds
            : [...state.selectedIds, id];
          selectedIds = withDroneSync({
            services: state.services,
            selectedIds,
            serviceQuantities: state.serviceQuantities,
          });
          return { servicePages, selectedIds };
        }),

      setServiceQuantity: (id, quantity) =>
        set((state) => {
          const service = state.services.find((s) => s.id === id);
          const max = service?.maxQuantity ?? 2;
          const qty = Math.max(0, Math.min(quantity, max));

          if (
            id === AILE_ALBUM_ID &&
            qty > 0 &&
            !canAddAileAlbum(state.selectedIds, state.services)
          ) {
            return state;
          }

          const serviceQuantities = { ...state.serviceQuantities };
          if (qty <= 0) {
            delete serviceQuantities[id];
          } else {
            serviceQuantities[id] = qty;
          }
          let selectedIds = state.selectedIds.filter((sid) => sid !== id);
          selectedIds = withDroneSync({
            services: state.services,
            selectedIds,
            serviceQuantities,
          });
          return { serviceQuantities, selectedIds };
        }),

      setCoupon: (coupon) => set({ coupon }),
      clearCoupon: () => set({ coupon: null }),

      setCustomer: (partial) =>
        set((state) => ({
          customer: { ...state.customer, ...partial },
        })),

      reset: () =>
        set({
          selectedIds: [],
          campaignPricedIds: [],
          serviceQuantities: {},
          servicePages: {},
          coupon: null,
          customer: emptyCustomer,
        }),

      getSelectedCount: () => {
        const { services, selectedIds, serviceQuantities } = get();
        return computeSelectedCount(services, selectedIds, serviceQuantities);
      },

      getSelectedLineItems: () => {
        const { services, selectedIds, serviceQuantities, servicePages, campaignPricedIds } =
          get();
        return computeLineItems(
          services,
          selectedIds,
          serviceQuantities,
          servicePages,
          campaignPricedIds
        );
      },

      getSubtotal: () => {
        return get()
          .getSelectedLineItems()
          .reduce((sum, item) => sum + item.lineTotal, 0);
      },

      getBundleDiscount: () =>
        getPackagePricingSnapshot({
          ...get(),
          weddingDate: get().customer.weddingDate,
        }).bundle,

      getCouponDiscount: () =>
        getPackagePricingSnapshot({
          ...get(),
          weddingDate: get().customer.weddingDate,
        }).couponDiscount,

      getTotal: () =>
        getPackagePricingSnapshot({
          ...get(),
          weddingDate: get().customer.weddingDate,
        }).total,

      getDiscountPercent: () => {
        const { subtotal, total } = getPackagePricingSnapshot({
          ...get(),
          weddingDate: get().customer.weddingDate,
        });
        if (subtotal === 0) return 0;
        return Math.round(((subtotal - total) / subtotal) * 100);
      },

      applyCouponCode: (code) => {
        const upper = code.trim().toUpperCase();
        const found = get().coupons.find(
          (c) => c.isActive && c.code.toUpperCase() === upper
        );
        if (!found) return false;
        set({
          coupon: {
            code: found.code,
            type: found.type,
            value: found.value,
          },
        });
        trackAnalytics("coupon_applied", { coupon_code: found.code });
        return true;
      },
    }),
    {
      name: "redmedya-package",
      partialize: (state) => ({
        selectedIds: state.selectedIds,
        campaignPricedIds: state.campaignPricedIds,
        serviceQuantities: state.serviceQuantities,
        servicePages: state.servicePages,
        coupon: state.coupon,
        customer: state.customer,
      }),
      merge: (persisted, current) => {
        const merged = {
          ...current,
          ...(persisted as Partial<PackageState>),
          servicePages:
            (persisted as Partial<PackageState>).servicePages ??
            current.servicePages ??
            {},
        };
        const sanitized = sanitizeSelection(
          merged.services,
          merged.selectedIds,
          merged.serviceQuantities
        );
        const servicePages = sanitizePages(
          merged.services,
          sanitized.selectedIds,
          merged.servicePages
        );
        const selectedIds = withDroneSync({
          services: merged.services,
          selectedIds: sanitized.selectedIds,
          serviceQuantities: sanitized.serviceQuantities,
        });
        const campaignPricedIds = (
          (persisted as Partial<PackageState>).campaignPricedIds ?? []
        ).filter((id) => merged.services.some((s) => s.id === id));
        return {
          ...merged,
          ...sanitized,
          servicePages,
          selectedIds,
          campaignPricedIds,
        };
      },
    }
  )
);
