"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { MetaPageTracker } from "@/components/analytics/meta-page-tracker";
import { GA4PageTracker } from "@/components/analytics/ga4-page-tracker";

const MobileBottomBar = dynamic(
  () =>
    import("@/components/layout/mobile-bottom-bar").then((m) => ({
      default: m.MobileBottomBar,
    })),
  { ssr: false }
);

const StickyActions = dynamic(
  () =>
    import("@/components/layout/sticky-actions").then((m) => ({
      default: m.StickyActions,
    })),
  { ssr: false }
);

/** Tüm public sayfalarda mobil + masaüstü iletişim çubuğu + sayfa izleme */
export function SiteChrome() {
  const pathname = usePathname();
  const hideSticky =
    pathname.startsWith("/admin") || pathname.startsWith("/paket-olustur");

  return (
    <>
      <MetaPageTracker />
      <GA4PageTracker />
      <MobileBottomBar />
      {!hideSticky && (
        <div className="hidden lg:block">
          <StickyActions />
        </div>
      )}
    </>
  );
}
