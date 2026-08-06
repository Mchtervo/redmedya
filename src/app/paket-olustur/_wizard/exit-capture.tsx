"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, MessageCircle, X } from "lucide-react";
import { COPY } from "@/content/paketOlustur";
import { goToWhatsApp } from "@/lib/paket/go-to-whatsapp";
import { track } from "@/lib/track/tracker";
import { useWizard } from "./wizard-context";

/**
 * §4 — Çıkış yakalama. Adım 2 veya 3'te sayfadan ayrılmaya çalışan çifti
 * TEK SEFER yakalar: "Paketiniz kaydedildi" + [Linki Kopyala] + [WhatsApp].
 *
 * Tetikleyiciler:
 *  - Masaüstü: imleç sayfanın üstünden çıkarsa (exit-intent).
 *  - Mobil/genel: tarayıcı GERİ tuşu (sentinel history entry ile yakalanır;
 *    ilk geri basışta çıkmak yerine modal açılır).
 *
 * Wizard'ın kendi popstate adım-senkronu ile çakışmaması için geri tuşu
 * CAPTURE fazında yakalanır ve tüketilince stopImmediatePropagation ile
 * wizard'ın handler'ı susturulur.
 */
export function ExitCapture() {
  const { state, shareUrl } = useWizard();
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const shownRef = useRef(false);
  const stepRef = useRef(state.step);
  const packageRef = useRef(state.packageId);

  useEffect(() => {
    stepRef.current = state.step;
    packageRef.current = state.packageId;
  }, [state.step, state.packageId]);

  const active = state.step >= 2 && state.packageId != null;

  const show = () => {
    if (shownRef.current) return false;
    if (stepRef.current < 2 || packageRef.current == null) return false;
    shownRef.current = true;
    setVisible(true);
    track("exit_capture_shown", { step: stepRef.current });
    return true;
  };

  // Masaüstü exit-intent — imleç viewport üstünden çıkınca
  useEffect(() => {
    if (!active) return;
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) show();
    };
    document.addEventListener("mouseout", onMouseOut);
    return () => document.removeEventListener("mouseout", onMouseOut);
  }, [active]);

  // Geri tuşu — sentinel history entry + capture-fazı yakalama
  useEffect(() => {
    if (!active || shownRef.current) return;

    // Sayfada kalmayı sağlayan tampon giriş
    window.history.pushState(
      { ...(window.history.state ?? {}), rmExitGuard: true },
      ""
    );

    const onPop = (e: PopStateEvent) => {
      if (shownRef.current) return; // bir kez gösterildi → normal davran
      const opened = show();
      if (opened) {
        // Çıkışı iptal et: kullanıcı sayfada kalsın
        window.history.pushState(
          { ...(window.history.state ?? {}), rmExitGuard: true },
          ""
        );
        e.stopImmediatePropagation(); // wizard'ın adım-senkronu tetiklenmesin
      }
    };

    window.addEventListener("popstate", onPop, true); // CAPTURE
    return () => window.removeEventListener("popstate", onPop, true);
  }, [active]);

  const close = () => setVisible(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      track("exit_capture_copy", {});
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard yoksa sessiz */
    }
  };

  const sendWhatsApp = () => {
    track("exit_capture_whatsapp", {});
    goToWhatsApp(state, { fireLead: true, source: "shortcut" });
    close();
  };

  if (!visible) return null;
  const s = COPY.exitCapture;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-4 backdrop-blur-md sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-rm-champagne/30 bg-rm-black-elevated p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-rm-off-white">{s.title}</h3>
          <button
            type="button"
            onClick={close}
            className="text-rm-gray-400 hover:text-rm-off-white"
            aria-label={s.dismiss}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-rm-gray-200">{s.body}</p>

        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={sendWhatsApp}
            className="flex w-full items-center justify-center gap-2 rounded-sm bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#20bd5a]"
          >
            <MessageCircle className="h-5 w-5" />
            {s.whatsapp}
          </button>
          <button
            type="button"
            onClick={copy}
            className="flex w-full items-center justify-center gap-2 rounded-sm border border-white/15 py-3 text-sm font-medium text-rm-gray-200 transition-colors hover:border-rm-champagne/40 hover:text-rm-off-white"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? s.copied : s.copy}
          </button>
        </div>

        <button
          type="button"
          onClick={close}
          className="mt-3 w-full rounded-md px-4 py-2 text-sm text-rm-gray-400 hover:bg-white/5 hover:text-rm-off-white"
        >
          {s.dismiss}
        </button>
      </div>
    </div>
  );
}
