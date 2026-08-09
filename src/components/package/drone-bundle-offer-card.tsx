"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Plane, X } from "lucide-react";
import { usePackageStore } from "@/stores/package-store";
import { formatPrice, cn } from "@/lib/utils";
import { EASE_LUXURY } from "@/lib/animations";
import {
  DRONE_GIFT_LIST_VALUE,
  canUpsellGelinAlmaInBundle,
  dismissDroneBundleOffer,
  droneBundleOfferProgress,
  shouldShowDroneBundleOffer,
} from "@/lib/package-drone-bundle-offer";
import { trackGA4 } from "@/lib/analytics";
import { CAMPAIGN_KLIP_PRICE } from "@/config/campaign-klips";
import { dispatchExpandPackageSection } from "@/lib/package-expand";

export function DroneBundleOfferCard() {
  const services = usePackageStore((s) => s.services);
  const selectedIds = usePackageStore((s) => s.selectedIds);
  const quantities = usePackageStore((s) => s.serviceQuantities);
  const applyBundle = usePackageStore((s) => s.applyDroneAlbumBundle);

  const [visible, setVisible] = useState(false);
  const [addGelinAlma, setAddGelinAlma] = useState(true);
  const [applying, setApplying] = useState(false);

  const show = useMemo(
    () => shouldShowDroneBundleOffer(services, selectedIds, quantities),
    [services, selectedIds, quantities]
  );

  const progress = useMemo(
    () => droneBundleOfferProgress(services, selectedIds, quantities),
    [services, selectedIds, quantities]
  );

  const gelinUpsell = canUpsellGelinAlmaInBundle(selectedIds);

  useEffect(() => {
    if (show) {
      setVisible(true);
      trackGA4("view_drone_offer", {
        content_name: "drone_hediye_karti",
        page_path: "/paket-olustur",
      });
    } else {
      setVisible(false);
    }
  }, [show]);

  const handleApply = () => {
    setApplying(true);
    applyBundle({ addGelinAlma: gelinUpsell && addGelinAlma });
    setVisible(false);
    dismissDroneBundleOffer();
    dispatchExpandPackageSection({
      scrollTarget: "albums",
      scrollId: "albums",
    });
    trackGA4("drone_bundle_apply", {
      content_name: "drone_bundle_hemen_ekle",
      value: DRONE_GIFT_LIST_VALUE,
    });
    setTimeout(() => setApplying(false), 400);
  };

  const handleDismiss = () => {
    dismissDroneBundleOffer();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={handleDismiss}
          />

          <motion.div
            role="dialog"
            aria-labelledby="drone-offer-title"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.45, ease: EASE_LUXURY }}
            className="relative w-full max-w-md overflow-hidden rounded-xl border border-rm-champagne/35 bg-rm-black-elevated shadow-[0_0_80px_rgba(196,160,82,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rm-champagne-dark via-rm-champagne to-rm-champagne-dark" />

            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-rm-gray-300 transition-colors hover:bg-white/10 hover:text-rm-off-white"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>

            <div className="border-b border-white/[0.06] px-6 pb-5 pt-8 md:px-8">
              <p className="text-[10px] font-semibold tracking-[0.35em] text-rm-champagne uppercase">
                Dış çekim hediyesi
              </p>
              <h2
                id="drone-offer-title"
                className="mt-3 font-display text-[clamp(1.75rem,5vw,2.25rem)] leading-[1.15] text-rm-off-white"
              >
                Drone çekimi{" "}
                <span className="text-emerald-400">ücretsiz</span>
              </h2>
              <p className="mt-2 font-display text-2xl tabular-nums tracking-tight text-rm-champagne">
                {formatPrice(DRONE_GIFT_LIST_VALUE)} değerinde
              </p>
            </div>

            <div className="space-y-5 px-6 py-6 font-sans md:px-8">
              <p className="text-[15px] leading-relaxed text-rm-gray-300">
                Dış çekim{" "}
                <span className="font-medium text-rm-off-white">fotoğraf + video</span>{" "}
                seçtiniz. Aşağıdakileri sepete ekleyin; drone otomatik{" "}
                <span className="font-medium text-emerald-400/95">hediye</span> uygulanır.
              </p>

              <ul className="space-y-2.5 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <li className="flex items-center gap-3 text-[15px] text-rm-gray-200">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      progress.hasBuyuk ? "bg-rm-champagne" : "bg-rm-gray-600"
                    )}
                  />
                  <span className="font-medium text-rm-off-white">
                    1× Büyük Albüm
                  </span>
                  <span className="text-rm-gray-500">· 5 yaprak 10 sayfa</span>
                </li>
                <li className="flex items-center gap-3 text-[15px] text-rm-gray-200">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      progress.aileQty >= 2 ? "bg-rm-champagne" : "bg-rm-gray-600"
                    )}
                  />
                  <span className="font-medium text-rm-off-white">2× Aile Albümü</span>
                </li>
                <li className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-white/[0.06] pt-3 text-[15px]">
                  <Plane className="h-4 w-4 shrink-0 text-rm-champagne" strokeWidth={1.5} />
                  <span className="font-medium text-rm-off-white">Drone — Dış Çekim</span>
                  <span className="text-sm text-rm-gray-500 line-through tabular-nums">
                    {formatPrice(DRONE_GIFT_LIST_VALUE)}
                  </span>
                  <span className="rounded-sm bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-300 uppercase">
                    Hediye
                  </span>
                </li>
              </ul>

              {gelinUpsell && (
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-rm-champagne/25 bg-rm-champagne/[0.07] p-4">
                  <input
                    type="checkbox"
                    checked={addGelinAlma}
                    onChange={(e) => setAddGelinAlma(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-rm-champagne"
                  />
                  <span className="text-[14px] leading-relaxed text-rm-gray-300">
                    <span className="font-medium text-rm-champagne">Gelin alma</span>{" "}
                    çekimini de ekle — sinematik klip{" "}
                    <span className="font-medium tabular-nums text-rm-off-white">
                      {formatPrice(CAMPAIGN_KLIP_PRICE)}
                    </span>
                    <span className="text-rm-gray-500"> (liste 5.000₺)</span>
                  </span>
                </label>
              )}

              <button
                type="button"
                disabled={applying}
                onClick={handleApply}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-rm-champagne py-3.5 text-sm font-bold tracking-[0.14em] text-rm-black uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <Gift className="h-4 w-4" strokeWidth={2} />
                {applying ? "Ekleniyor…" : "Hemen ekle"}
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="w-full text-center text-[13px] font-medium text-rm-gray-500 transition-colors hover:text-rm-gray-300"
              >
                Şimdilik geç
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
