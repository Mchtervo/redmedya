import type { LeadRecord } from "@/types/site-settings";

const DEDUPE_MS = 10 * 60 * 1000;

function digits(phone: string | undefined): string {
  return (phone ?? "").replace(/\D/g, "");
}

/** fetch+beacon çift gönderiminde aynı lead'i iki kez yazma. */
export function findDuplicateLead(
  leads: LeadRecord[],
  opts: {
    clientRequestId?: string | null;
    sessionId?: string | null;
    phone?: string | null;
    nowMs?: number;
  }
): LeadRecord | undefined {
  const reqId = opts.clientRequestId?.trim();
  if (reqId) {
    const byId = leads.find((l) => l.client_request_id === reqId);
    if (byId) return byId;
  }

  const phone = digits(opts.phone ?? undefined);
  const sessionId = opts.sessionId?.trim();
  if (!phone || phone.length < 10) return undefined;
  const now = opts.nowMs ?? Date.now();

  return leads.find((l) => {
    const t = new Date(l.createdAt).getTime();
    if (!Number.isFinite(t) || now - t > DEDUPE_MS) return false;
    if (digits(l.customer?.phone) !== phone) return false;
    if (sessionId && l.sessionId && l.sessionId === sessionId) return true;
    if (!sessionId) return true;
    return false;
  });
}
