"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Camera,
  Film,
  Plane,
  BookImage,
  BookOpen,
  Frame,
  Check,
  ChevronDown,
  Video,
} from "lucide-react";
import { PACKAGE_EXPAND_OCCASION_EVENT } from "@/lib/package-expand";
import { canAddAileAlbum } from "@/lib/album-rules";
import {
  buyukAlbumPageOptionLabel,
  type BuyukAlbumPages,
} from "@/config/albums";
import { usePackageStore } from "@/stores/package-store";
import { OCCASIONS } from "@/config/occasions";
import type { ServiceItem } from "@/config/services";
import { formatPrice, cn } from "@/lib/utils";
import { trackMetaEvent } from "@/lib/meta-pixel";
import {
  DRONE_GIFT_SERVICE_ID,
  lineTotalFor,
  qualifiesForDroneGift,
} from "@/lib/package-pricing";
import { qualifiesForKlipCampaign } from "@/lib/package-campaign-klips";
import {
  CAMPAIGN_KLIP_LIST_PRICE,
  CAMPAIGN_KLIP_PRICE,
  CAMPAIGN_KLIP_SAVINGS,
  KLIP_GELIN_ALMA_ID,
  KLIP_KUAFOR_HAZIRLIK_ID,
  KLIP_SALON_GIRIS_ID,
} from "@/config/campaign-klips";
import { dispatchExpandPackageSection } from "@/lib/package-expand";

type OccasionRow = {
  id: string;
  label: string;
  foto?: ServiceItem;
  video?: ServiceItem;
  drone?: ServiceItem;
  omuz?: ServiceItem;
  klip?: ServiceItem;
};

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-8">
      <p className="text-[10px] font-semibold tracking-[0.35em] text-rm-champagne uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-editorial text-[clamp(1.75rem,4vw,2.5rem)] leading-tight text-rm-off-white">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-rm-gray-400">
          {subtitle}
        </p>
      )}
    </header>
  );
}

function MediaOption({
  service,
  type,
  active,
  isGift,
  onClick,
}: {
  service: ServiceItem;
  type: "foto" | "video" | "drone" | "omuz";
  active: boolean;
  isGift?: boolean;
  onClick: () => void;
}) {
  const Icon =
    type === "foto" ? Camera : type === "omuz" ? Video : type === "video" ? Film : Plane;
  const title =
    type === "foto"
      ? "Fotoğraf"
      : type === "drone"
        ? "Drone"
        : type === "omuz"
          ? "Omuz Kamera"
          : service.name;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group relative flex flex-col rounded-sm border p-4 text-left transition-all duration-300 sm:p-5",
        active
          ? "border-rm-champagne/45 bg-rm-champagne/[0.08] shadow-[0_0_32px_rgba(196,160,82,0.08)]"
          : "border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border transition-colors",
            active
              ? "border-rm-champagne/40 bg-rm-champagne/15 text-rm-champagne"
              : "border-white/10 bg-white/[0.03] text-rm-gray-500 group-hover:text-rm-gray-300"
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.25} />
        </div>
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
            active
              ? "border-rm-champagne bg-rm-champagne text-rm-black"
              : "border-white/20 bg-transparent"
          )}
        >
          {active && <Check className="h-3 w-3" strokeWidth={2.5} />}
        </span>
      </div>
      <p className="mt-4 text-sm font-medium leading-snug text-rm-off-white">{title}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-rm-gray-400">
        {service.description}
      </p>
      {isGift && active ? (
        <div className="mt-4">
          <p className="font-display text-xl text-emerald-400/90">Ücretsiz</p>
          <p className="text-xs text-rm-gray-500 line-through">
            {formatPrice(service.price)}
          </p>
        </div>
      ) : (
        <p className="mt-4 font-display text-xl tabular-nums text-rm-champagne">
          {formatPrice(service.price)}
        </p>
      )}
    </button>
  );
}

