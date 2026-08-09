import { siteConfig } from "@/config/site";
import { calculateTotal } from "@/lib/paket/calculate-total";
import { buildWizardWhatsAppMessage } from "@/lib/paket/whatsapp-message";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { pixelWhatsAppClick } from "@/lib/paket/pixel";
import { submitPackageLead, syncPackageDraft } from "@/lib/paket/lead-capture";
import { track } from "@/lib/track/tracker";
import type { PackageBuilderState } from "@/lib/paket/state";

/**
 * TEK dönüşüm noktası: taslak + lead kaydı + WhatsApp.
 * Final Meta conversion = Schedule (submitPackageLead → backend başarı sonrası).
 * Lead / Purchase burada ateşlenmez.
 */
export function goToWhatsApp(
  state: PackageBuilderState,
  opts?: { fireLead?: boolean; source?: "step3" | "shortcut" }
): void {
  if (typeof window === "undefined") return;

  syncPackageDraft(state, true);
  // Schedule: yalnızca /api/public/leads başarılı olunca (buton ≠ conversion)
  submitPackageLead(state);

  const total = calculateTotal(state).total;
  const customer = { name: state.name, phone: state.phone };

  // Engagement — custom WhatsAppClick only (Lead/Contact/IC yok)
  pixelWhatsAppClick("tarihimi_kilitle", total, customer);

  track("whatsapp_clicked", {
    total,
    package_id: state.packageId ?? 0,
    source: opts?.source ?? "step3",
  });

  // fireLead geriye dönük uyumluluk — artık kullanılmıyor (Schedule ana conversion)
  void opts?.fireLead;

  const msg = buildWizardWhatsAppMessage(state);
  const url = getWhatsAppUrl(msg, siteConfig.defaultWhatsApp);
  window.open(url, "_blank", "noopener,noreferrer");
}
