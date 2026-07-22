import {
  ADDONS,
  PLATO_OPTIONS,
  type AddonId,
  type PackageId,
  type PlatoId,
  type RemovableId,
} from "@/config/pricing";
import { initialState, type PackageBuilderState } from "@/lib/paket/state";

/**
 * Seçimleri paylaşılabilir link query'sine serialize/deserialize eder.
 * Örn: ?p=3&plato=no25&x=sf,c70&d=2026-08-15
 * Gelin kurar → damada/aileye atar → link açılınca state birebir geri yüklenir.
 */

// Kısa addon kodları (link kısalığı için)
const ADDON_CODE: Record<AddonId, string> = {
  "klip-gelin-alma": "kga",
  "klip-salon-giris": "ksg",
  "salon-full": "sf",
  drone: "dr",
  omuz: "om",
  "foto-ekevent": "fe",
  "buyuk-album": "ba",
  "aile-album": "aa",
  "canvas-5070": "c57",
  "canvas-70100": "c70",
};
const CODE_ADDON = Object.fromEntries(
  Object.entries(ADDON_CODE).map(([k, v]) => [v, k])
) as Record<string, AddonId>;

const REMOVAL_CODE: Record<RemovableId, string> = {
  "p-buyuk-album": "rba",
  "p-aile-album": "raa",
};
const CODE_REMOVAL = Object.fromEntries(
  Object.entries(REMOVAL_CODE).map(([k, v]) => [v, k])
) as Record<string, RemovableId>;

const VALID_PLATO = new Set(PLATO_OPTIONS.map((p) => p.id));
const VALID_ADDON = new Set(ADDONS.map((a) => a.id));

export function serializeState(state: PackageBuilderState): string {
  const params = new URLSearchParams();
  if (state.packageId != null) params.set("p", String(state.packageId));
  if (state.plato) params.set("plato", state.plato);
  if (state.addons.length) {
    params.set(
      "x",
      state.addons
        .map((a) => (a.quantity > 1 ? `${ADDON_CODE[a.id]}:${a.quantity}` : ADDON_CODE[a.id]))
        .join(",")
    );
  }
  if (state.removals.length) {
    params.set("r", state.removals.map((r) => REMOVAL_CODE[r]).join(","));
  }
  if (state.date) params.set("d", state.date);
  return params.toString();
}

export function buildShareUrl(state: PackageBuilderState, origin?: string): string {
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  const qs = serializeState(state);
  return `${base}/paket-olustur${qs ? `?${qs}` : ""}`;
}

export function parseState(search: string): Partial<PackageBuilderState> | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const out: Partial<PackageBuilderState> = {};
  let touched = false;

  const p = Number(params.get("p"));
  if (p === 1 || p === 2 || p === 3) {
    out.packageId = p as PackageId;
    touched = true;
  }

  const plato = params.get("plato");
  if (plato && VALID_PLATO.has(plato as PlatoId)) {
    out.plato = plato as PlatoId;
    touched = true;
  }

  const x = params.get("x");
  if (x) {
    const addons = x
      .split(",")
      .map((token) => {
        const [code, qty] = token.split(":");
        const id = CODE_ADDON[code];
        if (!id || !VALID_ADDON.has(id)) return null;
        return { id, quantity: qty ? Math.max(1, Number(qty) || 1) : 1 };
      })
      .filter(Boolean) as PackageBuilderState["addons"];
    if (addons.length) {
      out.addons = addons;
      touched = true;
    }
  }

  const r = params.get("r");
  if (r) {
    const removals = r
      .split(",")
      .map((code) => CODE_REMOVAL[code])
      .filter(Boolean) as RemovableId[];
    if (removals.length) {
      out.removals = removals;
      touched = true;
    }
  }

  const d = params.get("d");
  if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    out.date = d;
    touched = true;
  }

  if (!touched) return null;
  // Link açılınca doğrudan ilgili adıma değil, paket adımına başla ki
  // kullanıcı seçimlerini görsün — ama paket seçiliyse adım korunmaz.
  return { ...out };
}

export { initialState };
