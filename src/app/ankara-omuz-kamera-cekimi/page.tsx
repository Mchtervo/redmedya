import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ANKARA_SEO_KEYWORDS } from "@/config/seo-keywords";
import { PRICING } from "@/config/pricing";
import { formatPrice as tl } from "@/lib/utils";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const PATH = "/ankara-omuz-kamera-cekimi";

export const metadata: Metadata = {
  title: "Ankara Omuz Kamera Düğün Çekimi — Ham + Kurgulu Video",
  description: `Ankara omuz kamera düğün çekimi: düğün günü ham ve kurgulu kayıt ${tl(
    PRICING.ADDON_OMUZ
  )}. Sinematik klip ile birlikte alın; hem paylaşmalık film hem eksiksiz arşiv.`,
  keywords: [
    "ankara omuz kamera",
    "omuz kamera düğün çekimi",
    "omuz kamera fiyatları",
    "düğün kameramanı ankara",
    "düğün video kaydı ankara",
    ...ANKARA_SEO_KEYWORDS,
  ],
  alternates: { canonical: `${siteConfig.url}${PATH}` },
};

export default function Page() {
  return (
    <SeoLandingPage
      path={PATH}
      serviceName="Ankara omuz kamera düğün çekimi"
      eyebrow="Omuz kamera · Ankara"
      h1="Ankara omuz kamera düğün çekimi — ham ve kurgulu kayıt"
      intro={`Omuz kamera, düğününüzü baştan sona kesintisiz kaydeden klasik düğün videosudur: konuşmalar, takı merasimi, halaylar, misafirler… Sinematik klip birkaç dakikalık bir film sunarken, omuz kamera hiçbir anın kaybolmadığı eksiksiz bir arşiv bırakır. REDMEDYA'da omuz kamera ${tl(
        PRICING.ADDON_OMUZ
      )}; ham ve kurgulu kayıt birlikte teslim edilir.`}
      bullets={[
        `Omuz kamera — ${tl(PRICING.ADDON_OMUZ)} (etkinlik başına)`,
        "Ham kayıt + kurgulu video birlikte teslim",
        "Sinematik klip ile birlikte alınabilir",
        "Düğün, kına, nişan ve nikahta kullanılabilir",
        "Ankara'nın tüm ilçelerinde çekim",
      ]}
      sections={[
        {
          h2: "Omuz kamera ile sinematik klip arasındaki fark",
          body: [
            "Sinematik klip, düğününüzün müzik ve renk düzenlemesiyle kurgulanmış kısa filmidir; sosyal medyada paylaşmak ve tekrar tekrar izlemek için idealdir. Omuz kamera ise düğünün akışını uzun ve eksiksiz kaydeder; büyükleriniz için, takı merasimini ya da konuşmaları tam haliyle saklamak için tercih edilir.",
            "Çoğu çift ikisini birlikte alır: klip paylaşmak için, omuz kamera arşiv için. Paket oluşturucuda ikisini aynı etkinliğe ekleyebilirsiniz.",
          ],
        },
        {
          h2: "Omuz kamerada neler kaydedilir?",
          body: ["Kayıt, etkinliğin başından sonuna kadar akışı takip eder:"],
          list: [
            "Salona giriş ve ilk dans",
            "Konuşmalar ve takı merasimi",
            "Halaylar, oyunlar ve misafirlerle anlar",
            "Pasta kesimi ve gecenin kapanışı",
          ],
        },
        {
          h2: "Omuz kamera fiyatı",
          body: [
            `Omuz kamera etkinlik başına ${tl(PRICING.ADDON_OMUZ)}'dir. Salonda tüm geceyi sinematik bir filme dönüştürmek isterseniz Salon Full Sinematik (${tl(
              PRICING.ADDON_SALON_FULL
            )}) seçeneği de vardır. Paket oluşturucuda seçimlerinizi yapın, toplamı anında görün.`,
          ],
        },
      ]}
      faq={[
        {
          q: "Omuz kamera fiyatı ne kadar?",
          a: `REDMEDYA'da omuz kamera etkinlik başına ${tl(PRICING.ADDON_OMUZ)}'dir; ham ve kurgulu kayıt teslim edilir.`,
        },
        {
          q: "Omuz kamera mı, sinematik klip mi almalıyım?",
          a: "Paylaşmak için sinematik klip, eksiksiz arşiv için omuz kamera. İkisini birlikte almak en çok tercih edilen seçenektir.",
        },
        {
          q: "Ham kayıt teslim ediliyor mu?",
          a: "Evet, omuz kamerada ham kayıt ve kurgulu video birlikte teslim edilir.",
        },
        {
          q: "Kına ve nişanda da omuz kamera olur mu?",
          a: "Evet, omuz kamera her etkinliğe ayrı ayrı eklenebilir.",
        },
      ]}
    />
  );
}
