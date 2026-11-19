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
  const eleven = str(body?.elevenlabsKey, 200);
  const cur = await readIntegrations();
  if (base && !/^https:\/\//.test(base)) return bad("panelHookBase https olmalı");
  if (!base && !key && !eleven) return bad("En az bir ayar gönderin");
  await writeIntegrations({
    ...cur,
    ...(base && key ? { panelHookBase: base, panelHookKey: key } : {}),
    ...(eleven ? { elevenlabsKey: eleven } : {}),
  });
  return NextResponse.json({ ok: true });
}
