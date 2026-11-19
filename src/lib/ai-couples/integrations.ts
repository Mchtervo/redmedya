/**
 * Panel → n8n köprüsü ayarları (DATA_DIR/ai-integrations.json).
 * Gizli anahtarlar (WhatsApp, ElevenLabs) n8n'de kalır; site sadece n8n webhook'unu çağırır.
 */
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";

const FILE = dataPath("ai-integrations.json");

export type AiIntegrations = {
  panelHookBase?: string;
  panelHookKey?: string;
  elevenlabsKey?: string;
  /** Meta reklam hesabı okuma (ads_read) — reklam harcaması için */
  metaAdsToken?: string;
  metaAdAccountId?: string;
};

export async function readIntegrations(): Promise<AiIntegrations> {
  try {
    return JSON.parse(await readFile(FILE, "utf-8")) as AiIntegrations;
  } catch {
    return {};
  }
}

export async function writeIntegrations(v: AiIntegrations): Promise<void> {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(v, null, 2), { encoding: "utf-8", mode: 0o600 });
}

/** n8n panel webhook'unu çağırır: {base}/rm-panel-{name} */
export async function callPanelHook(name: string, body: unknown): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const cfg = await readIntegrations();
  if (!cfg.panelHookBase || !cfg.panelHookKey) {
    return { ok: false, status: 503, data: { error: "Otomasyon bağlantısı ayarlı değil" } };
  }
  const res = await fetch(`${cfg.panelHookBase.replace(/\/$/, "")}/rm-panel-${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-RM-Key": cfg.panelHookKey },
    body: JSON.stringify(body),
    // ElevenLabs arama isteği 30-60 sn sürebiliyor (arama yine de gider) → "call" için uzun bekle
    signal: AbortSignal.timeout(name === "call" || name === "prank" ? 130_000 : 45_000),
  }).catch(() => null);
  if (!res) return { ok: false, status: 504, data: { error: "Otomasyona ulaşılamadı" } };
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok && data.ok !== false, status: res.status, data };
}
