"use client";

import { useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CampaignWelcomeModal } from "@/components/package/campaign-welcome-modal";
import { PackageMobileBar } from "@/components/package/package-mobile-bar";
import { ConversionToast } from "@/components/package/conversion-toast";
import { PackageCampaignBanner } from "@/components/package/package-campaign-banner";
import { DroneBundleOfferCard } from "@/components/package/drone-bundle-offer-card";
import { usePackageStore } from "@/stores/package-store";
import { usePackageDraftSync } from "@/hooks/use-package-draft-sync";
import { useAutoCampaignKlip } from "@/hooks/use-auto-campaign-klip";
import { FilmGrain } from "@/components/effects/film-grain";

const ServiceGrid = dynamic(
  () => import("@/components/package/service-grid").then((m) => ({ default: m.ServiceGrid })),
  {
    loading: () => (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-sm bg-rm-black-elevated" />
        ))}
      </div>
    ),
  }
);

const CartSummary = dynamic(
  () => import("@/components/package/cart-summary").then((m) => ({ default: m.CartSummary })),
  { ssr: false }
);

export function PackageBuilderClient() {
  const hydrateFromCms = usePackageStore((s) => s.hydrateFromCms);
  const hydrateSiteSettings = usePackageStore((s) => s.hydrateSiteSettings);

  usePackageDraftSync();
  useAutoCampaignKlip();

  const reloadSiteData = useCallback(() => {
    Promise.all([
      fetch("/api/public/cms", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/public/site-settings", { cache: "no-store" }).then((r) =>
        r.json()
      ),
    ])
      .then(([cms, settings]) => {
        hydrateFromCms(cms);
        hydrateSiteSettings({ seasonalRules: settings.seasonalRules ?? [] });
      })
      .catch(() => {});
  }, [hydrateFromCms, hydrateSiteSettings]);

  useEffect(() => {
    // Legacy builder Meta funnel'a event göndermez (aktif sayfa: _wizard)
    reloadSiteData();
  }, [reloadSiteData]);

  useEffect(() => {
    const onFocus = () => reloadSiteData();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [reloadSiteData]);

  return (
    <>
      <FilmGrain />
      <CampaignWelcomeModal />
      <Navbar />
      <main className="relative min-h-screen overflow-x-clip bg-rm-black pt-20 pb-40 sm:pt-24 md:pt-32 lg:pb-0">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-rm-champagne/[0.08] via-rm-champagne/[0.02] to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-40 -left-32 h-96 w-96 rounded-full bg-rm-champagne/[0.04] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-60 -right-32 h-96 w-96 rounded-full bg-rm-champagne/[0.03] blur-3xl"
          aria-hidden
        />

        <div className="section-container relative">
          <header className="mb-8 max-w-3xl sm:mb-10 md:mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-rm-champagne/25 bg-rm-champagne/[0.06] px-3 py-1.5 backdrop-blur-sm sm:px-4">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rm-champagne" />
              <p className="text-[9px] font-semibold tracking-[0.25em] text-rm-champagne uppercase sm:text-[10px] sm:tracking-[0.3em]">
                Paket oluşturucu · canlı fiyat
              </p>
            </div>
            <h1 className="mt-5 font-editorial text-[clamp(1.875rem,6vw,4.25rem)] leading-[0.95] text-rm-off-white sm:mt-6">
              Kendi sinematik
              <span className="mt-1 block italic text-rm-champagne">paketinizi tasarlayın</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-rm-gray-400 sm:mt-6 md:text-base">
              Etkinlik ve ürünleri seçin; her hizmetin kapsamı açıklamasında yer alır.
              Toplam canlı güncellenir, rezervasyonunuzu WhatsApp ile tek tıkla onaylayın.
            </p>
          </header>

          <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_420px] xl:gap-14">
            <div id="paket-hizmetler" className="min-w-0 scroll-mt-32">
              <PackageCampaignBanner />
              <ServiceGrid />
            </div>

            <div id="paket-ozeti" className="lg:sticky lg:top-24 lg:self-start">
              <CartSummary className="hidden lg:flex" />
            </div>
          </div>

          <div className="mt-10 lg:hidden">
            <CartSummary />
          </div>
        </div>
      </main>
      <PackageMobileBar />
      <DroneBundleOfferCard />
      <ConversionToast />
      <Footer />
    </>
  );
}
