/** Lead POST: sayfa kapansa bile istek tamamlansın (mobil Safari). */

export const LEAD_WAIT_MS = 500;

export type DurablePostResult = {
  status: "ok" | "timeout" | "error";
  data?: {
    ok?: boolean;
    id?: string;
    scheduleEventId?: string;
    purchaseEventId?: string;
  };
};

function newRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function sendBeaconJson(url: string, body: string): boolean {
  if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") {
    return false;
  }
  try {
    return navigator.sendBeacon(
      url,
      new Blob([body], { type: "application/json" })
    );
  } catch {
    return false;
  }
}

/**
 * fetch keepalive + 500ms bekleme.
 * Yanıt gelmezse sendBeacon yedek (aynı body / client_request_id → sunucu dedupe).
 */
export async function postJsonDurable(
  url: string,
  payload: Record<string, unknown>,
  waitMs = LEAD_WAIT_MS
): Promise<DurablePostResult> {
  const bodyObj = {
    ...payload,
    client_request_id:
      typeof payload.client_request_id === "string"
        ? payload.client_request_id
        : newRequestId(),
  };
  const body = JSON.stringify(bodyObj);

  let settled = false;
  const fetchP = fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body,
  })
    .then(async (res) => {
      settled = true;
      const data = (await res.json().catch(() => null)) as DurablePostResult["data"];
      return { res, data };
    })
    .catch(() => {
      settled = true;
      return null;
    });

  const winner = await Promise.race([
    fetchP.then((out) => {
      if (out?.res?.ok) return { status: "ok" as const, data: out.data };
      return { status: "error" as const };
    }),
    new Promise<DurablePostResult>((resolve) => {
      setTimeout(() => resolve({ status: "timeout" }), waitMs);
    }),
  ]);

  if (winner.status === "timeout" && !settled) {
    sendBeaconJson(url, body);
  } else if (winner.status === "error" && settled) {
    sendBeaconJson(url, body);
  }

  return winner;
}
