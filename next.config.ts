import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hostinger Node.js → normal next start. Docker build → standalone (DOCKER=1).
  ...(process.env.DOCKER === "1" ? { output: "standalone" as const } : {}),
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async redirects() {
    return [
      { source: "/cekimler", destination: "/galeri", permanent: true },
      { source: "/hikayeler", destination: "/galeri", permanent: true },
      { source: "/hizmetler", destination: "/paket-olustur", permanent: true },
      { source: "/blog", destination: "/", permanent: true },
      { source: "/hakkimizda", destination: "/#hakkimizda", permanent: true },
      { source: "/iletisim", destination: "/#iletisim", permanent: true },
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
