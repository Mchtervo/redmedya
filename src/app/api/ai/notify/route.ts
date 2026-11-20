/**
 * n8n → sahibine Telegram bildirimi. POST { text } (Bearer AI anahtarı)
 * Öneri modu: { text, draft: { coupleId, text } } → öneri kaydedilir, Telegram'a "✅ Gönder" düğmesiyle gider.
 * Müşteriye HİÇBİR ŞEY gitmez; sadece sahibi düğmeye basarsa gider.
 */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { bad, readJson, str } from "@/lib/ai-couples/http";
import { sendTelegramMessage } from "@/lib/lead-notify";
import { createDraftAndNotify } from "@/lib/ai-couples/wa-drafts";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const body = await readJson(request);
  const text = str(body?.text, 3500);
  if (!text) return bad("text zorunlu");
  const draft = body?.draft as { coupleId?: unknown; text?: unknown } | undefined;
  if (draft && typeof draft.coupleId === "string" && typeof draft.text === "string" && draft.text.trim()) {
    const ok = await createDraftAndNotify({ coupleId: draft.coupleId, text: draft.text, tg: text }).catch(() => false);
    if (ok) return NextResponse.json({ ok: true, draft: true });
    // düğmeli mesaj gidemezse en azından düz metin gitsin
  }
  const sent = await sendTelegramMessage(text).catch(() => false);
  return NextResponse.json({ ok: sent }, { status: sent ? 200 : 502 });
}
