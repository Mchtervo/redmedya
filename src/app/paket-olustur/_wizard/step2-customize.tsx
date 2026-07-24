"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Film, Gift, Lock, Minus, Plus, Sparkles, X } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import {
  ADDONS,
  PRICING,
  getPackage,
  resolveAddonPricing,
  type AddonDef,
  type AddonId,
} from "@/config/pricing";
import { COPY } from "@/content/paketOlustur";
import { track } from "@/lib/track/tracker";
import { AddonIcon } from "./icons";
import { useWizard } from "./wizard-context";

/** §8 — ek hizmet satırlarında 64×64 ürün thumbnail'ı (hepsi insansız) */
const ADDON_THUMB: Partial<Record<AddonId, { src: string; alt: string }>> = {
  drone: { src: "/images/paket-olustur/drone-gift.webp", alt: "Drone çekimi" },
  "buyuk-album": { src: "/images/paket-olustur/album-luxury.webp", alt: "Lüks büyük albüm" },
  "aile-album": { src: "/images/paket-olustur/album-luxury.webp", alt: "Aile albümü" },
  "klip-gelin-alma": { src: "/images/paket-olustur/addon-gelin.webp", alt: "Gelin alma — kırmızı gelin kuşağı" },
  "klip-salon-giris": { src: "/images/paket-olustur/addon-salon.webp", alt: "Salon girişi & ilk dans klibi" },
  "salon-full": { src: "/images/paket-olustur/addon-salon.webp", alt: "Salon full sinematik — düğün salonu" },
  omuz: { src: "/images/paket-olustur/addon-omuz.webp", alt: "Omuz kamera çekimi" },
  "foto-ekevent": { src: "/images/paket-olustur/addon-foto.webp", alt: "Ek etkinlik fotoğraf çekimi" },
  "canvas-5070": { src: "/images/paket-olustur/addon-canvas.webp", alt: "Canvas tablo 50×70" },
  "canvas-70100": { src: "/images/paket-olustur/addon-canvas.webp", alt: "Canvas tablo 70×100" },
};

/* ————————————————————————— Kampanya bottom-sheet ————————————————————————— */

