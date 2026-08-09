"use client";

import { Phone, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { siteConfig } from "@/config/site";
import { pixelWhatsAppClick } from "@/lib/paket/pixel";
import { formatPhoneForWhatsApp } from "@/lib/utils";

/**
 * Sticky CTA — telefon + WhatsApp.
 * Linkler doğrudan `tel:` ve `https://wa.me/...` kullanır; hiçbir hook'a
 * bağımlı değildir. Bu sayede pop-up blocker veya state hatası butonun
 * tıklanmaz hale gelmesine yol açmaz.
 */
export function StickyActions() {
  const telUrl = `tel:+${formatPhoneForWhatsApp(siteConfig.defaultPhone)}`;
  const whatsappMessage = encodeURIComponent(
    "Merhaba REDMEDYA ekibi, web sitenizden ulaşıyorum. Düğün / dış çekim paketi için bilgi ve teklif almak istiyorum."
  );
  const whatsappUrl = `https://wa.me/${formatPhoneForWhatsApp(
    siteConfig.defaultWhatsApp
  )}?text=${whatsappMessage}`;

  return (
    <div className="fixed right-5 bottom-5 z-50 flex flex-col items-end gap-3">
      <motion.a
        href={telUrl}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="group flex h-11 items-center gap-2 overflow-hidden rounded-full bg-rm-black/85 px-3 text-rm-champagne shadow-[0_8px_25px_rgba(0,0,0,0.35)] ring-1 ring-rm-champagne/25 backdrop-blur-md transition-all hover:px-4"
        aria-label={`Ara ${siteConfig.displayPhone}`}
      >
        <Phone size={16} strokeWidth={1.75} />
        <span className="max-w-0 overflow-hidden text-[12px] font-semibold tracking-wider whitespace-nowrap transition-all duration-300 group-hover:max-w-[160px] group-hover:pr-1">
          {siteConfig.displayPhone}
        </span>
      </motion.a>

      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => pixelWhatsAppClick("sticky_whatsapp")}
        className="group relative flex h-14 items-center gap-2.5 overflow-hidden rounded-full bg-[#25D366] px-4 text-white shadow-[0_10px_35px_rgba(37,211,102,0.4)] transition-all hover:bg-[#1FB957] hover:px-5"
        aria-label="WhatsApp ile yaz"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-20" />
        <MessageCircle size={22} strokeWidth={1.75} className="relative" />
        <span className="relative max-w-0 overflow-hidden text-[13px] font-bold tracking-wide whitespace-nowrap transition-all duration-300 group-hover:max-w-[200px] group-hover:pr-1">
          WhatsApp ile yaz
        </span>
      </motion.a>
    </div>
  );
}
