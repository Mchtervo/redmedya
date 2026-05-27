/** Kampanya kutusundan ilgili etkinlik bölümünü açmak için */
export const PACKAGE_EXPAND_OCCASION_EVENT = "redmedya-package-expand";

export function dispatchExpandPackageSection(detail: {
  scrollTarget?: "occasion" | "albums";
  scrollId?: string;
}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(PACKAGE_EXPAND_OCCASION_EVENT, { detail })
  );
}
