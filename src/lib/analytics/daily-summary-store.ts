import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";

const FILE = dataPath("daily_summary_sent.json");

type SentMap = Record<string, string>;

async function readSent(): Promise<SentMap> {
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as SentMap;
  } catch {
    return {};
  }
}

export async function wasDailySummarySent(dayKey: string): Promise<boolean> {
  const map = await readSent();
  return Boolean(map[dayKey]);
}

export async function markDailySummarySent(dayKey: string): Promise<void> {
  const map = await readSent();
  map[dayKey] = new Date().toISOString();
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(map, null, 2), "utf8");
}
