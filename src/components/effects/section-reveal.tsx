"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

type SectionRevealProps = {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
  delay?: number;
};

export function SectionReveal({
  children,
  className,
  stagger = false,
}: SectionRevealProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={stagger ? staggerContainer : undefined}
    >
      {stagger ? (
        children
      ) : (
        <motion.div variants={fadeUp}>{children}</motion.div>
      )}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div className={className} variants={fadeUp} custom={index}>
      {children}
    </motion.div>
  );
}
