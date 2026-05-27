import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { buildPackageInsights } from "@/lib/package-insights";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const insights = await buildPackageInsights();
  return NextResponse.json(insights);
}
