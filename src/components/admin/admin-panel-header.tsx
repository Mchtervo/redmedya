"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { EASE_LUXURY } from "@/lib/animations";

type AdminPanelHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Sağda action button(lar) */
  actions?: ReactNode;
  /** Hızlı sayı rozetleri (örn. "12 bekleyen · 34 toplam") */
  meta?: string;
};

/**
 * Tüm admin panellerinin tepesinde kullanılan tek tip başlık.
 *
 * - sol: küçük eyebrow ("BÖLÜM") + editorial başlık + opsiyonel açıklama
 * - sağ: opsiyonel action butonları
 * - altta: meta satırı (sayaçlar, küçük durum metni)
 */
export function AdminPanelHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  meta,
}: AdminPanelHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_LUXURY }}
      className="relative overflow-hidden rounded-2xl border border-white/8 bg-rm-black-elevated/60 p-6 backdrop-blur-sm md:p-7"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-16 h-44 w-44 rounded-full bg-rm-champagne/[0.05] blur-3xl"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-start gap-4">
          {Icon && (
            <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rm-champagne/25 bg-rm-champagne/10 text-rm-champagne">
              <Icon className="h-5 w-5" strokeWidth={1.6} />
            </span>
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.3em] text-rm-champagne uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-2 font-editorial text-3xl leading-tight text-rm-off-white md:text-[2.25rem]">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-rm-gray-400">
                {description}
              </p>
            )}
            {meta && (
              <p className="mt-3 text-xs text-rm-gray-500">{meta}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </motion.header>
  );
}

type AdminSectionProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  /** Kart yerine başlık + içerik olarak göster */
  flat?: boolean;
  className?: string;
};

/**
 * Panel içinde ikinci seviye bölüm başlığı + kart sarmalayıcı.
 */
export function AdminSection({
  title,
  description,
  icon: Icon,
  actions,
  children,
  flat,
  className,
}: AdminSectionProps) {
  return (
    <section
      className={
        flat
          ? className
          : `rounded-2xl border border-white/8 bg-rm-black-elevated/60 p-6 backdrop-blur-sm ${className ?? ""}`
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/8 pb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-rm-champagne/25 bg-rm-champagne/10 text-rm-champagne">
              <Icon className="h-4 w-4" strokeWidth={1.6} />
            </span>
          )}
          <div>
            <h3 className="font-editorial text-xl text-rm-off-white">{title}</h3>
            {description && (
              <p className="mt-0.5 text-xs text-rm-gray-500">{description}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

type AdminEmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
};

/**
 * Tutarlı boş-state görünümü. Liste/tablo boşken kullanılır.
 */
export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-14 text-center">
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rm-champagne/25 bg-rm-champagne/10 text-rm-champagne">
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </span>
      )}
      <p className="font-editorial text-lg text-rm-off-white">{title}</p>
      {description && (
        <p className="max-w-md text-sm text-rm-gray-500">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
