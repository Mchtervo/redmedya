import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { SEO_PAGES } from "@/config/seo-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const core = ["", "/paket-olustur", "/galeri", "/rehber", "/hakkimizda", "/iletisim", "/gizlilik"];
  const routes = [...core, ...SEO_PAGES.map((p) => p.href)];

  return routes.map((route) => {
    const guide = route.startsWith("/rehber");
    return {
      url: `${siteConfig.url}${route}`,
      lastModified: new Date(),
      changeFrequency: route === "" ? "weekly" : "monthly",
      priority: route === "" ? 1 : guide ? 0.7 : 0.9,
    };
  });
}
