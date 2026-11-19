"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ExternalLink, Search } from "lucide-react";
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
import { AdminWhatsAppCouplesPanel } from "@/components/admin/admin-whatsapp-couples-panel";
import { AdminAiCouplesPanel } from "@/components/admin/admin-ai-couples-panel";
import { AdminSalesAnalytics } from "@/components/admin/admin-sales-analytics";
import { AdminActivityLog } from "@/components/admin/admin-activity-log";
import { AdminJourneyPanel } from "@/components/admin/admin-journey-panel";
import { AdminFunnelPanel } from "@/components/admin/admin-funnel-panel";
import { AdminCalendarPanel } from "@/components/admin/admin-calendar-panel";
import { AdminRehberPanel } from "@/components/admin/admin-rehber-panel";
import { AdminPackagePanel } from "@/components/admin/admin-package-panel";
import { AdminDataPanel } from "@/components/admin/admin-data-panel";
import { AdminMissingPhoneAlerts } from "@/components/admin/admin-missing-phone-alerts";
import { BrandLogo } from "@/components/layout/brand-logo";
import { EASE_LUXURY } from "@/lib/animations";
import { useAdminCounts } from "@/hooks/use-admin-counts";
import { AdminCommandPalette } from "@/components/admin/admin-command-palette";
import { useAiSystemStatus } from "@/hooks/use-ai-system-status";

type PillState = "ok" | "warn" | "bad" | "wait";

/** Canlı durum rozeti: yeşil = çalışıyor (nabız), amber = beklemede, kırmızı = sorun, gri = yükleniyor */
function StatusPill({ label, state, text }: { label: string; state: PillState; text: string }) {
  const dot = { ok: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-rose-500", wait: "bg-slate-300" }[state];
  const tone = {
    ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warn: "border-amber-200 bg-amber-50 text-amber-800",
    bad: "border-rose-200 bg-rose-50 text-rose-700",
    wait: "border-slate-200 bg-white text-slate-500",
  }[state];
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap", tone)}>
      <span className={cn("rm-live-dot", dot, state === "ok" && "rm-ping")} />
      <span className="text-slate-500">{label}:</span>
      <span className="font-semibold">{text}</span>
    </span>
  );
}

