import { LIMITS, rateLimitAllow, type RateBucket } from "@/lib/analytics/collect-core";

const bySession = new Map<string, RateBucket>();
const byIp = new Map<string, RateBucket>();

function getBucket(map: Map<string, RateBucket>, key: string): RateBucket {
  let b = map.get(key);
  if (!b) {
    b = { timestamps: [] };
    map.set(key, b);
  }
  return b;
}

/** true = istek kabul. */
export function allowAnalyticsCollect(
  sessionId: string,
  ip: string,
  eventCount: number
): boolean {
  const now = Date.now();
  const sessionOk = rateLimitAllow(
    getBucket(bySession, sessionId),
    now,
    LIMITS.rateWindowMs,
    LIMITS.rateMaxEvents,
    eventCount
  );
  if (!sessionOk) return false;
  const ipOk = rateLimitAllow(
    getBucket(byIp, ip || "unknown"),
    now,
    LIMITS.rateWindowMs,
    LIMITS.rateIpMaxEvents,
    eventCount
  );
  return ipOk;
}

/** Test için. */
export function resetAnalyticsRateLimitForTests(): void {
  bySession.clear();
  byIp.clear();
}
