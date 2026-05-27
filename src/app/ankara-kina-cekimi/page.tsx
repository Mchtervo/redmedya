import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ANKARA_SEO_KEYWORDS } from "@/config/seo-keywords";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

export const metadata: Metadata = {
  title: "Ankara Kına Çekimi — Fotoğraf & Video",
  description:
    "Ankara kına gecesi fotoğraf ve sinematik video çekimi. REDMEDYA ile kına paketinizi oluşturun, fiyatı anında görün.",
  keywords: ["ankara kına çekimi", "kına fotoğrafçısı ankara", ...ANKARA_SEO_KEYWORDS],
  alternates: { canonical: `${siteConfig.url}/ankara-kina-cekimi` },
};

export default function AnkaraKinaCekimiPage() {
  return (
    <SeoLandingPage
      eyebrow="Kına · Ankara"
      h1="Ankara kına çekimi — fotoğraf ve sinematik klip"
      intro="Kına geceniz için fotoğraf, video ve isteğe bağlı drone. Diğer etkinliklerle aynı paket oluşturucuda birleştirilir; düğün günüyle tek fatura."
      bullets={[
        "Kına fotoğraf ve video ayrı seçilir",
        "Tüm kareler teslim — poz sınırı yok",
        "Albüm ve canvas baskı eklenebilir",
        "Ankara geneli servis",
      ]}
    />
  );
}
