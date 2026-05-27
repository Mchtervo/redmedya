"use client";

import { usePackageStore } from "@/stores/package-store";
import { usePackageTotals } from "@/hooks/use-package-totals";
import { qualifiesForDroneGift } from "@/lib/package-pricing";
import { formatPrice } from "@/lib/utils";

export function PackagePromoBar() {
  const services = usePackageStore((s) => s.services);
  const selectedIds = usePackageStore((s) => s.selectedIds);
  const quantities = usePackageStore((s) => s.serviceQuantities);
  const bundleDiscounts = usePackageStore((s) => s.bundleDiscounts);
  const { bundle } = usePackageTotals();

  const pct = bundleDiscounts[0]?.percent ?? 20;
  const droneOk = qualifiesForDroneGift(services, selectedIds, quantities);

  return (
    <p className="mb-8 text-sm text-rm-gray-400">
      <span className="text-rm-champagne">%{pct} paket indirimi</span> kampanya klipleri
      hariç otomatik uygulanır
      {bundle.amount > 0 && (
        <>
          {" "}
          · <span className="text-rm-off-white">{formatPrice(bundle.amount)}</span> tasarruf
        </>
      )}
      <span className="mx-2 text-white/15">|</span>
      Drone hediye:{" "}
      <span className={droneOk ? "text-emerald-400/90" : "text-rm-gray-500"}>
        {droneOk ? "otomatik eklendi" : "dış çekim foto + video + albüm"}
      </span>
    </p>
  );
}
