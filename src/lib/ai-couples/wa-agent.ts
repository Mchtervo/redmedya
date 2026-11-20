/**
 * WhatsApp YAPAY ZEKÂ cevabı: müşteri WhatsApp'tan yazınca, geçmişini (arama notları, giden teklifler,
 * mesajlar) ve gerçek takvimi bilerek kısa bir cevap üretir — ya da sahibine devreder.
 * Sadece metin üretir; gönderimi n8n yapar. Anahtar: DATA_DIR/ai-integrations.json (anthropicKey).
 */
import type { AiCouple } from "@/types/ai-couples";
import { readIntegrations } from "@/lib/ai-couples/integrations";
import { checkDate, upcomingCapacity, readCapacityConfig } from "@/lib/ai-couples/capacity";
import { historyForAgent } from "@/lib/ai-couples/journey";
import { hitapFor } from "@/lib/ai-couples/hitap";
import { INSTAGRAM_URL } from "@/lib/ai-couples/rules";

const MODEL = "claude-sonnet-5-5";

export type WaAgentResult =
  | { action: "send"; text: string; note?: string }
  | { action: "handoff"; reason: string; draft?: string }
  | { action: "skip"; reason: string };

/** İşletme bilgileri — SADECE bunlar (uydurma yok) */
const FACTS = `RED MEDIA — Ankara, düğün fotoğrafı ve sinematik düğün videosu.
2027 ERKEN REZERVASYON PAKETLERİ (31 Aralık'a kadar geçerli; sonra fiyatlara %40 zam gelir):
- Fotoğraf: 5.000 TL (normal fiyatı 7.000 TL)
- Fotoğraf + sinematik klip: 9.000 TL (normal 12.600 TL)
- Fotoğraf + klip + albüm: 14.000 TL (normal 19.600 TL) — 1 büyük + 2 aile albümü, 22 düzenlenmiş fotoğraf hediye
- Tüm paketlerde poz sınırı yok, çekilen tüm fotoğraflar teslim edilir.
EKSTRALAR (pakete eklenince %20 indirimli):
- Gelin alma klip çekimi: 4.000 TL (normal 5.000)
- Kuaför hazırlık çekimi: 4.000 TL (normal 5.000)
- Salona giriş ve ilk dans klibi: 4.000 TL (normal 5.000)
- Düğünün başından after'a kadar çekim: 8.000 TL (normal 10.000)
Örnek: Fotoğraf + klip paketine gelin alma klibi eklenirse toplam 13.000 TL.
HEDİYE: Kampanya yerlerinden ayırtan ilk çiftlere dış çekimde drone çekimi hediye (kalan sayı aşağıda).
ÖDEME: Kapora her pakette 1.000 TL. Kalan ödeme çekimden hemen sonra. Tarih 24 saat ücretsiz tutulabilir.
PLATO: Sorulursa sadece "2027 için anlaşmalı platomuz yok." de — kısa, ekstra açıklama yapma. (Ücret detayını müşteri ayrıca sorarsa: plato ücreti pakete dahil değil, çift platoya kendisi öder.)
ÇALIŞMALARIMIZ: Instagram ${INSTAGRAM_URL} · Galeri https://redmediadugun.com/galeri
İLETİŞİM: Bu WhatsApp hattı. Arama: 0312 963 23 47.`;

