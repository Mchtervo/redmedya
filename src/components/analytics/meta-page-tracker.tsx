"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackCustomEvent, trackMetaEvent } from "@/lib/meta-pixel";
import { usePackageStore } from "@/stores/package-store";

const PAGE_LABELS: Record<string, string> = {
  "/": "Ana Sayfa",
  "/paket-olustur": "Paket Oluştur",
  "/galeri": "Galeri",
  "/ankara-dugun-fotografcisi": "SEO Düğün Fotoğrafçısı",
  "/dis-cekim-fiyatlari": "SEO Dış Çekim",
  "/ankara-gelin-alma-klibi": "SEO Gelin Alma",
  "/ankara-dugun-videosu": "SEO Düğün Videosu",
};

/** Her sayfa geçişinde Meta + sepet durumu (onaysız sepet için) */
export function MetaPageTracker() {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;

    const label = PAGE_LABELS[pathname] ?? pathname;
    trackMetaEvent("ViewContent", {
      content_name: label,
      page_path: pathname,
    });
    trackCustomEvent("SitePageView", {
      page_path: pathname,
      page_title: label,
    });
  }, [pathname]);

  useEffect(() => {
    if (!pathname.startsWith("/paket-olustur")) return;

    const reportCart = () => {
      const state = usePackageStore.getState();
      const count = state.getSelectedCount();
      if (count === 0) return;

      const total = state.getTotal();
      const items = state
        .getSelectedLineItems()
        .map((l) => l.name)
        .join(" | ");

      trackCustomEvent("PackageCartSnapshot", {
        item_count: count,
        value: total,
        currency: "TRY",
        cart_items: items.slice(0, 500),
        page_path: pathname,
      });
    };

    const id = window.setInterval(reportCart, 45_000);
    const onLeave = () => reportCart();
    window.addEventListener("pagehide", onLeave);

    return () => {
      clearInterval(id);
      window.removeEventListener("pagehide", onLeave);
    };
  }, [pathname]);

  return null;
}
