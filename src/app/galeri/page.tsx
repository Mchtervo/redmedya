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
      <main className="relative min-h-screen bg-rm-black pt-28 pb-24 md:pb-16">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-rm-champagne/[0.05] to-transparent"
          aria-hidden
        />
        <div className="section-container relative">
          <header className="max-w-3xl">
            <p className="text-[10px] font-semibold tracking-[0.4em] text-rm-champagne uppercase">
              Portfolyo
            </p>
            <h1 className="mt-5 font-editorial text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.95] text-rm-off-white">
              Tüm{" "}
              <span className="italic text-rm-champagne-light">çekimler</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-rm-gray-400">
              <span className="font-semibold text-rm-off-white">
                {galleryItems.length}
              </span>{" "}
              fotoğraf — küçük görsellere tıklayın veya slaytta oklarla gezinin.
              Mobilde parmağınızla sağa/sola kaydırın.
            </p>
          </header>

          <div className="mt-10">
            <GaleriContent />
          </div>

          <div className="mt-20 text-center">
            <Link
              href="/paket-olustur"
              className="group inline-flex items-center gap-2 rounded-full bg-rm-champagne px-8 py-3.5 text-[11px] font-bold tracking-[0.2em] text-rm-black uppercase shadow-[0_8px_30px_rgba(196,160,82,0.25)] transition-all hover:bg-rm-champagne-light"
            >
              Paket oluştur
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
