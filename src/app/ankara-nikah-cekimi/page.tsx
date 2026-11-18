import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ANKARA_SEO_KEYWORDS } from "@/config/seo-keywords";
import { PRICING } from "@/config/pricing";
import { formatPrice as tl } from "@/lib/utils";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const PATH = "/ankara-nikah-cekimi";

export const metadata: Metadata = {
  title: "Ankara Nikah Fotoğrafçısı — Nikah Töreni Fotoğraf & Video",
  description: `Ankara nikah fotoğrafçısı: nikah salonunda ve kır düğününde nikah töreni fotoğraf ve video çekimi. Nikah fotoğrafı ${tl(
    PRICING.ADDON_FOTO_EKEVENT
  )}, poz sınırı yok. Düğün paketinizle birleştirin.`,
  keywords: [
    "ankara nikah fotoğrafçısı",
    "ankara nikah çekimi",
    "nikah salonu fotoğraf çekimi",
    "nikah töreni video çekimi",
    "ankara kır düğünü fotoğrafçısı",
    ...ANKARA_SEO_KEYWORDS,
  ],
  alternates: { canonical: `${siteConfig.url}${PATH}` },
};

export default function Page() {
  return (
    <SeoLandingPage
      path={PATH}
      serviceName="Ankara nikah töreni fotoğraf ve video çekimi"
      eyebrow="Nikah · Ankara"
      h1="Ankara nikah fotoğrafçısı — nikah töreni fotoğraf ve video"
      intro={`"Evet" dediğiniz an birkaç saniye sürer, ama ömür boyu hatırlanır. REDMEDYA Ankara'da nikah salonunda, kır düğününde ya da otel nikahında töreninizi fotoğraf ve videoyla belgeler. Nikah fotoğraf çekimi ${tl(
        PRICING.ADDON_FOTO_EKEVENT
      )}; video, drone ve omuz kamera isteğe göre eklenir.`}
      bullets={[
        `Nikah fotoğraf çekimi — ${tl(PRICING.ADDON_FOTO_EKEVENT)}`,
        "Nikah videosu ve sinematik klip ayrı seçilebilir",
        `Omuz kamera ile tören boyunca kayıt — ${tl(PRICING.ADDON_OMUZ)}`,
        "Poz sınırı yok — çekilen tüm kareler teslim",
        "Düğün, kına ve nişanla tek pakette birleşir",
      ]}
      sections={[
        {
          h2: "Nikah töreninde hangi anları çekiyoruz?",
          body: [
            "Nikah törenleri genellikle kısa ve sıkı bir programla ilerler; salonlarda bir önceki ve bir sonraki çift de beklemektedir. Bu yüzden ekibimiz salona erken gelir, ışığa ve oturma düzenine göre konumunu önceden alır.",
          ],
          list: [
            "Çiftin salona girişi",
            "Nikah memurunun konuşması ve 'evet' anı",
            "İmzalar ve nikah cüzdanının teslimi",
            "Şahitler, aile ve arkadaşlarla kareler",
            "Tören sonrası kutlama ve çift portreleri",
          ],
        },
        {
          h2: "Nikah çekimi fiyatı",
          body: [
            `Nikah fotoğraf çekimi ${tl(PRICING.ADDON_FOTO_EKEVENT)}'dir. Töreni baştan sona kesintisiz kaydetmek isterseniz omuz kamera (${tl(
              PRICING.ADDON_OMUZ
            )}) ekleyebilirsiniz. Nikah ve düğün aynı gündeyse ya da kır düğünü yapıyorsanız tüm günü tek pakette planlayabiliriz; paket oluşturucu toplamı anında gösterir.`,
          ],
        },
        {
          h2: "Kır düğünü ve otel nikahı",
          body: [
            `Nikahı açık havada, bahçede ya da otelde yapıyorsanız tören, kokteyl ve dans aynı mekânda akar. Bu tür düğünlerde fotoğraf ile sinematik klibi birlikte planlıyoruz; açık alanda drone (${tl(
              PRICING.ADDON_DRONE
            )}) mekânı havadan göstererek filme sinematik bir açılış katar.`,
          ],
        },
        {
          h2: "Ankara'nın her ilçesinde nikah çekimi",
          body: [
            "Çankaya, Keçiören, Yenimahalle, Etimesgut, Sincan, Mamak, Pursaklar, Altındağ, Gölbaşı, Polatlı ve diğer ilçelerdeki belediye nikah salonlarında, otellerde ve kır düğünü mekânlarında çekim yapıyoruz.",
          ],
        },
      ]}
      faq={[
        {
          q: "Nikah fotoğrafçısı fiyatı ne kadar?",
          a: `REDMEDYA'da nikah fotoğraf çekimi ${tl(PRICING.ADDON_FOTO_EKEVENT)}'dir. Video ve omuz kamera isteğe göre eklenir.`,
        },
        {
          q: "Nikah salonunda çekim süresi kısa, yetişebiliyor musunuz?",
          a: "Evet. Ekibimiz salona erken gelir ve konumunu önceden alır; giriş, 'evet' anı ve imzalar kaçırılmaz.",
        },
        {
          q: "Nikah ve düğün aynı gün, ikisini de çekebilir misiniz?",
          a: "Evet. Gün akışını birlikte planlıyor, nikahı düğün paketinize ek etkinlik olarak ekliyoruz.",
        },
        {
          q: "Kır düğünü çekiyor musunuz?",
          a: "Evet. Kır düğünü, bahçe ve otel nikahlarında fotoğraf, sinematik klip ve drone çekimi yapıyoruz.",
        },
      ]}
    />
  );
}
