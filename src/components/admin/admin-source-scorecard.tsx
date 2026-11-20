"use client";

/**
 * KAYNAK KARNESİ — her kaynak için adım adım: talep → arandı → açtı → konuşuldu → WhatsApp → cevap → sıcak/ılık/soğuk → rezervasyon.
 * Instagram/Facebook formunda Meta reklam harcaması: talep başı ve rezervasyon başı maliyet.
 * Düğün.com "yeni talepler" ve "eski liste" (sonradan aktarılan) ayrı gösterilir — karışmasın.
 */
import { useEffect, useMemo, useState } from "react";
import { cn, formatPrice } from "@/lib/utils";
import type { AiCouple } from "@/types/ai-couples";

type SpendRow = { campaign: string; spend: number; leads: number };

const isOld = (c: AiCouple) => /eski talep|kampanyası/i.test(c.note ?? "") || c.sourceRef === "kampanya-2027";
const GROUPS: { key: string; label: string; icon: string; pick: (c: AiCouple) => boolean }[] = [
  { key: "meta", label: "Instagram / Facebook formu", icon: "📸", pick: (c) => c.source === "meta_form" },
  { key: "dg-new", label: "Düğün.com — yeni talepler", icon: "💍", pick: (c) => c.source === "dugun_com" && !isOld(c) },
  { key: "dg-old", label: "Düğün.com — eski liste", icon: "📋", pick: (c) => c.source === "dugun_com" && isOld(c) },
  { key: "web", label: "Web sitesi", icon: "🌐", pick: (c) => c.source === "web" },
  { key: "manual", label: "Elle eklenen", icon: "✍️", pick: (c) => c.source === "manual" },
];

function stats(list: AiCouple[]) {
  const n = list.length;
  const called = list.filter((c) => c.calls.length).length;
  const answered = list.filter((c) => c.calls.some((x) => (x.durationSec ?? 0) > 0)).length;
  const talked = list.filter((c) => c.calls.some((x) => x.outcome !== "no_answer")).length;
  const wa = list.filter((c) => c.messages.some((m) => m.direction === "out" && m.channel === "whatsapp" && !m.text.startsWith("[✓"))).length;
  const replied = list.filter((c) => c.messages.some((m) => m.direction === "in")).length;
  const engaged = list.filter((c) => c.calls.some((x) => x.outcome !== "no_answer") || c.messages.some((m) => m.direction === "in"));
  const hot = list.filter((c) => c.grade === "hot" && c.status !== "won").length;
  const warm = list.filter((c) => c.grade === "warm" && c.status !== "won").length;
  const cold = engaged.filter((c) => c.grade === "cold" && c.status !== "won").length;
  const untouched = n - engaged.length;
  const lost = list.filter((c) => c.status === "lost" || c.contactLocked).length;
  const won = list.filter((c) => c.status === "won").length;
  return { n, called, answered, talked, wa, replied, hot, warm, cold, untouched, lost, won };
}

const pct = (a: number, b: number) => (b ? `%${Math.round((a / b) * 100)}` : "—");
const tl = (n: number) => formatPrice(Math.round(n));

export function SourceScorecard({ couples, since }: { couples: AiCouple[]; since: string }) {
  const [spend, setSpend] = useState<{ total: number; leads: number } | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/meta-spend?since=${since}`)
      .then((r) => r.json())
      .then((j: { ok?: boolean; rows?: SpendRow[] }) => {
        if (!alive) return;
        const rows = j.ok && j.rows ? j.rows.filter((r) => /form/i.test(r.campaign)) : [];
        setSpend({ total: rows.reduce((s, r) => s + r.spend, 0), leads: rows.reduce((s, r) => s + r.leads, 0) });
      })
      .catch(() => alive && setSpend({ total: 0, leads: 0 }));
    return () => {
      alive = false;
    };
  }, [since]);

  const groups = useMemo(() => GROUPS.map((g) => ({ ...g, s: stats(couples.filter(g.pick)) })).filter((g) => g.s.n > 0), [couples]);

  return (
    <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
      {groups.map((g) => {
        const s = g.s;
        const steps: [string, number, number, string?][] = [
          ["Gelen talep", s.n, s.n],
          ["Arandı", s.called, s.n],
          ["Telefonu açtı", s.answered, s.called, "arananların"],
          ["Konuşuldu (bilgi verildi)", s.talked, s.called, "arananların"],
          ["WhatsApp'tan teklif / bilgi gitti", s.wa, s.n],
          ["Cevap yazdı", s.replied, s.wa, "yazılanların"],
          ["Rezervasyon", s.won, s.n],
        ];
        const ad = g.key === "meta" && spend && spend.total > 0 ? spend : null;
        return (
          <section key={g.key} className="rm-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                {g.icon} {g.label}
              </h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 tabular-nums">{s.n} talep</span>
            </div>

            <ul className="mt-3 space-y-1.5">
              {steps.map(([l, v, base, of]) => {
                const w = base ? Math.round((v / base) * 100) : 0;
                return (
                  <li key={l}>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="text-slate-600">{l}</span>
                      <span className="shrink-0 tabular-nums">
                        <b className="text-slate-900">{v}</b>
                        {l !== "Gelen talep" && <span className="ml-1.5 text-xs text-slate-500">{pct(v, base)}{of ? ` ${of}` : ""}</span>}
                      </span>
                    </div>
                    <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className={cn("h-full rounded-full", l === "Rezervasyon" ? "bg-emerald-500" : "bg-indigo-500")} style={{ width: `${Math.min(100, w)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
              <span className="rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700">🔥 Sıcak {s.hot}</span>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">🌤️ Ilık {s.warm}</span>
              <span className="rounded-full bg-sky-50 px-2.5 py-1 font-semibold text-sky-700">❄️ Soğuk {s.cold}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">🆕 Konuşulmadı {s.untouched}</span>
              {s.lost > 0 && <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-500">Kaybedilen {s.lost}</span>}
            </div>

            {g.key === "meta" && (
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 p-2.5 text-center">
                <div>
                  <p className="text-[11px] text-slate-500">Reklam harcaması</p>
                  <p className="text-sm font-semibold text-slate-900 tabular-nums">{ad ? tl(ad.total) : spend ? "—" : "…"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Talep başı</p>
                  <p className="text-sm font-semibold text-slate-900 tabular-nums">{ad && s.n ? tl(ad.total / s.n) : "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Rezervasyon başı</p>
                  <p className="text-sm font-semibold text-slate-900 tabular-nums">{ad && s.won ? tl(ad.total / s.won) : "henüz yok"}</p>
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
