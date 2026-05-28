"use client";

import { useMemo } from "react";
import { Zap } from "lucide-react";
import { usePackageStore } from "@/stores/package-store";
import {
  getCampaignKlipOffers,
  qualifiesForKlipCampaign,
} from "@/lib/package-campaign-klips";
import { qualifiesForDroneGift } from "@/lib/package-pricing";
import { CAMPAIGN_KLIP_PRICE, CAMPAIGN_KLIP_SAVINGS } from "@/config/campaign-klips";
import { formatPrice } from "@/lib/utils";

export function PackageCampaignBanner() {
  const services = usePackageStore((s) => s.services);
  const selectedIds = usePackageStore((s) => s.selectedIds);
  const quantities = usePackageStore((s) => s.serviceQuantities);

  const klipEligible = useMemo(
    () => qualifiesForKlipCampaign(services, selectedIds, quantities),
    [services, selectedIds, quantities]
  );

  const offers = useMemo(
    () => getCampaignKlipOffers(services, selectedIds, quantities),
    [services, selectedIds, quantities]
  );

  const droneEligible = useMemo(
    () => qualifiesForDroneGift(services, selectedIds, quantities),
    [services, selectedIds, quantities]
  );

  if (!klipEligible && !droneEligible) return null;

  const items: string[] = [];
  if (droneEligible) items.push("Drone hediye eklendi");
  if (klipEligible && offers.length > 0) {
    items.push(
      `Sinematik klipler ${formatPrice(CAMPAIGN_KLIP_PRICE)} (${formatPrice(
        CAMPAIGN_KLIP_SAVINGS
      )} tasarruf)`
    );
  }
  if (items.length === 0) return null;

  return (
    <div
      role="status"
      className="mb-8 flex items-center gap-3 rounded-md border border-rm-champagne/35 bg-rm-champagne/[0.06] px-4 py-3"
    >
      <Zap className="h-4 w-4 shrink-0 text-rm-champagne" fill="currentColor" />
      <p className="text-xs text-rm-gray-200 md:text-sm">
        <span className="font-semibold text-rm-champagne">Aktif fırsatlar:</span>{" "}
        {items.join(" · ")}
      </p>
    </div>
  );
}