function KlipOption({
  service,
  active,
  isCampaignPrice,
  campaignEligible,
  onClick,
}: {
  service: ServiceItem;
  active: boolean;
  isCampaignPrice: boolean;
  campaignEligible: boolean;
  onClick: () => void;
}) {
  const list = Number(service.price) || CAMPAIGN_KLIP_LIST_PRICE;
  const promo = Number(service.campaignPrice) || CAMPAIGN_KLIP_PRICE;
  const campaignLive = campaignEligible && (isCampaignPrice || !active);
  const showHeroPrice = campaignEligible && !active;
  const showActiveCampaign = active && isCampaignPrice;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative col-span-full flex flex-col rounded-sm border p-4 text-left transition-all sm:p-5",
        showHeroPrice &&
          "border-2 border-emerald-400/70 bg-gradient-to-br from-emerald-500/25 via-emerald-500/10 to-rm-champagne/5 shadow-[0_0_48px_rgba(52,211,153,0.22)] ring-2 ring-emerald-400/35",
        showActiveCampaign &&
          "border-2 border-emerald-500/60 bg-gradient-to-br from-emerald-500/20 to-rm-champagne/10 shadow-[0_0_32px_rgba(52,211,153,0.18)]",
        !campaignLive &&
          (active
            ? "border-rm-champagne/50 bg-rm-champagne/10"
            : "border-rm-champagne/25 bg-rm-champagne/5 hover:border-rm-champagne/40")
      )}
    >
      {campaignEligible && (
        <span className="absolute -top-2.5 right-4 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold tracking-wide text-rm-black uppercase shadow-lg shadow-emerald-500/30">
          Foto + video → 3.500₺
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border",
            campaignEligible
              ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-300"
              : "border-rm-champagne/35 bg-rm-champagne/15 text-rm-champagne"
          )}
        >
          <Film className="h-4 w-4" strokeWidth={1.25} />
        </div>
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
            active
              ? "border-rm-champagne bg-rm-champagne text-rm-black"
              : "border-white/20 bg-transparent"
          )}
        >
          {active && <Check className="h-3 w-3" strokeWidth={2.5} />}
        </span>
      </div>

      <p className="mt-3 text-sm font-semibold text-rm-off-white">{service.name}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-rm-gray-400">
        {service.description}
      </p>

      {showHeroPrice && (
        <div
          className="mt-4 rounded-md border-2 border-emerald-400/50 bg-emerald-500/15 px-4 py-3"
          role="status"
        >
          <p className="text-sm font-bold text-emerald-200">
            Kampanya aktif — otomatik {formatPrice(promo)}
          </p>
          <p className="mt-1 text-xs text-emerald-300/90">
            Fotoğraf + video seçtiniz. Bu klip{" "}
            <strong className="text-emerald-200">{formatPrice(promo)}</strong>
            &apos;ye düştü ({formatPrice(list)} yerine).
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <span className="font-display text-[clamp(2rem,6vw,2.75rem)] leading-none font-medium tabular-nums text-emerald-300">
              {formatPrice(promo)}
            </span>
            <span className="pb-1 font-display text-xl text-rm-gray-500 line-through">
              {formatPrice(list)}
            </span>
            <span className="mb-1 rounded-sm bg-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-100 uppercase">
              {formatPrice(CAMPAIGN_KLIP_SAVINGS)} tasarruf
            </span>
          </div>
          <p className="mt-3 text-xs font-semibold text-emerald-200/95">
            Tıklayın — sepete kampanya fiyatıyla eklenir
          </p>
        </div>
      )}

      {showActiveCampaign && (
        <p className="mt-3 rounded-md border-2 border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-200">
          ✓ {formatPrice(promo)} kampanya fiyatı — sepette görünür
        </p>
      )}

      {active && campaignEligible && !isCampaignPrice && (
        <p className="mt-2 animate-pulse text-xs font-medium text-emerald-300">
          Kampanya fiyatı uygulanıyor…
        </p>
      )}

      {!showHeroPrice && (
        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          {showActiveCampaign ? (
            <>
              <span className="font-display text-2xl tabular-nums text-emerald-300">
                {formatPrice(promo)}
              </span>
              <span className="text-sm text-rm-gray-500 line-through">
                {formatPrice(list)}
              </span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase">
                Kampanya
              </span>
            </>
          ) : (
            <span className="font-display text-xl tabular-nums text-rm-champagne">
              {formatPrice(list)}
            </span>
          )}
        </div>
      )}

      {service.upsellHint && !showHeroPrice && (
        <p className="mt-2 text-[11px] text-rm-champagne/80">{service.upsellHint}</p>
      )}
    </button>
  );
}

