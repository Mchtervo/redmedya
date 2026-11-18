import { buildSiteMarkdown } from "@/lib/site-markdown";

/**
 * Ana sayfanın Markdown hali. Ajanlar "Accept: text/markdown" ile "/" isterse
 * src/proxy.ts buraya yönlendirir; doğrudan /index.md olarak da açılır.
 */
export const dynamic = "force-static";

export function GET() {
  return new Response(buildSiteMarkdown(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
