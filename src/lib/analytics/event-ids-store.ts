import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";

const FILE = dataPath("analytics_event_ids.json");
const MAX_IDS = 50_000;

type FileShape = { ids: string[] };

async function readSafe(): Promise<Set<string>> {
  try {
    const raw = JSON.parse(await readFile(FILE, "utf-8")) as FileShape;
    return new Set(Array.isArray(raw.ids) ? raw.ids : []);
  } catch {
    return new Set();
  }
}

async function writeSafe(ids: Set<string>): Promise<void> {
  await mkdir(path.dirname(FILE), { recursive: true });
  let list = [...ids];
  if (list.length > MAX_IDS) list = list.slice(-MAX_IDS);
  await writeFile(FILE, JSON.stringify({ ids: list }), "utf-8");
}

/** Dedupe set'i yükle; yeni id'leri ekle ve kalıcılaştır. */
export async function claimClientEventIds(
  candidates: string[]
): Promise<{ accepted: string[]; duplicates: string[] }> {
  if (!candidates.length) return { accepted: [], duplicates: [] };
  const seen = await readSafe();
  const accepted: string[] = [];
  const duplicates: string[] = [];
  for (const id of candidates) {
    if (seen.has(id)) duplicates.push(id);
    else {
      seen.add(id);
      accepted.push(id);
    }
  }
  if (accepted.length) await writeSafe(seen);
  return { accepted, duplicates };
}

export async function loadSeenClientEventIds(): Promise<Set<string>> {
  return readSafe();
}

export async function persistSeenClientEventIds(ids: Set<string>): Promise<void> {
  await writeSafe(ids);
}
