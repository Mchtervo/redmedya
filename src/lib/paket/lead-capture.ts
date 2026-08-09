import { getPackage, getPlato } from "@/config/pricing";
import { calculateTotal } from "@/lib/paket/calculate-total";
import type { PackageBuilderState } from "@/lib/paket/state";
import { getSessionId, getUtm } from "@/lib/track/session";
import { readMetaAttributionFromDocument } from "@/lib/meta-attribution";
import { formatPrice } from "@/lib/utils";
import { pixelSchedule } from "@/lib/paket/pixel";
import { reservationScheduleEventId } from "@/lib/meta-tracking";

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "", lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/** Wizard state → sepet özeti (draft ve lead ortak) */
function buildCartSummary(state: PackageBuilderState) {
  const totals = calculateTotal(state);
  const selectedIds: string[] = [];
  if (state.packageId != null) selectedIds.push(`paket-${state.packageId}`);
  if (state.plato) selectedIds.push(`plato-${state.plato}`);
  selectedIds.push(...state.addons.map((a) => a.id));

  const lineSummary = totals.lineItems.map((li) => {
    const right = li.rightLabel
      ? li.rightLabel
      : li.amount < 0
        ? `−${formatPrice(-li.amount)}`
        : formatPrice(li.amount);
    return `${li.label} — ${right}`;
  });
  if (state.packageId != null) {
    const pkg = getPackage(state.packageId);
    lineSummary.unshift(`${pkg.name} — ${pkg.subtitle}`);
    if (state.plato) {
      lineSummary.push(
        state.plato === "own"
          ? "Mekân: Çift ayarlayacak (−₺2.000)"
          : `Plato: ${getPlato(state.plato).name} (ücretsiz)`
      );
    }
  }

  return {
    selectedIds,
    lineSummary,
    subtotal: totals.total,
    total: totals.total,
    savings: totals.savings,
    count: totals.lineItems.length,
  };
}

function customerPayload(state: PackageBuilderState) {
  const { firstName, lastName } = splitName(state.name);
  return {
    firstName,
    lastName,
    phone: state.phone.trim(),
    weddingDate: state.date,
    note: state.note.trim(),
  };
}

/**
 * Taslak senkronu — "Tarihimi Kilitle"ye BASMADAN önce paket + isim + tarih +
 * (varsa) telefon kaydedilir. Fire-and-forget; Meta conversion YOK.
 */
export function syncPackageDraft(
  state: PackageBuilderState,
  whatsappClicked = false
): void {
  if (typeof window === "undefined" || state.packageId == null) return;
  const cart = buildCartSummary(state);
  try {
    fetch("/api/public/package-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        sessionId: getSessionId(),
        customer: customerPayload(state),
        selectedIds: cart.selectedIds,
        lineSummary: cart.lineSummary,
        subtotal: cart.subtotal,
        total: cart.total,
        count: cart.count,
        whatsappClicked,
        utm: getUtm(),
      }),
    }).catch(() => {});
  } catch {
    /* sessiz */
  }
}

/**
 * WhatsApp'a basıldığında tam lead kaydı.
 * Backend başarılı olunca Schedule (browser + CAPI aynı event_id).
 * Sadece buton → Schedule YOK; kayıt başarısı şart.
 */
export function submitPackageLead(state: PackageBuilderState): void {
  if (typeof window === "undefined" || state.packageId == null) return;
  const cart = buildCartSummary(state);
  const attr = readMetaAttributionFromDocument();
  const sessionId = getSessionId();
  const utm = getUtm();
  // Sunucu ile aynı Schedule event_id için client önceden üretir;
  // sunucu lead.id ile reservation_<id> kullanır — client yanıt sonrası aynı id ile fbq.
  try {
    fetch("/api/public/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        source: "whatsapp",
        customer: customerPayload(state),
        cart: {
          selectedIds: cart.selectedIds,
          lineSummary: cart.lineSummary,
          subtotal: cart.subtotal,
          total: cart.total,
          count: cart.count,
        },
        sessionId,
        utm,
        metaAttribution: {
          fbp: attr.fbp,
          fbc: attr.fbc,
        },
        eventSourceUrl: window.location.href,
      }),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean;
          id?: string;
          scheduleEventId?: string;
        } | null;
        if (!data?.ok || !data.id) return;
        // Browser fbq Schedule — CAPI sunucuda aynı reservation_<id> ile gitti
        pixelSchedule(
          data.id,
          cart.total,
          {
            name: state.name,
            phone: state.phone,
            externalId: sessionId,
          },
          { mirrorCapi: false }
        );
        void (data.scheduleEventId ?? reservationScheduleEventId(data.id));
      })
      .catch(() => {});
  } catch {
    /* sessiz */
  }
}
