import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/lib/gtag";

/**
 * Google Analytics 4 — root layout (App Router).
 * İlk page_view GA4PageTracker tarafından gönderilir (SPA çift sayım önlenir).
 */
export function GA4() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            send_page_view: false,
            currency: 'TRY',
            anonymize_ip: true,
            allow_google_signals: true
          });
        `}
      </Script>
    </>
  );
}
