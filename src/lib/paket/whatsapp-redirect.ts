/**
 * Pixel/CAPI'nin gönderilmesi için fbq sonrası kısa bekleme, sonra WhatsApp.
 * window.open senkron tıklamada çalışır ama timeout sonrası iOS popup-blocker yer;
 * bu yüzden aynı sekmede location.assign kullanılır.
 */
export const PIXEL_REDIRECT_DELAY_MS = 350;

export function redirectAfterPixel(
  url: string,
  delayMs = PIXEL_REDIRECT_DELAY_MS
): void {
  if (typeof window === "undefined") return;
  const go = () => {
    try {
      window.location.assign(url);
    } catch {
      try {
        window.open(url, "_self");
      } catch {
        /* ignore */
      }
    }
  };
  window.setTimeout(go, delayMs);
}

/** <a href="wa.me"> tıklaması: preventDefault → track → 350ms → yönlendir. */
export function onWhatsAppNavClick(
  event: { preventDefault: () => void },
  url: string,
  track: () => void
): void {
  event.preventDefault();
  try {
    track();
  } catch {
    /* takip hatası WhatsApp'ı engellemesin */
  }
  redirectAfterPixel(url);
}
