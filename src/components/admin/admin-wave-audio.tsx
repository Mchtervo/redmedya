"use client";

import { useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/* ───────────────────────── Dalga formlu ses oynatıcı ───────────────────────── */

export function WaveAudio({ src, seed }: { src: string; seed: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const bars = useMemo(() => {
    const out: number[] = [];
    for (let i = 0, h = hash(seed); i < 56; i++) {
      h = (h * 1103515245 + 12345) >>> 0;
      const env = 0.55 + 0.45 * Math.sin((i / 56) * Math.PI);
      out.push(Math.round((0.25 + ((h % 1000) / 1000) * 0.75) * env * 100));
    }
    return out;
  }, [seed]);
  const pct = dur ? t / dur : 0;
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => setPlaying(false));
    else a.pause();
  };
  const seek = (ratio: number) => {
    const a = ref.current;
    if (a && dur) a.currentTime = Math.min(Math.max(ratio, 0), 1) * dur;
  };
  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-2.5">
      <audio
        ref={ref}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
      />
      <button type="button" onClick={toggle} aria-label={playing ? "Duraklat" : "Ses kaydını oynat"} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-[0_6px_14px_-6px_rgba(79,70,229,0.9)]">
        {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
      </button>
      <div
        className="flex h-10 flex-1 cursor-pointer items-center gap-[2px]"
        role="slider"
        aria-label="Ses kaydı konumu"
        aria-valuemin={0}
        aria-valuemax={Math.round(dur)}
        aria-valuenow={Math.round(t)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (!dur) return;
          if (e.key === "ArrowRight") seek((t + 5) / dur);
          if (e.key === "ArrowLeft") seek((t - 5) / dur);
        }}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          seek((e.clientX - r.left) / r.width);
        }}
      >
        {bars.map((h, i) => (
          <span key={i} className={cn("flex-1 rounded-full transition-colors", i / bars.length <= pct ? "bg-indigo-600" : "bg-indigo-200")} style={{ height: `${h}%` }} />
        ))}
      </div>
      <span className="w-20 shrink-0 text-right text-[11px] text-slate-500 tabular-nums">
        {mmss(t)} / {dur ? mmss(dur) : "–:––"}
      </span>
    </div>
  );
}

