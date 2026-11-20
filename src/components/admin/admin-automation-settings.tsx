"use client";

/**
 * ⚙️ Otomasyon hızı: WhatsApp kampanyası (günde kaç kişi, kaç dk arayla) ve sesli arama
 * (günde en fazla kaç, kaç dk arayla). Kaydedince n8n bir sonraki turda (1-2 dk) yeni ayarla çalışır.
 */
import { useEffect, useState } from "react";
import { ChevronDown, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { setFollowDays } from "@/lib/ai-couples/follow-days";

export type Automation = { waAiMode?: "off" | "test" | "all"; waAiTestPhones?: string[]; waPerDay: number; waGapMin: number; waGapMax: number; callsPerDay: number; callGapMin: number; fuMsgDay: number; fuCallDay: number; fuLastDay: number; updatedAt?: string };

let cache: Automation | null = null;
const listeners = new Set<(a: Automation) => void>();

/** Ayarları okur (sayfadaki tüm bileşenler aynı değeri görür) */
export function useAutomation(): Automation | null {
  const [a, setA] = useState<Automation | null>(cache);
  useEffect(() => {
    listeners.add(setA);
    if (!cache)
      fetch("/api/admin/ai-automation", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { automation?: Automation } | null) => {
          if (j?.automation) {
            cache = j.automation;
            setFollowDays({ msg: j.automation.fuMsgDay, call: j.automation.fuCallDay, last: j.automation.fuLastDay });
            listeners.forEach((l) => l(j.automation!));
          }
        })
        .catch(() => null);
    return () => {
      listeners.delete(setA);
    };
  }, []);
  return a;
}

const field =
  "h-10 w-20 rounded-xl border border-slate-200 bg-white px-2 text-center text-sm font-semibold text-slate-900 tabular-nums outline-none focus:border-indigo-300";

function Num({ v, set, min, max }: { v: number; set: (n: number) => void; min: number; max: number }) {
  return <input type="number" inputMode="numeric" min={min} max={max} value={Number.isFinite(v) ? v : ""} onChange={(e) => set(Number(e.target.value))} className={field} />;
}

