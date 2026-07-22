/**
 * SEO FAQ içeriği — evlenecek çiftlerin Google'da gerçekten aradığı sorular.
 * Cevaplar sitenin GÜNCEL gerçeğiyle birebir olmalı (yanıltıcı olmasın).
 * FAQPage yapısal verisi buradan üretilir (bkz. components/seo/faq-jsonld).
 */
export type FaqItem = { q: string; a: string };

/** Ana sayfa — genel, yüksek hacimli sorular */
export const GENERAL_FAQ: FaqItem[] = [
  {
    q: "Ankara'da düğün fotoğrafçısı fiyatları ne kadar?",
    a: "Paketlerimiz ₺11.000'den başlar (Paket 1 — Sinematik). Albümlü Paket 2 ₺15.000, drone hediyeli Full Prodüksiyon Paket 3 ₺22.000'dur. Paket oluşturucudan seçim yaparak toplam fiyatı ve kazancınızı anında görür, WhatsApp'tan teklif alırsınız.",
  },
  {
    q: "Dış çekim için plato veya mekân ücreti ödeyecek miyim?",
    a: "Kampanya süresince anlaşmalı platolarımız (No25, Anka ve diğerleri) tamamen ücretsizdir; ücret pakete dahildir. Kendi mekânınızı ayarlamak isterseniz paketten ₺2.000 indirim uygulanır.",
  },
  {
    q: "Çekilen tüm fotoğraflar teslim ediliyor mu, poz sınırı var mı?",
    a: "Poz sınırı yok. Düğün günü çekilen tüm kareler düzenlenmiş şekilde teslim edilir.",
  },
  {
    q: "Düğün çekimi için ne kadar önceden rezervasyon yapmalıyım?",
    a: "Yoğun sezonda (Haziran–Eylül) hafta sonları hızla dolar. Tarihinizi belirledikten sonra erken rezervasyon öneririz; küçük bir depozito ile tarihiniz kilitlenir ve başkasına verilmez.",
  },
  {
    q: "Drone ile düğün ve dış çekim yapıyor musunuz?",
    a: "Evet. Full Prodüksiyon pakette dış çekim drone çekimi hediyedir; diğer paketlerde ek hizmet olarak eklenebilir.",
  },
  {
    q: "Hangi bölgelere hizmet veriyorsunuz?",
    a: "Ankara ve tüm ilçeleri (Çankaya, Keçiören, Yenimahalle, Etimesgut, Sincan, Pursaklar, Mamak, Gölbaşı ve çevresi). Talebe göre şehir dışı çekim de yapıyoruz.",
  },
  {
    q: "Sinematik düğün klibi nedir?",
    a: "Düğününüzün sinema kalitesinde kurgulanmış kısa filmidir. Gelin alma, salon girişi ve ilk dans için ayrı sinematik klipler de eklenebilir.",
  },
  {
    q: "Rezervasyon nasıl yapılır?",
    a: "Paket oluşturucudan paketinizi kurun ve WhatsApp'tan gönderin. Ortalama 15 dakika içinde dönüş yapar, küçük bir depozito ile tarihinizi kilitleriz.",
  },
];

/** Fiyat / paket odaklı sayfalar */
export const FIYAT_FAQ: FaqItem[] = [
  {
    q: "Ankara düğün fotoğrafçısı paket fiyatları ne kadar?",
    a: "Paket 1 (Sinematik) ₺11.000, Paket 2 (Sinematik + Albüm) ₺15.000, Paket 3 (Full Prodüksiyon, drone hediye) ₺22.000. Kesin tutarı paket oluşturucuda anlık görürsünüz.",
  },
  {
    q: "Fiyata neler dahil?",
    a: "Poz sınırsız düğün günü fotoğraf çekimi, sinematik düğün klibi, tüm karelerin teslimi ve anlaşmalı plato ücretsiz. Paket 2 ve 3'te büyük albüm + aile albümleri, Paket 3'te ayrıca gelin alma & salon girişi klipleri ve hediye drone bulunur.",
  },
  {
    q: "Albüm seçenekleri neler?",
    a: "40+ çeşit albüm tasarımı arasından seçim yapabilirsiniz. 30×60 lüks büyük albüm ve aile albümleri paketlere dahildir veya ek olarak eklenir.",
  },
  {
    q: "Kapora / depozito ne kadar?",
    a: "Küçük bir depozito ile tarihiniz kesinleşir ve başkasına verilmez. Ödeme detaylarını WhatsApp üzerinden netleştiriyoruz.",
  },
  {
    q: "Kendi dış çekim mekânımı ayarlarsam ne olur?",
    a: "Kendi mekânınızı ayarlarsanız paket fiyatından ₺2.000 indirim uygulanır; mekân ücreti ve organizasyonu size ait olur.",
  },
];

/** Dış çekim / mekân odaklı sayfalar */
export const DISCEKIM_FAQ: FaqItem[] = [
  {
    q: "Ankara'da dış çekim nerede yapılıyor?",
    a: "Anlaşmalı platolarımızda (No25 Plato, Anka Plato ve diğer stüdyo platoları) veya açık mekânlarda çekim yapıyoruz. Kampanya süresince anlaşmalı plato kullanımı ücretsizdir.",
  },
  {
    q: "Plato çekimi nedir?",
    a: "Plato, dekorlu ve ışığı kontrol edilebilen kapalı çekim stüdyosudur. Hava koşullarından bağımsız, her mevsim sinematik dış çekim kalitesi sağlar.",
  },
  {
    q: "Dış çekim ne kadar sürer?",
    a: "Konsepte ve mekâna göre planlanır; genellikle birkaç saatlik bir çekimdir. Detayları rezervasyon sırasında birlikte belirleriz.",
  },
  {
    q: "Dış çekimde drone çekimi var mı?",
    a: "Full Prodüksiyon pakette dış çekim drone çekimi hediyedir. Diğer paketlerde ek hizmet olarak eklenebilir.",
  },
  {
    q: "Save the date veya nişan dış çekimi yapıyor musunuz?",
    a: "Evet. Nişan, kına ve save the date gibi ek etkinlikler için de fotoğraf ve video çekimi ekleyebilirsiniz.",
  },
];
