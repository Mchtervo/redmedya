import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ANKARA_SEO_KEYWORDS } from "@/config/seo-keywords";
import { PRICING, PACKAGES } from "@/config/pricing";
import { formatPrice as tl } from "@/lib/utils";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const PATH = "/ankara-drone-dugun-cekimi";
const P3 = PACKAGES.find((p) => p.id === 3)!;

export const metadata: Metadata = {
  title: "Ankara Drone Düğün Çekimi — Dış Çekim & Gelin Alma Drone",
  description: `Ankara drone düğün çekimi: dış çekim, gelin alma ve kır düğününde havadan sinematik görüntü. Drone ${tl(
    PRICING.ADDON_DRONE
  )}; ${P3.name} ${P3.subtitle} pakette dış çekim drone'u hediye.`,
  keywords: [
    "ankara drone düğün çekimi",
    "drone dış çekim ankara",
    "drone çekimi fiyatları",
    "gelin alma drone çekimi",
    "düğün drone fotoğrafçısı",
    ...ANKARA_SEO_KEYWORDS,
  ],
  alternates: { canonical: `${siteConfig.url}${PATH}` },
};

export default function Page() {
  return (
    <SeoLandingPage
      path={PATH}
      serviceName="Ankara drone düğün çekimi"
      eyebrow="Drone · Ankara"
      h1="Ankara drone düğün çekimi — havadan sinematik görüntü"
      intro={`Drone, düğün filminize yerden mümkün olmayan geniş ve etkileyici açılar katar: dış çekim mekânının tamamı, gelin alma konvoyu, kır düğününün kurulumu… REDMEDYA'da drone çekimi etkinlik başına ${tl(
        PRICING.ADDON_DRONE
      )}; ${P3.name} ${P3.subtitle} pakette (${tl(P3.price)}) dış çekim drone'u hediyedir.`}
      bullets={[
        `Drone çekimi — ${tl(PRICING.ADDON_DRONE)} (etkinlik başına)`,
        `${P3.name} pakette dış çekim drone'u HEDİYE`,
        "Dış çekim, gelin alma ve açık hava düğünlerinde",
        "Sinematik kliple birlikte kurgulanır",
      ]}
      sections={[
        {
          h2: "Drone en çok nerede fark yaratır?",
          body: [
            "Drone her etkinlik için gerekli değildir; açık alanlarda ve hareketli sahnelerde en büyük farkı yaratır. Size hangi etkinlikte drone'un değer katacağını dürüstçe söyleriz.",
          ],
          list: [
            "Dış çekim — mekânın genel görünümü ve çiftin manzarayla birlikte kadrajı",
            "Gelin alma — evin önü, mahalle ve konvoyun havadan takibi",
            "Kır düğünü ve bahçe nikahı — kurulumun ve misafirlerin havadan görünümü",
          ],
        },
        {
          h2: "Drone çekimi fiyatı",
          body: [
            `Drone etkinlik başına ${tl(PRICING.ADDON_DRONE)}'dir. ${P3.name} ${P3.subtitle} paket (${tl(
              P3.price
            )}) dış çekimde drone'u hediye eder; ayrıca gelin alma ve salon girişi kliplerini de içerir. Diğer paketlerde drone'u istediğiniz etkinliğe ek olarak seçebilirsiniz.`,
          ],
        },
        {
          h2: "Hava ve mekân koşulları",
          body: [
            "Drone uçuşu hava durumuna ve mekânın uygunluğuna bağlıdır; rüzgâr, yağmur veya kapalı alan gibi durumlarda güvenli çekim yapılamayabilir. Çekim gününden önce mekânı ve planı sizinle birlikte değerlendiriyoruz.",
          ],
        },
      ]}
      faq={[
        {
          q: "Drone düğün çekimi fiyatı ne kadar?",
          a: `Etkinlik başına ${tl(PRICING.ADDON_DRONE)}. ${P3.name} pakette dış çekim drone'u hediyedir.`,
        },
        {
          q: "Salonun içinde drone kullanılır mı?",
          a: "Drone en çok açık alanlarda fark yaratır: dış çekim, gelin alma ve kır düğünü. Salon içi için sinematik klip ve omuz kamera daha uygundur.",
        },
        {
          q: "Hava kötü olursa ne olur?",
          a: "Drone uçuşu hava ve mekân koşullarına bağlıdır. Güvenli olmayan durumlarda uçuş yapılmaz; planı sizinle önceden konuşuruz.",
        },
      ]}
    />
  );
}