export function AdminAutomationSettings() {
  const cur = useAutomation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Automation | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const f = form ?? cur;
  const set = (k: keyof Automation) => (n: number) => f && setForm({ ...f, [k]: n });

  const save = async () => {
    if (!f) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/ai-automation", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const j = (await res.json().catch(() => ({}))) as { automation?: Automation; error?: string };
      if (res.ok && j.automation) {
        cache = j.automation;
        setFollowDays({ msg: j.automation.fuMsgDay, call: j.automation.fuCallDay, last: j.automation.fuLastDay });
        listeners.forEach((l) => l(j.automation!));
        setForm(null);
        setMsg({ ok: true, text: "✅ Kaydedildi — otomasyon 1-2 dakika içinde yeni ayarla çalışır." });
      } else setMsg({ ok: false, text: j.error ?? "Kaydedilemedi" });
    } catch {
      setMsg({ ok: false, text: "Bağlantı hatası — tekrar deneyin" });
    } finally {
      setSaving(false);
    }
  };

  const callHours = 11; // 09:30–20:30
  const callMax = f ? Math.floor((callHours * 60) / Math.max(2, f.callGapMin)) : 0;
  const waMaxByTime = f ? Math.floor((12 * 60) / Math.max(1, (f.waGapMin + f.waGapMax) / 2)) : 0;

  return (
    <section className="rm-card overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5">
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Gauge className="h-[18px] w-[18px]" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-slate-900">⚙️ Otomasyon hızı</span>
            <span className="block text-xs text-slate-500">
              {f
                ? `WhatsApp: günde ${f.waPerDay} kişi, ${f.waGapMin}-${f.waGapMax} dk arayla · Arama: günde en fazla ${f.callsPerDay}, ${f.callGapMin} dk arayla`
                : "Yükleniyor…"}
            </span>
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && f && (
        <div className="space-y-4 border-t border-slate-100 p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
              <p className="text-sm font-semibold text-emerald-900">💬 WhatsApp kampanyası (toplu liste)</p>
              <div className="mt-3 space-y-2.5 text-sm text-slate-700">
                <label className="flex items-center justify-between gap-3">
                  Günde kaç kişiye <Num v={f.waPerDay} set={set("waPerDay")} min={1} max={100} />
                </label>
                <label className="flex items-center justify-between gap-3">
                  İki mesaj arası en az (dk) <Num v={f.waGapMin} set={set("waGapMin")} min={2} max={120} />
                </label>
                <label className="flex items-center justify-between gap-3">
                  İki mesaj arası en çok (dk) <Num v={f.waGapMax} set={set("waGapMax")} min={2} max={180} />
                </label>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-emerald-900/80">
                Süre bu ikisinin arasında rastgele seçilir (WhatsApp engel riski azalır). Saat 09:00–21:00. Yeni gelen talepler bu sınıra takılmaz, hemen yazılır.
                {f.waPerDay > waMaxByTime && <b className="block text-amber-700">⚠️ Bu aralıkla günde en fazla ~{waMaxByTime} kişiye yetişir.</b>}
                {f.waPerDay > 40 && <b className="block text-rose-700">⚠️ Günde 40&apos;tan fazla yeni kişiye yazmak WhatsApp engel riskini artırır.</b>}
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
              <p className="text-sm font-semibold text-indigo-900">📞 Sesli arama</p>
              <div className="mt-3 space-y-2.5 text-sm text-slate-700">
                <label className="flex items-center justify-between gap-3">
                  Günde en fazla kaç arama <Num v={f.callsPerDay} set={set("callsPerDay")} min={1} max={300} />
                </label>
                <label className="flex items-center justify-between gap-3">
                  İki arama arası en az (dk) <Num v={f.callGapMin} set={set("callGapMin")} min={2} max={120} />
                </label>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-indigo-900/80">
                Saat 09:30–20:30. Sırada kimse yoksa arama yapılmaz; sınır sadece en fazla sayıdır. Meşgul tekrarı ve &quot;sonra arayın&quot; saatleri de bu aralığa uyar.
                {f.callsPerDay > callMax && <b className="block text-amber-700">⚠️ {f.callGapMin} dk arayla günde en fazla ~{callMax} arama yapılabilir.</b>}
                <span className="block">Ortalama 2 dk&apos;lık görüşmeyle {f.callsPerDay} arama ≈ {f.callsPerDay * 2} dk Verimor + ElevenLabs.</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
            <p className="text-sm font-semibold text-emerald-900">🤖 WhatsApp&apos;ta yapay zekâ cevap versin</p>
            <p className="mt-1 text-[11px] leading-relaxed text-emerald-900/80">
              Müşteri WhatsApp&apos;tan yazınca ~1 dk içinde geçmişini ve takvimi bilerek cevap yazar. Kapora/ödeme, pazarlık, şikâyet ve emin olmadığı her soruda yazmaz, Telegram&apos;dan size devreder. Siz son 12 saatte o müşteriye yazdıysanız karışmaz.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {([
                ["off", "Kapalı"],
                ["test", "Sadece test"],
                ["all", "Herkese açık"],
              ] as const).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setForm({ ...f, waAiMode: v })}
                  className={cn(
                    "h-10 rounded-xl px-2 text-sm font-semibold",
                    (f.waAiMode ?? "test") === v ? (v === "all" ? "bg-emerald-600 text-white" : v === "test" ? "bg-amber-500 text-white" : "bg-slate-700 text-white") : "border border-slate-300 bg-white text-slate-600",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="mt-3 block text-xs font-semibold text-slate-700">
              Test numaraları (virgülle ayırın)
              <input
                type="text"
                inputMode="tel"
                placeholder="0532 123 45 67, 0555 …"
                value={(f.waAiTestPhones ?? []).join(", ")}
                onChange={(e) => setForm({ ...f, waAiTestPhones: [e.target.value] })}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-medium text-slate-900 outline-none focus:border-indigo-300 sm:text-sm"
              />
            </label>
            <p className="mt-2 text-[11px] leading-relaxed text-emerald-900/80">
              &quot;Sadece test&quot; seçiliyken yalnızca bu numaralara cevap verir (numara panelde kayıtlı olmalı). Test bitince &quot;Herkese açık&quot; yapıp kaydedin.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
            <p className="text-sm font-semibold text-amber-900">🔁 Teklif alıp cevap vermeyen çift (otomatik takip)</p>
            <div className="mt-3 grid gap-2.5 text-sm text-slate-700 sm:grid-cols-3">
              <label className="flex items-center justify-between gap-3">
                Hatırlatma mesajı (gün) <Num v={f.fuMsgDay} set={set("fuMsgDay")} min={1} max={30} />
              </label>
              <label className="flex items-center justify-between gap-3">
                Takip araması (gün) <Num v={f.fuCallDay} set={set("fuCallDay")} min={1} max={45} />
              </label>
              <label className="flex items-center justify-between gap-3">
                Son mesaj (gün) <Num v={f.fuLastDay} set={set("fuLastDay")} min={1} max={60} />
              </label>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-amber-900/80">
              Telefonda bilgi/teklif isteyip WhatsApp&apos;tan fiyat giden ama cevap yazmayan çift için. Hatırlatmada tarih, verilen paket fiyatı, kalan yer, kampanyanın 31 Aralık&apos;ta bittiği ve %40 zam söylenir;
              takip aramasında asistan &quot;X gün önce görüşmüştük, şu tarih için şu fiyatı vermiştik&quot; diye başlar. Çift ya da siz yazarsanız takip durur.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={saving || !form}
              onClick={save}
              className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(79,70,229,0.8)] hover:bg-indigo-700 disabled:opacity-40"
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
            {form && (
              <button type="button" onClick={() => setForm(null)} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
                Vazgeç
              </button>
            )}
            {msg && <p className={cn("text-sm", msg.ok ? "text-emerald-700" : "text-rose-700")}>{msg.text}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
