import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ANKARA_SEO_KEYWORDS } from "@/config/seo-keywords";
import { PRICING } from "@/config/pricing";
import { formatPrice as tl } from "@/lib/utils";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const PATH = "/ankara-nisan-cekimi";

export const metadata: Metadata = {
  title: "Ankara Nişan Fotoğrafçısı — Nişan Fotoğraf & Video Çekimi",
  description: `Ankara nişan fotoğrafçısı: nişan töreni fotoğraf ve sinematik video çekimi, save the date. Nişan fotoğrafı ${tl(
    PRICING.ADDON_FOTO_EKEVENT
  )}, poz sınırı yok, tüm kareler teslim. Düğün paketinizle birleştirin.`,
  keywords: [
    "ankara nişan fotoğrafçısı",
    "ankara nişan çekimi",
    "nişan fotoğraf çekimi fiyatları",
    "nişan video çekimi ankara",
    "save the date çekimi ankara",
    "söz nişan fotoğrafçısı",
    ...ANKARA_SEO_KEYWORDS,
  ],
  alternates: { canonical: `${siteConfig.url}${PATH}` },
};

export default function Page() {
  return (
    <SeoLandingPage
      path={PATH}
      serviceName="Ankara nişan fotoğraf ve video çekimi"
      eyebrow="Nişan · Ankara"
      h1="Ankara nişan fotoğrafçısı — nişan fotoğraf ve video çekimi"
      intro={`Nişan, iki ailenin ilk kez bir araya geldiği, yüzüklerin takıldığı ve düğün yolculuğunun resmen başladığı gündür. REDMEDYA Ankara'da nişan töreninizi fotoğraf ve sinematik videoyla belgeler. Nişan fotoğraf çekimi ${tl(
        PRICING.ADDON_FOTO_EKEVENT
      )}; video ve drone isteğe göre eklenir, düğün paketinizle tek teklifte birleşir.`}
      bullets={[
        `Nişan fotoğraf çekimi — ${tl(PRICING.ADDON_FOTO_EKEVENT)}`,
        "Nişan videosu ve sinematik klip ayrı seçilebilir",
        `Drone etkinlik başına ${tl(PRICING.ADDON_DRONE)}, omuz kamera ${tl(PRICING.ADDON_OMUZ)}`,
        "Poz sınırı yok — çekilen tüm kareler teslim",
        "Save the date çekimi de yapılır",
      ]}
      sections={[
        {
          h2: "Nişan çekiminde neler var?",
          body: [
            "Nişan töreni kısa sürer ama içinde çok sayıda tek seferlik an barındırır. Ekibimiz programı önceden sizinle konuşur; yüzük takma ve kurdele kesme gibi anlarda doğru açıda hazır bulunur.",
          ],
          list: [
            "Hazırlık, nişan kıyafeti ve detay çekimleri",
            "Yüzük takma ve kurdele kesme",
            "İki ailenin tanışma ve kutlama anları",
            "Çift portreleri ve aile toplu kareleri",
            "İsteğe bağlı sinematik nişan klibi",
          ],
        },
        {
          h2: "Ankara nişan çekimi fiyatları",
          body: [
            `Nişan fotoğraf çekimi ${tl(PRICING.ADDON_FOTO_EKEVENT)}'dir. Nişan için drone ${tl(
              PRICING.ADDON_DRONE
            )}, omuz kamera ile ham + kurgulu kayıt ${tl(
              PRICING.ADDON_OMUZ
            )}'dir. Nişan, kına ve düğününüzü aynı paket oluşturucuda birleştirirseniz bütün etkinlikler tek teklifte ve tek rezervasyonda toplanır; toplamı anında görürsünüz.`,
          ],
        },
        {
          h2: "Save the date ve nişan dış çekimi",
          body: [
            "Düğün davetinden önce paylaşmak için save the date ya da nişan dış çekimi yaptırmak isteyen çiftler için çekimi plato veya açık mekânda planlıyoruz. Anlaşmalı platolarımızda (No25, Anka ve diğerleri) kampanya süresince plato kullanımı ücretsizdir.",
          ],
        },
        {
          h2: "Nişanı evde, salonda veya restoranda yapın — biz geliriz",
          body: [
            "Çankaya, Keçiören, Yenimahalle, Etimesgut, Sincan, Mamak, Pursaklar, Altındağ, Gölbaşı, Polatlı ve Ankara'nın diğer ilçelerinde nişan çekimi yapıyoruz. Ev nişanı, salon ya da restoran fark etmez; ışığa ve mekâna göre çekim planı kurarız.",
          ],
        },
      ]}
      faq={[
        {
          q: "Ankara'da nişan fotoğrafçısı fiyatları ne kadar?",
          a: `REDMEDYA'da nişan fotoğraf çekimi ${tl(PRICING.ADDON_FOTO_EKEVENT)}'dir. Video, drone ve omuz kamera isteğe göre eklenir; toplam paket oluşturucuda anında hesaplanır.`,
        },
        {
          q: "Nişan fotoğraflarında poz sınırı var mı?",
          a: "Hayır, poz sınırı yoktur. Çekilen tüm kareler düzenlenerek teslim edilir.",
        },
        {
          q: "Nişan videosu çekiyor musunuz?",
          a: "Evet. Nişan için fotoğraf ve video ayrı seçilebilir; sinematik klip ve omuz kamera seçenekleri vardır.",
        },
        {
          q: "Nişan ve düğünü aynı yerden yaptırırsam ne olur?",
          a: "Nişan, kına ve düğün tek paket oluşturucuda birleşir; tek teklif, tek rezervasyon ve aynı ekiple tutarlı bir görsel dil elde edersiniz.",
        },
        {
          q: "Save the date çekimi yapıyor musunuz?",
          a: "Evet. Save the date ve nişan dış çekimi plato veya açık mekânda yapılabilir; anlaşmalı platolar kampanya süresince ücretsizdir.",
        },
      ]}
    />
  );
}
