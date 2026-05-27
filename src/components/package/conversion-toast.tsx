"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePackageStore } from "@/stores/package-store";
import { usePackageTotals } from "@/hooks/use-package-totals";
import { EASE_LUXURY } from "@/lib/animations";
import { CAMPAIGN_KLIP_META, isCampaignKlipId } from "@/config/campaign-klips";
import type { CampaignKlipId } from "@/config/campaign-klips";

export function ConversionToast() {
  const bundleDiscounts = usePackageStore((s) => s.bundleDiscounts);
  const selectedIds = usePackageStore((s) => s.selectedIds);
  const pct = bundleDiscounts[0]?.percent ?? 20;
  const { count, droneGiftActive, droneGiftClaimed } = usePackageTotals();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const onDroneBundle = () => {
      setMessage(
        "Büyük albüm + 2 aile albümü eklendi — dış çekim drone çekimi hediye olarak sepette"
      );
    };
    window.addEventListener("redmedya-drone-bundle-applied", onDroneBundle);
    return () =>
      window.removeEventListener("redmedya-drone-bundle-applied", onDroneBundle);
  }, []);

  useEffect(() => {
    const onKlipAdded = (e: Event) => {
      const detail = (
        e as CustomEvent<{ serviceId?: string; name?: string }>
      ).detail;
      const id = detail?.serviceId as CampaignKlipId | undefined;
      const label =
        (id && CAMPAIGN_KLIP_META[id]?.shortTitle) ||
        detail?.name ||
        "Kampanya klip";
      setMessage(
        `${label} eklendi (3.500₺) — soldaki hizmetlerde seçili görünüyor`
      );
    };
    window.addEventListener("redmedya-campaign-klip-added", onKlipAdded);
    return () =>
      window.removeEventListener("redmedya-campaign-klip-added", onKlipAdded);
  }, []);

  useEffect(() => {
    if (droneGiftClaimed) {
      setMessage("Drone çekimi hediye olarak paketinize eklendi");
      return;
    }
    if (droneGiftActive && count > 0) {
      setMessage(
        "Dış çekim foto + video + albüm tamam — drone hediyesi paketinize eklenecek"
      );
      return;
    }
    if (
      count > 0 &&
      !selectedIds.some((id) => isCampaignKlipId(id))
    ) {
      setMessage(`Paketinize %${pct} indirim uygulandı`);
    }
  }, [count, droneGiftActive, droneGiftClaimed, pct, selectedIds]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 6000);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ ease: EASE_LUXURY }}
          className="fixed bottom-32 left-4 z-30 max-w-[min(320px,calc(100vw-2rem))] rounded-lg border border-rm-champagne/40 bg-rm-black-elevated px-4 py-3 shadow-xl lg:bottom-8"
        >
          <span className="text-xs leading-relaxed text-rm-off-white">
            {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
