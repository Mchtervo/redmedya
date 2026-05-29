"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ExternalLink, ShieldCheck, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ADMIN_NAV,
  ADMIN_NAV_GROUPS,
  isAdminTab,
  type AdminTabId,
} from "@/components/admin/admin-nav";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AdminOverviewPanel } from "@/components/admin/admin-overview-panel";
import { AdminCmsEditor } from "@/components/admin/admin-cms-editor";
import { AdminOperationsPanel } from "@/components/admin/admin-operations-panel";
import { AdminLeadsPanel } from "@/components/admin/admin-leads-panel";
import { AdminCalendarPanel } from "@/components/admin/admin-calendar-panel";
import { AdminRehberPanel } from "@/components/admin/admin-rehber-panel";
import { AdminPackagePanel } from "@/components/admin/admin-package-panel";
import { AdminDataPanel } from "@/components/admin/admin-data-panel";
import { AdminMissingPhoneAlerts } from "@/components/admin/admin-missing-phone-alerts";
import { BrandLogo } from "@/components/layout/brand-logo";
import { EASE_LUXURY } from "@/lib/animations";
import { useAdminCounts } from "@/hooks/use-admin-counts";
import { AdminCommandPalette } from "@/components/admin/admin-command-palette";

function AdminShellInner({ children }: { children?: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const tab: AdminTabId = isAdminTab(tabParam) ? tabParam : "overview";
  const [mobileNav, setMobileNav] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const counts = useAdminCounts();

  /** Hangi nav item'ında badge gözüksün */
  const badgeFor = (id: AdminTabId): { count: number; tone: "gold" | "red" } | null => {
    if (id === "leads" && counts.pendingLeads > 0) {
      return { count: counts.pendingLeads, tone: "gold" };
    }
    if (id === "calendar" && counts.missingPhone > 0) {
      return { count: counts.missingPhone, tone: "red" };
    }
    return null;
  };

  /** Ctrl+K / Cmd+K → komut paleti */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navigate = (id: AdminTabId) => {
    const q = new URLSearchParams({ tab: id });
    const res = searchParams.get("res");
    const edit = searchParams.get("edit");
    if (id === "calendar" && res) q.set("res", res);
    if (id === "calendar" && edit) q.set("edit", edit);
    router.push(`/admin?${q.toString()}`);
    setMobileNav(false);
  };

  useEffect(() => {
    setMobileNav(false);
  }, [tab]);

  const activeNav = ADMIN_NAV.find((n) => n.id === tab);

  const content = () => {
    switch (tab) {
      case "overview":
        return <AdminOverviewPanel onNavigate={(t) => navigate(t as AdminTabId)} />;
      case "calendar":
        return <AdminCalendarPanel />;
      case "leads":
        return <AdminLeadsPanel />;
      case "packages":
        return <AdminPackagePanel />;
      case "rehber":
        return <AdminRehberPanel />;
      case "cms":
        return <AdminCmsEditor embedded />;
      case "operations":
        return <AdminOperationsPanel />;
      case "data":
        return <AdminDataPanel />;
      default:
        return children;
    }
  };

  const Sidebar = ({ className }: { className?: string }) => (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-white/8 bg-gradient-to-b from-rm-black via-rm-black to-rm-black-elevated/40 backdrop-blur-xl",
        className
      )}
    >
      <div className="border-b border-white/8 px-5 pt-5 pb-4">
        <div className="flex items-center justify-between gap-2">
          <BrandLogo size="admin" variant="on-dark" href="/" />
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            title="Yönetim oturumu aktif"
          >
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.6} />
          </span>
        </div>
        <Link
          href="/"
          target="_blank"
          className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.2em] text-rm-gray-500 uppercase transition-colors hover:text-rm-champagne"
        >
          <ExternalLink className="h-3 w-3" />
          Siteye dön
        </Link>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-3 text-[9px] font-bold tracking-[0.32em] text-rm-gray-600 uppercase">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.ids
                .map((id) => ADMIN_NAV.find((n) => n.id === id))
                .filter((n): n is (typeof ADMIN_NAV)[number] => Boolean(n))
                .map((item) => {
                  const Icon = item.icon;
                  const active = tab === item.id;
                  const badge = badgeFor(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.id)}
                      className={cn(
                        "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all",
                        active
                          ? "bg-rm-champagne/[0.12] text-rm-off-white shadow-[inset_0_0_0_1px_rgba(196,160,82,0.18)]"
                          : "text-rm-gray-400 hover:bg-white/[0.04] hover:text-rm-off-white"
                      )}
                    >
                      {active && (
                        <span className="absolute top-1/2 -left-3 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-rm-champagne" />
                      )}
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          active
                            ? "text-rm-champagne"
                            : "text-rm-gray-500 group-hover:text-rm-champagne"
                        )}
                        strokeWidth={1.5}
                      />
                      <span className="flex-1 font-medium">{item.label}</span>
                      {badge && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                            badge.tone === "gold"
                              ? "bg-rm-champagne/25 text-rm-champagne"
                              : "bg-red-500/25 text-red-300"
                          )}
                        >
                          {badge.count}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/8 p-3">
        <AdminLogoutButton />
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-rm-black">
      <div className="hidden w-[260px] shrink-0 lg:block">
        <Sidebar className="fixed inset-y-0 left-0 z-40 w-[260px]" />
      </div>

      <AnimatePresence>
        {mobileNav && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileNav(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ ease: EASE_LUXURY, duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] lg:hidden"
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-white/8 bg-rm-black/85 px-3 py-2.5 backdrop-blur-md sm:gap-3 sm:px-4 sm:py-3.5 md:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-rm-off-white transition-colors hover:border-rm-champagne/40 hover:bg-rm-champagne/10 lg:hidden"
              onClick={() => setMobileNav(true)}
              aria-label="Menü"
            >
              {mobileNav ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <div className="flex min-w-0 items-baseline gap-1.5 sm:gap-2">
              <p className="hidden text-[10px] font-semibold tracking-[0.3em] text-rm-gray-500 uppercase sm:inline">
                Yönetim
              </p>
              <span className="hidden text-rm-gray-700 sm:inline">/</span>
              <h1 className="truncate font-editorial text-base text-rm-off-white sm:text-lg md:text-xl">
                {activeNav?.label ?? "Admin"}
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-rm-gray-400 transition-colors hover:border-rm-champagne/30 hover:text-rm-off-white lg:hidden"
              aria-label="Hızlı ara"
              title="Hızlı ara"
            >
              <Search className="h-4 w-4" strokeWidth={1.7} />
            </button>
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-rm-gray-400 transition-colors hover:border-rm-champagne/30 hover:text-rm-off-white lg:inline-flex"
              title="Komut paleti (Ctrl+K)"
            >
              <span>Hızlı ara…</span>
              <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-rm-gray-500">
                Ctrl K
              </kbd>
            </button>
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-emerald-300 uppercase lg:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Canlı
            </span>
            <div className="lg:hidden">
              <AdminLogoutButton compact />
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 md:p-8">
          <AdminMissingPhoneAlerts />
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE_LUXURY }}
            >
              {content()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AdminCommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onNavigate={(id) => navigate(id)}
      />
    </div>
  );
}

export function AdminShell({ children }: { children?: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-rm-black text-rm-gray-500">
          Yükleniyor…
        </div>
      }
    >
      <AdminShellInner>{children}</AdminShellInner>
    </Suspense>
  );
}
