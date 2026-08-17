/**
 * Meta Pixel (fbevents.js) iOS Safari / in-app WebView'de
 * `window.webkit.messageHandlers` okuyunca TypeError atar.
 * Android in-app'te yönlendirme sonrası "Java object is gone" postMessage hatası oluşur.
 * Eksik native bridge'i no-op ile doldur; fbq çökmesin.
 */
export function ensureMetaNativeBridge(): void {
  if (typeof window === "undefined") return;
  try {
    const w = window as Window & {
      webkit?: { messageHandlers?: Record<string, unknown> };
    };
    if (!w.webkit) {
      w.webkit = { messageHandlers: {} };
    } else if (!w.webkit.messageHandlers) {
      w.webkit.messageHandlers = {};
    }
  } catch {
    /* ignore */
  }
}

/** In-app / Pixel native köprü gürültüsü — bizim kodumuz değil. */
export function isMetaNativeBridgeNoise(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("webkit.messagehandlers") ||
    m.includes("java object is gone") ||
    m.includes("error invoking postmessage")
  );
}

/**
 * Tarayıcı / in-app WebView / eklenti gürültüsü.
 * Admin "Teknik Hatalar" sekmesine yazılmaz.
 */
export function isIgnorableClientError(message: string): boolean {
  if (isMetaNativeBridgeNoise(message)) return true;
  const m = message.toLowerCase().trim();
  if (m === "script error" || m === "script error." || m === "javascript error: script error.") {
    return true;
  }
  if (m.includes("resizeobserver loop")) return true;
  if (m.includes("non-error promise rejection")) return true;
  if (m.includes("chrome-extension://") || m.includes("moz-extension://")) {
    return true;
  }
  if (m.includes("safari-extension") || m.includes("safari-web-extension")) {
    return true;
  }
  return false;
}
