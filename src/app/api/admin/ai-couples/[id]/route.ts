/**
 * Admin: çift güncelle. Kara liste kilidini AÇMAK yalnızca buradan mümkündür
 * ve { unlock: true, confirm: "KILIDI AC" } ister.
 */
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { bad, readJson, str } from "@/lib/ai-couples/http";
import { lockCouple, markThinking } from "@/lib/ai-couples/rules";
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

  const updated = await mutateCouple((await params).id, (c) => {
    let next = { ...c };
    if (unlock && c.contactLocked) {
      next = {
        ...next,
        contactLocked: false,
        grade: "cold",
        status: "contacted",
        lockReason: undefined,
        timeline: [...next.timeline, { at, type: "unlocked", text: `Kilit admin tarafından açıldı (önceki sebep: ${c.lockReason ?? "-"})` }],
      };
    }
    if (grade === "blacklist") next = lockCouple(next, str(body.reason, 200) ?? "Admin kara listeye aldı", now);
    else if (grade && !next.contactLocked) next.grade = grade;
    if (status === "thinking" && !next.contactLocked) next = markThinking(next, now, "Admin: düşünüyor olarak işaretledi");
    else if (status && !next.contactLocked) next.status = status;
    if (typeof body.note === "string") next.note = body.note.trim().slice(0, 1000) || undefined;
    if (typeof body.callbackRequested === "boolean" && !next.contactLocked) next.callbackRequested = body.callbackRequested;
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
  return NextResponse.json({ ok: true, couple: updated });
}
