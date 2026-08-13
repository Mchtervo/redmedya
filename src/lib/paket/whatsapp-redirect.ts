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

/**
 * <a href="wa.me">: preventDefault → track (lead POST await edilebilir) → yönlendir.
 * Track 400ms+ sürdüyse (lead bekledi) hemen git; değilse pixel için 350ms.
 */
export function onWhatsAppNavClick(
  event: { preventDefault: () => void },
  url: string,
  track: () => void | Promise<unknown>
): void {
  event.preventDefault();
  void (async () => {
    const started = Date.now();
    try {
      await track();
    } catch {
      /* takip hatası WhatsApp'ı engellemesin */
    }
    const waited = Date.now() - started;
    redirectAfterPixel(url, waited >= 400 ? 0 : PIXEL_REDIRECT_DELAY_MS);
  })();
}
