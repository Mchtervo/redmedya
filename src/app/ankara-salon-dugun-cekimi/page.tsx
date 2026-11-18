import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ANKARA_SEO_KEYWORDS } from "@/config/seo-keywords";
import { PRICING, PACKAGES } from "@/config/pricing";
import { formatPrice as tl } from "@/lib/utils";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const [P1, P3] = [1, 3].map((id) => PACKAGES.find((p) => p.id === id)!);

export const metadata: Metadata = {
  title: "Ankara Salon Düğün Çekimi — Giriş, İlk Dans & Tüm Gece Klibi",
  description: `Ankara salon düğünü fotoğraf ve sinematik video: salon girişi & ilk dans klibi kampanyalı ${tl(
    PRICING.UPSELL_KLIP_CAMPAIGN
  )}, girişten after party'ye Salon Full Sinematik ${tl(PRICING.ADDON_SALON_FULL)}. Poz sınırsız fotoğraf.`,
  keywords: [
    "ankara salon düğün çekimi",
    "salon klip ankara",
    "düğün salonu fotoğrafçısı ankara",
    "salon girişi klibi",
    "ilk dans klibi ankara",
    ...ANKARA_SEO_KEYWORDS,
  ],
  alternates: { canonical: `${siteConfig.url}/ankara-salon-dugun-cekimi` },
};

export default function AnkaraSalonDugunCekimiPage() {
  return (
    <SeoLandingPage
      path="/ankara-salon-dugun-cekimi"
      serviceName="Ankara salon düğünü fotoğraf ve video çekimi"
      eyebrow="Salon düğünü · Ankara"
      h1="Ankara salon düğün çekimi — giriş, ilk dans ve tüm gece"
      intro={`Salon düğünü, misafirlerinizin ve ailenizin bir arada olduğu, düğünün en kalabalık ve en hareketli bölümüdür. REDMEDYA salonda fotoğraf ile sinematik klibi birlikte planlar: ister sadece salon girişi ve ilk dansı, ister girişten after party'ye tüm geceyi çektirin. Kampanyalı salon girişi & ilk dans klibi ${tl(
        PRICING.UPSELL_KLIP_CAMPAIGN
      )}.`}
      bullets={[
        `Salon girişi & ilk dans klibi — kampanyalı ${tl(PRICING.UPSELL_KLIP_CAMPAIGN)} (normal ${tl(PRICING.UPSELL_KLIP_FULL)})`,
        `Salon Full Sinematik (girişten after party'ye) — ${tl(PRICING.ADDON_SALON_FULL)} (normal ${tl(PRICING.SALON_FULL_LIST)})`,
        `${P3.name} ${P3.subtitle} pakette salon girişi & ilk dans klibi dahil`,
        `Omuz kamera ile tam akış kaydı — ${tl(PRICING.ADDON_OMUZ)}`,
        "Poz sınırı yok — çekilen tüm kareler teslim",
      ]}
      sections={[
        {
          h2: "Salon düğününde hangi anları çekiyoruz?",
          body: [
            "Salon çekiminde amaç, gecenin enerjisini ve misafirlerin duygusunu yakalamaktır. Ekibimiz salonun ışığına ve düzenine göre çekim planını önceden kurar; giriş ve ilk dans gibi tek seferlik anlar için doğru açıda hazır bulunur.",
          ],
          list: [
            "Çiftin salona girişi ve misafirlerin karşılaması",
            "İlk dans",
            "Pasta kesimi ve takı merasimi",
            "Aile ve arkadaşlarla toplu kareler",
            "Oyunlar, halaylar ve after party",
          ],
        },
        {
          h2: "Salon girişi klibi mi, Salon Full Sinematik mi?",
          body: [
            `Salon girişi & ilk dans klibi, gecenin en çok paylaşılan iki anını kısa ve etkileyici bir filme dönüştürür; kampanyalı fiyatı ${tl(
              PRICING.UPSELL_KLIP_CAMPAIGN
            )}'dir. Salon Full Sinematik ise salon girişinden ilk dansa, pasta kesiminden oyunlara ve after party'ye kadar tüm geceyi kapsayan sinematik klip; kampanyalı fiyatı ${tl(
              PRICING.ADDON_SALON_FULL
            )}'dir (normal ${tl(PRICING.SALON_FULL_LIST)}).`,
            "Gecenin tamamını kesintisiz arşivlemek isteyenler için omuz kamera seçeneği de vardır; ham ve kurgulu kayıt teslim edilir.",
          ],
        },
        {
          h2: "Salon düğünü fotoğraf ve video fiyatları",
          body: [
            `Düğün günü fotoğrafı ve sinematik düğün klibi içeren paketler ${tl(
              P1.price
            )}'den başlar. ${P3.name} ${P3.subtitle} (${tl(
              P3.price
            )}) pakette gelin alma klibi ile salon girişi & ilk dans klibi dahildir ve dış çekimde drone hediye edilir. Seçtiğiniz her ek hizmetin fiyatını paket oluşturucuda görür, toplamı anında öğrenirsiniz.`,
          ],
        },
        {
          h2: "Ankara'daki düğün salonlarında çekim",
          body: [
            "Çankaya, Keçiören, Yenimahalle, Etimesgut, Sincan, Mamak, Pursaklar, Altındağ, Gölbaşı ve Polatlı başta olmak üzere Ankara'nın tüm ilçelerindeki düğün salonlarında çekim yapıyoruz. Gelin alma, dış çekim ve salon farklı ilçelerdeyse gün akışını sizinle birlikte planlıyoruz.",
          ],
        },
      ]}
      faq={[
        {
          q: "Salon girişi ve ilk dans klibi ne kadar?",
          a: `Kampanyalı fiyat ${tl(PRICING.UPSELL_KLIP_CAMPAIGN)} (normal ${tl(
            PRICING.UPSELL_KLIP_FULL
          )}). ${P3.name} pakette dahildir.`,
        },
        {
          q: "Salon Full Sinematik nedir?",
          a: `Salon girişi, ilk dans, pasta kesimi, oyunlar ve after party dahil tüm gecenin sinematik klibidir. Kampanyalı fiyatı ${tl(
            PRICING.ADDON_SALON_FULL
          )}'dir.`,
        },
        {
          q: "Salonda fotoğraf çekimi de yapılıyor mu?",
          a: "Evet. Paketlerdeki düğün günü fotoğraf çekiminde poz sınırı yoktur; çekilen tüm kareler düzenlenerek teslim edilir.",
        },
        {
          q: "Gecenin tamamını kesintisiz kaydettirebilir miyim?",
          a: `Evet, omuz kamera ile (${tl(PRICING.ADDON_OMUZ)}) düğün günü ham ve kurgulu kayıt alırsınız.`,
        },
      ]}
    />
  );
}
