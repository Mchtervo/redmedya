import type { AddonId, PackageId, PlatoId, RemovableId } from "@/config/pricing";

export type WizardStep = 1 | 2 | 3;

export type AddonSelection = {
  id: AddonId;
  /** adet (sayaçlı addon'lar için); diğerleri her zaman 1 */
  quantity: number;
};

export type PackageBuilderState = {
  step: WizardStep;
  packageId: PackageId | null;
  plato: PlatoId | null;
  addons: AddonSelection[];
  /** Paketten çıkarılan dahil kalemler (à la carte değeri kadar düşer) */
  removals: RemovableId[];
  date: string; // ISO YYYY-MM-DD
  name: string;
  phone: string;
  note: string;
  upsellPopupSeen: boolean; // adım 2 bottom-sheet
  lastChancePopupSeen: boolean; // adım 3 son fırsat modal
};

export const initialState: PackageBuilderState = {
  step: 1,
  packageId: null,
  plato: null,
  addons: [],
  removals: [],
  date: "",
  name: "",
  phone: "",
  note: "",
  upsellPopupSeen: false,
  lastChancePopupSeen: false,
};

export type Action =
  | { type: "SET_STEP"; step: WizardStep }
  | { type: "SELECT_PACKAGE"; packageId: PackageId }
  | { type: "SELECT_PLATO"; plato: PlatoId }
  | { type: "TOGGLE_ADDON"; id: AddonId }
  | { type: "SET_ADDON_QTY"; id: AddonId; quantity: number }
  | { type: "TOGGLE_REMOVAL"; id: RemovableId }
  | { type: "SET_FIELD"; field: "date" | "name" | "phone" | "note"; value: string }
  | { type: "MARK_UPSELL_SEEN" }
  | { type: "MARK_LAST_CHANCE_SEEN" }
  | { type: "HYDRATE"; state: Partial<PackageBuilderState> }
  | { type: "RESET" };

const SALON_GIRIS: AddonId = "klip-salon-giris";
const SALON_FULL: AddonId = "salon-full";

function hasAddon(addons: AddonSelection[], id: AddonId): boolean {
  return addons.some((a) => a.id === id);
}

function addAddon(addons: AddonSelection[], id: AddonId, quantity = 1): AddonSelection[] {
  if (hasAddon(addons, id)) return addons;
  return [...addons, { id, quantity }];
}

function removeAddon(addons: AddonSelection[], id: AddonId): AddonSelection[] {
  return addons.filter((a) => a.id !== id);
}

export function reducer(
  state: PackageBuilderState,
  action: Action
): PackageBuilderState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.step };

    case "SELECT_PACKAGE": {
      // Paket değişince, çakışabilecek dahil/kampanya seçimleri temizle.
      let addons = state.addons;
      // P3 klipleri kendi paketinde dahil; addon olarak tutulmaz.
      if (action.packageId === 3) {
        addons = removeAddon(addons, "klip-gelin-alma");
        addons = removeAddon(addons, "klip-salon-giris");
        addons = removeAddon(addons, "buyuk-album");
      }
      if (action.packageId === 2) {
        addons = removeAddon(addons, "buyuk-album");
      }
      return {
        ...state,
        packageId: action.packageId,
        addons,
        // paket değişti → çıkarmalar sıfırlansın (farklı paketin kalemleri)
        removals: [],
      };
    }

    case "SELECT_PLATO":
      return { ...state, plato: action.plato };

    case "TOGGLE_ADDON": {
      const id = action.id;
      let addons = state.addons;

      if (hasAddon(addons, id)) {
        addons = removeAddon(addons, id);
        return { ...state, addons };
      }

      // Çakışma kuralı: Salon Full Sinematik ↔ Salon Girişi & İlk Dans
      if (id === SALON_FULL) {
        addons = removeAddon(addons, SALON_GIRIS); // full girişi kapsar
      }
      if (id === SALON_GIRIS && hasAddon(addons, SALON_FULL)) {
        // Full zaten girişi kapsıyor — girişi ekleme (no-op)
        return state;
      }

      addons = addAddon(addons, id, 1);
      return { ...state, addons };
    }

    case "SET_ADDON_QTY": {
      const { id, quantity } = action;
      let addons = state.addons;
      if (quantity <= 0) {
        addons = removeAddon(addons, id);
      } else if (hasAddon(addons, id)) {
        addons = addons.map((a) => (a.id === id ? { ...a, quantity } : a));
      } else {
        addons = addAddon(addons, id, quantity);
      }
      return { ...state, addons };
    }

    case "TOGGLE_REMOVAL": {
      const removals = state.removals.includes(action.id)
        ? state.removals.filter((r) => r !== action.id)
        : [...state.removals, action.id];
      return { ...state, removals };
    }

    case "SET_FIELD":
      return { ...state, [action.field]: action.value };

    case "MARK_UPSELL_SEEN":
      return { ...state, upsellPopupSeen: true };

    case "MARK_LAST_CHANCE_SEEN":
      return { ...state, lastChancePopupSeen: true };

    case "HYDRATE":
      return { ...state, ...action.state };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}
