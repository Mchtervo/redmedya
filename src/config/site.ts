export const siteConfig = {
  name: "REDMEDYA.CO",
  tagline: "Ultra Premium Wedding Cinematography",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://redmedya.co",
  locale: "tr_TR",
  /** 0540 434 06 18 */
  defaultWhatsApp: process.env.NEXT_PUBLIC_WHATSAPP ?? "905404340618",
  defaultPhone: process.env.NEXT_PUBLIC_PHONE ?? "905404340618",
  displayPhone: "0540 434 06 18",
  /** Meta (Facebook) Pixel — public site-wide */
  metaPixelId:
    process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "760508339990531",
  ga4Id: process.env.NEXT_PUBLIC_GA4_ID ?? "G-YXDNEBTFMN",
  instagram: "https://www.instagram.com/redmedia.co/",
  dugun:
    "https://dugun.com/dugun-fotografcilari/ankara/redmedia-co",
  email: "info@redmedya.co",
  address:
    "Menderes Mah. Ayaş Ankara Yolu Cad. Taşkent İş Merkezi, Sincan / Ankara",
} as const;

/** Sadeleştirilmiş menü — tüm içerik ana sayfa + paket oluşturucuda */
export const navLinks = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/galeri", label: "Galeri" },
  { href: "/paket-olustur", label: "Paket Oluştur" },
  { href: "/#yorumlar", label: "Yorumlar" },
  { href: "/#iletisim", label: "İletişim" },
] as const;

export const stats = [
  { value: 1000, suffix: "+", label: "Çift Çekimi" },
  { value: 4, suffix: "K", label: "Cinematic Çekim" },
  { value: 87, suffix: "%", label: "Memnuniyet Oranı" },
  { value: 15, suffix: "+", label: "Profesyonel Ekip" },
] as const;
