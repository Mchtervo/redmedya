/** Admin: kampanya / otomatik arama durumunu gör, durdur, başlat. GET · POST { target: "kampanya"|"arama", op: "pause"|"resume" } */
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { bad, readJson, str } from "@/lib/ai-couples/http";
import { callPanelHook } from "@/lib/ai-couples/integrations";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const r = await callPanelHook("kampanya", { op: "status" });
  return NextResponse.json(r.data, { status: r.ok ? 200 : 502 });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const body = await readJson(request);
  const op = str(body?.op);
  const target = str(body?.target) ?? "kampanya";
  if (op !== "pause" && op !== "resume") return bad("op: pause | resume");
  if (target !== "kampanya" && target !== "arama") return bad("target: kampanya | arama");
  const r = await callPanelHook("kampanya", { op, target });
  return NextResponse.json(r.data, { status: r.ok ? 200 : 502 });
}
