"use client";

import { useMemo } from "react";
import { Zap, ArrowRight } from "lucide-react";
import { usePackageStore } from "@/stores/package-store";
import {
  getCampaignKlipOffers,
  qualifiesForKlipCampaign,
} from "@/lib/package-campaign-klips";
import { dispatchExpandPackageSection } from "@/lib/package-expand";
import { CAMPAIGN_KLIP_PRICE } from "@/config/campaign-klips";
import { formatPrice, cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { trackGA4 } from "@/lib/analytics";

export function CartCampaignKlips() {
  const services = usePackageStore((s) => s.services);
  const selectedIds = usePackageStore((s) => s.selectedIds);
  const serviceQuantities = usePackageStore((s) => s.serviceQuantities);
  const addCampaignKlip = usePackageStore((s) => s.addCampaignKlip);

  const qualified = useMemo(
    () => qualifiesForKlipCampaign(services, selectedIds, serviceQuantities),
    [services, selectedIds, serviceQuantities]
  );

  const offers = useMemo(
    () => getCampaignKlipOffers(services, selectedIds, serviceQuantities),
    [services, selectedIds, serviceQuantities]
  );

  if (!qualified || offers.length === 0) return null;

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <div className="rounded-md border border-rm-champagne/30 bg-rm-champagne/[0.05] p-4">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-rm-champagne" fill="currentColor" />
          <p className="text-[10px] font-semibold tracking-[0.22em] text-rm-champagne uppercase">
            Önerilen klipler · {formatPrice(CAMPAIGN_KLIP_PRICE)}
          </p>
        </div>

        <ul className="mt-3 space-y-2">
          {offers.map((o) => {
            const added = selectedIds.includes(o.serviceId);
            return (
            <li key={o.id}>
              <button
                type="button"
                disabled={added}
                onClick={() => {
                  addCampaignKlip(o.serviceId);
                  trackGA4("campaign_klip_add", {
                    content_name: `campaign_klip_${o.serviceId}`,
                  });
                  dispatchExpandPackageSection({
                    scrollTarget: "occasion",
                    scrollId: o.scrollId,
                  });
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-sm border px-3 py-2.5 text-left transition-colors",
                  added
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-white/10 bg-white/[0.03] hover:border-rm-champagne/50 hover:bg-white/[0.06]"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-rm-off-white">
                    {o.title}
                  </p>
                  <p className="mt-0.5 text-[11px] tabular-nums">
                    <span className="text-rm-gray-500 line-through">
                      {formatPrice(o.listPrice)}
                    </span>{" "}
                    <span className="font-semibold text-rm-champagne">
                      {formatPrice(o.campaignPrice)}
                    </span>
                  </p>
                </div>
                {added ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-emerald-300">
                    <Check className="h-3 w-3" /> Seçili
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rm-champagne px-2.5 py-1 text-[10px] font-bold text-rm-black">
                    Ekle <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                )}
              </button>
            </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
