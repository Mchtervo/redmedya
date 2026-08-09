/**
 * Meta Pixel + CAPI güvenlik / dedupe yardımcıları.
 * Production dışı ortamda Meta'ya ASLA event gitmez; konsola [META DEBUG] yazılır.
 */

/** Funnel reklam domaini (zorunlu). redmedya.co aynı sitenin prod alias'ı. */
export const META_PRODUCTION_HOSTS = new Set([
  "redmediadugun.com",
  "www.redmediadugun.com",
  "redmedya.co",
  "www.redmedya.co",
]);

export type MetaFunnelEvent =
  | "PageView"
  | "ViewContent"
  | "PackageBuild"
  | "AddToCart"
  | "InitiateCheckout"
  | "Schedule"
  | "Lead"
  | "WhatsAppClick"
  | string;

function hostnameFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isLocalOrDevHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h.endsWith(".local") ||
    h.includes("vercel.app") ||
    h.includes("netlify.app") ||
    h.includes("onrender.com")
  );
}

/** Tarayıcı: yalnızca production düğün domainlerinde canlı gönderim. */
export function isMetaTrackingLiveBrowser(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NODE_ENV !== "production") return false;
  const host = window.location.hostname.toLowerCase();
  if (isLocalOrDevHost(host)) return false;
  return META_PRODUCTION_HOSTS.has(host);
}

/**
 * Sunucu: NODE_ENV/VERCEL_ENV + Host / event_source_url kontrolü.
 * Preview/test deployment'larda kapalı.
 */
export function isMetaTrackingLiveServer(opts?: {
  hostHeader?: string | null;
  eventSourceUrl?: string | null;
}): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  if (vercelEnv && vercelEnv !== "production") return false;

  const host = (opts?.hostHeader ?? "")
    .split(":")[0]
    ?.trim()
    .toLowerCase();
  const fromUrl = hostnameFromUrl(opts?.eventSourceUrl ?? undefined);

  const candidates = [host, fromUrl].filter(Boolean) as string[];
  if (candidates.length === 0) return false;
  if (candidates.some(isLocalOrDevHost)) return false;
  return candidates.some((h) => META_PRODUCTION_HOSTS.has(h));
}

/** Gerçek sayfa URL'si (path + query). Hard-code root YOK. */
export function getBrowserEventSourceUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

export function logMetaDebug(payload: {
  event: string;
  event_id: string;
  url?: string;
  source: "browser" | "capi" | "server";
  params?: Record<string, unknown>;
  reason?: string;
}): void {
  // eslint-disable-next-line no-console
  console.info("[META DEBUG]", {
    event: payload.event,
    event_id: payload.event_id,
    url: payload.url,
    source: payload.source,
    ...(payload.reason ? { reason: payload.reason } : {}),
    ...(payload.params ? { params: payload.params } : {}),
  });
}

const ONCE_PREFIX = "rm_meta_once_";

/** Oturum başına bir kez (sessionStorage). */
export function hasFiredOnce(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(ONCE_PREFIX + key) === "1";
  } catch {
    return false;
  }
}

export function markFiredOnce(key: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ONCE_PREFIX + key, "1");
  } catch {
    /* ignore */
  }
}

/** Aksiyon + session'a bağlı stabil event_id (browser/CAPI aynı). Once-only funnel. */
export function stableFunnelEventId(
  kind: "package_build" | "add_to_cart" | "checkout" | "view_content",
  sessionId: string,
  extra?: string
): string {
  const sid = (sessionId || "anon").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  const suffix = extra ? `_${extra.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40)}` : "";
  return `${kind}_${sid}${suffix}`;
}

const PV_SEQ_KEY = "rm_meta_pv_seq";

/**
 * Her GERÇEK PageView için benzersiz event_id.
 * Aynı görüntülemenin browser + CAPI'si bu fonksiyonun tek çağrısından gelen id'yi paylaşır.
 * Format: page_view_<sid>_<seq> (örn. page_view_abc_001)
 */
export function uniquePageViewEventId(sessionId: string): string {
  const sid = (sessionId || "anon").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  let seq = 1;
  if (typeof window !== "undefined") {
    try {
      const prev = Number(sessionStorage.getItem(PV_SEQ_KEY) || "0");
      seq = Number.isFinite(prev) && prev >= 0 ? prev + 1 : 1;
      sessionStorage.setItem(PV_SEQ_KEY, String(seq));
    } catch {
      seq = Date.now() % 1_000_000;
    }
  } else {
    seq = Date.now() % 1_000_000;
  }
  return `page_view_${sid}_${String(seq).padStart(3, "0")}`;
}

export function reservationScheduleEventId(reservationOrLeadId: string): string {
  const id = reservationOrLeadId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  return `reservation_${id}`;
}
