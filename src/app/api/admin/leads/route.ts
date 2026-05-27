import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readLeads } from "@/lib/leads-store";
import { COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session";

export async function GET() {
  const jar = await cookies();
  if (!verifyAdminSessionToken(jar.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  const leads = await readLeads();
  return NextResponse.json(leads);
}
