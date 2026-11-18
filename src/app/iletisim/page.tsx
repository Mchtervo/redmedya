import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

const PATH = "/iletisim";

export const metadata: Metadata = {
  title: "İletişim — REDMEDYA Ankara Düğün Fotoğrafçısı",
  description: `REDMEDYA iletişim: telefon ve WhatsApp ${siteConfig.displayPhone}, adres ${siteConfig.address}. Her gün 09:00–21:00.`,
  alternates: { canonical: `${siteConfig.url}${PATH}` },
};

export default function IletisimPage() {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `REDMEDYA ${siteConfig.address}`
  )}`;
  return (
    <SeoLandingPage
      path={PATH}
      eyebrow="İletişim"
      h1="İletişim — REDMEDYA Ankara"
      intro="Paket, fiyat ve tarih müsaitliği için en hızlı yol WhatsApp. Paket oluşturucuda seçiminizi yaparsanız teklifiniz WhatsApp'a hazır mesaj olarak gelir; ekibimiz en kısa sürede dönüş yapar."
      bullets={[
        `Telefon / WhatsApp: ${siteConfig.displayPhone}`,
        `Adres: ${siteConfig.address}`,
        "Çalışma saatleri: Her gün 09:00–21:00",
        `Instagram: ${siteConfig.instagram.replace("https://www.", "")}`,
      ]}
      ctaLabel="Paket oluştur ve teklif al"
      sections={[
        {
          h2: "Bize ulaşın",
          body: [
            "Düğün tarihinizi, etkinliklerinizi (dış çekim, gelin alma, nikah, salon, kına, nişan) ve varsa özel isteklerinizi yazmanız, size en doğru teklifi hızlıca hazırlamamızı sağlar.",
          ],
          list: [
            `WhatsApp: https://wa.me/${siteConfig.defaultWhatsApp}`,
            `Telefon: +${siteConfig.defaultPhone}`,
            `Instagram: ${siteConfig.instagram}`,
            `Düğün.com: ${siteConfig.dugun}`,
            `Haritada aç: ${mapUrl}`,
          ],
        },
      ]}
    />
  );
}
