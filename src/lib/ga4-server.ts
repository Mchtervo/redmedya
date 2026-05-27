const DEFAULT_GA4_ID = "G-YXDNEBTFMN";

function measurementId(): string {
  return process.env.NEXT_PUBLIC_GA4_ID?.trim() || DEFAULT_GA4_ID;
}

function apiSecret(): string | undefined {
  return process.env.GA4_API_SECRET?.trim();
}

export async function sendGa4ServerEvent(
  eventName: string,
  params: {
    clientId: string;
    value?: number;
    currency?: string;
    transactionId?: string;
    items?: Array<{ item_id?: string; item_name?: string; price?: number; quantity?: number }>;
    engagementTimeMsec?: number;
  }
): Promise<{ ok: boolean; skipped?: boolean }> {
  const secret = apiSecret();
  const mid = measurementId();
  if (!secret) return { ok: false, skipped: true };

  const body = {
    client_id: params.clientId,
    events: [
      {
        name: eventName,
        params: {
          currency: params.currency ?? "TRY",
          value: params.value,
          transaction_id: params.transactionId,
          items: params.items,
          engagement_time_msec: params.engagementTimeMsec ?? 100,
        },
      },
    ],
  };

  try {
    const res = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(mid)}&api_secret=${encodeURIComponent(secret)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

export function ga4ClientIdFromLead(leadId: string, sessionId?: string): string {
  const raw = sessionId || leadId;
  return raw.replace(/[^a-zA-Z0-9.-]/g, "").slice(0, 64) || leadId;
}
