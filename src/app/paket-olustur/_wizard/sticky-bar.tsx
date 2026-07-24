"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { COPY } from "@/content/paketOlustur";
import { CountUp } from "./motion";
import { useWizard } from "./wizard-context";

/**
 * Adım 1 ve 2'de görünen sticky alt bar: canlı toplam + kazanç + Devam.
 * Adım 3'te gizli (kendi CTA'sı var, mobilde klavye çakışmasını önler).
 */
export function StickyBar() {
  const { state, totals, next } = useWizard();
  const reduce = useReducedMotion();

  // §9.7 — toplam değişince yeşil flash
  const [flash, setFlash] = useState(0);
  const prevTotal = useRef(totals.total);
  useEffect(() => {
    if (totals.total !== prevTotal.current) {
      prevTotal.current = totals.total;
      setFlash((f) => f + 1);
    }
  }, [totals.total]);

  if (state.step === 3) return null;

  const canContinue =
    state.step === 1 ? state.packageId != null && state.plato != null : true;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-rm-black/95 backdrop-blur-lg lg:sticky lg:bottom-4 lg:mt-8 lg:rounded-lg lg:border">
      <div
        className="section-container flex items-center justify-between gap-4 py-3 sm:py-4"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="relative min-w-0">
          {/* §9.7 yeşil flash — yapı her zaman aynı, reduced-motion'da süre 0
              (koşullu render hydration uyuşmazlığı yaratıyordu) */}
          <AnimatePresence>
            <motion.span
              key={flash}
              initial={{ opacity: 0.15 }}
              animate={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.4 }}
              className="pointer-events-none absolute -inset-x-2 -inset-y-1 rounded bg-emerald-500"
              aria-hidden
            />
          </AnimatePresence>
          <p className="relative flex items-baseline gap-2">
            <span className="text-[11px] tracking-wide text-rm-gray-400">
              {COPY.cta.totalPrefix}
            </span>
            <CountUp
              value={totals.total}
              durationMs={500}
              format={(n) => formatPrice(n)}
              className="font-editorial text-xl text-rm-off-white tabular-nums sm:text-2xl"
            />
          </p>
          {totals.savings > 0 && (
            <p className="relative text-[11px] font-semibold text-emerald-400 sm:text-xs">
              {formatPrice(totals.savings)} kazanç 🎉
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={next}
          className={cn(
            "btn-luxury inline-flex h-12 shrink-0 items-center gap-1.5 rounded-sm px-4 text-xs font-semibold tracking-wide uppercase transition-all sm:gap-2 sm:px-8 sm:text-sm",
            canContinue
              ? "bg-rm-champagne text-rm-black hover:bg-rm-champagne-light shadow-[0_0_30px_rgba(196,160,82,0.25)]"
              : "bg-white/10 text-rm-gray-300 hover:bg-white/15"
          )}
        >
          {COPY.cta.next.replace("→", "")}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