function CampaignBottomSheet() {
  const { state, hasAddon, toggleAddon, markUpsellSeen } = useWizard();
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);

  const eligible =
    state.step === 2 &&
    (state.packageId === 1 || state.packageId === 2) &&
    !state.upsellPopupSeen;

  useEffect(() => {
    if (!eligible) return;
    const t = setTimeout(() => {
      setVisible(true);
      track("upsell_shown", {});
    }, 350);
    // eligible false'a dönerse (ör. "şimdilik geç") cleanup ile kapat
    return () => {
      clearTimeout(t);
      setVisible(false);
    };
  }, [eligible]);

  const close = () => {
    setVisible(false);
    markUpsellSeen();
  };

  const dismiss = () => {
    track("upsell_dismissed", {});
    close();
  };

  const addKlips = (ids: AddonId[]) => {
    ids.forEach((id) => {
      if (!hasAddon(id)) toggleAddon(id);
    });
    track("upsell_accepted", { klips: ids });
    close();
  };

  const s = COPY.step2.campaignSheet;
  const full = PRICING.UPSELL_KLIP_FULL;
  const camp = PRICING.UPSELL_KLIP_CAMPAIGN;

  const klips: { id: AddonId; name: string; desc: string }[] = [
    { id: "klip-gelin-alma", name: s.klipGelinAlma.name, desc: s.klipGelinAlma.desc },
    { id: "klip-salon-giris", name: s.klipSalonGiris.name, desc: s.klipSalonGiris.desc },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/60"
            style={{ backdropFilter: "blur(6px)" }}
            onClick={dismiss}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-label={s.title}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={
              reduce ? { duration: 0 } : { type: "spring", damping: 22, stiffness: 260 }
            }
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl overflow-hidden rounded-t-2xl border-t-2 border-rm-champagne/50 bg-rm-black-elevated shadow-[0_-24px_70px_rgba(0,0,0,0.7)] sm:bottom-4 sm:rounded-2xl sm:border-2"
            style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
          >
        {/* Üst şerit — aciliyet */}
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-rm-champagne/25 via-rm-champagne/15 to-rm-champagne/25 px-5 py-2.5">
          <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-rm-champagne uppercase sm:text-[11px]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rm-champagne" />
            {s.eyebrow}
          </span>
          <button
            type="button"
            onClick={dismiss}
            className="text-rm-gray-400 hover:text-rm-off-white"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          <h3 className="font-editorial text-2xl leading-tight text-rm-off-white">
            {s.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-rm-gray-300">{s.body}</p>

          {/* İki klip kartı */}
          <div className="mt-4 space-y-2.5">
            {klips.map((k) => {
              const already = hasAddon(k.id);
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => addKlips([k.id])}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all",
                    already
                      ? "border-emerald-500/50 bg-emerald-500/[0.06]"
                      : "border-white/10 bg-white/[0.03] hover:border-rm-champagne/50 hover:bg-rm-champagne/[0.06]"
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rm-champagne/15 text-rm-champagne">
                    <Film className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-rm-off-white">{k.name}</span>
                    <span className="block text-[11px] leading-snug text-rm-gray-400">
                      {k.desc}
                    </span>
                    <span className="mt-1 block text-sm">
                      <span className="mr-1.5 text-rm-gray-500 line-through">
                        {formatPrice(full)}
                      </span>
                      <span className="font-bold text-emerald-400">{formatPrice(camp)}</span>
                      <span className="ml-2 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                        {s.saveEach}
                      </span>
                    </span>
                  </span>
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                      already
                        ? "border-emerald-500 bg-emerald-500 text-rm-black"
                        : "border-rm-champagne/50 text-rm-champagne group-hover:bg-rm-champagne group-hover:text-rm-black"
                    )}
                  >
                    {already ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
              );
            })}
          </div>

          {/* İkisini birden — ana CTA */}
          <button
            type="button"
            onClick={() => addKlips(["klip-gelin-alma", "klip-salon-giris"])}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-rm-champagne px-4 py-3.5 text-sm font-bold text-rm-black shadow-[0_0_30px_rgba(196,160,82,0.3)] transition-colors hover:bg-rm-champagne-light"
          >
            <Sparkles className="h-4 w-4" />
            {s.addBoth} · {formatPrice(camp * 2)}
            <span className="rounded bg-black/15 px-1.5 py-0.5 text-[11px] font-bold">
              {s.addBothSave}
            </span>
          </button>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-[11px] text-rm-champagne">
              <Sparkles className="h-3 w-3" />
              {s.socialProof}
            </p>
            <p className="text-[11px] text-rm-gray-500">{s.note}</p>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="mt-3 w-full rounded-lg px-4 py-2.5 text-sm text-rm-gray-400 hover:bg-white/5 hover:text-rm-off-white"
          >
            {s.dismiss}
          </button>
        </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ————————————————————————————— Addon satırı ————————————————————————————— */

