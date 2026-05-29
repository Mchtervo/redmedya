import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const dynamic = "force-static";

/**
 * Public rezervasyon detayı kapatıldı — müşterinin tam adı ve ödeme bilgilerini
 * herkese açık göstermemek için. Müşteriler WhatsApp üzerinden bilgi alır.
 */
export default function ReservationDetailPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-rm-black pt-24 pb-32 sm:pt-28 lg:pb-16">
        <div className="section-container max-w-lg text-center">
          <h1 className="font-editorial text-2xl text-rm-off-white sm:text-3xl">
            Rezervasyon bilgileri
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-rm-gray-400">
            Rezervasyon detayları kişisel verileriniz nedeniyle yalnızca size
            özel olarak WhatsApp üzerinden paylaşılır.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-xs tracking-wide text-rm-champagne uppercase"
          >
            ← Ana sayfa
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
