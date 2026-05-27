"use client";

import { usePackageStore } from "@/stores/package-store";
import { usePackageTotals } from "@/hooks/use-package-totals";

export function DiscountProgress() {
  const tiers = usePackageStore((s) => s.bundleDiscounts);
  const { count, bundle } = usePackageTotals();

  if (!tiers.length) return null;

  const maxTier = tiers[tiers.length - 1];
  const progress = Math.min((count / maxTier.minServices) * 100, 100);
  const nextTier = tiers.find((t) => count < t.minServices);

  return (
    <div className="mb-6 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-rm-gray-300">Çoklu hizmet indirimi</span>
        {bundle.percent > 0 ? (
          <span className="font-medium text-rm-champagne">
            %{bundle.percent} uygulandı
          </span>
        ) : nextTier ? (
          <span className="text-rm-gray-400">
            {nextTier.minServices - count} hizmet daha → %{nextTier.percent}
          </span>
        ) : null}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-rm-champagne transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
