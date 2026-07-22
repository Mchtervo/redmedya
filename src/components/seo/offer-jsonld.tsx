import { siteConfig } from "@/config/site";
import { PACKAGES } from "@/config/pricing";

/**
 * Paket fiyatları için Service + Offer yapısal verisi.
 * Gerçek satış fiyatları (₺11.000 / ₺15.000 / ₺22.000) → arama sonucunda
 * fiyat görünebilir. "düğün paketleri fiyatları" gibi ticari sorgular için.
 */
export function OfferJsonLd() {
  const prices = PACKAGES.map((p) => p.price);
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Düğün fotoğraf ve video paketi",
    provider: { "@id": `${siteConfig.url}/#business` },
    areaServed: { "@type": "City", name: "Ankara" },
    url: `${siteConfig.url}/paket-olustur`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "TRY",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: PACKAGES.length,
      offers: PACKAGES.map((p) => ({
        "@type": "Offer",
        name: `${p.name} — ${p.subtitle}`,
        price: p.price,
        priceCurrency: "TRY",
        url: `${siteConfig.url}/paket-olustur?p=${p.id}`,
        availability: "https://schema.org/InStock",
        category: "Düğün fotoğrafçılığı",
      })),
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
