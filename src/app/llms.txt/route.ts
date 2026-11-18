import { buildSiteMarkdown } from "@/lib/site-markdown";

/**
 * /llms.txt — ChatGPT, Claude, Perplexity gibi yapay zekâ asistanlarının
 * siteyi hızlı ve doğru özetlemesi için özet (llmstxt.org biçimi).
 */
export const dynamic = "force-static";

export function GET() {
  return new Response(buildSiteMarkdown(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
