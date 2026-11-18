import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const PATH = "/rehber/gelin-kuaforu";

export const metadata: Metadata = {
  title: "Gelin Kuaförü Rehberi — Kaç Saat Sürer, Neler Yapılır?",
  description:
    "Gelin kuaförü kaç saat sürer, gelin kuaföründe neler yapılır, deneme ne zaman yapılmalı? Gelin saçı ve makyajını düğün günü akışına, gelin almaya ve dış çekime göre planlama rehberi.",
  keywords: [
    "gelin kuaförü",
    "gelin kuaförü kaç saat sürer",
    "gelin kuaföründe neler yapılır",
    "gelin kuaförünü kim öder",
    "gelin makyajı",
    "gelin saç modelleri",
    "ankara gelin kuaförü",
  ],
  alternates: { canonical: `${siteConfig.url}${PATH}` },
  openGraph: { type: "article", url: `${siteConfig.url}${PATH}` },
};

export default function Page() {
  return (
    <SeoLandingPage
      path={PATH}
      articleDate="2026-11-18"
      eyebrow="Rehber · Gelin kuaförü"
      h1="Gelin kuaförü rehberi — kaç saat sürer, neler yapılır?"
      intro="Düğün sabahı gelin kuaförüyle başlar ve kuaförden çıkış saati tüm günün akışını belirler: gelin alma, dış çekim, nikah… Bu rehberde gelin kuaföründe neler yapıldığını, ne kadar sürdüğünü ve saç-makyajın fotoğraflarda en iyi şekilde görünmesi için nelere dikkat etmeniz gerektiğini anlatıyoruz."
      bullets={[
        "Deneme randevusunu düğünden aylar önce alın",
        "Kuaför süresine mutlaka pay ekleyin",
        "Çıkış saatini fotoğrafçınızla birlikte planlayın",
      ]}
      ctaLabel="Düğün günü çekimini planla"
      sections={[
        {
          h2: "Gelin kuaföründe neler yapılır?",
          body: [
            "Kuaförden kuaföre değişmekle birlikte gelin hazırlığı genellikle şu adımlardan oluşur:",
          ],
          list: [
            "Cilt hazırlığı ve makyaj",
            "Saç tasarımı (topuz, yarım toplama, dalgalı açık saç vb.)",
            "Duvak, taç veya saç aksesuarlarının takılması",
            "Gelinliğin giyilmesinde yardım (kuaföre göre değişir)",
            "Son rötuşlar",
          ],
        },
        {
          h2: "Gelin kuaförü kaç saat sürer?",
          body: [
            "Saç ve makyaj birlikte genellikle birkaç saat sürer; süre saç modeline, makyajın yoğunluğuna ve kuaförün o gün kaç gelin hazırladığına göre değişir. Kesin süreyi deneme randevusunda kuaförünüze sorun ve düğün günü programına en az yarım saat ile bir saat arası pay ekleyin.",
            "Hesabı geriye doğru yapın: gelin alma ya da dış çekim saatinden kuaför süresini ve yol süresini çıkarın; kuaföre giriş saatiniz budur.",
          ],
        },
        {
          h2: "Deneme ne zaman yapılmalı?",
          body: [
            "Gelin kuaförü randevusunu genellikle düğünden 3–6 ay önce almak, saç ve makyaj denemesini ise gelinlik belli olduktan sonra yapmak önerilir. Denemeye gelinliğinizin ve duvağınızın fotoğraflarını götürün; tasarım bütüne göre şekillenir.",
          ],
        },
        {
          h2: "Saç ve makyaj fotoğrafta nasıl görünür?",
          body: [
            "Düğün fotoğrafları gün ışığında, platoda ve salonun yapay ışığında çekilir. Deneme sırasında farklı ışıklarda telefonla fotoğraf çekip bakmak, makyajın fotoğrafta nasıl duracağını görmenin en kolay yoludur.",
          ],
          list: [
            "Çok parlak (ışıltılı) ürünler flaşta parlama yapabilir",
            "Yüz ile boyun-dekolte tonu arasındaki fark fotoğrafta belirginleşir",
            "Uzun süren dış çekimde saçın gün boyu dayanması için sabitleme önemlidir",
            "Rötuş için yanınızda küçük bir çanta bulundurun",
          ],
        },
        {
          h2: "Kuaför hazırlığı da çekilsin mi?",
          body: [
            "Gelinliğin giyildiği, duvağın takıldığı, annenizin son dokunuşu yaptığı anlar düğün albümünün en duygusal kareleri arasındadır. Hazırlık anlarının çekilmesini istiyorsanız fotoğrafçınıza kuaförün adresini ve saatini önceden bildirin. REDMEDYA'da gelin alma ve düğün günü çekimlerini paket oluşturucuda planlayabilirsiniz.",
          ],
        },
      ]}
      faq={[
        {
          q: "Gelin kuaförü kaç saat sürer?",
          a: "Saç ve makyaj birlikte genellikle birkaç saat sürer. Kesin süreyi deneme randevusunda öğrenin ve programa pay ekleyin.",
        },
        {
          q: "Gelin kuaföründe neler yapılır?",
          a: "Makyaj, saç tasarımı, duvak veya aksesuarların takılması ve son rötuşlar. Bazı kuaförler gelinliğin giyilmesine de yardım eder.",
        },
        {
          q: "Gelin kuaförünü kim öder?",
          a: "Bu, aileden aileye ve yöreden yöreye değişir. Masrafların paylaşımını en başta iki aileyle konuşmak en sağlıklısıdır.",
        },
        {
          q: "Gelin kuaförü denemesi ne zaman yapılmalı?",
          a: "Gelinlik belli olduktan sonra, düğünden birkaç ay önce yapılması önerilir.",
        },
      ]}
    />
  );
}
