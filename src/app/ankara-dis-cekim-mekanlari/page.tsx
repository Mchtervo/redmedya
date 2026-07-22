import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { siteConfig } from "@/config/site";
import { ANKARA_SEO_KEYWORDS } from "@/config/seo-keywords";
import { Button } from "@/components/ui/button";
import { FaqBlock } from "@/components/seo/faq-block";
import { DISCEKIM_FAQ } from "@/config/faq";
import { PLATO_OPTIONS } from "@/config/pricing";

export const metadata: Metadata = {
  title: "Ankara Dış Çekim Mekanları & Platoları",
  description:
    "Ankara dış çekim mekanları ve platoları: anlaşmalı stüdyo platolarımız (No25, Anka ve diğerleri) kampanyayla ÜCRETSİZ. Her mevsim sinematik dış çekim, drone ve albüm seçenekleri.",
  keywords: [
    "ankara dış çekim mekanları",
    "ankara dış çekim platoları",
    "ankara plato çekimi",
    "dış çekim mekanları",
    ...ANKARA_SEO_KEYWORDS,
  ],
  alternates: { canonical: `${siteConfig.url}/ankara-dis-cekim-mekanlari` },
  openGraph: {
    type: "website",
    url: `${siteConfig.url}/ankara-dis-cekim-mekanlari`,
    title: "Ankara Dış Çekim Mekanları & Platoları | REDMEDYA.CO",
    description:
      "Anlaşmalı platolarımızda dış çekim kampanyayla ücretsiz. No25, Anka ve daha fazlası.",
    images: ["/logo-redmedya.png"],
  },
};

const agreedPlatos = PLATO_OPTIONS.filter((p) => p.free);

export default function AnkaraDisCekimMekanlariPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-rm-black pt-24 pb-32 sm:pt-28 lg:pb-24">
        <div className="section-container max-w-3xl">
          <p className="text-[10px] font-semibold tracking-[0.3em] text-rm-champagne uppercase sm:tracking-[0.35em]">
            Ankara · Dış çekim
          </p>
          <h1 className="mt-3 font-editorial text-[clamp(1.875rem,6vw,3.5rem)] leading-tight text-rm-off-white sm:mt-4">
            Ankara dış çekim mekanları & platoları
          </h1>
          <p className="mt-5 text-base leading-relaxed text-rm-gray-400 sm:mt-6 sm:text-lg">
            Dış çekimlerimizi anlaşmalı stüdyo platolarımızda veya açık mekânlarda yapıyoruz.
            Plato, ışığı ve dekoru kontrol edilebilen kapalı çekim stüdyosudur; hava
            koşullarından bağımsız, her mevsim sinematik kalite sağlar. Kampanya süresince
            anlaşmalı plato kullanımı <span className="text-rm-champagne">ücretsizdir</span>.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {agreedPlatos.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
              >
                <p className="font-medium text-rm-off-white">{p.name}</p>
                <p className="mt-1 text-xs font-semibold text-emerald-400">
                  Kampanyayla ücretsiz
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm font-semibold text-rm-off-white">
              Kendi mekânınızda çekim
            </p>
            <p className="mt-2 text-sm leading-relaxed text-rm-gray-400">
              Dilerseniz kendi belirlediğiniz açık mekânda da çekim yapıyoruz; bu durumda
              paketten ₺2.000 indirim uygulanır, mekân organizasyonu size ait olur.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 sm:mt-10 sm:gap-4">
            <Button variant="default" rounded="full" asChild>
              <Link href="/paket-olustur">Paket oluştur — plato seç</Link>
            </Button>
            <Button variant="outline" rounded="full" asChild>
              <Link href="/dis-cekim-fiyatlari">Fiyatları gör</Link>
            </Button>
          </div>

          <FaqBlock
            items={DISCEKIM_FAQ}
            title="Dış çekim & plato hakkında sık sorulanlar"
            className="mt-16"
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
