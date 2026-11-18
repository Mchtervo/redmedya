import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { PRICING } from "@/config/pricing";
import { formatPrice as tl } from "@/lib/utils";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const PATH = "/rehber/save-the-date-nedir";

export const metadata: Metadata = {
  title: "Save the Date Nedir? Ne Zaman Gönderilir, Çekim Fikirleri",
  description:
    "Save the date ne demek, ne zaman gönderilir, davetiyeden farkı nedir? Save the date fotoğraf ve video çekimi fikirleri, elbise seçimi ve Ankara'da save the date çekimi.",
  keywords: [
    "save the date ne demek",
    "save the date nedir",
    "save the date türkçesi",
    "save the date çekimi",
    "save the date davetiye",
    "save the date örnekleri",
    "save the date elbisesi",
  ],
  alternates: { canonical: `${siteConfig.url}${PATH}` },
  openGraph: { type: "article", url: `${siteConfig.url}${PATH}` },
};

export default function Page() {
  return (
    <SeoLandingPage
      path={PATH}
      articleDate="2026-11-18"
      eyebrow="Rehber · Save the date"
      h1="Save the date nedir? Ne zaman gönderilir, nasıl çekilir?"
      intro="“Save the date”, İngilizcede “tarihi ayırın” anlamına gelir. Düğün davetiyesinden önce misafirlere gönderilen kısa bir duyurudur: “Bu tarihte evleniyoruz, takviminize not alın.” Son yıllarda Türkiye'de de çok yaygınlaştı ve genellikle çiftin fotoğrafı ya da kısa bir videosuyla paylaşılıyor."
      bullets={[
        "Save the date = “tarihi ayırın” duyurusu",
        "Davetiyeden önce, genellikle aylar öncesinden gönderilir",
        "Fotoğraf veya kısa video ile WhatsApp ve Instagram'da paylaşılır",
      ]}
      ctaLabel="Save the date çekimini planla"
      sections={[
        {
          h2: "Save the date ile davetiyenin farkı",
          body: [
            "Save the date sadece tarihi duyurur; mekân, saat ve program gibi ayrıntılar genellikle sonra gönderilen davetiyede yer alır. Özellikle şehir dışından gelecek misafirler ve yoğun sezon düğünleri için tarihin erkenden bilinmesi büyük kolaylık sağlar.",
          ],
        },
        {
          h2: "Save the date ne zaman gönderilir?",
          body: [
            "Tek bir kural yoktur; çoğu çift tarih ve mekân kesinleştikten sonra, davetiyeden önce gönderir. Misafirleriniz arasında uzaktan gelecekler varsa daha erken göndermek mantıklıdır.",
          ],
        },
        {
          h2: "Save the date çekim fikirleri",
          list: [
            "Takvim veya tarih yazılı bir pano ile çift fotoğrafı",
            "Plato veya açık mekânda kısa sinematik video",
            "Yüzük detayı ve tarih yazısı",
            "Birlikte yürüyüş ya da gülüşme anlarından doğal kareler",
            "Sosyal medya için dikey (story/reels) formatta kısa klip",
          ],
          body: [],
        },
        {
          h2: "Save the date için ne giyilir?",
          body: [
            "Save the date çekiminde gelinlik giyilmez; çiftin tarzını yansıtan, birbiriyle uyumlu kıyafetler tercih edilir. Düz ve sade renkler fotoğrafta daha zamansız durur; çok yoğun desenler dikkati yüzlerden uzaklaştırabilir.",
          ],
        },
        {
          h2: "Ankara'da save the date çekimi",
          body: [
            `REDMEDYA save the date ve nişan dış çekimlerini plato veya açık mekânda yapar. Anlaşmalı platolarımız kampanya süresince ücretsizdir. Ek etkinlik fotoğraf çekimi ${tl(
              PRICING.ADDON_FOTO_EKEVENT
            )}; video ve drone isteğe göre eklenir ve düğün paketinizle aynı teklifte birleşir.`,
          ],
        },
      ]}
      faq={[
        {
          q: "Save the date ne demek?",
          a: "İngilizcede “tarihi ayırın” demektir; düğün tarihini davetiyeden önce misafirlere duyurmak için gönderilen kısa bildirimdir.",
        },
        {
          q: "Save the date ne zaman gönderilir?",
          a: "Tarih ve mekân kesinleştikten sonra, davetiyeden önce. Uzaktan gelecek misafirler varsa daha erken göndermek iyi olur.",
        },
        {
          q: "Save the date çekimi yapıyor musunuz?",
          a: "Evet. Plato veya açık mekânda fotoğraf ve video çekimi yapıyoruz; düğün paketinize ek etkinlik olarak eklenebilir.",
        },
      ]}
    />
  );
}
