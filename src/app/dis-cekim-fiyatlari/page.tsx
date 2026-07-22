import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { siteConfig } from "@/config/site";
import { ANKARA_SEO_KEYWORDS } from "@/config/seo-keywords";
import { Button } from "@/components/ui/button";
import { FaqBlock } from "@/components/seo/faq-block";
import { OfferJsonLd } from "@/components/seo/offer-jsonld";
import { FIYAT_FAQ } from "@/config/faq";
import { PACKAGES } from "@/config/pricing";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ankara Dış Çekim & Düğün Paketi Fiyatları 2026",
  description:
    "Ankara dış çekim ve düğün fotoğraf/video paket fiyatları 2026: Paket 1 ₺11.000, Paket 2 ₺15.000, Paket 3 (drone hediye) ₺22.000. Anlaşmalı plato ücretsiz, canlı fiyat hesaplama.",
  keywords: [
    "dış çekim fiyatları",
    "ankara dış çekim fiyatları",
    "düğün paketleri fiyatları",
    ...ANKARA_SEO_KEYWORDS,
  ],
  alternates: { canonical: `${siteConfig.url}/dis-cekim-fiyatlari` },
  openGraph: {
    type: "website",
    url: `${siteConfig.url}/dis-cekim-fiyatlari`,
    title: "Ankara Dış Çekim & Düğün Paketi Fiyatları 2026 | REDMEDYA.CO",
    description:
      "Paketler ₺11.000'den başlar. Anlaşmalı plato ücretsiz, Paket 3'te drone hediye.",
    images: ["/logo-redmedya.png"],
  },
};

export default function DisCekimFiyatlariPage() {
  return (
    <>
      <OfferJsonLd />
      <Navbar />
      <main className="min-h-screen bg-rm-black pt-24 pb-32 sm:pt-28 lg:pb-24">
        <div className="section-container max-w-3xl">
          <p className="text-[10px] font-semibold tracking-[0.3em] text-rm-champagne uppercase sm:tracking-[0.35em]">
            Fiyat rehberi · 2026
          </p>
          <h1 className="mt-3 font-editorial text-[clamp(1.875rem,6vw,3.5rem)] leading-tight text-rm-off-white sm:mt-4">
            Ankara dış çekim & düğün paketi fiyatları
          </h1>
          <p className="mt-5 text-base leading-relaxed text-rm-gray-400 sm:mt-6 sm:text-lg">
            Düğün fotoğraf ve video hizmetimiz üç net pakette sunulur. Anlaşmalı platolarımızda
            dış çekim kampanyayla ücretsizdir; Full Prodüksiyon pakette dış çekim drone çekimi
            hediyedir. Kesin tutarı paket oluşturucuda anında görürsünüz.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {PACKAGES.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
              >
                <p className="text-sm text-rm-champagne">{p.name}</p>
                <p className="text-xs text-rm-gray-400">{p.subtitle}</p>
                <p className="mt-2 font-editorial text-2xl text-rm-off-white">
                  {formatPrice(p.price)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-rm-gray-500">
            Fiyatlara poz sınırsız fotoğraf, sinematik klip ve anlaşmalı plato dahildir.
            Paket 2 ve 3&apos;te albümler, Paket 3&apos;te gelin alma &amp; salon klipleri ve
            hediye drone bulunur.
          </p>

          <Button className="mt-8 sm:mt-10" variant="default" rounded="full" asChild>
            <Link href="/paket-olustur">Canlı fiyat hesapla</Link>
          </Button>

          <FaqBlock
            items={FIYAT_FAQ}
            title="Fiyatlar hakkında sık sorulanlar"
            className="mt-16"
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
