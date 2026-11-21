/**
 * Meta Instagram Messaging webhook (ücretsiz; ChatPlace'in yerine).
 * GET: Meta kurulum doğrulaması (hub.challenge). POST: gelen DM → lib/instagram-dm.
 * Gelen her mesaj Meta'dan kimliğiyle yeniden okunarak doğrulanır (sahte istek cevap tetikleyemez).
 */
import { NextResponse } from "next/server";
import { IG_WEBHOOK_VERIFY, igMesajIsle, olaylariAyikla } from "@/lib/instagram-dm";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
  const u = new URL(request.url);
  if (u.searchParams.get("hub.mode") === "subscribe" && u.searchParams.get("hub.verify_token") === IG_WEBHOOK_VERIFY) {
    return new Response(u.searchParams.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("yetkisiz", { status: 403 });
}

export async function POST(request: Request) {
  const govde = await request.json().catch(() => null);
  const olaylar = olaylariAyikla(govde).slice(0, 10);
  const sonuc: string[] = [];
  for (const o of olaylar) {
    sonuc.push(await igMesajIsle(o).catch((e) => `hata: ${e instanceof Error ? e.message : e}`));
  }
  if (olaylar.length) console.info("[instagram-webhook]", JSON.stringify(sonuc));
  return NextResponse.json({ ok: true });
}
