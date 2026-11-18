import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { FaqBlock } from "@/components/seo/faq-block";
import { siteConfig } from "@/config/site";
import { ANKARA_DISTRICTS } from "@/config/seo-keywords";
import { SEO_SERVICE_PAGES, SEO_GUIDE_PAGES } from "@/config/seo-pages";

export type SeoSection = {
  h2: string;
  /** Paragraflar — ilk HTML'de render edilir (botlar okur). */
  body: string[];
  list?: string[];
};

export type SeoLandingProps = {
  eyebrow: string;
  h1: string;
  intro: string;
  bullets: string[];
  sections?: SeoSection[];
  faq?: { q: string; a: string }[];
  ctaLabel?: string;
  /** Service + Breadcrumb şeması için: sayfa yolu (/ankara-...) ve hizmet adı */
  path?: string;
  serviceName?: string;
  /** Rehber yazısı ise yayın tarihi (YYYY-MM-DD) → Article şeması */
  articleDate?: string;
};

const SERVICE_LINKS = [
  ...SEO_SERVICE_PAGES,
  { href: "/galeri", label: "Galeri" },
  { href: "/paket-olustur", label: "Paket oluştur" },
];

/** Rehber yazıları için Article şeması */
function ArticleJsonLd({ path, h1, intro, date }: { path: string; h1: string; intro: string; date: string }) {
  const url = `${siteConfig.url}${path}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: h1,
    description: intro,
    url,
    mainEntityOfPage: url,
    inLanguage: "tr-TR",
    datePublished: date,
    dateModified: date,
    author: { "@id": `${siteConfig.url}/#business` },
    publisher: { "@id": `${siteConfig.url}/#business` },
    image: `${siteConfig.url}/gallery/01.png`,
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: "Rehber", item: `${siteConfig.url}/rehber` },
      { "@type": "ListItem", position: 3, name: h1, item: url },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
    </>
  );
}

function ServiceJsonLd({
  path,
  serviceName,
  description,
  h1,
}: {
  path: string;
  serviceName: string;
  description: string;
  h1: string;
}) {
  const url = `${siteConfig.url}${path}`;
  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: serviceName,
    serviceType: serviceName,
    description,
    url,
    provider: { "@id": `${siteConfig.url}/#business` },
    areaServed: [
      { "@type": "City", name: "Ankara" },
      ...ANKARA_DISTRICTS.map((name) => ({ "@type": "Place", name: `${name}, Ankara` })),
    ],
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `${siteConfig.url}/paket-olustur`,
      servicePhone: `+${siteConfig.defaultPhone}`,
    },
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: siteConfig.url },
      { "@type": "ListItem", position: 2, name: h1, item: url },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(service) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
    </>
  );
}

export function SeoLandingPage({
  eyebrow,
  h1,
  intro,
  bullets,
  sections,
  faq,
  ctaLabel = "Paket oluştur — canlı fiyat",
  path,
  serviceName,
  articleDate,
}: SeoLandingProps) {
  return (
    <>
      <Navbar />
      {path && serviceName && (
        <ServiceJsonLd path={path} serviceName={serviceName} description={intro} h1={h1} />
      )}
      {path && articleDate && (
        <ArticleJsonLd path={path} h1={h1} intro={intro} date={articleDate} />
      )}
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
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="default" rounded="full" asChild>
              <Link href="/paket-olustur">{ctaLabel}</Link>
            </Button>
            <Button variant="outline" rounded="full" asChild>
              <Link href="/galeri">Portfolyo</Link>
            </Button>
          </div>

          {sections?.map((s) => (
            <section key={s.h2} className="mt-12 border-t border-white/10 pt-8 sm:mt-14 sm:pt-10">
              <h2 className="font-editorial text-[clamp(1.375rem,3.5vw,2rem)] leading-snug text-rm-off-white">
                {s.h2}
              </h2>
              {s.body.map((p) => (
                <p
                  key={p.slice(0, 40)}
                  className="mt-4 text-sm leading-relaxed text-rm-gray-400 sm:text-base"
                >
                  {p}
                </p>
              ))}
              {s.list && (
                <ul className="mt-4 space-y-2 text-sm text-rm-gray-300 sm:text-base">
                  {s.list.map((li) => (
                    <li key={li}>· {li}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {faq && faq.length > 0 && (
            <FaqBlock items={faq} className="mt-12 sm:mt-14" />
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            <Button variant="default" rounded="full" asChild>
              <Link href="/paket-olustur">{ctaLabel}</Link>
            </Button>
            <Button variant="outline" rounded="full" asChild>
              <a href={`https://wa.me/${siteConfig.defaultWhatsApp}`}>
                WhatsApp: {siteConfig.displayPhone}
              </a>
            </Button>
          </div>

          <nav className="mt-14 border-t border-white/10 pt-8 text-sm text-rm-gray-500">
            <p className="mb-3 text-[10px] font-semibold tracking-[0.2em] text-rm-gray-600 uppercase">
              Ankara hizmet sayfaları
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {SERVICE_LINKS.filter((l) => l.href !== path).map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-rm-champagne">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 mb-3 text-[10px] font-semibold tracking-[0.2em] text-rm-gray-600 uppercase">
              Düğün rehberi
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {SEO_GUIDE_PAGES.filter((l) => l.href !== path).map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-rm-champagne">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs leading-relaxed text-rm-gray-600">
              Hizmet bölgesi: Ankara — {ANKARA_DISTRICTS.join(", ")} ve çevresi.
            </p>
          </nav>
        </article>
      </main>
      <Footer />
    </>
  );
}
