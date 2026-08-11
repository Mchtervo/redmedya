/**
 * PAKET OLUŞTUR V2 — Tek fiyat kaynağı.
 *
 * ⚠️ GİZLİ KURAL: Paket satış fiyatlarının içine PLATO_HIDDEN_FEE (₺3.000) gömülüdür.
 * UI'da HİÇBİR YERDE "plato ücreti" / "+₺3.000" satırı GÖSTERİLMEZ. Plato ya
 * "KAMPANYAYLA ÜCRETSİZ" olarak sunulur ya da kendi mekânını ayarlayana
 * "−₺2.000 indirim" olarak gösterilir. Bu yorumlar koddadır; müşteri arayüzünde asla.
 */

export const PRICING = {
  PLATO_HIDDEN_FEE: 3000, // pakete gömülü, UI'da gösterilmez
  OWN_VENUE_DISCOUNT: 2000, // "kendim ayarlayacağım" seçene indirim
  UPSELL_KLIP_FULL: 5000, // gelin alma / salon girişi klip normal fiyat
  UPSELL_KLIP_CAMPAIGN: 3500, // kampanyalı upsell fiyatı
  DRONE_GIFT_VALUE: 4000, // P3 hediye drone'un gösterilen değeri (Mücahit: ₺4.000)
  // Mücahit onayı: drone ₺4.000. Hediye değeri (DRONE_GIFT_VALUE) ile addon fiyatı
  // eşit tutuluyor ki sayfada çelişki olmasın.
  ADDON_DRONE: 4000, // etkinlik başına
  ADDON_OMUZ: 6500, // etkinlik başına
  ADDON_SALON_FULL: 6000, // Mücahit: indirimli net satış — HER pakette 6.000
  SALON_FULL_LIST: 8500, // üstü çizili → kazanç 2.500 (8.500 − 6.000)
  ADDON_FOTO_EKEVENT: 5000, // ek etkinlik fotoğraf (kına/nişan/nikah/salon)
  ADDON_CANVAS_5070: 1000,
  ADDON_CANVAS_70100: 1500,
  ADDON_AILE_ALBUM: 1000, // kampanya (bundle) fiyatı — adet
  ADDON_BUYUK_ALBUM: 2500, // kampanya (bundle) fiyatı
  PACKAGE_3_PRICE: 22000, // Mücahit: indirimler uygulanınca P3 net satış

  // ————— Kampanyasız (à la carte) list fiyatları — üstü çizili çapaların DAYANAĞI —————
  // ⚠️ Mücahit: bunlar stüdyonun kampanyasız menü fiyatlarıdır; üstü çizili "değer
  // toplamı" bu kalemlerin toplamıdır (indirimli satış mevzuatına dayanak). Gerçek
  // menü fiyatlarınızla birebir olmalı — farklıysa buradan güncelleyin.
  LIST_FOTO: 6500, // kampanyasız düğün günü fotoğraf çekimi
  LIST_KLIP: 6500, // kampanyasız sinematik düğün klibi
  LIST_BUYUK_ALBUM: 4500, // kampanyasız büyük albüm (bundle'da 2.500)
  LIST_AILE_ALBUM: 1500, // kampanyasız aile albümü (bundle'da 1.000)
  LIST_PLATO: 3000, // plato kullanım değeri (çapada sayılır, müşteriye TUTAR gösterilmez)
} as const;

export type PackageId = 1 | 2 | 3;
export type PlatoId = "baska" | "no25" | "anka" | "own";
export type AddonId =
  | "klip-gelin-alma"
  | "klip-salon-giris"
  | "salon-full"
  | "drone"
  | "omuz"
  | "foto-ekevent"
  | "buyuk-album"
  | "aile-album"
  | "canvas-5070"
  | "canvas-70100";

/** Paketten çıkarılabilir (kilitli olmayan) kalemler */
export type RemovableId = "p-buyuk-album" | "p-aile-album";

export type PackageContentLine = {
  label: string;
  /** hediye / kilitli çekirdek satırı vurgusu */
  emphasis?: "gift" | "drone" | "core";
};

export type PackageDef = {
  id: PackageId;
  name: string;
  subtitle: string;
  /** Üstü çizili değer toplamı (çapa) */
  valueTotal: number;
  /** Satış fiyatı (gizli plato dahil) */
  price: number;
  /** Anlaşmalı plato ile çiftin kazancı (editorial, spec tablosundan) */
  savings: number;
  featured?: boolean;
  ribbon?: string;
  /** Kart üst şeridi görseli (§8) — plato'ya değil pakete; insan içermez */
  stripImage?: string;
  stripAlt?: string;
  contents: PackageContentLine[];
  /** "Paketinde olanlar" bölümünde kilitli (çıkarılamaz) çekirdek kalemler */
  lockedItems: { label: string; gift?: boolean }[];
  /** Bu pakette dahil (çıkarılabilir) kalemler ve à la carte değerleri */
  removables: { id: RemovableId; label: string; value: number; count?: number }[];
  /** P3 için dahil gelen (kilitli) klip/hediye addon id'leri */
  includedAddons: AddonId[];
};

