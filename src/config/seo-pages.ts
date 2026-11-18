/**
 * Tüm SEO sayfalarının TEK listesi. Footer, sayfa içi link ağı, sitemap ve
 * /llms.txt buradan beslenir — yeni sayfa ekleyince sadece buraya yaz.
 */
export type SeoPageLink = {
  href: string;
  label: string;
  kind: "service" | "guide";
  /** llms.txt'de görünen tek satır açıklama */
  summary: string;
};

export const SEO_PAGES: SeoPageLink[] = [
  // ——— Hizmet sayfaları ———
  { href: "/ankara-dugun-fotografcisi", label: "Ankara düğün fotoğrafçısı", kind: "service", summary: "Paketler, fiyatlar ve hizmet kapsamı" },
  { href: "/ankara-dugun-videosu", label: "Düğün videosu", kind: "service", summary: "Sinematik düğün klibi, Salon Full Sinematik" },
  { href: "/ankara-gelin-alma-klibi", label: "Gelin alma klibi", kind: "service", summary: "Gelin alma sinematik klip ve fotoğraf" },
  { href: "/ankara-salon-dugun-cekimi", label: "Salon düğün çekimi", kind: "service", summary: "Salon girişi, ilk dans ve tüm gece klibi" },
  { href: "/ankara-nisan-cekimi", label: "Nişan çekimi", kind: "service", summary: "Nişan fotoğraf ve video çekimi" },
  { href: "/ankara-kina-cekimi", label: "Kına çekimi", kind: "service", summary: "Kına gecesi fotoğraf ve video" },
  { href: "/ankara-nikah-cekimi", label: "Nikah çekimi", kind: "service", summary: "Nikah töreni fotoğraf ve video" },
  { href: "/ankara-omuz-kamera-cekimi", label: "Omuz kamera", kind: "service", summary: "Düğün günü ham + kurgulu omuz kamera kaydı" },
  { href: "/ankara-drone-dugun-cekimi", label: "Drone düğün çekimi", kind: "service", summary: "Dış çekim, gelin alma ve salon için drone" },
  { href: "/ankara-dugun-albumu", label: "Düğün albümü", kind: "service", summary: "Büyük albüm, aile albümü ve canvas fiyatları" },
  { href: "/ankara-dis-cekim-mekanlari", label: "Dış çekim mekanları", kind: "service", summary: "Anlaşmalı platolar ve dış çekim mekânları" },
  { href: "/dis-cekim-fiyatlari", label: "Dış çekim fiyatları", kind: "service", summary: "Dış çekim ve düğün paketi fiyatları" },
  // ——— Rehberler ———
  { href: "/rehber/ankara-dugun-hazirlik-listesi", label: "Düğün hazırlık listesi", kind: "guide", summary: "Ay ay düğün hazırlığı: salon, gelinlik, kuaför, nikah, fotoğrafçı" },
  { href: "/rehber/ankara-dugun-fotografcisi-fiyatlari", label: "Düğün fotoğrafçısı fiyatları 2026", kind: "guide", summary: "Ankara'da düğün fotoğraf ve video fiyatları nasıl oluşur" },
  { href: "/rehber/dugun-gunu-akisi", label: "Düğün günü akışı", kind: "guide", summary: "Kuaförden after party'ye örnek düğün günü planı" },
  { href: "/rehber/dugun-fotografcisi-nasil-secilir", label: "Düğün fotoğrafçısı nasıl seçilir", kind: "guide", summary: "Fotoğrafçı seçerken sorulacak sorular" },
  { href: "/rehber/dugun-masraflari-listesi", label: "Düğün masrafları listesi 2026", kind: "guide", summary: "Düğün masraf kalemleri, kim öder, bütçe nasıl yapılır" },
  { href: "/rehber/gelin-kuaforu", label: "Gelin kuaförü rehberi", kind: "guide", summary: "Gelin kuaförü kaç saat sürer, neler yapılır, nasıl planlanır" },
  { href: "/rehber/nisan-hazirligi-listesi", label: "Nişan hazırlığı listesi", kind: "guide", summary: "Nişan için yapılacaklar, nişan tepsisi, kıyafet ve program" },
  { href: "/rehber/kina-gecesi-organizasyonu", label: "Kına gecesi organizasyonu", kind: "guide", summary: "Kına gecesi nasıl yapılır, sıralaması ve hazırlık listesi" },
  { href: "/rehber/dis-cekim-pozlari", label: "Dış çekim pozları ve hazırlık", kind: "guide", summary: "Dış çekim pozları, elbise, saç ve çekim günü ipuçları" },
  { href: "/rehber/save-the-date-nedir", label: "Save the date nedir?", kind: "guide", summary: "Save the date anlamı, ne zaman gönderilir, çekim fikirleri" },
  { href: "/rehber/gelin-alma-nasil-olur", label: "Gelin alma nasıl olur?", kind: "guide", summary: "Gelin alma gelenekleri, sıralaması ve hazırlık" },
  { href: "/rehber/dugun-salonu-secimi", label: "Düğün salonu nasıl seçilir", kind: "guide", summary: "Ankara'da düğün salonu seçerken dikkat edilecekler" },
  { href: "/rehber/kir-dugunu-rehberi", label: "Kır düğünü rehberi", kind: "guide", summary: "Ankara'da kır düğünü planlama, mekân ve hava durumu" },
  { href: "/rehber/gelinlik-damatlik-secimi", label: "Gelinlik, damatlık ve gelin buketi", kind: "guide", summary: "Fotoğrafta güzel görünen gelinlik, damatlık ve buket seçimi" },
];

export const SEO_SERVICE_PAGES = SEO_PAGES.filter((p) => p.kind === "service");
export const SEO_GUIDE_PAGES = SEO_PAGES.filter((p) => p.kind === "guide");
