/** Google Analytics 4 — Measurement ID (public) */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA4_ID?.trim() || "G-YXDNEBTFMN";

export type GtagEventParams = Record<
  string,
  string | number | boolean | undefined
>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function canTrack(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(GA_MEASUREMENT_ID) &&
    typeof window.gtag === "function"
  );
}

/** App Router client navigations — manual page_view (send_page_view: false on init) */
export function gtagPageView(
  path: string,
  title?: string
): void {
  if (!canTrack()) return;
  window.gtag!("config", GA_MEASUREMENT_ID, {
    page_path: path,
    page_title: title ?? document.title,
    page_location: window.location.href,
  });
}

export function gtagEvent(
  action: string,
  params?: GtagEventParams
): void {
  if (!canTrack()) return;
  window.gtag!("event", action, {
    currency: "TRY",
    ...params,
  });
}
