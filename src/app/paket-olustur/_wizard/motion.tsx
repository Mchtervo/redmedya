"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * §9.2 & §9.7 — requestAnimationFrame tabanlı count-up.
 * reduced-motion'da anında hedefe atlar (hareket yok). tabular-nums ile hizalı.
 */
export function CountUp({
  value,
  durationMs = 800,
  format = (n) => String(Math.round(n)),
  className,
}: {
  value: number;
  durationMs?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0); // görünürken 0→hedef
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduce) {
      // reduced-motion: animasyon yok, hedef değere anında geç.
      // Render sırasında dallanmıyoruz — sunucu ile ilk client render'ı
      // aynı metni üretsin diye değer effect'te atanıyor.
      const raf = requestAnimationFrame(() => setDisplay(value));
      fromRef.current = value;
      return () => cancelAnimationFrame(raf);
    }
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    let start: number | null = null;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / durationMs);
      setDisplay(from + (to - from) * ease(p)); // rAF callback — effect body değil
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = value;
    };
  }, [value, durationMs, reduce]);

  return <span className={className}>{format(display)}</span>;
}

/**
 * §9.2 — paket seçiminde 8-12 parçacık mini konfeti (tek sefer).
 * `trigger` her arttığında bir kez patlar. reduced-motion'da HİÇ çalışmaz.
 * Yalnızca transform + opacity.
 */
const CONFETTI_COLORS = ["#c4a052", "#e2cfa0", "#34c759", "#f5f2eb"];
export function ConfettiBurst({ trigger }: { trigger: number }) {
  const reduce = useReducedMotion();
  const [pieces, setPieces] = useState<
    { id: number; x: number; y: number; rot: number; color: string }[]
  >([]);

  useEffect(() => {
    if (reduce || trigger === 0) return;
    const next = Array.from({ length: 11 }, (_, i) => ({
      id: trigger * 100 + i,
      x: (Math.cos((i / 11) * Math.PI * 2) + (i % 2 ? 0.3 : -0.3)) * 60,
      y: -30 - (i % 5) * 12,
      rot: (i - 5) * 40,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    }));
    // setState effect gövdesinde değil rAF/timeout callback'inde → cascading render yok
    const raf = requestAnimationFrame(() => setPieces(next));
    const t = setTimeout(() => setPieces([]), 900);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [trigger, reduce]);

  if (reduce || !pieces.length) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-6 z-30 h-0 w-0" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
          animate={{ opacity: 0, x: p.x, y: p.y, scale: 0.4, rotate: p.rot }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ background: p.color }}
          className="absolute h-2 w-2 rounded-[1px]"
        />
      ))}
    </div>
  );
}

/** §9.10 — adım geçişi varyantları (24px yatay slide + fade, yön farkındalı) */
export const stepVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? 24 : -24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? -24 : 24, opacity: 0 }),
};
