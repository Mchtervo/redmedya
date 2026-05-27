"use client";

import dynamic from "next/dynamic";

const CampaignWelcomeModal = dynamic(
  () =>
    import("@/components/package/campaign-welcome-modal").then((m) => ({
      default: m.CampaignWelcomeModal,
    })),
  { ssr: false }
);

/** Ana sayfa: hoş geldin kampanya modalı (intro sonrası) */
export function HomePageExtras() {
  return <CampaignWelcomeModal mode="home" openDelayMs={2400} />;
}
