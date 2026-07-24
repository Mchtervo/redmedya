import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import type { LeadRecord } from "@/types/site-settings";

const LEADS_PATH = dataPath("leads.json");
const MAX_LEADS = 500;

export async function readLeads(): Promise<LeadRecord[]> {
  try {
    const raw = await readFile(LEADS_PATH, "utf-8");
    const parsed = JSON.parse(raw) as LeadRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function appendLead(lead: LeadRecord): Promise<void> {
  const leads = await readLeads();
  const next = [lead, ...leads].slice(0, MAX_LEADS);
  await mkdir(path.dirname(LEADS_PATH), { recursive: true });
  await writeFile(LEADS_PATH, JSON.stringify(next, null, 2), "utf-8");
}

export async function writeLeads(leads: LeadRecord[]): Promise<void> {
  await mkdir(path.dirname(LEADS_PATH), { recursive: true });
  await writeFile(
    LEADS_PATH,
    JSON.stringify(leads.slice(0, MAX_LEADS), null, 2),
    "utf-8"
  );
}

export async function updateLead(
  id: string,
  patch: Partial<LeadRecord>
): Promise<LeadRecord | null> {
  const leads = await readLeads();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx < 0) return null;
  leads[idx] = { ...leads[idx], ...patch };
  await writeLeads(leads);
  return leads[idx];
}

export async function getLeadById(id: string): Promise<LeadRecord | undefined> {
  return (await readLeads()).find((l) => l.id === id);
}

/** Rezervasyon silindiğinde teklif kaydındaki takvim bağlantısını kaldır */
export async function clearReservationFromLeads(
  reservationId: string
): Promise<void> {
  const leads = await readLeads();
  let changed = false;
  for (const lead of leads) {
    if (lead.reservationId === reservationId) {
      lead.reservationId = undefined;
      lead.status = "pending";
      changed = true;
    }
  }
  if (changed) await writeLeads(leads);
}
