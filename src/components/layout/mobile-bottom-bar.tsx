"use client";

import { Phone, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { formatPhoneForWhatsApp } from "@/lib/utils";
import { pixelWhatsAppClick } from "@/lib/paket/pixel";
import { onWhatsAppNavClick } from "@/lib/paket/whatsapp-redirect";

/**
 * Mobil: altta sabit yalnızca ara + WhatsApp.
 * Paket sayfasında gizli — orada PackageMobileBar var.
 * Linkler doğrudan `tel:` ve `https://wa.me/...`'ye gider, React hook'a
 * bağımlı değildir — bu sayede pop-up blocker veya hook hatası butonun
 * çalışmamasına yol açmaz.
 */
export function MobileBottomBar() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;
  if (pathname.startsWith("/paket-olustur")) return null;

  const phone = formatPhoneForWhatsApp(siteConfig.defaultPhone);
  const telUrl = `tel:+${phone}`;
  const whatsappMessage = encodeURIComponent(
    "Merhaba REDMEDYA ekibi, web sitenizden ulaşıyorum. Düğün / dış çekim paketi için bilgi ve teklif almak istiyorum."
  );
  const whatsappUrl = `https://wa.me/${formatPhoneForWhatsApp(
    siteConfig.defaultWhatsApp
  )}?text=${whatsappMessage}`;

  return (
    <div
      className="fixed right-0 bottom-0 left-0 z-[60] border-t border-white/10 bg-rm-black/95 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="grid grid-cols-2 gap-px bg-white/10">
        <a
          href={telUrl}
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

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) =>
            onWhatsAppNavClick(e, whatsappUrl, () =>
              pixelWhatsAppClick("mobile_bar_whatsapp")
            )
          }
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
        </a>
      </div>
    </div>
  );
}
