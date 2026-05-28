import Script from "next/script";
import { siteConfig } from "@/config/site";

/**
 * Meta (Facebook) Pixel — site genelinde yüklenir.
 *
 * - Pixel ID `siteConfig.metaPixelId` üzerinden gelir (env veya fallback).
 * - `strategy="beforeInteractive"` Meta crawler'ının pixel'i sayfa açılır
 *   açılmaz görmesini sağlar; "Bu sitede piksel saptanmadı" hatası buradan kaynaklanır.
 * - PageView ilk yüklemede tetiklenir, sonraki SPA navigasyonları
 *   `MetaPageTracker` tarafından yakalanır.
 */
export function MetaPixel() {
  const pixelId = siteConfig.metaPixelId;
  if (!pixelId) return null;

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
            fbq('track', 'PageView');
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
