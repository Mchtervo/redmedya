"use client";

import { Phone, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { formatPhoneForWhatsApp } from "@/lib/utils";
import { useWhatsAppLead } from "@/hooks/use-whatsapp-lead";
import { trackMetaEvent } from "@/lib/meta-pixel";

/** Mobil: altta sabit yalnızca ara + WhatsApp */
export function MobileBottomBar() {
  const pathname = usePathname();
  const { openWhatsApp } = useWhatsAppLead();

  if (pathname.startsWith("/admin")) return null;

  const telUrl = `tel:+${formatPhoneForWhatsApp(siteConfig.defaultPhone)}`;

  return (
    <div
      className="fixed right-0 bottom-0 left-0 z-[60] border-t border-white/10 bg-rm-black/95 backdrop-blur-2xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-2 gap-px bg-white/10">
        <a
          href={telUrl}
          onClick={() =>
            trackMetaEvent("Lead", {
              content_name: "mobile_bar_phone",
              page_path: pathname,
            })
          }
          className="flex flex-col items-center justify-center gap-1.5 bg-rm-black py-4 text-rm-champagne transition-colors active:bg-white/5"
          aria-label={`Ara ${siteConfig.displayPhone}`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-rm-champagne/35 bg-rm-champagne/10">
            <Phone className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <span className="text-[10px] font-bold tracking-wider uppercase">
            Ara
          </span>
          <span className="text-[9px] text-rm-gray-500">
            {siteConfig.displayPhone}
          </span>
        </a>

        <button
          type="button"
          onClick={() => openWhatsApp({ contentName: "mobile_bar_whatsapp" })}
          className="flex flex-col items-center justify-center gap-1.5 bg-[#25D366]/12 py-4 text-[#25D366] transition-colors active:bg-[#25D366]/20"
          aria-label="WhatsApp ile yaz"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_4px_20px_rgba(37,211,102,0.35)]">
            <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <span className="text-[10px] font-bold tracking-wider uppercase">
            WhatsApp
          </span>
          <span className="text-[9px] text-[#25D366]/80">Teklif / rezervasyon</span>
        </button>
      </div>
    </div>
  );
}
