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
      <main className="min-h-screen bg-rm-black pb-24 pt-28">
        <div className="section-container max-w-3xl">
          <p className="text-[10px] font-semibold tracking-[0.35em] text-rm-champagne uppercase">
            Fiyat rehberi
          </p>
          <h1 className="mt-4 font-editorial text-[clamp(2.25rem,6vw,3.5rem)] leading-tight text-rm-off-white">
            Dış çekim fiyatları
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-rm-gray-400">
            Dış mekân çekiminde fotoğraf ve video ayrı ayrı seçilir; güncel liste fiyatları
            paket oluşturucuda yer alır. Fotoğraf + video + albüm birlikte seçildiğinde dış
            çekim drone çekimi hediye edilir.
          </p>
          <div className="mt-8 rounded-sm border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-rm-gray-400">Örnek başlangıç paketi</p>
            <ul className="mt-4 space-y-2 text-rm-off-white">
              <li>Dış çekim fotoğraf — 5.000₺</li>
              <li>Dış çekim video klip — 5.000₺</li>
              <li>Büyük albüm — 2.500₺’den</li>
              <li className="text-emerald-400">Drone hediye (koşullu)</li>
            </ul>
            <p className="mt-4 text-xs text-rm-gray-500">
              Kesin fiyat için paket oluşturucuda seçim yapın; %20 paket indirimi otomatik
              uygulanır.
            </p>
          </div>
          <Button className="mt-10" variant="default" rounded="full" asChild>
            <Link href="/paket-olustur">Canlı fiyat hesapla</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
