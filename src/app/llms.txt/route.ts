import { siteConfig } from "@/config/site";
import { PACKAGES } from "@/config/pricing";
import { ANKARA_DISTRICTS } from "@/config/seo-keywords";

/**
 * /llms.txt — ChatGPT, Claude, Perplexity gibi yapay zekâ asistanlarının
 * siteyi hızlı ve doğru özetlemesi için düz metin özet (llmstxt.org biçimi).
 * Fiyatlar tek kaynaktan (pricing.ts) gelir; elle fiyat yazma.
 */
export const dynamic = "force-static";

const tl = (n: number) => `₺${n.toLocaleString("tr-TR")}`;

export function GET() {
  const u = siteConfig.url;
  const packages = PACKAGES.map((p) => {
    const items = p.contents.map((c) => `  - ${c.label}`).join("\n");
    return `- **${p.name} — ${p.subtitle}: ${tl(p.price)}** (${u}/paket-olustur?p=${p.id})\n${items}`;
  }).join("\n");

  const body = `# RED MEDIA (REDMEDYA) — Ankara Düğün Fotoğrafçısı ve Düğün Videosu

> Ankara merkezli düğün fotoğrafçılığı ve sinematik düğün videosu stüdyosu. Dış çekim, gelin alma, kına, nişan, nikah ve salon düğünü çekimi; drone çekimi ve düğün albümü. Paketler ${tl(
    Math.min(...PACKAGES.map((p) => p.price))
  )}'den başlar, fiyat sitedeki paket oluşturucuda anında hesaplanır.

## Kısa bilgi
- Hizmet bölgesi: Ankara ve ilçeleri (${ANKARA_DISTRICTS.join(", ")})
- Adres: ${siteConfig.address}
- Telefon / WhatsApp: ${siteConfig.displayPhone}
- Instagram: ${siteConfig.instagram}
- Düğün.com profili: ${siteConfig.dugun}
- Çalışma saatleri: Her gün 09:00–21:00
- Öne çıkanlar: poz sınırı olmayan çekim, çekilen tüm karelerin teslimi, sinematik klip, anlaşmalı platoda çekim kampanyayla ücretsiz

## Paketler ve fiyatlar
${packages}

## Sayfalar
- [Ana sayfa](${u}/): Hizmetler, yorumlar, iletişim
- [Paket oluştur](${u}/paket-olustur): Online paket ve anında fiyat, WhatsApp ile rezervasyon
- [Galeri](${u}/galeri): Gerçek düğün çekimlerinden örnekler
- [Ankara düğün fotoğrafçısı](${u}/ankara-dugun-fotografcisi)
- [Ankara düğün videosu](${u}/ankara-dugun-videosu)
- [Ankara gelin alma klibi](${u}/ankara-gelin-alma-klibi)
- [Ankara salon düğün çekimi](${u}/ankara-salon-dugun-cekimi)
- [Ankara kına çekimi](${u}/ankara-kina-cekimi)
- [Ankara dış çekim mekanları](${u}/ankara-dis-cekim-mekanlari)
- [Dış çekim fiyatları](${u}/dis-cekim-fiyatlari)
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
