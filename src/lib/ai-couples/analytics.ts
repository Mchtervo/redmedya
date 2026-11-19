/**
 * Satış analizi — saf fonksiyonlar (panelde hesaplanır).
 * Kaynak (Düğün.com / Instagram-Facebook / web / elle) ve reklam bazında huni, sonuç dağılımı,
 * yanıt hızı, rezervasyon ve ciro eşleştirmesi + kural tabanlı öneriler.
 */
import type { AiCouple, AiCoupleSource } from "@/types/ai-couples";
import { normalizePhone } from "@/lib/ai-couples/rules";

export type Outcome =
  | "won"
  | "booked_elsewhere"
  | "stopped"
  | "lost"
  | "thinking"
  | "waiting_us"
  | "in_talks"
  | "no_response"
  | "not_contacted";

export const OUTCOME_TEXT: Record<Outcome, string> = {
  won: "Rezervasyon yaptı",
  booked_elsewhere: "Başka fotoğrafçıyla anlaştı",
  stopped: "İstemiyor (kara liste)",
  lost: "İlgilenmiyor / bütçe uymadı",
  thinking: "Düşünüyor",
  waiting_us: "Yazdı — bizden cevap bekliyor",
  in_talks: "Görüşülüyor",
  no_response: "Hiç dönmedi",
  not_contacted: "Henüz ulaşılmadı",
};

export const SOURCE_TEXT: Record<AiCoupleSource, string> = {
  dugun_com: "Düğün.com",
  meta_form: "Instagram / Facebook",
  web: "Web sitesi",
  manual: "Elle eklenen",
};

/** Çiftin bugünkü (son) durumu — her çift tek bir gruba girer */
export function outcomeOf(c: AiCouple): Outcome {
  if (c.status === "won") return "won";
  if (/başka/i.test(c.lockReason ?? "") || c.calls.some((x) => x.outcome === "booked_elsewhere")) return "booked_elsewhere";
  if (c.contactLocked) return "stopped";
  if (c.status === "lost") return "lost";
  const last = c.messages[c.messages.length - 1];
  if (last?.direction === "in") return "waiting_us";
  if (c.status === "thinking") return "thinking";
  const answered = c.calls.some((x) => x.outcome !== "no_answer");
  const replied = c.messages.some((m) => m.direction === "in");
  if (answered || replied) return "in_talks";
  const touched = c.calls.length > 0 || c.messages.some((m) => m.direction === "out" && m.channel === "whatsapp");
  return touched ? "no_response" : "not_contacted";
}

const ts = (iso?: string) => (iso ? Date.parse(iso) : NaN);

/** Düşündü, sonra (en az 1 gün sonra) tekrar yazdı / görüştü / rezervasyon yaptı */
export function thoughtAndCameBack(c: AiCouple): boolean {
  const t = c.timeline.find((e) => e.type === "thinking");
  if (!t) return false;
  const after = ts(t.at) + 86_400_000;
  return (
    c.status === "won" ||
    c.messages.some((m) => m.direction === "in" && ts(m.at) > after) ||
    c.calls.some((x) => x.outcome !== "no_answer" && ts(x.at) > after)
  );
}

/** İlk temasa kadar geçen süre (dk): ilk arama veya ilk giden WhatsApp/SMS */
export function firstResponseMinutes(c: AiCouple): number | null {
  // Toplu içe aktarılan kampanya listeleri (sourceRef "kampanya-…") gerçek yanıt hızını yansıtmaz
  if (c.sourceRef?.startsWith("kampanya-")) return null;
  const firsts = [
    ...c.calls.map((x) => ts(x.at)),
    ...c.messages.filter((m) => m.direction === "out").map((m) => ts(m.at)),
  ].filter((n) => Number.isFinite(n));
  if (!firsts.length) return null;
  const d = (Math.min(...firsts) - ts(c.createdAt)) / 60_000;
  return d >= 0 ? d : null;
}

/** Notlardaki "Kampanya: X" / "Reklam: Y" (Meta form akışı yazar) */
export function adOf(c: AiCouple): { campaign: string; ad: string } {
  const n = c.note ?? "";
  const campaign = n.match(/Kampanya: ([^·\n]+)/)?.[1]?.trim() ?? (c.sourceRef?.startsWith("kampanya-") ? c.sourceRef : "");
  const ad = n.match(/Reklam: ([^·\n]+)/)?.[1]?.trim() ?? "";
  return { campaign: campaign || "(kampanya bilgisi yok)", ad };
}

export type FunnelRow = {
  key: string;
  label: string;
  leads: number;
  touched: number;
  /** En az bir kez aranan çift */
  called: number;
  talked: number;
  replied: number;
  thought: number;
  cameBack: number;
  bookedElsewhere: number;
  noResponse: number;
  won: number;
  revenue: number;
  medianFirstMin: number | null;
  conversion: number; // won / leads %
  outcomes: Record<Outcome, number>;
};

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function funnel(key: string, label: string, list: AiCouple[], revenueByCouple: Map<string, number>): FunnelRow {
  const outcomes = Object.fromEntries(Object.keys(OUTCOME_TEXT).map((k) => [k, 0])) as Record<Outcome, number>;
  let touched = 0, called = 0, talked = 0, replied = 0, thought = 0, cameBack = 0, revenue = 0;
  const firstMins: number[] = [];
  for (const c of list) {
    outcomes[outcomeOf(c)]++;
    if (c.calls.length || c.messages.some((m) => m.direction === "out")) touched++;
    if (c.calls.length) called++;
    if (c.calls.some((x) => x.outcome !== "no_answer")) talked++;
    if (c.messages.some((m) => m.direction === "in")) replied++;
    if (c.timeline.some((e) => e.type === "thinking")) thought++;
    if (thoughtAndCameBack(c)) cameBack++;
    revenue += revenueByCouple.get(c.id) ?? 0;
    const f = firstResponseMinutes(c);
    if (f !== null) firstMins.push(f);
  }
  return {
    key, label, leads: list.length, touched, called, talked, replied, thought, cameBack,
    bookedElsewhere: outcomes.booked_elsewhere,
    noResponse: outcomes.no_response,
    won: outcomes.won,
    revenue,
    medianFirstMin: median(firstMins),
    conversion: list.length ? Math.round((outcomes.won / list.length) * 1000) / 10 : 0,
    outcomes,
  };
}

