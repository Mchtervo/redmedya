import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { ANKARA_SEO_KEYWORDS } from "@/config/seo-keywords";
import { MetaPixel } from "@/components/analytics/meta-pixel";
import { GA4 } from "@/components/analytics/ga4";
import { JsonLd } from "@/components/seo/json-ld";
import { SiteChrome } from "@/components/analytics/site-chrome";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

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
      { url: "/favicon.png", type: "image/png" },
      { url: "/logo-redmedya.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/logo-redmedya.png", type: "image/png" }],
    shortcut: "/favicon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${cormorant.variable} ${instrument.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-rm-black pb-[5.75rem] text-rm-off-white antialiased lg:pb-0">
        <JsonLd />
        <MetaPixel />
        <GA4 />
        <SiteChrome />
        {children}
      </body>
    </html>
  );
}
