/**
 * Admin: çift güncelle. Kara liste kilidini AÇMAK yalnızca buradan mümkündür
 * ve { unlock: true, confirm: "KILIDI AC" } ister.
 */
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { bad, readJson, str } from "@/lib/ai-couples/http";
import { displayPhone, lockCouple, markThinking } from "@/lib/ai-couples/rules";
import { sendTelegramMessage } from "@/lib/lead-notify";
import { adOf } from "@/lib/ai-couples/analytics";
import { mutateCouple } from "@/lib/ai-couples/store";
import type { AiCoupleGrade, AiCoupleStatus } from "@/types/ai-couples";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

const GRADES: AiCoupleGrade[] = ["hot", "warm", "cold", "blacklist"];
const STATUSES: AiCoupleStatus[] = ["new", "contacted", "info_sent", "thinking", "offer_requested", "won", "lost"];

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const body = await readJson(request);
  if (!body) return bad("Geçersiz JSON");
  const grade = str(body.grade) as AiCoupleGrade | undefined;
  if (grade && !GRADES.includes(grade)) return bad("Geçersiz derece");
  const status = str(body.status) as AiCoupleStatus | undefined;
  if (status && !STATUSES.includes(status)) return bad("Geçersiz durum");
  const unlock = body.unlock === true;
  if (unlock && str(body.confirm) !== "KILIDI AC") return bad("Kilidi açmak için onay gerekli");
  const now = new Date();
  const at = now.toISOString();

  let becameWon = false;
  const updated = await mutateCouple((await params).id, (c) => {
    let next = { ...c };
    if (status === "won" && c.status !== "won" && !c.contactLocked) becameWon = true;
    if (unlock && c.contactLocked) {
      next = {
        ...next,
        contactLocked: false,
        grade: "cold",
        status: "contacted",
        lockReason: undefined,
        lockedAt: undefined,
        timeline: [...next.timeline, { at, type: "unlocked", text: `Kilit admin tarafından açıldı (önceki sebep: ${c.lockReason ?? "-"})` }],
      };
    }
    if (grade === "blacklist") next = lockCouple(next, str(body.reason, 200) ?? "Admin kara listeye aldı", now);
    else if (grade && !next.contactLocked) next.grade = grade;
    if (status === "thinking" && !next.contactLocked) next = markThinking(next, now, "Admin: düşünüyor olarak işaretledi");
    else if (status && !next.contactLocked) {
      if (status === "won" && next.status !== "won") next.timeline = [...next.timeline, { at, type: "won", text: "Admin: rezervasyon yaptı olarak işaretledi" }];
      next.status = status;
    }
    if (typeof body.note === "string") next.note = body.note.trim().slice(0, 1000) || undefined;
    if (typeof body.callbackRequested === "boolean" && !next.contactLocked) next.callbackRequested = body.callbackRequested;
    // "Cevap verdim": telefondan / başka yerden dönüldü → çift "cevap bekliyor"dan çıkar (mesaj gönderilmez, sadece kayıt)
    if (body.markReplied === true && next.messages.at(-1)?.direction === "in") {
      next = {
        ...next,
        messages: [...next.messages, { id: randomUUID(), at, channel: "whatsapp", direction: "out", kind: "reply", text: "[✓ Cevap verildi — telefondan / elle, panelden işaretlendi]" }],
        updatedAt: at,
      };
    }
    // "Geri aradı" (elle): konuştum → otomatik tekrar arama yok; açamadım → asistan 10 dk sonra geri arar
    if ((body.inbound === "talked" || body.inbound === "missed") && !next.contactLocked) {
      if (body.inbound === "talked") {
        next = {
          ...next,
          inboundAt: at,
          status: next.status === "new" ? "contacted" : next.status,
          callbackRequested: false,
          callbackAt: undefined,
          busyRetries: 0,
          timeline: [...next.timeline, { at, type: "inbound", text: "📞 Bizi geri aradı — telefonda görüşüldü (panelden işaretlendi)" }],
        };
      } else {
        const canCall = !next.callsPaused && next.status !== "won" && next.status !== "lost";
        next = {
          ...next,
          ...(canCall ? { callbackRequested: true, callbackAt: new Date(now.getTime() + 10 * 60_000).toISOString() } : {}),
          timeline: [...next.timeline, { at, type: "inbound_missed", text: `📵 Bizi geri aradı — AÇILMADI${canCall ? " → asistan 10 dk içinde geri arayacak" : ""} (panelden işaretlendi)` }],
        };
      }
    }
    // Test kaydı işareti: sayılara girmez, otomatik aranmaz / yazılmaz
    if (typeof body.markTest === "boolean") {
      next = body.markTest
        ? { ...next, sourceRef: "test", callbackRequested: false, callbackAt: undefined, followUpAt: undefined, timeline: [...next.timeline, { at: at, type: "edit", text: "🧪 Test kaydı olarak işaretlendi — istatistiğe sayılmaz, otomatik aranmaz" }] }
        : { ...next, sourceRef: next.sourceRef === "test" ? undefined : next.sourceRef, timeline: [...next.timeline, { at: at, type: "edit", text: "Test işareti kaldırıldı — gerçek çift olarak sayılır" }] };
    }
    if (typeof body.messagesPaused === "boolean" && Boolean(next.messagesPaused) !== body.messagesPaused) {
      next = body.messagesPaused
        ? { ...next, messagesPaused: true, timeline: [...next.timeline, { at, type: "edit", text: "🚫 Otomatik WhatsApp mesajları İPTAL edildi (panelden) — kampanya / takip / hatırlatma gitmez" }] }
        : { ...next, messagesPaused: false, timeline: [...next.timeline, { at, type: "edit", text: "✅ Otomatik WhatsApp mesajları tekrar açıldı (panelden)" }] };
    }
    if (typeof body.callsPaused === "boolean" && Boolean(next.callsPaused) !== body.callsPaused) {
      const was = next.callbackAt ? ` (planlanan: ${new Date(next.callbackAt).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })})` : "";
      next = body.callsPaused
        ? { ...next, callsPaused: true, timeline: [...next.timeline, { at, type: "edit", text: `🚫 Otomatik arama İPTAL edildi (panelden)${was}` }] }
        : { ...next, callsPaused: false, timeline: [...next.timeline, { at, type: "edit", text: "✅ Otomatik arama tekrar açıldı (panelden)" }] };
    }
    if (typeof body.weddingDate === "string") {
      const wd = body.weddingDate.trim();
      if (wd === "") next.weddingDate = undefined;
      else if (/^\d{4}-\d{2}-\d{2}$/.test(wd) && !Number.isNaN(Date.parse(wd))) {
        next.weddingDate = wd;
        next.timeline = [...next.timeline, { at, type: "edit", text: `Düğün tarihi güncellendi: ${wd}` }];
      }
    }
    next.updatedAt = at;
    return next;
  });
  if (!updated) return bad("Bulunamadı", 404);
  if (becameWon) {
    const src = { dugun_com: "Düğün.com", meta_form: "Instagram/Facebook", web: "Web sitesi", manual: "Elle eklenen" }[updated.source] ?? updated.source;
    const camp = updated.source === "meta_form" ? adOf(updated).campaign : "";
    await sendTelegramMessage(
      `💍 REZERVASYON: ${updated.name} — ${displayPhone(updated.phone)}\nKaynak: ${src}${camp ? ` · Kampanya: ${camp}` : ""}${updated.weddingDate ? `\nDüğün: ${updated.weddingDate.split("-").reverse().join(".")}` : ""}\nAramalar: ${updated.calls.length} · Mesajlar: ${updated.messages.length}\nReklam maliyeti ve kâr: panel → Satış Analizi → Kazanç ve kâr`
    ).catch(() => false);
  }
  return NextResponse.json({ ok: true, couple: updated });
}
