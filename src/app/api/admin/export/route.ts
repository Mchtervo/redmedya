import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { DATA_DIR_META } from "@/lib/data-dir";
import { readCmsConfig } from "@/lib/cms";
import { readSiteSettings } from "@/lib/site-settings";
import { readLeads } from "@/lib/leads-store";
import { readReservations } from "@/lib/reservations-store";
import { readRehber } from "@/lib/rehber-store";
import { readPackageDrafts } from "@/lib/package-drafts-store";
import { buildPackageInsights } from "@/lib/package-insights";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const [cms, siteSettings, leads, reservations, rehber, drafts, insights] =
    await Promise.all([
      readCmsConfig(),
      readSiteSettings(),
      readLeads(),
      readReservations(),
      readRehber(),
      readPackageDrafts(),
      buildPackageInsights(),
    ]);

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    storage: DATA_DIR_META,
    cms,
    siteSettings,
    leads,
    reservations,
    rehber,
    packageDrafts: drafts,
    insights,
  });
}
