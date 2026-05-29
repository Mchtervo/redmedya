"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

type Props = {
  /** Sadece ikon (mobile header gibi dar yerler için). */
  compact?: boolean;
};

export function AdminLogoutButton({ compact = false }: Props) {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={logout}
        aria-label="Çıkış yap"
        title="Çıkış yap"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-rm-gray-400 transition-all hover:border-red-500/35 hover:bg-red-500/10 hover:text-red-300"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.7} />
      </button>
    );
  }

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
