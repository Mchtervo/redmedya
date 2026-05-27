"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Percent } from "lucide-react";
import { usePackageStore } from "@/stores/package-store";
import { DRONE_GIFT_SERVICE_ID } from "@/lib/package-pricing";
import { formatPrice } from "@/lib/utils";
import { EASE_LUXURY } from "@/lib/animations";

/** Eski oturum anahtarları — bir kez temizlenir */
const LEGACY_KEYS = ["redmedya-campaign-modal-dismissed"];
const STORAGE_KEY = "redmedya-campaign-welcome-v2";
const AUTO_CLOSE_SEC = 8;

type CampaignWelcomeModalProps = {
  /** Ana sayfa: pakete yönlendir; paket sayfası: hizmetlere kaydır */
  mode?: "home" | "package";
  /** Intro sonrası gecikme (ms) */
  openDelayMs?: number;
};

export function CampaignWelcomeModal({
  mode = "package",
  openDelayMs = 400,
}: CampaignWelcomeModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState(AUTO_CLOSE_SEC);
  const services = usePackageStore((s) => s.services);
  const bundleDiscounts = usePackageStore((s) => s.bundleDiscounts);
  const drone = services.find((s) => s.id === DRONE_GIFT_SERVICE_ID);
  const percent = bundleDiscounts[0]?.percent ?? 20;

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    try {
      for (const k of LEGACY_KEYS) sessionStorage.removeItem(k);
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    const t = setTimeout(() => setOpen(true), openDelayMs);
    return () => clearTimeout(t);
  }, [openDelayMs]);

  useEffect(() => {
    if (!open) return;
    setRemaining(AUTO_CLOSE_SEC);
    const interval = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          dismiss();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [open, dismiss]);

  const handleBenefit = () => {
    dismiss();
    if (mode === "home") {
      router.push("/paket-olustur");
      return;
    }
    requestAnimationFrame(() => {
      document
        .getElementById("paket-hizmetler")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="campaign-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10050] flex items-center justify-center p-4"
        >
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-rm-black/85 backdrop-blur-sm"
            onClick={dismiss}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.45, ease: EASE_LUXURY }}
            className="relative w-full max-w-md overflow-hidden rounded-xl border border-rm-champagne/30 bg-rm-black-elevated shadow-[0_0_80px_rgba(196,160,82,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rm-champagne-dark via-rm-champagne to-rm-champagne-dark" />

            <button
              type="button"
              onClick={dismiss}
              className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-rm-gray-300 transition-colors hover:bg-white/10 hover:text-rm-off-white"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6 pt-8 md:p-8">
              <p className="text-[10px] font-semibold tracking-[0.35em] text-rm-champagne uppercase">
                Hoş geldiniz
              </p>
              <h2
                id="campaign-modal-title"
                className="mt-3 font-display text-2xl leading-tight text-rm-off-white md:text-3xl"
              >
                %{percent} indirim +{" "}
                <span className="text-emerald-400">hediye drone</span>
              </h2>
              <p className="mt-2 text-sm text-rm-gray-400">
                İlk ziyaretinize özel kampanyalar paket oluşturucuda otomatik uygulanır.
              </p>

              <div className="mt-5 space-y-3">
                <div className="flex gap-3 rounded-lg border border-rm-champagne/25 bg-rm-champagne/10 px-4 py-3">
                  <Percent className="mt-0.5 h-5 w-5 shrink-0 text-rm-champagne" />
                  <p className="text-sm leading-relaxed text-rm-gray-200">
                    Tüm paketlerinizde otomatik{" "}
                    <strong className="text-rm-champagne">%{percent} indirim</strong>.
                  </p>
                </div>
                <div className="flex gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                  <Gift className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <p className="text-sm leading-relaxed text-rm-gray-200">
                    <strong className="text-rm-off-white">
                      Dış çekim fotoğraf + video + albüm
                    </strong>{" "}
                    seçin; drone çekimi paketinize ücretsiz eklenir
                    {drone?.price ? (
                      <span className="text-emerald-400">
                        {" "}
                        ({formatPrice(drone.price)} değerinde)
                      </span>
                    ) : null}
                    .
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBenefit}
                className="mt-6 w-full rounded-md bg-rm-champagne py-3.5 text-sm font-bold tracking-wide text-rm-black uppercase transition-opacity hover:opacity-90"
              >
                Hemen faydalan
              </button>

              <p className="mt-3 text-center text-[11px] text-rm-gray-500">
                {remaining > 0
                  ? `${remaining} saniye sonra kapanır · X ile kapatabilirsiniz`
                  : "Kapanıyor…"}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
