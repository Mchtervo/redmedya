import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

const PRIVATE_PATHS = ["/admin/", "/api/", "/vip/", "/rezervasyon/"];

/**
 * Yapay zekâ arama botları (ChatGPT, Claude, Perplexity, Gemini, Apple...)
 * açıkça izinli: "Ankara düğün fotoğrafçısı" sorularında önerilebilmek için
 * sitenin okunabilmesi gerekir. Özel alanlar herkese kapalı.
 */
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "Bingbot",
  "CCBot",
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_BOTS, allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
