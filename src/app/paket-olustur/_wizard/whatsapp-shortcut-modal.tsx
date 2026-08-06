"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { COPY } from "@/content/paketOlustur";
import { WeddingDatePicker } from "@/components/ui/wedding-date-picker";
import { goToWhatsApp } from "@/lib/paket/go-to-whatsapp";
import { track } from "@/lib/track/tracker";
import { useWizard } from "./wizard-context";

/**
 * §2 — Formu doldurmadan kaçmak isteyen çift için hızlı yol.
 * Adım 2 sticky bar'ından açılır: TEK alan (düğün tarihi) → paket+tarih dolu
 * mesajla direkt WhatsApp. Contact + WhatsAppClick + Lead ateşlenir (helper).
 */
export function WhatsAppShortcutModal({ onClose }: { onClose: () => void }) {
  const { state, totals, setField } = useWizard();
  const [date, setDate] = useState(state.date);
  const s = COPY.whatsappShortcut;

  const confirm = () => {
    if (!date) return;
    // Seçilen tarihi wizard state'ine de yaz (tutarlılık + taslak)
    setField("date", date);
    track("wa_shortcut_sent", { total: totals.total, package_id: state.packageId ?? 0 });
    // state async güncellendiği için mesajı augmented state'ten üret + Lead ateşle
    goToWhatsApp({ ...state, date }, { fireLead: true, source: "shortcut" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 p-4 backdrop-blur-md sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-[#25D366]/30 bg-rm-black-elevated p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#25D366]/15 text-[#25D366]">
              <MessageCircle className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-bold text-rm-off-white">{s.modalTitle}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-rm-gray-400 hover:text-rm-off-white"
            aria-label={s.modalSkip}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-rm-gray-300">{s.modalBody}</p>

        <div className="mt-4">
          <WeddingDatePicker value={date} onChange={setDate} />
        </div>

        <button
          type="button"
          onClick={confirm}
          disabled={!date}
          className={
            "mt-5 flex w-full items-center justify-center gap-2 rounded-sm py-4 text-sm font-bold tracking-wide uppercase transition-all " +
            (date
              ? "bg-[#25D366] text-white shadow-lg hover:bg-[#20bd5a]"
              : "cursor-not-allowed bg-white/5 text-rm-gray-500")
          }
        >
          <MessageCircle className="h-5 w-5" />
          {s.modalCta}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-md px-4 py-2 text-sm text-rm-gray-400 hover:bg-white/5 hover:text-rm-off-white"
        >
          {s.modalSkip}
        </button>
      </div>
    </div>
  );
}
