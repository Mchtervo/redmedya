"use client";

/**
 * 📸 Instagram DM konuşmaları — her sohbetin kısa gidişatı: kim (isim + @kullanıcı), hangi aşamada,
 * tek cümlelik özet, numara / arama saati. Konuşmanın tamamı değil; "şu an nerede" bilgisi.
 */
import { useCallback, useEffect, useState } from "react";
import { Camera, ChevronDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type Thread = {
  igsid: string;
  name: string | null;
  username: string | null;
  stage: string | null;
  stageLabel: string;
  summary: string | null;
  phone: string | null;
  callAt: string | null;
  weddingDate: string | null;
  coupleId: string | null;
  test: boolean;
  waitingUs: boolean;
  ownerPaused: boolean;
  lastIn: { at: string; text: string } | null;
  lastOut: { at: string; text: string; by: string | null } | null;
  messageCount: number;
  updatedAt: string;
};

const TONE: Record<string, string> = {
  numara_alindi: "bg-emerald-100 text-emerald-800",
  arama_saati_alindi: "bg-emerald-100 text-emerald-800",
  kapora_konusuldu: "bg-emerald-100 text-emerald-800",
  fiyat_verildi: "bg-sky-100 text-sky-800",
  fiyat_istedi: "bg-amber-100 text-amber-800",
  numara_istendi: "bg-amber-100 text-amber-800",
  firsat_anlatildi: "bg-sky-100 text-sky-800",
  tarih_alindi: "bg-sky-100 text-sky-800",
  numara_vermedi: "bg-violet-100 text-violet-800",
  ilgilenmiyor: "bg-slate-200 text-slate-600",
  devredildi: "bg-rose-100 text-rose-800",
};

const ago = (iso: string) => {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} sa önce`;
  return `${Math.round(h / 24)} gün önce`;
};
const when = (iso: string) => new Date(iso).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function AdminIgThreads() {
  const [list, setList] = useState<Thread[] | null>(null);
  const [err, setErr] = useState(false);
  const load = useCallback(() => {
    fetch("/api/admin/ig-threads", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j: { threads?: Thread[] }) => {
        setList(j.threads ?? []);
        setErr(false);
      })
      .catch(() => setErr(true));
  }, []);
  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const waiting = list?.filter((t) => t.waitingUs).length ?? 0;
  const phones = list?.filter((t) => t.phone).length ?? 0;

  return (
    <details className="group rm-card overflow-hidden" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2.5">
          <Camera className="size-5 text-pink-600" aria-hidden />
          <span>
            <span className="block text-sm font-semibold text-slate-900">Instagram DM konuşmaları</span>
            <span className="block text-xs text-slate-500">
              {list ? `${list.length} sohbet · ${phones} numara alındı${waiting ? ` · ${waiting} cevap bekliyor` : ""}` : "Yükleniyor…"}
            </span>
          </span>
        </span>
        <span className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              load();
            }}
            className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800"
            aria-label="Yenile"
          >
            <RefreshCw className="size-4" aria-hidden />
          </button>
          <ChevronDown className="size-4 text-slate-400 transition-transform group-open:rotate-180" aria-hidden />
        </span>
      </summary>

      <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
        {err && <p className="text-sm text-rose-600">Konuşmalar yüklenemedi.</p>}
        {list && !list.length && <p className="text-sm text-slate-500">Henüz Instagram&apos;dan yazan yok.</p>}
        <ul className="divide-y divide-slate-100">
          {list?.map((t) => (
            <li key={t.igsid} className="py-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-semibold text-slate-900">{t.name || (t.username ? `@${t.username}` : "İsimsiz")}</span>
                {t.username && t.name && <span className="text-xs text-slate-500">@{t.username}</span>}
                {t.test && <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">TEST</span>}
                <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-semibold", TONE[t.stage ?? ""] ?? "bg-slate-100 text-slate-700")}>{t.stageLabel}</span>
                {t.waitingUs && <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[11px] font-semibold text-rose-700">Cevap bekliyor</span>}
                {t.ownerPaused && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">Siz yazıyorsunuz — asistan beklemede</span>}
                <span className="ml-auto text-[11px] text-slate-400">{ago(t.updatedAt)}</span>
              </div>
              {t.summary && <p className="mt-1 text-sm text-slate-700">{t.summary}</p>}
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                {t.phone && <span>📞 {t.phone}</span>}
                {t.callAt && <span>⏰ {when(t.callAt)} aranacak</span>}
                {t.weddingDate && <span>📅 {t.weddingDate.split("-").reverse().join(".")}</span>}
                {t.coupleId && <span>✓ Panelde kayıtlı</span>}
                {!t.summary && t.lastIn && <span className="truncate">💬 &ldquo;{t.lastIn.text}&rdquo;</span>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
