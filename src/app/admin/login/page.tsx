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
    <div className="flex min-h-screen items-center justify-center bg-rm-black px-4">
      <div className="w-full max-w-md rounded-sm border border-white/10 bg-rm-black-elevated p-8">
        <Link href="/" className="text-xs tracking-wider text-rm-champagne hover:opacity-80">
          ← Siteye dön
        </Link>
        <h1 className="mt-6 font-display text-2xl text-rm-off-white">Admin girişi</h1>
        <p className="mt-2 text-sm text-rm-gray-400">
          Yalnızca yetkili kullanıcılar.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4" autoComplete="off">
          <Input
            type="text"
            name="rm-admin-user"
            placeholder="Kullanıcı adınızı yazın"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            readOnly
            onFocus={(e) => e.currentTarget.removeAttribute("readOnly")}
            className="border-white/15 bg-white/5 placeholder:text-rm-gray-500"
          />
          <Input
            type="password"
            name="rm-admin-pass"
            placeholder="Şifrenizi yazın"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            readOnly
            onFocus={(e) => e.currentTarget.removeAttribute("readOnly")}
            className="border-white/15 bg-white/5 placeholder:text-rm-gray-500"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Giriş yapılıyor…" : "Giriş yap"}
          </Button>
        </form>
        <p className="mt-6 text-[10px] text-rm-gray-500">
          Üretimde <code className="text-rm-gray-400">ADMIN_USERNAME</code> ve{" "}
          <code className="text-rm-gray-400">ADMIN_PASSWORD</code> tanımlayın.
        </p>
      </div>
    </div>
  );
}
