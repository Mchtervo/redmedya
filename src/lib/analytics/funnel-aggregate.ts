import type {
  AnalyticsEvent,
  AnalyticsSession,
  DateRangePreset,
  FunnelStep,
} from "@/lib/analytics/types";

export function resolveDateRange(
  preset: DateRangePreset,
  customFrom?: string,
  customTo?: string
): { fromMs: number; toMs: number; label: string } {
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  switch (preset) {
    case "today":
      return {
        fromMs: startOfToday.getTime(),
        toMs: endOfToday.getTime(),
        label: "Bugün",
      };
    case "yesterday": {
      const y0 = new Date(startOfToday);
      y0.setDate(y0.getDate() - 1);
      const y1 = new Date(y0);
      y1.setHours(23, 59, 59, 999);
      return { fromMs: y0.getTime(), toMs: y1.getTime(), label: "Dün" };
    }
    case "last_7":
      return {
        fromMs: endOfToday.getTime() - 7 * 864e5,
        toMs: endOfToday.getTime(),
        label: "Son 7 gün",
      };
    case "last_14":
      return {
        fromMs: endOfToday.getTime() - 14 * 864e5,
        toMs: endOfToday.getTime(),
        label: "Son 14 gün",
      };
    case "last_30":
      return {
        fromMs: endOfToday.getTime() - 30 * 864e5,
        toMs: endOfToday.getTime(),
        label: "Son 30 gün",
      };
    case "custom": {
      const from = customFrom
        ? new Date(customFrom).getTime()
        : endOfToday.getTime() - 7 * 864e5;
      const to = customTo
        ? new Date(customTo).getTime()
        : endOfToday.getTime();
      return { fromMs: from, toMs: to, label: "Özel" };
    }
    default:
      return {
        fromMs: endOfToday.getTime() - 7 * 864e5,
        toMs: endOfToday.getTime(),
        label: "Son 7 gün",
      };
  }
}

function sessionReached(
  events: AnalyticsEvent[],
  names: string[]
): boolean {
  const set = new Set(names);
  return events.some((e) => set.has(e.event_name));
}

export type FunnelStage = {
  key: string;
  label: string;
  count: number;
  rateFromPrev: number | null;
  dropOff: number | null;
};

/**
 * Unique-session funnel (event sayısı değil).
 * ViewContent → PackageBuild → AddToCart → InitiateCheckout → Schedule
 * Aynı adım tekrarları (ör. 2x InitiateCheckout) session'ı 1 kez sayar.
 */
export function buildFunnelStages(
  bySession: Map<string, AnalyticsEvent[]>
): FunnelStage[] {
  let page = 0;
  let started = 0;
  let ready = 0;
  let form = 0;
  let reserved = 0;
  let wa = 0;

  for (const evs of bySession.values()) {
    if (!sessionReached(evs, ["ViewContent"])) continue;
    page += 1;

    if (sessionReached(evs, ["PackageBuild"])) started += 1;
    if (sessionReached(evs, ["AddToCart"])) ready += 1;
    if (sessionReached(evs, ["InitiateCheckout"])) form += 1;
    if (sessionReached(evs, ["Schedule"])) reserved += 1;
    if (sessionReached(evs, ["WhatsAppClick"])) wa += 1;
  }

  const stages: FunnelStage[] = [
    { key: "page", label: "Paket sayfası", count: page, rateFromPrev: null, dropOff: null },
    {
      key: "started",
      label: "Paket başladı",
      count: started,
      rateFromPrev: page ? started / page : null,
      dropOff: page ? (page - started) / page : null,
    },
    {
      key: "ready",
      label: "Paket + plato (Devam)",
      count: ready,
      rateFromPrev: started ? ready / started : null,
      dropOff: started ? (started - ready) / started : null,
    },
    {
      key: "form",
      label: "Form / checkout",
      count: form,
      rateFromPrev: ready ? form / ready : null,
      dropOff: ready ? (ready - form) / ready : null,
    },
    {
      key: "reserved",
      label: "Rezervasyon (Schedule)",
      count: reserved,
      rateFromPrev: form ? reserved / form : null,
      dropOff: form ? (form - reserved) / form : null,
    },
    {
      key: "whatsapp",
      label: "WhatsApp tıklama",
      count: wa,
      rateFromPrev: form ? wa / form : null,
      dropOff: null,
    },
  ];
  return stages;
}

export function biggestDropOff(stages: FunnelStage[]): {
  from: string;
  to: string;
  rate: number;
} | null {
  let best: { from: string; to: string; rate: number } | null = null;
  for (let i = 1; i < stages.length - 1; i++) {
    const drop = stages[i].dropOff;
    if (drop == null) continue;
    if (!best || drop > best.rate) {
      best = {
        from: stages[i - 1].label,
        to: stages[i].label,
        rate: drop,
      };
    }
  }
  return best;
}

