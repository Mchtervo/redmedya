"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, X } from "lucide-react";
import {
  filterSearchIndex,
  type SearchEntry,
} from "@/config/search-index";
import { cn } from "@/lib/utils";

type SiteSearchProps = {
  /** Navbar scroll state — ikon rengi */
  light?: boolean;
  className?: string;
};

function groupResults(entries: SearchEntry[]) {
  const groups = new Map<string, SearchEntry[]>();
  for (const e of entries) {
    const list = groups.get(e.group) ?? [];
    list.push(e);
    groups.set(e.group, list);
  }
  return groups;
}

export function SiteSearch({ light = false, className }: SiteSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => filterSearchIndex(query), [query]);
  const grouped = useMemo(() => groupResults(results), [results]);
  const flatResults = results;

  const openSearch = useCallback(() => {
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openSearch]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const goTo = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flatResults[activeIndex]) {
      e.preventDefault();
      goTo(flatResults[activeIndex].href);
    }
  };

  let resultOffset = 0;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
            light
              ? "border-black/10 text-rm-gray-500 hover:border-rm-champagne/40 hover:text-rm-black"
              : "border-white/20 text-white/90 hover:border-white/40 hover:text-white",
            className
          )}
          aria-label="Site içi arama"
        >
          <Search className="h-4 w-4" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "fixed top-[12%] left-1/2 z-61 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2",
            "rounded-sm border border-white/10 bg-rm-black-elevated shadow-2xl",
            "focus:outline-none"
          )}
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Site içi arama</Dialog.Title>

          <div className="flex items-center gap-3 border-b border-white/10 px-4">
            <Search className="h-4 w-4 shrink-0 text-rm-champagne" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Sayfa, hizmet veya fiyat ara…"
              className="h-14 flex-1 bg-transparent text-sm text-rm-off-white placeholder:text-rm-gray-500 focus:outline-none"
            />
            <kbd className="hidden rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-rm-gray-500 sm:inline">
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

          <div className="max-h-[min(50vh,320px)] overflow-y-auto p-2">
            {flatResults.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-rm-gray-500">
                Sonuç bulunamadı. &quot;paket&quot;, &quot;dış çekim&quot; veya
                &quot;kampanya&quot; deneyin.
              </p>
            ) : (
              Array.from(grouped.entries()).map(([group, items]) => (
                <div key={group} className="mb-2 last:mb-0">
                  <p className="px-3 py-1.5 text-[10px] font-semibold tracking-widest text-rm-gray-500 uppercase">
                    {group}
                  </p>
                  <ul>
                    {items.map((item) => {
                      const idx = resultOffset++;
                      const active = idx === activeIndex;
                      return (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "block rounded-sm px-3 py-2.5 transition-colors",
                              active
                                ? "bg-rm-champagne/15 text-rm-off-white"
                                : "text-rm-gray-300 hover:bg-white/5"
                            )}
                            onMouseEnter={() => setActiveIndex(idx)}
                          >
                            <span className="text-sm font-medium">
                              {item.title}
                            </span>
                            {item.description && (
                              <span className="mt-0.5 block text-xs text-rm-gray-500">
                                {item.description}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>

          <p className="border-t border-white/8 px-4 py-2 text-[10px] text-rm-gray-500">
            <span className="hidden sm:inline">↑↓ gezin · Enter seç · </span>
            Ctrl+K ile aç
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
