"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Gift, Lock } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import {
  CAMPAIGN,
  PACKAGES,
  PLATO_OPTIONS,
  PRICING,
  type PackageDef,
} from "@/config/pricing";
import { COPY } from "@/content/paketOlustur";
import {
  previewPackagePrice,
  previewPackageSavings,
  previewPackageValue,
} from "@/lib/paket/calculate-total";
import { PlatoIcon } from "./icons";
import { CountUp, ConfettiBurst } from "./motion";
import { useWizard } from "./wizard-context";

function PackageCard({ pkg }: { pkg: PackageDef }) {
  const { state, selectPackage } = useWizard();
  const reduce = useReducedMotion();
  const ownVenue = state.plato === "own";
  const selected = state.packageId === pkg.id;
  const anySelected = state.packageId != null;
  const price = previewPackagePrice(pkg.id, ownVenue);
  const savings = previewPackageSavings(pkg.id, ownVenue);
  const valueTotal = previewPackageValue(pkg.id, ownVenue);
  const isP3 = pkg.id === 3;

  // §9.2 — seçildiğinde tek sefer konfeti
  const [confetti, setConfetti] = useState(0);
  const wasSelected = useRef(selected);
  useEffect(() => {
    if (selected && !wasSelected.current) setConfetti((c) => c + 1);
    wasSelected.current = selected;
  }, [selected]);

  return (
    <div className={cn(pkg.featured && "lg:scale-[1.05]")}>
      <motion.div
        className="relative"
        animate={
          reduce
            ? undefined
            : {
                opacity: anySelected && !selected ? 0.85 : 1, // §9.9
                scale: selected ? [1, 1.02, 1] : 1, // §9.9 seçim pulse
              }
        }
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <ConfettiBurst trigger={confetti} />
      {/* Ribbon — kartın üst kenarında, kırpılmaz */}
      {pkg.ribbon && (
        <span
          className={cn(
            "absolute -top-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase shadow-lg",
            isP3
              ? "rm-shimmer rm-shimmer-slow bg-gradient-to-r from-amber-400 to-rm-champagne text-rm-black"
              : "bg-rm-champagne text-rm-black"
          )}
        >
          {pkg.ribbon}
        </span>
      )}
      <button
        type="button"
        onClick={() => selectPackage(pkg.id)}
        aria-pressed={selected}
        className={cn(
          "group relative flex w-full flex-col overflow-hidden rounded-xl border text-left transition-all",
          "bg-rm-black-elevated/60 backdrop-blur-sm",
          selected
            ? "border-emerald-500/60 ring-1 ring-emerald-500/40"
            : "border-white/10 hover:border-rm-champagne/40",
          pkg.featured && "shadow-[0_0_50px_rgba(196,160,82,0.15)]",
          pkg.featured && !selected && "border-rm-champagne/40"
        )}
      >
        {/* §8 üst şerit görseli (P2 albüm / P3 drone) — lazy, w/h, alt */}
        {pkg.stripImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pkg.stripImage}
            alt={pkg.stripAlt ?? ""}
            width={900}
            height={120}
            loading="lazy"
            className="h-[120px] w-full object-cover"
          />
        )}

        {selected && (
          <span className="absolute top-4 right-4 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-rm-black">
            <Check className="h-4 w-4" />
          </span>
        )}

        <div className="p-5 sm:p-6">
          <div className="mt-2">
        <h3 className="font-editorial text-2xl text-rm-off-white">{pkg.name}</h3>
        <p className="text-sm tracking-wide text-rm-champagne">{pkg.subtitle}</p>
      </div>

      {pkg.featured && (
        <p className="mt-2 text-[11px] font-medium text-rm-gray-300">
          {CAMPAIGN.featuredSocialProof}
        </p>
      )}

      {/* Fiyat */}
      <div className="mt-5">
        <p className="text-xs text-rm-gray-500 line-through">
          {formatPrice(valueTotal)}
        </p>
        <p className="rm-fade-up font-editorial text-4xl text-rm-off-white">
          {formatPrice(price)}
        </p>
        {savings > 0 && (
          <p
            className={cn(
              "mt-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2.5 py-1.5 text-sm font-bold text-emerald-400",
              isP3 && "text-base"
            )}
          >
            🎉{" "}
            <CountUp
              value={savings}
              format={(n) => formatPrice(n)}
              className="tabular-nums"
            />{" "}
            kazanıyorsunuz
          </p>
        )}
        {isP3 && (
          <p className="mt-2 flex items-center gap-1.5 rounded-md bg-amber-400/10 px-2.5 py-1.5 text-xs font-semibold text-amber-300">
            🚁 ₺{PRICING.DRONE_GIFT_VALUE.toLocaleString("tr-TR")} değerinde drone
            HEDİYE dahil
          </p>
        )}
      </div>

      {/* İçerik */}
      <ul className="mt-5 space-y-2.5 border-t border-white/[0.06] pt-5">
        {pkg.contents.map((line, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            {line.emphasis === "gift" ? (
              <Gift className="mt-0.5 h-4 w-4 shrink-0 text-rm-champagne" />
            ) : line.emphasis === "drone" ? (
              <span className="mt-0.5 shrink-0 text-sm">🚁</span>
            ) : (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/80" />
            )}
            <span
              className={cn(
                "leading-snug",
                line.emphasis === "gift" && "font-medium text-rm-champagne",
                line.emphasis === "drone" &&
                  "rounded bg-amber-400/10 px-1 font-semibold text-amber-300",
                (!line.emphasis || line.emphasis === "core") && "text-rm-gray-200"
              )}
            >
              {line.label}
            </span>
          </li>
          ))}
        </ul>
        </div>
      </button>
      </motion.div>
    </div>
  );
}

