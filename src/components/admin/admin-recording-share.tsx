"use client";

/**
 * Ses kaydını İNDİR / PAYLAŞ (telefonun paylaşım menüsü → WhatsApp → istediğin kişi).
 * Kendi WhatsApp'ından gider; işletme hattı kullanılmaz.
 */
import { useState } from "react";
import { Download, Share2 } from "lucide-react";

function safeName(s: string) {
  return (s || "kayit").toLocaleLowerCase("tr-TR").replace(/[^a-z0-9çğıöşü]+/gi, "-").replace(/^-|-$/g, "").slice(0, 40) || "kayit";
}

export function RecordingShare({ conv, name, prefix = "saka" }: { conv: string; name: string; prefix?: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const url = `/api/admin/ai-recording/${conv}`;
  const file = `${prefix}-${safeName(name)}.mp3`;

  const download = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    } catch {
      setMsg("Kayıt indirilemedi — biraz sonra tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("kayit");
      const f = new File([await res.blob()], file, { type: "audio/mpeg" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files: [f] })) {
        await nav.share({ files: [f], title: "🎭 Şaka araması", text: `🎭 ${name} şakası 😂` });
      } else {
        await download();
        setMsg("Bu tarayıcı doğrudan paylaşamıyor — kayıt indirildi, WhatsApp'tan dosya olarak gönderebilirsiniz.");
      }
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") setMsg("Paylaşılamadı — 'İndir' ile indirip WhatsApp'tan gönderin.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button type="button" disabled={busy} onClick={share} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
        <Share2 className="h-4 w-4" /> Paylaş (WhatsApp)
      </button>
      <button type="button" disabled={busy} onClick={download} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 hover:border-slate-300 disabled:opacity-50">
        <Download className="h-4 w-4" /> İndir
      </button>
      {busy && <span className="text-xs text-slate-500">Hazırlanıyor…</span>}
      {msg && <span className="w-full text-xs text-amber-700">{msg}</span>}
    </div>
  );
}
