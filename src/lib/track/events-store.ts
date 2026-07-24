import { readFile, writeFile, appendFile, mkdir, stat } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import { RETENTION } from "@/config/retention";

/**
 * §11 olay deposu — Supabase (PostgREST üzerinden, SDK'sız fetch) yapılandırılmışsa
 * ona; değilse dosyaya (data/events.jsonl). Kişisel veri veya IP SAKLAMAZ.
 */
export type TrackedEvent = {
  id: string;
  session_id: string;
  ts: string; // ISO
  event_type: string;
  payload: Record<string, unknown>;
  utm_source: string | null;
  utm_campaign: string | null;
  device: string | null;
  referrer: string | null;
};

const FILE = dataPath("events.jsonl");

function sbUrl(): string | undefined {
  return process.env.SUPABASE_URL?.trim();
}
function sbKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
}
export function supabaseConfigured(): boolean {
  return Boolean(sbUrl() && sbKey());
}
function sbHeaders(extra: Record<string, string> = {}) {
  const key = sbKey()!;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export async function insertEvents(rows: TrackedEvent[]): Promise<void> {
  if (!rows.length) return;
  if (supabaseConfigured()) {
    try {
      const res = await fetch(`${sbUrl()}/rest/v1/events`, {
        method: "POST",
        headers: sbHeaders({ Prefer: "return=minimal" }),
        body: JSON.stringify(rows),
      });
      if (res.ok) return;
    } catch {
      /* Supabase erişilemezse dosyaya düş */
    }
  }
  // Dosya fallback
  await mkdir(path.dirname(FILE), { recursive: true });
  await appendFile(FILE, rows.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf-8");
  await trimFileIfNeeded();
}

async function trimFileIfNeeded(): Promise<void> {
  try {
    const s = await stat(FILE);
    if (s.size < 6_000_000) return; // ~6MB üstünde buda
    const raw = await readFile(FILE, "utf-8");
    const lines = raw.split("\n").filter(Boolean).slice(-RETENTION.eventsFileMax);
    await writeFile(FILE, lines.join("\n") + "\n", "utf-8");
  } catch {
    /* ignore */
  }
}

export async function readEvents(limit = 5000): Promise<TrackedEvent[]> {
  if (supabaseConfigured()) {
    try {
      const res = await fetch(
        `${sbUrl()}/rest/v1/events?select=*&order=ts.desc&limit=${limit}`,
        { headers: sbHeaders(), cache: "no-store" }
      );
      if (res.ok) return (await res.json()) as TrackedEvent[];
    } catch {
      /* dosyaya düş */
    }
  }
  try {
    const raw = await readFile(FILE, "utf-8");
    const rows = raw
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l) as TrackedEvent);
    return rows.slice(-limit).reverse();
  } catch {
    return [];
  }
}
