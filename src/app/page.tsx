import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { siteConfig } from "@/config/site";
import { ANKARA_SEO_KEYWORDS } from "@/config/seo-keywords";

export const metadata: Metadata = {
  title: "Ankara Düğün Fotoğrafçısı & Sinematik Düğün Videosu",
  description:
    "RED MEDIA (REDMEDYA) — Ankara'da düğün fotoğrafçısı, gelin alma, dış çekim, salon ve kına için sinematik video. Online paket oluşturucu ile anında fiyat.",
  keywords: [...ANKARA_SEO_KEYWORDS],
  alternates: { canonical: siteConfig.url },
  openGraph: {
    title: "RED MEDIA | Ankara Düğün Fotoğrafçısı",
    description:
      "Dış çekim, gelin alma klibi, drone ve albüm — tek ekranda paketinizi oluşturun.",
    url: siteConfig.url,
    images: ["/logo-redmedya.png"],
  },
};
import { IntroLoader } from "@/components/layout/intro-loader";
import { Navbar } from "@/components/layout/navbar";
import { HeroSection } from "@/components/home/hero-section";
import { HomePageExtras } from "@/components/home/home-page-extras";
import { CoupleCaseStudies } from "@/components/home/couple-case-studies";
import { SocialTrustSection } from "@/components/home/social-trust-section";
import { StudioShowcase } from "@/components/home/studio-showcase";
import { TestimonialsTabs } from "@/components/home/testimonials-tabs";
import { ReservationCta } from "@/components/home/reservation-cta";
import { FaqSection } from "@/components/home/faq-section";
import { ContactSection } from "@/components/home/contact-section";
import { Footer } from "@/components/layout/footer";

const CinematicGallery = dynamic(
  () =>
    import("@/components/home/cinematic-gallery").then((m) => ({
      default: m.CinematicGallery,
    })),
  { loading: () => <div className="section-light h-96 animate-pulse bg-rm-cream" /> }
);

const StickyActions = dynamic(
  () =>
    import("@/components/layout/sticky-actions").then((m) => ({
      default: m.StickyActions,
    }))
);

export default function HomePage() {
  return (
    <>
      <IntroLoader />
      <Navbar />
      <main>
        <HeroSection />
        <HomePageExtras />
        <StudioShowcase />
        <CinematicGallery />
        <SocialTrustSection />
        <CoupleCaseStudies />
        <TestimonialsTabs />
        <ReservationCta />
        <FaqSection />
        <ContactSection />
      </main>
      <Footer />
      <div className="hidden lg:block">
        <StickyActions />
      </div>
    </>
  );
}
