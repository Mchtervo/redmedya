import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import { RETENTION } from "@/config/retention";
import { sanitizeTechMessage } from "@/lib/analytics/collect-core";
import type { FunnelStep, TechErrorRow } from "@/lib/analytics/types";

const FILE = dataPath("analytics_tech_errors.json");

type FileShape = { errors: TechErrorRow[] };

async function readSafe(): Promise<FileShape> {
  try {
    return JSON.parse(await readFile(FILE, "utf-8")) as FileShape;
  } catch {
    return { errors: [] };
  }
}

function fingerprint(type: string, message: string, page: string | null): string {
  return `${type}|${message.slice(0, 120)}|${page ?? ""}`;
}

export async function upsertTechError(input: {
  session_id: string | null;
  error_type: string;
  message: string;
  funnel_step?: FunnelStep | null;
  page_url?: string | null;
  device?: string | null;
  browser?: string | null;
  os?: string | null;
  stack_preview?: string | null;
}): Promise<void> {
  const file = await readSafe();
  const now = new Date().toISOString();
  const msg = sanitizeTechMessage(input.message);
  const stack = input.stack_preview
    ? sanitizeTechMessage(input.stack_preview).slice(0, 500)
    : null;
  const fp = fingerprint(input.error_type, msg, input.page_url ?? null);
  const existing = file.errors.find(
    (e) => fingerprint(e.error_type, e.message, e.page_url) === fp
  );
  if (existing) {
    existing.count += 1;
    existing.last_seen_at = now;
    existing.session_id = input.session_id ?? existing.session_id;
  } else {
    file.errors.push({
      id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      session_id: input.session_id,
      error_type: input.error_type.slice(0, 80),
      message: msg,
      funnel_step: input.funnel_step ?? null,
      page_url: input.page_url?.slice(0, 300) ?? null,
      device: input.device ?? null,
      browser: input.browser ?? null,
      os: input.os ?? null,
      first_seen_at: now,
      last_seen_at: now,
      count: 1,
      stack_preview: stack,
    });
  }
  const cutoff = Date.now() - RETENTION.eventsDays * 864e5;
  file.errors = file.errors.filter(
    (e) => new Date(e.last_seen_at).getTime() >= cutoff
  );
  // max 800 distinct error fingerprints
  if (file.errors.length > 800) {
    file.errors.sort(
      (a, b) =>
        new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime()
    );
    file.errors = file.errors.slice(0, 800);
  }
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(file), "utf-8");
}

export async function readTechErrors(): Promise<TechErrorRow[]> {
  const file = await readSafe();
  return file.errors.sort(
    (a, b) =>
      new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime()
  );
}
