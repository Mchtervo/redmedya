"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Search,
  X,
  CalendarDays,
  Inbox,
  Contact,
  LayoutDashboard,
  ShoppingCart,
  Layers,
  Settings2,
  Database,
  Activity,
  Heart,
  Phone,
  CornerDownLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ReservationRecord, RehberContact } from "@/types/reservations";
import type { LeadRecord } from "@/types/site-settings";
import { formatWeddingDateDisplay } from "@/lib/date-format";
import { formatCustomerName } from "@/lib/customer-name";
import { ADMIN_NAV, type AdminTabId } from "@/components/admin/admin-nav";
import { ADMIN_DATA_CHANGED } from "@/lib/admin-data-sync";

type PaletteRow =
  | {
      kind: "nav";
      id: string;
      label: string;
      group: string;
      icon: LucideIcon;
      action: () => void;
    }
  | {
      kind: "reservation";
      id: string;
      label: string;
      group: string;
      hint?: string;
      action: () => void;
    }
  | {
      kind: "lead";
      id: string;
      label: string;
      group: string;
      hint?: string;
      action: () => void;
    }
  | {
      kind: "rehber";
      id: string;
      label: string;
      group: string;
      hint?: string;
      action: () => void;
    };

const NAV_ICONS: Record<AdminTabId, LucideIcon> = {
  overview: LayoutDashboard,
  calendar: CalendarDays,
  leads: Inbox,
  journey: Activity,
  packages: ShoppingCart,
  rehber: Contact,
  cms: Layers,
  operations: Settings2,
  data: Database,
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onNavigate: (id: AdminTabId) => void;
};

/**
 * Ctrl/Cmd + K ile açılan komut paleti.
 * - Hızlı sayfa geçişi (Genel bakış, Takvim, Teklifler…)
 * - Müşteri arama (rezervasyon, lead, rehber)
 * - Enter ile aç, ↑↓ ile gez, Esc kapat
 */
