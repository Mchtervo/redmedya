import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_NAME,
  createAdminSessionToken,
  verifyAdminCredentials,
  verifyAdminPassword,
} from "@/lib/admin-session";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    username?: string;
    password?: string;
  };
  const { username, password } = body;
  const ok =
    username != null
      ? Boolean(username && password && verifyAdminCredentials(username, password))
      : Boolean(password && verifyAdminPassword(password));

  if (!ok) {
    return NextResponse.json({ error: "Hatalı kullanıcı adı veya şifre" }, { status: 401 });
  }
  const token = createAdminSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}
