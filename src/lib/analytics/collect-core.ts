/**
 * Analytics collect — saf doğrulama / sanitize / attribution / rate-limit.
 * Dosya I/O yok; test edilebilir.
 */

import {
  FUNNEL_INTERNAL_EVENTS,
  FUNNEL_META_EVENTS,
  type AnalyticsUtm,
} from "@/lib/analytics/types";

export const ALLOWED_ANALYTICS_EVENTS = new Set<string>([
  ...FUNNEL_META_EVENTS,
  ...FUNNEL_INTERNAL_EVENTS.filter((e) => e !== "SessionAbandoned"),
]);

export const LIMITS = {
  sessionIdMax: 80,
  urlMax: 500,
  referrerMax: 200,
  viewportMax: 40,
  browserMax: 40,
  osMax: 40,
  fbpMax: 200,
  fbcMax: 200,
  utmFieldMax: 120,
  errorCodeMax: 80,
  clientEventIdMax: 80,
  metadataKeysMax: 12,
  metadataStringMax: 120,
  metadataJsonMax: 1500,
  eventsPerRequestMax: 40,
  /** Aynı session: 30 sn içinde max event */
  rateWindowMs: 30_000,
  rateMaxEvents: 60,
  /** Aynı IP: 30 sn içinde max event */
  rateIpMaxEvents: 120,
} as const;

export const URGENT_EVENTS = new Set([
  "AddToCart",
  "InitiateCheckout",
  "Schedule",
  "FormSubmitError",
]);

const PII_KEYS = new Set([
  "name",
  "phone",
  "email",
  "firstName",
  "lastName",
  "note",
  "value",
  "textarea",
  "message",
  "password",
  "token",
  "authorization",
  "cookie",
  "cookies",
  "access_token",
  "refresh_token",
]);

const SENSITIVE_PATTERN =
  /(authorization\s*:|bearer\s+[a-z0-9._\-]+|cookie\s*:|(_fbp|_fbc)=|eyJ[a-zA-Z0-9_-]{20,}|[\w.+-]+@[\w.-]+\.\w{2,}|\b(?:90|0)?5\d{9}\b)/gi;

export function isAllowedEventName(name: string): boolean {
  return ALLOWED_ANALYTICS_EVENTS.has(name);
}

export function clampStr(
  v: unknown,
  max: number
): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
}

export function utmHasValue(utm: AnalyticsUtm | null | undefined): boolean {
  if (!utm) return false;
  return Boolean(
    utm.utm_source ||
      utm.utm_medium ||
      utm.utm_campaign ||
      utm.utm_content ||
      utm.utm_term ||
      utm.fbclid
  );
}

export function sanitizeUtm(raw: unknown): AnalyticsUtm {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const pick = (k: string) => clampStr(o[k], LIMITS.utmFieldMax) ?? undefined;
  return {
    utm_source: pick("utm_source"),
    utm_medium: pick("utm_medium"),
    utm_campaign: pick("utm_campaign"),
    utm_content: pick("utm_content"),
    utm_term: pick("utm_term"),
    fbclid: pick("fbclid"),
  };
}

/** First-touch korunur; last-touch yeni UTM varsa güncellenir. */
export function mergeAttribution(opts: {
  prevFirst?: AnalyticsUtm | null;
  prevLast?: AnalyticsUtm | null;
  firstIncoming?: AnalyticsUtm | null;
  lastIncoming?: AnalyticsUtm | null;
}): { first_touch_utm: AnalyticsUtm; last_touch_utm: AnalyticsUtm } {
  const firstIn = opts.firstIncoming ?? {};
  const lastIn = opts.lastIncoming ?? {};
  const hasPrevFirst = utmHasValue(opts.prevFirst);
  const first = hasPrevFirst
    ? (opts.prevFirst as AnalyticsUtm)
    : utmHasValue(firstIn)
      ? firstIn
      : utmHasValue(lastIn)
        ? lastIn
        : (opts.prevFirst ?? {});
  const last = utmHasValue(lastIn)
    ? lastIn
    : (opts.prevLast ?? first);
  return { first_touch_utm: first, last_touch_utm: last };
}

export function scrubSensitiveText(text: string): string {
  return text.replace(SENSITIVE_PATTERN, "[redacted]").slice(0, 240);
}

export function sanitizeTechMessage(message: string): string {
  return scrubSensitiveText(message);
}

/**
 * FormFieldError: yalnızca field_name + error_type.
 * Diğer event'lerde PII anahtarları atılır; stringler kısaltılır.
 */
