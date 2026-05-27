"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { EASE_LUXURY, EASE_CINEMATIC } from "@/lib/animations";
import { BrandLogo } from "@/components/layout/brand-logo";

export function IntroLoader() {
  const [phase, setPhase] = useState<"logo" | "reveal" | "done">("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"), 1100);
    const t2 = setTimeout(() => setPhase("done"), 1900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="intro"
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-rm-black"
        exit={{ opacity: 0 }}
        transition={{ duration: 1, ease: EASE_LUXURY }}
      >
        {/* Curtain panels */}
        <motion.div
          className="absolute inset-y-0 left-0 w-1/2 bg-rm-black origin-left"
          initial={{ scaleX: 1 }}
          animate={phase === "reveal" ? { scaleX: 0 } : { scaleX: 1 }}
          transition={{ duration: 1.1, ease: EASE_CINEMATIC }}
        />
        <motion.div
          className="absolute inset-y-0 right-0 w-1/2 bg-rm-black origin-right"
          initial={{ scaleX: 1 }}
          animate={phase === "reveal" ? { scaleX: 0 } : { scaleX: 1 }}
          transition={{ duration: 1.1, ease: EASE_CINEMATIC }}
        />

        <motion.div
          className="relative z-10 text-center"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: "blur(12px)" }}
          transition={{ duration: 0.9, ease: EASE_LUXURY }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: EASE_LUXURY }}
          >
            <BrandLogo href="" size="intro" variant="on-dark" priority />
          </motion.div>
          <motion.div
            className="mx-auto mt-8 h-px bg-gradient-to-r from-transparent via-rm-champagne to-transparent"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 120, opacity: 1 }}
            transition={{ delay: 0.6, duration: 1, ease: EASE_CINEMATIC }}
          />
          <motion.p
            className="mt-6 text-[9px] tracking-[0.5em] text-rm-gray-400 uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            Cinematic Wedding Stories
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
