/**
 * n8n: yeni çift ekle (Düğün.com / Meta form) ve listele.
 * Authorization: Bearer <AI API anahtarı>
 */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { bad, readJson, str } from "@/lib/ai-couples/http";
import { normalizePhone } from "@/lib/ai-couples/rules";
import { ingestCouple, readCouples } from "@/lib/ai-couples/store";
import type { AiCoupleGrade, AiCoupleSource } from "@/types/ai-couples";

export const dynamic = "force-dynamic";

const SOURCES: AiCoupleSource[] = ["dugun_com", "meta_form", "web", "manual"];
const GRADES: AiCoupleGrade[] = ["hot", "warm", "cold", "blacklist"];

export async function GET(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const url = new URL(request.url);
  const grade = url.searchParams.get("grade") as AiCoupleGrade | null;
  const phone = normalizePhone(url.searchParams.get("phone"));
  const q = url.searchParams.get("q")?.toLocaleLowerCase("tr-TR").trim();
  let list = await readCouples();
  if (grade && GRADES.includes(grade)) list = list.filter((c) => c.grade === grade);
  if (phone) list = list.filter((c) => c.phone === phone);
  if (q) list = list.filter((c) => c.name.toLocaleLowerCase("tr-TR").includes(q) || c.phone.includes(q.replace(/\D/g, "") || "§"));
  return NextResponse.json({ ok: true, couples: list.slice(0, 200) });
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
