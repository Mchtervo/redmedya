import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    cpus: 2,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        // RFC 8288: ajanlara site özetini ve Markdown halini göster
        source: "/",
        headers: [
          {
            key: "Link",
            value:
              '</llms.txt>; rel="describedby"; type="text/plain", </index.md>; rel="alternate"; type="text/markdown"',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // www → çıplak alan adı (aynı içerik iki adreste olmasın)
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.redmediadugun.com" }],
        destination: "https://redmediadugun.com/:path*",
        permanent: true,
      },
      { source: "/cekimler", destination: "/galeri", permanent: true },
      { source: "/hikayeler", destination: "/galeri", permanent: true },
      { source: "/hizmetler", destination: "/paket-olustur", permanent: true },
      { source: "/blog", destination: "/rehber", permanent: true },
      // Eski site yapısından kalan alt sayfalar 404 vermesin
      { source: "/blog/:path+", destination: "/rehber", permanent: true },
      { source: "/cekimler/:path+", destination: "/galeri", permanent: true },
      { source: "/hikayeler/:path+", destination: "/galeri", permanent: true },
      { source: "/hizmetler/:path+", destination: "/paket-olustur", permanent: true },
      { source: "/admin/services", destination: "/admin", permanent: false },
      { source: "/admin/coupons", destination: "/admin", permanent: false },
      { source: "/admin/stories", destination: "/admin", permanent: false },
      { source: "/admin/testimonials", destination: "/admin", permanent: false },
      { source: "/admin/blog", destination: "/admin", permanent: false },
      { source: "/admin/settings", destination: "/admin", permanent: false },
    ];
  },
};

export default nextConfig;
