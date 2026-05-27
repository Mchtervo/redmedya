const STORAGE_KEY = "rm-package-session";

export function getPackageSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
