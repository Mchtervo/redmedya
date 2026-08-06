"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  Check,
  ChevronDown,
  Copy,
  MessageCircle,
  ShieldCheck,
  Star,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { CAMPAIGN, PRICING } from "@/config/pricing";
import { stats } from "@/config/site";
import { COPY } from "@/content/paketOlustur";
import { siteConfig } from "@/config/site";
import { ACTIVE_CTA_VARIANT, activeCtaText } from "@/config/experiments";
import { WeddingDatePicker } from "@/components/ui/wedding-date-picker";
import { goToWhatsApp } from "@/lib/paket/go-to-whatsapp";
import { buildWizardWhatsAppMessage } from "@/lib/paket/whatsapp-message";
import { track } from "@/lib/track/tracker";
import { useKeyboardInset } from "@/hooks/use-keyboard-inset";
import type { AddonId } from "@/config/pricing";
import type { PackageBuilderState } from "@/lib/paket/state";
import { useWizard } from "./wizard-context";

const CAMPAIGN_KLIPS = [
  { id: "klip-gelin-alma", label: "Gelin Alma Klibi" },
  { id: "klip-salon-giris", label: "Salon & İlk Dans Klibi" },
] as const;

function AvailabilityNotice({ date }: { date: string }) {
  const { getAvailabilityFor } = useWizard();
  const info = getAvailabilityFor(date);
  if (!info) return null;
  const tone =
    info.level === "busy"
      ? "border-amber-500/30 bg-amber-500/[0.08] text-amber-300"
      : info.level === "limited"
        ? "border-rm-champagne/30 bg-rm-champagne/[0.06] text-rm-champagne"
        : "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-400";
  return (
    <div className={cn("mt-2 flex items-start gap-2 rounded-lg border p-3 text-xs", tone)}>
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{info.message}</span>
    </div>
  );
}

