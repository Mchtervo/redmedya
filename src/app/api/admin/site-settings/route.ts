import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readSiteSettings, writeSiteSettings } from "@/lib/site-settings";
import { COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session";
import type { SiteSettings } from "@/types/site-settings";

async function isAuthed(): Promise<boolean> {
  const jar = await cookies();
  return verifyAdminSessionToken(jar.get(COOKIE_NAME)?.value);
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  return NextResponse.json(await readSiteSettings());
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as SiteSettings;
    await writeSiteSettings(body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Kayıt başarısız" }, { status: 500 });
  }
}