function AddonRow({
  addon,
  onConflict,
}: {
  addon: AddonDef;
  onConflict: () => void;
}) {
  const { state, hasAddon, addonQty, toggleAddon, setAddonQty } = useWizard();
  const packageId = state.packageId!;
  const included = addon.includedInPackages?.includes(packageId);
  const selected = hasAddon(addon.id);
  const pricing = resolveAddonPricing(addon, packageId);
  const isCampaign =
    pricing.originalPrice != null && pricing.originalPrice > pricing.price;
  const isDroneGiftP3 = addon.id === "drone" && packageId === 3;

  const handleToggle = () => {
    if (included) return;
    // Salon Full ↔ Salon Girişi çakışması: full eklenirken giriş seçiliyse uyar
    if (addon.id === "salon-full" && !selected && hasAddon("klip-salon-giris")) {
      onConflict();
    }
    toggleAddon(addon.id);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-4 transition-colors",
        included
          ? "border-emerald-500/25 bg-emerald-500/[0.04]"
          : selected
            ? "border-emerald-500/50 bg-emerald-500/[0.06]"
            : "border-white/10 bg-rm-black-elevated/40"
      )}
    >
      {ADDON_THUMB[addon.id] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ADDON_THUMB[addon.id]!.src}
          alt={ADDON_THUMB[addon.id]!.alt}
          width={64}
          height={64}
          loading="lazy"
          className="h-12 w-12 shrink-0 rounded-lg object-cover sm:h-16 sm:w-16"
        />
      ) : (
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            included || selected
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-rm-champagne/10 text-rm-champagne"
          )}
        >
          <AddonIcon id={addon.id} className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-medium text-rm-off-white">{addon.name}</p>
          {addon.badge && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide",
                addon.badge === "KAMPANYA"
                  ? "rm-shimmer rm-breathe bg-rm-champagne/20 text-rm-champagne"
                  : "bg-emerald-500/20 text-emerald-400"
              )}
            >
              {addon.badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] leading-snug text-rm-gray-400">
          {addon.description}
        </p>
        <p className="mt-1.5 text-sm">
          {pricing.isUpgrade && (
            <span className="mr-1.5 text-[11px] font-medium text-rm-champagne">
              yükseltme farkı
            </span>
          )}
          {isCampaign && (
            <span className="mr-1.5 text-rm-gray-500 line-through">
              {formatPrice(pricing.originalPrice!)}
            </span>
          )}
          <span
            className={cn(
              "font-semibold",
              isCampaign || pricing.isUpgrade ? "text-emerald-400" : "text-rm-off-white"
            )}
          >
            {pricing.isUpgrade ? "+" : ""}
            {formatPrice(pricing.price)}
          </span>
          {addon.quantity && <span className="text-rm-gray-400"> / adet</span>}
          {pricing.isUpgrade && (
            <span className="ml-2 text-[11px] text-rm-gray-400">
              Girişi & ilk dansı paketinde var — Full&apos;e yükseltme
            </span>
          )}
          {isDroneGiftP3 && (
            <span className="ml-2 text-[11px] text-rm-champagne">
              Dış çekim drone hediye 🎁 dahil — başka etkinlik için
            </span>
          )}
        </p>
      </div>

      {/* Kontrol */}
      {included ? (
        <span className="flex shrink-0 items-center gap-1 rounded-md bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-400">
          <Check className="h-3.5 w-3.5" /> {COPY.step2.includedLabel}
        </span>
      ) : addon.quantity ? (
        <QtyStepper
          value={addonQty(addon.id)}
          max={addon.quantity.max}
          onChange={(v) => setAddonQty(addon.id, v)}
        />
      ) : (
        <button
          type="button"
          onClick={handleToggle}
          aria-pressed={selected}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors",
            selected
              ? "border-emerald-500 bg-emerald-500 text-rm-black"
              : "border-rm-champagne/40 text-rm-champagne hover:bg-rm-champagne/10"
          )}
          aria-label={selected ? "Çıkar" : "Ekle"}
        >
          {selected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}

function QtyStepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-md border border-white/10 p-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value <= 0}
        className="flex h-7 w-7 items-center justify-center rounded text-rm-gray-300 hover:bg-white/5 disabled:opacity-30"
        aria-label="Azalt"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-6 text-center text-sm tabular-nums text-rm-off-white">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex h-7 w-7 items-center justify-center rounded text-rm-champagne hover:bg-rm-champagne/10 disabled:opacity-30"
        aria-label="Arttır"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ———————————————————————— Paketinde olanlar (çıkarma) ———————————————————————— */

