import { siteConfig } from "@/config/site";
import { calculateTotal } from "@/lib/paket/calculate-total";
import { buildWizardWhatsAppMessage } from "@/lib/paket/whatsapp-message";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { pixelWhatsAppClick } from "@/lib/paket/pixel";
import { submitPackageLead, syncPackageDraft } from "@/lib/paket/lead-capture";
import { redirectAfterPixel } from "@/lib/paket/whatsapp-redirect";
import { track } from "@/lib/track/tracker";
import type { PackageBuilderState } from "@/lib/paket/state";

/**
 * TEK dönüşüm noktası: taslak + lead kaydı + WhatsApp.
 * Final Meta conversion = Schedule (submitPackageLead → backend başarı sonrası).
 * Lead / Purchase burada ateşlenmez.
 * Takip (fbq + CAPI + funnel) try/catch içinde; sonra ~350ms bekleyip yönlendir.
 */
export function goToWhatsApp(
  state: PackageBuilderState,
  opts?: { fireLead?: boolean; source?: "step3" | "shortcut" }
): void {
  if (typeof window === "undefined") return;

  try {
    syncPackageDraft(state, true);
  } catch {
    /* ignore */
  }
  try {
    // Schedule: yalnızca /api/public/leads başarılı olunca (buton ≠ conversion)
    submitPackageLead(state);
  } catch {
    /* ignore */
  }

  const total = calculateTotal(state).total;
  const customer = { name: state.name, phone: state.phone };

  try {
    pixelWhatsAppClick("tarihimi_kilitle", total, customer);
  } catch {
    /* ignore */
  }

  try {
    track("whatsapp_clicked", {
      total,
      package_id: state.packageId ?? 0,
      source: opts?.source ?? "step3",
    });
  } catch {
    /* ignore */
  }

  void opts?.fireLead;

  const msg = buildWizardWhatsAppMessage(state);
  const url = getWhatsAppUrl(msg, siteConfig.defaultWhatsApp);
  redirectAfterPixel(url);
}
