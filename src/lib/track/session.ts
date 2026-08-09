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

export type Utm = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
};

function readUtmFromSearch(): Utm {
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source: p.get("utm_source") ?? undefined,
    utm_medium: p.get("utm_medium") ?? undefined,
    utm_campaign: p.get("utm_campaign") ?? undefined,
    utm_content: p.get("utm_content") ?? undefined,
    utm_term: p.get("utm_term") ?? undefined,
    fbclid: p.get("fbclid") ?? undefined,
  };
}

function utmHasValue(utm: Utm): boolean {
  return Boolean(
    utm.utm_source ||
      utm.utm_medium ||
      utm.utm_campaign ||
      utm.utm_content ||
      utm.utm_term ||
      utm.fbclid
  );
}

/**
 * İlk dokunuş UTM + fbclid — reklamdan gelen linkten yakalanır,
 * paket oluşturma boyunca localStorage'da saklanır.
 */
export function getUtm(): Utm {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(UTM_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Utm;
      // URL'de yeni fbclid varsa (aynı oturum yeniden tık) fbc için güncelleme yapılmaz —
      // ilk dokunuş korunur. Eksik alanları ilk kayıtta doldurmak için merge yok.
      if (utmHasValue(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  const utm = readUtmFromSearch();
  if (utmHasValue(utm)) {
    try {
      localStorage.setItem(UTM_KEY, JSON.stringify(utm));
    } catch {
      /* ignore */
    }
  }
  return utm;
}

/** Sayfa açılışında bir kez çağır — UTM kaybını önler */
export function captureUtmOnLanding(): void {
  getUtm();
}

/** Last-touch: mevcut URL'deki UTM (first-touch'ı ezmez). */
export function getLastTouchUtm(): Utm {
  if (typeof window === "undefined") return {};
  return readUtmFromSearch();
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
