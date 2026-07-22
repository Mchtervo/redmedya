import type { Metadata } from "next";
import { PackageWizard } from "./_wizard/wizard";
import { OfferJsonLd } from "@/components/seo/offer-jsonld";
import { siteConfig } from "@/config/site";
import { ANKARA_SEO_KEYWORDS } from "@/config/seo-keywords";

// SEO başlığı ve meta korunur; wizard client-side çalışır.
export const metadata: Metadata = {
  title: "Düğün Paketi Oluştur — Canlı Fiyat",
  description:
    "3 adımda kendi düğün paketinizi kurun: Paket 1 ₺11.000, Paket 2 ₺15.000, Paket 3 (drone hediye) ₺22.000. Plato ücretsiz kampanyası, canlı fiyat ve WhatsApp ile tek tıkla rezervasyon.",
  keywords: ["düğün paketi oluştur", "düğün paketleri fiyatları", ...ANKARA_SEO_KEYWORDS],
  alternates: { canonical: `${siteConfig.url}/paket-olustur` },
  openGraph: {
    type: "website",
    url: `${siteConfig.url}/paket-olustur`,
    title: "Düğün Paketi Oluştur — Canlı Fiyat | REDMEDYA.CO",
    description:
      "Paketini seç, güçlendir, tarihini kilitle. Plato ücretsiz, Paket 3'te drone hediye.",
    images: ["/logo-redmedya.png"],
  },
};

export default function PaketOlusturPage() {
  return (
    <>
      {/* Paket kartları offers'ı görünür kılar → fiyat zengin sonucu uyumlu */}
      <OfferJsonLd />
      <PackageWizard />
    </>
  );
}