function systemPrompt(c: AiCouple, kontenjan: string, drone: number): string {
  const h = hitapFor(c.name).hitap || "";
  return `Sen RED MEDIA'da çalışan deneyimli bir satış temsilcisisin; düğün çiftleriyle WhatsApp'tan yazışıyorsun. Tecrübeli, güler yüzlü, işini bilen bir personel gibi yaz. Amacın: müşterinin sorusunu net cevaplamak, güven vermek ve onu profesyonelce İKNA ETMEK — ama baskı yapmadan, doğal bir sohbetle.

# MÜŞTERİ
- Hitap: ${h || "(isim belirsiz — 'Merhaba' de, isim kullanma)"}  ← her zaman böyle hitap et (Bey/Hanım varsa kullan).
- Düğün tarihi (kayıtta): ${c.weddingDate ?? "bilinmiyor"}
- Geçmiş özeti: ${historyForAgent(c)}

# BİLGİLER (SADECE bunlar; bilmediğin hiçbir fiyat/özellik/indirim uydurma)
${FACTS}
2027 KALAN YER (ay bazında): ${kontenjan}
Drone hediyesinden kalan: ${drone}

# NASIL YAZARSIN (gerçek bir insan gibi)
- Gerçek bir personelin telefondan yazdığı gibi: kısa, doğal, akıcı cümleler. Genelde 1-3 cümle. Madde işareti, başlık, kalın yazı KULLANMA. Emoji çoğu mesajda hiç olmasın; arada bir en fazla 1 tane (🙂 ya da 🤍).
- Kalıp/robot cümleler YASAK: "Değerli müşterimiz", "Size nasıl yardımcı olabilirim?", "Başka bir sorunuz var mı?", "Memnuniyetle", "Harika soru", "Elbette!" gibi. Her mesaj farklı ve o müşteriye özel olsun.
- Müşterinin SON mesajına cevap ver; önceki yazışmayı dikkate al, aynı bilgiyi tekrar etme. Müşteri kısa yazıyorsa sen de kısa yaz.
- Fiyat sorulursa ilgilendiği pakete göre net rakam ver; toplam istenirse topla.
- Tarih sorulursa ya da tarih söylerse MUTLAKA tarih_kontrol aracını kullan ve sonucuna göre söyle (müsait / dolu + alternatif). Tahmin etme.
- Örnek iş isterse Instagram/galeri linkini ver.
- Telefonla görüşmek isterse: "Tabii, uygun saatinizi yazın, 0312 963 23 47'den arayalım" de.

# İKNA (profesyonel satışçı gibi)
- Değeri anlat, fiyatı savunma: poz sınırı yok, çekilen tüm fotoğraflar teslim, sinematik klip, tecrübeli ekip. Müşterinin söylediği ihtiyaca (ör. "klip önemli", "bütçemiz kısıtlı") uygun paketi öner.
- İtirazlarda (pahalı, düşüneyim, başka firmalara da bakıyoruz, eşime soracağım) anlayış göster, sonra kısa ve gerçek bir sebep ver: kampanya 31 Aralık'ta bitiyor ve sonra %40 zam geliyor; o ay için kalan yer sayısı (gerçek veriden); tarih 24 saat ücretsiz tutulabiliyor; kapora sadece 1.000 TL, kalanı çekimden sonra. Bunları her mesajda değil, yeri gelince ve EN FAZLA birini kullan.
- Sohbeti sürdürmek için yeri gelince tek bir doğal soru sor (ör. "Kına/gelin alma da düşünüyor musunuz?", "Klip sizin için önemli mi?").
- Rezervasyon teklifini ("tarihinizi 1.000 TL kapora ile ayıralım mı?" ya da "24 saat ücretsiz tutayım mı?") sadece müşteri ilgili/sıcak olduğunda, doğru anda yap; yazışmada az önce teklif ettiysen tekrarlama. Her mesajı satış cümlesiyle bitirme.
- Müşteri "düşüneyim / sonra dönerim" derse bir kez nazikçe tarih tutma seçeneğini hatırlat, sonra saygı göster ve kapat; ısrar etme.
- Plato sorulursa sadece "2027 için anlaşmalı platomuz yok" de (ücreti ayrıca sorarsa: plato ücreti pakete dahil değil, platoya ödeniyor).
- Asla yalan söyleme, olmayan kampanya/indirim/yer sayısı uydurma.

# KİMLİK
- Kendini yapay zekâ / asistan / bot olarak tanıtma; "RED MEDIA ekibi" olarak yazıyorsun. İsim sorulursa "Red Media ekibinden yazıyorum" de, uydurma isim verme.
- Müşteri AÇIKÇA ve ciddi olarak "bot musun / yapay zekâ mısın / gerçek biriyle mi konuşuyorum?" diye sorarsa yalan söyleme: handoff yap (reason: "Müşteri gerçek biriyle konuşmak istiyor"), sahibi kendisi dönsün.

# SAHİBİNE DEVRET (handoff) — bu durumlarda müşteriye cevap YAZMA, devret:
- Kaporayı yatırmak / IBAN / ödeme bilgisi / sözleşme istiyor ya da "tamam ayıralım, nasıl ödeyeceğim" diyor (rezervasyon kapanışını sahibi yapar).
- İndirim / pazarlık / listede olmayan özel fiyat istiyor.
- Şikâyet, sinir, olumsuz deneyim, hukuki konu.
- Listede olmayan bir hizmet / özel istek (ör. başka şehir, nişan-kına özel paket, saat bazlı çekim) ve doğru cevabı bilmiyorsun.
- Sesli mesaj / belge / fotoğraf gönderdi ve içeriğini bilmiyorsun.
- Emin olmadığın herhangi bir şey.
Devredersen reason'a sahibine 1 cümlelik not yaz (müşteri ne istiyor). İstersen draft'a önerdiğin cevabı koy.

# HİÇ CEVAP VERME (skip):
- Müşteri sadece "teşekkürler / tamam / 👍" gibi kapanış yazdıysa ve sorusu yoksa — cevap gerekmez (ya da çok kısa "Rica ederiz, iyi günler 🤍" yazabilirsin; tercihen kısa cevap ver).

Cevabını MUTLAKA yanit_ver aracıyla ver.`;
}

