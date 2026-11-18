import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { PACKAGES } from "@/config/pricing";
import { formatPrice as tl } from "@/lib/utils";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const PATH = "/rehber/dugun-masraflari-listesi";
const [P1, P2, P3] = [1, 2, 3].map((id) => PACKAGES.find((p) => p.id === id)!);

export const metadata: Metadata = {
  title: "Düğün Masrafları Listesi 2026 — Kalemler, Kim Öder, Bütçe",
  description:
    "Düğün masrafları listesi 2026: salon, gelinlik, damatlık, kuaför, fotoğraf-video, davetiye, nişan ve kına masrafları. Düğün masrafları kime aittir, bütçe nasıl yapılır?",
  keywords: [
    "düğün masrafları",
    "düğün masrafları 2026",
    "düğün masrafları listesi",
    "düğün masrafları kime aittir",
    "düğün masrafları nasıl paylaşılır",
    "düğün bütçesi",
  ],
  alternates: { canonical: `${siteConfig.url}${PATH}` },
  openGraph: { type: "article", url: `${siteConfig.url}${PATH}` },
};

export default function Page() {
  return (
    <SeoLandingPage
      path={PATH}
      articleDate="2026-11-18"
      eyebrow="Rehber · Bütçe"
      h1="Düğün masrafları listesi 2026 — kalemler, kim öder, bütçe nasıl yapılır?"
      intro="Düğün bütçesi, kalemler tek tek yazılmadığında en çok şaşırtan konudur. Bu rehberde düğün masraflarını başlık başlık listeliyor, masrafların taraflar arasında nasıl paylaşıldığını ve bütçeyi nasıl kontrol altında tutabileceğinizi anlatıyoruz. Listeyi kendi bütçe tablonuz için şablon olarak kullanabilirsiniz."
      bullets={[
        "Önce toplam bütçeyi, sonra kalemleri belirleyin",
        "Her teklifi 'toplam tutar' ve 'neler dahil' üzerinden karşılaştırın",
        "Beklenmeyen giderler için pay ayırın",
      ]}
      ctaLabel="Fotoğraf & video bütçeni hesapla"
      sections={[
        {
          h2: "Düğün masrafları listesi",
          body: ["Düğün masraflarını şu ana başlıklar altında toplayabilirsiniz:"],
          list: [
            "Mekân: düğün salonu, kır düğünü mekânı veya otel; yemek/ikram ve içecek",
            "Gelin: gelinlik, ayakkabı, duvak ve aksesuarlar, gelin kuaförü ve makyaj",
            "Damat: damatlık, ayakkabı, gömlek, damat tıraşı",
            "Fotoğraf ve video: düğün günü, dış çekim, gelin alma, salon, albüm",
            "Davetiye, nikah şekeri ve hediyelikler",
            "Gelin arabası, süsleme ve konvoy",
            "Müzik: DJ, orkestra veya bando",
            "Çiçek: gelin buketi, masa ve salon süslemesi",
            "Nikah: nikah salonu ve tören giderleri",
            "Nişan ve kına: mekân, kıyafet, organizasyon, ikram",
            "Takı, yüzük ve alyans",
            "Balayı",
          ],
        },
        {
          h2: "Düğün masrafları kime aittir?",
          body: [
            "Masrafların hangi tarafça karşılanacağı aileden aileye ve yöreden yöreye değişir; tek bir doğru yoktur. Geleneksel olarak bazı kalemler kız tarafına, bazıları erkek tarafına ait sayılsa da günümüzde pek çok çift masrafları ortak bütçeden karşılıyor ya da kalemleri aileler arasında paylaştırıyor.",
            "Sonradan anlaşmazlık yaşanmaması için hangi kalemi kimin üstleneceğini en başta, iki aileyle birlikte konuşup yazılı bir listeye dökmek en sağlıklı yöntemdir.",
          ],
        },
        {
          h2: "Düğün bütçesi nasıl yapılır?",
          list: [
            "Toplam bütçeyi ve misafir sayısını belirleyin — mekân ve ikram en büyük kalemdir",
            "Kalemleri öncelik sırasına koyun: sizin için en önemli olan üç şey ne?",
            "Her kalem için en az iki teklif alın ve kapsamları eşitleyerek karşılaştırın",
            "Kapora ve ödeme tarihlerini bir tabloda takip edin",
            "Beklenmeyen giderler için bütçenin bir kısmını ayırın",
          ],
          body: [
            "Bütçe yaparken en sık yapılan hata, teklifleri sadece ilk fiyata bakarak karşılaştırmaktır. Örneğin fotoğrafçı tekliflerinde albüm, dış çekim mekânı ücreti veya poz sınırı gibi kalemler toplam tutarı ciddi şekilde değiştirebilir.",
          ],
        },
        {
          h2: "Fotoğraf ve video için ne kadar bütçe ayırmalı?",
          body: [
            `Düğün fotoğrafları ve videosu, düğünden geriye kalan en kalıcı şeydir; bu yüzden pek çok çift bu kalemi öncelikli tutar. REDMEDYA'da fiyatlar şeffaftır: ${P1.name} ${P1.subtitle} ${tl(
              P1.price
            )}, albümlü ${P2.name} ${tl(P2.price)}, gelin alma ve salon klipleri ile drone dahil ${P3.name} ${tl(
              P3.price
            )}'dir. Paket oluşturucuda seçimlerinizi yaptığınızda toplam tutarı anında görür, bütçenize göre ekleme veya çıkarma yaparsınız.`,
          ],
        },
      ]}
      faq={[
        {
          q: "Düğün masrafları nelerdir?",
          a: "Başlıca kalemler: mekân ve ikram, gelinlik ve damatlık, kuaför, fotoğraf-video, davetiye, gelin arabası, müzik, çiçek, nikah, nişan ve kına, takı ve balayı.",
        },
        {
          q: "Düğün masrafları kime aittir?",
          a: "Aileden aileye ve yöreden yöreye değişir. En sağlıklısı, hangi kalemi kimin üstleneceğini iki aileyle en başta konuşup yazılı listeye dökmektir.",
        },
        {
          q: "Düğün bütçesinde en büyük kalem hangisi?",
          a: "Genellikle mekân ve ikramdır; bu yüzden misafir sayısı toplam bütçeyi en çok etkileyen karardır.",
        },
        {
          q: "Düğün fotoğrafçısına ne kadar bütçe ayrılmalı?",
          a: `Kapsama göre değişir. REDMEDYA'da fotoğraf + sinematik klip ${tl(P1.price)}, albümlü paket ${tl(
            P2.price
          )}, Full Prodüksiyon ${tl(P3.price)}'dir.`,
        },
      ]}
    />
  );
}
