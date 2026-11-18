import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const PATH = "/rehber/dugun-gunu-akisi";

export const metadata: Metadata = {
  title: "Düğün Günü Akışı — Kuaförden After Party'ye Örnek Plan",
  description:
    "Düğün günü nasıl planlanır? Gelin kuaförü, damat hazırlığı, gelin alma, dış çekim, nikah, salon girişi ve after party için örnek düğün günü akışı ve zamanlama ipuçları.",
  keywords: [
    "düğün günü akışı",
    "düğün günü programı",
    "gelin kuaförü kaç saat sürer",
    "dış çekim ne kadar sürer",
    "gelin alma saati",
    "düğün günü planı",
  ],
  alternates: { canonical: `${siteConfig.url}${PATH}` },
  openGraph: { type: "article", url: `${siteConfig.url}${PATH}` },
};

export default function Page() {
  return (
    <SeoLandingPage
      path={PATH}
      articleDate="2026-11-18"
      eyebrow="Rehber · Düğün günü"
      h1="Düğün günü akışı — kuaförden after party'ye örnek plan"
      intro="Düğün günü, sabah kuaförde başlayıp gece yarısı salonda biten uzun bir maratondur. İyi kurulmuş bir akış hem sizi strese sokmaz hem de fotoğraf ve video ekibinin hiçbir anı kaçırmamasını sağlar. Aşağıdaki plan, Ankara'da sık gördüğümüz klasik bir düğün gününü örnek alır; saatleri kendi salonunuza ve programınıza göre uyarlayın."
      bullets={[
        "Kuaför çıkış saati tüm günü belirler — geri sayımı oradan yapın",
        "Dış çekimi gelin almadan önce mi sonra mı yapacağınıza erkenden karar verin",
        "İlçeler arası yol süresini (trafik dahil) plana ekleyin",
        "Akışı yazılı hale getirip ekiplerle ve ailenizle paylaşın",
      ]}
      ctaLabel="Düğün günü çekimini planla"
      sections={[
        {
          h2: "Sabah: gelin kuaförü ve damat hazırlığı",
          body: [
            "Gelin kuaförü günün en uzun hazırlığıdır; saç ve makyaj genellikle birkaç saat sürer. Kuaföre ne zaman gireceğinizi, gelin alma ya da dış çekim saatinden geriye doğru hesaplayın ve araya mutlaka pay bırakın.",
            "Hazırlık anlarını (gelinlik, ayakkabı, takı, damadın kravatı) çektirmek istiyorsanız fotoğrafçıya hazırlığın nerede ve hangi saatte olacağını önceden bildirin.",
          ],
        },
        {
          h2: "Öğle: dış çekim",
          body: [
            "Dış çekimi düğün günü yapacaksanız genellikle kuaförden sonra, gelin almadan önce ya da sonra planlanır. Plato çekimi hava koşullarından bağımsızdır; açık mekânda ise ışığın en güzel olduğu saatleri hedeflemek gerekir.",
          ],
          list: [
            "Mekânlar arası yol süresini hesaba katın",
            "Plato veya mekân rezervasyonunu önceden teyit edin",
            "Yanınızda su, yedek ayakkabı ve rötuş malzemesi bulundurun",
          ],
        },
        {
          h2: "Öğleden sonra: gelin alma",
          body: [
            "Gelin alma; damadın ve ailesinin gelişi, kapı önü gelenekleri, kemer bağlama ve aile vedasıyla günün en duygusal bölümüdür. Bu bölüm için ayrı bir sinematik klip çektirmek, düğün filminizin en çok izlenen kısmı olur.",
          ],
        },
        {
          h2: "Akşam: nikah, salon girişi ve ilk dans",
          body: [
            "Nikah salonda kıyılacaksa nikah memurunun saati programın sabit noktasıdır; diğer her şeyi buna göre yerleştirin. Salona giriş ve ilk dans gecenin en çok paylaşılan anlarıdır; müzik ve ışık için salon ekibiyle önceden konuşun.",
          ],
          list: [
            "Salona giriş ve ilk dans",
            "Nikah (salonda kıyılıyorsa)",
            "Pasta kesimi ve takı merasimi",
            "Aile ve arkadaş toplu kareleri",
          ],
        },
        {
          h2: "Gece: eğlence ve after party",
          body: [
            "Halaylar, oyunlar ve after party ile gece kapanır. Tüm geceyi sinematik bir filme dönüştürmek isteyenler için Salon Full Sinematik, kesintisiz arşiv isteyenler için omuz kamera seçeneği vardır.",
          ],
        },
      ]}
      faq={[
        {
          q: "Gelin kuaförü kaç saat sürer?",
          a: "Saç ve makyaj genellikle birkaç saat sürer; süreyi kuaförünüzle deneme randevusunda netleştirin ve programa pay ekleyin.",
        },
        {
          q: "Dış çekim ne kadar sürer?",
          a: "Konsepte ve mekâna göre değişir; genellikle birkaç saatlik bir çekimdir. Mekânlar arası yol süresini ayrıca hesaplayın.",
        },
        {
          q: "Dış çekim düğün günü mü yapılmalı, önceden mi?",
          a: "İkisi de mümkündür. Düğün günü yapmak gelinlik ve makyajı bir kez hazırlamanızı sağlar; önceden yapmak ise düğün gününü rahatlatır.",
        },
        {
          q: "Düğün günü akışını fotoğrafçıyla ne zaman konuşmalıyım?",
          a: "Düğünden yaklaşık bir ay önce; gelin alma, dış çekim, nikah ve salon saatleri netleştiğinde.",
        },
      ]}
    />
  );
}
