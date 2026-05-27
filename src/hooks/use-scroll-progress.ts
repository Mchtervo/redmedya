"use client";

import { useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef, type RefObject } from "react";

export function useSectionParallax() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.6, 1, 1, 0.6]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.05, 1, 1.02]);

  return { ref, y, opacity, scale, scrollYProgress };
}

export function useHeroParallax(): {
  ref: RefObject<HTMLElement | null>;
  videoY: MotionValue<string>;
  contentY: MotionValue<string>;
  opacity: MotionValue<number>;
} {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return { ref, videoY, contentY, opacity };
}
