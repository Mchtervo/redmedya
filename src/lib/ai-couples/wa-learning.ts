/**
 * WhatsApp asistanının SAHİBİNDEN öğrenmesi.
 *
 * 1) Kurallar: asistan bir cevap önerdi, sahibi farklı yazdı → ikisi karşılaştırılır, genel bir ders varsa
 *    Telegram'dan "Bundan sonra böyle yapayım mı?" diye sorulur. Sahibi onaylarsa kural olur ve her cevapta uygulanır.
 *    Sahibinin onayı olmadan HİÇBİR kural eklenmez.
 * 2) Örnekler: sahibinin müşterilere elle yazdığı cevaplar (müşterinin sorusuyla birlikte) saklanır;
 *    asistan her cevapta konuya en yakın birkaç örneğe bakıp sahibinin üslubuna benzer yazar.
 *
 * Dosyalar: DATA_DIR/ai-wa-rules.json, DATA_DIR/ai-wa-examples.json
 */
import { randomUUID } from "crypto";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import { getCouple, readCouples } from "@/lib/ai-couples/store";
import { readIntegrations } from "@/lib/ai-couples/integrations";
import { getDraft, matchOwnerReply, tgApi, tgChatId, type WaDraft } from "@/lib/ai-couples/wa-drafts";
import type { AiCouple } from "@/types/ai-couples";

const RULES_FILE = dataPath("ai-wa-rules.json");
const EXAMPLES_FILE = dataPath("ai-wa-examples.json");
const MODEL = "claude-sonnet-5-5";

export type WaRule = {
  id: string;
  text: string;
  why?: string;
  status: "pending" | "active" | "rejected";
  createdAt: string;
  decidedAt?: string;
  source?: { customer: string; draft: string; owner: string; name: string };
};

export type WaExample = { id: string; at: string; name: string; customer: string; owner: string; coupleId: string };

/* ---------------- dosya erişimi (sırayla) ---------------- */

const chains = new Map<string, Promise<unknown>>();
function withFile<T, R>(file: string, fallback: () => Promise<T[]>, fn: (list: T[]) => Promise<{ list?: T[]; out: R }>, max: number): Promise<R> {
  const prev = chains.get(file) ?? Promise.resolve();
  const run = prev.then(async () => {
    let list: T[];
    try {
      list = JSON.parse(await readFile(file, "utf-8")) as T[];
    } catch {
      list = await fallback();
    }
    const r = await fn(list);
    if (r.list) {
      await mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(r.list.slice(-max), null, 1), "utf-8");
      await rename(tmp, file);
    }
    return r.out;
  });
  chains.set(file, run.catch(() => undefined));
  return run;
}

const rulesDo = <R>(fn: (list: WaRule[]) => Promise<{ list?: WaRule[]; out: R }>) => withFile<WaRule, R>(RULES_FILE, async () => [], fn, 200);
const examplesDo = <R>(fn: (list: WaExample[]) => Promise<{ list?: WaExample[]; out: R }>) => withFile<WaExample, R>(EXAMPLES_FILE, seedExamples, fn, 120);

const clean = (t: string) => t.replace(/\s+/g, " ").trim();
const isUsable = (t: string) => {
  const s = clean(t);
  return s.length >= 6 && s.length <= 700 && !s.startsWith("[");
};

/** İlk açılışta: geçmişte sahibinin elle yazdığı cevaplardan örnek bankası kur */
async function seedExamples(): Promise<WaExample[]> {
  const out: WaExample[] = [];
  const couples = await readCouples().catch(() => [] as AiCouple[]);
  for (const c of couples) {
    if (c.sourceRef === "test") continue;
    const msgs = [...c.messages].sort((a, b) => a.at.localeCompare(b.at));
    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i];
      if (m.direction !== "out" || m.kind !== "reply" || !isUsable(m.text)) continue;
      const prevIn = [...msgs.slice(0, i)].reverse().find((x) => x.direction === "in");
      if (!prevIn || !isUsable(prevIn.text) || Date.parse(m.at) - Date.parse(prevIn.at) > 2 * 86400_000) continue;
      const last = out.at(-1);
      // aynı soruya art arda yazılan birkaç mesaj → tek örnek
      if (last && last.coupleId === c.id && last.customer === clean(prevIn.text)) {
        last.owner = `${last.owner}\n${clean(m.text)}`.slice(0, 900);
        continue;
      }
      out.push({ id: randomUUID().slice(0, 8), at: m.at, name: c.name, coupleId: c.id, customer: clean(prevIn.text).slice(0, 500), owner: clean(m.text).slice(0, 900) });
    }
  }
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

