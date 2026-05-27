import { NextResponse } from "next/server";
import { readCmsConfig, getPublicCmsPayload } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await readCmsConfig();
  return NextResponse.json(getPublicCmsPayload(config));
}
