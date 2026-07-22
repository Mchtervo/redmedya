import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/paket-olustur",
    "/galeri",
    "/ankara-dugun-fotografcisi",
    "/dis-cekim-fiyatlari",
    "/ankara-dis-cekim-mekanlari",
    "/ankara-gelin-alma-klibi",
    "/ankara-dugun-videosu",
    "/ankara-kina-cekimi",
    "/ankara-salon-dugun-cekimi",
  ];

  return routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.9,
  }));
}
