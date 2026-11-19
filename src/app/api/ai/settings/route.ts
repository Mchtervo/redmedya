/** n8n kurulumu: panel webhook adresi + anahtarı. POST { panelHookBase, panelHookKey } (Bearer AI anahtarı) */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { bad, readJson, str } from "@/lib/ai-couples/http";
import { readIntegrations, writeIntegrations } from "@/lib/ai-couples/integrations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const body = await readJson(request);
  const base = str(body?.panelHookBase, 300);
  const key = str(body?.panelHookKey, 200);
  if (!base || !/^https:\/\//.test(base) || !key) return bad("panelHookBase (https) ve panelHookKey zorunlu");
  await writeIntegrations({ ...(await readIntegrations()), panelHookBase: base, panelHookKey: key });
  return NextResponse.json({ ok: true });
}
