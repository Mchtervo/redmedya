"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { usePackageStore } from "@/stores/package-store";
import { getPackageAdvisorMessage } from "@/lib/package-advisor";

export function PackageSalesAdvisor() {
  const services = usePackageStore((s) => s.services);
  const selectedIds = usePackageStore((s) => s.selectedIds);
  const serviceQuantities = usePackageStore((s) => s.serviceQuantities);

  const message = useMemo(
    () => getPackageAdvisorMessage(services, selectedIds, serviceQuantities),
    [services, selectedIds, serviceQuantities]
  );

  if (!message || selectedIds.length === 0) return null;

  return (
    <div className="mt-4 flex gap-2.5 rounded-md border border-white/10 bg-white/[0.03] px-3 py-3">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-rm-champagne" strokeWidth={1.5} />
      <div>
        <p className="text-[10px] font-semibold tracking-wider text-rm-champagne uppercase">
          Neden bu paket?
        </p>
        <p className="mt-1 text-xs leading-relaxed text-rm-gray-300">{message}</p>
      </div>
    </div>
  );
}
