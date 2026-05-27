"use client";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function FilmGrain() {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <div
      className="film-grain pointer-events-none fixed inset-0 z-[100] overflow-hidden opacity-[0.04] mix-blend-overlay"
      aria-hidden
    />
  );
}
