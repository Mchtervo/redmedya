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
      className="relative px-1 pt-1"
    >
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {Icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-[0_10px_20px_-10px_rgba(79,70,229,0.8)]">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.6} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold tracking-[0.1em] text-indigo-600 uppercase">
              {eyebrow}
            </p>
            <h1 className="font-editorial text-xl leading-tight text-slate-900 sm:text-2xl">
              {title}
            </h1>
            {description && (
              <p className="mt-0.5 hidden max-w-2xl truncate text-xs text-slate-500 md:block">
                {description}
              </p>
            )}
            {meta && (
              <p className="mt-1 text-xs text-slate-500">
                {meta}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
            {actions}
          </div>
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
          : `rm-card p-4 sm:p-5 md:p-6 ${className ?? ""}`
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-3 sm:pb-4">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          {Icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Icon className="h-4 w-4" strokeWidth={1.6} />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="truncate font-editorial text-base text-slate-900 sm:text-lg">
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 text-xs text-slate-500">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      <div className="mt-4 sm:mt-5">{children}</div>
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
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-14 text-center">
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </span>
      )}
      <p className="font-editorial text-lg text-slate-900">{title}</p>
      {description && (
        <p className="max-w-md text-sm text-slate-500">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
