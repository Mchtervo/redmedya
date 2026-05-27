"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { ServiceItem } from "@/types/cms";
import type { LeadLineDetail } from "@/types/reservations";
import { serviceItemToLineDetail } from "@/lib/service-line";
import {
  AILE_ALBUM_ID,
  BUYUK_ALBUM_ID,
  buyukAlbumPageOptionLabel,
} from "@/config/albums";
import { buyukAlbumPriceFromBase } from "@/lib/service-line";
import { getOccasionLabel } from "@/config/occasions";
import { formatPrice, cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const CATEGORY_LABELS: Record<ServiceItem["category"], string> = {
  foto: "Fotoğraf",
  video: "Video",
  album: "Albüm",
  extra: "Ekstra",
};

const CATEGORY_ORDER: ServiceItem["category"][] = [
  "foto",
  "video",
  "album",
  "extra",
];

type AdminServiceCatalogProps = {
  onAdd: (line: LeadLineDetail) => void;
  addedServiceIds?: string[];
};

export function AdminServiceCatalog({
  onAdd,
  addedServiceIds = [],
}: AdminServiceCatalogProps) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/cms")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d?.services) ? d.services : [];
        setServices(
          list
            .filter((s: ServiceItem) => s.isActive !== false)
            .sort(
              (a: ServiceItem, b: ServiceItem) =>
                (a.sortOrder ?? 99) - (b.sortOrder ?? 99)
            )
        );
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        getOccasionLabel(s.occasion).toLowerCase().includes(q)
    );
  }, [services, query]);

  const grouped = useMemo(() => {
    const map = new Map<ServiceItem["category"], ServiceItem[]>();
    for (const cat of CATEGORY_ORDER) map.set(cat, []);
    for (const s of filtered) {
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    }
    return map;
  }, [filtered]);

  if (loading) {
    return (
      <p className="text-xs text-rm-gray-500">Hizmet listesi yükleniyor…</p>
    );
  }

  if (services.length === 0) {
    return (
      <p className="text-xs text-rm-gray-500">
        CMS&apos;te hizmet yok.{" "}
        <a href="/admin?tab=cms" className="text-rm-champagne underline">
          İçerik
        </a>{" "}
        sekmesinden ekleyin.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-rm-champagne/20 bg-rm-champagne/5 p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-[10px] font-bold tracking-wider text-rm-champagne uppercase">
          Paket hizmetlerinden ekle
        </span>
        <span className="text-xs text-rm-gray-500">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <>
          <div className="relative mt-2">
            <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-rm-gray-500" />
            <Input
              placeholder="Hizmet ara…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 border-white/10 bg-white/5 pl-8 text-xs"
            />
          </div>

          <div className="mt-3 max-h-48 space-y-3 overflow-y-auto pr-1">
            {CATEGORY_ORDER.map((cat) => {
              const items = grouped.get(cat) ?? [];
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <p className="mb-1.5 text-[10px] font-semibold text-rm-gray-500 uppercase">
                    {CATEGORY_LABELS[cat]}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((s) => {
                      const added = addedServiceIds.includes(s.id);
                      const occasion = s.occasion
                        ? getOccasionLabel(s.occasion)
                        : null;

                      if (s.pricingType === "pages" && s.id === BUYUK_ALBUM_ID) {
                        const base = Number(s.price) || 2500;
                        return (
                          <div key={s.id} className="flex flex-wrap gap-1">
                            {([10, 20] as const).map((pages) => {
                              const line = serviceItemToLineDetail(s, pages);
                              return (
                                <button
                                  key={pages}
                                  type="button"
                                  onClick={() => onAdd(line)}
                                  className={cn(
                                    "rounded-md border px-2 py-1 text-left text-[11px] transition-colors",
                                    added
                                      ? "border-rm-champagne/50 bg-rm-champagne/15 text-rm-champagne"
                                      : "border-white/10 bg-white/5 text-rm-off-white hover:border-rm-champagne/40"
                                  )}
                                >
                                  <span className="block font-medium">
                                    {s.name} · {buyukAlbumPageOptionLabel(pages)}
                                    {pages === 20 && (
                                      <span className="text-rm-champagne"> +50%</span>
                                    )}
                                  </span>
                                  <span className="text-[10px] text-rm-gray-500">
                                    {formatPrice(buyukAlbumPriceFromBase(base, pages))}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        );
                      }

                      if (s.pricingType === "quantity" && s.id === AILE_ALBUM_ID) {
                        const unit = Number(s.unitPrice) || 1000;
                        return (
                          <div key={s.id} className="flex flex-wrap gap-1">
                            {([1, 2] as const).map((qty) => {
                              const line = serviceItemToLineDetail(s, qty);
                              return (
                                <button
                                  key={qty}
                                  type="button"
                                  onClick={() => onAdd(line)}
                                  className={cn(
                                    "rounded-md border px-2 py-1 text-left text-[11px] transition-colors",
                                    added
                                      ? "border-rm-champagne/50 bg-rm-champagne/15 text-rm-champagne"
                                      : "border-white/10 bg-white/5 text-rm-off-white hover:border-rm-champagne/40"
                                  )}
                                >
                                  <span className="block font-medium">
                                    {s.name} · {qty} adet
                                  </span>
                                  <span className="text-[10px] text-rm-gray-500">
                                    {formatPrice(unit * qty)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        );
                      }

                      const line = serviceItemToLineDetail(s);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => onAdd(line)}
                          className={cn(
                            "rounded-md border px-2 py-1 text-left text-[11px] transition-colors",
                            added
                              ? "border-rm-champagne/50 bg-rm-champagne/15 text-rm-champagne"
                              : "border-white/10 bg-white/5 text-rm-off-white hover:border-rm-champagne/40"
                          )}
                          title={
                            occasion
                              ? `${s.name} · ${occasion}`
                              : s.name
                          }
                        >
                          <span className="block font-medium">{s.name}</span>
                          <span className="text-[10px] text-rm-gray-500">
                            {formatPrice(line.price)}
                            {occasion && ` · ${occasion}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-2 text-[10px] text-rm-gray-600">
            Tıklayınca listeye eklenir; fiyat, yer ve saati aşağıdan düzenleyebilirsiniz.
          </p>
        </>
      )}
    </div>
  );
}
