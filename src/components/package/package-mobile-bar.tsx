"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { siteConfig } from "@/config/site";
import { usePackageTotals } from "@/hooks/use-package-totals";
import { useWhatsAppLead } from "@/hooks/use-whatsapp-lead";
import { formatPhoneForWhatsApp, formatPrice } from "@/lib/utils";
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
    openWhatsApp({ contentName: "package_mobile_bar", requireContact: true });
  };

  const telUrl = `tel:+${formatPhoneForWhatsApp(siteConfig.defaultPhone)}`;

  return (
    <div
      className="fixed right-0 bottom-0 left-0 z-40 border-t border-white/10 bg-rm-black/95 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] tracking-wider text-rm-gray-500 uppercase">
            Toplam · {count} hizmet
          </p>
          <p className="text-lg font-semibold leading-tight tabular-nums text-rm-champagne">
            {formatPrice(total)}
          </p>
        </div>
        <a
          href={telUrl}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rm-champagne/30 text-rm-champagne"
          aria-label="Ara"
        >
          <Phone className="h-4 w-4" strokeWidth={1.5} />
        </a>
        <Button
          variant="whatsapp"
          rounded="full"
          onClick={goWhatsApp}
          className="h-10 shrink-0 px-4 text-xs"
        >
          Teklif Al
        </Button>
      </div>
    </div>
  );
}
