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

/** Aynı çifte aynı anda iki cevap üretilmesin (art arda gelen mesajlar) */
const busy = new Map<string, number>();
const norm = (t: string) => t.toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim().slice(0, 200);

export async function POST(request: Request, { params }: Ctx) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const id = (await params).id;
  const body = (await request.json().catch(() => ({}))) as { text?: unknown };
  const c = await getCouple(id);
  if (!c) return bad("Bulunamadı", 404);
  const skip = (reason: string) => NextResponse.json({ ok: true, action: "skip", reason });

  const auto = await readAutomation();
  if (auto.waAiMode === "off") return skip("WhatsApp yapay zekâ cevabı kapalı");
  const testPhone = auto.waAiTestPhones.includes(c.phone.replace(/\D/g, "").slice(-10));
  if (auto.waAiMode === "test" && !testPhone) return skip("şimdilik sadece test numaralarına cevap veriliyor");
  if ((c.sourceRef === "test" || /^TEST\s/.test(c.name)) && !testPhone) return skip("test kaydı");
  if (c.contactLocked) return skip("kara liste");
  if (c.status === "won") return NextResponse.json({ ok: true, action: "handoff", reason: "Rezervasyon yapmış müşteri yazdı — siz dönün." });
  if (c.status === "lost") return skip("ilgilenmiyor / kaybedildi");
  if (c.messagesPaused) return skip("otomatik mesaj iptal");

  const last = c.messages.at(-1);
  if (!last || last.direction !== "in") return skip("son mesaj müşteriden değil (zaten cevaplandı)");
  // Müşteri art arda yazdıysa sadece EN SON mesajın akışı cevap verir (hepsini birlikte okur)
  if (typeof body.text === "string" && body.text && norm(last.text) !== norm(body.text)) return skip("arkasından yeni mesaj geldi — son mesajla birlikte cevaplanacak");

  const now = Date.now();
  const ownerRecent = c.messages.some((m) => m.direction === "out" && m.kind === "reply" && !m.text.startsWith("[✓") && now - Date.parse(m.at) < 12 * 3600_000);
  // Yapay zekâ konuşmayı sahibine devrettiyse (bekletme mesajı gitti), sahibi yazana kadar 2 saat karışma
  const lastHandoff = [...c.messages].reverse().find((m) => m.kind === "ai" && m.handoff);
  if (lastHandoff && now - Date.parse(lastHandoff.at) < 2 * 3600_000) {
    const ownerAfter = c.messages.some((m) => m.direction === "out" && m.kind === "reply" && Date.parse(m.at) > Date.parse(lastHandoff.at));
    if (!ownerAfter) return NextResponse.json({ ok: true, action: "handoff", reason: "Devrettiğiniz müşteri tekrar yazdı — hâlâ sizi bekliyor.", quiet: true, name: c.name, phone: c.phone });
  }
  // Öneri modu: test numarası dışındaki müşterilere cevap GÖNDERİLMEZ, sadece sahibine Telegram'dan öneri gider
  const draftOnly = auto.waAiMode === "draft" && !testPhone;
  if (ownerRecent && !testPhone && !draftOnly) return skip("sahibi son 12 saatte bu müşteriyle yazışmış — yapay zekâ karışmıyor");

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
  const aiToday = c.messages.filter((m) => m.kind === "ai" && new Date(m.at).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" }) === today).length;
  if (aiToday >= 12) return NextResponse.json({ ok: true, action: "handoff", reason: "Bugün bu müşteriye 12 otomatik cevap gitti — devam etmek için siz dönün." });

  const t0 = busy.get(id);
  if (t0 && Date.now() - t0 < 120_000) return skip("bu çift için cevap zaten hazırlanıyor");
  busy.set(id, Date.now());
  try {
    const r = await generateWaReply(c);
    return NextResponse.json({ ok: true, ...r, draftOnly, name: c.name, phone: c.phone });
  } finally {
    setTimeout(() => busy.delete(id), 15_000);
  }
}
