"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminLoginButtonProps = {
  light?: boolean;
};

export function AdminLoginButton({ light = false }: AdminLoginButtonProps) {
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
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (open) {
      setUsername("");
      setPassword("");
      setError("");
    }
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

  if (authenticated) {
    return (
      <Link
        href="/admin"
        className={cn(
          "hidden px-4 py-2 text-xs font-bold tracking-wide uppercase transition-colors sm:inline-block",
          light
            ? "border border-rm-champagne/40 text-rm-black hover:bg-rm-champagne/10"
            : "border border-white/30 text-white hover:bg-white/10"
        )}
      >
        Giriş
      </Link>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold tracking-wide uppercase transition-colors",
          light
            ? "border-black/10 text-rm-gray-500 hover:border-rm-champagne/40 hover:text-rm-black"
            : "border-white/25 text-white/90 hover:border-white/50"
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Lock className="h-3.5 w-3.5" />
        <span>Giriş</span>
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full right-0 z-[55] mt-2 w-[min(100vw-2rem,320px)] rounded-sm border p-5 shadow-2xl",
            light
              ? "border-black/10 bg-white text-rm-black"
              : "border-white/15 bg-rm-black-elevated text-rm-off-white"
          )}
          role="dialog"
          aria-label="Admin girişi"
        >
          <p className="font-display text-lg">Admin girişi</p>
          <p className="mt-1 text-xs text-rm-gray-500">
            Giriş yaptıktan sonra admin panele yönlendirilirsiniz.
          </p>
          <form
            onSubmit={handleLogin}
            className="mt-4 space-y-3"
            autoComplete="off"
          >
            <label className="block text-xs text-rm-gray-500">
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
                className={cn(
                  "mt-1 w-full rounded-sm border px-3 py-2 text-sm placeholder:text-rm-gray-500 focus:outline-none focus:ring-1 focus:ring-rm-champagne/40",
                  light
                    ? "border-black/10 bg-rm-cream text-rm-black"
                    : "border-white/10 bg-white/5 text-rm-off-white"
                )}
              />
            </label>
            <label className="block text-xs text-rm-gray-500">
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
                className={cn(
                  "mt-1 w-full rounded-sm border px-3 py-2 text-sm placeholder:text-rm-gray-500 focus:outline-none focus:ring-1 focus:ring-rm-champagne/40",
                  light
                    ? "border-black/10 bg-rm-cream text-rm-black"
                    : "border-white/10 bg-white/5 text-rm-off-white"
                )}
              />
            </label>
            {error && (
              <p className="text-xs text-red-400" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 bg-rm-champagne py-2.5 text-xs font-bold tracking-wide text-rm-black uppercase disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {loading ? "Giriş…" : "Giriş yap"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
