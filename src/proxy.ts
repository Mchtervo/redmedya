import { NextResponse, type NextRequest } from "next/server";

/**
 * Yapay zekâ ajanı ana sayfayı "Accept: text/markdown" ile isterse HTML yerine
 * Markdown özetini (/index.md) döndür. Tarayıcılar text/markdown istemez, bu
 * yüzden ziyaretçiler etkilenmez.
 *
 * GÜVENLİK: Markdown yanıtı "no-store" — önbellek (Hostinger CDN) asla
 * Markdown'u saklayıp insanlara sunamaz.
 */
export function proxy(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  if (/\btext\/markdown\b/i.test(accept)) {
    const res = NextResponse.rewrite(new URL("/index.md", request.url));
    res.headers.set("Vary", "Accept");
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
