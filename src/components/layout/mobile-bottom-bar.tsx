"use client";

import { Phone, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { formatPhoneForWhatsApp } from "@/lib/utils";
import { useWhatsAppLead } from "@/hooks/use-whatsapp-lead";
import { trackMetaEvent } from "@/lib/meta-pixel";

/** Mobil: altta sabit yalnızca ara + WhatsApp (paket sayfasında gizli — orada PackageMobileBar var) */
export function MobileBottomBar() {
  const pathname = usePathname();
  const { openWhatsApp } = useWhatsAppLead();

  if (pathname.startsWith("/admin")) return null;
  if (pathname.startsWith("/paket-olustur")) return null;

  const telUrl = `tel:+${formatPhoneForWhatsApp(siteConfig.defaultPhone)}`;

  return (
    <div
      className="fixed right-0 bottom-0 left-0 z-[60] border-t border-white/10 bg-rm-black/95 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
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
          className="flex min-h-[52px] items-center justify-center gap-2.5 bg-rm-black px-3 py-2.5 text-rm-champagne transition-colors active:bg-white/5"
          aria-label={`Ara ${siteConfig.displayPhone}`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rm-champagne/35 bg-rm-champagne/10">
            <Phone className="h-4 w-4" strokeWidth={1.5} />
          </span>
          <span className="min-w-0 text-left">
            <span className="block text-[10px] font-bold tracking-wider uppercase">
              Ara
            </span>
            <span className="block truncate text-[10px] text-rm-gray-500">
              {siteConfig.displayPhone}
            </span>
          </span>
        </a>

        <button
          type="button"
          onClick={() => openWhatsApp({ contentName: "mobile_bar_whatsapp" })}
          className="flex min-h-[52px] items-center justify-center gap-2.5 bg-[#25D366]/12 px-3 py-2.5 text-[#25D366] transition-colors active:bg-[#25D366]/20"
          aria-label="WhatsApp ile yaz"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_2px_12px_rgba(37,211,102,0.3)]">
            <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
          </span>
          <span className="min-w-0 text-left">
            <span className="block text-[10px] font-bold tracking-wider uppercase">
              WhatsApp
            </span>
            <span className="block text-[10px] text-[#25D366]/85">Teklif al</span>
          </span>
        </button>
      </div>
    </div>
  );
}
