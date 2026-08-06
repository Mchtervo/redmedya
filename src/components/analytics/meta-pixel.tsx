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
            /* §7 CAPI: ilk PageView de aynı event_id ile SUNUCUDAN aynalanır (dedup).
               Tarayıcı fbq çağrısına eventID verilir, aynısı /api/meta-events'e POST edilir. */
            (function(){
              var id = (window.crypto && crypto.randomUUID)
                ? crypto.randomUUID()
                : ('pv_' + Date.now() + '_' + Math.floor(Math.random()*1e9));
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
                }).then(function(r){ return r.json(); }).then(function(d){
                  if (!d || !d.ok) {
                    console.warn('[CAPI] PageView sunucuya gitmedi:',
                      d && d.skipped ? 'META_CAPI_ACCESS_TOKEN sunucuda TANIMLI DEĞİL (env eksik)'
                                     : (d && d.error) || 'bilinmeyen');
                  }
                }).catch(function(e){ console.warn('[CAPI] PageView istek hatası:', e); });
              } catch(e) { console.warn('[CAPI] PageView istisna:', e); }
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
