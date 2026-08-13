/**
 * CAPI backfill — son 7 gün lead'leri.
 * Event adları / event_id / pencere saf fonksiyonları (test edilebilir).
 */

export const BACKFILL_WINDOW_MS = 7 * 864e5;

export const BACKFILL_EVENT_NAMES = [
  "Lead",
  "Contact",
  "WhatsAppClick",
] as const;

export type BackfillEventName = (typeof BACKFILL_EVENT_NAMES)[number];

export type BackfillSentEntry = {
  event_id: string;
  sent_at: string;
};

export type BackfillSentFile = {
  sent: Record<string, BackfillSentEntry>;
};

export function backfillSentKey(
  leadId: string,
  eventName: BackfillEventName
): string {
  return `${leadId}:${eventName}`;
}

/** Stabil event_id — tekrar çalıştırınca Meta dedupe eder. */
export function backfillEventId(
  leadId: string,
  eventName: BackfillEventName
): string {
  const id = leadId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  return `backfill_${eventName.toLowerCase()}_${id}`;
}

export function isWithinBackfillWindow(
  createdAt: string,
  nowMs = Date.now()
): boolean {
  const t = new Date(createdAt).getTime();
  if (!Number.isFinite(t)) return false;
  if (t > nowMs) return false;
  return nowMs - t <= BACKFILL_WINDOW_MS;
}

export function eventTimeUnix(createdAt: string): number {
  return Math.floor(new Date(createdAt).getTime() / 1000);
}

export function alreadySent(
  file: BackfillSentFile,
  leadId: string,
  eventName: BackfillEventName
): boolean {
  return Boolean(file.sent[backfillSentKey(leadId, eventName)]);
}

export function markSent(
  file: BackfillSentFile,
  leadId: string,
  eventName: BackfillEventName,
  eventId: string,
  sentAt = new Date().toISOString()
): void {
  file.sent[backfillSentKey(leadId, eventName)] = {
    event_id: eventId,
    sent_at: sentAt,
  };
}
