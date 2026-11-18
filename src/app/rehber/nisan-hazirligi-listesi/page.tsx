import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { PRICING } from "@/config/pricing";
import { formatPrice as tl } from "@/lib/utils";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const PATH = "/rehber/nisan-hazirligi-listesi";

export const metadata: Metadata = {
  title: "Nişan Hazırlığı Listesi — Nişanda Neler Yapılır, Ne Alınır?",
  description:
    "Nişan hazırlığı listesi: nişan tarihi, mekân, nişan elbisesi, nişan tepsisi, yüzük, ikram, süsleme ve fotoğrafçı. Nişan hazırlığında neler yapılır, ne kadar sürer?",
  keywords: [
    "nişan hazırlığı listesi",
    "nişan hazırlığında neler yapılır",
    "nişan hazırlığı nasıl yapılır",
    "nişan tepsisi",
    "nişan elbisesi",
    "evde nişan hazırlığı",
    "söz nişan",
  ],
  alternates: { canonical: `${siteConfig.url}${PATH}` },
  openGraph: { type: "article", url: `${siteConfig.url}${PATH}` },
};

export default function Page() {
  return (
    <SeoLandingPage
      path={PATH}
      articleDate="2026-11-18"
      eyebrow="Rehber · Nişan"
      h1="Nişan hazırlığı listesi — nişanda neler yapılır, ne alınır?"
      intro="Nişan, düğün yolculuğunun ilk resmi adımı ve iki ailenin bir araya geldiği ilk büyük gündür. Evde, salonda ya da restoranda yapılsın, hazırlık listesi büyük ölçüde aynıdır. Aşağıdaki listeyi kendi nişanınıza göre uyarlayın; geleneklerin aileden aileye ve yöreden yöreye değişebileceğini unutmayın."
      bullets={[
        "Tarih, mekân ve misafir sayısı ilk adım",
        "Yüzük ve nişan tepsisi önceden hazır olsun",
        "Fotoğrafçıyı nişan programına göre ayarlayın",
      ]}
      ctaLabel="Nişan çekimini planla"
      sections={[
        {
          h2: "Nişan hazırlığı listesi",
          list: [
            "Nişan tarihi ve saatinin iki aileyle belirlenmesi",
            "Mekân: ev, bahçe, salon veya restoran",
            "Misafir listesi ve davet",
            "Nişan yüzükleri",
            "Nişan tepsisi ve kurdele, makas",
            "Nişan elbisesi ve damadın kıyafeti",
            "Kuaför ve makyaj",
            "Süsleme ve çiçekler",
            "İkram: pasta, tatlı, içecek",
            "Müzik",
            "Fotoğraf ve video çekimi",
          ],
          body: [],
        },
        {
          h2: "Nişan tepsisi ve nişan elbisesi kim tarafından alınır?",
          body: [
            "Nişan tepsisinin, nişan elbisesinin ve diğer kalemlerin hangi tarafça alınacağı yöreye ve ailelerin geleneklerine göre değişir. Karışıklık olmaması için hangi kalemi kimin hazırlayacağını en başta iki aileyle konuşup netleştirin.",
          ],
        },
        {
          h2: "Evde nişan nasıl hazırlanır?",
          body: [
            "Evde nişan samimi ve bütçe dostudur; ama misafir sayısına göre alan planlaması önemlidir. Yüzüklerin takılacağı köşeyi, arka planı sade ve ışığı iyi bir yerde hazırlayın; bu köşe nişanın en çok fotoğraflanan yeri olacak. Pencere ışığı alan bir duvar önü, fotoğraflar için çoğu zaman en güzel sonuç verir.",
          ],
        },
        {
          h2: "Nişan programı nasıl sıralanır?",
          list: [
            "Misafirlerin karşılanması",
            "Konuşmalar ve iki ailenin tanışması",
            "Yüzüklerin takılması ve kurdelenin kesilmesi",
            "Tebrikler, toplu fotoğraflar",
            "İkram ve kutlama",
          ],
          body: ["Program yöreye göre değişebilir; akışı fotoğrafçınızla önceden paylaşmanız, önemli anların kaçmamasını sağlar."],
        },
        {
          h2: "Nişan fotoğrafçısı",
          body: [
            `Yüzük takma anı birkaç saniye sürer ve tekrarı yoktur. REDMEDYA'da nişan fotoğraf çekimi ${tl(
              PRICING.ADDON_FOTO_EKEVENT
            )}; video ve drone isteğe göre eklenir. Nişan, kına ve düğünü tek paket oluşturucuda birleştirerek tüm etkinliklerinizi tek teklifte planlayabilirsiniz.`,
          ],
        },
      ]}
      faq={[
        {
          q: "Nişan hazırlığında neler yapılır?",
          a: "Tarih ve mekânın belirlenmesi, davet, yüzükler, nişan tepsisi, kıyafetler, kuaför, süsleme, ikram, müzik ve fotoğraf-video çekimi.",
        },
        {
          q: "Nişan hazırlığı ne kadar sürer?",
          a: "Nişanın büyüklüğüne göre değişir; mekân ve fotoğrafçı gibi kalemleri birkaç ay önceden ayarlamak rahat bir hazırlık sağlar.",
        },
        {
          q: "Nişan tepsisini kim alır?",
          a: "Yöreye ve ailelerin geleneklerine göre değişir. Hangi kalemi kimin hazırlayacağını iki aileyle en başta konuşun.",
        },
        {
          q: "Nişan fotoğrafçısı ne kadar?",
          a: `REDMEDYA'da nişan fotoğraf çekimi ${tl(PRICING.ADDON_FOTO_EKEVENT)}'dir; video ve drone isteğe göre eklenir.`,
        },
      ]}
    />
  );
}
