"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bot,
  Calendar,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Phone,
  Plus,
  Search,
  Send,
  Unlock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminEmptyState, AdminPanelHeader, AdminSection } from "@/components/admin/admin-panel-header";
import { useAdminDataSync } from "@/hooks/use-admin-data-sync";
import type {
  AiCapacityConfig,
  AiCapacityInfo,
  AiCouple,
  AiCoupleGrade,
  AiCoupleStatus,
} from "@/types/ai-couples";
import { displayPhone, GRADE_LABEL, OUTCOME_LABEL, STATUS_LABEL } from "@/lib/ai-couples/rules";

type Payload = {
  couples: AiCouple[];
  capacityConfig: AiCapacityConfig;
  months: AiCapacityInfo[];
  integration: { baseUrl: string; apiToken: string; telegramReady: boolean };
};

type Filter = AiCoupleGrade | "all";

const GRADE_STYLE: Record<AiCoupleGrade, string> = {
  hot: "border-orange-400/40 bg-orange-400/10 text-orange-300",
  warm: "border-amber-300/40 bg-amber-300/10 text-amber-200",
  cold: "border-sky-300/40 bg-sky-300/10 text-sky-200",
  blacklist: "border-red-500/40 bg-red-500/10 text-red-300",
};

const SOURCE_LABEL: Record<AiCouple["source"], string> = {
  dugun_com: "Düğün.com",
  meta_form: "Meta form",
  web: "Web sitesi",
  manual: "Elle",
};

const pill =
  "inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-rm-off-white uppercase transition-colors hover:border-rm-champagne/40 hover:text-rm-champagne disabled:opacity-40";
const field =
  "h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-rm-off-white outline-none placeholder:text-rm-gray-600 focus:border-rm-champagne/40";

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function AdminAiCouplesPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/ai-couples")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Payload | null) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useAdminDataSync(load);

  const couples = useMemo(() => data?.couples ?? [], [data]);
  const counts = useMemo(() => {
    const c: Record<AiCoupleGrade, number> = { hot: 0, warm: 0, cold: 0, blacklist: 0 };
    for (const x of couples) c[x.grade] += 1;
    return c;
  }, [couples]);

  const visible = useMemo(() => {
    const q = search.toLocaleLowerCase("tr-TR").trim();
    const digits = q.replace(/\D/g, "");
    return couples.filter(
      (c) =>
        (filter === "all" || c.grade === filter) &&
        (!q || c.name.toLocaleLowerCase("tr-TR").includes(q) || (digits.length >= 3 && c.phone.includes(digits)))
    );
  }, [couples, filter, search]);

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/ai-couples/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) setMsg(j.error ?? "Kaydedilemedi");
    load();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-2xl border border-white/8 bg-rm-black-elevated/40" />
        <div className="h-48 animate-pulse rounded-2xl border border-white/8 bg-rm-black-elevated/40" />
      </div>
    );
  }
  if (!data) return <AdminEmptyState title="Veri alınamadı" description="Sayfayı yenileyip tekrar deneyin." />;

  return (
    <div className="space-y-5">
      <AdminPanelHeader
        eyebrow="AI Satış"
        title="AI Çift Yönetimi"
        description="Düğün.com ve Meta formdan gelen çiftler, sesli arama sonuçları, WhatsApp takibi ve kontenjan. Kara listedeki çifte hiçbir kanaldan ulaşılmaz; kayıtlar silinmez."
        icon={Bot}
        meta={`${couples.length} çift · ${counts.hot} sıcak · ${counts.warm} ılık`}
      />

      {msg && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">{msg}</p>}

      {/* Derece kutuları */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn("rounded-2xl border p-3 text-left transition-colors", filter === "all" ? "border-rm-champagne/50 bg-rm-champagne/10" : "border-white/8 bg-rm-black-elevated/60")}
        >
          <p className="text-[10px] font-semibold tracking-[0.18em] text-rm-gray-500 uppercase">Tümü</p>
          <p className="mt-1 font-editorial text-2xl tabular-nums text-rm-off-white">{couples.length}</p>
        </button>
        {(Object.keys(GRADE_LABEL) as AiCoupleGrade[]).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setFilter(g)}
            className={cn("rounded-2xl border p-3 text-left transition-colors", filter === g ? GRADE_STYLE[g] : "border-white/8 bg-rm-black-elevated/60")}
          >
            <p className="text-[10px] font-semibold tracking-[0.12em] text-rm-gray-400 uppercase">{GRADE_LABEL[g]}</p>
            <p className="mt-1 font-editorial text-2xl tabular-nums text-rm-off-white">{counts[g]}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative block flex-1">
          <span className="sr-only">Çift ara</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-rm-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="İsim veya telefon ara" className={cn(field, "h-11 pl-10")} />
        </label>
        <AddCoupleForm onDone={load} />
      </div>

      {visible.length === 0 ? (
        <AdminEmptyState title="Çift yok" description="Düğün.com / Meta form bağlandığında yeni talepler burada görünür." />
      ) : (
        <ul className="space-y-3">
          {visible.map((c) => (
            <li key={c.id}>
              <CoupleCard couple={c} open={open === c.id} onToggle={() => setOpen(open === c.id ? null : c.id)} onPatch={(b) => patch(c.id, b)} busy={busy} />
            </li>
          ))}
        </ul>
      )}

      <CapacityEditor config={data.capacityConfig} months={data.months} onSaved={load} />
      <IntegrationBox integration={data.integration} />
    </div>
  );
}