const ALBUM_OPTIONS_LINE = "40+ çeşit albüm tasarımı arasından seçim";

// ————————————————————————————— ÇAPA DAYANAĞI —————————————————————————————
// Üstü çizili "değer toplamı" = kampanyasız paket + hediye kalemler.
// savings = (değer − satış); LIST_PLATO (₺3.000) kazanca DAHİL ama UI'da
// "plato ücreti" diye AYRICA yazılmaz — yalnızca "Anlaşmalı plato ÜCRETSİZ".
//
//  P1: ₺16.750 → 11.000  (indirim 2.750 + hediye 3.000 = kazanç 5.750)
//  P2: ₺21.750 → 15.000  (indirim 3.750 + hediye 3.000 = kazanç 6.750)
//  P3: ₺34.500 → 22.000  (indirim 5.500 + drone 4.000 + hediye 3.000 = kazanç 12.500)
const P1_VALUE = 13750 + PRICING.LIST_PLATO; // 16.750
const P2_VALUE = 18750 + PRICING.LIST_PLATO; // 21.750
const P3_VALUE = 31500 + PRICING.LIST_PLATO; // 34.500 (27.500 + drone 4.000 + 3.000)

export const PACKAGES: PackageDef[] = [
  {
    id: 1,
    name: "Paket 1",
    subtitle: "Sinematik",
    valueTotal: P1_VALUE, // 16.750
    price: 11000,
    savings: P1_VALUE - 11000, // 5.750
    stripImage: "/images/paket-olustur/paket1-cine.webp",
    stripAlt: "Sinematik düğün çekimi ekipmanı",
    contents: [
      { label: "Düğün günü fotoğraf çekimi (poz sınırı YOK)", emphasis: "core" },
      { label: "Sinematik düğün klibi", emphasis: "core" },
      { label: "Çekilen TÜM kareler teslim" },
      { label: `${ALBUM_OPTIONS_LINE} (isteğe bağlı ekle)` },
      { label: "Anlaşmalı plato ÜCRETSİZ", emphasis: "gift" },
    ],
    lockedItems: [
      { label: "Düğün günü fotoğraf çekimi (poz sınırı YOK)" },
      { label: "Sinematik düğün klibi" },
    ],
    removables: [],
    includedAddons: [],
  },
  {
    id: 2,
    name: "Paket 2",
    subtitle: "Sinematik + Albüm",
    valueTotal: P2_VALUE, // 21.750
    price: 15000,
    savings: P2_VALUE - 15000, // 6.750
    featured: true,
    ribbon: "⭐ EN ÇOK TERCİH EDİLEN",
    stripImage: "/images/paket-olustur/album-luxury.webp",
    stripAlt: "Lüks deri düğün albümü",
    contents: [
      { label: "Paket 1'deki her şey" },
      { label: "1 Büyük Albüm (30×60, lüks A kalite)" },
      { label: "2 Aile Albümü" },
      { label: ALBUM_OPTIONS_LINE },
      { label: "Anlaşmalı plato ÜCRETSİZ", emphasis: "gift" },
    ],
    lockedItems: [
      { label: "Düğün günü fotoğraf çekimi (poz sınırı YOK)" },
      { label: "Sinematik düğün klibi" },
    ],
    removables: [
      { id: "p-buyuk-album", label: "Büyük Albüm (30×60)", value: PRICING.ADDON_BUYUK_ALBUM },
      { id: "p-aile-album", label: "Aile Albümü", value: PRICING.ADDON_AILE_ALBUM, count: 2 },
    ],
    includedAddons: [],
  },
  {
    id: 3,
    name: "Paket 3",
    subtitle: "Full Prodüksiyon",
    valueTotal: P3_VALUE, // 34.500
    price: PRICING.PACKAGE_3_PRICE,
    savings: P3_VALUE - PRICING.PACKAGE_3_PRICE, // 12.500 (5.500 + drone 4.000 + 3.000)
    ribbon: "🚁 DRONE HEDİYE",
    stripImage: "/images/paket-olustur/drone-gift.webp",
    stripAlt: "Hediye dış çekim drone çekimi",
    contents: [
      { label: "Paket 2'deki her şey" },
      { label: "Gelin Alma Klip Çekimi" },
      { label: "Salon Girişi & İlk Dans Klip Çekimi" },
      { label: ALBUM_OPTIONS_LINE },
      {
        label: `Dış Çekimde DRONE HEDİYE — ₺${PRICING.DRONE_GIFT_VALUE.toLocaleString(
          "tr-TR"
        )} değerinde kazanç`,
        emphasis: "drone",
      },
      { label: "Anlaşmalı plato ÜCRETSİZ", emphasis: "gift" },
    ],
    lockedItems: [
      { label: "Düğün günü fotoğraf çekimi (poz sınırı YOK)" },
      { label: "Sinematik düğün klibi" },
      { label: "Gelin Alma Klip Çekimi" },
      { label: "Salon Girişi & İlk Dans Klibi" },
      { label: "Dış çekim DRONE (hediye)", gift: true },
    ],
    removables: [
      { id: "p-buyuk-album", label: "Büyük Albüm (30×60)", value: PRICING.ADDON_BUYUK_ALBUM },
      { id: "p-aile-album", label: "Aile Albümü", value: PRICING.ADDON_AILE_ALBUM, count: 2 },
    ],
    // P3'te bu klipler dahil (kilitli), drone hediye kilitli
    includedAddons: ["klip-gelin-alma", "klip-salon-giris"],
  },
];

