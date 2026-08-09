import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import type { AnalyticsSession, FunnelStep } from "@/lib/analytics/types";
import { FUNNEL_STEP_RANK } from "@/lib/analytics/types";
import { mergeAttribution } from "@/lib/analytics/collect-core";
import { RETENTION } from "@/config/retention";

const FILE = dataPath("analytics_sessions.json");

type SessionsFile = { sessions: Record<string, AnalyticsSession> };

async function readFileSafe(): Promise<SessionsFile> {
  try {
    const raw = await readFile(FILE, "utf-8");
    return JSON.parse(raw) as SessionsFile;
  } catch {
    return { sessions: {} };
  }
}

async function writeFileSafe(data: SessionsFile): Promise<void> {
  await mkdir(path.dirname(FILE), { recursive: true });
  const cutoff = Date.now() - RETENTION.eventsDays * 864e5;
  const entries = Object.entries(data.sessions).filter(
    ([, s]) => new Date(s.last_seen_at).getTime() >= cutoff
  );
  if (entries.length > 5000) {
    entries.sort(
      (a, b) =>
        new Date(b[1].last_seen_at).getTime() -
        new Date(a[1].last_seen_at).getTime()
    );
    data.sessions = Object.fromEntries(entries.slice(0, 5000));
  } else {
    data.sessions = Object.fromEntries(entries);
  }
  await writeFile(FILE, JSON.stringify(data), "utf-8");
}

export type SessionUpsertPatch = Partial<AnalyticsSession> & {
  session_id: string;
  /** Collect asla lead_id yazmamalı — yalnızca linkSessionLead. */
  allow_client_lead_id?: boolean;
};

export async function upsertAnalyticsSession(
  patch: SessionUpsertPatch
): Promise<AnalyticsSession> {
  const file = await readFileSafe();
  const prev = file.sessions[patch.session_id];
  const now = new Date().toISOString();

  const attr = mergeAttribution({
    prevFirst: prev?.first_touch_utm ?? prev?.utm,
    prevLast: prev?.last_touch_utm,
    firstIncoming: patch.first_touch_utm ?? patch.utm,
    lastIncoming: patch.last_touch_utm,
  });

  // lead_id: yalnızca açıkça linkSessionLead / allow ile yazılır
  let leadId = prev?.lead_id ?? null;
  if (patch.allow_client_lead_id && patch.lead_id) {
    leadId = patch.lead_id;
  }

  const next: AnalyticsSession = {
    session_id: patch.session_id,
    first_seen_at: prev?.first_seen_at ?? patch.first_seen_at ?? now,
    last_seen_at: patch.last_seen_at ?? now,
    landing_url: prev?.landing_url ?? patch.landing_url ?? null,
    last_url: patch.last_url ?? prev?.last_url ?? null,
    referrer: prev?.referrer ?? patch.referrer ?? null,
    device: patch.device ?? prev?.device ?? null,
    browser: patch.browser ?? prev?.browser ?? null,
    os: patch.os ?? prev?.os ?? null,
    viewport: patch.viewport ?? prev?.viewport ?? null,
    country: patch.country ?? prev?.country ?? null,
    city: patch.city ?? prev?.city ?? null,
    utm: attr.first_touch_utm,
    first_touch_utm: attr.first_touch_utm,
    last_touch_utm: attr.last_touch_utm,
    fbp: patch.fbp ?? prev?.fbp ?? null,
    fbc: patch.fbc ?? prev?.fbc ?? null,
    lead_id: leadId,
    max_funnel_step: pickMaxStep(
      prev?.max_funnel_step ?? "page",
      patch.max_funnel_step
    ),
    converted: Boolean(patch.converted || prev?.converted),
    event_count: (prev?.event_count ?? 0) + (patch.event_count ?? 0),
  };

  file.sessions[patch.session_id] = next;
  await writeFileSafe(file);
  return next;
}

function pickMaxStep(a: FunnelStep, b?: FunnelStep): FunnelStep {
  if (!b) return a;
  return FUNNEL_STEP_RANK[b] >= FUNNEL_STEP_RANK[a] ? b : a;
}

export async function linkSessionLead(
  sessionId: string,
  leadId: string
): Promise<void> {
  await upsertAnalyticsSession({
    session_id: sessionId,
    lead_id: leadId,
    allow_client_lead_id: true,
    converted: true,
    max_funnel_step: "schedule",
    event_count: 0,
  });
}

function normalizeSession(s: AnalyticsSession): AnalyticsSession {
  const first = s.first_touch_utm ?? s.utm ?? {};
  const last = s.last_touch_utm ?? first;
  return {
    ...s,
    utm: s.utm ?? first,
    first_touch_utm: first,
    last_touch_utm: last,
  };
}

export async function readAnalyticsSessions(): Promise<AnalyticsSession[]> {
  const file = await readFileSafe();
  return Object.values(file.sessions).map(normalizeSession);
}

export async function getAnalyticsSession(
  sessionId: string
): Promise<AnalyticsSession | null> {
  const file = await readFileSafe();
  const s = file.sessions[sessionId];
  return s ? normalizeSession(s) : null;
}
