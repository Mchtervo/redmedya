import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const PATH = "/rehber/dugun-fotografcisi-nasil-secilir";

export const metadata: Metadata = {
  title: "Düğün Fotoğrafçısı Nasıl Seçilir? Sorulacak 10 Soru",
  description:
    "Ankara'da düğün fotoğrafçısı seçerken sorulması gereken sorular: portfolyo, poz sınırı, teslim içeriği, albüm, dış çekim mekânı, video türü, depozito ve sözleşme.",
  keywords: [
    "düğün fotoğrafçısı nasıl seçilir",
    "en iyi düğün fotoğrafçısı ankara",
    "düğün fotoğrafçısına sorulacak sorular",
    "düğün fotoğrafçısı seçerken dikkat edilmesi gerekenler",
  ],
  alternates: { canonical: `${siteConfig.url}${PATH}` },
  openGraph: { type: "article", url: `${siteConfig.url}${PATH}` },
};

export default function Page() {
  return (
    <SeoLandingPage
      path={PATH}
      articleDate="2026-11-18"
      eyebrow="Rehber · Fotoğrafçı seçimi"
      h1="Düğün fotoğrafçısı nasıl seçilir? Sorulacak 10 soru"
      intro="Düğünün tekrarı yok; fotoğrafçı seçimi de bu yüzden en önemli kararlardan biri. Fiyatla başlamak yerine aşağıdaki soruları sorarak teklifleri gerçekten karşılaştırılabilir hale getirin. Bu listeyi Ankara'daki hangi ekiple görüşürseniz görüşün kullanabilirsiniz."
      bullets={[
        "Önce portfolyo ve gerçek düğün örnekleri",
        "Sonra kapsam: neler çekiliyor, neler teslim ediliyor",
        "En son fiyat — ama toplam tutar üzerinden",
      ]}
      ctaLabel="REDMEDYA paketlerini incele"
      sections={[
        {
          h2: "Fotoğrafçıya sormanız gereken 10 soru",
          body: ["Teklif alırken bu soruların cevabını mümkünse yazılı olarak isteyin:"],
          list: [
            "1. Tam bir düğünün fotoğraflarını ve videosunu baştan sona görebilir miyim?",
            "2. Fotoğrafta poz sınırı var mı? Çekilen tüm kareler teslim ediliyor mu?",
            "3. Video sinematik klip mi, omuz kamera mı, ikisi birden mi?",
            "4. Hangi etkinlikler pakete dahil: dış çekim, gelin alma, nikah, salon?",
            "5. Albüm dahil mi, kaç adet ve hangi boyutta?",
            "6. Dış çekim mekânı veya plato ücreti ayrıca ödeniyor mu?",
            "7. Düğün günü kaç kişilik ekip geliyor?",
            "8. Teslim süresi ne kadar ve nasıl teslim ediliyor?",
            "9. Depozito ne kadar, tarih ne zaman kesinleşiyor?",
            "10. Ek hizmetlerin (drone, ek etkinlik, klip) fiyatı ne?",
          ],
        },
        {
          h2: "Portfolyoda nelere bakmalı?",
          body: [
            "Sadece en iyi 10 kareye değil, tek bir düğünün tamamına bakın. Farklı ışık koşullarında (gündüz dış çekim, karanlık salon) tutarlı kalite, insanların doğal ifadeleri ve videoda hikâye akışı, bir ekibin gerçek seviyesini gösterir.",
          ],
        },
        {
          h2: "Fiyatı nasıl karşılaştırmalı?",
          body: [
            "İki teklifi ancak kapsamları eşitlendiğinde karşılaştırabilirsiniz. Albüm, plato, klip ve ek etkinlikleri her iki teklifte de aynı hale getirip toplam tutara bakın. Ayrıntılı rehber için “Ankara düğün fotoğrafçısı fiyatları” yazımıza göz atabilirsiniz.",
          ],
        },
        {
          h2: "REDMEDYA bu soruları nasıl cevaplıyor?",
          body: [
            "Fotoğrafta poz sınırı yoktur ve çekilen tüm kareler teslim edilir. Her pakette sinematik düğün klibi vardır; omuz kamera ayrıca eklenebilir. Anlaşmalı platolarımız kampanya süresince ücretsizdir. Paket oluşturucuda her kalemin fiyatı ve toplam tutar açıkça görünür; tarihiniz küçük bir depozito ile kilitlenir. Galerimizde gerçek düğünlerimizden örnekleri inceleyebilirsiniz.",
          ],
        },
      ]}
      faq={[
        {
          q: "En iyi düğün fotoğrafçısı nasıl anlaşılır?",
          a: "Tek bir düğünün tamamına bakın: farklı ışık koşullarında tutarlı kalite ve doğal ifadeler, ekibin gerçek seviyesini gösterir.",
        },
        {
          q: "Fotoğrafçıyla sözleşme yapılmalı mı?",
          a: "Evet. Tarih, saat, kapsam, teslim içeriği, toplam tutar ve depozito yazılı olarak netleşmeli.",
        },
        {
          q: "Ucuz düğün fotoğrafçısı tercih edilir mi?",
          a: "Fiyatı kapsamla birlikte değerlendirin. Düşük paket fiyatı; poz sınırı, ayrı plato ücreti veya ücretli albümle sonradan artabilir.",
        },
      ]}
    />
  );
}
