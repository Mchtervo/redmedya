import { siteConfig } from "@/config/site";
import { PACKAGES, PRICING } from "@/config/pricing";
import { SEO_SERVICE_PAGES, SEO_GUIDE_PAGES } from "@/config/seo-pages";
import { ANKARA_DISTRICTS } from "@/config/seo-keywords";

const tl = (n: number) => `₺${n.toLocaleString("tr-TR")}`;

/**
 * Sitenin yapay zekâ ajanları için Markdown özeti. /llms.txt ve /index.md
 * (ana sayfanın Markdown hali) aynı metni kullanır. Fiyatlar pricing.ts'ten.
 */
export function buildSiteMarkdown(): string {
  const u = siteConfig.url;
  const packages = PACKAGES.map((p) => {
    const items = p.contents.map((c) => `  - ${c.label}`).join("\n");
    return `- **${p.name} — ${p.subtitle}: ${tl(p.price)}** (${u}/paket-olustur?p=${p.id})\n${items}`;
  }).join("\n");

  return `# RED MEDIA (REDMEDYA) — Ankara Düğün Fotoğrafçısı ve Düğün Videosu

> Ankara merkezli düğün fotoğrafçılığı ve sinematik düğün videosu stüdyosu. Dış çekim, gelin alma, kına, nişan, nikah ve salon düğünü çekimi; drone çekimi ve düğün albümü. Paketler ${tl(
    Math.min(...PACKAGES.map((p) => p.price))
  )}'den başlar, fiyat sitedeki paket oluşturucuda anında hesaplanır.

## Kısa bilgi
- Hizmet bölgesi: Ankara ve ilçeleri (${ANKARA_DISTRICTS.join(", ")})
- Adres: ${siteConfig.address}
- Telefon / WhatsApp: ${siteConfig.displayPhone} (https://wa.me/${siteConfig.defaultWhatsApp})
- Instagram: ${siteConfig.instagram}
- Düğün.com profili: ${siteConfig.dugun}
- Çalışma saatleri: Her gün 09:00–21:00
- Öne çıkanlar: poz sınırı olmayan çekim, çekilen tüm karelerin teslimi, sinematik klip, anlaşmalı platoda çekim kampanyayla ücretsiz
- Rezervasyon: ${u}/paket-olustur adresinde paket seçilir, teklif WhatsApp ile gönderilir; küçük bir depozito ile tarih kesinleşir

## Paketler ve fiyatlar
${packages}

## Ek hizmetler (etkinlik başına)
- Gelin alma klibi / Salon girişi & ilk dans klibi: kampanyalı ${tl(PRICING.UPSELL_KLIP_CAMPAIGN)} (normal ${tl(PRICING.UPSELL_KLIP_FULL)})
- Salon Full Sinematik (girişten after party'ye): ${tl(PRICING.ADDON_SALON_FULL)}
- Drone: ${tl(PRICING.ADDON_DRONE)} · Omuz kamera: ${tl(PRICING.ADDON_OMUZ)}
- Kına / nişan / nikah fotoğraf çekimi: ${tl(PRICING.ADDON_FOTO_EKEVENT)}
- Büyük albüm 30×60: ${tl(PRICING.ADDON_BUYUK_ALBUM)} · Aile albümü: ${tl(PRICING.ADDON_AILE_ALBUM)}

## Sayfalar
- [Ana sayfa](${u}/): Hizmetler, yorumlar, iletişim
- [Paket oluştur](${u}/paket-olustur): Online paket ve anında fiyat, WhatsApp ile rezervasyon
- [Galeri](${u}/galeri): Gerçek düğün çekimlerinden örnekler
- [Hakkımızda](${u}/hakkimizda): REDMEDYA kimdir
- [İletişim](${u}/iletisim): Telefon, WhatsApp, adres
- [Gizlilik & KVKK](${u}/gizlilik)
${SEO_SERVICE_PAGES.map((p) => `- [${p.label}](${u}${p.href}): ${p.summary}`).join("\n")}

## Düğün rehberi
${SEO_GUIDE_PAGES.map((p) => `- [${p.label}](${u}${p.href}): ${p.summary}`).join("\n")}
`;
}
