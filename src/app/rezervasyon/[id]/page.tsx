"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { formatPrice } from "@/lib/utils";

type PublicReservation = {
  id: string;
  couple: string;
  weddingDateLabel: string;
  services: { label: string; price: number; isGift?: boolean }[];
  subtotal: number;
  bundleDiscount: number;
  couponDiscount: number;
  total: number;
  depositAmount: number;
  remainingAmount: number;
};

export default function ReservationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<PublicReservation | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/public/reservations/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, [id]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-rm-black pt-28 pb-16">
        <div className="section-container max-w-lg">
          {error && (
            <p className="text-rm-gray-400">Rezervasyon bulunamadı.</p>
          )}
          {data && (
            <>
              <Link
                href="/#yaklasan-dugunler"
                className="text-xs tracking-wide text-rm-champagne uppercase"
              >
                ← Yaklaşan düğünler
              </Link>
              <h1 className="mt-4 font-editorial text-3xl text-rm-off-white">
                {data.couple}
              </h1>
              <p className="mt-2 text-rm-champagne">{data.weddingDateLabel}</p>

              <ul className="mt-8 space-y-2 border-t border-white/10 pt-6">
                {data.services.map((s) => (
                  <li
                    key={s.label}
                    className="flex justify-between text-sm text-rm-gray-300"
                  >
                    <span>{s.label}</span>
                    <span>
                      {s.isGift ? "Hediye" : formatPrice(s.price)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 space-y-2 border-t border-white/10 pt-6 text-sm">
                <div className="flex justify-between text-rm-gray-400">
                  <span>Ara toplam</span>
                  <span>{formatPrice(data.subtotal)}</span>
                </div>
                {data.bundleDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400/90">
                    <span>Paket indirimi</span>
                    <span>−{formatPrice(data.bundleDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-rm-off-white">
                  <span>Paket toplamı</span>
                  <span>{formatPrice(data.total)}</span>
                </div>
                {data.depositAmount > 0 && (
                  <div className="flex justify-between text-emerald-400/90">
                    <span>Kapora</span>
                    <span>−{formatPrice(data.depositAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-display text-rm-champagne">
                  <span>Kalan ödeme</span>
                  <span>{formatPrice(data.remainingAmount)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
