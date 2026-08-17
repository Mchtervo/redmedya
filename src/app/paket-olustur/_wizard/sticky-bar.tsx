"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { COPY } from "@/content/paketOlustur";
import { track } from "@/lib/track/tracker";
import { useKeyboardInset } from "@/hooks/use-keyboard-inset";
import { CountUp } from "./motion";
import { WhatsAppShortcutModal } from "./whatsapp-shortcut-modal";
import { useWizard } from "./wizard-context";

/**
 * Adım 1 ve 2'de görünen sticky alt bar: canlı toplam + kazanç + Devam.
 * Adım 3'te gizli (kendi CTA'sı var, mobilde klavye çakışmasını önler).
 */
export function StickyBar() {
  const { state, totals, next } = useWizard();
  const reduce = useReducedMotion();
  const kbInset = useKeyboardInset();
  const [showShortcut, setShowShortcut] = useState(false);

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

  const canContinue = state.step === 1 ? state.packageId != null : true;

  // §2 — Adım 2'de "WhatsApp'ta Tamamla" kısayolu (form doldurmadan kaçmasın)
  const showWhatsAppShortcut = state.step === 2 && state.packageId != null;

  const openShortcut = () => {
    track("wa_shortcut_open", { total: totals.total, package_id: state.packageId ?? 0 });
    setShowShortcut(true);
  };

  return (
    <div
      className="fixed inset-x-0 z-50 border-t border-white/10 bg-rm-black/95 backdrop-blur-lg lg:sticky lg:bottom-4 lg:mt-8 lg:rounded-lg lg:border"
      style={{ bottom: kbInset }}
      data-journey="continue"
    >
      <div
        className="section-container flex items-center justify-between gap-3 py-3 sm:gap-4 sm:py-4"
        style={{
          paddingBottom: kbInset ? "0.75rem" : "max(0.75rem, env(safe-area-inset-bottom))",
        }}
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
        <div className="flex shrink-0 items-center gap-2">
          {/* §2 — ikincil: form doldurmadan WhatsApp'a geç */}
          {showWhatsAppShortcut && (
            <button
              type="button"
              onClick={openShortcut}
              className="inline-flex h-12 items-center gap-1.5 rounded-sm border border-[#25D366]/50 px-3 text-xs font-semibold text-[#25D366] transition-colors hover:bg-[#25D366]/10 sm:px-4"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">{COPY.whatsappShortcut.button}</span>
            </button>
          )}
          <button
            type="button"
            onClick={next}
            aria-label={COPY.cta.next.replace("→", "").trim()}
            className={cn(
              "btn-luxury inline-flex min-h-14 min-w-[9.5rem] items-center justify-center gap-2 rounded-sm px-5 text-sm font-bold tracking-[0.12em] uppercase transition-all sm:min-h-14 sm:px-8",
              canContinue
                ? "bg-rm-champagne text-rm-black hover:bg-rm-champagne-light shadow-[0_0_30px_rgba(196,160,82,0.35)]"
                : "bg-white/10 text-rm-gray-300 hover:bg-white/15"
            )}
          >
            {COPY.cta.next.replace("→", "").trim()}
            <ArrowRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      {showShortcut && (
        <WhatsAppShortcutModal onClose={() => setShowShortcut(false)} />
      )}
    </div>
  );
}