function AdminShellInner({ children, fontClass }: { children?: React.ReactNode; fontClass?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const tab: AdminTabId = isAdminTab(tabParam) ? tabParam : "overview";
  const [mobileNav, setMobileNav] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const counts = useAdminCounts();
  const { status } = useAiSystemStatus();

  /** Açık tema + yazı tipleri body'ye: Radix dialog/portal'lar da aynı temayı alsın. */
  useEffect(() => {
    const cls = ["rm-admin", ...(fontClass ?? "").split(" ").filter(Boolean)];
    document.body.classList.add(...cls);
    return () => document.body.classList.remove(...cls);
  }, [fontClass]);

  const loading = status.n8n === undefined;
  const pills: { label: string; state: PillState; text: string }[] = [
    { label: "n8n", state: loading ? "wait" : status.n8n ? "ok" : "bad", text: loading ? "…" : status.n8n ? "Aktif" : "Ulaşılamıyor" },
    {
      label: "WhatsApp",
      state: status.whatsapp === undefined ? (loading ? "wait" : "bad") : status.whatsapp ? "ok" : "bad",
      text: status.whatsapp === undefined ? (loading ? "…" : "Bilinmiyor") : status.whatsapp ? "Bağlı" : "Kopuk",
    },
    {
      label: "Sesli AI",
      state: loading ? "wait" : status.arama ? "ok" : status.n8n ? "warn" : "bad",
      text: loading ? "…" : status.arama ? "Hazır" : status.n8n ? "Oto-arama kapalı" : "Bilinmiyor",
    },
  ];

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

  // Sekme değişince (geri tuşu dahil) mobil menüyü kapat — effect yerine render sırasında
  const [navTab, setNavTab] = useState(tab);
  if (navTab !== tab) {
    setNavTab(tab);
    setMobileNav(false);
  }

  const activeNav = ADMIN_NAV.find((n) => n.id === tab);

  const content = () => {
    switch (tab) {
      case "overview":
        return <AdminOverviewPanel onNavigate={(t) => navigate(t as AdminTabId)} />;
      case "calendar":
        return <AdminCalendarPanel />;
      case "leads":
        return <AdminLeadsPanel />;
      case "whatsapp_couples":
        return <AdminWhatsAppCouplesPanel />;
      case "ai_couples":
        return <AdminAiCouplesPanel />;
      case "activity":
        return <AdminActivityLog />;
      case "sales":
        return <AdminSalesAnalytics />;
      case "funnel":
        return <AdminFunnelPanel initialTab="funnel" />;
      case "sessions":
        return <AdminFunnelPanel initialTab="sessions" />;
      case "ads":
        return <AdminFunnelPanel initialTab="ads" />;
      case "form_errors":
        return <AdminFunnelPanel initialTab="forms" />;
      case "tech_errors":
        return <AdminFunnelPanel initialTab="tech" />;
      case "journey":
        return <AdminJourneyPanel />;
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

  // Bileşen değil render fonksiyonu: render içinde bileşen tanımlamak her
  // render'da menüyü yeniden kurar (kaydırma/durum sıfırlanır).
  const renderSidebar = (className?: string) => (
    <aside className={cn("rm-glass flex h-full flex-col border-r border-slate-200/80", className)}>
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between gap-2">
          <BrandLogo size="admin" href="/" />
          <Link
            href="/"
            target="_blank"
            title="Siteyi yeni sekmede aç"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-indigo-200 hover:text-indigo-600"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
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
                        "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all",
                        active
                          ? "bg-indigo-50 font-semibold text-indigo-700 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.15)]"
                          : "font-medium text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0 transition-colors",
                          active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                        )}
                        strokeWidth={1.8}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {badge && (
                        <span
                          className={cn(
                            "min-w-[22px] rounded-full px-2 py-0.5 text-center text-[11px] font-bold tabular-nums",
                            badge.tone === "gold" ? "bg-indigo-600 text-white" : "bg-rose-600 text-white"
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

      <div className="border-t border-slate-200/80 p-3">
        <AdminLogoutButton />
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-[264px] shrink-0 lg:block">
        {renderSidebar("fixed inset-y-0 left-0 z-40 w-[264px]")}
      </div>

      <AnimatePresence>
        {mobileNav && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileNav(false)}
            />
            <motion.div
              initial={{ x: -290 }}
              animate={{ x: 0 }}
              exit={{ x: -290 }}
              transition={{ ease: EASE_LUXURY, duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white lg:hidden"
            >
              {renderSidebar()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="rm-glass sticky top-0 z-30 border-b border-slate-200/70 px-3 py-3 sm:px-5 md:px-8">
          <div className="mx-auto w-full max-w-[1480px]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
                onClick={() => setMobileNav(true)}
                aria-label="Menü"
              >
                {mobileNav ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
              <div className="min-w-0">
                <p className="truncate font-editorial text-base text-slate-900 sm:text-lg">
                  Merhaba Mücahit <span aria-hidden>👋</span>
                </p>
                <p className="truncate text-xs text-slate-500">
                  <span className="font-medium text-indigo-600">{activeNav?.label ?? "Admin"}</span>
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="hidden h-10 w-64 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm whitespace-nowrap text-slate-400 transition-colors hover:border-indigo-200 hover:shadow-sm md:inline-flex xl:w-80"
                title="Komut paleti (Ctrl+K)"
              >
                <Search className="h-4 w-4" strokeWidth={1.8} />
                <span className="min-w-0 flex-1 truncate text-left">Çift, rezervasyon, sayfa ara…</span>
                <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                  Ctrl K
                </kbd>
              </button>
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 md:hidden"
                aria-label="Hızlı ara"
              >
                <Search className="h-4 w-4" strokeWidth={1.8} />
              </button>
              <div className="lg:hidden">
                <AdminLogoutButton compact />
              </div>
            </div>
          </div>
          <div className="mt-2.5 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
            {pills.map((p) => (
              <StatusPill key={p.label} label={p.label} state={p.state} text={p.text} />
            ))}
          </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1480px] flex-1 p-3 sm:p-5 md:p-8">
          {/* Eksik telefon uyarısı sadece ilgili sayfalarda (her sayfada kalabalık yapmasın) */}
          {(tab === "overview" || tab === "calendar") && <AdminMissingPhoneAlerts />}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE_LUXURY }}
              className="rm-stagger"
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

export function AdminShell({ children, fontClass }: { children?: React.ReactNode; fontClass?: string }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-slate-500">
          Yükleniyor…
        </div>
      }
    >
      <AdminShellInner fontClass={fontClass}>{children}</AdminShellInner>
    </Suspense>
  );
}
