"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AVAILABILITY,
  getAddon,
  getPackage,
  type AddonId,
  type AvailabilityLevel,
  type PackageId,
  type PlatoId,
  type RemovableId,
} from "@/config/pricing";
import {
  initialState,
  reducer,
  type PackageBuilderState,
  type WizardStep,
} from "@/lib/paket/state";
import { calculateTotal, type TotalResult } from "@/lib/paket/calculate-total";
import { buildShareUrl, parseState, serializeState } from "@/lib/paket/url-state";
import {
  pixelAddToCartMain,
  pixelInitiateCheckout,
  pixelPackageBuild,
  pixelStepView,
} from "@/lib/paket/pixel";
import { syncPackageDraft } from "@/lib/paket/lead-capture";
import { track, trackSessionEnd } from "@/lib/track/tracker";
import { captureUtmOnLanding } from "@/lib/track/session";
import { trackFunnelEvent } from "@/lib/analytics/client";

type AvailabilityInfo = { level: AvailabilityLevel; message: string };
type AvailabilityMap = Record<string, AvailabilityInfo>;

type WizardContextValue = {
  state: PackageBuilderState;
  totals: TotalResult;
  /** §9.10 adım geçiş yönü: 1 ileri, -1 geri */
  dir: number;
  /** Eksik seçim uyarısı (Devam'a basıldığında) */
  warning: null | "package" | "plato";
  hasAddon: (id: AddonId) => boolean;
  addonQty: (id: AddonId) => number;
  goToStep: (step: WizardStep) => void;
  next: () => void;
  back: () => void;
  selectPackage: (id: PackageId) => void;
  selectPlato: (plato: PlatoId | null) => void;
  toggleAddon: (id: AddonId) => void;
  setAddonQty: (id: AddonId, qty: number) => void;
  toggleRemoval: (id: RemovableId) => void;
  setField: (field: "date" | "name" | "phone" | "note", value: string) => void;
  markUpsellSeen: () => void;
  markLastChanceSeen: () => void;
  shareUrl: () => string;
  getAvailabilityFor: (isoDate: string) => AvailabilityInfo | null;
};

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hydratedRef = useRef(false);
  const [hydrated, setHydrated] = useState(false);

  // Mount: UTM yakala + paylaşılan link query'sinden state restore
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    captureUtmOnLanding();
    const parsed =
      typeof window !== "undefined" ? parseState(window.location.search) : null;
    if (parsed) {
      dispatch({ type: "HYDRATE", state: parsed });
    }
    // İlk step'i history state'e yaz
    if (typeof window !== "undefined") {
      window.history.replaceState({ rmStep: parsed ? 1 : 1 }, "");
    }
    setHydrated(true);
  }, []);

  // Ön seçili paket (P2) veya paylaşım linki — PackageBuild bir kez
  const defaultPackageTrackedRef = useRef(false);
  useEffect(() => {
    if (!hydrated) return;
    if (defaultPackageTrackedRef.current) return;
    if (state.packageId == null) return;
    defaultPackageTrackedRef.current = true;
    const pkg = getPackage(state.packageId);
    pixelPackageBuild(`${pkg.name} — ${pkg.subtitle}`, pkg.price);
    trackFunnelEvent("PackageSelected", {
      metadata: { package_id: state.packageId, price: pkg.price },
    });
    track("package_selected", {
      package_id: state.packageId,
      price: pkg.price,
    });
  }, [hydrated, state.packageId]);

  // Seçim query'sini URL'e senkronla (yeni history girişi eklemeden)
  useEffect(() => {
    if (typeof window === "undefined" || !hydratedRef.current) return;
    const qs = serializeState(state);
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    window.history.replaceState(
      { ...(window.history.state ?? {}), rmStep: state.step },
      "",
      url
    );
  }, [
    state.packageId,
    state.plato,
    state.addons,
    state.removals,
    state.date,
    state.step,
    state,
  ]);

  // Tarayıcı geri/ileri → adımı senkronla
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const step = (e.state?.rmStep as WizardStep) ?? 1;
      dispatch({ type: "SET_STEP", step });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const totals = useMemo(() => calculateTotal(state), [state]);

  /** Callback/effect'lerde güncel sepet toplamı (dep churn olmadan) */
  const totalRef = useRef(0);
  useEffect(() => {
    totalRef.current = totals.total;
  }, [totals.total]);

  // Müsaitlik — dosyadan (data/availability.json); config varsayılanı fallback
  const [availability, setAvailability] = useState<AvailabilityMap>(AVAILABILITY);
  useEffect(() => {
    fetch("/api/public/availability")
      .then((r) => r.json())
      .then((data: AvailabilityMap) => {
        if (data && Object.keys(data).length) setAvailability(data);
      })
      .catch(() => {});
  }, []);

  const getAvailabilityFor = useCallback(
    (isoDate: string): AvailabilityInfo | null => {
      const m = /^(\d{4})-(\d{2})-\d{2}$/.exec(isoDate);
      if (!m) return null;
      return availability[`${m[1]}-${m[2]}`] ?? null;
    },
    [availability]
  );

  // Funnel — her adım görüntülemesi (GA4 + Meta custom event + journey tracking)
  const prevStepRef = useRef(state.step);
  const step3ViewFiredRef = useRef(false);
  useEffect(() => {
    pixelStepView(state.step);
    const prev = prevStepRef.current;
    if (state.step !== prev) {
      track(state.step > prev ? "step_advanced" : "step_back", {
        from: prev,
        to: state.step,
      });
      prevStepRef.current = state.step;
    }
    // §6 mikro funnel — Adım 3 görüntülendi (tek sefer)
    if (state.step === 3 && !step3ViewFiredRef.current) {
      step3ViewFiredRef.current = true;
      track("step3_view", { total: totalRef.current });
    }
  }, [state.step]);

  // §11 — page_view (mount) + session_end (çıkışta, son adımla, sendBeacon)
  const stepRef = useRef(state.step);
  useEffect(() => {
    stepRef.current = state.step;
  }, [state.step]);
  useEffect(() => {
    track("page_view", { path: "/paket-olustur" });
    const onHide = () => {
      if (document.visibilityState === "hidden") trackSessionEnd(stepRef.current);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  // Taslak senkronu — "Tarihimi Kilitle"ye basmadan önce yarım bırakanı yakala.
  // Debounce: her tuş vuruşunda değil, 1.2 sn sessizlikte kaydet.
  useEffect(() => {
    if (state.packageId == null) return;
    const t = setTimeout(() => syncPackageDraft(state), 1200);
    return () => clearTimeout(t);
  }, [
    state.packageId,
    state.plato,
    state.addons,
    state.removals,
    state.date,
    state.name,
    state.phone,
    state.note,
    state,
  ]);

  const [dir, setDir] = useState(1);
  const [warning, setWarning] = useState<null | "package" | "plato">(null);
  const goToStep = useCallback(
    (step: WizardStep) => {
      if (step === state.step) return;
      // Form aşamasına ilk giriş → InitiateCheckout (tek sefer; geri/ileri spam yok)
      if (step === 3 && state.step < 3) {
        pixelInitiateCheckout(totalRef.current);
      }
      if (step > state.step) {
        trackFunnelEvent("StepForward", {
          metadata: { from: state.step, to: step },
        });
      } else if (step < state.step) {
        trackFunnelEvent("StepBack", {
          metadata: { from: state.step, to: step },
        });
      }
      setDir(step >= state.step ? 1 : -1); // §9.10 yön
      const qs = serializeState({ ...state, step });
      const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
      window.history.pushState({ rmStep: step }, "", url);
      dispatch({ type: "SET_STEP", step });
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [state]
  );

  const next = useCallback(() => {
    if (state.step === 1) {
      // Eksik seçim → uyar + ilgili bölüme kaydır (buton ölü kalmasın)
      if (state.packageId == null) {
        setWarning("package");
        document.getElementById("paket-secimi")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }
      setWarning(null);
      // AddToCart: bilinçli "Devam" — paket seçili (plato opsiyonel)
      const pkg = getPackage(state.packageId);
      pixelAddToCartMain(`${pkg.name} — ${pkg.subtitle}`, totals.total);
      goToStep(2);
    } else if (state.step === 2) {
      goToStep(3); // InitiateCheckout goToStep(3) içinde
    }
  }, [state.step, state.packageId, totals.total, goToStep]);

  const back = useCallback(() => {
    if (state.step > 1) goToStep((state.step - 1) as WizardStep);
  }, [state.step, goToStep]);

  const selectPackage = useCallback((id: PackageId) => {
    const pkg = getPackage(id);
    dispatch({ type: "SELECT_PACKAGE", packageId: id });
    setWarning(null);
    // PackageBuild: ilk gerçek seçim (tek sefer; plato da aynı gate)
    pixelPackageBuild(`${pkg.name} — ${pkg.subtitle}`, pkg.price);
    trackFunnelEvent("PackageSelected", {
      metadata: { package_id: id, price: pkg.price },
    });
    track("package_selected", { package_id: id, price: pkg.price });
  }, []);

  const selectPlato = useCallback((plato: PlatoId | null) => {
    dispatch({ type: "SELECT_PLATO", plato });
    setWarning(null);
    if (plato == null) {
      trackFunnelEvent("PlatoSelected", { metadata: { plato: "later" } });
      track("plato_selected", { plato: "later" });
      return;
    }
    pixelPackageBuild(`plato_${plato}`, 0);
    trackFunnelEvent("PlatoSelected", { metadata: { plato } });
    track("plato_selected", { plato });
  }, []);

  const hasAddon = useCallback(
    (id: AddonId) => state.addons.some((a) => a.id === id),
    [state.addons]
  );

  const addonQty = useCallback(
    (id: AddonId) => state.addons.find((a) => a.id === id)?.quantity ?? 0,
    [state.addons]
  );

  const toggleAddon = useCallback(
    (id: AddonId) => {
      const wasSelected = state.addons.some((a) => a.id === id);
      dispatch({ type: "TOGGLE_ADDON", id });
      const def = getAddon(id);
      if (!wasSelected) {
        trackFunnelEvent("ExtraServiceSelected", {
          metadata: { addon_id: id, price: def.price },
        });
      }
      track(wasSelected ? "addon_removed" : "addon_added", {
        addon_id: id,
        price: def.price,
      });
    },
    [state.addons]
  );

  const setAddonQty = useCallback(
    (id: AddonId, qty: number) => {
      dispatch({ type: "SET_ADDON_QTY", id, quantity: qty });
    },
    []
  );

  const toggleRemoval = useCallback(
    (id: RemovableId) => dispatch({ type: "TOGGLE_REMOVAL", id }),
    []
  );

  // §11 — form tracking: DEĞER asla loglanmaz, yalnızca alan adı
  // InitiateCheckout form/input/tarih ile TETİKLENMEZ (yalnızca step 2→3 next)
  const formStartedRef = useRef(false);
  const filledFieldsRef = useRef<Set<string>>(new Set());
  const form3StartedRef = useRef(false);
  const date3FilledRef = useRef(false);
  const name3FilledRef = useRef(false);
  const stepRefForField = useRef(state.step);
  useEffect(() => {
    stepRefForField.current = state.step;
  }, [state.step]);

  const setField = useCallback(
    (field: "date" | "name" | "phone" | "note", value: string) => {
      dispatch({ type: "SET_FIELD", field, value });
      if (!filledFieldsRef.current.has(`touch:${field}`)) {
        filledFieldsRef.current.add(`touch:${field}`);
        trackFunnelEvent("FormFieldTouched", {
          metadata: { field_name: field },
        });
      }
      if (!formStartedRef.current) {
        formStartedRef.current = true;
        track("form_started", { total: totalRef.current });
        trackFunnelEvent("FormStarted", {
          metadata: { total: totalRef.current },
        });
      }

      if (stepRefForField.current === 3) {
        if (!form3StartedRef.current) {
          form3StartedRef.current = true;
          track("form_start", { total: totalRef.current });
        }
        if (field === "date" && value && !date3FilledRef.current) {
          date3FilledRef.current = true;
          track("date_filled", { total: totalRef.current });
        }
        if (field === "name" && value.trim() && !name3FilledRef.current) {
          name3FilledRef.current = true;
          track("name_filled", { total: totalRef.current });
        }
      }

      if (field === "date") {
        const m = /^(\d{4})-(\d{2})/.exec(value);
        if (m) {
          track("date_selected", {
            month: `${m[1]}-${m[2]}`,
            total: totalRef.current,
          });
          trackFunnelEvent("DateSelected", {
            metadata: { month: `${m[1]}-${m[2]}` },
          });
        }
      } else if (value.trim() && !filledFieldsRef.current.has(field)) {
        filledFieldsRef.current.add(field);
        track("form_field_filled", { field, total: totalRef.current });
      }
    },
    []
  );

  const markUpsellSeen = useCallback(
    () => dispatch({ type: "MARK_UPSELL_SEEN" }),
    []
  );
  const markLastChanceSeen = useCallback(
    () => dispatch({ type: "MARK_LAST_CHANCE_SEEN" }),
    []
  );

  // Final conversion = Schedule — yalnızca backend lead kaydı sonrası (goToWhatsApp / submitPackageLead).
  // Form dolunca Lead / InitiateCheckout YOK.

  // Sepet tutarını olaylara yaz — admin "Ort. Sepet" bunu okur (dönüşüm olmasa da)
  const lastTrackedTotalRef = useRef(-1);
  useEffect(() => {
    if (state.packageId == null) return;
    if (totals.total === lastTrackedTotalRef.current) return;
    const t = setTimeout(() => {
      lastTrackedTotalRef.current = totals.total;
      track("cart_updated", {
        total: totals.total,
        savings: totals.savings,
        package_id: state.packageId ?? 0,
        step: state.step,
      });
    }, 900);
    return () => clearTimeout(t);
  }, [totals.total, totals.savings, state.packageId, state.step]);

  const shareUrl = useCallback(() => buildShareUrl(state), [state]);

  const value = useMemo<WizardContextValue>(
    () => ({
      state,
      totals,
      dir,
      warning,
      hasAddon,
      addonQty,
      goToStep,
      next,
      back,
      selectPackage,
      selectPlato,
      toggleAddon,
      setAddonQty,
      toggleRemoval,
      setField,
      markUpsellSeen,
      markLastChanceSeen,
      shareUrl,
      getAvailabilityFor,
    }),
    [
      state,
      totals,
      dir,
      warning,
      hasAddon,
      addonQty,
      goToStep,
      next,
      back,
      selectPackage,
      selectPlato,
      toggleAddon,
      setAddonQty,
      toggleRemoval,
      setField,
      markUpsellSeen,
      markLastChanceSeen,
      shareUrl,
      getAvailabilityFor,
    ]
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}
