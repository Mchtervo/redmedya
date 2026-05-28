"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Kullanıcı adı veya şifre hatalı");
      return;
    }
    router.push("/admin?tab=overview");
    router.refresh();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-rm-black px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-rm-champagne/[0.06] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-rm-champagne/[0.04] blur-3xl"
      />

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.25em] text-rm-gray-500 uppercase transition-colors hover:text-rm-champagne"
        >
          ← Siteye dön
        </Link>

        <div className="rounded-2xl border border-white/8 bg-rm-black-elevated/80 p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl md:p-10">
          <div className="text-center">
            <p className="text-[10px] font-semibold tracking-[0.4em] text-rm-champagne uppercase">
              RED MEDYA
            </p>
            <h1 className="mt-3 font-editorial text-3xl text-rm-off-white">
              Yönetim girişi
            </h1>
            <p className="mt-2 text-sm text-rm-gray-400">
              Yalnızca yetkili kullanıcılar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-3.5" autoComplete="off">
            <Input
              type="text"
              name="rm-admin-user"
              placeholder="Kullanıcı adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              readOnly
              onFocus={(e) => e.currentTarget.removeAttribute("readOnly")}
              className="h-12 rounded-xl border-white/10 bg-white/[0.03] px-4 placeholder:text-rm-gray-500"
            />
            <Input
              type="password"
              name="rm-admin-pass"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              readOnly
              onFocus={(e) => e.currentTarget.removeAttribute("readOnly")}
              className="h-12 rounded-xl border-white/10 bg-white/[0.03] px-4 placeholder:text-rm-gray-500"
            />
            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="h-12 w-full rounded-xl"
              disabled={loading}
            >
              {loading ? "Giriş yapılıyor…" : "Giriş yap →"}
            </Button>
          </form>

          <p className="mt-6 text-center text-[10px] text-rm-gray-600">
            Üretimde{" "}
            <code className="text-rm-gray-500">ADMIN_USERNAME</code> ve{" "}
            <code className="text-rm-gray-500">ADMIN_PASSWORD</code> tanımlayın.
          </p>
        </div>
      </div>
    </div>
  );
}
