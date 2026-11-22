"use client";

/**
 * WhatsApp bağlantısı koptuysa panelin en üstünde QR gösterir (telefondan okutulur). Bağlıyken görünmez.
 * QR ~40 sn'de bir yenilenir; bağlanınca kendiliğinden kaybolur.
 */
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Smartphone } from "lucide-react";

type S = { ok: boolean; state?: string; qr?: string; pairingCode?: string | null; error?: string };

export function AdminWaConnection() {
  const [s, setS] = useState<S | null>(null);
  const [justConnected, setJustConnected] = useState(false);
  const load = useCallback(() => {
    fetch("/api/admin/wa-qr", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: S) =>
        setS((prev) => {
          if (prev && prev.state !== "open" && j.state === "open") setJustConnected(true);
          return j;
        }),
      )
      .catch(() => null);
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 20_000);
    return () => clearInterval(t);
  }, [load]);

  if (!s) return null;
  if (s.state === "open") {
    return justConnected ? <div className="rm-card border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">✅ WhatsApp bağlandı — mesajlar yeniden gidip geliyor.</div> : null;
  }
  return (
    <section className="rm-card border-2 border-rose-300 bg-rose-50/60 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-rose-900">
            <Smartphone className="size-5" aria-hidden /> WhatsApp bağlantısı koptu — mesajlar gitmiyor, gelenler sisteme düşmüyor
          </p>
          <p className="mt-1 text-xs text-rose-900/80">
            Telefonda WhatsApp → Ayarlar → <b>Bağlı cihazlar</b> → <b>Cihaz bağla</b> deyip aşağıdaki QR&apos;ı okutun. QR birkaç saniyede bir yenilenir.
          </p>
        </div>
        <button type="button" onClick={load} aria-label="Yenile" className="grid size-9 shrink-0 place-items-center rounded-xl border border-rose-200 bg-white text-rose-700">
          <RefreshCw className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        {s.qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.qr} alt="WhatsApp QR" className="size-56 rounded-xl border border-rose-200 bg-white p-2" />
        ) : (
          <p className="text-sm text-rose-800">{s.error ?? "QR hazırlanıyor… birkaç saniye sonra yenileyin."}</p>
        )}
        {s.pairingCode && (
          <p className="text-sm text-rose-900">
            QR okutamazsanız telefon numarasıyla bağlama kodu: <b className="tracking-widest">{s.pairingCode}</b>
          </p>
        )}
      </div>
      <p className="mt-2 text-[11px] text-rose-900/70">Durum: {s.state}</p>
    </section>
  );
}
