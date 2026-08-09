import { siteConfig } from "@/config/site";
import { hashEmail, hashName, hashPhone } from "@/lib/ads-hash";
import { createHash } from "crypto";
import {
  isMetaTrackingLiveServer,
  logMetaDebug,
} from "@/lib/meta-tracking";
import { META_CAPI_ALLOWED } from "@/lib/meta-pixel";

export type MetaCapiUserData = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  /** Ham external id (session/phone) — SHA-256 ile gönderilir */
  externalId?: string;
  fbp?: string;
  fbc?: string;
  clientIp?: string;
  clientUserAgent?: string;
};

export type MetaCapiContent = {
  id: string;
  quantity: number;
  item_price?: number;
};

export type MetaCapiCustomData = {
  value?: number;
  currency?: string;
  contentIds?: string[];
  contents?: MetaCapiContent[];
  contentName?: string;
  numItems?: number;
  orderId?: string;
};

const API_VERSION = "v21.0";

function pixelId(): string {
  return (
    process.env.META_PIXEL_ID ||
    process.env.NEXT_PUBLIC_META_PIXEL_ID ||
    siteConfig.metaPixelId
  );
}

function accessToken(): string | undefined {
  return process.env.META_CAPI_ACCESS_TOKEN?.trim();
}

function hashExternalId(raw: string): string | undefined {
  const v = raw.trim().toLowerCase();
  if (!v) return undefined;
  return createHash("sha256").update(v).digest("hex");
}

function buildUserData(ud: MetaCapiUserData): Record<string, string | undefined> {
  return {
    em: ud.email ? hashEmail(ud.email) : undefined,
    ph: ud.phone ? hashPhone(ud.phone) : undefined,
    fn: ud.firstName ? hashName(ud.firstName) : undefined,
    ln: ud.lastName ? hashName(ud.lastName) : undefined,
    external_id: ud.externalId ? hashExternalId(ud.externalId) : undefined,
    fbp: ud.fbp?.trim() || undefined,
    fbc: ud.fbc?.trim() || undefined,
    client_ip_address: ud.clientIp?.trim() || undefined,
    client_user_agent: ud.clientUserAgent?.trim() || undefined,
  };
}

/**
 * event_source_url: çağıranın verdiği gerçek URL zorunlu tercihtir.
 * Root hard-code YOK. Yoksa gönderim atlanır (yanlış attribution olmasın).
 */
export async function sendMetaCapiEvent(
  eventName: string,
  options: {
    eventId: string;
    eventTime?: number;
    actionSource?: "website" | "system_generated";
    eventSourceUrl?: string;
    hostHeader?: string | null;
    userData?: MetaCapiUserData;
    customData?: MetaCapiCustomData;
  }
): Promise<{ ok: boolean; skipped?: boolean; debug?: boolean; error?: string }> {
  if (!META_CAPI_ALLOWED.has(eventName)) {
    logMetaDebug({
      event: eventName,
      event_id: options.eventId,
      url: options.eventSourceUrl,
      source: "capi",
      reason: "CAPI allowlist dışı — gönderilmedi",
    });
    return { ok: true, skipped: true, debug: true };
  }

  const live = isMetaTrackingLiveServer({
    hostHeader: options.hostHeader,
    eventSourceUrl: options.eventSourceUrl,
  });

  if (!live) {
    logMetaDebug({
      event: eventName,
      event_id: options.eventId,
      url: options.eventSourceUrl,
      source: "capi",
      reason: "production dışı veya izinli host değil — Meta'ya gönderilmedi",
    });
    return { ok: true, skipped: true, debug: true };
  }

  const token = accessToken();
  const pid = pixelId();
  if (!token || !pid) {
    return { ok: false, skipped: true };
  }

  const eventSourceUrl = options.eventSourceUrl?.trim();
  if (!eventSourceUrl || !/^https?:\/\//i.test(eventSourceUrl)) {
    return {
      ok: false,
      error: "event_source_url gerekli (gerçek sayfa URL'si).",
    };
  }

  const user_data = Object.fromEntries(
    Object.entries(buildUserData(options.userData ?? {})).filter(
      ([, v]) => v != null && v !== ""
    )
  );
  const custom_data: Record<string, unknown> = {
    currency: options.customData?.currency ?? "TRY",
  };
  if (options.customData?.value != null) {
    custom_data.value = options.customData.value;
  }
  if (options.customData?.contentIds?.length) {
    custom_data.content_ids = options.customData.contentIds;
  }
  if (options.customData?.contents?.length) {
    custom_data.contents = options.customData.contents;
    custom_data.content_type = "product";
  }
  if (options.customData?.contentName) {
    custom_data.content_name = options.customData.contentName;
  }
  if (options.customData?.numItems != null) {
    custom_data.num_items = options.customData.numItems;
  }
  if (options.customData?.orderId) {
    custom_data.order_id = options.customData.orderId;
  }

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: options.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: options.eventId,
        action_source: options.actionSource ?? "website",
        event_source_url: eventSourceUrl,
        user_data,
        custom_data,
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${pid}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const json = (await res.json()) as { error?: { message?: string } };
    if (!res.ok) {
      return { ok: false, error: json.error?.message ?? res.statusText };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Meta CAPI request failed",
    };
  }
}
