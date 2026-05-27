export type SearchEntry = {
  id: string;
  title: string;
  description?: string;
  href: string;
  keywords?: string[];
  group: "Sayfalar" | "Paket & fiyat" | "Bölümler";
};

/** Site içi arama indeksi — navbar araması */
export const searchIndex: SearchEntry[] = [
  {
    id: "home",
    title: "Ana Sayfa",
    href: "/",
    group: "Sayfalar",
    keywords: ["redmedya", "düğün", "ankara"],
  },
  {
    id: "gallery",
    title: "Galeri",
    description: "Cinematic düğün klipleri ve fotoğraflar",
    href: "/galeri",
    group: "Sayfalar",
  },
  {
    id: "package",
    title: "Paket Oluştur",
    description: "Kendi paketinizi seçin, anında fiyat görün",
    href: "/paket-olustur",
    group: "Sayfalar",
    keywords: ["fiyat", "teklif", "hesapla"],
  },
  {
    id: "ankara",
    title: "Ankara Düğün Fotoğrafçısı",
    href: "/ankara-dugun-fotografcisi",
    group: "Sayfalar",
    keywords: ["seo", "fotoğrafçı", "video"],
  },
  {
    id: "dis-cekim-fiyat",
    title: "Dış Çekim Fiyatları",
    href: "/dis-cekim-fiyatlari",
    group: "Sayfalar",
    keywords: ["dış çekim", "drone", "albüm"],
  },
  {
    id: "vip",
    title: "VIP Paket",
    href: "/vip",
    group: "Sayfalar",
  },
  {
    id: "reviews",
    title: "Yorumlar",
    href: "/#yorumlar",
    group: "Bölümler",
    keywords: ["referans", "mutlu çift"],
  },
  {
    id: "contact",
    title: "İletişim",
    href: "/#iletisim",
    group: "Bölümler",
    keywords: ["whatsapp", "telefon", "adres", "sincan"],
  },
  {
    id: "case-studies",
    title: "Gerçek çift paketleri",
    href: "/#gercek-ciftler",
    group: "Bölümler",
    keywords: ["örnek", "hikaye", "ayşe", "mehmet"],
  },
  {
    id: "dis-cekim-svc",
    title: "Dış çekim foto & video",
    description: "5.000₺ · drone hediye koşulu",
    href: "/paket-olustur",
    group: "Paket & fiyat",
    keywords: ["dış çekim", "fotoğraf", "klip"],
  },
  {
    id: "kampanya-klip",
    title: "Kampanya klipler",
    description: "Gelin alma & salon giriş — 3.500₺",
    href: "/paket-olustur",
    group: "Paket & fiyat",
    keywords: ["kampanya", "gelin alma", "ilk dans", "salon giriş"],
  },
  {
    id: "sinematik",
    title: "Sinematik klip (salon)",
    description: "10.000₺ · düğün başı — pasta kesimi",
    href: "/paket-olustur",
    group: "Paket & fiyat",
    keywords: ["sinematik", "salon", "düğün"],
  },
  {
    id: "omuz",
    title: "Omuz kamera",
    description: "6.500₺ · salon ve diğer etkinlikler",
    href: "/paket-olustur",
    group: "Paket & fiyat",
    keywords: ["omuz", "kamera", "canlı"],
  },
  {
    id: "album",
    title: "Büyük albüm",
    description: "2.500₺ (5 yaprak 10 sayfa) · 10 yaprak 20 sayfa %150",
    href: "/paket-olustur",
    group: "Paket & fiyat",
    keywords: ["albüm", "baskı"],
  },
];

function normalizeForSearch(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function filterSearchIndex(query: string): SearchEntry[] {
  const q = normalizeForSearch(query.trim());
  if (!q) return searchIndex;

  return searchIndex.filter((entry) => {
    const haystack = normalizeForSearch(
      [entry.title, entry.description, entry.group, ...(entry.keywords ?? [])]
        .filter(Boolean)
        .join(" ")
    );
    return haystack.includes(q);
  });
}