export function AdminCommandPalette({ open, onOpenChange, onNavigate }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [rehber, setRehber] = useState<RehberContact[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(() => {
    Promise.all([
      fetch("/api/admin/reservations")
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch("/api/admin/leads")
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch("/api/admin/rehber")
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ]).then(([r, l, c]) => {
      setReservations(Array.isArray(r) ? r : []);
      setLeads(Array.isArray(l) ? l : []);
      setRehber(Array.isArray(c) ? c : []);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    loadData();
    setQuery("");
    setActiveIdx(0);
    const handler = () => loadData();
    window.addEventListener(ADMIN_DATA_CHANGED, handler);
    return () => window.removeEventListener(ADMIN_DATA_CHANGED, handler);
  }, [open, loadData]);

  const close = () => onOpenChange(false);

  const goAdmin = (path: string) => {
    router.push(path);
    close();
  };

  const navRows: PaletteRow[] = ADMIN_NAV.map((n) => ({
    kind: "nav" as const,
    id: `nav-${n.id}`,
    label: n.label,
    group: "Sayfalar",
    icon: NAV_ICONS[n.id] ?? LayoutDashboard,
    action: () => {
      onNavigate(n.id);
      close();
    },
  }));

  const reservationRows: PaletteRow[] = reservations.map((r) => ({
    kind: "reservation" as const,
    id: `res-${r.id}`,
    label: formatCustomerName(r.customer) || "Adsız rezervasyon",
    group: "Rezervasyonlar",
    hint: [
      r.customer.weddingDate
        ? formatWeddingDateDisplay(r.customer.weddingDate)
        : null,
      r.customer.phone || null,
    ]
      .filter(Boolean)
      .join(" · "),
    action: () => goAdmin(`/admin?tab=calendar&res=${r.id}`),
  }));

  const leadRows: PaletteRow[] = leads.map((l) => ({
    kind: "lead" as const,
    id: `lead-${l.id}`,
    label: formatCustomerName(l.customer) || "Adsız teklif",
    group: "Teklifler",
    hint: [l.customer.phone, l.status ?? "pending"].filter(Boolean).join(" · "),
    action: () => goAdmin(`/admin?tab=leads`),
  }));

  const rehberRows: PaletteRow[] = rehber.map((c) => ({
    kind: "rehber" as const,
    id: `reh-${c.id}`,
    label: `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "Adsız kayıt",
    group: "Rehber",
    hint: [c.phone, c.weddingDate].filter(Boolean).join(" · "),
    action: () => goAdmin(`/admin?tab=rehber`),
  }));

  const allRows = useMemo(
    () => [...navRows, ...reservationRows, ...leadRows, ...rehberRows],
    [navRows, reservationRows, leadRows, rehberRows]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // ilk açıldığında sadece sayfalar + son 6 rezervasyon + son 4 teklif
      return [
        ...navRows,
        ...reservationRows.slice(0, 6),
        ...leadRows.slice(0, 4),
      ];
    }
    return allRows.filter((row) => {
      const hay = `${row.label} ${"hint" in row ? row.hint ?? "" : ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, allRows, navRows, reservationRows, leadRows]);

  /** Gruplandırılmış görünüm */
  const grouped = useMemo(() => {
    const map = new Map<string, PaletteRow[]>();
    for (const row of filtered) {
      const list = map.get(row.group) ?? [];
      list.push(row);
      map.set(row.group, list);
    }
    return [...map.entries()];
  }, [filtered]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[activeIdx]) {
      e.preventDefault();
      filtered[activeIdx].action();
    }
  };

  /** Açıkta aktif satır görünür kalsın */
  useEffect(() => {
    const node = listRef.current?.querySelector(
      `[data-idx="${activeIdx}"]`
    ) as HTMLElement | null;
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  let flatIdx = 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-3 top-3 z-[81] overflow-hidden rounded-2xl border border-white/10 bg-rm-black-elevated shadow-[0_40px_120px_-20px_rgba(0,0,0,0.7)] focus:outline-none sm:inset-x-auto sm:top-[10%] sm:left-1/2 sm:w-[calc(100%-2rem)] sm:max-w-xl sm:-translate-x-1/2"
        >
          <Dialog.Title className="sr-only">Admin komut paleti</Dialog.Title>

          <div className="flex items-center gap-3 border-b border-white/10 px-4">
            <Search className="h-4 w-4 shrink-0 text-rm-champagne" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Sayfa, rezervasyon, müşteri veya telefon ara…"
              className="h-14 flex-1 bg-transparent text-sm text-rm-off-white placeholder:text-rm-gray-500 focus:outline-none"
            />
            <kbd className="hidden rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-rm-gray-500 sm:inline">
              ESC
            </kbd>
            <Dialog.Close
              type="button"
              className="rounded p-1 text-rm-gray-500 hover:text-rm-off-white"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div
            ref={listRef}
            className="max-h-[min(70vh,520px)] overflow-y-auto p-2 sm:max-h-[min(55vh,420px)]"
          >
            {filtered.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-rm-gray-500">
                Eşleşen sonuç yok. Müşteri adı, telefon veya sayfa adı yazmayı
                deneyin.
              </p>
            ) : (
              grouped.map(([group, items]) => (
                <div key={group} className="mb-2 last:mb-0">
                  <p className="px-3 py-1.5 text-[9px] font-bold tracking-[0.28em] text-rm-gray-600 uppercase">
                    {group}
                  </p>
                  <ul>
                    {items.map((row) => {
                      const idx = flatIdx++;
                      const active = idx === activeIdx;
                      const Icon =
                        row.kind === "nav"
                          ? row.icon
                          : row.kind === "reservation"
                            ? Heart
                            : row.kind === "lead"
                              ? Inbox
                              : Phone;
                      return (
                        <li key={row.id}>
                          <button
                            type="button"
                            data-idx={idx}
                            onClick={() => row.action()}
                            onMouseEnter={() => setActiveIdx(idx)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                              active
                                ? "bg-rm-champagne/15 text-rm-off-white"
                                : "text-rm-gray-300 hover:bg-white/[0.03]"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                                active
                                  ? "border-rm-champagne/40 bg-rm-champagne/15 text-rm-champagne"
                                  : "border-white/10 bg-white/[0.03] text-rm-gray-500"
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">
                                {row.label}
                              </span>
                              {"hint" in row && row.hint && (
                                <span className="block truncate text-xs text-rm-gray-500">
                                  {row.hint}
                                </span>
                              )}
                            </span>
                            {active && (
                              <CornerDownLeft
                                className="h-3.5 w-3.5 shrink-0 text-rm-champagne"
                                strokeWidth={1.6}
                              />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>

          <p className="hidden flex-wrap items-center gap-3 border-t border-white/8 px-4 py-2 text-[10px] text-rm-gray-500 sm:flex">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 text-[9px]">
                ↑↓
              </kbd>
              gez
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 text-[9px]">
                ⏎
              </kbd>
              aç
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 text-[9px]">
                Esc
              </kbd>
              kapat
            </span>
            <span className="ml-auto">Ctrl+K ile yeniden aç</span>
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
