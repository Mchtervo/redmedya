/** n8n kurulumu: panel webhook adresi + anahtarı, ses anahtarı, Meta reklam okuma anahtarı. POST { panelHookBase, panelHookKey, elevenlabsKey, metaAdsToken, metaAdAccountId } (Bearer AI anahtarı) */
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
  const metaToken = str(body?.metaAdsToken, 600);
  const metaAccount = str(body?.metaAdAccountId, 40);
  const anthropic = str(body?.anthropicKey, 300);
  const meta = { metaAppId: str(body?.metaAppId, 40), metaAppSecret: str(body?.metaAppSecret, 80), metaPageId: str(body?.metaPageId, 40), metaPageToken: str(body?.metaPageToken, 600), metaVerifyToken: str(body?.metaVerifyToken, 120) };
  const metaSet = Object.fromEntries(Object.entries(meta).filter(([, v]) => v));
  const cur = await readIntegrations();
  if (base && !/^https:\/\//.test(base)) return bad("panelHookBase https olmalı");
  if (metaAccount && !/^act_\d+$/.test(metaAccount)) return bad("metaAdAccountId act_… olmalı");
  if (!base && !key && !eleven && !metaToken && !metaAccount && !anthropic && !Object.keys(metaSet).length) return bad("En az bir ayar gönderin");
  await writeIntegrations({
    ...cur,
    ...(base && key ? { panelHookBase: base, panelHookKey: key } : {}),
    ...(eleven ? { elevenlabsKey: eleven } : {}),
    ...(metaToken ? { metaAdsToken: metaToken } : {}),
    ...(metaAccount ? { metaAdAccountId: metaAccount } : {}),
    ...(anthropic ? { anthropicKey: anthropic } : {}),
    ...metaSet,
  });
  return NextResponse.json({ ok: true });
}
