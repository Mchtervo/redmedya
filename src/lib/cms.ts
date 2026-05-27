import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { SiteCmsConfig } from "@/types/cms";
import { getDefaultCmsConfig } from "@/lib/cms-defaults";

const CMS_PATH = path.join(process.cwd(), "data", "cms.json");

export async function readCmsConfig(): Promise<SiteCmsConfig> {
  try {
    const raw = await readFile(CMS_PATH, "utf-8");
    const parsed = JSON.parse(raw) as SiteCmsConfig;
    if (!parsed.services?.length) return getDefaultCmsConfig();
    return parsed;
  } catch {
    const defaults = getDefaultCmsConfig();
    await writeCmsConfig(defaults);
    return defaults;
  }
}

export async function writeCmsConfig(config: SiteCmsConfig): Promise<void> {
  await mkdir(path.dirname(CMS_PATH), { recursive: true });
  const payload: SiteCmsConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(CMS_PATH, JSON.stringify(payload, null, 2), "utf-8");
}

export function getPublicCmsPayload(config: SiteCmsConfig) {
  return {
    services: config.services
      .filter((s) => s.isActive !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    bundleDiscounts: config.bundleDiscounts,
    coupons: config.coupons.filter((c) => c.isActive),
    campaign: config.campaign,
    updatedAt: config.updatedAt,
  };
}
