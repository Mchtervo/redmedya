import { siteConfig } from "@/config/site";
import { ANKARA_DISTRICTS } from "@/config/seo-keywords";
import { PACKAGES } from "@/config/pricing";

export function JsonLd() {
  const logoUrl = `${siteConfig.url}/logo-redmedya.png`;

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${siteConfig.url}/#business`,
    name: "RED MEDIA — REDMEDYA",
    alternateName: ["REDMEDYA", "REDMEDYA.CO", "Red Media Ankara"],
    description:
      "Ankara düğün fotoğrafçısı ve sinematik düğün videosu. Dış çekim, gelin alma, kına, nikah, salon düğünü, drone ve paket oluşturucu ile şeffaf fiyat.",
    url: siteConfig.url,
    logo: logoUrl,
    image: [logoUrl, `${siteConfig.url}/og-image.jpg`],
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address,
      addressLocality: "Ankara",
      addressRegion: "Ankara",
      addressCountry: "TR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 39.9334,
      longitude: 32.8597,
    },
    areaServed: ANKARA_DISTRICTS.map((name) => ({
      "@type": "City",
      name,
      containedInPlace: { "@type": "AdministrativeArea", name: "Ankara" },
    })),
    priceRange: `₺${Math.min(...PACKAGES.map((p) => p.price)).toLocaleString(
      "tr-TR"
    )}+`,
    telephone: `+${siteConfig.defaultPhone}`,
    email: siteConfig.email,
    sameAs: [siteConfig.instagram, siteConfig.dugun],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "09:00",
        closes: "21:00",
      },
    ],
    knowsAbout: [
      "düğün fotoğrafçılığı",
      "düğün videosu",
      "gelin alma çekimi",
      "dış çekim",
      "plato çekimi",
      "sinematik klip",
      "drone düğün çekimi",
      "düğün albümü",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Düğün fotoğraf ve video paketleri",
      itemListElement: PACKAGES.map((p) => ({
        "@type": "Offer",
        name: `${p.name} — ${p.subtitle}`,
        price: p.price,
        priceCurrency: "TRY",
        url: `${siteConfig.url}/paket-olustur?p=${p.id}`,
        itemOffered: {
          "@type": "Service",
          name: `${p.name} — ${p.subtitle}`,
          serviceType: "Düğün fotoğraf ve video paketi",
        },
      })),
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: "tr-TR",
    publisher: { "@id": `${siteConfig.url}/#business` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/paket-olustur`,
      "query-input": "required name=search_term_string",
    },
  };

  const breadcrumbHome = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Ana Sayfa",
        item: siteConfig.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Paket Oluştur",
        item: `${siteConfig.url}/paket-olustur`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbHome) }}
      />
    </>
  );
}
