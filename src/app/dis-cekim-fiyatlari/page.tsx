import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { siteConfig } from "@/config/site";
import { ANKARA_SEO_KEYWORDS } from "@/config/seo-keywords";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Dış Çekim Fiyatları",
  description:
    "Ankara dış çekim fotoğraf ve video fiyatları 2026. REDMEDYA paket oluşturucu ile canlı fiyat, albüm ve drone hediye kampanyası.",
  keywords: ["dış çekim fiyatları", "ankara dış çekim", ...ANKARA_SEO_KEYWORDS],
  alternates: { canonical: `${siteConfig.url}/dis-cekim-fiyatlari` },
};

export default function DisCekimFiyatlariPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-rm-black pt-24 pb-32 sm:pt-28 lg:pb-24">
        <div className="section-container max-w-3xl">
          <p className="text-[10px] font-semibold tracking-[0.3em] text-rm-champagne uppercase sm:tracking-[0.35em]">
            Fiyat rehberi
          </p>
          <h1 className="mt-3 font-editorial text-[clamp(1.875rem,6vw,3.5rem)] leading-tight text-rm-off-white sm:mt-4">
            Dış çekim fiyatları
          </h1>
          <p className="mt-5 text-base leading-relaxed text-rm-gray-400 sm:mt-6 sm:text-lg">
            Dış mekân çekiminde fotoğraf ve video ayrı ayrı seçilir; güncel liste fiyatları
            paket oluşturucuda yer alır. Fotoğraf + video + albüm birlikte seçildiğinde dış
            çekim drone çekimi hediye edilir.
          </p>
          <div className="mt-6 rounded-sm border border-white/10 bg-white/[0.03] p-4 sm:mt-8 sm:p-6">
            <p className="text-sm text-rm-gray-400">Örnek başlangıç paketi</p>
            <ul className="mt-3 space-y-2 text-sm text-rm-off-white sm:mt-4 sm:text-base">
              <li>Dış çekim fotoğraf — 5.000₺</li>
              <li>Dış çekim video klip — 5.000₺</li>
              <li>Büyük albüm — 2.500₺’den</li>
              <li className="text-emerald-400">Drone hediye (koşullu)</li>
            </ul>
            <p className="mt-3 text-xs text-rm-gray-500 sm:mt-4">
              Kesin fiyat için paket oluşturucuda seçim yapın; %20 paket indirimi otomatik
              uygulanır.
            </p>
          </div>
          <Button className="mt-8 sm:mt-10" variant="default" rounded="full" asChild>
            <Link href="/paket-olustur">Canlı fiyat hesapla</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
