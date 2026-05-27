"use client";

import { useMemo } from "react";
import { Zap, ArrowRight } from "lucide-react";
import { usePackageStore } from "@/stores/package-store";
import {
  getCampaignKlipOffers,
  qualifiesForKlipCampaign,
} from "@/lib/package-campaign-klips";
import { dispatchExpandPackageSection } from "@/lib/package-expand";
import {
  CAMPAIGN_KLIP_LIST_PRICE,
  CAMPAIGN_KLIP_PRICE,
  CAMPAIGN_KLIP_SAVINGS,
} from "@/config/campaign-klips";
import { formatPrice, cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { trackMetaEvent } from "@/lib/meta-pixel";

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
      <div className="relative overflow-hidden rounded-md border border-rm-champagne/40 bg-gradient-to-br from-rm-champagne/15 via-rm-champagne/8 to-transparent p-4">
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-rm-champagne/20 blur-2xl"
          aria-hidden
        />
        <div className="relative flex items-center gap-2">
          <Zap className="h-4 w-4 text-rm-champagne" fill="currentColor" />
          <p className="text-[10px] font-bold tracking-[0.28em] text-rm-champagne uppercase">
            Size özel kampanya
          </p>
        </div>
        <p className="relative mt-2 text-sm font-medium leading-snug text-rm-off-white">
          Şimdi tıklayın — her klipte{" "}
          <span className="text-emerald-400">
            {formatPrice(CAMPAIGN_KLIP_SAVINGS)} kara girin
          </span>
        </p>
        <p className="relative mt-1 text-xs text-emerald-200/90">
          <strong>Foto + video ile kampanya açık</strong> — liste{" "}
          {formatPrice(CAMPAIGN_KLIP_LIST_PRICE)}, şimdi{" "}
          <strong className="text-emerald-200">
            {formatPrice(CAMPAIGN_KLIP_PRICE)}
          </strong>
          . Paket %20 bu kliplere uygulanmaz; avantaj doğrudan bu fiyatta.
        </p>

        <ul className="relative mt-4 space-y-3">
          {offers.map((o) => {
            const added = selectedIds.includes(o.serviceId);
            return (
            <li key={o.id}>
              <button
                type="button"
                disabled={added}
                onClick={() => {
                  addCampaignKlip(o.serviceId);
                  trackMetaEvent("AddToCart", {
                    content_name: `campaign_klip_${o.serviceId}`,
                  });
                  dispatchExpandPackageSection({
                    scrollTarget: "occasion",
                    scrollId: o.scrollId,
                  });
                }}
                className={cn(
                  "group w-full rounded-sm border px-3 py-3.5 text-left transition-all",
                  added
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-rm-champagne/35 bg-rm-black/40 hover:border-rm-champagne hover:bg-rm-black/60"
                )}
              >
                <p className="text-sm font-semibold text-rm-off-white">{o.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-rm-gray-400">
                  {o.body}
                </p>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-xs text-rm-gray-500 line-through">
                      {formatPrice(o.listPrice)}
                    </p>
                    <p className="font-display text-2xl tabular-nums text-rm-champagne">
                      {formatPrice(o.campaignPrice)}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-emerald-400">
                      Şimdi ekle · {o.savingsLabel}
                    </p>
                  </div>
                  {added ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-[11px] font-bold text-emerald-300">
                      <Check className="h-3.5 w-3.5" />
                      Hizmetlerde seçili
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rm-champagne px-3 py-2 text-[11px] font-bold text-rm-black transition-transform group-hover:scale-[1.02]">
                      Hemen ekle
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </span>
                  )}
                </div>
              </button>
            </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
