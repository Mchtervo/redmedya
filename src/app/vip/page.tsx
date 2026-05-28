import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "VIP Çift Paneli",
  robots: { index: false, follow: false },
};

export default function VipPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-rm-black px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-rm-champagne/[0.06] blur-3xl"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-white/8 bg-rm-black-elevated/60 p-10 backdrop-blur-xl">
        <p className="text-[10px] font-semibold tracking-[0.4em] text-rm-champagne uppercase">
          VIP Panel
        </p>
        <h1 className="mt-4 font-editorial text-3xl text-rm-off-white md:text-4xl">
          Çift Teslim Paneli
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-rm-gray-400">
          Fotoğraf görüntüleme, dosya indirme ve teslim takibi — auth entegrasyonu
          sonraki fazda aktif olacak.
        </p>
        <Button asChild className="mt-8 rounded-full" variant="outline">
          <Link href="/">← Ana sayfaya dön</Link>
        </Button>
      </div>
    </div>
  );
}
