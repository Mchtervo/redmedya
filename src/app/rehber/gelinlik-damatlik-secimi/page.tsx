import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const PATH = "/rehber/gelinlik-damatlik-secimi";

export const metadata: Metadata = {
  title: "Gelinlik, Damatlık ve Gelin Buketi Seçimi — Fotoğrafta Güzel Görünmek",
  description:
    "Gelinlik ne zaman alınmalı, kiralama mı satın alma mı? Damatlık modelleri ve renk seçimi, gelin buketi ve gelin çiçeği. Fotoğraflarda güzel görünen gelinlik, damatlık ve buket ipuçları.",
  keywords: [
    "gelinlik modelleri",
    "gelinlik ne zaman alınmalı",
    "gelinlik kiralama",
    "damatlık modelleri",
    "damatlık nasıl seçilir",
    "gelin buketi",
    "gelin çiçeği modelleri",
  ],
  alternates: { canonical: `${siteConfig.url}${PATH}` },
  openGraph: { type: "article", url: `${siteConfig.url}${PATH}` },
};

export default function Page() {
  return (
    <SeoLandingPage
      path={PATH}
      articleDate="2026-11-18"
      eyebrow="Rehber · Gelinlik & damatlık"
      h1="Gelinlik, damatlık ve gelin buketi — fotoğrafta güzel görünmek için"
      intro="Gelinlik ve damatlık, düğün fotoğraflarının merkezindedir ve yıllar sonra albümü açtığınızda ilk göze çarpan şeydir. Bu rehberde gelinlik ve damatlık seçerken zamanlama, kiralama-satın alma ve fotoğrafta nasıl duracağı konusunda pratik ipuçlarını; gelin buketi seçimini de topladık."
      bullets={[
        "Gelinlik araştırmasına erken başlayın, prova süresini hesaba katın",
        "Damatlığın kalıbı ve boyu fotoğrafta her şeydir",
        "Buketin rengi gelinlik ve mekânla uyumlu olsun",
      ]}
      ctaLabel="Düğün çekimini planla"
      sections={[
        {
          h2: "Gelinlik ne zaman alınmalı?",
          body: [
            "Gelinlik araştırmasına düğünden 6–9 ay önce başlamak önerilir. Diktirme veya özel tadilat gerekiyorsa üretim ve prova süreleri uzayabilir; son provayı düğüne birkaç hafta kala yapmak, kilo değişimlerine karşı da güvence sağlar.",
          ],
        },
        {
          h2: "Kiralama mı, satın alma mı?",
          body: [
            "Kiralama bütçe dostudur ve gelinlik saklama derdi yoktur; satın alma ise tam size göre tadilat ve hatıra olarak saklama imkânı verir. Kiralıyorsanız tadilat yapılıp yapılamayacağını, teslim ve iade tarihlerini ve dış çekimde kirlenme durumunda koşulları sorun.",
          ],
        },
        {
          h2: "Gelinlik fotoğrafta nasıl durur?",
          list: [
            "Kuyruk uzunluğunu dış çekim mekânına göre düşünün: uzun kuyruk çimde ve toprakta zorlayabilir",
            "Hareketli etek dönüşlerde ve rüzgârda çok sinematik görünür",
            "Çok parlak taş ve payetler flaşta parlama yapabilir",
            "Gelinliği giyerken oturma ve dans etme rahatlığını da deneyin",
          ],
          body: [],
        },
        {
          h2: "Damatlık nasıl seçilir?",
          body: [
            "Damatlıkta en önemli şey kalıptır: omuz, ceket boyu ve pantolon paçası doğru olduğunda damat fotoğraflarda kendiliğinden şık görünür. Hazır damatlık alıyorsanız terzi tadilatını mutlaka hesaba katın.",
          ],
          list: [
            "Lacivert, siyah, gri ve antrasit tonlar zamansız durur",
            "Gelinliğin beyaz/krem tonuyla gömlek rengini uyumlu seçin",
            "Ayakkabıyı düğünden önce birkaç kez giyip alıştırın",
          ],
        },
        {
          h2: "Gelin buketi seçimi",
          body: [
            "Gelin buketi hem gelinliği tamamlar hem de detay fotoğraflarının yıldızıdır. Buketin rengini gelinliğin tonu, düğünün renk teması ve mevsimle birlikte düşünün. Canlı çiçek uzun dış çekimlerde solabileceği için çiçekçinize dayanıklı türleri sorun; yapay buket ise gün boyu formunu korur.",
          ],
        },
        {
          h2: "Detay fotoğrafları için hazırlık",
          body: [
            "Yüzükler, ayakkabılar, parfüm, buket ve davetiye gibi detayları düğün sabahı bir arada tutun. Fotoğrafçınız hazırlık sırasında bunları birkaç dakikada çekebilir; albümünüzün en zarif sayfaları çoğu zaman bu detaylardan çıkar.",
          ],
        },
      ]}
      faq={[
        {
          q: "Gelinlik ne zaman alınmalı?",
          a: "Araştırmaya düğünden 6–9 ay önce başlamak önerilir; diktirme ve prova süresini hesaba katın.",
        },
        {
          q: "Gelinlik kiralamak mı, satın almak mı mantıklı?",
          a: "Kiralama bütçe dostudur; satın alma tam size göre tadilat ve hatıra olarak saklama imkânı verir. Kiralıyorsanız tadilat ve iade koşullarını sorun.",
        },
        {
          q: "Damatlık hangi renk seçilmeli?",
          a: "Lacivert, siyah, gri ve antrasit tonlar zamansızdır. En önemlisi kalıbın ve boyun tam oturmasıdır.",
        },
        {
          q: "Gelin buketi canlı mı olmalı, yapay mı?",
          a: "Canlı çiçek daha doğal görünür ama uzun dış çekimde solabilir; yapay buket gün boyu formunu korur. Çiçekçinize dayanıklı türleri sorun.",
        },
      ]}
    />
  );
}
