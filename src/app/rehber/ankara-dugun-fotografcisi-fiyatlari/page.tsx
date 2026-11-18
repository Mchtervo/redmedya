import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { PACKAGES, PRICING } from "@/config/pricing";
import { formatPrice as tl } from "@/lib/utils";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const PATH = "/rehber/ankara-dugun-fotografcisi-fiyatlari";
const [P1, P2, P3] = [1, 2, 3].map((id) => PACKAGES.find((p) => p.id === id)!);

export const metadata: Metadata = {
  title: "Ankara Düğün Fotoğrafçısı Fiyatları 2026 — Ne Kadar, Neler Dahil?",
  description: `Ankara düğün fotoğrafçısı fiyatları 2026: fiyatı neler belirler, pakete neler dahil olmalı, gizli maliyetler nelerdir? Örnek paketler ${tl(
    P1.price
  )}, ${tl(P2.price)} ve ${tl(P3.price)}.`,
  keywords: [
    "ankara düğün fotoğrafçısı fiyatları",
    "ankara düğün fotoğrafçısı fiyatları 2026",
    "düğün fotoğrafçısı ne kadar",
    "düğün paketleri fiyatları",
    "düğün video fiyatları",
    "dış çekim fiyatları 2026",
  ],
  alternates: { canonical: `${siteConfig.url}${PATH}` },
  openGraph: { type: "article", url: `${siteConfig.url}${PATH}` },
};

export default function Page() {
  return (
    <SeoLandingPage
      path={PATH}
      articleDate="2026-11-18"
      eyebrow="Rehber · Fiyatlar"
      h1="Ankara düğün fotoğrafçısı fiyatları 2026 — ne kadar, neler dahil?"
      intro="“Düğün fotoğrafçısı ne kadar?” sorusunun tek bir cevabı yok; fiyat, hangi etkinliklerin çekileceğine, videonun türüne, albüme ve dış çekim mekânına göre değişir. Bu rehberde Ankara'da düğün fotoğraf ve video fiyatını belirleyen kalemleri ve teklif karşılaştırırken nelere bakmanız gerektiğini anlatıyoruz."
      bullets={[
        `REDMEDYA paketleri: ${tl(P1.price)} · ${tl(P2.price)} · ${tl(P3.price)}`,
        "Fiyatı belirleyen başlıca kalemler: etkinlik sayısı, video türü, albüm, mekân",
        "Teklif karşılaştırırken poz sınırı ve teslim içeriğini mutlaka sorun",
      ]}
      ctaLabel="Kendi paketinin fiyatını gör"
      sections={[
        {
          h2: "Düğün fotoğrafçısı fiyatını neler belirler?",
          body: [
            "Aynı “düğün paketi” adı altında çok farklı kapsamlar satılabilir. İki teklifi karşılaştırmadan önce aşağıdaki kalemlerin her birinin dahil olup olmadığına bakın:",
          ],
          list: [
            "Hangi etkinlikler çekiliyor: dış çekim, gelin alma, nikah, salon, kına, nişan",
            "Video türü: sinematik klip mi, omuz kamera mı, ikisi birden mi",
            "Fotoğrafta poz sınırı var mı, çekilen tüm kareler teslim ediliyor mu",
            "Albüm ve aile albümü dahil mi, kaç adet, hangi boyutta",
            "Dış çekim mekânı veya plato ücreti ayrıca ödeniyor mu",
            "Drone gibi ek hizmetler",
          ],
        },
        {
          h2: "REDMEDYA paketleri ve fiyatları",
          body: [
            `${P1.name} ${P1.subtitle} — ${tl(P1.price)}: poz sınırsız düğün günü fotoğrafı, sinematik düğün klibi, çekilen tüm karelerin teslimi, anlaşmalı plato kampanyayla ücretsiz.`,
            `${P2.name} ${P2.subtitle} — ${tl(P2.price)}: Paket 1'e ek olarak 30×60 lüks büyük albüm ve 2 aile albümü. En çok tercih edilen paket.`,
            `${P3.name} ${P3.subtitle} — ${tl(P3.price)}: Paket 2'ye ek olarak gelin alma klibi, salon girişi & ilk dans klibi ve dış çekimde hediye drone.`,
          ],
        },
        {
          h2: "Ek hizmet fiyatları",
          body: ["Paketin üzerine ihtiyacınıza göre ekleyebileceğiniz kalemler:"],
          list: [
            `Gelin alma veya salon girişi & ilk dans klibi: kampanyalı ${tl(PRICING.UPSELL_KLIP_CAMPAIGN)} (normal ${tl(PRICING.UPSELL_KLIP_FULL)})`,
            `Salon Full Sinematik (girişten after party'ye): ${tl(PRICING.ADDON_SALON_FULL)}`,
            `Drone: ${tl(PRICING.ADDON_DRONE)} · Omuz kamera: ${tl(PRICING.ADDON_OMUZ)} (etkinlik başına)`,
            `Kına, nişan veya nikah fotoğraf çekimi: ${tl(PRICING.ADDON_FOTO_EKEVENT)}`,
            `Kendi dış çekim mekânınızı ayarlarsanız: ${tl(PRICING.OWN_VENUE_DISCOUNT)} indirim`,
          ],
        },
        {
          h2: "Gizli maliyetlere dikkat",
          body: [
            "Düşük görünen bir paket; plato ücreti, albüm, fotoğraf sayısı sınırı veya “ham fotoğraf ayrıca ücretli” gibi kalemlerle sonradan pahalılaşabilir. Teklif alırken toplam tutarı ve neyin dahil olduğunu yazılı olarak isteyin. REDMEDYA paket oluşturucusunda her kalemin fiyatı ve toplam tutar seçim yaparken ekranda görünür.",
          ],
        },
      ]}
      faq={[
        {
          q: "Ankara'da düğün fotoğrafçısı ne kadar?",
          a: `Kapsama göre değişir. REDMEDYA'da fotoğraf + sinematik klip paketi ${tl(P1.price)}, albümlü paket ${tl(
            P2.price
          )}, gelin alma ve salon klipleri ile drone dahil Full Prodüksiyon ${tl(P3.price)}'dir.`,
        },
        {
          q: "Düğün paketine neler dahil olmalı?",
          a: "En azından düğün günü fotoğrafı, video (klip veya omuz kamera) ve çekilen karelerin teslimi. Albüm, dış çekim mekânı ve ek etkinlikler pakete göre değişir; yazılı olarak teyit edin.",
        },
        {
          q: "Dış çekim plato ücreti ayrıca ödenir mi?",
          a: "Fotoğrafçıya göre değişir. REDMEDYA'da anlaşmalı platolar kampanya süresince ücretsizdir; kendi mekânınızı ayarlarsanız paketten indirim uygulanır.",
        },
        {
          q: "Fiyat teklifi nasıl alınır?",
          a: "Paket oluşturucuda seçimlerinizi yapın; toplam tutar anında görünür ve teklif WhatsApp'a hazır mesaj olarak gelir.",
        },
      ]}
    />
  );
}
