import { getPackage, getPlato } from "@/config/pricing";
import { COPY } from "@/content/paketOlustur";
import { calculateTotal } from "@/lib/paket/calculate-total";
import type { PackageBuilderState } from "@/lib/paket/state";
import { getSessionId, getUtm } from "@/lib/track/session";
import { readMetaAttributionFromDocument } from "@/lib/meta-attribution";
import { formatPrice } from "@/lib/utils";
import { postJsonDurable } from "@/lib/paket/durable-post";
import { pixelPurchase, pixelSchedule } from "@/lib/paket/pixel";

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
    if (!state.plato) {
      lineSummary.push(`Plato: ${COPY.step1.deferPlatoLabel.toLowerCase()}`);
    } else {
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
 * keepalive fetch; 9 sn içinde yanıt yoksa sendBeacon.
 * Schedule + Purchase: kayıt başarısı (yanıt) sonrası.
 */
export async function submitPackageLead(
  state: PackageBuilderState
): Promise<"ok" | "timeout" | "error" | "skipped"> {
  if (typeof window === "undefined" || state.packageId == null) return "skipped";
  const cart = buildCartSummary(state);
  const attr = readMetaAttributionFromDocument();
  const sessionId = getSessionId();
  const utm = getUtm();

  const payload = {
    source: "whatsapp" as const,
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
  };

  try {
    const result = await postJsonDurable("/api/public/leads", payload);
    if (result.status === "ok" && result.data?.id) {
      try {
        const customer = {
          name: state.name,
          phone: state.phone,
          externalId: sessionId,
        };
        pixelSchedule(result.data.id, cart.total, customer, {
          mirrorCapi: false,
        });
        pixelPurchase(result.data.id, cart.total, customer, {
          mirrorCapi: false,
        });
      } catch {
        /* ignore */
      }
    }
    return result.status;
  } catch {
    return "error";
  }
}
