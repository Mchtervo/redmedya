"use client";

import { useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FilmGrain } from "@/components/effects/film-grain";
import { COPY } from "@/content/paketOlustur";
import { HOME_HERO_WEBP } from "@/config/hero";
import { pixelViewContentPaket } from "@/lib/paket/pixel";
import { WizardProvider, useWizard } from "./wizard-context";
import { CampaignBanner } from "./campaign-banner";
import { StepIndicator } from "./step-indicator";
import { StickyBar } from "./sticky-bar";
import { Step1PackagePlato } from "./step1-package-plato";
import { Step2Customize } from "./step2-customize";
import { Step3DateConfirm } from "./step3-date-confirm";
import { ExitCapture } from "./exit-capture";
import { stepVariants } from "./motion";

function StepSwitch() {
  const { state, dir } = useWizard();
  const reduce = useReducedMotion();

  const content =
    state.step === 1 ? (
      <Step1PackagePlato />
    ) : state.step === 2 ? (
      <Step2Customize />
    ) : (
      <Step3DateConfirm />
    );

  /**
   * DİKKAT: `reduce` yalnızca `transition`'ı etkileyebilir; DOM YAPISINI ASLA
   * değiştiremez. Sunucu her zaman reduce=false ile render eder; yapıyı burada
   * dallandırmak, cihazında "hareketi azalt" açık olan HER ziyaretçide
   * hydration hatasına ve tüm ağacın yeniden çizilmesine yol açıyordu.
   * duration:0 → animasyon fiilen kapalı (kırmızı çizgi korunur).
   */
  return (
    <AnimatePresence mode="wait" custom={dir} initial={false}>
      <motion.div
        key={state.step}
        custom={dir}
        variants={stepVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={reduce ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
}

function WizardInner() {
  useEffect(() => {
    pixelViewContentPaket();
  }, []);

  return (
    <>
      <FilmGrain />
      <Navbar />
      <CampaignBanner />
      <main className="relative min-h-screen overflow-x-clip bg-rm-black pt-6 pb-40 sm:pt-8 lg:pb-24">
        {/* §8 Hero — sinematik altın bokeh arka planı (LCP: priority/preload) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px] overflow-hidden" aria-hidden>
          <Image
            src={HOME_HERO_WEBP}
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* rgba(0,0,0,0.55) okunabilirlik overlay'i + sayfa zeminine geçiş */}
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.55)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rm-black/60 to-rm-black" />
        </div>
        <div className="section-container relative">
          <header className="mx-auto mb-6 max-w-2xl text-center sm:mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-rm-champagne/25 bg-rm-champagne/[0.06] px-3 py-1.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rm-champagne" />
              <p className="text-[9px] font-semibold tracking-[0.25em] text-rm-champagne uppercase sm:text-[10px]">
                {COPY.header.eyebrow}
              </p>
            </div>
            <h1 className="mt-4 font-editorial text-[clamp(1.75rem,5vw,3.25rem)] leading-[0.98] text-rm-off-white">
              {COPY.header.title}
              <span className="mt-1 block italic text-rm-champagne">
                {COPY.header.titleAccent}
              </span>
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-rm-gray-400">
              {COPY.header.subtitle}
            </p>
          </header>

          <StepIndicator />

          <div className="mx-auto max-w-5xl">
            <StepSwitch />
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <StickyBar />
        </div>
      </main>
      <Footer />
      <ExitCapture />
    </>
  );
}

export function PackageWizard() {
  return (
    <WizardProvider>
      <WizardInner />
    </WizardProvider>
  );
}