export function getPackage(id: PackageId): PackageDef {
  const p = PACKAGES.find((x) => x.id === id);
  if (!p) throw new Error(`Bilinmeyen paket: ${id}`);
  return p;
}

export type PlatoOption = {
  id: PlatoId;
  name: string;
  icon: string;
  /** Kampanyayla ücretsiz platolar */
  free: boolean;
  note?: string;
  /** thumbnail path (yoksa placeholder) */
  image?: string;
};

export const PLATO_OPTIONS: PlatoOption[] = [
  { id: "baska", name: "Başka Plato", icon: "🏛", free: true },
  { id: "no25", name: "No25 Plato", icon: "🏛", free: true },
  { id: "anka", name: "Anka Plato", icon: "🏛", free: true },
  {
    id: "own",
    name: "Kendim ayarlayacağım",
    icon: "📍",
    free: false,
    note: "Mekân ücreti ve organizasyonu çifte aittir.",
  },
];

export function getPlato(id: PlatoId): PlatoOption {
  const p = PLATO_OPTIONS.find((x) => x.id === id);
  if (!p) throw new Error(`Bilinmeyen plato: ${id}`);
  return p;
}

export type AddonDef = {
  id: AddonId;
  name: string;
  description: string;
  icon: string;
  price: number;
  /** Kampanya list fiyatı (üstü çizili gösterilir) */
  originalPrice?: number;
  badge?: "KAMPANYA" | "YENİ";
  /** Adet sayacı (− / +) */
  quantity?: { max: number; step: number };
  /** P2/P3'te bu addon zaten dahil → "Dahil ✓" kilitli */
  includedInPackages?: PackageId[];
};

