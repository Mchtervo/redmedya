"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { uniquePageViewEventId } from "@/lib/meta-tracking";
import { getSessionId } from "@/lib/track/session";
import { trackFunnelEvent } from "@/lib/analytics/client";

/**
 * SPA route değişiminde PageView.
 * Her gerçek navigasyon → yeni benzersiz event_id (browser+CAPI aynı).
 * İlk yükleme MetaPixel script'inde yapılır — burada atlanır.
 * ViewContent buradan GİTMEZ (/paket-olustur wizard'da session once).
 */
export function MetaPageTracker() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    // İlk mount: Meta Pixel script PageView attı — iç analytics PageView yine kaydedilir
    if (isFirst.current) {
      isFirst.current = false;
      trackFunnelEvent("PageView", {
        metadata: { page_path: pathname, boot: true },
      });
      return;
    }

    const eventId = uniquePageViewEventId(getSessionId());
    trackMetaEvent(
      "PageView",
      { content_name: pathname, page_path: pathname },
      undefined,
      { eventId, mirrorCapi: true }
    );
    trackFunnelEvent("PageView", {
      metadata: { page_path: pathname },
    });
  }, [pathname]);

  return null;
}
