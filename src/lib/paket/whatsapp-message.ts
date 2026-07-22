import {
  ADDONS,
  PRICING,
  getAddon,
  getPackage,
  getPlato,
} from "@/config/pricing";
import { COPY } from "@/content/paketOlustur";
import { calculateTotal } from "@/lib/paket/calculate-total";
import type { PackageBuilderState } from "@/lib/paket/state";
import { formatWeddingDateDisplay } from "@/lib/date-format";
import { formatPrice } from "@/lib/utils";

/**
 * Sihirbaz seçimlerinden WhatsApp mesajı üretir.
 * Boş alanlar (not, telefon) mesaja girmez. Plato/hediye/ekstra dinamik.
 */
export function buildWizardWhatsAppMessage(state: PackageBuilderState): string {
  if (state.packageId == null) return COPY.whatsapp.greeting;

  const pkg = getPackage(state.packageId);
  const { total, savings } = calculateTotal(state);
  const ownVenue = state.plato === "own";

  const lines: string[] = [COPY.whatsapp.greeting, ""];

  lines.push(`📦 Paket: ${pkg.name.toUpperCase()} — ${pkg.subtitle.toUpperCase()}`);

  // Plato
  if (state.plato) {
    if (ownVenue) {
      lines.push("🏛 Mekân: Çift ayarlayacak (−₺2.000 indirim uygulandı)");
    } else {
      const plato = getPlato(state.plato);
      lines.push(`🏛 Plato: ${plato.name} (kampanya — ücretsiz)`);
    }
  }

  // P3 hediye drone
  if (state.packageId === 3) {
    lines.push(
      `🚁 Hediye: Dış çekim drone (₺${PRICING.DRONE_GIFT_VALUE.toLocaleString("tr-TR")} değerinde)`
    );
  }

  // Ekstralar (pakette dahil olanlar hariç)
  const extraLabels = state.addons
    .filter((a) => {
      const def = ADDONS.find((x) => x.id === a.id);
      return !def?.includedInPackages?.includes(pkg.id);
    })
    .map((a) => {
      const def = getAddon(a.id);
      return a.quantity > 1 ? `${def.name} (${a.quantity} adet)` : def.name;
    });
  if (extraLabels.length) {
    lines.push(`➕ Ekstralar: ${extraLabels.join(", ")}`);
  }

  // Çıkarılanlar
  const removalLabels = pkg.removables
    .filter((r) => state.removals.includes(r.id))
    .map((r) => r.label);
  if (removalLabels.length) {
    lines.push(`➖ Çıkarılan: ${removalLabels.join(", ")}`);
  }

  if (state.date) {
    lines.push(`📅 Düğün tarihi: ${formatWeddingDateDisplay(state.date)}`);
  }
  if (state.name.trim()) {
    lines.push(`👤 İsim: ${state.name.trim()}`);
  }
  if (state.phone.trim()) {
    lines.push(`📞 Telefon: ${state.phone.trim()}`);
  }
  if (state.note.trim()) {
    lines.push(`📝 Not: ${state.note.trim()}`);
  }

  lines.push(
    `💰 Toplam: ${formatPrice(total)} (${formatPrice(savings)} kazanç)`,
    "",
    COPY.whatsapp.closing
  );

  return lines.filter((l, i) => l !== "" || lines[i - 1] !== "").join("\n");
}