/* ---------------- asistana verilen kısım ---------------- */

const words = (t: string) =>
  new Set(
    t
      .toLocaleLowerCase("tr-TR")
      .replace(/[^\p{L}\p{N} ]+/gu, " ")
      .split(" ")
      .filter((w) => w.length >= 4)
      .map((w) => w.slice(0, 5)), // kök gibi: "fiyatı/fiyatlar" → "fiyat"
  );

/** Her cevapta asistanın sistem mesajına eklenir: onaylı kurallar + konuya en yakın sahibi cevapları */
export async function learningPromptBlock(lastCustomerText: string): Promise<string> {
  const rules = await rulesDo(async (l) => ({ out: l.filter((r) => r.status === "active") }));
  const examples = await examplesDo(async (l) => ({ out: l }));
  const q = words(lastCustomerText);
  const now = Date.now();
  const scored = examples
    .map((e) => {
      const w = words(e.customer);
      let hit = 0;
      for (const x of q) if (w.has(x)) hit++;
      const ageDays = (now - Date.parse(e.at)) / 86400_000;
      return { e, s: hit * 3 + Math.max(0, 2 - ageDays / 15) };
    })
    .sort((a, b) => b.s - a.s)
    .slice(0, 6)
    .map((x) => x.e);
  const parts: string[] = [];
  if (rules.length) {
    parts.push(
      `# SAHİBİNİN ONAYLADIĞI KURALLAR (bunlara MUTLAKA uy; yukarıdaki bilgilerle çelişirse BU KURALLAR geçerli)\n` +
        rules.slice(-40).map((r, i) => `${i + 1}. ${r.text}`).join("\n"),
    );
  }
  if (scored.length) {
    parts.push(
      `# SAHİBİNİN MÜŞTERİLERE GERÇEKTE YAZDIĞI CEVAPLARDAN ÖRNEKLER\nÜslubu, kısalığı ve samimiyeti örnek al. İçlerindeki fiyat/bilgi eskimiş olabilir — fiyat ve bilgi için yukarıdaki bilgiler ve kurallar esastır. Kelimesi kelimesine kopyalama.\n` +
        scored.map((e) => `- Müşteri: "${e.customer.slice(0, 220)}"\n  Sahibi: "${e.owner.slice(0, 350)}"`).join("\n"),
    );
  }
  return parts.join("\n\n");
}

/* ---------------- sahibi müşteriye elle yazdı ---------------- */

const analyzing = new Set<string>();

/** messages uç noktası çağırır: sahibi (telefondan / panelden) müşteriye yazdı */
export async function onOwnerReply(coupleId: string, text: string): Promise<void> {
  if (!isUsable(text)) return;
  const match = await matchOwnerReply(coupleId, text);
  if (match?.kind === "approval") return; // onaylanan önerinin kendisi — sahibinin yazısı değil
  const c = await getCouple(coupleId);
  if (!c || c.sourceRef === "test") {
    // test numarasında da öğrenme önerisi çalışsın (deneme yapılabilsin), ama örnek bankasına girmesin
    if (c && match?.kind === "edited") scheduleAnalysis(match.draft.id);
    return;
  }
  const msgs = [...c.messages].sort((a, b) => a.at.localeCompare(b.at));
  const lastIn = [...msgs].reverse().find((m) => m.direction === "in");
  if (lastIn && isUsable(lastIn.text) && Date.now() - Date.parse(lastIn.at) < 2 * 86400_000) {
    const customer = clean(lastIn.text).slice(0, 500);
    await examplesDo(async (list) => {
      const last = list.at(-1);
      if (last && last.coupleId === c.id && last.customer === customer && Date.now() - Date.parse(last.at) < 15 * 60_000) {
        if (last.owner.includes(clean(text))) return { out: null };
        return { list: list.map((e) => (e.id === last.id ? { ...e, owner: `${e.owner}\n${clean(text)}`.slice(0, 900), at: new Date().toISOString() } : e)), out: null };
      }
      return { list: [...list, { id: randomUUID().slice(0, 8), at: new Date().toISOString(), name: c.name, coupleId: c.id, customer, owner: clean(text).slice(0, 900) }], out: null };
    });
  }
  if (match?.kind === "edited") scheduleAnalysis(match.draft.id);
}