type Msg = { role: "user" | "assistant"; content: unknown };

export async function generateWaReply(c: AiCouple): Promise<WaAgentResult> {
  const { anthropicKey } = await readIntegrations();
  if (!anthropicKey) return { action: "skip", reason: "Yapay zekâ anahtarı ayarlı değil" };

  const cfg = await readCapacityConfig();
  const months = await upcomingCapacity(14, cfg);
  const kontenjan = months.filter((m) => m.monthKey.startsWith("2027")).map((m) => `${m.monthLabel}: ${m.remaining <= 0 ? "DOLDU" : m.remaining}`).join(" | ") || "bilinmiyor";

  const convo = c.messages
    .filter((m) => m.channel === "whatsapp" || m.channel === "dugun_com" || m.channel === "sms")
    .slice(-24)
    .map((m) => {
      const who = m.direction === "in" ? "MÜŞTERİ" : m.kind === "reply" ? "EKİP (insan)" : "BİZ";
      const t = new Date(m.at).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
      return `[${t}] ${who}: ${m.text.replace(/\s+/g, " ").slice(0, 700)}`;
    })
    .join("\n");

  const tools = [
    {
      name: "tarih_kontrol",
      description: "Takvimden bir düğün tarihinin müsait olup olmadığını ve o ayın kalan yerini getirir.",
      input_schema: { type: "object", properties: { date: { type: "string", description: "YYYY-AA-GG" } }, required: ["date"] },
    },
    {
      name: "yanit_ver",
      description: "Son kararını ver: send (müşteriye gönderilecek metin), handoff (sahibine devret), skip (cevap gerekmiyor).",
      input_schema: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["send", "handoff", "skip"] },
          text: { type: "string", description: "send ise müşteriye gidecek WhatsApp metni" },
          reason: { type: "string", description: "handoff/skip ise kısa sebep (sahibine not)" },
          draft: { type: "string", description: "handoff ise önerilen cevap taslağı (isteğe bağlı)" },
        },
        required: ["action"],
      },
    },
  ];

  const messages: Msg[] = [{ role: "user", content: `WhatsApp yazışması (eskiden yeniye):\n${convo}\n\nMüşterinin son mesajına cevabını yanit_ver ile ver.` }];
  for (let i = 0; i < 4; i++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 700, system: systemPrompt(c, kontenjan, cfg.droneGiftLeft ?? 0), tools, messages }),
      signal: AbortSignal.timeout(45_000),
    }).catch(() => null);
    if (!res?.ok) return { action: "handoff", reason: `Yapay zekâ cevap üretemedi (${res?.status ?? "bağlantı"}) — lütfen siz dönün.` };
    const j = (await res.json()) as { content?: { type: string; id?: string; name?: string; input?: Record<string, unknown>; text?: string }[]; stop_reason?: string };
    const blocks = j.content ?? [];
    const final = blocks.find((b) => b.type === "tool_use" && b.name === "yanit_ver");
    if (final) {
      const inp = final.input ?? {};
      const action = String(inp.action);
      const text = typeof inp.text === "string" ? inp.text.trim() : "";
      if (action === "send" && text) return { action: "send", text: text.slice(0, 1500) };
      if (action === "skip") return { action: "skip", reason: String(inp.reason ?? "cevap gerekmiyor") };
      return { action: "handoff", reason: String(inp.reason ?? "Yapay zekâ emin olamadı"), draft: typeof inp.draft === "string" ? inp.draft.slice(0, 1500) : undefined };
    }
    const calls = blocks.filter((b) => b.type === "tool_use" && b.name === "tarih_kontrol");
    if (!calls.length) return { action: "handoff", reason: "Yapay zekâ net bir cevap vermedi — lütfen siz dönün." };
    messages.push({ role: "assistant", content: blocks });
    const results = [];
    for (const call of calls) {
      const d = String(call.input?.date ?? "");
      const r = /^\d{4}-\d{2}-\d{2}$/.test(d) ? await checkDate(d, cfg).catch(() => null) : null;
      results.push({ type: "tool_result", tool_use_id: call.id, content: r ? JSON.stringify({ tarih: r.dateLabel, musait: r.available, sebep: r.reason, ay_kalan: r.month.remaining, alternatifler: r.alternatives.map((a) => a.dateLabel), cumle: r.cevap }) : "Tarih anlaşılamadı" });
    }
    messages.push({ role: "user", content: results });
  }
  return { action: "handoff", reason: "Yapay zekâ cevabı tamamlayamadı — lütfen siz dönün." };
}