function OccasionAccordion({
  row,
  open,
  onOpenChange,
  selectedIds,
  campaignPricedIds,
  klipCampaignEligible,
  droneGiftEligible,
  onToggle,
  onAddCampaignKlip,
}: {
  row: OccasionRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  campaignPricedIds: string[];
  klipCampaignEligible: boolean;
  droneGiftEligible: boolean;
  onToggle: (id: string, name: string) => void;
  onAddCampaignKlip: (id: string, occasionId: string) => void;
}) {
  const fotoOn = row.foto ? selectedIds.includes(row.foto.id) : false;
  const videoOn = row.video ? selectedIds.includes(row.video.id) : false;
  const droneOn = row.drone ? selectedIds.includes(row.drone.id) : false;
  const droneIsGift =
    droneGiftEligible && row.drone?.id === DRONE_GIFT_SERVICE_ID && droneOn;
  const klipOn = row.klip ? selectedIds.includes(row.klip.id) : false;
  const klipCampaign =
    row.klip != null && campaignPricedIds.includes(row.klip.id);
  const omuzOn = row.omuz ? selectedIds.includes(row.omuz.id) : false;
  const active = fotoOn || videoOn || droneOn || omuzOn || klipOn;
  /** Sinematik klip varsa ayrı “video klip” kartı gösterilmez — aynı hizmet */
  const showStandardVideo = Boolean(row.video) && !row.klip;
  const colCount = [row.foto, showStandardVideo ? row.video : undefined, row.drone, row.omuz].filter(
    Boolean
  ).length;
  const hasOmuz = Boolean(row.omuz);

  return (
    <article
      id={`occasion-${row.id}`}
      className={cn(
        "scroll-mt-32 rounded-sm border transition-colors",
        active
          ? "border-rm-champagne/25 bg-white/[0.03]"
          : "border-white/[0.08] bg-rm-black-elevated/50"
      )}
    >
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left md:px-6 md:py-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl text-rm-off-white md:text-2xl">
              {row.label}
            </h3>
            {active && (
              <span className="text-[10px] font-medium tracking-[0.2em] text-rm-champagne uppercase">
                Seçildi
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-rm-gray-500">
            {open
              ? row.klip
                ? hasOmuz
                  ? "Fotoğraf, sinematik klip, drone ve omuz kamera ayrı seçilebilir"
                  : "Fotoğraf, sinematik klip ve drone ayrı seçilebilir"
                : hasOmuz
                  ? "Fotoğraf, video, drone ve omuz kamera ayrı seçilebilir"
                  : "Fotoğraf, video ve drone ayrı ayrı seçilebilir"
              : "Açmak için tıklayın"}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-rm-gray-400 transition-transform duration-300",
            open && "rotate-180 text-rm-champagne"
          )}
          strokeWidth={1.5}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/[0.06] px-5 pb-5 md:px-6 md:pb-6">
            <div
              className={cn(
                "grid gap-3 pt-4",
                colCount >= 4
                  ? "sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4"
                  : colCount >= 3
                    ? "sm:grid-cols-2 lg:grid-cols-3"
                    : colCount === 2
                      ? "sm:grid-cols-2"
                      : "grid-cols-1"
              )}
            >
              {row.foto && (
                <MediaOption
                  type="foto"
                  service={row.foto}
                  active={fotoOn}
                  onClick={() => onToggle(row.foto!.id, row.foto!.name)}
                />
              )}
              {showStandardVideo && row.video && (
                <MediaOption
                  type="video"
                  service={row.video}
                  active={videoOn}
                  onClick={() => onToggle(row.video!.id, row.video!.name)}
                />
              )}
              {row.drone && (
                <MediaOption
                  type="drone"
                  service={row.drone}
                  active={droneOn}
                  isGift={droneIsGift}
                  onClick={() => onToggle(row.drone!.id, row.drone!.name)}
                />
              )}
              {row.omuz && (
                <MediaOption
                  type="omuz"
                  service={row.omuz}
                  active={omuzOn}
                  onClick={() => onToggle(row.omuz!.id, row.omuz!.name)}
                />
              )}
              {row.klip && (
                <KlipOption
                  service={row.klip}
                  active={klipOn}
                  isCampaignPrice={klipCampaign}
                  campaignEligible={klipCampaignEligible}
                  onClick={() => {
                    if (klipOn) {
                      onToggle(row.klip!.id, row.klip!.name);
                      return;
                    }
                    if (
                      klipCampaignEligible &&
                      row.klip!.campaignPrice != null &&
                      row.klip!.campaignPrice > 0
                    ) {
                      onAddCampaignKlip(row.klip!.id, row.id);
                    } else {
                      onToggle(row.klip!.id, row.klip!.name);
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function CollapsibleBlock({
  id,
  title,
  subtitle,
  open,
  onOpenChange,
  active,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        className={cn(
          "mb-4 flex w-full items-end justify-between gap-3 rounded-sm border px-5 py-4 text-left transition-colors md:px-6",
          active
            ? "border-rm-champagne/25 bg-white/[0.03]"
            : "border-white/[0.08] bg-rm-black-elevated/40 hover:border-white/15"
        )}
      >
        <div>
          <p className="text-[10px] font-semibold tracking-[0.35em] text-rm-champagne uppercase">
            Baskı
          </p>
          <h2 className="mt-2 font-editorial text-[clamp(1.5rem,3.5vw,2rem)] leading-tight text-rm-off-white">
            {title}
          </h2>
          <p className="mt-2 text-sm text-rm-gray-400">{subtitle}</p>
        </div>
        <ChevronDown
          className={cn(
            "mb-1 h-5 w-5 shrink-0 text-rm-gray-400 transition-transform duration-300",
            open && "rotate-180 text-rm-champagne"
          )}
          strokeWidth={1.5}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </section>
  );
}

function ProductRow({
  service,
  selected,
  onToggle,
  icon: Icon,
  priceLabel,
  children,
}: {
  service: ServiceItem;
  selected: boolean;
  onToggle: () => void;
  icon: typeof BookImage;
  priceLabel?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "border-b border-white/[0.06] last:border-b-0",
        selected && "bg-rm-champagne/[0.04]"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-4 px-5 py-5 text-left transition-colors hover:bg-white/[0.02] md:px-6"
      >
        <span
          className={cn(
            "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
            selected ? "border-rm-champagne bg-rm-champagne" : "border-white/20"
          )}
        >
          {selected && <Check className="h-3 w-3 text-rm-black" strokeWidth={2.5} />}
        </span>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border",
            selected
              ? "border-rm-champagne/35 bg-rm-champagne/12 text-rm-champagne"
              : "border-white/10 bg-white/[0.03] text-rm-gray-500"
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.25} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg text-rm-off-white">{service.name}</p>
          {service.description && (
            <p className="mt-1.5 text-sm leading-relaxed text-rm-gray-400">
              {service.description}
            </p>
          )}
          {service.upsellHint && (
            <p className="mt-2 text-xs text-rm-champagne/80">{service.upsellHint}</p>
          )}
        </div>
        <div className="shrink-0 pt-1 text-right">
          {priceLabel ?? (
            <span className="font-display text-xl tabular-nums text-rm-champagne">
              {formatPrice(service.price)}
            </span>
          )}
        </div>
      </button>
      {children}
    </div>
  );
}

function BuyukAlbumBlock({
  service,
  selected,
  pages,
  onToggle,
  onPagesChange,
}: {
  service: ServiceItem;
  selected: boolean;
  pages: number;
  onToggle: () => void;
  onPagesChange: (pages: number) => void;
}) {
  const options = service.pageOptions ?? [10, 20];

  return (
    <ProductRow
      service={service}
      selected={selected}
      onToggle={onToggle}
      icon={BookImage}
      priceLabel={
        <span className="font-display text-xl tabular-nums text-rm-champagne">
          {formatPrice(lineTotalFor(service, 1, selected ? pages : 10))}
        </span>
      }
    >
      {selected && (
        <div className="border-t border-white/[0.06] px-5 pb-5 md:px-6">
          <p className="mb-3 text-[10px] font-medium tracking-[0.2em] text-rm-gray-500 uppercase">
            Yaprak · sayfa
          </p>
          <div className="grid grid-cols-2 gap-2">
            {options.map((p) => {
              const pageCount = p as BuyukAlbumPages;
              const price = lineTotalFor(service, 1, p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPagesChange(p)}
                  className={cn(
                    "rounded-sm border px-4 py-3 text-left transition-all",
                    pages === p
                      ? "border-rm-champagne/50 bg-rm-champagne/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  )}
                >
                  <span className="text-sm font-medium leading-snug text-rm-off-white">
                    {buyukAlbumPageOptionLabel(pageCount)}
                  </span>
                  {p === 20 && (
                    <span className="ml-2 text-[10px] text-rm-champagne">+50%</span>
                  )}
                  <p className="mt-1 text-sm tabular-nums text-rm-champagne">
                    {formatPrice(price)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </ProductRow>
  );
}

const DEFAULT_OPEN_OCCASIONS = new Set(["dis-cekim"]);

export function ServiceGrid() {
  const services = usePackageStore((s) => s.services);
  const selectedIds = usePackageStore((s) => s.selectedIds);
  const campaignPricedIds = usePackageStore((s) => s.campaignPricedIds);
  const quantities = usePackageStore((s) => s.serviceQuantities);
  const servicePages = usePackageStore((s) => s.servicePages);
  const toggleService = usePackageStore((s) => s.toggleService);
  const addCampaignKlip = usePackageStore((s) => s.addCampaignKlip);
  const setServiceQuantity = usePackageStore((s) => s.setServiceQuantity);
  const setServicePages = usePackageStore((s) => s.setServicePages);

  const handleAddCampaignKlip = (id: string, occasionId: string) => {
    addCampaignKlip(id);
    setOpenOccasions((prev) => new Set([...prev, occasionId]));
    dispatchExpandPackageSection({
      scrollTarget: "occasion",
      scrollId: occasionId,
    });
  };

  const [openOccasions, setOpenOccasions] = useState<Set<string>>(
    () => new Set(DEFAULT_OPEN_OCCASIONS)
  );
  const [albumsOpen, setAlbumsOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ scrollTarget?: string; scrollId?: string }>)
        .detail;
      if (!detail?.scrollId) return;
      if (detail.scrollTarget === "albums" || detail.scrollId === "albums") {
        setAlbumsOpen(true);
        requestAnimationFrame(() => {
          document.getElementById("section-albums")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
        return;
      }
      setOpenOccasions((prev) => new Set([...prev, detail.scrollId!]));
      requestAnimationFrame(() => {
        document.getElementById(`occasion-${detail.scrollId}`)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    };
    window.addEventListener(PACKAGE_EXPAND_OCCASION_EVENT, handler);
    return () => window.removeEventListener(PACKAGE_EXPAND_OCCASION_EVENT, handler);
  }, []);

  const droneGiftEligible = qualifiesForDroneGift(
    services,
    selectedIds,
    quantities
  );

  const klipCampaignEligible = qualifiesForKlipCampaign(
    services,
    selectedIds,
    quantities
  );

  const { occasions, albums, buyukAlbum, aile } = useMemo(() => {
    const byId = new Map(services.map((s) => [s.id, s]));

    const klipFor = (occasionId: string) => {
      if (occasionId === "gelin-alma") return byId.get(KLIP_GELIN_ALMA_ID);
      if (occasionId === "salon") return byId.get(KLIP_SALON_GIRIS_ID);
      if (occasionId === "kuafor-hazirlik") return byId.get(KLIP_KUAFOR_HAZIRLIK_ID);
      return undefined;
    };

    const occasionRows: OccasionRow[] = OCCASIONS.map((o) => ({
      id: o.id,
      label: o.label,
      foto: byId.get(`foto-${o.id}`),
      video: byId.get(`video-${o.id}`),
      drone: byId.get(`drone-${o.id}`),
      omuz: o.id === "dis-cekim" ? undefined : byId.get(`omuz-${o.id}`),
      klip: klipFor(o.id),
    })).filter((r) => r.foto || r.video || r.drone || r.omuz || r.klip);

    const albums = services.filter(
      (s) =>
        s.category === "album" &&
        s.pricingType !== "quantity" &&
        s.pricingType !== "pages"
    );
    const buyukAlbum = services.find((s) => s.pricingType === "pages");
    const aile = services.find((s) => s.id === "aile-albumu");
    return { occasions: occasionRows, albums, buyukAlbum, aile };
  }, [services]);

  const toggle = (id: string, name: string) => {
    const adding = !selectedIds.includes(id);
    toggleService(id);
    if (adding) {
      const svc = services.find((s) => s.id === id);
      const price = svc ? lineTotalFor(svc, 1) : 0;
      trackMetaEvent("AddToCart", {
        content_name: name,
        content_ids: id,
        value: price,
        num_items: 1,
      });
      trackMetaEvent("PackageBuild", { content_name: name });
    }
  };

  const albumIcon = (id: string) => {
    if (id.startsWith("canvas")) return Frame;
    if (id === "aile-albumu") return BookOpen;
    return BookImage;
  };

  const aileUnit = aile ? Number(aile.unitPrice) || 0 : 0;
  const aileQty = aile ? (quantities[aile.id] ?? 0) : 0;
  const buyukSelected = canAddAileAlbum(selectedIds, services);

  return (
    <div className="space-y-16">
      <section>
        <SectionTitle
          eyebrow="Çekimler"
          title="Etkinlikleriniz"
          subtitle="Her etkinlik için fotoğraf, video ve isteğe bağlı drone seçin. Dış çekimde foto+video+albüm ile dış çekim drone hediye."
        />
        <div className="space-y-3">
          {occasions.map((row) => (
            <OccasionAccordion
              key={row.id}
              row={row}
              open={openOccasions.has(row.id)}
              onOpenChange={(next) =>
                setOpenOccasions((prev) => {
                  const s = new Set(prev);
                  if (next) s.add(row.id);
                  else s.delete(row.id);
                  return s;
                })
              }
              selectedIds={selectedIds}
              campaignPricedIds={campaignPricedIds}
              klipCampaignEligible={klipCampaignEligible}
              droneGiftEligible={droneGiftEligible}
              onToggle={toggle}
              onAddCampaignKlip={handleAddCampaignKlip}
            />
          ))}
        </div>
      </section>

      {(albums.length > 0 || buyukAlbum || aile) && (
        <CollapsibleBlock
          id="section-albums"
          title="Albüm & tablolar"
          subtitle="Albüm boyutu, sayfa adedi ve canvas baskılar — açarak seçin."
          open={albumsOpen}
          onOpenChange={setAlbumsOpen}
          active={
            (buyukAlbum && selectedIds.includes(buyukAlbum.id)) ||
            albums.some((s) => selectedIds.includes(s.id)) ||
            (aile ? (quantities[aile.id] ?? 0) > 0 : false)
          }
        >
          <div className="overflow-hidden rounded-sm border border-white/[0.08] bg-rm-black-elevated/40">
            {buyukAlbum && (
              <BuyukAlbumBlock
                service={buyukAlbum}
                selected={selectedIds.includes(buyukAlbum.id)}
                pages={servicePages[buyukAlbum.id] ?? 10}
                onToggle={() => toggle(buyukAlbum.id, buyukAlbum.name)}
                onPagesChange={(p) => setServicePages(buyukAlbum.id, p)}
              />
            )}
            {albums.map((s) => (
              <ProductRow
                key={s.id}
                service={s}
                selected={selectedIds.includes(s.id)}
                onToggle={() => toggle(s.id, s.name)}
                icon={albumIcon(s.id)}
              />
            ))}
            {aile && (
              <div
                className={cn(
                  "border-t border-white/[0.06] px-5 py-5 md:px-6",
                  aileQty > 0 && "bg-rm-champagne/[0.04]",
                  !buyukSelected && "opacity-90"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-white/10 bg-white/[0.03] text-rm-gray-500">
                      <BookOpen className="h-5 w-5" strokeWidth={1.25} />
                    </div>
                    <div>
                      <p className="font-display text-lg text-rm-off-white">
                        {aile.name}
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-rm-gray-400">
                        {aile.description}
                      </p>
                      {!buyukSelected && (
                        <p className="mt-2 rounded-sm border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-200/90">
                          Önce büyük albümü seçin — aile albümü büyük albümle birlikte
                          eklenir.
                        </p>
                      )}
                      <p className="mt-2 text-xs text-rm-gray-500">
                        Adet başına {formatPrice(aileUnit)}
                      </p>
                    </div>
                  </div>
                  {aileQty > 0 && (
                    <p className="font-display text-xl tabular-nums text-rm-champagne">
                      {formatPrice(aileUnit * aileQty)}
                    </p>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {([0, 1, 2] as const).map((q) => (
                    <button
                      key={q}
                      type="button"
                      disabled={!buyukSelected && q > 0}
                      onClick={() => setServiceQuantity(aile.id, q)}
                      className={cn(
                        "rounded-sm border py-2.5 text-xs font-medium transition-all",
                        !buyukSelected && q > 0 && "cursor-not-allowed opacity-40",
                        aileQty === q
                          ? "border-rm-champagne/50 bg-rm-champagne/10 text-rm-off-white"
                          : "border-white/10 text-rm-gray-400 hover:border-white/20 hover:text-rm-off-white"
                      )}
                    >
                      {q === 0 ? "İstemiyorum" : `${q} adet`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleBlock>
      )}

    </div>
  );
}