function PackageContents() {
  const { state, toggleRemoval } = useWizard();
  const pkg = getPackage(state.packageId!);

  return (
    <section className="mt-10">
      <h3 className="text-sm font-semibold tracking-wide text-rm-gray-200 uppercase">
        {COPY.step2.packageContentsHeading}
      </h3>
      <div className="mt-3 space-y-2">
        {/* Kilitli çekirdek + hediye (foto, klip, P3 klipleri, drone) */}
        {pkg.lockedItems.map((item, i) => (
          <div
            key={`locked-${i}`}
            className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
          >
            {item.gift ? (
              <Gift className="h-4 w-4 shrink-0 text-amber-300" />
            ) : (
              <Lock className="h-4 w-4 shrink-0 text-rm-gray-500" />
            )}
            <p className="flex-1 text-sm text-rm-gray-200">{item.label}</p>
            <span className="text-[11px] text-rm-gray-500">
              {item.gift ? COPY.step2.giftLabel : COPY.step2.lockedHint}
            </span>
          </div>
        ))}

        {/* Çıkarılabilir kalemler */}
        {pkg.removables.map((rem) => {
          const removed = state.removals.includes(rem.id);
          const label =
            rem.count && rem.count > 1 ? `${rem.label} (${rem.count} adet)` : rem.label;
          return (
            <div
              key={rem.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                removed
                  ? "border-white/[0.06] bg-transparent opacity-50"
                  : "border-emerald-500/20 bg-emerald-500/[0.04]"
              )}
            >
              <Check
                className={cn(
                  "h-4 w-4 shrink-0",
                  removed ? "text-rm-gray-600" : "text-emerald-400"
                )}
              />
              <p
                className={cn(
                  "flex-1 text-sm",
                  removed ? "text-rm-gray-500 line-through" : "text-rm-gray-200"
                )}
              >
                {label}
              </p>
              <button
                type="button"
                onClick={() => toggleRemoval(rem.id)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  removed
                    ? "bg-rm-champagne/15 text-rm-champagne hover:bg-rm-champagne/25"
                    : "text-rm-gray-400 hover:bg-white/5 hover:text-rm-off-white"
                )}
              >
                {removed ? "Geri ekle" : `Çıkar (−${formatPrice(rem.value * (rem.count ?? 1))})`}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ————————————————————————————————— Step 2 ————————————————————————————————— */

export function Step2Customize() {
  const { state } = useWizard();
  const [conflictMsg, setConflictMsg] = useState(false);
  const conflictTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showConflict = () => {
    setConflictMsg(true);
    if (conflictTimer.current) clearTimeout(conflictTimer.current);
    conflictTimer.current = setTimeout(() => setConflictMsg(false), 5000);
  };

  useEffect(() => () => {
    if (conflictTimer.current) clearTimeout(conflictTimer.current);
  }, []);

  // P3'te kampanya klipleri dahil → addon listesinden gizlenir (çift gösterim yok)
  const visibleAddons = useMemo(
    () =>
      ADDONS.filter((a) => {
        if (state.packageId === 3 && a.includedInPackages?.includes(3)) {
          // dahil olanları "Dahil ✓" olarak yine göstermek isteyebiliriz;
          // ama klipler zaten paket içeriğinde. Yalnızca albümü gizle, klipleri göster.
          return a.id !== "buyuk-album";
        }
        if (state.packageId === 2 && a.id === "buyuk-album") return false;
        return true;
      }),
    [state.packageId]
  );

  return (
    <div>
      <h2 className="font-editorial text-3xl text-rm-off-white sm:text-4xl">
        {COPY.step2.heading}
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-rm-gray-400">
        {COPY.step2.subtitle}
      </p>

      {conflictMsg && (
        <div className="mt-5 rounded-lg border border-rm-champagne/30 bg-rm-champagne/[0.08] p-3 text-sm text-rm-champagne">
          {COPY.step2.salonFullConflict}
        </div>
      )}

      <div className="mt-6 space-y-3">
        <h3 className="text-sm font-semibold tracking-wide text-rm-gray-200 uppercase">
          {COPY.step2.addonsHeading}
        </h3>
        {visibleAddons.map((addon) => (
          <AddonRow key={addon.id} addon={addon} onConflict={showConflict} />
        ))}
      </div>

      <PackageContents />

      <CampaignBottomSheet />
    </div>
  );
}
