import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { PRICING } from "@/config/pricing";
import { formatPrice as tl } from "@/lib/utils";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const PATH = "/rehber/gelin-alma-nasil-olur";

export const metadata: Metadata = {
  title: "Gelin Alma Nasıl Olur? Gelenekler, Sıralama ve Hazırlık",
  description:
    "Gelin alma nasıl olur? Gelin alma sıralaması, kapı önü gelenekleri, kemer bağlama, gelin evi süslemesi, gelin arabası ve konvoy. Gelin almayı fotoğraf ve videoyla ölümsüzleştirme.",
  keywords: [
    "gelin alma nasıl olur",
    "gelin alma",
    "gelin alma gelenekleri",
    "gelin evi süsleme",
    "gelin arabası süsleme",
    "gelin alma videoları",
    "gelin alma şarkıları",
  ],
  alternates: { canonical: `${siteConfig.url}${PATH}` },
  openGraph: { type: "article", url: `${siteConfig.url}${PATH}` },
};

export default function Page() {
  return (
    <SeoLandingPage
      path={PATH}
      articleDate="2026-11-18"
      eyebrow="Rehber · Gelin alma"
      h1="Gelin alma nasıl olur? Gelenekler, sıralama ve hazırlık"
      intro="Gelin alma, damadın ve ailesinin gelini baba evinden almaya geldiği, düğün gününün en duygusal bölümüdür. Gelenekler yöreden yöreye değişse de çoğu gelin almada benzer adımlar vardır. Bu rehberde tipik bir gelin alma sıralamasını, hazırlık listesini ve bu anları en güzel şekilde nasıl kayıt altına alabileceğinizi anlatıyoruz."
      bullets={[
        "Gelin alma saati kuaför çıkışına göre planlanır",
        "Gelin evi ve gelin arabası süslemesi önceden hazır olsun",
        "En duygusal anlar: kemer bağlama ve aile vedası",
      ]}
      ctaLabel="Gelin alma çekimini planla"
      sections={[
        {
          h2: "Gelin alma sıralaması",
          body: ["Ailelerin geleneklerine göre değişmekle birlikte gelin alma genellikle şöyle ilerler:"],
          list: [
            "Gelinin kuaförden dönüşü ve son hazırlıklar",
            "Damat ve ailesinin konvoyla gelişi (bazı yörelerde davul-zurna veya bando eşliğinde)",
            "Kapı önü gelenekleri ve şakalaşmalar",
            "Gelinin beline kemer bağlanması",
            "Aile ile vedalaşma",
            "Gelinin evden çıkışı ve konvoy",
          ],
        },
        {
          h2: "Gelin alma hazırlık listesi",
          list: [
            "Gelin evi ve kapı süslemesi",
            "Gelin arabası ve süslemesi",
            "Konvoy için araçlar ve güzergâh",
            "Kemer ve geleneksel malzemeler",
            "Müzik: bando, davul-zurna veya hoparlör",
            "Fotoğraf ve video ekibinin gelin evine geliş saati",
          ],
          body: [],
        },
        {
          h2: "Gelin alma nasıl çekilir?",
          body: [
            "Gelin alma kısa sürer, kalabalıktır ve evin içi çoğu zaman dardır. Fotoğrafçının önceden gelip evi görmesi, kemer bağlama ve veda anları için doğru konumu almasını sağlar. Evin önü ve konvoy ise drone için idealdir.",
            `REDMEDYA'da gelin alma sinematik klibi kampanyalı ${tl(
              PRICING.UPSELL_KLIP_CAMPAIGN
            )} (normal ${tl(PRICING.UPSELL_KLIP_FULL)}); Full Prodüksiyon pakette dahildir. Drone etkinlik başına ${tl(
              PRICING.ADDON_DRONE
            )}'dir.`,
          ],
        },
      ]}
      faq={[
        {
          q: "Gelin alma nasıl olur?",
          a: "Damat ve ailesi gelin evine gelir; kapı önü gelenekleri, kemer bağlama ve aile vedasının ardından gelin evden çıkar ve konvoyla yola çıkılır. Ayrıntılar yöreye göre değişir.",
        },
        {
          q: "Gelin alma ne kadar sürer?",
          a: "Ailelerin geleneklerine ve misafir sayısına göre değişir; programı kuaför çıkış saati ve sonraki etkinliklere göre planlayın.",
        },
        {
          q: "Gelin alma klibi ne kadar?",
          a: `REDMEDYA'da kampanyalı ${tl(PRICING.UPSELL_KLIP_CAMPAIGN)}; Full Prodüksiyon pakette dahildir.`,
        },
      ]}
    />
  );
}
