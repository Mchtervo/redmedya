"use client";

import { useMemo } from "react";
import { usePackageStore } from "@/stores/package-store";
import { computePackageTotals } from "@/lib/package-pricing";
import { useSiteSettings } from "@/hooks/use-site-settings";

/** Seçim değişince yeniden hesaplanan canlı fiyatlar */
export function usePackageTotals() {
  const services = usePackageStore((s) => s.services);
  const selectedIds = usePackageStore((s) => s.selectedIds);
  const serviceQuantities = usePackageStore((s) => s.serviceQuantities);
  const servicePages = usePackageStore((s) => s.servicePages);
  const campaignPricedIds = usePackageStore((s) => s.campaignPricedIds);
  const bundleDiscounts = usePackageStore((s) => s.bundleDiscounts);
  const coupon = usePackageStore((s) => s.coupon);
  const weddingDate = usePackageStore((s) => s.customer.weddingDate);
  const { settings } = useSiteSettings();

  return useMemo(
    () =>
      computePackageTotals(
        services,
        selectedIds,
        serviceQuantities,
        bundleDiscounts,
        coupon,
        servicePages,
        campaignPricedIds,
        weddingDate,
        settings.seasonalRules
      ),
    [
      services,
      selectedIds,
      serviceQuantities,
      servicePages,
      campaignPricedIds,
      bundleDiscounts,
      coupon,
      weddingDate,
      settings.seasonalRules,
    ]
  );
}
