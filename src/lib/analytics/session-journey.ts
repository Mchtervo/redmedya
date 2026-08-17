/**
 * Session yolculuğu özeti — PII yok (yalnızca path, event adı, süre).
 */

import type { AnalyticsEvent, AnalyticsSession, FunnelStep } from "@/lib/analytics/types";
import { FUNNEL_STEP_RANK } from "@/lib/analytics/types";

export type AdBucket = "SITE" | "DM" | "SICAK" | "diger";

export type BlockReason = "form_error" | "js_error" | "page_exit" | "back";

export type PageDwell = {
  path: string;
  dwell_sec: number;
};

export type JourneySummary = {
  landing_path: string | null;
  exit_path: string | null;
  pages: PageDwell[];
  total_sec: number;
  is_returning: boolean | null;
  device: string | null;
  os: string | null;
  campaign: string | null;
  utm_content: string | null;
  ad_bucket: AdBucket;
  scroll_hero: boolean;
  scroll_packages: boolean;
  scroll_end: boolean;
  last_completed_step: FunnelStep;
  last_completed_label: string;
  block_reason: BlockReason | null;
  block_label: string | null;
};

const PATH_MAX = 120;
const SEQ_MAX = 40;

export function pathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const raw = url.trim();
  if (!raw) return null;
  try {
    const u = raw.startsWith("http")
      ? new URL(raw)
      : new URL(raw, "https://redmediadugun.com");
    const path = u.pathname || "/";
    return path.slice(0, PATH_MAX);
  } catch {
    return raw.split(/[?#]/)[0].slice(0, PATH_MAX) || "/";
  }
}

export function adCampaignBucket(
  campaign?: string | null,
  content?: string | null
): AdBucket {
  const blob = `${campaign ?? ""} ${content ?? ""}`.toUpperCase();
  if (blob.includes("SICAK")) return "SICAK";
  if (/(^|[^A-Z0-9])DM([^A-Z0-9]|$)/.test(blob) || blob.includes("_DM") || blob.includes("-DM")) {
    return "DM";
  }
  if (/(^|[^A-Z0-9])SITE([^A-Z0-9]|$)/.test(blob) || blob.includes("_SITE") || blob.includes("-SITE")) {
    return "SITE";
  }
  return "diger";
}

export function appendPageSequence(
  prev: string[] | undefined,
  path: string | null
): string[] {
  if (!path) return (prev ?? []).slice(-SEQ_MAX);
  const next = [...(prev ?? [])];
  if (next[next.length - 1] !== path) next.push(path);
  return next.slice(-SEQ_MAX);
}

const STEP_LABEL: Record<FunnelStep, string> = {
  page: "Sayfa",
  view_content: "Paket sayfası",
  package_build: "Paket / plato",
  add_to_cart: "Ekstra / sepet",
  checkout: "Form",
  schedule: "Rezervasyon",
  whatsapp: "WhatsApp",
  other: "Diğer",
};

const NEXT_STEP: Record<FunnelStep, string> = {
  page: "paket sayfasına geçiş",
  view_content: "paket seçimi",
  package_build: "devam / ekstra",
  add_to_cart: "form adımı",
  checkout: "rezervasyon gönderimi",
  schedule: "—",
  whatsapp: "—",
  other: "sonraki adım",
};

export function funnelStepLabel(step: FunnelStep): string {
  return STEP_LABEL[step] ?? step;
}

export function inferBlockReason(
  events: AnalyticsEvent[],
  converted: boolean
): {
  last_completed_step: FunnelStep;
  reason: BlockReason | null;
  label: string | null;
} {
  let lastStep: FunnelStep = "page";
  for (const e of events) {
    if (
      e.funnel_step !== "other" &&
      FUNNEL_STEP_RANK[e.funnel_step] >= FUNNEL_STEP_RANK[lastStep]
    ) {
      lastStep = e.funnel_step;
    }
  }

  if (converted || lastStep === "schedule" || lastStep === "whatsapp") {
    return { last_completed_step: lastStep, reason: null, label: null };
  }

  const tail = events.slice(-8);
  const lastName = events[events.length - 1]?.event_name ?? "";

  const hasFormErr = tail.some(
    (e) =>
      e.event_name === "FormFieldError" || e.event_name === "FormSubmitError"
  );
  const hasJs = tail.some((e) => e.event_name === "TechError");
  const lastIsBack = lastName === "StepBack";

  let reason: BlockReason;
  if (hasFormErr && (lastName === "FormFieldError" || lastName === "FormSubmitError" || lastName === "PageLeave" || lastName === "SessionAbandoned")) {
    reason = "form_error";
  } else if (hasJs) {
    reason = "js_error";
  } else if (lastIsBack) {
    reason = "back";
  } else {
    reason = "page_exit";
  }

  const next = NEXT_STEP[lastStep];
  const reasonText =
    reason === "form_error"
      ? "form hatası"
      : reason === "js_error"
        ? "teknik hata"
        : reason === "back"
          ? "geri tuşu"
          : "sayfadan çıkış";

  return {
    last_completed_step: lastStep,
    reason,
    label: `${funnelStepLabel(lastStep)} tamam · ${next} yok (${reasonText})`,
  };
}

export function buildPageDwells(events: AnalyticsEvent[]): PageDwell[] {
  const views = events.filter(
    (e) => e.event_name === "PageView" || e.event_name === "PageLeave"
  );
  const pages: PageDwell[] = [];
  const viewOnly = events.filter((e) => e.event_name === "PageView");

  for (let i = 0; i < viewOnly.length; i++) {
    const cur = viewOnly[i];
    const path = pathFromUrl(cur.page_url) ?? "/";
    const start = new Date(cur.event_time).getTime();
    const leave = views.find(
      (e) =>
        e.event_name === "PageLeave" &&
        pathFromUrl(e.page_url) === path &&
        new Date(e.event_time).getTime() >= start
    );
    const nextStart = viewOnly[i + 1]
      ? new Date(viewOnly[i + 1].event_time).getTime()
      : null;
    const explicit =
      typeof leave?.metadata.dwell_ms === "number" ? leave.metadata.dwell_ms : null;
    const end = explicit != null ? start + explicit : (nextStart ?? start);
    const dwell_sec = Math.max(0, Math.round((end - start) / 1000));
    const prev = pages[pages.length - 1];
    if (prev && prev.path === path) {
      prev.dwell_sec += dwell_sec;
    } else {
      pages.push({ path, dwell_sec });
    }
  }

  if (!pages.length) {
    const seq = events
      .map((e) => pathFromUrl(e.page_url))
      .filter((p): p is string => Boolean(p));
    const uniq: string[] = [];
    for (const p of seq) {
      if (uniq[uniq.length - 1] !== p) uniq.push(p);
    }
    return uniq.slice(0, SEQ_MAX).map((path) => ({ path, dwell_sec: 0 }));
  }
  return pages.slice(0, SEQ_MAX);
}

export function summarizeJourney(
  events: AnalyticsEvent[],
  session: AnalyticsSession | null
): JourneySummary {
  const pages = session?.page_sequence?.length
    ? mergeSequenceDwells(session.page_sequence, buildPageDwells(events))
    : buildPageDwells(events);

  const first = events[0];
  const last = events[events.length - 1];
  const totalFromEvents =
    first && last
      ? Math.max(
          0,
          Math.round(
            (new Date(last.event_time).getTime() -
              new Date(first.event_time).getTime()) /
              1000
          )
        )
      : 0;
  const total_sec = session?.total_duration_ms
    ? Math.round(session.total_duration_ms / 1000)
    : totalFromEvents;

  const landing =
    session?.landing_path ??
    pathFromUrl(session?.landing_url) ??
    pages[0]?.path ??
    null;
  const exit =
    session?.exit_path ??
    pathFromUrl(session?.last_url) ??
    pages[pages.length - 1]?.path ??
    null;

  const converted = Boolean(
    session?.converted || events.some((e) => e.event_name === "Schedule")
  );
  const block = inferBlockReason(events, converted);

  const campaign =
    session?.utm.utm_campaign ?? last?.utm_campaign ?? first?.utm_campaign ?? null;
  const utm_content =
    session?.utm.utm_content ?? last?.utm_content ?? first?.utm_content ?? null;

  const scrollFromEvents = (milestone: string) =>
    events.some(
      (e) =>
        e.event_name === "ScrollDepth" && e.metadata.milestone === milestone
    );

  return {
    landing_path: landing,
    exit_path: exit,
    pages,
    total_sec,
    is_returning: session?.is_returning ?? null,
    device: session?.device ?? last?.device ?? first?.device ?? null,
    os: session?.os ?? last?.os ?? first?.os ?? null,
    campaign,
    utm_content,
    ad_bucket: adCampaignBucket(campaign, utm_content),
    scroll_hero: Boolean(session?.scroll_hero || scrollFromEvents("hero")),
    scroll_packages: Boolean(
      session?.scroll_packages || scrollFromEvents("packages")
    ),
    scroll_end: Boolean(session?.scroll_end || scrollFromEvents("end")),
    last_completed_step: block.last_completed_step,
    last_completed_label: funnelStepLabel(block.last_completed_step),
    block_reason: block.reason,
    block_label: block.label,
  };
}

function mergeSequenceDwells(
  sequence: string[],
  dwells: PageDwell[]
): PageDwell[] {
  const byPath = new Map(dwells.map((d) => [d.path, d.dwell_sec]));
  return sequence.map((path) => ({
    path,
    dwell_sec: byPath.get(path) ?? 0,
  }));
}

export const EVENT_LABEL_TR: Record<string, string> = {
  PageView: "Sayfa görüntüleme",
  PageLeave: "Sayfadan ayrıldı",
  SessionStart: "Oturum başladı",
  SessionAbandoned: "Oturum terk edildi",
  ScrollDepth: "Kaydırma",
  ViewContent: "Paket sayfası",
  PackageBuild: "Paket oluşturuluyor",
  PackageSelected: "Paket seçildi",
  PlatoSelected: "Plato seçildi",
  ExtraServiceSelected: "Ekstra seçildi",
  AddToCart: "Sepete eklendi",
  InitiateCheckout: "Form adımına geçti",
  DateSelected: "Tarih seçildi",
  FormStarted: "Form başladı",
  FormFieldTouched: "Form alanına dokundu",
  FormFieldError: "Form alanı hatası",
  FormSubmitAttempt: "Gönderim denemesi",
  FormSubmitError: "Gönderim hatası",
  FormSubmitSuccess: "Form gönderildi",
  Schedule: "Rezervasyon",
  WhatsAppClick: "WhatsApp tıklama",
  StepForward: "İleri adım",
  StepBack: "Geri tuşu",
  ExitIntent: "Çıkış niyeti",
  TechError: "Teknik hata",
};

export function eventLabelTr(name: string): string {
  return EVENT_LABEL_TR[name] ?? name;
}

export function formatTimelineMeta(
  eventName: string,
  metadata: Record<string, string | number | boolean | null>
): string | null {
  const parts: string[] = [];
  if (eventName === "PackageSelected" && metadata.package_id != null) {
    parts.push(`Paket ${metadata.package_id}`);
  }
  if (eventName === "PlatoSelected" && metadata.plato != null) {
    parts.push(String(metadata.plato));
  }
  if (eventName === "ExtraServiceSelected" && metadata.addon_id != null) {
    parts.push(String(metadata.addon_id));
  }
  if (
    (eventName === "FormFieldTouched" || eventName === "FormFieldError") &&
    metadata.field_name
  ) {
    parts.push(String(metadata.field_name));
  }
  if (eventName === "FormFieldError" && metadata.error_type) {
    parts.push(String(metadata.error_type));
  }
  if (eventName === "ScrollDepth" && metadata.milestone) {
    const m = String(metadata.milestone);
    parts.push(
      m === "hero"
        ? "ilk ekran geçildi"
        : m === "packages"
          ? "paketler görüldü"
          : m === "plato"
            ? "plato görüldü"
            : m === "continue"
              ? "DEVAM görüldü"
              : "sayfa sonu"
    );
  }
  if (eventName === "PageLeave") {
    const active =
      typeof metadata.active_ms === "number" ? metadata.active_ms : null;
    const wall = typeof metadata.dwell_ms === "number" ? metadata.dwell_ms : null;
    const ms = active ?? wall;
    if (typeof ms === "number") {
      const sec = Math.round(ms / 1000);
      parts.push(sec < 60 ? `${sec} sn` : `${Math.floor(sec / 60)} dk ${sec % 60} sn`);
    }
  }
  if (eventName === "StepForward" || eventName === "StepBack") {
    if (metadata.from != null && metadata.to != null) {
      parts.push(`${metadata.from} → ${metadata.to}`);
    }
  }
  return parts.length ? parts.join(" · ") : null;
}
