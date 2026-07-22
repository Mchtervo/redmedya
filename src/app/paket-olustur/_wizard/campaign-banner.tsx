import { COPY } from "@/content/paketOlustur";

/** Sayfa üstü ince kampanya bandı (sahte geri sayım YOK — sadece son tarih). */
export function CampaignBanner() {
  return (
    <div className="rm-glow-pulse border-b border-rm-champagne/20 bg-gradient-to-r from-rm-champagne/[0.08] via-rm-champagne/[0.12] to-rm-champagne/[0.08]">
      <p className="section-container py-2 text-center text-[11px] font-medium tracking-wide text-rm-champagne sm:text-xs">
        {COPY.campaignBanner}
      </p>
    </div>
  );
}
