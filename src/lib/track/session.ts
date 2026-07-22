/**
 * §11 — Ziyaretçi oturumu (anonim). Kişisel veri İÇERMEZ.
 * session_id: 1st-party cookie + localStorage (uuid). UTM ilk dokunuşta saklanır.
 */

const SID_KEY = "rm_sid";
const UTM_KEY = "rm_utm";
const CONSENT_KEY = "rm_consent";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

function setCookie(name: string, value: string, days = 180) {
  if (typeof document === "undefined") return;
  const exp = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp}; path=/; SameSite=Lax`;
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `sid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Kalıcı anonim session_id (cookie + localStorage senkron) */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = getCookie(SID_KEY) || localStorage.getItem(SID_KEY) || "";
  if (!id) id = uuid();
  setCookie(SID_KEY, id);
  try {
    localStorage.setItem(SID_KEY, id);
  } catch {
    /* ignore */
  }
  return id;
}

export type Utm = { utm_source?: string; utm_campaign?: string };

/** İlk dokunuş UTM'i — reklamdan gelen linkten yakalanır, oturum boyunca saklanır */
export function getUtm(): Utm {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(UTM_KEY);
    if (stored) return JSON.parse(stored) as Utm;
  } catch {
    /* ignore */
  }
  const p = new URLSearchParams(window.location.search);
  const utm: Utm = {
    utm_source: p.get("utm_source") ?? undefined,
    utm_campaign: p.get("utm_campaign") ?? undefined,
  };
  if (utm.utm_source || utm.utm_campaign) {
    try {
      localStorage.setItem(UTM_KEY, JSON.stringify(utm));
    } catch {
      /* ignore */
    }
  }
  return utm;
}

export function getDevice(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export function getReferrer(): string {
  if (typeof document === "undefined") return "";
  try {
    const ref = document.referrer;
    if (!ref) return "direct";
    return new URL(ref).hostname || "direct";
  } catch {
    return "direct";
  }
}

/* ————————————————————————— KVKK onayı (§13) ————————————————————————— */

export type Consent = "granted" | "denied" | null;

/** Onay durumu: null = henüz karar yok → tracking KAPALI */
export function getConsent(): Consent {
  if (typeof window === "undefined") return null;
  const v = getCookie(CONSENT_KEY) || localStorage.getItem(CONSENT_KEY);
  return v === "granted" || v === "denied" ? v : null;
}

export function setConsent(v: "granted" | "denied") {
  setCookie(CONSENT_KEY, v, 365);
  try {
    localStorage.setItem(CONSENT_KEY, v);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("rm-consent-change", { detail: v }));
  }
}

export function hasAnalyticsConsent(): boolean {
  return getConsent() === "granted";
}
