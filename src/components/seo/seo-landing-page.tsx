import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

export type SeoLandingProps = {
  eyebrow: string;
  h1: string;
  intro: string;
  bullets: string[];
  faq?: { q: string; a: string }[];
  ctaLabel?: string;
};

export function SeoLandingPage({
  eyebrow,
  h1,
  intro,
  bullets,
  faq,
  ctaLabel = "Paket oluştur — canlı fiyat",
}: SeoLandingProps) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-rm-black pt-24 pb-32 sm:pt-28 lg:pb-24">
        <article className="section-container max-w-3xl">
          <p className="text-[10px] font-semibold tracking-[0.3em] text-rm-champagne uppercase sm:tracking-[0.35em]">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-editorial text-[clamp(1.875rem,6vw,3.5rem)] leading-tight text-rm-off-white sm:mt-4">
            {h1}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-rm-gray-400 sm:mt-6 sm:text-lg">
            {intro}
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-rm-gray-300 sm:mt-8 sm:space-y-3 sm:text-base">
            {bullets.map((b) => (
              <li key={b}>· {b}</li>
            ))}
          </ul>
          {faq && faq.length > 0 && (
            <section className="mt-10 border-t border-white/10 pt-8 sm:mt-12 sm:pt-10">
              <h2 className="font-display text-xl text-rm-off-white">Sık sorulanlar</h2>
              <dl className="mt-5 space-y-5 sm:mt-6 sm:space-y-6">
                {faq.map((item) => (
                  <div key={item.q}>
                    <dt className="text-sm font-medium text-rm-champagne">{item.q}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-rm-gray-400">{item.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          <div className="mt-8 flex flex-wrap gap-3 sm:mt-10">
            <Button variant="default" rounded="full" asChild>
              <Link href="/paket-olustur">{ctaLabel}</Link>
            </Button>
            <Button variant="outline" rounded="full" asChild>
              <Link href="/galeri">Portfolyo</Link>
            </Button>
          </div>
          <nav className="mt-14 border-t border-white/10 pt-8 text-sm text-rm-gray-500">
            <p className="mb-3 text-[10px] font-semibold tracking-[0.2em] text-rm-gray-600 uppercase">
              Ankara hizmet sayfaları
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              <li>
                <Link href="/ankara-dugun-fotografcisi" className="hover:text-rm-champagne">
                  Düğün fotoğrafçısı
                </Link>
              </li>
              <li>
                <Link href="/dis-cekim-fiyatlari" className="hover:text-rm-champagne">
                  Dış çekim fiyatları
                </Link>
              </li>
              <li>
                <Link href="/ankara-gelin-alma-klibi" className="hover:text-rm-champagne">
                  Gelin alma klibi
                </Link>
              </li>
              <li>
                <Link href="/ankara-dugun-videosu" className="hover:text-rm-champagne">
                  Düğün videosu
                </Link>
              </li>
              <li>
                <Link href="/ankara-kina-cekimi" className="hover:text-rm-champagne">
                  Kına çekimi
                </Link>
              </li>
              <li>
                <Link href="/ankara-salon-dugun-cekimi" className="hover:text-rm-champagne">
                  Salon düğün çekimi
                </Link>
              </li>
            </ul>
          </nav>
        </article>
      </main>
      <Footer />
    </>
  );
}
