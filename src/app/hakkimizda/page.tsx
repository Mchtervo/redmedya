import type { Metadata } from "next";
import { siteConfig, stats } from "@/config/site";
import { PACKAGES } from "@/config/pricing";
import { formatPrice as tl } from "@/lib/utils";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const PATH = "/hakkimizda";
const minPrice = Math.min(...PACKAGES.map((p) => p.price));

export const metadata: Metadata = {
  title: "Hakkımızda — RED MEDIA (REDMEDYA) Ankara",
  description:
    "RED MEDIA (REDMEDYA), Ankara merkezli düğün fotoğrafçılığı ve sinematik düğün videosu ekibi. Dış çekim, gelin alma, nişan, kına, nikah ve salon çekimleri.",
  alternates: { canonical: `${siteConfig.url}${PATH}` },
};

export default function HakkimizdaPage() {
  const statLine = stats.map((s) => `${s.value}${s.suffix} ${s.label}`).join(" · ");
  return (
    <SeoLandingPage
      path={PATH}
      eyebrow="Hakkımızda"
      h1="RED MEDIA — Ankara'da düğün hikâyenizi sinematik bir dile çeviriyoruz"
      intro="RED MEDIA (REDMEDYA), Ankara merkezli bir düğün fotoğrafçılığı ve sinematik düğün videosu ekibidir. Bir ömür sürecek anıları sinematik bir dile çeviriyoruz: her bakış, her dokunuş, her gözyaşı — kurgulanmış değil, hissedilmiş."
      bullets={[
        statLine,
        "Dış çekim, gelin alma, nişan, kına, nikah ve salon düğünü çekimi",
        "Poz sınırı olmayan çekim, çekilen tüm karelerin teslimi",
        `Şeffaf fiyat: paketler ${tl(minPrice)}'den başlar, toplam tutar online hesaplanır`,
      ]}
      ctaLabel="Paketleri incele"
      sections={[
        {
          h2: "Ne yapıyoruz?",
          body: [
            "Düğün gününüzü sabah hazırlığından gecenin son dansına kadar fotoğraf ve sinematik videoyla anlatıyoruz. Dış çekimi anlaşmalı platolarımızda ya da açık mekânda yapıyor; gelin alma, nikah ve salon için ayrı sinematik klipler hazırlıyoruz. İsteyen çiftler için drone, omuz kamera, düğün albümü ve canvas baskı da sunuyoruz.",
          ],
        },
        {
          h2: "Nasıl çalışıyoruz?",
          body: [
            "Fiyatlarımızı saklamıyoruz. Paket oluşturucuda seçtiğiniz her hizmetin fiyatını ve toplam tutarı anında görürsünüz; teklifiniz WhatsApp'a hazır mesaj olarak gelir. Tarihinizi küçük bir depozito ile kilitler, çekim gününden önce akışı sizinle birlikte planlarız.",
          ],
        },
        {
          h2: "Nerede hizmet veriyoruz?",
          body: [
            `Adresimiz: ${siteConfig.address}. Ankara'nın tüm ilçelerinde — Çankaya, Keçiören, Yenimahalle, Etimesgut, Sincan, Mamak, Pursaklar, Altındağ, Gölbaşı, Polatlı ve çevresinde — çekim yapıyoruz. Çalışmalarımızı galerimizde ve Instagram hesabımızda inceleyebilirsiniz.`,
          ],
        },
      ]}
    />
  );
}
