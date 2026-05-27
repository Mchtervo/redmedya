"use client";

import { useEffect, useState } from "react";
import { usePackageTotals } from "@/hooks/use-package-totals";
import { useWhatsAppLead } from "@/hooks/use-whatsapp-lead";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePackageStore } from "@/stores/package-store";

/** Mobilde sabit alt çubuk — canlı toplam */
export function PackageMobileBar() {
  const { total, count } = usePackageTotals();
  const customer = usePackageStore((s) => s.customer);
  const { openWhatsApp } = useWhatsAppLead();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || count === 0) return null;

  const goWhatsApp = () => {
    if (!customer.firstName?.trim() || !customer.phone?.trim()) {
      document.getElementById("paket-ozeti")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    openWhatsApp({ contentName: "package_mobile_bar" });
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-white/10 bg-rm-black/95 px-4 py-3 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-rm-gray-500">
            Toplam · {count} hizmet
          </p>
          <p className="text-2xl font-semibold tabular-nums text-rm-champagne">
            {formatPrice(total)}
          </p>
        </div>
        <Button variant="whatsapp" rounded="full" onClick={goWhatsApp} className="px-6">
          Teklif Al
        </Button>
      </div>
    </div>
  );
}
