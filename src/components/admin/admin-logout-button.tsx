"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function AdminLogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={logout}
      className="inline-flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-[11px] font-bold tracking-[0.2em] text-rm-gray-400 uppercase transition-all hover:border-red-500/35 hover:bg-red-500/10 hover:text-red-300"
    >
      <LogOut className="h-3.5 w-3.5" strokeWidth={1.7} />
      Çıkış yap
    </button>
  );
}
