import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ANKARA_SEO_KEYWORDS } from "@/config/seo-keywords";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

export const metadata: Metadata = {
  title: "Ankara Gelin Alma Klibi — Sinematik Video",
  description:
    "Ankara gelin alma klibi ve sinematik video çekimi REDMEDYA. Kampanyalı fiyat, fotoğraf ve drone ile birlikte paket oluşturun.",
  keywords: [
    "ankara gelin alma klibi",
    "gelin alma klip ankara",
    "gelin alma videosu ankara",
    ...ANKARA_SEO_KEYWORDS,
  ],
  alternates: { canonical: `${siteConfig.url}/ankara-gelin-alma-klibi` },
};

export default function AnkaraGelinAlmaKlibiPage() {
  return (
    <SeoLandingPage
      eyebrow="Gelin alma · Ankara"
      h1="Ankara gelin alma klibi — sinematik merasim videosu"
      intro="Gelin alma anınız için ayrı video klip kartı yok: tek seçenek sinematik klip çekimidir. Dış çekim veya foto+video+albüm paketinde kampanyalı fiyat uygulanır; tüm detaylar paket oluşturucuda."
      bullets={[
        "Gelin alma için fotoğraf, sinematik klip, drone ve omuz kamera ayrı seçilebilir",
        "Kampanya koşullarında klip 3.500₺ (liste 5.000₺)",
        "Poz sınırı yok — etkinliğe ait tüm kareler teslim",
        "WhatsApp ile anında teklif ve rezervasyon",
      ]}
      faq={[
        {
          q: "Gelin alma klip ile video klip aynı mı?",
          a: "Evet. Gelin alma etkinliğinde video hizmeti yalnızca sinematik klip olarak sunulur; çift seçimle fiyat şişmez.",
        },
        {
          q: "Hangi ilçelere gidiyorsunuz?",
          a: "Ankara merkez ve çevre ilçelerde (Çankaya, Keçiören, Yenimahalle, Etimesgut, Sincan vb.) düzenli çekim yapıyoruz.",
        },
      ]}
    />
  );
}
