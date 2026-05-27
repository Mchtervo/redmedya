"use client";

import { useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CampaignWelcomeModal } from "@/components/package/campaign-welcome-modal";
import { PackagePromoBar } from "@/components/package/package-promo-bar";
import { PackageMobileBar } from "@/components/package/package-mobile-bar";
import { ConversionToast } from "@/components/package/conversion-toast";
import { PackageCampaignBanner } from "@/components/package/package-campaign-banner";
import { DroneBundleOfferCard } from "@/components/package/drone-bundle-offer-card";
import { usePackageStore } from "@/stores/package-store";
import { usePackageDraftSync } from "@/hooks/use-package-draft-sync";
import { useAutoCampaignKlip } from "@/hooks/use-auto-campaign-klip";
import { trackMetaEvent } from "@/lib/meta-pixel";
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
    trackMetaEvent("ViewContent", { content_name: "package_builder" });
    trackMetaEvent("InitiateCheckout");
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
      <main className="relative min-h-screen bg-rm-black pt-28 md:pt-32">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-rm-champagne/[0.06] to-transparent"
          aria-hidden
        />
        <div className="section-container relative">
          <header className="mb-12 max-w-3xl md:mb-16">
            <p className="text-[10px] font-semibold tracking-[0.4em] text-rm-champagne uppercase">
              Paket oluşturucu
            </p>
            <h1 className="mt-5 font-editorial text-[clamp(2.25rem,6vw,4.25rem)] leading-[0.95] text-rm-off-white">
              Kendi sinematik
              <span className="block italic text-rm-champagne">paketinizi tasarlayın</span>
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-rm-gray-400">
              Etkinlik ve ürünleri seçin; her hizmetin kapsamı açıklamasında yer alır. Toplam canlı
              güncellenir, teklifi WhatsApp ile iletin.
            </p>
          </header>

          <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-14 xl:grid-cols-[1fr_400px]">
            <div id="paket-hizmetler" className="min-w-0 scroll-mt-32">
              <PackagePromoBar />
              <PackageCampaignBanner />
              <ServiceGrid />
            </div>

            <div id="paket-ozeti" className="lg:sticky lg:top-28 lg:self-start">
              <CartSummary className="hidden lg:flex" />
            </div>
          </div>

          <div className="mt-12 lg:hidden">
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
