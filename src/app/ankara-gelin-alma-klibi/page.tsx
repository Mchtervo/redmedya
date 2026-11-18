import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ANKARA_SEO_KEYWORDS } from "@/config/seo-keywords";
import { PRICING, PACKAGES } from "@/config/pricing";
import { formatPrice as tl } from "@/lib/utils";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const P3 = PACKAGES.find((p) => p.id === 3)!;

export const metadata: Metadata = {
  title: "Ankara Gelin Alma Klibi — Sinematik Video & Fotoğraf",
  description: `Ankara gelin alma klibi: kapı önü, aile vedası ve konvoyun sinematik filmi. Kampanyalı ${tl(
    PRICING.UPSELL_KLIP_CAMPAIGN
  )}, Full Prodüksiyon pakette dahil. Fotoğraf, drone ve omuz kamera eklenebilir.`,
  keywords: [
    "ankara gelin alma klibi",
    "gelin alma klip ankara",
    "gelin alma videosu ankara",
    "gelin alma çekimi fiyatları",
    "gelin alma fotoğrafçısı ankara",
    ...ANKARA_SEO_KEYWORDS,
  ],
  alternates: { canonical: `${siteConfig.url}/ankara-gelin-alma-klibi` },
};

export default function AnkaraGelinAlmaKlibiPage() {
  return (
    <SeoLandingPage
      path="/ankara-gelin-alma-klibi"
      serviceName="Ankara gelin alma klibi çekimi"
      eyebrow="Gelin alma · Ankara"
      h1="Ankara gelin alma klibi — sinematik merasim videosu"
      intro={`Gelin evinde hazırlık, kapı önü pazarlığı, aile vedası ve konvoy… Gelin alma, düğün gününün en duygusal anlarını barındırır. REDMEDYA bu anları sinematik bir klibe dönüştürür. Kampanyalı fiyat ${tl(
        PRICING.UPSELL_KLIP_CAMPAIGN
      )} (normal fiyatı ${tl(PRICING.UPSELL_KLIP_FULL)}); ${P3.name} ${P3.subtitle} pakette ise ücretsiz olarak dahildir.`}
      bullets={[
        `Gelin alma sinematik klip — kampanyalı ${tl(PRICING.UPSELL_KLIP_CAMPAIGN)}`,
        `${P3.name} (${tl(P3.price)}) pakette gelin alma klibi dahil`,
        `İsteğe bağlı drone (${tl(PRICING.ADDON_DRONE)}) ve omuz kamera (${tl(PRICING.ADDON_OMUZ)})`,
        "Poz sınırı yok — çekilen tüm kareler teslim",
        "Ankara'nın tüm ilçelerinde çekim",
      ]}
      sections={[
        {
          h2: "Gelin alma klibinde neler çekiyoruz?",
          body: [
            "Gelin alma klibi, sabah gelin evinde başlayan ve gelinin evden çıkışıyla biten bölümün kurgulanmış kısa filmidir. Amacımız o günü yıllar sonra izlediğinizde aynı heyecanı yeniden yaşatmak; bu yüzden sahneleri sırayla değil, hikâye akışıyla kurguluyoruz.",
          ],
          list: [
            "Gelinin son hazırlıkları, duvak ve detay çekimleri",
            "Damat ve ailesinin gelişi, kapı önü gelenekleri",
            "Kemer bağlama ve aile ile vedalaşma anları",
            "Gelinin evden çıkışı ve konvoy",
            "İsteğe bağlı drone ile mahalle ve konvoyun havadan görüntüsü",
          ],
        },
        {
          h2: "Gelin alma klibi fiyatı ne kadar?",
          body: [
            `Gelin alma klibi tek başına kampanyalı ${tl(
              PRICING.UPSELL_KLIP_CAMPAIGN
            )} olarak herhangi bir pakete eklenebilir; kampanyasız fiyatı ${tl(
              PRICING.UPSELL_KLIP_FULL
            )}'dir. Gelin alma, salon girişi ve ilk dans kliplerinin hepsini istiyorsanız ${P3.name} ${P3.subtitle} paket (${tl(
              P3.price
            )}) en avantajlı seçenektir: iki klip de pakete dahildir, üstelik dış çekimde drone hediye edilir.`,
            "Fiyatı tahmin etmeniz gerekmez. Paket oluşturucuda seçimlerinizi yaptığınızda toplam tutar ve kazancınız anında hesaplanır; aynı ekrandan WhatsApp ile teklifinizi gönderirsiniz.",
          ],
        },
        {
          h2: "Gelin alma için fotoğraf, drone ve omuz kamera",
          body: [
            `Paket oluşturucuda gelin alma etkinliği için fotoğraf, sinematik klip, drone ve omuz kamera ayrı ayrı seçilebilir. Drone çekimi etkinlik başına ${tl(
              PRICING.ADDON_DRONE
            )}, gün boyu ham ve kurgulu kayıt için omuz kamera ${tl(
              PRICING.ADDON_OMUZ
            )}'dir. Hepsi aynı paket oluşturucuda tek fiyatla birleştirilir.`,
          ],
        },
        {
          h2: "Ankara'nın hangi ilçelerinde gelin alma çekimi yapıyorsunuz?",
          body: [
            "Çankaya, Keçiören, Yenimahalle, Etimesgut, Sincan, Mamak, Pursaklar, Altındağ, Gölbaşı ve Polatlı başta olmak üzere Ankara'nın tüm ilçelerinde çekim yapıyoruz. Gelin evi ile düğün salonu farklı ilçelerdeyse ekibimiz gün akışını buna göre planlar; şehir dışı talepler için de WhatsApp'tan bilgi alabilirsiniz.",
          ],
        },
        {
          h2: "Rezervasyon nasıl yapılır?",
          body: [
            "Paket oluşturucuda düğün tarihinizi, paketinizi ve gelin alma klibini seçin; özet WhatsApp'a hazır mesaj olarak gelir. Ekibimiz tarihin müsaitliğini kontrol edip dönüş yapar, küçük bir depozito ile tarihiniz kilitlenir ve başkasına verilmez. Yaz sezonunda (Haziran–Eylül) hafta sonları hızlı dolduğu için erken rezervasyon öneriyoruz.",
          ],
        },
      ]}
      faq={[
        {
          q: "Gelin alma klibi ile video çekimi aynı şey mi?",
          a: "Evet. Gelin alma etkinliğinde video hizmeti sinematik klip olarak sunulur; ayrıca 'video' ve 'klip' seçip iki kez ödeme yapmazsınız.",
        },
        {
          q: "Gelin alma klibi fiyatı ne kadar?",
          a: `Kampanyalı fiyat ${tl(PRICING.UPSELL_KLIP_CAMPAIGN)} (normal ${tl(
            PRICING.UPSELL_KLIP_FULL
          )}). ${P3.name} ${P3.subtitle} pakette gelin alma ve salon girişi klipleri dahildir.`,
        },
        {
          q: "Gelin alma çekimine drone eklenebilir mi?",
          a: `Evet, drone etkinlik başına ${tl(PRICING.ADDON_DRONE)} olarak eklenir. Konvoy ve gelin evinin havadan görüntüleri klibe sinematik bir açılış katar.`,
        },
        {
          q: "Hangi ilçelere geliyorsunuz?",
          a: "Ankara'nın tüm ilçelerine geliyoruz: Çankaya, Keçiören, Yenimahalle, Etimesgut, Sincan, Mamak, Pursaklar, Altındağ, Gölbaşı, Polatlı ve çevresi.",
        },
        {
          q: "Gelin alma çekimi için ne kadar önceden rezervasyon yapmalıyım?",
          a: "Yaz sezonunda hafta sonları hızla dolar; tarihiniz belli olur olmaz rezervasyon yapmanızı öneririz. Küçük bir depozito ile tarih kilitlenir.",
        },
      ]}
    />
  );
}
