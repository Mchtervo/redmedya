"use client";

import { Phone, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { siteConfig } from "@/config/site";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { formatPhoneForWhatsApp } from "@/lib/utils";
import { useWhatsAppLead } from "@/hooks/use-whatsapp-lead";

export function StickyActions() {
  const { openWhatsApp } = useWhatsAppLead();
  const telUrl = `tel:+${formatPhoneForWhatsApp(siteConfig.defaultPhone)}`;

  return (
    <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-3">
      <motion.a
        href={telUrl}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => trackMetaEvent("Lead", { content_name: "phone_click" })}
        className="flex h-11 w-11 items-center justify-center rounded-full glass-premium text-rm-champagne"
        aria-label="Ara"
      >
        <Phone size={18} />
      </motion.a>
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => openWhatsApp({ contentName: "sticky_whatsapp" })}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_32px_rgba(37,211,102,0.35)]"
        aria-label="WhatsApp"
      >
        <MessageCircle size={24} />
      </motion.button>
    </div>
  );
}