/** Sahibi art arda birkaç mesaj yazabilir → 2 dk bekle, hepsini birlikte karşılaştır */
function scheduleAnalysis(draftId: string) {
  if (analyzing.has(draftId)) return;
  analyzing.add(draftId);
  setTimeout(() => {
    void analyzeDraft(draftId)
      .catch((e) => console.error("[wa-learning] analiz hatası", e))
      .finally(() => setTimeout(() => analyzing.delete(draftId), 60 * 60_000));
  }, 120_000);
}

async function analyzeDraft(draftId: string): Promise<void> {
  const d = await getDraft(draftId);
  if (!d?.ownerText) return;
  const c = await getCouple(d.coupleId);
  const customer = c ? [...c.messages].filter((m) => m.direction === "in" && Date.parse(m.at) <= Date.parse(d.createdAt)).slice(-3).map((m) => clean(m.text)).join(" / ") : "";
  const proposal = await proposeRule(customer, d);
  if (!proposal) return;
  const rule: WaRule = { id: randomUUID().replace(/-/g, "").slice(0, 12), text: proposal.rule, why: proposal.why, status: "pending", createdAt: new Date().toISOString(), source: { customer: customer.slice(0, 400), draft: d.text.slice(0, 600), owner: d.ownerText.slice(0, 600), name: d.name } };
  await rulesDo(async (l) => ({ list: [...l, rule], out: null }));
  const chatId = tgChatId();
  if (!chatId) return;
  await tgApi("sendMessage", {
    chat_id: chatId,
    disable_web_page_preview: true,
    text:
      `🧠 ÖĞRENME — ${d.name}\n\n💬 Müşteri: ${customer.slice(0, 300)}\n\n🤖 Ben önermiştim: ${d.text.slice(0, 400)}\n\n👤 Siz yazdınız: ${d.ownerText.slice(0, 400)}\n\n` +
      `📌 Çıkardığım ders: ${rule.text}\n${rule.why ? `(${rule.why})\n` : ""}\nBundan sonra böyle yapayım mı?`,
    reply_markup: { inline_keyboard: [[{ text: "✅ Evet, kural olsun", callback_data: `lr:y:${rule.id}` }, { text: "❌ Hayır", callback_data: `lr:n:${rule.id}` }]] },
  });
}

