import type { Metadata, Viewport } from "next";
import "./fonts.css";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { ANKARA_SEO_KEYWORDS } from "@/config/seo-keywords";
import { MetaPixel } from "@/components/analytics/meta-pixel";
import { GA4 } from "@/components/analytics/ga4";
import { JsonLd } from "@/components/seo/json-ld";
import { WebMcpTools } from "@/components/seo/webmcp-tools";
import { SiteChrome } from "@/components/analytics/site-chrome";
import { KvkkBanner } from "@/components/consent/kvkk-banner";

// Yazı tipleri: ./fonts.css (siteden sunulur; derlemede Google'a bağlanılmaz)

export const viewport: Viewport = {
  themeColor: "#060606",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "REDMEDYA.CO | Ankara Premium Düğün Fotoğrafçılığı",
    template: "%s | REDMEDYA.CO",
  },
  description:
    "Ankara düğün fotoğrafçısı ve sinematik düğün videosu REDMEDYA — dış çekim, gelin alma klibi, kına, salon, drone. Paketinizi oluşturun, fiyatı anında görün, WhatsApp ile teklif alın.",
  keywords: [...ANKARA_SEO_KEYWORDS],
  alternates: { canonical: siteConfig.url },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: "REDMEDYA.CO | Premium Wedding Cinematography",
    description:
      "Ankara düğün fotoğrafçısı ve video — dış çekim, gelin alma, salon klibi. Canlı paket fiyatı.",
    images: [{ url: "/logo-redmedya.png", width: 1200, height: 630, alt: "RED MEDIA Ankara" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "REDMEDYA.CO",
    description: "Ultra Premium Wedding Cinematography — Ankara",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen overflow-x-clip bg-rm-black pb-16 text-rm-off-white antialiased lg:pb-0">
        <JsonLd />
        <WebMcpTools />
        <MetaPixel />
        <GA4 />
        <SiteChrome />
        {children}
        <KvkkBanner />
      </body>
    </html>
  );
}
