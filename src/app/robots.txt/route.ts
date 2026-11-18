import { siteConfig } from "@/config/site";

/**
 * robots.txt — route handler (Next'in robots.ts'i Content-Signal satırını
 * desteklemediği için).
 *
 * Content-Signal: içeriğin nasıl kullanılabileceği.
 *  - search=yes   → arama motorları indeksleyebilir
 *  - ai-input=yes → yapay zekâ cevaplarında kaynak olarak kullanılabilir
 *  - ai-train=yes → yapay zekâ modelleri öğrenebilir (ChatGPT vb. işletmeyi tanısın)
 * Yapay zekâ botları açıkça izinli; özel alanlar herkese kapalı.
 */
export const dynamic = "force-static";

const PRIVATE = ["/admin/", "/api/", "/vip/", "/rezervasyon/"];

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

export function GET() {
  const rules = (ua: string) =>
    [`User-agent: ${ua}`, "Allow: /", ...PRIVATE.map((p) => `Disallow: ${p}`)].join("\n");

  const body = [
    "# REDMEDYA — Ankara düğün fotoğrafçısı ve düğün videosu",
    `# Site özeti (yapay zekâ ajanları için): ${siteConfig.url}/llms.txt`,
    "",
    "Content-Signal: search=yes, ai-input=yes, ai-train=yes",
    "",
    rules("*"),
    "",
    ...AI_BOTS.map((b) => rules(b) + "\n"),
    `Sitemap: ${siteConfig.url}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
