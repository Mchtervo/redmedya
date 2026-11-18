import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { siteConfig } from "@/config/site";
import { SEO_GUIDE_PAGES, SEO_SERVICE_PAGES } from "@/config/seo-pages";

export const metadata: Metadata = {
  title: "Düğün Rehberi — Ankara'da Evlenecek Çiftler İçin",
  description:
    "Ankara'da evlenecek çiftler için düğün rehberi: hazırlık listesi, düğün fotoğrafçısı fiyatları, düğün günü akışı ve fotoğrafçı seçerken sorulacak sorular.",
  alternates: { canonical: `${siteConfig.url}/rehber` },
};

export default function RehberPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-rm-black pt-24 pb-32 sm:pt-28 lg:pb-24">
        <div className="section-container max-w-3xl">
          <p className="text-[10px] font-semibold tracking-[0.3em] text-rm-champagne uppercase">
            Rehber
          </p>
          <h1 className="mt-3 font-editorial text-[clamp(1.875rem,6vw,3.5rem)] leading-tight text-rm-off-white">
            Düğün rehberi — Ankara&apos;da evlenecek çiftler için
          </h1>
          <p className="mt-5 text-base leading-relaxed text-rm-gray-400 sm:text-lg">
            Düğün hazırlığında en çok sorulan sorulara, sahada edindiğimiz deneyimle cevap
            veriyoruz.
          </p>
          <ul className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {SEO_GUIDE_PAGES.map((g) => (
              <li key={g.href} className="py-5">
                <Link href={g.href} className="group block">
                  <h2 className="font-editorial text-xl text-rm-off-white group-hover:text-rm-champagne sm:text-2xl">
                    {g.label}
                  </h2>
                  <p className="mt-1 text-sm text-rm-gray-400">{g.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
          <nav className="mt-14 text-sm text-rm-gray-500">
            <p className="mb-3 text-[10px] font-semibold tracking-[0.2em] text-rm-gray-600 uppercase">
              Ankara hizmetlerimiz
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {SEO_SERVICE_PAGES.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-rm-champagne">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </main>
      <Footer />
    </>
  );
}