function SummaryCard() {
  const { totals } = useWizard();
  return (
    <div className="rounded-xl border border-white/10 bg-rm-black-elevated/60 p-5">
      <h3 className="text-sm font-semibold tracking-wide text-rm-gray-200 uppercase">
        {COPY.step3.summaryHeading}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {totals.lineItems.map((li) => (
          <li key={li.key} className="flex items-baseline justify-between gap-3 text-sm">
            <span
              className={cn(
                "text-rm-gray-300",
                li.kind === "venue-discount" && "text-rm-champagne",
                li.kind === "removal" && "text-rm-gray-500"
              )}
            >
              {li.label}
            </span>
            <span
              className={cn(
                "shrink-0 tabular-nums",
                li.rightLabel
                  ? li.isGift
                    ? "text-amber-300"
                    : "text-emerald-400"
                  : li.amount < 0
                    ? "text-rm-champagne"
                    : "text-rm-off-white"
              )}
            >
              {li.originalAmount && (
                <span className="mr-1.5 text-xs text-rm-gray-500 line-through">
                  {formatPrice(li.originalAmount)}
                </span>
              )}
              {li.rightLabel
                ? li.rightLabel
                : li.amount < 0
                  ? `−${formatPrice(-li.amount)}`
                  : formatPrice(li.amount)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-baseline justify-between border-t border-white/[0.08] pt-4">
        <span className="text-sm font-medium text-rm-gray-200">Toplam</span>
        <span className="font-editorial text-2xl text-rm-off-white">
          {formatPrice(totals.total)}
        </span>
      </div>
      {totals.savings > 0 && (
        <p className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2.5 text-center text-sm font-bold text-emerald-400">
          {COPY.summarySavings(formatPrice(totals.savings))}
        </p>
      )}
    </div>
  );
}

/** §1 — Mobilde tek ekrana sığması için katlanabilir kompakt özet */
function CompactSummary() {
  const { state, totals } = useWizard();
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-rm-black-elevated/60 p-4 lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-rm-off-white">
            {COPY.step3.summaryHeading}
            {totals.savings > 0 && (
              <span className="ml-2 text-xs font-semibold text-emerald-400">
                {formatPrice(totals.savings)} kazanç 🎉
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="font-editorial text-xl text-rm-off-white tabular-nums">
            {formatPrice(totals.total)}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 text-rm-gray-400 transition-transform", open && "rotate-180")}
          />
        </div>
      </button>
      {open && (
        <ul className="mt-3 space-y-2 border-t border-white/[0.08] pt-3">
          {totals.lineItems.map((li) => (
            <li key={li.key} className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="text-rm-gray-300">{li.label}</span>
              <span className="shrink-0 tabular-nums text-rm-gray-200">
                {li.rightLabel
                  ? li.rightLabel
                  : li.amount < 0
                    ? `−${formatPrice(-li.amount)}`
                    : formatPrice(li.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {state.packageId != null && <WhatsAppPreview />}
    </div>
  );
}

function ShareLinkButton() {
  const { shareUrl } = useWizard();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      track("share_link_copied", {});
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard yoksa sessizce geç */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-xs font-medium text-rm-gray-300 transition-colors hover:border-rm-champagne/40 hover:text-rm-off-white"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? COPY.step3.copyLinkDone : COPY.step3.copyLink}
    </button>
  );
}

function WhatsAppPreview() {
  const { state } = useWizard();
  const [open, setOpen] = useState(false);
  if (state.packageId == null) return null;
  const message = buildWizardWhatsAppMessage(state);
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 bg-white/[0.03] px-3.5 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-medium text-rm-gray-200">
          <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
          WhatsApp&apos;a gidecek mesajı gör
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-rm-gray-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap border-t border-white/[0.06] bg-rm-black/60 px-3.5 py-3 font-sans text-[11px] leading-relaxed text-rm-gray-300">
          {message}
        </pre>
      )}
    </div>
  );
}

function TrustBlock() {
  const trustStats = stats.filter((s) =>
    ["Çift Çekimi", "Memnuniyet Oranı"].includes(s.label)
  );
  return (
    <div className="mt-4 rounded-lg border border-white/10 bg-rm-black-elevated/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <a
          href={siteConfig.dugun}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-rm-off-white hover:text-rm-champagne"
        >
          <span className="flex items-center">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-rm-champagne text-rm-champagne" />
            ))}
          </span>
          <span className="font-semibold">{CAMPAIGN.dugunRating}</span>
          <span className="text-xs text-rm-gray-400">Düğün.com</span>
        </a>
      </div>

      <div className="mt-3 flex items-center gap-4 border-t border-white/[0.06] pt-3">
        {trustStats.map((s) => (
          <div key={s.label}>
            <p className="font-editorial text-lg text-rm-champagne">
              {s.value}
              {s.suffix}
            </p>
            <p className="text-[10px] tracking-wide text-rm-gray-400 uppercase">
              {s.label}
            </p>
          </div>
        ))}
        <p className="ml-auto flex items-center gap-1.5 text-[11px] text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          {CAMPAIGN.monthlyBookingProof}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[0.06] pt-3 text-xs text-rm-gray-400">
        <a
          href={siteConfig.dugun}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-rm-champagne"
        >
          <Star className="h-3.5 w-3.5 text-rm-champagne" />
          {COPY.step3.trust.reviews}
        </a>
        <a
          href={siteConfig.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-rm-champagne"
        >
          <Camera className="h-3.5 w-3.5" />
          {COPY.step3.trust.instagram}
        </a>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          Küçük depozitoyla tarih kilidi
        </span>
      </div>
    </div>
  );
}

/** §1 — Telefon + Not artık varsayılan KAPALI akordeon içinde */
function OptionalDetails() {
  const { state, setField } = useWizard();
  const [open, setOpen] = useState(false);
  const filled = state.phone.trim() || state.note.trim();
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-medium text-rm-gray-200">
          {COPY.step3.optionalToggle}
          {filled && !open && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              dolu
            </span>
          )}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-rm-gray-400 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="space-y-4 border-t border-white/[0.06] px-4 pt-4 pb-4">
          <p className="text-[11px] leading-snug text-rm-gray-500">
            {COPY.step3.optionalHint}
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-rm-gray-200">
              {COPY.step3.phoneLabel}
            </label>
            <input
              type="tel"
              inputMode="tel"
              value={state.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="05__ ___ __ __"
              className="h-12 w-full rounded-sm border border-white/10 bg-white/[0.04] px-4 text-sm text-rm-off-white outline-none transition-colors placeholder:text-rm-gray-500 focus:border-rm-champagne/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-rm-gray-200">
              {COPY.step3.noteLabel}
            </label>
            <textarea
              value={state.note}
              onChange={(e) => setField("note", e.target.value)}
              placeholder={COPY.step3.notePlaceholder}
              rows={3}
              className="w-full rounded-sm border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-rm-off-white outline-none transition-colors placeholder:text-rm-gray-500 focus:border-rm-champagne/40"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function LastChanceModal({
  missing,
  onAddAndContinue,
  onSkip,
}: {
  missing: { id: string; label: string }[];
  onAddAndContinue: (ids: string[]) => void;
  onSkip: () => void;
}) {
  const s = COPY.step3.lastChance;
  const both = missing.length === 2;
  const reduce = useReducedMotion();
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{
          opacity: 1,
          scale: 1,
          x: reduce ? 0 : [0, -4, 4, -4, 4, 0], // §9.6 shake
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-md rounded-2xl border border-rm-champagne/30 bg-rm-black-elevated p-6 shadow-2xl"
      >
        <p className="text-lg font-bold text-rm-off-white">{s.title}</p>
        <p className="mt-3 text-sm leading-relaxed text-rm-gray-200">{s.body}</p>
        <div className="mt-5 space-y-2">
          {both && (
            <button
              type="button"
              onClick={() => onAddAndContinue(missing.map((m) => m.id))}
              className="w-full rounded-md bg-rm-champagne px-4 py-3 text-sm font-semibold text-rm-black hover:bg-rm-champagne-light"
            >
              {s.addBoth(formatPrice(PRICING.UPSELL_KLIP_CAMPAIGN * 2))}
            </button>
          )}
          {missing.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onAddAndContinue([m.id])}
              className={cn(
                "w-full rounded-md px-4 py-3 text-sm font-semibold",
                both
                  ? "border border-rm-champagne/40 text-rm-champagne hover:bg-rm-champagne/10"
                  : "bg-rm-champagne text-rm-black hover:bg-rm-champagne-light"
              )}
            >
              {both ? `+ ${m.label}` : s.addOne(formatPrice(PRICING.UPSELL_KLIP_CAMPAIGN))}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="mt-3 w-full rounded-md px-4 py-2.5 text-sm text-rm-gray-400 hover:bg-white/5 hover:text-rm-off-white"
        >
          {s.skip}
        </button>
      </motion.div>
    </div>
  );
}

/** Ana CTA — WhatsApp yeşili büyük buton + düşük eşikli mikro yazı */
function PrimaryCta({
  disabled,
  onClick,
  className,
}: {
  disabled: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex h-14 w-full items-center justify-center gap-2 rounded-sm text-sm font-bold tracking-wide uppercase transition-all",
          disabled
            ? "cursor-not-allowed bg-white/5 text-rm-gray-500"
            : "bg-[#25D366] text-white shadow-lg hover:bg-[#20bd5a]"
        )}
      >
        <MessageCircle className="h-5 w-5" />
        {activeCtaText()}
      </button>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-rm-gray-500">
        {COPY.step3.lockMicrocopy}
      </p>
    </div>
  );
}

export function Step3DateConfirm() {
  const { state, setField, hasAddon, toggleAddon, markLastChanceSeen, back, totals } =
    useWizard();
  const [showLastChance, setShowLastChance] = useState(false);
  const kbInset = useKeyboardInset();

  const missingKlips = CAMPAIGN_KLIPS.filter((k) => !hasAddon(k.id)).map((k) => ({
    id: k.id,
    label: k.label,
  }));

  const canSubmit = Boolean(state.date && state.name.trim());

  const handleLock = () => {
    // §6 — ana CTA tıklandı (hangi varyant)
    track("cta_click", {
      variant: ACTIVE_CTA_VARIANT,
      total: totals.total,
      package_id: state.packageId ?? 0,
    });
    const shouldOffer =
      state.packageId !== 3 &&
      missingKlips.length > 0 &&
      !state.lastChancePopupSeen;
    if (shouldOffer) {
      setShowLastChance(true);
      track("lastchance_shown", {});
      return;
    }
    // Adım 3'te Lead zaten form dolunca ateşlendi → fireLead:false (çift Lead yok)
    goToWhatsApp(state, { source: "step3" });
  };

  const addAndContinue = (ids: string[]) => {
    const addonIds = ids as AddonId[];
    const nextAddons = [...state.addons];
    addonIds.forEach((id) => {
      if (!nextAddons.some((a) => a.id === id)) {
        nextAddons.push({ id, quantity: 1 });
      }
      if (!hasAddon(id)) toggleAddon(id);
    });
    const nextState: PackageBuilderState = {
      ...state,
      addons: nextAddons,
      lastChancePopupSeen: true,
    };
    markLastChanceSeen();
    setShowLastChance(false);
    track("lastchance_accepted", { klips: addonIds });
    goToWhatsApp(nextState, { source: "step3" });
  };

  const skipLastChance = () => {
    markLastChanceSeen();
    setShowLastChance(false);
    track("lastchance_dismissed", {});
    goToWhatsApp({ ...state, lastChancePopupSeen: true }, { source: "step3" });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-10">
      {/* Form — mobilde fixed CTA'nın altında kalmasın diye pb */}
      <div className="pb-28 lg:pb-0">
        {/* Mobil kompakt özet (tek ekran hedefi) */}
        <CompactSummary />

        <h2 className="mt-5 font-editorial text-3xl text-rm-off-white sm:text-4xl lg:mt-0">
          {COPY.step3.heading}
        </h2>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-rm-gray-200">
              {COPY.step3.dateLabel} <span className="text-rm-champagne">*</span>
            </label>
            <WeddingDatePicker
              value={state.date}
              onChange={(iso) => setField("date", iso)}
            />
            <AvailabilityNotice date={state.date} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-rm-gray-200">
              {COPY.step3.nameLabel} <span className="text-rm-champagne">*</span>
            </label>
            <input
              type="text"
              value={state.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Ayşe & Mehmet"
              className="h-12 w-full rounded-sm border border-white/10 bg-white/[0.04] px-4 text-sm text-rm-off-white outline-none transition-colors placeholder:text-rm-gray-500 focus:border-rm-champagne/40"
            />
          </div>

          {/* §1 — Telefon + Not opsiyonel akordeonda (varsayılan kapalı) */}
          <OptionalDetails />
        </div>

        <button
          type="button"
          onClick={back}
          className="mt-6 text-sm text-rm-gray-400 hover:text-rm-off-white"
        >
          {COPY.cta.back}
        </button>
      </div>

      {/* Özet + CTA — masaüstü (sağ kolon, sticky) */}
      <div className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
        <SummaryCard />
        <WhatsAppPreview />
        <ShareLinkButton />
        <TrustBlock />
        <PrimaryCta disabled={!canSubmit} onClick={handleLock} className="mt-5" />
      </div>

      {/* Mobil sabit CTA — §8 klavye açıkken üstte kalır (visualViewport inset) */}
      <div
        className="fixed inset-x-0 z-40 border-t border-white/10 bg-rm-black/95 px-4 pt-3 backdrop-blur-lg lg:hidden"
        style={{
          bottom: kbInset,
          paddingBottom: kbInset ? "0.75rem" : "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        <PrimaryCta disabled={!canSubmit} onClick={handleLock} />
      </div>

      {showLastChance && (
        <LastChanceModal
          missing={missingKlips}
          onAddAndContinue={addAndContinue}
          onSkip={skipLastChance}
        />
      )}
    </div>
  );
}
