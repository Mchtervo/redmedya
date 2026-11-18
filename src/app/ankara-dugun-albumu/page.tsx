import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ANKARA_SEO_KEYWORDS } from "@/config/seo-keywords";
import { PRICING, PACKAGES } from "@/config/pricing";
import { formatPrice as tl } from "@/lib/utils";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const PATH = "/ankara-dugun-albumu";
const P2 = PACKAGES.find((p) => p.id === 2)!;

export const metadata: Metadata = {
  title: "Ankara Düğün Albümü Fiyatları — 30×60 Lüks Albüm & Canvas",
  description: `Ankara düğün albümü: 30×60 lüks büyük albüm ${tl(PRICING.ADDON_BUYUK_ALBUM)}, aile albümü ${tl(
    PRICING.ADDON_AILE_ALBUM
  )}, canvas baskı ${tl(PRICING.ADDON_CANVAS_5070)}'den. 40+ tasarım. ${P2.name}'de büyük albüm + 2 aile albümü dahil.`,
  keywords: [
    "ankara düğün albümü",
    "düğün albümü fiyatları",
    "düğün albümü modelleri",
    "aile albümü fiyatları",
    "canvas baskı ankara",
    ...ANKARA_SEO_KEYWORDS,
  ],
  alternates: { canonical: `${siteConfig.url}${PATH}` },
};

export default function Page() {
  return (
    <SeoLandingPage
      path={PATH}
      serviceName="Düğün albümü ve canvas baskı"
      eyebrow="Albüm · Ankara"
      h1="Ankara düğün albümü — 30×60 lüks albüm, aile albümü ve canvas"
      intro={`Dijital fotoğraflar telefonda kaybolur; albüm ise yıllarca elden ele dolaşır. REDMEDYA'da 40'tan fazla tasarım arasından düğün albümünüzü seçersiniz. 30×60 lüks A kalite büyük albüm paketle birlikte kampanyalı ${tl(
        PRICING.ADDON_BUYUK_ALBUM
      )} (kampanyasız ${tl(PRICING.LIST_BUYUK_ALBUM)}); ${P2.name} ${P2.subtitle} pakette (${tl(
        P2.price
      )}) büyük albüm ve 2 aile albümü dahildir.`}
      bullets={[
        `30×60 lüks büyük albüm — ${tl(PRICING.ADDON_BUYUK_ALBUM)} (kampanyasız ${tl(PRICING.LIST_BUYUK_ALBUM)})`,
        `Aile albümü — adet ${tl(PRICING.ADDON_AILE_ALBUM)} (kampanyasız ${tl(PRICING.LIST_AILE_ALBUM)})`,
        `Canvas baskı — 50×70 ${tl(PRICING.ADDON_CANVAS_5070)}, 70×100 ${tl(PRICING.ADDON_CANVAS_70100)}`,
        "40+ çeşit albüm tasarımı",
        `${P2.name} ve Paket 3'te büyük albüm + 2 aile albümü dahil`,
      ]}
      sections={[
        {
          h2: "Büyük albüm, aile albümü ve canvas",
          body: [
            "Büyük albüm, düğün hikâyenizi baştan sona anlatan ana albümdür; 30×60 boyutunda, lüks A kalite üretilir. Aile albümleri, anne-babalarınıza hediye etmek için daha küçük ve seçilmiş karelerden oluşur. Canvas baskı ise en sevdiğiniz kareyi evinizin duvarına taşır.",
          ],
        },
        {
          h2: "Albüm dahil paketler",
          body: [
            `${P2.name} ${P2.subtitle} (${tl(
              P2.price
            )}): poz sınırsız düğün fotoğrafı, sinematik düğün klibi, 1 büyük albüm (30×60) ve 2 aile albümü. Paket 3 Full Prodüksiyon bunların hepsine ek olarak gelin alma ve salon girişi kliplerini ve dış çekim drone'unu içerir. Paket 1'i seçerseniz albümü dilediğiniz zaman ek olarak ekleyebilirsiniz.`,
          ],
        },
        {
          h2: "Albüm tasarımı nasıl seçilir?",
          body: [
            "40'tan fazla albüm tasarımı arasından size en uygun olanı birlikte seçiyoruz. Örnek albümleri görmek ve seçim sürecini konuşmak için WhatsApp'tan bize yazabilirsiniz.",
          ],
        },
      ]}
      faq={[
        {
          q: "Düğün albümü fiyatları ne kadar?",
          a: `30×60 lüks büyük albüm paketle kampanyalı ${tl(PRICING.ADDON_BUYUK_ALBUM)}, aile albümü adet ${tl(
            PRICING.ADDON_AILE_ALBUM
          )}. ${P2.name} ve Paket 3'te büyük albüm ve 2 aile albümü dahildir.`,
        },
        {
          q: "Kaç çeşit albüm modeli var?",
          a: "40'tan fazla albüm tasarımı arasından seçim yapabilirsiniz.",
        },
        {
          q: "Canvas baskı fiyatları ne kadar?",
          a: `50×70 canvas ${tl(PRICING.ADDON_CANVAS_5070)}, 70×100 canvas ${tl(PRICING.ADDON_CANVAS_70100)}.`,
        },
      ]}
    />
  );
}
