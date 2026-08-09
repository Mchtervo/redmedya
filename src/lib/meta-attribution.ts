import { getUtm } from "@/lib/track/session";

/** Tarayıcıdan Meta eşleştirme çerezleri (lead kaydında saklanır) */
export type MetaAttribution = {
  fbp?: string;
  fbc?: string;
  /** İstemci olay deduplication — CAPI ile aynı event_id */
  eventId?: string;
};

export function readMetaAttributionFromDocument(): MetaAttribution {
  if (typeof document === "undefined") return {};
  const getCookie = (name: string) => {
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : undefined;
  };
  const params = new URLSearchParams(window.location.search);
  const storedFbclid = getUtm().fbclid;
  const fbclid = params.get("fbclid") || storedFbclid;
  const fbc =
    getCookie("_fbc") ||
    (fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined);
  return {
    fbp: getCookie("_fbp"),
    fbc,
  };
}

export function newMetaEventId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
