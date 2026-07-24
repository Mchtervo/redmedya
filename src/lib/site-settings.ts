import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import type { SiteSettings } from "@/types/site-settings";
import { getDefaultSiteSettings } from "@/lib/site-settings-defaults";

const SETTINGS_PATH = dataPath("site-settings.json");

export async function readSiteSettings(): Promise<SiteSettings> {
  try {
    const raw = await readFile(SETTINGS_PATH, "utf-8");
    return { ...getDefaultSiteSettings(), ...(JSON.parse(raw) as SiteSettings) };
  } catch {
    const defaults = getDefaultSiteSettings();
    await writeSiteSettings(defaults);
    return defaults;
  }
}

export async function writeSiteSettings(settings: SiteSettings): Promise<void> {
  await mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
  await writeFile(
    SETTINGS_PATH,
    JSON.stringify({ ...settings, updatedAt: new Date().toISOString() }, null, 2),
    "utf-8"
  );
}

export function getPublicSiteSettings(settings: SiteSettings) {
  return {
    capacity: settings.capacity,
    seasonalRules: settings.seasonalRules.filter((r) => r.isActive !== false),
    blockedDates: settings.blockedDates,
    caseStudies: settings.caseStudies.filter((c) => c.isActive !== false),
    social: settings.social,
    updatedAt: settings.updatedAt,
  };
}
