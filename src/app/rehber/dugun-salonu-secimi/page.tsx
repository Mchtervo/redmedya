import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { PRICING } from "@/config/pricing";
import { formatPrice as tl } from "@/lib/utils";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const PATH = "/rehber/dugun-salonu-secimi";

export const metadata: Metadata = {
  title: "Düğün Salonu Nasıl Seçilir? Ankara İçin Kontrol Listesi",
  description:
    "Ankara'da düğün salonu seçerken dikkat edilmesi gerekenler: kapasite, ulaşım, otopark, menü, fiyata dahil olanlar, ışık ve sahne düzeni. Düğün salonu fiyatlarını karşılaştırma ipuçları.",
  keywords: [
    "düğün salonu nasıl seçilir",
    "ankara düğün salonu",
    "ankara düğün salonu fiyatları",
    "düğün salonu fiyatları ankara",
    "düğün salonu seçerken dikkat edilmesi gerekenler",
    "düğün salonuna giriş müzikleri",
  ],
  alternates: { canonical: `${siteConfig.url}${PATH}` },
  openGraph: { type: "article", url: `${siteConfig.url}${PATH}` },
};

export default function Page() {
  return (
    <SeoLandingPage
      path={PATH}
      articleDate="2026-11-18"
      eyebrow="Rehber · Düğün salonu"
      h1="Düğün salonu nasıl seçilir? Ankara için kontrol listesi"
      intro="Düğün salonu, bütçenin en büyük kalemi ve diğer tüm kararların çıkış noktasıdır: tarih, misafir sayısı, gün akışı… Ankara'da Çankaya'dan Keçiören'e, Etimesgut'tan Gölbaşı'na çok sayıda seçenek var. Bu rehberde salon gezerken sormanız gereken soruları ve sık gözden kaçan detayları topladık."
      bullets={[
        "Önce misafir sayısı ve bütçe, sonra salon",
        "Fiyata nelerin dahil olduğunu yazılı isteyin",
        "Salonu düğün saatinde ve ışıklar açıkken görün",
      ]}
      ctaLabel="Salon çekimini planla"
      sections={[
        {
          h2: "Salon gezerken sorulacak sorular",
          list: [
            "Kapasite: oturmalı kaç kişi alıyor, dans alanı yeterli mi?",
            "Fiyata neler dahil: menü, ikram, içecek, pasta, süsleme, DJ, ses-ışık?",
            "Hafta içi / hafta sonu ve sezon fiyat farkı var mı?",
            "Ulaşım ve otopark: misafirleriniz kolay ulaşabilecek mi?",
            "Salonu kaç saatliğine kiralıyorsunuz, aynı gün başka düğün var mı?",
            "Gelin odası ve hazırlık alanı var mı?",
            "Nikah salonda kıyılabiliyor mu?",
            "Kapora ve iptal koşulları neler?",
          ],
          body: [],
        },
        {
          h2: "Fiyat karşılaştırırken",
          body: [
            "Salon fiyatları genellikle kişi başı menü üzerinden verilir ama dahil olan hizmetler salondan salona çok değişir. İki salonu karşılaştırmadan önce menüyü, süslemeyi, müziği ve pastayı eşitleyip toplam tutara bakın.",
          ],
        },
        {
          h2: "Fotoğraf ve video açısından iyi bir salon",
          body: [
            "Çoğu çiftin aklına gelmeyen ama düğün fotoğraflarını doğrudan etkileyen birkaç detay vardır:",
          ],
          list: [
            "Işık: çok koyu veya renkli (mor, kırmızı) ışıklar ten rengini bozabilir",
            "Giriş kapısı ve sahne: girişin ve ilk dansın çekileceği alan açık ve geniş mi?",
            "Tavan yüksekliği ve dekor: geniş açılı karelerde salonun bütünü görünür",
            "Masa yerleşimi: aile masalarının sahneye yakın olması duygusal anları yakalamayı kolaylaştırır",
          ],
        },
        {
          h2: "Salon girişi ve ilk dans",
          body: [
            `Salona giriş ve ilk dans gecenin en çok izlenen anlarıdır. REDMEDYA'da salon girişi & ilk dans klibi kampanyalı ${tl(
              PRICING.UPSELL_KLIP_CAMPAIGN
            )}; girişten after party'ye tüm geceyi kapsayan Salon Full Sinematik ${tl(
              PRICING.ADDON_SALON_FULL
            )}'dir. Ankara'nın tüm ilçelerindeki salonlarda çekim yapıyoruz.`,
          ],
        },
      ]}
      faq={[
        {
          q: "Düğün salonu kaç ay önceden tutulmalı?",
          a: "Yaz sezonu ve hafta sonları için genellikle aylar önceden. Tarih belli olur olmaz salon araştırmasına başlamak en güvenlisidir.",
        },
        {
          q: "Düğün salonu fiyatları neye göre değişir?",
          a: "Kişi başı menü, misafir sayısı, tarih (sezon, hafta sonu) ve fiyata dahil olan hizmetlere göre.",
        },
        {
          q: "Salon seçerken fotoğraf için neye dikkat etmeliyim?",
          a: "Işığın rengine, giriş ve sahne alanının genişliğine ve salonun genel düzenine. Salonu düğün saatinde, ışıklar açıkken görmeye çalışın.",
        },
      ]}
    />
  );
}
