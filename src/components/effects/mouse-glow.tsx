"use client";

import { motion } from "framer-motion";
import { useMousePosition } from "@/hooks/use-mouse-position";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function MouseGlow() {
  const reduced = useReducedMotion();
  const { x, y } = useMousePosition(!reduced);

  if (reduced) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[2] hidden md:block"
      aria-hidden
      style={{
        background: `radial-gradient(600px circle at ${x}px ${y}px, rgba(201, 169, 98, 0.07), transparent 45%)`,
      }}
      animate={{
        background: `radial-gradient(600px circle at ${x}px ${y}px, rgba(201, 169, 98, 0.07), transparent 45%)`,
      }}
      transition={{ type: "tween", ease: "linear", duration: 0.15 }}
    />
  );
}
