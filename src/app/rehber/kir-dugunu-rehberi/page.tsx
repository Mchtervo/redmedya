import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { PRICING } from "@/config/pricing";
import { formatPrice as tl } from "@/lib/utils";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const PATH = "/rehber/kir-dugunu-rehberi";

export const metadata: Metadata = {
  title: "Ankara Kır Düğünü Rehberi — Planlama, Mekân, Kıyafet",
  description:
    "Ankara'da kır düğünü planlama rehberi: kır düğünü mekânı seçimi, mevsim ve hava durumu, kır düğününde ne giyilir, ışık saatleri, nikah ve fotoğraf-video çekimi.",
  keywords: [
    "kır düğünü ankara",
    "ankara kır düğünü",
    "kır düğünü mekanları ankara",
    "kır düğününde ne giyilir",
    "kır düğünü elbiseleri",
    "ankara kır düğünü fiyatları",
  ],
  alternates: { canonical: `${siteConfig.url}${PATH}` },
  openGraph: { type: "article", url: `${siteConfig.url}${PATH}` },
};

export default function Page() {
  return (
    <SeoLandingPage
      path={PATH}
      articleDate="2026-11-18"
      eyebrow="Rehber · Kır düğünü"
      h1="Ankara kır düğünü rehberi — planlama, mekân ve kıyafet"
      intro="Kır düğünü; nikah, kokteyl, yemek ve dansın açık havada, aynı mekânda aktığı daha samimi bir düğün şeklidir. Ankara'nın karasal iklimi düşünüldüğünde kır düğününde en kritik konular mevsim, hava durumu ve akşam serinliğidir. Bu rehberde kır düğününü planlarken dikkat etmeniz gerekenleri topladık."
      bullets={[
        "Mevsim seçimi ve kötü hava için B planı",
        "Akşam serinliğine karşı misafirler için önlem",
        "Gün batımı saatine göre program",
      ]}
      ctaLabel="Kır düğünü çekimini planla"
      sections={[
        {
          h2: "Kır düğünü mekânı seçerken",
          list: [
            "Yağmur veya rüzgâr için kapalı/çadırlı B planı var mı?",
            "Nikah, yemek ve dans alanları ayrı ayrı düzenlenebiliyor mu?",
            "Ses ve müzik için saat sınırı var mı?",
            "Misafirler için ulaşım ve otopark",
            "Akşam aydınlatması nasıl?",
          ],
          body: [],
        },
        {
          h2: "Mevsim ve hava durumu",
          body: [
            "Ankara'da gündüz ile akşam arasındaki sıcaklık farkı yüksek olabilir; yaz aylarında bile akşamları serinleyebilir. Misafirler için şal, ısıtıcı veya kapalı alan seçeneği düşünün. Düğün haftası hava tahminini takip edin ve B planını mekânla önceden netleştirin.",
          ],
        },
        {
          h2: "Kır düğününde ne giyilir?",
          body: [
            "Gelinlikte hafif kumaşlar ve çok uzun olmayan kuyruklar çim ve toprak zeminde hareketi kolaylaştırır. Topuklu ayakkabılar çime battığı için kalın topuk ya da düz modeller daha rahattır. Misafirler için davetiyede kıyafet önerisi belirtmek de iyi bir fikirdir.",
          ],
        },
        {
          h2: "Kır düğünü fotoğraf ve video",
          body: [
            "Kır düğünlerinin en büyük avantajı doğal ışıktır. Nikahı ya da çift çekimini gün batımından önceki saatlere denk getirmek fotoğraflarda sıcak ve yumuşak bir ışık sağlar. Açık alan olduğu için drone, mekânı ve kurulumu havadan göstermenin en etkili yoludur.",
            `REDMEDYA'da drone etkinlik başına ${tl(PRICING.ADDON_DRONE)}, tüm geceyi kesintisiz kaydetmek için omuz kamera ${tl(
              PRICING.ADDON_OMUZ
            )}'dir. Fotoğraf ve sinematik klip içeren paketleri paket oluşturucuda inceleyebilirsiniz.`,
          ],
        },
      ]}
      faq={[
        {
          q: "Ankara'da kır düğünü hangi aylarda yapılır?",
          a: "Genellikle havanın ılık olduğu geç bahar, yaz ve erken sonbahar aylarında. Akşam serinliği ve yağmur için B planı yapmak önemlidir.",
        },
        {
          q: "Kır düğününde ne giyilir?",
          a: "Hafif kumaşlar ve çim zemine uygun kalın topuklu veya düz ayakkabılar rahat eder. Akşam serinliği için şal veya ceket bulundurun.",
        },
        {
          q: "Kır düğününde drone çekimi yapılır mı?",
          a: `Evet, açık alan olduğu için drone çok uygundur. REDMEDYA'da drone etkinlik başına ${tl(PRICING.ADDON_DRONE)}'dir; hava koşullarına bağlıdır.`,
        },
      ]}
    />
  );
}