function CoupleCard({
  couple: c,
  open,
  onToggle,
  onPatch,
  busy,
}: {
  couple: AiCouple;
  open: boolean;
  onToggle: () => void;
  onPatch: (b: Record<string, unknown>) => void;
  busy: boolean;
}) {
  const [note, setNote] = useState(c.note ?? "");
  const lastCall = c.calls[c.calls.length - 1];

  return (
    <article className={cn("rounded-2xl border bg-rm-black-elevated/60 p-4 sm:p-5", c.contactLocked ? "border-red-500/30" : "border-white/8")}>
      <button type="button" onClick={onToggle} className="flex w-full flex-wrap items-start justify-between gap-3 text-left">
        <div className="min-w-0">
          <p className="font-editorial text-xl text-rm-off-white">{c.name}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-rm-gray-400">
            <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{displayPhone(c.phone)}</span>
            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{c.weddingDate ?? "tarih yok"}</span>
            <span>{SOURCE_LABEL[c.source]}</span>
            <span>📞 {c.callCount}</span>
          </p>
          {lastCall?.summary && <p className="mt-2 line-clamp-2 text-sm text-rm-gray-300">{lastCall.summary}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("rounded-full border px-3 py-1 text-[11px] font-semibold", GRADE_STYLE[c.grade])}>{GRADE_LABEL[c.grade]}</span>
          <span className="text-[11px] text-rm-gray-500">{STATUS_LABEL[c.status]}</span>
          <ChevronDown className={cn("h-4 w-4 text-rm-gray-500 transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-white/8 pt-4">
          {c.contactLocked && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              🚫 İletişim kapalı — {c.lockReason ?? "kara liste"} ({fmt(c.lockedAt)})
            </p>
          )}
          {c.followUpAt && !c.followUpSentAt && !c.contactLocked && (
            <p className="text-sm text-amber-200">⏰ Otomatik takip mesajı: {fmt(c.followUpAt)}</p>
          )}

          {/* İşlemler */}
          <div className="flex flex-wrap gap-2">
            {!c.contactLocked &&
              (["hot", "warm", "cold"] as AiCoupleGrade[]).map((g) => (
                <button key={g} type="button" disabled={busy || c.grade === g} onClick={() => onPatch({ grade: g })} className={pill}>
                  {GRADE_LABEL[g]}
                </button>
              ))}
            {!c.contactLocked && (
              <>
                <button type="button" disabled={busy} onClick={() => onPatch({ status: "thinking" as AiCoupleStatus })} className={pill}>Düşünüyor (+7 gün takip)</button>
                <button type="button" disabled={busy} onClick={() => onPatch({ status: "won" as AiCoupleStatus })} className={pill}>Rezervasyon yaptı</button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (confirm(`${c.name} kara listeye alınsın mı? Bir daha arama veya mesaj gitmez.`)) onPatch({ grade: "blacklist", reason: "Admin kara listeye aldı" });
                  }}
                  className={cn(pill, "border-red-500/40 text-red-300")}
                >
                  <Lock className="h-3 w-3" /> Kara liste
                </button>
              </>
            )}
            {c.contactLocked && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const ok = prompt(`DİKKAT: ${c.name} "${c.lockReason}" sebebiyle kilitli. Çift açıkça izin verdiyse kilidi açmak için KILIDI AC yazın.`);
                  if (ok === "KILIDI AC") onPatch({ unlock: true, confirm: "KILIDI AC" });
                }}
                className={pill}
              >
                <Unlock className="h-3 w-3" /> Kilidi aç
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Not" className={field} />
            <button type="button" disabled={busy} onClick={() => onPatch({ note })} className={pill}>Kaydet</button>
          </div>

          {/* Aramalar */}
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-rm-champagne uppercase">Aramalar</p>
            {c.calls.length === 0 ? (
              <p className="mt-2 text-sm text-rm-gray-500">Henüz arama yok.</p>
            ) : (
              <ul className="mt-2 space-y-3">
                {[...c.calls].reverse().map((call) => (
                  <li key={call.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                    <p className="text-xs text-rm-gray-400">
                      {fmt(call.at)} · <span className="text-rm-off-white">{OUTCOME_LABEL[call.outcome]}</span>
                      {call.durationSec ? ` · ${Math.round(call.durationSec / 60)} dk` : ""}
                      {typeof call.quotedRemaining === "number" ? ` · söylenen kontenjan: ${call.quotedRemaining}` : ""}
                    </p>
                    {call.summary && <p className="mt-1.5 text-sm text-rm-gray-200">{call.summary}</p>}
                    {call.recordingUrl && (
                      <audio controls preload="none" src={call.recordingUrl} className="mt-2 w-full">
                        <a href={call.recordingUrl}>Ses kaydı</a>
                      </audio>
                    )}
                    {call.transcript && (
                      <details className="mt-2 text-xs text-rm-gray-400">
                        <summary className="cursor-pointer">Konuşma metni</summary>
                        <p className="mt-1 whitespace-pre-wrap">{call.transcript}</p>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Mesajlar */}
          {c.messages.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-rm-champagne uppercase">Mesajlar</p>
              <ul className="mt-2 space-y-2">
                {c.messages.slice(-10).map((m) => (
                  <li key={m.id} className={cn("max-w-[90%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap", m.direction === "out" ? "ml-auto bg-rm-champagne/10 text-rm-off-white" : "bg-white/[0.05] text-rm-gray-200")}>
                    {m.text}
                    <span className="mt-1 block text-[10px] text-rm-gray-500">{m.channel} · {fmt(m.at)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Zaman çizelgesi */}
          <details className="text-xs text-rm-gray-400">
            <summary className="cursor-pointer">Geçmiş ({c.timeline.length})</summary>
            <ul className="mt-2 space-y-1">
              {[...c.timeline].reverse().map((t, i) => (
                <li key={i}>{fmt(t.at)} — {t.text}</li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </article>
  );
}

function AddCoupleForm({ onDone }: { onDone: () => void }) {
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", weddingDate: "" });
  const [err, setErr] = useState<string | null>(null);
  if (!show) {
    return (
      <button type="button" onClick={() => setShow(true)} className={cn(pill, "h-11 justify-center")}>
        <Plus className="h-3.5 w-3.5" /> Çift ekle
      </button>
    );
  }
  return (
    <form
      className="flex flex-1 flex-wrap gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr(null);
        const res = await fetch("/api/admin/ai-couples", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) return setErr(j.error ?? "Eklenemedi");
        setF({ name: "", phone: "", weddingDate: "" });
        setShow(false);
        onDone();
      }}
    >
      <input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="İsim" className={cn(field, "w-36 flex-1")} />
      <input required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="05xx" className={cn(field, "w-36 flex-1")} />
      <input type="date" value={f.weddingDate} onChange={(e) => setF({ ...f, weddingDate: e.target.value })} className={cn(field, "w-40")} />
      <button type="submit" className={pill}>Ekle</button>
      {err && <p className="w-full text-xs text-red-300">{err}</p>}
    </form>
  );
}

function CapacityEditor({ config, months, onSaved }: { config: AiCapacityConfig; months: AiCapacityInfo[]; onSaved: () => void }) {
  const [def, setDef] = useState(String(config.defaultPerMonth));
  const [totals, setTotals] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(config.months).map(([k, v]) => [k, String(v)]))
  );
  const [manual, setManual] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(config.manualBooked).map(([k, v]) => [k, String(v)]))
  );
  const [saved, setSaved] = useState(false);

  const toNums = (m: Record<string, string>) =>
    Object.fromEntries(Object.entries(m).filter(([, v]) => v.trim() !== "").map(([k, v]) => [k, Number(v)]));

  return (
    <AdminSection title="Kontenjan" description="Kalan yer = aylık kapasite − onaylı rezervasyonlar − elle düşülen. Sesli asistan ve takip mesajları bu GERÇEK rakamı söyler.">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-rm-gray-400">
          Aylık varsayılan kapasite (çift)
          <input type="number" min={0} max={200} value={def} onChange={(e) => setDef(e.target.value)} className={cn(field, "mt-1 w-28")} />
        </label>
        <button
          type="button"
          className={pill}
          onClick={async () => {
            await fetch("/api/admin/ai-capacity", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ defaultPerMonth: Number(def), months: toNums(totals), manualBooked: toNums(manual) }),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            onSaved();
          }}
        >
          {saved ? "Kaydedildi ✓" : "Kaydet"}
        </button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-[10px] tracking-[0.16em] text-rm-gray-500 uppercase">
              <th className="py-2">Ay</th>
              <th>Kapasite</th>
              <th>Rezervasyon + elle</th>
              <th>Elle dolu</th>
              <th>Kalan</th>
            </tr>
          </thead>
          <tbody>
            {months.map((w) => (
              <tr key={w.monthKey} className="border-t border-white/5">
                <td className="py-2 text-rm-gray-300">{w.monthLabel}</td>
                <td>
                  <input type="number" min={0} max={200} placeholder={def} value={totals[w.monthKey] ?? ""} onChange={(e) => setTotals({ ...totals, [w.monthKey]: e.target.value })} className={cn(field, "h-8 w-20")} />
                </td>
                <td className="tabular-nums text-rm-gray-400">{w.booked}</td>
                <td>
                  <input type="number" min={0} max={200} placeholder="0" value={manual[w.monthKey] ?? ""} onChange={(e) => setManual({ ...manual, [w.monthKey]: e.target.value })} className={cn(field, "h-8 w-20")} />
                </td>
                <td className={cn("font-semibold tabular-nums", w.remaining <= 1 ? "text-orange-300" : "text-rm-off-white")}>{w.remaining}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminSection>
  );
}

function IntegrationBox({ integration }: { integration: Payload["integration"] }) {
  const [show, setShow] = useState(false);
  const [tg, setTg] = useState<string | null>(null);
  const [botToken, setBotToken] = useState("");
  const base = integration.baseUrl;
  const endpoints = [
    ["POST", "/api/ai/couples", "Yeni çift (Düğün.com / Meta form)"],
    ["GET", "/api/ai/queue", "Şimdi yapılacak arama ve mesajlar"],
    ["GET", "/api/ai/couples/{id}/can-contact?channel=call", "Aramadan önce izin kontrolü"],
    ["POST", "/api/ai/couples/{id}/calls", "Arama sonucu, özet, ses kaydı"],
    ["POST", "/api/ai/couples/{id}/messages", "WhatsApp mesajı (giden: önce izin, gelen: niyet)"],
    ["PATCH", "/api/ai/couples/{id}", "Durum: thinking, no_reply, won…"],
    ["GET", "/api/ai/capacity?date=YYYY-MM-DD", "Gerçek kalan kontenjan"],
    ["POST", "/api/ai/report", "Akşam raporunu Telegram'a gönder"],
    ["POST", "/api/telegram/webhook", "Telegram komutları (sesli komut: n8n → { text })"],
  ];
  return (
    <AdminSection title="Entegrasyon (n8n · sesli asistan · Telegram)" description="n8n isteklerinde başlık: Authorization: Bearer <anahtar>. Anahtarı kimseyle paylaşmayın.">
      <div className="flex flex-wrap items-center gap-2">
        <code className="flex-1 truncate rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-rm-gray-300">
          {show ? integration.apiToken : "•".repeat(32)}
        </code>
        <button type="button" onClick={() => setShow(!show)} className={pill} aria-label="Anahtarı göster">
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <button type="button" onClick={() => navigator.clipboard?.writeText(integration.apiToken)} className={pill} aria-label="Kopyala">
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
      <ul className="mt-4 space-y-1.5 text-xs">
        {endpoints.map(([m, p, d]) => (
          <li key={p} className="flex flex-wrap gap-x-2">
            <span className="w-12 font-semibold text-rm-champagne">{m}</span>
            <code className="text-rm-gray-300">{base}{p}</code>
            <span className="text-rm-gray-500">— {d}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="password"
          value={botToken}
          onChange={(e) => setBotToken(e.target.value)}
          placeholder={integration.telegramReady ? "Bot ayarlı — değiştirmek için yeni anahtar" : "BotFather'dan aldığın bot anahtarı (123456:AA…)"}
          className="min-w-[16rem] flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder:text-rm-gray-500"
          autoComplete="off"
        />
        <button
          type="button"
          disabled={!integration.telegramReady && !botToken.trim()}
          onClick={async () => {
            setTg("Bağlanıyor…");
            const res = await fetch("/api/admin/ai-telegram", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(botToken.trim() ? { token: botToken.trim() } : {}),
            });
            const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
            if (j.ok) setBotToken("");
            setTg(j.ok ? "✅ Bağlandı — Telegram'a test mesajı gitti" : `⚠️ ${j.error ?? "Bağlanamadı"}`);
          }}
          className={pill}
        >
          <Send className="h-3.5 w-3.5" /> {"Telegram'ı bağla"}
        </button>
      </div>
      <p className="mt-2 text-xs text-rm-gray-400">
        {tg ?? (integration.telegramReady ? "Bot ayarlı" : "1) Telegram'da @BotFather → /newbot  2) Verdiği anahtarı buraya yapıştır  3) Kendi botuna /start yaz  4) Butona bas")}
      </p>
    </AdminSection>
  );
}