function PlatoSelector() {
  const { state, selectPlato } = useWizard();

  return (
    <section className="mt-12">
      <h2 className="font-editorial text-2xl text-rm-off-white sm:text-3xl">
        {COPY.step1.platoHeading}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-rm-gray-400">
        {COPY.step1.platoSubtitle}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {PLATO_OPTIONS.map((opt) => {
          const selected = state.plato === opt.id;
          const isOwn = opt.id === "own";
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => selectPlato(opt.id)}
              aria-pressed={selected}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border p-4 text-left transition-all",
                selected
                  ? "border-emerald-500/60 bg-emerald-500/[0.06] ring-1 ring-emerald-500/40"
                  : "border-white/10 bg-rm-black-elevated/40 hover:border-rm-champagne/40"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    selected
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-rm-champagne/10 text-rm-champagne"
                  )}
                >
                  <PlatoIcon id={opt.id} className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium text-rm-off-white">{opt.name}</p>
                  {opt.note && (
                    <p className="mt-0.5 text-[11px] text-rm-gray-400">{opt.note}</p>
                  )}
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-md px-2.5 py-1 text-xs font-bold",
                  isOwn
                    ? "bg-rm-champagne/15 text-rm-champagne"
                    : "bg-emerald-500/15 text-emerald-400"
                )}
              >
                {isOwn ? COPY.step1.ownVenueDiscountLabel : `${COPY.step1.freeLabel} ✓`}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FreePlatoUrgencyCard() {
  const u = COPY.step1.urgency;
  return (
    <div className="relative mb-8 overflow-hidden rounded-xl border border-rm-champagne/40 bg-gradient-to-r from-rm-champagne/[0.12] via-emerald-500/[0.06] to-rm-champagne/[0.12] p-4 sm:p-5">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-rm-champagne/10 blur-2xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rm-champagne/20 px-2.5 py-1 text-[10px] font-bold tracking-wide text-rm-champagne uppercase">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rm-champagne" />
            {u.badge}
          </span>
          <p className="mt-2 font-editorial text-xl text-rm-off-white sm:text-2xl">
            {u.title}
          </p>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-rm-gray-300 sm:text-sm">
            {u.body}
          </p>
        </div>
        <p className="shrink-0 rounded-lg bg-emerald-500/15 px-3 py-2 text-center text-xs font-bold text-emerald-400 sm:text-sm">
          {u.cta}
        </p>
      </div>
    </div>
  );
}

export function Step1PackagePlato() {
  return (
    <div>
      <h2 className="sr-only">{COPY.step1.packagesHeading}</h2>
      <FreePlatoUrgencyCard />
      <div className="grid gap-6 pt-4 md:grid-cols-3 md:items-start md:gap-4 lg:gap-6">
        {PACKAGES.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} />
        ))}
      </div>
      <PlatoSelector />
      <LockedHint />
    </div>
  );
}

function LockedHint() {
  const { state } = useWizard();
  if (state.packageId != null && state.plato != null) return null;
  return (
    <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-rm-gray-500">
      <Lock className="h-3.5 w-3.5" />
      Devam etmek için bir paket ve dış çekim mekânı seçin.
    </p>
  );
}
