/**
 * n8n → WhatsApp yapay zekâ cevabı. POST (Bearer AI anahtarı)
 * Döner: { action: "send", text } | { action: "handoff", reason, draft? } | { action: "skip", reason }
 * Güvenlik: kara liste / rezervasyon / ilgilenmiyor / mesaj iptal / test → cevap yok;
 * sahibi son 12 saatte elle yazdıysa → yapay zekâ karışmaz; çift başına günde en fazla 12 otomatik cevap.
 */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { bad } from "@/lib/ai-couples/http";
import { getCouple } from "@/lib/ai-couples/store";
import { readAutomation } from "@/lib/ai-couples/automation";
import { generateWaReply } from "@/lib/ai-couples/wa-agent";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const c = await getCouple((await params).id);
  if (!c) return bad("Bulunamadı", 404);
  const skip = (reason: string) => NextResponse.json({ ok: true, action: "skip", reason });

  const auto = await readAutomation();
  if (!auto.waAiReply) return skip("WhatsApp yapay zekâ cevabı kapalı");
  if (c.sourceRef === "test" || /^TEST\s/.test(c.name)) return skip("test kaydı");
  if (c.contactLocked) return skip("kara liste");
  if (c.status === "won") return NextResponse.json({ ok: true, action: "handoff", reason: "Rezervasyon yapmış müşteri yazdı — siz dönün." });
  if (c.status === "lost") return skip("ilgilenmiyor / kaybedildi");
  if (c.messagesPaused) return skip("otomatik mesaj iptal");

  const last = c.messages.at(-1);
  if (!last || last.direction !== "in") return skip("son mesaj müşteriden değil (zaten cevaplandı)");

  const now = Date.now();
  const ownerRecent = c.messages.some((m) => m.direction === "out" && m.kind === "reply" && !m.text.startsWith("[") && now - Date.parse(m.at) < 12 * 3600_000);
  if (ownerRecent) return skip("sahibi son 12 saatte bu müşteriyle yazışmış — yapay zekâ karışmıyor");

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
  const aiToday = c.messages.filter((m) => m.kind === "ai" && new Date(m.at).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" }) === today).length;
  if (aiToday >= 12) return NextResponse.json({ ok: true, action: "handoff", reason: "Bugün bu müşteriye 12 otomatik cevap gitti — devam etmek için siz dönün." });

  const r = await generateWaReply(c);
  return NextResponse.json({ ok: true, ...r });
}
