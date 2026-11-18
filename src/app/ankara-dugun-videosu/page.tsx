import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ANKARA_SEO_KEYWORDS } from "@/config/seo-keywords";
import { PRICING, PACKAGES } from "@/config/pricing";
import { formatPrice as tl } from "@/lib/utils";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const [P1, P2, P3] = [1, 2, 3].map((id) => PACKAGES.find((p) => p.id === id)!);

export const metadata: Metadata = {
  title: "Ankara Düğün Videosu — Sinematik Düğün Klibi",
  description: `Ankara düğün videosu ve sinematik düğün klibi: dış çekim, gelin alma, salon girişi, ilk dans ve after party. Fotoğraf + klip paketleri ${tl(
    P1.price
  )}'den başlar, fiyat paket oluşturucuda anında.`,
  keywords: [
    "ankara düğün videosu",
    "düğün klibi ankara",
    "ankara sinematik düğün videosu",
    "düğün video çekimi fiyatları",
    "ankara düğün kameramanı",
    ...ANKARA_SEO_KEYWORDS,
  ],
  alternates: { canonical: `${siteConfig.url}/ankara-dugun-videosu` },
};

export default function AnkaraDugunVideosuPage() {
  return (
    <SeoLandingPage
      path="/ankara-dugun-videosu"
      serviceName="Ankara düğün videosu ve sinematik düğün klibi"
      eyebrow="Düğün videosu · Ankara"
      h1="Ankara düğün videosu — sinematik düğün klibi"
      intro={`Düğün videosu artık saatlerce süren düz bir kayıt değil; o günün duygusunu birkaç dakikada anlatan, sinema diliyle kurgulanmış bir film. REDMEDYA, Ankara'da dış çekimden salonun son dansına kadar düğününüzü sinematik kliplerle anlatır. Fotoğraf ve sinematik klip içeren paketler ${tl(
        P1.price
      )}'den başlar.`}
      bullets={[
        `Her pakette sinematik düğün klibi + poz sınırsız fotoğraf (${tl(P1.price)}'den)`,
        `Gelin alma ve salon girişi & ilk dans klipleri — kampanyalı ${tl(PRICING.UPSELL_KLIP_CAMPAIGN)}`,
        `Salon Full Sinematik: girişten after party'ye tüm gece — ${tl(PRICING.ADDON_SALON_FULL)}`,
        `Drone (${tl(PRICING.ADDON_DRONE)}) ve omuz kamera (${tl(PRICING.ADDON_OMUZ)}) eklenebilir`,
        "Ankara ve tüm ilçelerinde çekim",
      ]}
      sections={[
        {
          h2: "Sinematik düğün klibi nedir?",
          body: [
            "Sinematik düğün klibi, düğününüzün sinema kalitesinde kurgulanmış kısa filmidir. Görüntüler müzikle, renk düzenlemesiyle ve hikâye akışıyla bir araya getirilir; böylece video izlendiğinde sıkmaz, aileyle ve arkadaşlarla paylaşmak keyifli olur.",
            "Uzun ve kesintisiz kayıt isteyen çiftler için omuz kamera seçeneği de vardır: gün boyu ham ve kurgulu kayıt alırsınız. Çoğu çift ikisini birlikte tercih eder; klip paylaşmak, omuz kamera ise arşiv için.",
          ],
        },
        {
          h2: "Düğün gününün hangi bölümleri çekilir?",
          body: [
            "Her etkinlik için ayrı bir sinematik klip seçebilirsiniz; böylece sadece ihtiyacınız olan bölüme ödeme yaparsınız.",
          ],
          list: [
            "Dış çekim — plato veya açık mekânda çift çekimi (anlaşmalı plato kampanyayla ücretsiz)",
            "Gelin alma — hazırlık, kapı önü, aile vedası ve konvoy",
            "Salon girişi ve ilk dans — en çok izlenen 'giriş' anı",
            "Salon Full Sinematik — giriş, ilk dans, pasta kesimi, oyunlar ve after party",
            "Kına, nişan ve nikah — ek etkinlik olarak eklenebilir",
          ],
        },
        {
          h2: "Ankara düğün videosu fiyatları",
          body: [
            `${P1.name} ${P1.subtitle} (${tl(P1.price)}): poz sınırsız düğün günü fotoğrafı ve sinematik düğün klibi. ${P2.name} ${P2.subtitle} (${tl(
              P2.price
            )}): buna ek olarak 30×60 büyük albüm ve 2 aile albümü. ${P3.name} ${P3.subtitle} (${tl(
              P3.price
            )}): Paket 2'ye ek olarak gelin alma klibi, salon girişi & ilk dans klibi ve dış çekimde hediye drone.`,
            `Tek tek eklemek isterseniz gelin alma ve salon girişi klipleri kampanyalı ${tl(
              PRICING.UPSELL_KLIP_CAMPAIGN
            )} (normal ${tl(PRICING.UPSELL_KLIP_FULL)}), tüm geceyi kapsayan Salon Full Sinematik ${tl(
              PRICING.ADDON_SALON_FULL
            )} (normal ${tl(PRICING.SALON_FULL_LIST)})'dir. Paket oluşturucu seçimlerinize göre toplamı anında hesaplar.`,
          ],
        },
        {
          h2: "Drone ve omuz kamera",
          body: [
            `Drone, dış çekimde ve gelin almada havadan geniş açılı sinematik planlar sağlar; etkinlik başına ${tl(
              PRICING.ADDON_DRONE
            )}'dir ve ${P3.name} pakette dış çekim için hediyedir. Omuz kamera, düğün günü ham + kurgulu kayıt için ${tl(
              PRICING.ADDON_OMUZ
            )}'dir.`,
          ],
        },
        {
          h2: "Neden REDMEDYA?",
          body: [
            "Fiyatlarımızı saklamıyoruz: paket oluşturucuda her kalemin fiyatını ve toplam kazancınızı görürsünüz. Fotoğrafta poz sınırı yoktur, çekilen tüm kareler teslim edilir. Anlaşmalı platolarımızda (No25, Anka ve diğerleri) dış çekim kampanya süresince ücretsizdir. Galerimizde gerçek düğünlerimizden örnekleri inceleyebilirsiniz.",
          ],
        },
      ]}
      faq={[
        {
          q: "Ankara'da düğün videosu fiyatları ne kadar?",
          a: `Fotoğraf ve sinematik düğün klibi içeren paketler ${tl(P1.price)}'den başlar. ${P2.name} ${tl(
            P2.price
          )}, gelin alma ve salon klipleri dahil ${P3.name} ${tl(P3.price)}'dir.`,
        },
        {
          q: "Sinematik klip ile omuz kamera arasındaki fark nedir?",
          a: "Sinematik klip, müzik ve renk düzenlemesiyle kurgulanmış kısa filmdir. Omuz kamera ise gün boyu ham ve kurgulu kayıttır; arşiv için tercih edilir.",
        },
        {
          q: "Salon Full Sinematik neleri kapsar?",
          a: `Salon girişi, ilk dans, pasta kesimi, oyunlar ve after party dahil tüm gecenin sinematik klibidir. Kampanyalı fiyatı ${tl(
            PRICING.ADDON_SALON_FULL
          )}'dir.`,
        },
        {
          q: "Videoda drone çekimi var mı?",
          a: `Evet. Drone etkinlik başına ${tl(PRICING.ADDON_DRONE)} olarak eklenir; ${P3.name} ${P3.subtitle} pakette dış çekim drone'u hediyedir.`,
        },
        {
          q: "Kına ve nişan videosu da çekiyor musunuz?",
          a: "Evet. Kına, nişan ve nikah gibi ek etkinlikler aynı paket oluşturucuda düğün paketinize eklenebilir.",
        },
      ]}
    />
  );
}
