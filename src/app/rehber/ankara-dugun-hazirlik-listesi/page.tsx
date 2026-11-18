import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { PACKAGES } from "@/config/pricing";
import { formatPrice as tl } from "@/lib/utils";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const PATH = "/rehber/ankara-dugun-hazirlik-listesi";
const minPrice = Math.min(...PACKAGES.map((p) => p.price));

export const metadata: Metadata = {
  title: "Ankara Düğün Hazırlık Listesi 2026 — Ay Ay Yapılacaklar",
  description:
    "Ankara'da evlenecek çiftler için ay ay düğün hazırlık listesi: düğün salonu, gelinlik, damatlık, gelin kuaförü, nikah başvurusu, fotoğrafçı, davetiye, nişan ve kına planı.",
  keywords: [
    "düğün hazırlık listesi",
    "ankara düğün hazırlığı",
    "düğün yapılacaklar listesi",
    "gelinlik ne zaman alınmalı",
    "gelin kuaförü ne zaman ayarlanmalı",
    "nikah başvurusu ne zaman yapılır",
    "düğün fotoğrafçısı ne zaman ayarlanmalı",
  ],
  alternates: { canonical: `${siteConfig.url}${PATH}` },
  openGraph: { type: "article", url: `${siteConfig.url}${PATH}` },
};

