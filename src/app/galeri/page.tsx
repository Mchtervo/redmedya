import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GaleriContent } from "./galeri-content";
import { galleryItems } from "@/config/gallery";
import { FilmGrain } from "@/components/effects/film-grain";

export const metadata: Metadata = {
  title: "Galeri — Tüm Çekimler",
  description: `${galleryItems.length} premium düğün ve dış çekim fotoğrafı. REDMEDYA portfolyosu.`,
};

export default function GaleriPage() {
  return (
    <>
      <FilmGrain />
      <Navbar />
      <main className="min-h-screen bg-rm-black pb-24 pt-28 md:pb-16">
        <div className="section-container">
          <p className="text-[10px] tracking-[0.4em] text-rm-champagne uppercase">
            Portfolyo
          </p>
          <h1 className="mt-4 font-editorial text-[clamp(2.25rem,6vw,4rem)] leading-[0.95] text-rm-off-white">
            Tüm çekimler
          </h1>
          <p className="mt-4 max-w-xl text-sm text-rm-gray-400">
            {galleryItems.length} fotoğraf — küçük görsellere tıklayın veya slaytta oklarla
            gezinin. Mobilde parmağınızla sağa/sola kaydırın.
          </p>

          <GaleriContent />

          <div className="mt-16 text-center">
            <Link
              href="/paket-olustur"
              className="inline-flex items-center gap-2 border border-rm-champagne/40 px-8 py-4 text-xs tracking-[0.2em] text-rm-champagne uppercase transition-colors hover:bg-rm-champagne/10"
            >
              Paket oluştur
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