export function groupBySession(
  events: AnalyticsEvent[]
): Map<string, AnalyticsEvent[]> {
  const map = new Map<string, AnalyticsEvent[]>();
  for (const e of events) {
    const arr = map.get(e.session_id) ?? [];
    arr.push(e);
    map.set(e.session_id, arr);
  }
  for (const [k, arr] of map) {
    arr.sort(
      (a, b) =>
        new Date(a.event_time).getTime() - new Date(b.event_time).getTime()
    );
    map.set(k, arr);
  }
  return map;
}

export type DropOffScroll = {
  packages: number;
  plato: number;
  continueBtn: number;
};

export type DropOffBucket = {
  key: string;
  label: string;
  count: number;
  rate: number;
  avgDwellSec: number;
  devices: Record<string, number>;
  sources: Record<string, number>;
  campaigns: Record<string, number>;
  lastAction: string;
  scroll: DropOffScroll;
};

/** Arka plan sekmesi boşluğu — bundan uzun sessizlik aktif süreye girmez. */
const ACTIVE_GAP_MS = 30_000;
const ACTIVE_MAX_SEC = 10 * 60;

/**
 * Gerçek aktif kalma: görünürken biriken active_ms tercih edilir.
 * Eski kayıtlarda event aralıkları >30 sn (tab arkada / timeout) atılır.
 */
export function activeDwellSec(evs: AnalyticsEvent[]): number {
  let fromActive = 0;
  let hasActive = false;
  for (const e of evs) {
    if (e.event_name !== "PageLeave") continue;
    const n = e.metadata.active_ms;
    if (typeof n === "number" && Number.isFinite(n) && n >= 0) {
      fromActive += n;
      hasActive = true;
    }
  }
  if (hasActive) {
    return Math.min(ACTIVE_MAX_SEC, Math.max(0, Math.round(fromActive / 1000)));
  }

  if (evs.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < evs.length; i++) {
    const a = new Date(evs[i - 1].event_time).getTime();
    const b = new Date(evs[i].event_time).getTime();
    const d = b - a;
    if (d > 0 && d <= ACTIVE_GAP_MS) sum += d;
  }
  return Math.min(ACTIVE_MAX_SEC, Math.max(0, Math.round(sum / 1000)));
}

function sawPaketPage(evs: AnalyticsEvent[]): boolean {
  return evs.some(
    (e) =>
      e.event_name === "ViewContent" ||
      (e.event_name === "PageView" &&
        (e.page_url ?? "").includes("/paket-olustur"))
  );
}

function pressedDevam(evs: AnalyticsEvent[]): boolean {
  return evs.some((e) => e.event_name === "AddToCart");
}

function sessionScroll(
  evs: AnalyticsEvent[],
  milestone: "packages" | "plato" | "continue"
): boolean {
  return evs.some(
    (e) => e.event_name === "ScrollDepth" && e.metadata.milestone === milestone
  );
}

function lastAction(evs: AnalyticsEvent[]): string {
  return evs[evs.length - 1]?.event_name ?? "—";
}

