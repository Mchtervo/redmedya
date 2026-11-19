"use client";

import { useCallback, useEffect, useState } from "react";

/** n8n panel kancasından gelen canlı durum (kampanya / otomatik arama / WhatsApp hattı). */
export type AiSystemStatus = {
  /** undefined = henüz yükleniyor */
  n8n?: boolean;
  whatsapp?: boolean;
  arama?: boolean;
  kampanya?: boolean;
  bugunWhatsapp?: number;
  bugunArama?: number;
  error?: string;
};

type Raw = { ok?: boolean; kampanya?: boolean; arama?: boolean; whatsapp?: boolean; bugunWhatsapp?: number; bugunArama?: number; error?: string };

// Aynı anda açık birden fazla bileşen n8n'i tekrar tekrar çağırmasın: 20 sn önbellek.
let cache: { at: number; data: AiSystemStatus } | null = null;
let inflight: Promise<AiSystemStatus> | null = null;
const listeners = new Set<(s: AiSystemStatus) => void>();

async function fetchStatus(force = false): Promise<AiSystemStatus> {
  if (!force && cache && Date.now() - cache.at < 20_000) return cache.data;
  if (inflight) return inflight;
  inflight = fetch("/api/admin/ai-campaign", { cache: "no-store" })
    .then(async (r) => {
      const j = (await r.json().catch(() => ({}))) as Raw;
      if (!r.ok || !j.ok) return { n8n: false, error: j.error ?? "Otomasyona ulaşılamadı" } satisfies AiSystemStatus;
      return { n8n: true, whatsapp: j.whatsapp, arama: j.arama, kampanya: j.kampanya, bugunWhatsapp: j.bugunWhatsapp, bugunArama: j.bugunArama };
    })
    .catch(() => ({ n8n: false, error: "Otomasyona ulaşılamadı" }) as AiSystemStatus)
    .then((data) => {
      cache = { at: Date.now(), data };
      inflight = null;
      listeners.forEach((l) => l(data));
      return data;
    });
  return inflight;
}

/** Durumu okur, dakikada bir tazeler. `refresh()` başlat/durdur sonrası zorla yeniler. */
export function useAiSystemStatus(pollMs = 60_000) {
  const [status, setStatus] = useState<AiSystemStatus>(() => cache?.data ?? {});
  useEffect(() => {
    listeners.add(setStatus);
    fetchStatus().then(setStatus);
    const t = setInterval(() => fetchStatus(true), pollMs);
    return () => {
      listeners.delete(setStatus);
      clearInterval(t);
    };
  }, [pollMs]);
  const refresh = useCallback(() => fetchStatus(true), []);
  return { status, refresh };
}
