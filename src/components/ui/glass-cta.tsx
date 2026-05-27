"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MagneticButton } from "@/components/effects/magnetic-button";
import type { ReactNode } from "react";

type GlassCtaProps = {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "ghost" | "whatsapp";
  className?: string;
  external?: boolean;
  onClick?: () => void;
  type?: "link" | "button";
};

const variants = {
  primary:
    "border-rm-champagne/30 bg-gradient-to-br from-rm-champagne/20 via-white/5 to-transparent text-rm-off-white shadow-[0_0_40px_rgba(201,169,98,0.12),inset_0_1px_0_rgba(255,255,255,0.1)]",
  ghost:
    "border-white/15 bg-white/[0.04] text-rm-off-white backdrop-blur-xl hover:border-white/25",
  whatsapp:
    "border-[#25D366]/40 bg-[#25D366]/15 text-white shadow-[0_0_30px_rgba(37,211,102,0.2)]",
};

export function GlassCta({
  href,
  children,
  variant = "primary",
  className,
  external,
  onClick,
  type = "link",
}: GlassCtaProps) {
  const content = (
    <motion.span
      className={cn(
        "glass-cta group relative flex items-center justify-center gap-2.5 overflow-hidden rounded-full border px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase transition-colors duration-500",
        variants[variant],
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.span>
  );

  if (type === "button" || !href) {
    return (
      <MagneticButton strength={0.25}>
        <button type="button" onClick={onClick} className="text-left">
          {content}
        </button>
      </MagneticButton>
    );
  }

  return (
    <MagneticButton strength={0.25}>
      {external ? (
        <a href={href} onClick={onClick} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      ) : (
        <Link href={href} onClick={onClick}>
          {content}
        </Link>
      )}
    </MagneticButton>
  );
}
