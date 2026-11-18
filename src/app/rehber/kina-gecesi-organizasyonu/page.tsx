import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { PRICING } from "@/config/pricing";
import { formatPrice as tl } from "@/lib/utils";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const PATH = "/rehber/kina-gecesi-organizasyonu";

export const metadata: Metadata = {
  title: "Kına Gecesi Organizasyonu — Nasıl Yapılır, Sıralaması Nedir?",
  description:
    "Kına gecesi organizasyonu nasıl yapılır? Kına gecesi sıralaması, gerekli malzemeler, kına kıyafeti, müzik ve fotoğraf çekimi için hazırlık listesi.",
  keywords: [
    "kına gecesi organizasyonu",
    "kına organizasyonu nasıl yapılır",
    "kına organizasyonu sıralaması",
    "kına organizasyonu malzemeleri",
    "kına gecesi nedir",
    "kına kıyafeti",
  ],
  alternates: { canonical: `${siteConfig.url}${PATH}` },
  openGraph: { type: "article", url: `${siteConfig.url}${PATH}` },
};

export default function Page() {
  return (
    <SeoLandingPage
      path={PATH}
      articleDate="2026-11-18"
      eyebrow="Rehber · Kına gecesi"
      h1="Kına gecesi organizasyonu — nasıl yapılır, sıralaması nedir?"
      intro="Kına gecesi, gelinin baba evinden ayrılmadan önce ailesi ve sevdikleriyle geçirdiği, hem hüzünlü hem eğlenceli gecedir. Bu rehberde kına gecesinin nasıl organize edildiğini, tipik bir kına gecesi sıralamasını ve hazırlık listesini bulacaksınız. Kına gelenekleri yöreden yöreye değişir; listeyi kendi ailenizin adetlerine göre uyarlayın."
      bullets={[
        "Mekân ve misafir sayısı ilk karar",
        "Kına malzemeleri ve kıyafet önceden hazır olsun",
        "Akışı yazılı hale getirip fotoğrafçıyla paylaşın",
      ]}
      ctaLabel="Kına çekimini planla"
      sections={[
        {
          h2: "Kına gecesi hazırlık listesi",
          list: [
            "Mekân: ev, bahçe, salon veya kına evi",
            "Misafir listesi ve davet",
            "Gelinin kına kıyafeti (bindallı, kaftan vb.) ve duvağı",
            "Kına, kına tepsisi, mumlar ve eldivenler",
            "Süsleme ve oturma düzeni",
            "Müzik ve kına türküleri",
            "İkram",
            "Fotoğraf ve video çekimi",
          ],
          body: [],
        },
        {
          h2: "Kına gecesi sıralaması",
          body: ["Pek çok kına gecesinde akış kabaca şöyle ilerler:"],
          list: [
            "Misafirlerin gelişi ve eğlence",
            "Gelinin kına kıyafetiyle girişi",
            "Mumlarla gelinin etrafında dönülmesi ve kına türküleri",
            "Kına yakılması",
            "Eğlence, dans ve kapanış",
          ],
        },
        {
          h2: "Kına gecesi fotoğraf ve video",
          body: [
            "Kına gecesi loş ışıklı, mum ışığında ve hareketli geçtiği için fotoğraf açısından zor bir gecedir. Kına yakma ve mumlu tören gibi tek seferlik anlarda fotoğrafçının doğru yerde olması için akışı önceden paylaşın.",
            `REDMEDYA'da kına fotoğraf çekimi ${tl(
              PRICING.ADDON_FOTO_EKEVENT
            )}; video ve drone isteğe göre eklenir ve düğün paketinizle aynı teklifte birleşir.`,
          ],
        },
      ]}
      faq={[
        {
          q: "Kına gecesi nasıl yapılır?",
          a: "Mekân ve misafir listesi belirlenir; kına malzemeleri, kıyafet, müzik ve ikram hazırlanır. Gece eğlence, gelinin girişi, mumlu tören, kına yakılması ve kutlamayla ilerler.",
        },
        {
          q: "Kına organizasyonu için hangi malzemeler gerekir?",
          a: "Kına, kına tepsisi, mumlar, eldivenler, gelinin kına kıyafeti ve duvağı, süsleme malzemeleri ve müzik.",
        },
        {
          q: "Kına kıyafetini hangi taraf alır?",
          a: "Yöreye ve ailelerin geleneklerine göre değişir; iki aileyle önceden konuşmak en sağlıklısıdır.",
        },
        {
          q: "Kına gecesi fotoğrafçısı ne kadar?",
          a: `REDMEDYA'da kına fotoğraf çekimi ${tl(PRICING.ADDON_FOTO_EKEVENT)}'dir.`,
        },
      ]}
    />
  );
}
