import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "rm_admin";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  return process.env.ADMIN_PASSWORD || process.env.NEXTAUTH_SECRET || "redmedya-dev-secret";
}

export { COOKIE_NAME };

export function createAdminSessionToken(): string {
  const expires = Date.now() + MAX_AGE_MS;
  const payload = `admin:${expires}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [payload, sig] = decoded.split(".");
    if (!payload || !sig) return false;
    const expected = createHmac("sha256", getSecret()).update(payload).digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    const [, expiresStr] = payload.split(":");
    const expires = Number(expiresStr);
    return Number.isFinite(expires) && Date.now() < expires;
  } catch {
    return false;
  }
}

export function getAdminUsername(): string {
  return process.env.ADMIN_USERNAME || "redmedia0606";
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "redmedia0606";
}

export function verifyAdminPassword(password: string): boolean {
  return safeEqual(password, getAdminPassword());
}

export function verifyAdminCredentials(
  username: string,
  password: string
): boolean {
  return (
    safeEqual(username.trim(), getAdminUsername()) &&
    safeEqual(password, getAdminPassword())
  );
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
