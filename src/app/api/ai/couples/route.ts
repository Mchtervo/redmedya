/**
 * n8n: yeni çift ekle (Düğün.com / Meta form) ve listele.
 * Authorization: Bearer <AI API anahtarı>
 */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { bad, readJson, str } from "@/lib/ai-couples/http";
import { normalizePhone } from "@/lib/ai-couples/rules";
import { ingestCouple, readCouples } from "@/lib/ai-couples/store";
import { readAutomation } from "@/lib/ai-couples/automation";
import { hitapFor } from "@/lib/ai-couples/hitap";
import { resolveLid, shouldAlertLid } from "@/lib/ai-couples/wa-lid";
import { sendTelegramMessage } from "@/lib/lead-notify";
import type { AiCoupleGrade, AiCoupleSource } from "@/types/ai-couples";

export const dynamic = "force-dynamic";

const SOURCES: AiCoupleSource[] = ["dugun_com", "meta_form", "web", "manual"];
const GRADES: AiCoupleGrade[] = ["hot", "warm", "cold", "blacklist"];

export async function GET(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const url = new URL(request.url);
  // WhatsApp gizli kimlik (numara yerine "...@lid"): doğru çifti bul, bulamazsan sahibine ilet
  const lid = url.searchParams.get("lid")?.trim();
  if (lid && !url.searchParams.get("phone")) {
    const push = (url.searchParams.get("push") ?? "").slice(0, 80);
    const fromMe = url.searchParams.get("fromMe") === "true";
    const text = (url.searchParams.get("text") ?? "").slice(0, 600);
    const c = await resolveLid(lid, push, fromMe).catch(() => null);
    if (!c && !fromMe && text && shouldAlertLid(`${lid}|${text}`)) {
      await sendTelegramMessage(`📩 WhatsApp'tan NUMARASI GİZLİ bir mesaj geldi — kimin olduğunu bulamadım, lütfen telefondan bakın.\n👤 Görünen ad: ${push || "(yok)"}\n💬 Mesaj: ${text}`).catch(() => false);
    }
    return NextResponse.json({ ok: true, couples: c ? [{ ...c, hitap: hitapFor(c.name).hitap }] : [], lidResolved: Boolean(c) });
  }
  const grade = url.searchParams.get("grade") as AiCoupleGrade | null;
  const phone = normalizePhone(url.searchParams.get("phone"));
  const q = url.searchParams.get("q")?.toLocaleLowerCase("tr-TR").trim();
  let list = await readCouples();
  if (grade && GRADES.includes(grade)) list = list.filter((c) => c.grade === grade);
  if (phone) list = list.filter((c) => c.phone === phone);
  if (q) list = list.filter((c) => c.name.toLocaleLowerCase("tr-TR").includes(q) || c.phone.includes(q.replace(/\D/g, "") || "§"));
  // automation: WhatsApp kampanyası (n8n K) günlük sınır ve bekleme süresini buradan okur
  // hitap: "Ayşe Hanım" / "Mehmet Bey" — n8n WhatsApp mesajları bunu kullanır
  return NextResponse.json({ ok: true, couples: list.slice(0, 200).map((c) => ({ ...c, hitap: hitapFor(c.name).hitap })), automation: await readAutomation() });
}

export async function POST(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return bad("Geçersiz JSON");
  const source = str(body.source) as AiCoupleSource | undefined;
  if (!source || !SOURCES.includes(source)) {
    return bad(`source şunlardan biri olmalı: ${SOURCES.join(", ")}`);
  }
  const result = await ingestCouple({
    name: str(body.name, 120),
    phone: str(body.phone, 40) ?? "",
    weddingDate: str(body.weddingDate, 20),
    city: str(body.city, 80),
    source,
    sourceRef: str(body.sourceRef, 120),
    note: str(body.note, 1000),
  });
  if (!result.ok) return bad(result.error, 422);
  return NextResponse.json(
    {
      ok: true,
      created: result.created,
      locked: result.couple.contactLocked,
      couple: result.couple,
    },
    { status: result.created ? 201 : 200 }
  );
}