type ResLike = { id: string; total?: number; approvedAt?: string; createdAt?: string; customer?: { phone?: string; firstName?: string; lastName?: string } };

/**
 * Rezervasyonları çiftlerle telefondan eşleştirir → hangi kaynaktan/reklamdan geldi.
 * Eşleşmeyen rezervasyonlar "Doğrudan / diğer" sayılır.
 */
export function attributeReservations(couples: AiCouple[], reservations: ResLike[]) {
  const byPhone = new Map<string, AiCouple>();
  for (const c of couples) byPhone.set(c.phone, c);
  const revenueByCouple = new Map<string, number>();
  const rows: { res: ResLike; couple?: AiCouple }[] = [];
  for (const r of reservations) {
    const p = normalizePhone(r.customer?.phone);
    const c = p ? byPhone.get(p) : undefined;
    if (c) revenueByCouple.set(c.id, (revenueByCouple.get(c.id) ?? 0) + (r.total ?? 0));
    rows.push({ res: r, couple: c });
  }
  return { revenueByCouple, rows };
}

export type Advice = { tone: "good" | "warn" | "info"; text: string };

/** Kural tabanlı öneriler (yeterli veri yoksa söyler, uydurmaz) */
export function adviceFor(rows: FunnelRow[], adRows: FunnelRow[]): Advice[] {
  const out: Advice[] = [];
  const real = rows.filter((r) => r.leads >= 5);
  if (!real.length) return [{ tone: "info", text: "Henüz yorum yapmaya yetecek veri yok (kaynak başına en az 5 çift gerekiyor). Veri biriktikçe öneriler burada çıkar." }];

  const best = [...real].sort((a, b) => b.conversion - a.conversion)[0];
  const worst = [...real].sort((a, b) => a.conversion - b.conversion)[0];
  if (real.length > 1 && best.conversion > worst.conversion) {
    out.push({ tone: "good", text: `En verimli kaynak ${best.label}: %${best.conversion} rezervasyona dönüyor (${worst.label}: %${worst.conversion}). Bütçe ve emeği öncelikle ${best.label}'a verin.` });
  }
  for (const r of real) {
    const reach = r.called ? r.talked / r.called : 0;
    if (r.called >= 5 && reach < 0.35) out.push({ tone: "warn", text: `${r.label}: aranan çiftlerin sadece %${Math.round(reach * 100)}'i telefonu açıyor. Arama saatini (öğle 12–14 veya akşam 18–20) deneyin; WhatsApp'ı daha erken gönderin.` });
    const noResp = r.leads ? r.noResponse / r.leads : 0;
    if (noResp > 0.4) out.push({ tone: "warn", text: `${r.label}: çiftlerin %${Math.round(noResp * 100)}'i hiç dönmedi. İlk mesajı kısaltıp tek bir soruyla bitirmek ("Tarihiniz hangi ay?") cevap oranını artırır.` });
    if (r.thought >= 3 && r.cameBack / r.thought < 0.3) out.push({ tone: "info", text: `${r.label}: "düşüneyim" diyen ${r.thought} çiftten sadece ${r.cameBack}'i geri döndü. 3. gün kısa bir hatırlatma + kontenjan bilgisi ekleyin.` });
    if (r.leads >= 5 && r.bookedElsewhere / r.leads > 0.25) out.push({ tone: "warn", text: `${r.label}: çiftlerin %${Math.round((r.bookedElsewhere / r.leads) * 100)}'i başka fotoğrafçıyla anlaşmış. Daha hızlı dönüş ve ilk görüşmede net fiyat + kapora teklifi önemli.` });
    if (r.medianFirstMin !== null && r.medianFirstMin > 60) out.push({ tone: "warn", text: `${r.label}: ilk temas ortalama ${Math.round(r.medianFirstMin)} dk sürüyor. 1 saatin altına inmek dönüşümü belirgin artırır (otomatik aramayı açık tutun).` });
  }
  for (const a of adRows) {
    if (a.leads >= 10 && a.won === 0) out.push({ tone: "warn", text: `Reklam "${a.label}": ${a.leads} başvuru, henüz rezervasyon yok. Görseli/metni değiştirin ya da bu reklamın bütçesini kazanan reklama kaydırın.` });
    else if (a.leads >= 5 && a.conversion >= 10) out.push({ tone: "good", text: `Reklam "${a.label}" iyi gidiyor: %${a.conversion} dönüşüm. Bütçesini artırmayı düşünün.` });
  }
  if (!out.length) out.push({ tone: "good", text: "Belirgin bir sorun görünmüyor. Veri arttıkça öneriler güncellenecek." });
  return out;
}