function bump(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

export function buildDropOffBuckets(
  bySession: Map<string, AnalyticsEvent[]>,
  sessionsMeta: Map<string, AnalyticsSession>
): DropOffBucket[] {
  const total = bySession.size || 1;
  const defs: {
    key: string;
    label: string;
    match: (evs: AnalyticsEvent[]) => boolean;
  }[] = [
    {
      key: "no_continue",
      label: "DEVAM'a basmadan çıkanlar",
      match: (evs) => sawPaketPage(evs) && !pressedDevam(evs),
    },
    {
      key: "no_plato",
      label: "Paket seçip plato seçmeden",
      match: (evs) =>
        evs.some((e) =>
          ["PackageBuild", "PackageSelected"].includes(e.event_name)
        ) &&
        !evs.some((e) => e.event_name === "PlatoSelected") &&
        !pressedDevam(evs),
    },
    {
      key: "step2_no_form",
      label: "Adım 2'ye geçip formu açmayanlar",
      match: (evs) =>
        pressedDevam(evs) &&
        !evs.some((e) => e.event_name === "InitiateCheckout"),
    },
    {
      key: "form_no_start",
      label: "Form ekranına gelip başlamayanlar",
      match: (evs) =>
        evs.some((e) => e.event_name === "InitiateCheckout") &&
        !evs.some((e) =>
          ["FormStarted", "DateSelected", "FormSubmitAttempt"].includes(
            e.event_name
          )
        ),
    },
    {
      key: "form_no_submit",
      label: "Form doldurup göndermeyenler",
      match: (evs) =>
        evs.some((e) => e.event_name === "FormStarted") &&
        !evs.some((e) =>
          ["Schedule", "FormSubmitSuccess", "WhatsAppClick"].includes(
            e.event_name
          )
        ),
    },
    {
      key: "submit_error",
      label: "Submit / form hatası alanlar",
      match: (evs) =>
        evs.some((e) =>
          ["FormFieldError", "FormSubmitError"].includes(e.event_name)
        ),
    },
  ];

  return defs.map((d) => {
    const matched: AnalyticsEvent[][] = [];
    for (const [sid, evs] of bySession) {
      if (d.match(evs)) matched.push(evs);
      void sid;
    }
    const devices: Record<string, number> = {};
    const sources: Record<string, number> = {};
    const campaigns: Record<string, number> = {};
    let dwellSum = 0;
    let dwellN = 0;
    const scroll: DropOffScroll = { packages: 0, plato: 0, continueBtn: 0 };
    for (const evs of matched) {
      const dsec = activeDwellSec(evs);
      if (dsec > 0) {
        dwellSum += dsec;
        dwellN += 1;
      }
      if (sessionScroll(evs, "packages")) scroll.packages += 1;
      if (sessionScroll(evs, "plato")) scroll.plato += 1;
      if (sessionScroll(evs, "continue")) scroll.continueBtn += 1;
      const sid = evs[0]?.session_id;
      const meta = sid ? sessionsMeta.get(sid) : undefined;
      bump(devices, meta?.device ?? evs[0]?.device ?? "unknown");
      bump(sources, meta?.utm.utm_source ?? evs[0]?.utm_source ?? "direct");
      bump(
        campaigns,
        meta?.utm.utm_campaign ?? evs[0]?.utm_campaign ?? "(yok)"
      );
    }
    return {
      key: d.key,
      label: d.label,
      count: matched.length,
      rate: matched.length / total,
      avgDwellSec: dwellN ? Math.round(dwellSum / dwellN) : 0,
      devices,
      sources,
      campaigns,
      lastAction: matched[0] ? lastAction(matched[0]) : "—",
      scroll,
    };
  });
}

export function formErrorStats(events: AnalyticsEvent[]) {
  const map = new Map<string, number>();
  for (const e of events) {
    if (e.event_name !== "FormFieldError") continue;
    const field = String(e.metadata.field_name ?? "unknown");
    const err = String(e.metadata.error_type ?? e.error_code ?? "error");
    const key = `${field} → ${err}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

export function campaignFunnel(
  bySession: Map<string, AnalyticsEvent[]>,
  sessionsMeta: Map<string, AnalyticsSession>
) {
  const map = new Map<
    string,
    { campaign: string; source: string; page: number; start: number; checkout: number; reserve: number }
  >();

  for (const [sid, evs] of bySession) {
    const meta = sessionsMeta.get(sid);
    const campaign =
      meta?.utm.utm_campaign ?? evs[0]?.utm_campaign ?? "(organic/direct)";
    const source = meta?.utm.utm_source ?? evs[0]?.utm_source ?? "direct";
    const key = `${source}|${campaign}`;
    const row = map.get(key) ?? {
      campaign,
      source,
      page: 0,
      start: 0,
      checkout: 0,
      reserve: 0,
    };
    row.page += 1;
    if (sessionReached(evs, ["PackageBuild", "PackageSelected"])) row.start += 1;
    if (sessionReached(evs, ["InitiateCheckout"])) row.checkout += 1;
    if (sessionReached(evs, ["Schedule"])) row.reserve += 1;
    map.set(key, row);
  }

  return [...map.values()]
    .map((r) => ({
      ...r,
      reserveRate: r.page ? r.reserve / r.page : 0,
    }))
    .sort((a, b) => b.reserve - a.reserve || b.page - a.page)
    .slice(0, 40);
}

export function deviceFunnel(bySession: Map<string, AnalyticsEvent[]>) {
  const map = new Map<
    string,
    { device: string; page: number; reserve: number }
  >();
  for (const evs of bySession.values()) {
    const device = evs[0]?.device ?? "unknown";
    const row = map.get(device) ?? { device, page: 0, reserve: 0 };
    row.page += 1;
    if (sessionReached(evs, ["Schedule"])) row.reserve += 1;
    map.set(device, row);
  }
  return [...map.values()].map((r) => ({
    ...r,
    rate: r.page ? r.reserve / r.page : 0,
  }));
}

export function osFunnel(bySession: Map<string, AnalyticsEvent[]>) {
  const map = new Map<string, { os: string; page: number; reserve: number }>();
  for (const evs of bySession.values()) {
    const os = evs[0]?.os ?? "unknown";
    const row = map.get(os) ?? { os, page: 0, reserve: 0 };
    row.page += 1;
    if (sessionReached(evs, ["Schedule"])) row.reserve += 1;
    map.set(os, row);
  }
  return [...map.values()].map((r) => ({
    ...r,
    rate: r.page ? r.reserve / r.page : 0,
  }));
}

export function stepDurations(bySession: Map<string, AnalyticsEvent[]>) {
  const buckets: Record<string, number[]> = {
    page_to_select: [],
    select_to_plato: [],
    plato_to_continue: [],
    checkout_to_submit: [],
  };

  for (const evs of bySession.values()) {
    const t = (name: string) =>
      evs.find((e) => e.event_name === name)?.event_time;
    const ms = (a?: string, b?: string) =>
      a && b ? Math.max(0, new Date(b).getTime() - new Date(a).getTime()) : null;

    const page = t("ViewContent") ?? t("PageView");
    const pkg = t("PackageSelected") ?? t("PackageBuild");
    const plato = t("PlatoSelected");
    const atc = t("AddToCart");
    const ic = t("InitiateCheckout");
    const sched = t("Schedule") ?? t("FormSubmitSuccess");

    const a = ms(page, pkg);
    if (a != null) buckets.page_to_select.push(a);
    const b = ms(pkg, plato);
    if (b != null) buckets.select_to_plato.push(b);
    const c = ms(plato, atc);
    if (c != null) buckets.plato_to_continue.push(c);
    const d = ms(ic, sched);
    if (d != null) buckets.checkout_to_submit.push(d);
  }

  const avg = (arr: number[]) =>
    arr.length
      ? Math.round(arr.reduce((s, n) => s + n, 0) / arr.length / 1000)
      : 0;

  return {
    page_to_select_sec: avg(buckets.page_to_select),
    select_to_plato_sec: avg(buckets.select_to_plato),
    plato_to_continue_sec: avg(buckets.plato_to_continue),
    checkout_to_submit_sec: avg(buckets.checkout_to_submit),
  };
}

export function recentActivity(events: AnalyticsEvent[], limit = 25) {
  const interesting = new Set([
    "PackageBuild",
    "AddToCart",
    "InitiateCheckout",
    "Schedule",
    "WhatsAppClick",
    "FormSubmitError",
    "FormFieldError",
    "TechError",
    "ExitIntent",
  ]);
  return events
    .filter((e) => interesting.has(e.event_name))
    .sort(
      (a, b) =>
        new Date(b.event_time).getTime() - new Date(a.event_time).getTime()
    )
    .slice(0, limit)
    .map((e) => ({
      time: e.event_time,
      event: e.event_name,
      session_id: e.session_id.slice(0, 8),
      lead_id: e.lead_id,
      step: e.funnel_step as FunnelStep,
    }));
}

export function healthSummary(
  stages: FunnelStage[],
  prevWeekReserveRate: number | null
) {
  const page = stages.find((s) => s.key === "page")?.count ?? 0;
  const started = stages.find((s) => s.key === "started")?.count ?? 0;
  const form = stages.find((s) => s.key === "form")?.count ?? 0;
  const reserved = stages.find((s) => s.key === "reserved")?.count ?? 0;
  const startRate = page ? started / page : 0;
  const checkoutRate = page ? form / page : 0;
  const reserveRate = page ? reserved / page : 0;
  const drop = biggestDropOff(stages);
  const alerts: string[] = [];
  if (
    prevWeekReserveRate != null &&
    prevWeekReserveRate > 0 &&
    reserveRate < prevWeekReserveRate * 0.6
  ) {
    alerts.push(
      "Son dönem rezervasyon oranı son 7 gün ortalamasının %40+ altında."
    );
  }
  if (drop && drop.rate >= 0.55) {
    alerts.push(`En büyük kayıp: ${drop.from} → ${drop.to} (%${Math.round(drop.rate * 100)}).`);
  }
  return {
    startRate,
    checkoutRate,
    reserveRate,
    biggestLoss: drop,
    alerts,
  };
}

export function trafficSourceLabel(utmSource: string | null | undefined): string {
  const s = (utmSource ?? "direct").toLowerCase();
  if (!s || s === "direct" || s === "(direct)") return "Direct";
  if (s.includes("facebook") || s.includes("fb") || s === "meta") return "Meta";
  if (s.includes("instagram") || s === "ig") return "Instagram";
  if (s.includes("google") || s.includes("gclid")) return "Google";
  if (s.includes("whatsapp") || s === "wa") return "WhatsApp";
  return "Diğer";
}
