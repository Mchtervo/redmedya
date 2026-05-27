"use client";

import dynamic from "next/dynamic";
import { MetaPageTracker } from "@/components/analytics/meta-page-tracker";
import { GA4PageTracker } from "@/components/analytics/ga4-page-tracker";

const MobileBottomBar = dynamic(
  () =>
    import("@/components/layout/mobile-bottom-bar").then((m) => ({
      default: m.MobileBottomBar,
    })),
  { ssr: false }
);

/** Tüm public sayfalarda mobil iletişim çubuğu + sayfa izleme */
export function SiteChrome() {
  return (
    <>
      <MetaPageTracker />
      <GA4PageTracker />
      <MobileBottomBar />
    </>
  );
}
