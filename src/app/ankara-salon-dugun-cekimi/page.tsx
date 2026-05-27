import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ANKARA_SEO_KEYWORDS } from "@/config/seo-keywords";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

export const metadata: Metadata = {
  title: "Ankara Salon Düğün Çekimi — Klip & Fotoğraf",
  description:
    "Ankara salon düğünü fotoğraf ve salon girişi / ilk dans sinematik klip. REDMEDYA paket oluşturucu.",
  keywords: ["ankara salon düğün çekimi", "salon klip ankara", ...ANKARA_SEO_KEYWORDS],
  alternates: { canonical: `${siteConfig.url}/ankara-salon-dugun-cekimi` },
};

export default function AnkaraSalonDugunCekimiPage() {
  return (
    <SeoLandingPage
      eyebrow="Salon düğünü · Ankara"
      h1="Ankara salon düğün çekimi — giriş ve ilk dans klibi"
      intro="Salon düğününüzde fotoğraf, drone ve sinematik salon girişi / ilk dans klip kampanyası. Video klip ile kampanya klip aynı hizmettir; yalnızca sinematik klip kartı gösterilir."
      bullets={[
        "Salon fotoğraf ve sinematik klip",
        "Omuz kamera ile tam akış kaydı",
        "Kampanyalı salon girişi klip fiyatı paket oluşturucuda",
        "WhatsApp teklif ve onay süreci",
      ]}
    />
  );
}
