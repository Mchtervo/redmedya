import Script from "next/script";

/** Google Analytics 4 — ölçüm kimliği */
const GA_ID =
  process.env.NEXT_PUBLIC_GA4_ID?.trim() || "G-YXDNEBTFMN";

export function GA4() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            send_page_view: true,
            currency: 'TRY',
            anonymize_ip: true,
            allow_google_signals: true
          });
        `}
      </Script>
    </>
  );
}

export { GA_ID };