/** Öneri ↔ sahibinin cevabı farkından genel, tekrar kullanılabilir bir kural çıkar (yoksa null) */
async function proposeRule(customer: string, d: WaDraft): Promise<{ rule: string; why?: string } | null> {
  const { anthropicKey } = await readIntegrations();
  if (!anthropicKey || !d.ownerText) return null;
  const active = await rulesDo(async (l) => ({ out: l.filter((r) => r.status !== "rejected").map((r) => r.text) }));
  const prompt = `Bir düğün fotoğrafçısının (RED MEDIA, Ankara) WhatsApp satış asistanını eğitiyoruz.
Asistan müşteriye bir cevap ÖNERDİ, ama işletme sahibi onu göndermeyip kendisi FARKLI bir cevap yazdı.

Müşterinin mesajı: """${customer.slice(0, 800)}"""
Asistanın önerisi: """${d.text.slice(0, 1200)}"""
Sahibinin yazdığı: """${d.ownerText.slice(0, 1200)}"""

Mevcut kurallar (tekrarlama):
${active.length ? active.map((r) => `- ${r}`).join("\n") : "(yok)"}

Görev: Sahibinin cevabından, asistanın BUNDAN SONRA BAŞKA MÜŞTERİLERDE de uygulaması gereken GENEL bir ders çıkar.
- Ders tek cümle, emir kipinde, Türkçe olsun (ör. "Çekim yeri sorulursa önce çiftin tercihine göre plato ya da doğal alan seçilebildiğini söyle.").
- Sadece bu müşteriye özel bir bilgi (isim, onun tarihi, onun durumu) ders DEĞİLDİR.
- Fark sadece kelime seçimiyse ya da sahibi aynı şeyi başka sözlerle söylediyse ders YOKTUR.
- Sahibinin cevabı yeni bir bilgi (fiyat, hizmet, politika) içeriyorsa ders o bilgidir.
- Mevcut bir kuralla aynıysa ders YOKTUR.
Sadece şu JSON'u yaz: {"ders": "..." ya da null, "neden": "en fazla 12 kelime"}`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 1500, output_config: { effort: "low" }, messages: [{ role: "user", content: prompt }] }),
    signal: AbortSignal.timeout(60_000),
  }).catch(() => null);
  if (!res?.ok) return null;
  const j = (await res.json().catch(() => null)) as { content?: { type: string; text?: string }[] } | null;
  const txt = (j?.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
  const m = txt.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const o = JSON.parse(m[0]) as { ders?: unknown; neden?: unknown };
    const rule = typeof o.ders === "string" ? clean(o.ders).slice(0, 300) : "";
    if (rule.length < 8) return null;
    return { rule, why: typeof o.neden === "string" ? clean(o.neden).slice(0, 120) : undefined };
  } catch {
    return null;
  }
}

/* ---------------- Telegram: karar ve komutlar ---------------- */

export async function decideRule(id: string, yes: boolean): Promise<{ msg: string; decided: boolean }> {
  return rulesDo<{ msg: string; decided: boolean }>(async (list) => {
    const r = list.find((x) => x.id === id);
    if (!r) return { out: { msg: "Bu öneri bulunamadı.", decided: false } };
    if (r.status !== "pending") return { out: { msg: r.status === "active" ? "Bu kural zaten eklendi." : "Bu öneri zaten reddedildi.", decided: true } };
    const next: WaRule = { ...r, status: yes ? "active" : "rejected", decidedAt: new Date().toISOString() };
    const n = list.filter((x) => x.status === "active").length + (yes ? 1 : 0);
    return {
      list: list.map((x) => (x.id === id ? next : x)),
      out: { msg: yes ? `✅ Kural eklendi (toplam ${n} kural). Asistan bundan sonra buna uyacak:\n"${r.text}"\n\nKuralları görmek için: /kurallar` : "Tamam, bu dersi eklemedim.", decided: true },
    };
  });
}

export async function rulesListText(): Promise<string> {
  const active = await rulesDo(async (l) => ({ out: l.filter((r) => r.status === "active") }));
  const ex = await examplesDo(async (l) => ({ out: l.length }));
  if (!active.length) return `🧠 Henüz onaylı kural yok.\nÖrnek bankasında sizin yazdığınız ${ex} cevap var (asistan üslup için bunlara bakıyor).\n\nAsistanın önerisini göndermeyip kendiniz farklı yazdığınızda, ders çıkarıp size soracağım.`;
  return `🧠 ONAYLI KURALLAR (${active.length})\n${active.map((r, i) => `${i + 1}. ${r.text}`).join("\n")}\n\nÖrnek bankası: ${ex} cevabınız.\nBir kuralı silmek için: /kuralsil 2`;
}

export async function removeRule(n: number): Promise<string> {
  return rulesDo(async (list) => {
    const active = list.filter((r) => r.status === "active");
    const r = active[n - 1];
    if (!r) return { out: `${n} numaralı kural yok. Liste için: /kurallar` };
    return { list: list.map((x) => (x.id === r.id ? { ...x, status: "rejected" as const, decidedAt: new Date().toISOString() } : x)), out: `🗑️ Silindi: "${r.text}"` };
  });
}
