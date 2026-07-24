import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import type { PackageDraftRecord } from "@/types/package-drafts";

const PATH = dataPath("package-drafts.json");
const MAX = 800;

export async function readPackageDrafts(): Promise<PackageDraftRecord[]> {
  try {
    const raw = await readFile(PATH, "utf-8");
    const parsed = JSON.parse(raw) as PackageDraftRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(list: PackageDraftRecord[]): Promise<void> {
  await mkdir(path.dirname(PATH), { recursive: true });
  await writeFile(PATH, JSON.stringify(list.slice(0, MAX), null, 2), "utf-8");
}

export async function upsertPackageDraft(
  draft: PackageDraftRecord
): Promise<PackageDraftRecord> {
  const list = await readPackageDrafts();
  const idx = list.findIndex((d) => d.sessionId === draft.sessionId);
  const existing = idx >= 0 ? list[idx] : null;
  const merged: PackageDraftRecord = {
    ...existing,
    ...draft,
    createdAt: existing?.createdAt ?? draft.createdAt,
    whatsappClicked:
      draft.whatsappClicked || existing?.whatsappClicked || false,
    leadId: draft.leadId ?? existing?.leadId,
  };
  if (idx >= 0) list[idx] = merged;
  else list.unshift(merged);
  list.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  await writeAll(list);
  return merged;
}

export async function markDraftWhatsAppClicked(
  sessionId: string,
  leadId?: string
): Promise<void> {
  const list = await readPackageDrafts();
  const idx = list.findIndex((d) => d.sessionId === sessionId);
  if (idx < 0) return;
  list[idx] = {
    ...list[idx],
    whatsappClicked: true,
    leadId: leadId ?? list[idx].leadId,
    updatedAt: new Date().toISOString(),
  };
  await writeAll(list);
}

export async function getDraftBySessionId(
  sessionId: string
): Promise<PackageDraftRecord | undefined> {
  return (await readPackageDrafts()).find((d) => d.sessionId === sessionId);
}

/** §12 — "Arandı" işaretini güncelle */
export async function markDraftCalled(
  sessionId: string,
  called: boolean
): Promise<void> {
  const list = await readPackageDrafts();
  const idx = list.findIndex((d) => d.sessionId === sessionId);
  if (idx < 0) return;
  list[idx] = { ...list[idx], called, updatedAt: new Date().toISOString() };
  await writeAll(list);
}
