import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ANKARA_SEO_KEYWORDS } from "@/config/seo-keywords";
import { PRICING } from "@/config/pricing";
import { formatPrice as tl } from "@/lib/utils";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

export const metadata: Metadata = {
  title: "Ankara Kına Çekimi — Kına Gecesi Fotoğraf & Video",
  description: `Ankara kına gecesi fotoğraf ve sinematik video çekimi. Kına fotoğrafı ${tl(
    PRICING.ADDON_FOTO_EKEVENT
  )}, video ve drone ayrı seçilir; düğün paketinizle tek fiyatta birleşir. Poz sınırı yok.`,
  keywords: [
    "ankara kına çekimi",
    "kına fotoğrafçısı ankara",
    "kına gecesi video çekimi",
    "kına çekimi fiyatları",
    "ankara nişan fotoğrafçısı",
    ...ANKARA_SEO_KEYWORDS,
  ],
  alternates: { canonical: `${siteConfig.url}/ankara-kina-cekimi` },
};

export default function AnkaraKinaCekimiPage() {
  return (
    <SeoLandingPage
      path="/ankara-kina-cekimi"
      serviceName="Ankara kına gecesi fotoğraf ve video çekimi"
      eyebrow="Kına · Ankara"
      h1="Ankara kına çekimi — kına gecesi fotoğraf ve sinematik klip"
      intro={`Kına gecesi; gelinin ailesiyle, arkadaşlarıyla geçirdiği, hem hüzünlü hem eğlenceli en samimi gecedir. REDMEDYA kına gecenizi fotoğraf ve sinematik videoyla belgeler. Kına fotoğraf çekimi ${tl(
        PRICING.ADDON_FOTO_EKEVENT
      )}; video ve drone isteğe göre eklenir ve hepsi düğün paketinizle aynı teklifte birleşir.`}
      bullets={[
        `Kına fotoğraf çekimi — ${tl(PRICING.ADDON_FOTO_EKEVENT)}`,
        "Kına fotoğraf ve video ayrı ayrı seçilir",
        `Drone etkinlik başına ${tl(PRICING.ADDON_DRONE)}`,
        "Poz sınırı yok — çekilen tüm kareler teslim",
        "Albüm ve canvas baskı eklenebilir",
      ]}
      sections={[
        {
          h2: "Kına gecesinde neler çekiyoruz?",
          body: [
            "Kına gecesi hızlı akar ve pek çok an bir kez yaşanır. Ekibimiz programın akışını önceden sizinle konuşur; böylece kına yakılması gibi geleneksel anlarda doğru yerde ve doğru ışıkta hazır olur.",
          ],
          list: [
            "Gelinin kına kıyafeti ve hazırlık detayları",
            "Kına yakma merasimi ve aileyle duygusal anlar",
            "Arkadaşlarla eğlence, dans ve oyunlar",
            "Aile ve arkadaşlarla toplu kareler",
          ],
        },
        {
          h2: "Kına çekimi fiyatı ne kadar?",
          body: [
            `Kına, nişan ve nikah gibi ek etkinliklerde fotoğraf çekimi ${tl(
              PRICING.ADDON_FOTO_EKEVENT
            )}'dir. Video ve drone (etkinlik başına ${tl(
              PRICING.ADDON_DRONE
            )}) aynı paket oluşturucuda eklenir. Düğün paketinizle birleştirdiğinizde tüm etkinlikleriniz tek teklifte ve tek rezervasyonda toplanır.`,
          ],
        },
        {
          h2: "Kına fotoğrafları için albüm ve canvas",
          body: [
            `Kına karelerinizi albümde saklamak isterseniz 40'tan fazla tasarım arasından seçim yapabilirsiniz: 30×60 lüks büyük albüm ${tl(
              PRICING.ADDON_BUYUK_ALBUM
            )}, aile albümü adet ${tl(PRICING.ADDON_AILE_ALBUM)}. Duvara asmak için 50×70 canvas ${tl(
              PRICING.ADDON_CANVAS_5070
            )}, 70×100 canvas ${tl(PRICING.ADDON_CANVAS_70100)}'dir.`,
          ],
        },
        {
          h2: "Ankara'nın her ilçesinde kına çekimi",
          body: [
            "Kına gecesi evde, bahçede ya da salonda olsun; Çankaya, Keçiören, Yenimahalle, Etimesgut, Sincan, Mamak, Pursaklar, Altındağ, Gölbaşı, Polatlı ve Ankara'nın diğer ilçelerinde çekim yapıyoruz.",
          ],
        },
      ]}
      faq={[
        {
          q: "Kına gecesi fotoğraf çekimi ne kadar?",
          a: `Kına fotoğraf çekimi ${tl(PRICING.ADDON_FOTO_EKEVENT)}'dir. Video ve drone isteğe göre eklenir; toplamı paket oluşturucuda anında görürsünüz.`,
        },
        {
          q: "Sadece kına çekimi yaptırabilir miyim?",
          a: "Kına çekimi düğün paketine ek etkinlik olarak eklenir. Farklı bir talebiniz varsa WhatsApp'tan yazın, birlikte planlayalım.",
        },
        {
          q: "Kına fotoğraflarında poz sınırı var mı?",
          a: "Hayır. Çekilen tüm kareler düzenlenerek teslim edilir.",
        },
        {
          q: "Nişan çekimi de yapıyor musunuz?",
          a: `Evet. Nişan ve nikah da ek etkinlik olarak eklenir; fotoğraf çekimi ${tl(PRICING.ADDON_FOTO_EKEVENT)}'dir.`,
        },
      ]}
    />
  );
}