export function sanitizeEventMetadata(
  eventName: string,
  meta: unknown
): { ok: true; metadata: Record<string, string | number | boolean | null> } | { ok: false; reason: string } {
  if (meta == null) {
    return { ok: true, metadata: {} };
  }
  if (typeof meta !== "object" || Array.isArray(meta)) {
    return { ok: false, reason: "metadata_invalid" };
  }

  const raw = meta as Record<string, unknown>;
  let jsonApprox: string;
  try {
    jsonApprox = JSON.stringify(raw);
  } catch {
    return { ok: false, reason: "metadata_unserializable" };
  }
  if (jsonApprox.length > LIMITS.metadataJsonMax) {
    return { ok: false, reason: "metadata_too_large" };
  }

  if (eventName === "FormFieldError") {
    const field_name = clampStr(raw.field_name, 40);
    const error_type = clampStr(raw.error_type, 40);
    if (!field_name || !error_type) {
      return { ok: false, reason: "form_field_error_incomplete" };
    }
    return { ok: true, metadata: { field_name, error_type } };
  }

  const out: Record<string, string | number | boolean | null> = {};
  let keys = 0;
  for (const [k, v] of Object.entries(raw)) {
    if (PII_KEYS.has(k)) continue;
    if (keys >= LIMITS.metadataKeysMax) break;
    if (typeof v === "string") {
      out[k] = scrubSensitiveText(v).slice(0, LIMITS.metadataStringMax);
      keys += 1;
    } else if (typeof v === "number" && Number.isFinite(v)) {
      out[k] = v;
      keys += 1;
    } else if (typeof v === "boolean") {
      out[k] = v;
      keys += 1;
    } else if (v === null) {
      out[k] = null;
      keys += 1;
    }
  }
  return { ok: true, metadata: out };
}

export type RateBucket = { timestamps: number[] };

/** Sliding window — true = izin ver. */
export function rateLimitAllow(
  bucket: RateBucket,
  now: number,
  windowMs: number,
  maxEvents: number,
  addCount: number
): boolean {
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  if (bucket.timestamps.length + addCount > maxEvents) return false;
  for (let i = 0; i < addCount; i++) bucket.timestamps.push(now);
  return true;
}

export type IncomingCollectEvent = {
  event_name?: string;
  client_event_id?: string;
  event_time?: number;
  page_url?: string;
  metadata?: unknown;
  error_code?: string | null;
  /** Client gönderse bile reddedilir */
  lead_id?: string | null;
};

export type NormalizedCollectEvent = {
  client_event_id: string;
  event_name: string;
  event_time: string;
  page_url: string | null;
  metadata: Record<string, string | number | boolean | null>;
  error_code: string | null;
};

export function normalizeCollectEvents(
  events: IncomingCollectEvent[],
  seenIds: Set<string>
): {
  accepted: NormalizedCollectEvent[];
  rejected: { reason: string; count: number }[];
} {
  const accepted: NormalizedCollectEvent[] = [];
  const rejectCounts = new Map<string, number>();
  const bump = (reason: string) =>
    rejectCounts.set(reason, (rejectCounts.get(reason) ?? 0) + 1);

  for (const e of events.slice(0, LIMITS.eventsPerRequestMax)) {
    const name = typeof e.event_name === "string" ? e.event_name.trim() : "";
    if (!name || !isAllowedEventName(name)) {
      bump("unknown_event");
      continue;
    }
    const clientId = clampStr(e.client_event_id, LIMITS.clientEventIdMax);
    if (!clientId) {
      bump("missing_client_event_id");
      continue;
    }
    if (seenIds.has(clientId)) {
      bump("duplicate_client_event_id");
      continue;
    }

    const metaRes = sanitizeEventMetadata(name, e.metadata);
    if (!metaRes.ok) {
      bump(metaRes.reason);
      continue;
    }

    const page_url = clampStr(e.page_url, LIMITS.urlMax);
    const error_code = clampStr(e.error_code, LIMITS.errorCodeMax);

    const t = e.event_time != null ? new Date(e.event_time).getTime() : Date.now();
    const event_time = Number.isFinite(t)
      ? new Date(t).toISOString()
      : new Date().toISOString();

    seenIds.add(clientId);
    accepted.push({
      client_event_id: clientId,
      event_name: name,
      event_time,
      page_url,
      metadata: metaRes.metadata,
      error_code,
    });
  }

  return {
    accepted,
    rejected: [...rejectCounts.entries()].map(([reason, count]) => ({
      reason,
      count,
    })),
  };
}

/** Unique-session funnel: adım başına en fazla 1 sayım. */
export function sessionHasEvent(
  eventNames: Set<string>,
  names: string[]
): boolean {
  return names.some((n) => eventNames.has(n));
}

export function computeUniqueFunnelCounts(
  sessions: Array<{ events: string[] }>
): {
  viewContent: number;
  packageBuild: number;
  addToCart: number;
  initiateCheckout: number;
  schedule: number;
} {
  let viewContent = 0;
  let packageBuild = 0;
  let addToCart = 0;
  let initiateCheckout = 0;
  let schedule = 0;

  for (const s of sessions) {
    const set = new Set(s.events);
    if (!sessionHasEvent(set, ["ViewContent"])) continue;
    viewContent += 1;
    if (sessionHasEvent(set, ["PackageBuild"])) packageBuild += 1;
    if (sessionHasEvent(set, ["AddToCart"])) addToCart += 1;
    if (sessionHasEvent(set, ["InitiateCheckout"])) initiateCheckout += 1;
    if (sessionHasEvent(set, ["Schedule"])) schedule += 1;
  }

  return {
    viewContent,
    packageBuild,
    addToCart,
    initiateCheckout,
    schedule,
  };
}
