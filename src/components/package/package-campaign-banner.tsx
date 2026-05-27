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

  return (
    <div
      role="status"
      className="mb-8 rounded-lg border border-rm-champagne/45 bg-gradient-to-r from-rm-champagne/15 via-rm-champagne/8 to-transparent px-4 py-4 md:px-5"
    >
      <div className="flex gap-3">
        <Zap
          className="mt-0.5 h-5 w-5 shrink-0 text-rm-champagne"
          fill="currentColor"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-rm-off-white">
            Size özel fırsatlar açıldı
          </p>
          {droneEligible && (
            <p className="mt-1 text-xs text-emerald-400/95">
              Dış çekim foto + video + albüm → drone çekimi hediye (otomatik
              eklenir).
            </p>
          )}
          {klipEligible && offers.length > 0 && (
            <p className="mt-1 text-xs text-emerald-300/95">
              <strong className="text-emerald-200">Foto + video seçildi</strong> —
              sinematik klipler otomatik{" "}
              <strong className="text-emerald-200">
                {formatPrice(CAMPAIGN_KLIP_PRICE)}
              </strong>
              &apos;ye indi (liste {formatPrice(5000)}). İlgili etkinlikte yeşil
              karttan ekleyin; {formatPrice(CAMPAIGN_KLIP_SAVINGS)} tasarruf.
            </p>
          )}
          {klipEligible && offers.length === 0 && (
            <p className="mt-1 text-xs text-emerald-400/90">
              Kampanya klipleriniz seçildi — sol tarafta ilgili etkinlikte işaretli
              görünür.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
