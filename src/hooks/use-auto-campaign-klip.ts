"use client";

import { useEffect } from "react";
import { CAMPAIGN_KLIP_IDS, isCampaignKlipId } from "@/config/campaign-klips";
import { qualifiesForKlipCampaign } from "@/lib/package-campaign-klips";
import { usePackageStore } from "@/stores/package-store";

/** Foto+video koşulu sağlanınca seçili klipleri otomatik 3.500₺ yapar */
export function useAutoCampaignKlip() {
  const services = usePackageStore((s) => s.services);
  const selectedIds = usePackageStore((s) => s.selectedIds);
  const serviceQuantities = usePackageStore((s) => s.serviceQuantities);
  const campaignPricedIds = usePackageStore((s) => s.campaignPricedIds);
  const addCampaignKlip = usePackageStore((s) => s.addCampaignKlip);

  useEffect(() => {
    const eligible = qualifiesForKlipCampaign(
      services,
      selectedIds,
      serviceQuantities
    );

    if (eligible) {
      for (const id of CAMPAIGN_KLIP_IDS) {
        if (selectedIds.includes(id) && !campaignPricedIds.includes(id)) {
          addCampaignKlip(id);
        }
      }
      return;
    }

    const pricedKlipIds = campaignPricedIds.filter(isCampaignKlipId);
    if (pricedKlipIds.length > 0) {
      usePackageStore.setState({
        campaignPricedIds: campaignPricedIds.filter((id) => !isCampaignKlipId(id)),
      });
    }
  }, [
    services,
    selectedIds,
    serviceQuantities,
    campaignPricedIds,
    addCampaignKlip,
  ]);
}