export default function Page() {
  return (
    <SeoLandingPage
      path={PATH}
      articleDate="2026-11-18"
      eyebrow="Rehber · Düğün hazırlığı"
      h1="Ankara düğün hazırlık listesi — ay ay yapılacaklar"
      intro="Düğün hazırlığı; salon, gelinlik, kuaför, nikah, fotoğrafçı, davetiye derken onlarca kalemden oluşur ve sırası karıştığında en çok aranan tarihler kaçar. Ankara'da evlenecek çiftler için hazırladığımız bu listeyi takvim olarak kullanabilirsiniz. Süreler ortalama önerilerdir; yaz sezonunda evleniyorsanız her adımı biraz daha erkene çekin."
      bullets={[
        "Önce tarih ve salon — geri kalan her şey bu ikisine göre planlanır",
        "Fotoğrafçı ve video ekibi salondan hemen sonra",
        "Gelinlik ve kuaför için deneme randevularını erken alın",
        "Nikah başvurusunu son haftaya bırakmayın",
      ]}
      ctaLabel="Fotoğraf & video paketini şimdi planla"
      sections={[
        {
          h2: "12–9 ay önce: tarih, bütçe ve düğün salonu",
          body: [
            "İlk iş düğün tarihini ve bütçeyi netleştirmek. Ankara'da Haziran–Eylül arası hafta sonları en yoğun dönemdir; sevdiğiniz salon ve ekiplerin dolmaması için tarihi erken kesinleştirin.",
          ],
          list: [
            "Düğün tarihini ve tahmini misafir sayısını belirleyin",
            "Toplam bütçeyi kalemlere bölün (salon, fotoğraf-video, gelinlik, kuaför, organizasyon)",
            "Düğün salonu, kır düğünü mekânı veya otel seçin ve rezervasyon yapın",
            "Nişan ve kına yapılacaksa tarihlerini de takvime işleyin",
          ],
        },
        {
          h2: "9–6 ay önce: fotoğrafçı, video ve gelinlik",
          body: [
            `Salon kesinleştikten hemen sonra fotoğraf ve video ekibini ayarlayın; iyi ekiplerin yaz hafta sonları aylar önceden dolar. Paketleri karşılaştırırken neyin dahil olduğuna (poz sınırı, klip, albüm, dış çekim mekânı) bakın. REDMEDYA'da fotoğraf + sinematik klip paketleri ${tl(
              minPrice
            )}'den başlar ve fiyatı paket oluşturucuda anında görebilirsiniz.`,
            "Gelinlik için mağaza gezmeye bu dönemde başlayın. Diktirme ya da özel prova gerekiyorsa üretim ve tadilat süresini hesaba katın.",
          ],
          list: [
            "Fotoğrafçı ve video ekibini seçin, tarihinizi depozito ile kilitleyin",
            "Gelinlik modellerine bakın, prova takvimini öğrenin",
            "Dış çekim konseptini ve mekânını düşünmeye başlayın",
          ],
        },
        {
          h2: "6–3 ay önce: kuaför, damatlık, davetiye",
          body: [
            "Gelin kuaförü, düğün sabahının en uzun süren hazırlığıdır. Saç ve makyaj denemesi için randevu alın; denemede düğün günü saatini ve kuaförün gelin alma saatine yetişip yetişmeyeceğini mutlaka konuşun.",
          ],
          list: [
            "Gelin kuaförü ve makyaj denemesi randevusu",
            "Damatlık ve aksesuar seçimi",
            "Davetiye tasarımı ve misafir listesinin kesinleşmesi",
            "Save the date veya nişan dış çekimi (isteğe bağlı)",
            "Gelin arabası ve konvoy planı",
          ],
        },
        {
          h2: "3–1 ay önce: nikah başvurusu ve detaylar",
          body: [
            "Nikah başvurusu, evlenecek çiftlerin ikametlerine göre belediyelerin evlendirme memurluklarına yapılır. Gerekli belgeler ve başvuru süreleri değişebildiği için başvuru öncesinde ilgili belediyenin güncel bilgilerini teyit edin ve başvuruyu son haftaya bırakmayın.",
          ],
          list: [
            "Nikah başvurusu ve nikah salonu/saati",
            "Davetiyelerin dağıtımı",
            "Gelinlik son provaları",
            "Fotoğrafçıyla düğün günü akışını konuşun (gelin alma saati, dış çekim, salon girişi)",
            "Kına gecesi programı",
          ],
        },
        {
          h2: "Son hafta ve düğün günü",
          body: [
            "Son haftada her ekiple saatleri teyit edin: kuaför, gelin arabası, fotoğraf-video ekibi, salon. Düğün günü akışını yazılı hale getirip ailenizden birine verin; sizin saat kontrolüyle uğraşmanıza gerek kalmasın.",
          ],
          list: [
            "Tüm ekiplerle saat teyidi",
            "Gelinlik, ayakkabı, takı ve yüzüklerin hazırlanması",
            "Düğün günü akış planının ailenizle paylaşılması",
          ],
        },
      ]}
      faq={[
        {
          q: "Düğün hazırlığına kaç ay önceden başlanmalı?",
          a: "Rahat bir hazırlık için 9–12 ay önce başlamak idealdir. Yaz sezonunda evleniyorsanız salon ve fotoğrafçı gibi kalemleri daha da erken ayarlayın.",
        },
        {
          q: "Gelinlik ne zaman alınmalı?",
          a: "Gelinlik araştırmasına düğünden 6–9 ay önce başlamak önerilir; diktirme ve tadilat süresini hesaba katmak gerekir.",
        },
        {
          q: "Gelin kuaförü ne zaman ayarlanmalı?",
          a: "Düğünden 3–6 ay önce randevu alıp saç-makyaj denemesi yapmak önerilir. Kuaför çıkış saatini gelin alma ve dış çekim saatine göre planlayın.",
        },
        {
          q: "Düğün fotoğrafçısı kaç ay önceden ayarlanmalı?",
          a: "Salonu kesinleştirdikten hemen sonra, yani genellikle 6–9 ay önce. Yaz hafta sonları hızla dolar; küçük bir depozito ile tarihinizi kilitleyebilirsiniz.",
        },
        {
          q: "Nikah başvurusu ne zaman yapılır?",
          a: "Nikah başvurusu belediyelerin evlendirme memurluklarına yapılır. Gerekli belgeler ve süreler değişebildiği için başvuru öncesinde ilgili belediyeden güncel bilgiyi teyit edin.",
        },
      ]}
    />
  );
}
