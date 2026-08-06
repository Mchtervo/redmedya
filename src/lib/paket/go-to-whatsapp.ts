import { siteConfig } from "@/config/site";
import { calculateTotal } from "@/lib/paket/calculate-total";
import { buildWizardWhatsAppMessage } from "@/lib/paket/whatsapp-message";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { pixelLead, pixelLockDate } from "@/lib/paket/pixel";
import { submitPackageLead, syncPackageDraft } from "@/lib/paket/lead-capture";
import { track } from "@/lib/track/tracker";
import type { PackageBuilderState } from "@/lib/paket/state";

/**
 * TEK dönüşüm noktası: taslağı "whatsapp tıklandı" işaretle + tam lead kaydı +
 * piksel/CAPI event'leri + WhatsApp'ı aç.
 *
 * Hem Adım 3 ana CTA'sı hem de Adım 2'deki "WhatsApp'ta Tamamla" kısayolu
 * BURAYI çağırır → mesaj/piksel/lead mantığı tek yerde, ikisi de aynı davranır.
 *
 * fireLead: kısayol yolunda TRUE (Adım 3 Lead effect'i atlanır). Adım 3'te Lead
 * zaten form dolunca ateşlendiği için FALSE bırakılır (çift Lead olmasın).
 */
export function goToWhatsApp(
  state: PackageBuilderState,
  opts?: { fireLead?: boolean; source?: "step3" | "shortcut" }
): void {
  if (typeof window === "undefined") return;

  // Kalıcı kayıtlar (fire-and-forget)
  syncPackageDraft(state, true);
  submitPackageLead(state);

  const total = calculateTotal(state).total;
  const customer = { name: state.name, phone: state.phone };

  // §5 — Lead (kısayolda), Contact + WhatsAppClick (her ikisinde). event_id ile CAPI aynası.
  if (opts?.fireLead) pixelLead(total, customer);
  pixelLockDate(total, customer);

  track("whatsapp_clicked", {
    total,
    package_id: state.packageId ?? 0,
    source: opts?.source ?? "step3",
  });

  const msg = buildWizardWhatsAppMessage(state);
  const url = getWhatsAppUrl(msg, siteConfig.defaultWhatsApp);
  window.open(url, "_blank", "noopener,noreferrer");
}
