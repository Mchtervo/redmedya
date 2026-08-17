"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getConsent, setConsent } from "@/lib/track/session";
import { track } from "@/lib/track/tracker";

/**
 * §13 — KVKK / çerez aydınlatma banner'ı.
 * Onay pazarlama çerezleri (Meta/GA) içindir. First-party sayfa yolculuğu
 * kişisel veri içermez ve onay beklemez.
 * ⚠️ Aydınlatma metni TASLAKTIR — yayına almadan avukat onayı alın.
 */
export function KvkkBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Karar verilmemişse göster. setState effect gövdesinde değil rAF callback'inde.
    const raf = requestAnimationFrame(() => setVisible(getConsent() === null));
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!visible) return null;

  const accept = () => {
    setConsent("granted");
    setVisible(false);
    // Onay sonrası bu görüntüleme yakalansın
    track("page_view", { path: window.location.pathname, consent: "granted" });
  };

  const reject = () => {
    setConsent("denied");
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Çerez aydınlatması"
      className="fixed inset-x-0 bottom-0 z-[120] border-t border-rm-champagne/25 bg-rm-black/95 backdrop-blur-lg"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="section-container flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-xs leading-relaxed text-rm-gray-300 sm:text-sm">
          Deneyiminizi iyileştirmek ve site kullanımını anonim olarak analiz etmek için
          çerez kullanıyoruz. Kişisel verileriniz yalnızca teklif oluşturduğunuzda ve sizin
          onayınızla işlenir.{" "}
          <Link href="/gizlilik" className="text-rm-champagne underline underline-offset-2">
            Aydınlatma metni
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={reject}
            className="rounded-md border border-white/15 px-4 py-2 text-xs font-medium text-rm-gray-300 transition-colors hover:bg-white/5 hover:text-rm-off-white"
          >
            Reddet
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-md bg-rm-champagne px-4 py-2 text-xs font-semibold text-rm-black transition-colors hover:bg-rm-champagne-light"
          >
            Kabul et
          </button>
        </div>
      </div>
    </div>
  );
}
