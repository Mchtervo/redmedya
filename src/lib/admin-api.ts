import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session";

export async function requireAdminSession(): Promise<
  { ok: true } | { ok: false; response: NextResponse }
> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!verifyAdminSessionToken(token)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Yetkisiz" }, { status: 401 }),
    };
  }
  return { ok: true };
}
