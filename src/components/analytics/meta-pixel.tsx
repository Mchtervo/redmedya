"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";
import {
  isMetaTrackingLiveBrowser,
  logMetaDebug,
  uniquePageViewEventId,
} from "@/lib/meta-tracking";
import { getSessionId } from "@/lib/track/session";

/**
 * Meta Pixel — yalnızca production düğün domainlerinde yüklenir.
 * İlk PageView: benzersiz event_id (browser + CAPI aynı).
 * SPA navigasyonları MetaPageTracker ile (yine unique id).
 */
export function MetaPixel() {
  const pixelId = siteConfig.metaPixelId;
  const [mode, setMode] = useState<"pending" | "live" | "debug">("pending");
  const [pageViewId, setPageViewId] = useState<string | null>(null);

  useEffect(() => {
    const live = isMetaTrackingLiveBrowser();
    setMode(live ? "live" : "debug");
    if (live) {
      // Tek üretim → script içinde fbq + CAPI aynı id
      setPageViewId(uniquePageViewEventId(getSessionId()));
    } else {
      logMetaDebug({
        event: "PageView",
        event_id: uniquePageViewEventId(getSessionId() || "debug"),
        url: window.location.href,
        source: "browser",
        reason: "Pixel script yüklenmedi (localhost/dev/preview)",
      });
    }
  }, []);

  if (!pixelId || mode === "pending" || mode === "debug" || !pageViewId) {
    return null;
  }

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            (function(){
              var id = ${JSON.stringify(pageViewId)};
              fbq('track', 'PageView', {}, { eventID: id });
              try {
                fetch('/api/meta-events', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  keepalive: true,
                  body: JSON.stringify({
                    eventName: 'PageView',
                    eventId: id,
                    eventSourceUrl: location.href,
                    currency: 'TRY'
                  })
                }).catch(function(){});
              } catch(e) {}
            })();
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