export const ADDONS: AddonDef[] = [
  {
    id: "klip-gelin-alma",
    name: "Gelin Alma Klip Çekimi",
    description: "Gelin alma anlarının sinematik klibi.",
    icon: "🎬",
    price: PRICING.UPSELL_KLIP_CAMPAIGN,
    originalPrice: PRICING.UPSELL_KLIP_FULL,
    badge: "KAMPANYA",
    includedInPackages: [3],
  },
  {
    id: "klip-salon-giris",
    name: "Salon Girişi & İlk Dans Klibi",
    description: "Salon girişi ve ilk dansın sinematik klibi.",
    icon: "🎬",
    price: PRICING.UPSELL_KLIP_CAMPAIGN,
    originalPrice: PRICING.UPSELL_KLIP_FULL,
    badge: "KAMPANYA",
    includedInPackages: [3],
  },
  {
    id: "salon-full",
    name: "Salon Full Sinematik — girişten after party'ye",
    description:
      "Salon girişi, ilk dans, kesim, oyunlar ve after party dahil tüm gecenin sinematik klibi.",
    icon: "🎥",
    price: PRICING.ADDON_SALON_FULL,
    originalPrice: PRICING.SALON_FULL_LIST, // indirim: ₺7.200 → ₺6.000 (−%20)
    badge: "KAMPANYA",
  },
  {
    id: "drone",
    name: "Drone Çekimi",
    description: "Etkinlik başına havadan sinematik drone çekimi.",
    icon: "🚁",
    price: PRICING.ADDON_DRONE,
  },
  {
    id: "omuz",
    name: "Omuz Kamera",
    description: "Düğün günü ham + kurgulu omuz kamera çekimi.",
    icon: "🎥",
    price: PRICING.ADDON_OMUZ,
  },
  {
    id: "foto-ekevent",
    name: "Ek Etkinlik Fotoğraf Çekimi",
    description: "Kına / nişan / nikah gibi ek etkinlik fotoğraf çekimi.",
    icon: "📸",
    price: PRICING.ADDON_FOTO_EKEVENT,
  },
  {
    id: "buyuk-album",
    name: "Büyük Albüm",
    description: "30×60 lüks A kalite büyük albüm — 40+ çeşit tasarım seçeneği.",
    icon: "📕",
    price: PRICING.ADDON_BUYUK_ALBUM,
    originalPrice: PRICING.LIST_BUYUK_ALBUM, // ~4.500 → 2.500
    badge: "KAMPANYA",
    includedInPackages: [2, 3],
  },
  {
    id: "aile-album",
    name: "Ek Aile Albümü",
    description: "İlave aile albümü (adet başına) — 40+ çeşit tasarım seçeneği.",
    icon: "📕",
    price: PRICING.ADDON_AILE_ALBUM,
    originalPrice: PRICING.LIST_AILE_ALBUM, // ~1.500 → 1.000
    badge: "KAMPANYA",
    quantity: { max: 6, step: 1 },
  },
  {
    id: "canvas-5070",
    name: "Canvas Tablo 50×70",
    description: "50×70 cm canvas tablo.",
    icon: "🖼",
    price: PRICING.ADDON_CANVAS_5070,
  },
  {
    id: "canvas-70100",
    name: "Canvas Tablo 70×100",
    description: "70×100 cm canvas tablo.",
    icon: "🖼",
    price: PRICING.ADDON_CANVAS_70100,
  },
];

export function getAddon(id: AddonId): AddonDef {
  const a = ADDONS.find((x) => x.id === id);
  if (!a) throw new Error(`Bilinmeyen ek hizmet: ${id}`);
  return a;
}

export type ResolvedAddonPricing = {
  price: number;
  originalPrice?: number;
  isUpgrade: boolean;
};

/**
 * Addon fiyatını çözer. Salon Full HER pakette aynı: ~8.500 → 6.000 (kazanç 2.500).
 * (P3'e özel "yükseltme farkı" indirimi kaldırıldı — Mücahit kararı.)
 */
export function resolveAddonPricing(
  addon: AddonDef,
  packageId: PackageId | null
): ResolvedAddonPricing {
  void packageId;
  return {
    price: addon.price,
    originalPrice: addon.originalPrice,
    isUpgrade: false,
  };
}

/** Kampanyalı klip addon'ları (upsell popup ve rozetler için) */
export const CAMPAIGN_KLIP_IDS: AddonId[] = ["klip-gelin-alma", "klip-salon-giris"];

/**
 * Ay bazlı müsaitlik — admin elle günceller.
 * key: "YYYY-MM"; level müsaitlik durumunu, message uyarı metnini taşır.
 */
export type AvailabilityLevel = "busy" | "limited" | "available";
export const AVAILABILITY: Record<
  string,
  { level: AvailabilityLevel; message: string }
> = {
  "2026-06": { level: "busy", message: "Haziran 2026 yoğun sezon — son birkaç hafta sonu kaldı." },
  "2026-07": { level: "busy", message: "Temmuz 2026 yoğun sezon — hızlı davranın." },
  "2026-08": {
    level: "busy",
    message: "Ağustos 2026 yoğun sezon — son birkaç hafta sonu için hızlı olun.",
  },
  "2026-09": { level: "limited", message: "Eylül 2026 için az yer kaldı." },
  "2026-10": { level: "limited", message: "Ekim 2026 için sınırlı sayıda tarih var." },
};

export function getAvailability(iso: string) {
  const m = /^(\d{4})-(\d{2})-\d{2}$/.exec(iso);
  if (!m) return null;
  return AVAILABILITY[`${m[1]}-${m[2]}`] ?? null;
}

/** Aciliyet bandı için kampanya son tarihi (her ay elle güncellenir) */
export const CAMPAIGN = {
  deadlineLabel: "31 Ağustos",
  /** Paket 2 sosyal kanıt satırı — Mücahit gerçek orana göre günceller */
  featuredSocialProof: "Çiftlerin %68'i bu paketi seçiyor",
  /** Adım 3 güven bloğu — gerçek sayıyla güncelleyin */
  monthlyBookingProof: "Bu ay 12 çift tarihini kilitledi",
  dugunRating: "5,0",
} as const;

export const PIXEL_ID = "760508339990531";
