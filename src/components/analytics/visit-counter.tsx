"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureUtmOnLanding } from "@/lib/track/session";

/**
 * Anonim sayfa açılış sayacı — ÇEREZ ONAYINDAN BAĞIMSIZ çalışır.
 *
 * Hiçbir kimlik taşımaz: session_id yok, çerez okumaz/yazmaz, localStorage'a
 * dokunmaz. Sunucuya sadece "bir açılış oldu + yol + varsa utm" gider ve orada
 * günlük TOPLAM sayaca eklenir. Kişi bazlı kayıt oluşmaz.
 *
 * Rızaya bağlı olan journey takibi ayrıdır: lib/track/tracker.ts → /api/track
 */
function VisitCounterInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  /** Aynı yol için çift sayım olmasın (StrictMode / yeniden render) */
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (lastSent.current === pathname) return;
    lastSent.current = pathname;

    // İlk dokunuş UTM + fbclid sakla (paket funnel boyunca kaybolmasın)
    captureUtmOnLanding();

    const body = JSON.stringify({
      path: pathname,
      utm_source: searchParams.get("utm_source") ?? undefined,
      utm_campaign: searchParams.get("utm_campaign") ?? undefined,
    });

    fetch("/api/hit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body,
    }).catch(() => {
      /* sayaç sessiz düşer, kullanıcıyı etkilemez */
    });
  }, [pathname, searchParams]);

  return null;
}

export function VisitCounter() {
  return (
    <Suspense fallback={null}>
      <VisitCounterInner />
    </Suspense>
  );
}
