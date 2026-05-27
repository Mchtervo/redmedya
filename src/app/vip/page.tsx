import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "VIP Çift Paneli",
  robots: { index: false, follow: false },
};

export default function VipPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-rm-black px-6 text-center">
      <p className="text-xs tracking-[0.3em] text-rm-champagne uppercase">VIP Panel</p>
      <h1 className="mt-4 font-[family-name:var(--font-cormorant)] text-4xl text-rm-off-white">
        Çift Teslim Paneli
      </h1>
      <p className="mt-4 max-w-md text-sm text-rm-gray-400">
        Fotoğraf görüntüleme, dosya indirme ve teslim takibi — auth entegrasyonu
        sonraki fazda aktif olacak.
      </p>
      <Button asChild className="mt-8" variant="outline">
        <Link href="/">Ana Sayfaya Dön</Link>
      </Button>
    </div>
  );
}
