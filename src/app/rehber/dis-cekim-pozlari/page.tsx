import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { PRICING } from "@/config/pricing";
import { formatPrice as tl } from "@/lib/utils";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const PATH = "/rehber/dis-cekim-pozlari";

export const metadata: Metadata = {
  title: "Dış Çekim Pozları ve Hazırlık — Elbise, Saç, İpuçları",
  description:
    "En güzel dış çekim pozları ve dış çekime hazırlık: dış çekim elbisesi, saç modeli, ayakkabı, mekân ve çekim günü ipuçları. Ankara'da plato ve açık mekân dış çekimi.",
  keywords: [
    "dış çekim pozları",
    "düğün fotoğraf pozları dış çekim",
    "dış çekim elbisesi",
    "dış çekim saç modelleri",
    "dış çekim mekanları",
    "dış çekim platoları",
    "ankara dış çekim",
  ],
  alternates: { canonical: `${siteConfig.url}${PATH}` },
  openGraph: { type: "article", url: `${siteConfig.url}${PATH}` },
};

export default function Page() {
  return (
    <SeoLandingPage
      path={PATH}
      articleDate="2026-11-18"
      eyebrow="Rehber · Dış çekim"
      h1="Dış çekim pozları ve hazırlık — elbise, saç ve çekim günü ipuçları"
      intro="Dış çekim, düğün albümünüzün en sinematik bölümüdür ve çoğu çift kameranın karşısında ilk kez bu kadar uzun süre durur. İyi haber şu: güzel dış çekim fotoğrafları için poz bilmeniz gerekmez. Yine de neyin işe yaradığını bilmek ve doğru hazırlanmak, kendinizi rahat hissetmenizi sağlar."
      bullets={[
        "Poz değil, birbirinizle etkileşim — en doğal kareler buradan çıkar",
        "Rahat ayakkabı ve yedek kıyafet unutmayın",
        "Mekân ve ışık saatini fotoğrafçınızla birlikte seçin",
      ]}
      ctaLabel="Dış çekimini planla"
      sections={[
        {
          h2: "En güzel dış çekim pozları",
          body: [
            "Fotoğrafçınız size yol gösterecektir; ama aşağıdaki pozlar hemen her dış çekimde işe yarar. Asıl sır, poz vermek yerine birbirinizle bir şey yapmaktır: yürümek, konuşmak, gülmek.",
          ],
          list: [
            "El ele yürüyüş — kameraya değil birbirinize bakarak",
            "Alın alına, gözler kapalı yakın kare",
            "Damadın gelini arkadan sarması",
            "Gelinliğin kuyruğunu açan rüzgâr ya da dönüş hareketi",
            "Uzaktan geniş kare: çift küçük, manzara büyük",
            "Detaylar: yüzükler, eller, buket, ayakkabılar",
            "Gülerken yakalanan doğal anlar",
          ],
        },
        {
          h2: "Dış çekim elbisesi ve saç",
          body: [
            "Dış çekimi düğün günü yapıyorsanız gelinlik ve gelin saçıyla çekilirsiniz. Ayrı bir gün yapıyorsanız (save the date, nişan dış çekimi) daha hafif bir elbise ve rahat bir saç modeli seçebilirsiniz.",
          ],
          list: [
            "Rüzgârlı havaya dayanıklı, sabitlenmiş saç modelleri tercih edin",
            "Uzun kuyruklu gelinlikte yürümesi kolay mekânlar seçin",
            "Yürüyüş bölümleri için rahat bir yedek ayakkabı getirin",
            "Damat için ceketsiz/gömlekli kareler de güzel bir alternatiftir",
          ],
        },
        {
          h2: "Plato mu, açık mekân mı?",
          body: [
            `Plato, dekorlu ve ışığı kontrol edilebilen kapalı çekim alanıdır; hava koşullarından bağımsız, her mevsim tutarlı sonuç verir. Açık mekân ise doğal ışık ve manzara sunar ama hava ve saat planlaması ister. REDMEDYA'nın anlaşmalı platoları (No25, Anka ve diğerleri) kampanya süresince ücretsizdir; kendi mekânınızı ayarlarsanız paketten ${tl(
              PRICING.OWN_VENUE_DISCOUNT
            )} indirim uygulanır.`,
          ],
        },
        {
          h2: "Çekim günü ipuçları",
          list: [
            "Yanınızda su, atıştırmalık ve rötuş malzemesi bulundurun",
            "Mekânlar arası yol süresini programa ekleyin",
            "Telefonları bir yakınınıza bırakın, ana odaklanın",
            "Drone isterseniz açık alanlı bir mekân seçin",
          ],
          body: [
            `Drone çekimi dış çekime havadan sinematik planlar ekler; etkinlik başına ${tl(
              PRICING.ADDON_DRONE
            )}'dir ve Full Prodüksiyon pakette dış çekim drone'u hediyedir.`,
          ],
        },
      ]}
      faq={[
        {
          q: "Dış çekimde poz bilmek gerekir mi?",
          a: "Hayır. Fotoğrafçınız yönlendirir; en doğal kareler birbirinizle etkileşim halindeyken (yürürken, konuşurken, gülerken) çıkar.",
        },
        {
          q: "Dış çekim ne kadar sürer?",
          a: "Konsepte ve mekâna göre değişir; genellikle birkaç saatlik bir çekimdir. Mekânlar arası yol süresini ayrıca hesaplayın.",
        },
        {
          q: "Dış çekim için hangi saat daha iyi?",
          a: "Açık mekânda ışığın yumuşak olduğu saatler daha güzel sonuç verir. Plato çekimi ise saatten ve havadan bağımsızdır.",
        },
        {
          q: "Ankara'da dış çekim nerede yapılır?",
          a: "Anlaşmalı platolarda veya açık mekânlarda. REDMEDYA'nın anlaşmalı platoları kampanya süresince ücretsizdir.",
        },
      ]}
    />
  );
}
