import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "VIP Çift Paneli",
  robots: { index: false, follow: false },
};

export default function VipPage() {
  return (
    <div className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-rm-black px-4 pb-24 text-center sm:px-6 lg:pb-0">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-rm-champagne/[0.06] blur-3xl"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-white/8 bg-rm-black-elevated/60 p-6 backdrop-blur-xl sm:p-8 md:p-10">
        <p className="text-[10px] font-semibold tracking-[0.32em] text-rm-champagne uppercase sm:tracking-[0.4em]">
          VIP Panel
        </p>
        <h1 className="mt-3 font-editorial text-2xl text-rm-off-white sm:mt-4 sm:text-3xl md:text-4xl">
          Çift Teslim Paneli
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-rm-gray-400 sm:mt-4">
          Fotoğraf görüntüleme, dosya indirme ve teslim takibi — auth entegrasyonu
          sonraki fazda aktif olacak.
        </p>
        <Button asChild className="mt-6 rounded-full sm:mt-8" variant="outline">
          <Link href="/">← Ana sayfaya dön</Link>
        </Button>
      </div>
    </div>
  );
}
