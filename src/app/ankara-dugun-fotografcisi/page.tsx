import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { siteConfig } from "@/config/site";
import { ANKARA_SEO_KEYWORDS } from "@/config/seo-keywords";
import { Button } from "@/components/ui/button";
import { FaqBlock } from "@/components/seo/faq-block";
import { OfferJsonLd } from "@/components/seo/offer-jsonld";
import { GENERAL_FAQ } from "@/config/faq";

export const metadata: Metadata = {
  title: "Ankara Düğün Fotoğrafçısı",
  description:
    "Ankara düğün fotoğrafçısı REDMEDYA — dış çekim, gelin alma, salon sinematik klip, drone ve canlı paket fiyatı. Paketler ₺11.000'den, anlaşmalı plato ücretsiz.",
  keywords: [...ANKARA_SEO_KEYWORDS],
  alternates: { canonical: `${siteConfig.url}/ankara-dugun-fotografcisi` },
  openGraph: {
    type: "website",
    url: `${siteConfig.url}/ankara-dugun-fotografcisi`,
    title: "Ankara Düğün Fotoğrafçısı | REDMEDYA.CO",
    description:
      "Dış çekim, gelin alma, salon klibi ve drone. Paketler ₺11.000'den, plato ücretsiz.",
    images: ["/logo-redmedya.png"],
  },
};

export default function AnkaraDugunFotografcisiPage() {
  return (
    <>
      <OfferJsonLd />
      <Navbar />
      <main className="min-h-screen bg-rm-black pt-24 pb-32 sm:pt-28 lg:pb-24">
        <div className="section-container max-w-3xl">
          <p className="text-[10px] font-semibold tracking-[0.3em] text-rm-champagne uppercase sm:tracking-[0.35em]">
            Ankara
          </p>
          <h1 className="mt-3 font-editorial text-[clamp(1.875rem,6vw,3.5rem)] leading-tight text-rm-off-white sm:mt-4">
            Ankara düğün fotoğrafçısı — sinematik hikâyeniz
          </h1>
          <p className="mt-5 text-base leading-relaxed text-rm-gray-400 sm:mt-6 sm:text-lg">
            REDMEDYA olarak Ankara ve çevresinde dış çekim, gelin alma, kına, nikah ve salon
            düğünü için fotoğraf ve video hizmeti sunuyoruz. Paketinizi online oluşturun,
            fiyatı anında görün, WhatsApp ile teklif alın.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-rm-gray-300 sm:mt-8 sm:space-y-3 sm:text-base">
            <li>· Üç net paket: ₺11.000, ₺15.000 ve ₺22.000 (canlı hesap)</li>
            <li>· Sinematik salon klibi + kampanyalı gelin alma klipleri</li>
            <li>· Anlaşmalı plato kampanyayla ÜCRETSİZ</li>
            <li>· Full Prodüksiyon pakette dış çekim drone HEDİYE</li>
            <li>· Poz sınırsız çekim, tüm kareler teslim</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3 sm:mt-10 sm:gap-4">
            <Button variant="default" rounded="full" asChild>
              <Link href="/paket-olustur">Paket oluştur</Link>
            </Button>
            <Button variant="outline" rounded="full" asChild>
              <Link href="/dis-cekim-fiyatlari">Fiyatları gör</Link>
            </Button>
          </div>

          <FaqBlock items={GENERAL_FAQ} className="mt-16" />
        </div>
      </main>
      <Footer />
    </>
  );
}
