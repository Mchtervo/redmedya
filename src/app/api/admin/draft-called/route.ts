import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session";
import { markDraftCalled } from "@/lib/package-drafts-store";

export async function POST(request: NextRequest) {
  const jar = await cookies();
  if (!verifyAdminSessionToken(jar.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  const body = (await request.json()) as { sessionId?: string; called?: boolean };
  if (!body.sessionId) {
    return NextResponse.json({ error: "sessionId gerekli" }, { status: 400 });
  }
  await markDraftCalled(body.sessionId, Boolean(body.called));
  return NextResponse.json({ ok: true });
}
