import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readCmsConfig, writeCmsConfig } from "@/lib/cms";
import { COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session";
import type { SiteCmsConfig } from "@/types/cms";

async function isAuthed(): Promise<boolean> {
  const jar = await cookies();
  return verifyAdminSessionToken(jar.get(COOKIE_NAME)?.value);
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  const config = await readCmsConfig();
  return NextResponse.json(config);
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as SiteCmsConfig;
    if (!body.services?.length) {
      return NextResponse.json({ error: "En az bir hizmet gerekli" }, { status: 400 });
    }
    await writeCmsConfig(body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Kayıt başarısız" }, { status: 500 });
  }
}
