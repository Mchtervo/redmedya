"use client";

import { useEffect, useState } from "react";
import { Phone, MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";
import { usePackageTotals } from "@/hooks/use-package-totals";
import {
  formatPhoneForWhatsApp,
  formatPrice,
} from "@/lib/utils";
import { usePackageStore } from "@/stores/package-store";
import {
  buildWhatsAppInquiryMessage,
  buildWhatsAppMessage,
  getWhatsAppUrl,
} from "@/lib/whatsapp";
import { pixelWhatsAppClick } from "@/lib/paket/pixel";

/**
 * Mobil paket sayfası alt çubuğu.
 * - Üst satır: toplam fiyat + hizmet sayısı
 * - Alt satır: Ara (tel:) + WhatsApp (wa.me).
 *
 * WhatsApp butonu doğrudan <a href="wa.me/..."> kullanır. Sepet ve müşteri
 * bilgisi değiştikçe href runtime'da güncellenir. Bu sayede pop-up
 * blocker veya window.open hook race condition'ları olmaz.
 */
export function PackageMobileBar() {
  const { total, count, lineItems, subtotal, bundle, couponDiscount } =
    usePackageTotals();
  const customer = usePackageStore((s) => s.customer);
  const coupon = usePackageStore((s) => s.coupon);
  const bundleDiscounts = usePackageStore((s) => s.bundleDiscounts);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || count === 0) return null;

  const hasContact =
    Boolean(customer.firstName?.trim()) && Boolean(customer.phone?.trim());

  const message =
    hasContact && lineItems.length > 0
      ? buildWhatsAppMessage({
          customer,
          lineItems,
          subtotal,
          bundleDiscount: bundle.amount,
          couponDiscount,
          total,
          couponCode: coupon?.code,
          bundlePercent: bundleDiscounts[0]?.percent ?? 20,
        })
      : buildWhatsAppInquiryMessage(hasContact ? customer : undefined);

  const telUrl = `tel:+${formatPhoneForWhatsApp(siteConfig.defaultPhone)}`;
  const whatsappUrl = getWhatsAppUrl(message);

  const onWhatsAppClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!hasContact) {
      event.preventDefault();
      document.getElementById("paket-ozeti")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      // Meta InitiateCheckout yok — iletişim formu funnel'ında
      return;
    }
    pixelWhatsAppClick("package_mobile_bar", total);
  };

  return (
    <div
      className="fixed right-0 bottom-0 left-0 z-40 border-t border-rm-champagne/15 bg-rm-black/97 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-2.5">
        <p className="text-[10px] font-semibold tracking-[0.25em] text-rm-gray-500 uppercase">
          Toplam · {count} hizmet
        </p>
        <p className="text-xl leading-none font-bold tabular-nums text-rm-champagne">
          {formatPrice(total)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 px-3 py-2.5">
        <a
          href={telUrl}
          className="flex h-12 items-center justify-center gap-2 rounded-full border border-rm-champagne/40 bg-rm-champagne/8 text-rm-champagne active:bg-rm-champagne/20"
          aria-label={`Ara ${siteConfig.displayPhone}`}
        >
          <Phone className="h-4 w-4" strokeWidth={1.75} />
          <span className="text-xs font-bold tracking-[0.18em] uppercase">
            Ara
          </span>
        </a>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onWhatsAppClick}
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] text-white shadow-[0_6px_22px_rgba(37,211,102,0.35)] active:bg-[#1FB957]"
          aria-label={hasContact ? "Rezervasyonu WhatsApp ile onayla" : "WhatsApp ile teklif al"}
        >
          <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
          <span className="text-xs font-bold tracking-[0.18em] uppercase">
            {hasContact ? "Onayla" : "Teklif Al"}
          </span>
        </a>
      </div>
    </div>
  );
}
