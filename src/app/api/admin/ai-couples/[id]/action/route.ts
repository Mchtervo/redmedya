/**
 * Admin müdahalesi: { action: "whatsapp", text } → çifte WhatsApp yaz · { action: "call" } → asistan şimdi arasın.
 * Kara listedeki çifte hiçbir işlem yapılmaz.
 */
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { bad, readJson, str } from "@/lib/ai-couples/http";
import { callPanelHook } from "@/lib/ai-couples/integrations";
import { getCouple } from "@/lib/ai-couples/store";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const body = await readJson(request);
  const action = str(body?.action);
  const id = (await params).id;
  const couple = await getCouple(id);
  if (!couple) return bad("Bulunamadı", 404);
  if (couple.contactLocked) return bad(`Kara listede: ${couple.lockReason ?? "iletişim kapalı"}`, 423);
  if (action === "call" && couple.status === "won") return bad("Rezervasyon yapmış çift — satış araması yapılmaz (WhatsApp'tan yazabilirsiniz)", 423);

  if (action === "whatsapp") {
    const text = str(body?.text, 3000);
    if (!text) return bad("Mesaj boş");
    const r = await callPanelHook("wa", { coupleId: id, text });
    return NextResponse.json(r.data, { status: r.ok ? 200 : r.status >= 400 ? r.status : 502 });
  }
  if (action === "call") {
    const r = await callPanelHook("call", { coupleId: id });
    return NextResponse.json(r.data, { status: r.ok ? 200 : r.status >= 400 ? r.status : 502 });
  }
  return bad("Geçersiz işlem");
}
