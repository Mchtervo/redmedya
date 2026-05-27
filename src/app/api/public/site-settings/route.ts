import { NextResponse } from "next/server";
import { readSiteSettings, getPublicSiteSettings } from "@/lib/site-settings";

export async function GET() {
  const settings = await readSiteSettings();
  return NextResponse.json(getPublicSiteSettings(settings));
}
