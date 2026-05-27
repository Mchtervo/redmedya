"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, isAdminTab, type AdminTabId } from "@/components/admin/admin-nav";
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

function AdminShellInner({ children }: { children?: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const tab: AdminTabId = isAdminTab(tabParam) ? tabParam : "overview";
  const [mobileNav, setMobileNav] = useState(false);

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
        "flex h-full flex-col border-r border-white/8 bg-rm-black/95 backdrop-blur-xl",
        className
      )}
    >
      <div className="border-b border-white/8 p-5">
        <Link
          href="/"
          className="text-[10px] font-semibold tracking-[0.25em] text-rm-gray-500 uppercase hover:text-rm-champagne"
        >
          ← Siteye dön
        </Link>
        <div className="mt-4">
          <BrandLogo size="admin" variant="on-dark" href="/" />
        </div>
        <p className="text-[10px] tracking-widest text-rm-gray-600 uppercase">
          Admin v2
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-all",
                active
                  ? "bg-rm-champagne/15 text-rm-off-white shadow-[inset_0_0_0_1px_rgba(201,169,98,0.25)]"
                  : "text-rm-gray-400 hover:bg-white/5 hover:text-rm-off-white"
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  active ? "text-rm-champagne" : "text-rm-gray-500"
                )}
                strokeWidth={1.5}
              />
              <span>
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="mt-0.5 block text-[10px] leading-tight text-rm-gray-600">
                  {item.description}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/8 p-4">
        <AdminLogoutButton />
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-rm-black">
      <div className="hidden w-[280px] shrink-0 lg:block">
        <Sidebar className="fixed inset-y-0 left-0 z-40 w-[280px]" />
      </div>

      <AnimatePresence>
        {mobileNav && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 lg:hidden"
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

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[280px]">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/8 bg-rm-black/80 px-4 py-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-white/10 p-2 text-rm-off-white lg:hidden"
              onClick={() => setMobileNav(true)}
              aria-label="Menü"
            >
              {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-rm-champagne uppercase">
                {activeNav?.description ?? "Yönetim"}
              </p>
              <h1 className="font-display text-xl text-rm-off-white md:text-2xl">
                {activeNav?.label ?? "Admin"}
              </h1>
            </div>
          </div>
          <div className="lg:hidden">
            <AdminLogoutButton />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
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
