"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, LogIn, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminLoginButtonProps = {
  light?: boolean;
  className?: string;
};

export function AdminLoginButton({
  light = false,
  className,
}: AdminLoginButtonProps) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const checkSession = useCallback(() => {
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((d) => setAuthenticated(Boolean(d.authenticated)))
      .catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (window.innerWidth < 1024) return;
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    setUsername("");
    setPassword("");
    setError("");
  }, [open]);

  useEffect(() => {
    if (!open || window.innerWidth >= 1024) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError("Kullanıcı adı veya şifre hatalı");
        return;
      }
      setAuthenticated(true);
      setOpen(false);
      setUsername("");
      setPassword("");
      router.push("/admin?tab=overview");
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = cn(
    "mt-1 w-full rounded-sm border px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-rm-champagne/40",
    "border-white/10 bg-white/5 text-rm-off-white placeholder:text-rm-gray-500",
    light &&
      "lg:border-black/10 lg:bg-rm-cream lg:text-rm-black lg:placeholder:text-rm-gray-500"
  );

  if (authenticated) {
    return (
      <Link
        href="/admin"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold tracking-wide uppercase transition-colors",
          light
            ? "border-rm-champagne/40 text-rm-black hover:bg-rm-champagne/10"
            : "border-white/30 text-white hover:bg-white/10",
          className
        )}
      >
        Giriş
      </Link>
    );
  }

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-semibold tracking-wide uppercase transition-colors",
          light
            ? "border-black/15 text-rm-gray-600 hover:border-rm-champagne/40 hover:text-rm-black"
            : "border-white/30 text-white hover:border-white/50"
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Giriş"
      >
        <Lock className="h-3.5 w-3.5 shrink-0" />
        <span>Giriş</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Kapat"
            className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Giriş"
            className={cn(
              "fixed top-1/2 left-1/2 z-[81] w-[min(calc(100vw-2rem),380px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-rm-black-elevated p-6 text-rm-off-white shadow-2xl",
              "lg:absolute lg:top-full lg:right-0 lg:left-auto lg:mt-2 lg:w-[min(100vw-2rem,320px)] lg:translate-x-0 lg:translate-y-0 lg:rounded-sm lg:p-5",
              light && "lg:border-black/10 lg:bg-white lg:text-rm-black"
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-rm-gray-400 hover:bg-white/10 lg:hidden"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>

            <p
              className={cn(
                "font-display text-lg text-rm-off-white",
                light && "lg:text-rm-black"
              )}
            >
              Giriş
            </p>
            <p
              className={cn(
                "mt-1 text-xs text-rm-gray-400",
                light && "lg:text-rm-gray-500"
              )}
            >
              Giriş yaptıktan sonra admin panele yönlendirilirsiniz.
            </p>

            <form
              onSubmit={handleLogin}
              className="mt-4 space-y-3"
              autoComplete="off"
            >
              <label
                className={cn(
                  "block text-xs text-rm-gray-400",
                  light && "lg:text-rm-gray-500"
                )}
              >
                Kullanıcı adı
                <input
                  name="rm-admin-user"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder="Kullanıcı adınızı yazın"
                  readOnly
                  onFocus={(e) => e.currentTarget.removeAttribute("readOnly")}
                  className={inputClass}
                />
              </label>
              <label
                className={cn(
                  "block text-xs text-rm-gray-400",
                  light && "lg:text-rm-gray-500"
                )}
              >
                Şifre
                <input
                  type="password"
                  name="rm-admin-pass"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Şifrenizi yazın"
                  readOnly
                  onFocus={(e) => e.currentTarget.removeAttribute("readOnly")}
                  className={inputClass}
                />
              </label>
              {error && (
                <p
                  className={cn("text-xs text-red-400", light && "lg:text-red-500")}
                  role="alert"
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-sm bg-rm-champagne py-3 text-xs font-bold tracking-wide text-rm-black uppercase disabled:opacity-60 lg:py-2.5"
              >
                <LogIn className="h-4 w-4" />
                {loading ? "Giriş…" : "Giriş yap"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
