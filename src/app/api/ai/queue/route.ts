/** n8n: şu an yapılması gereken aramalar ve WhatsApp mesajları (kurallara uyanlar). */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { buildQueue } from "@/lib/ai-couples/queue";
import { readAutomation } from "@/lib/ai-couples/automation";
import { remindStaleDrafts } from "@/lib/ai-couples/wa-drafts";
import { isWaManual } from "@/lib/ai-couples/automation";
import { forwardManual, manualExtras } from "@/lib/ai-couples/wa-manual";
import { readCouples } from "@/lib/ai-couples/store";
import { upcomingCapacity } from "@/lib/ai-couples/capacity";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const limit = Math.min(50, Math.max(1, Number(new URL(request.url).searchParams.get("limit")) || 20));
  let actions = await buildQueue(new Date(), limit);
  const auto = await readAutomation();
  // WhatsApp kısıtlıyken (manuel mod): WhatsApp işleri n8n'e verilmez; hepsi sahibine Telegram'dan kopyala-gönder olarak gider
  if (isWaManual(auto)) {
    const wa = actions.filter((a) => a.type === "whatsapp");
    actions = actions.filter((a) => a.type !== "whatsapp");
    void (async () => {
      const couples = await readCouples();
      const byId = new Map(couples.map((c) => [c.id, c]));
      let sent = 0; // her turda en fazla 6 yeni mesaj (yığılmasın; kalanlar sonraki turda)
      for (const a of wa) {
        const c = a.coupleId ? byId.get(a.coupleId) : undefined;
        if (!c || !a.text) continue;
        if (c.sourceRef === "kampanya-2027" && !c.messages.some((m) => m.direction === "in")) continue; // soğuk kampanya bu sürede durur
        if (sent >= 6) break;
        if (await forwardManual(c, a.text, a.kind ?? "other")) sent++;
      }
      const months = await upcomingCapacity(14);
      for (const c of couples) {
        if (sent >= 6) break;
        const x = manualExtras(c, months);
        if (x && (await forwardManual(c, x.text, x.kind))) sent++;
      }
    })().catch((e) => console.error("[wa-manual]", e));
  }
  // Onay bekleyen cevap önerileri 45 dk'yı geçtiyse sahibine hatırlat (bir kez)
  void remindStaleDrafts().catch(() => 0);
  // automation: arama otomasyonu (n8n A) günlük sınır ve arama arası süreyi buradan okur
  return NextResponse.json({ ok: true, actions, automation: auto });
}
