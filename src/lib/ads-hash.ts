import { createHash } from "crypto";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Meta / Google — normalize then SHA-256 */
export function hashEmail(email: string): string | undefined {
  const v = email.trim().toLowerCase();
  if (!v || !v.includes("@")) return undefined;
  return sha256(v);
}

/** TR telefon → 90XXXXXXXXXX */
export function normalizePhoneE164(phone: string): string | undefined {
  let d = phone.replace(/\D/g, "");
  if (d.length < 10) return undefined;
  if (d.startsWith("0")) d = `90${d.slice(1)}`;
  else if (!d.startsWith("90")) d = `90${d}`;
  return d;
}

export function hashPhone(phone: string): string | undefined {
  const normalized = normalizePhoneE164(phone);
  if (!normalized) return undefined;
  return sha256(normalized);
}

export function hashName(name: string): string | undefined {
  const v = name.trim().toLowerCase();
  if (!v) return undefined;
  return sha256(v);
}
