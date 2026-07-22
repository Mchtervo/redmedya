import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Gizlilik & KVKK Aydınlatma Metni",
  description:
    "REDMEDYA kişisel verilerin korunması (KVKK) aydınlatma metni ve çerez politikası.",
  alternates: { canonical: `${siteConfig.url}/gizlilik` },
  robots: { index: true, follow: true },
};

export default function GizlilikPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-rm-black pt-24 pb-32 sm:pt-28">
        <div className="section-container max-w-3xl">
          <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/[0.08] p-3 text-xs text-amber-300">
            ⚠️ Bu metin bir TASLAKTIR. Yayına almadan önce bir avukata/danışmana
            onaylatın; şirket unvanı, VERBİS bilgileri ve iletişim kanallarını
            güncelleyin.
          </div>

          <h1 className="font-editorial text-[clamp(1.75rem,5vw,3rem)] text-rm-off-white">
            Gizlilik & KVKK Aydınlatma Metni
          </h1>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-rm-gray-300">
            <section>
              <h2 className="text-base font-semibold text-rm-off-white">
                1. Veri Sorumlusu
              </h2>
              <p className="mt-2">
                REDMEDYA ({siteConfig.address}). İletişim: {siteConfig.email} ·{" "}
                {siteConfig.displayPhone}.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-rm-off-white">
                2. İşlenen Veriler ve Amaç
              </h2>
              <p className="mt-2">
                Paket oluşturucuda teklif oluşturduğunuzda ad, telefon ve düğün
                tarihiniz; rezervasyon talebinizi değerlendirmek ve sizinle iletişime
                geçmek amacıyla işlenir. Bu veriler yalnızca teklif/rezervasyon
                kayıtlarında (leads) tutulur.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-rm-off-white">
                3. Çerezler ve Anonim Analitik
              </h2>
              <p className="mt-2">
                Onayınızla, site kullanımını iyileştirmek için anonim kullanım
                istatistikleri toplanır (hangi adımların kullanıldığı gibi). Bu
                analitik kayıtlarına form alanlarının DEĞERLERİ (ad, telefon, not)
                <strong> asla </strong> dahil edilmez; yalnızca hangi alanın
                doldurulduğu bilgisi tutulur. IP adresi saklanmaz.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-rm-off-white">
                4. Saklama Süreleri
              </h2>
              <p className="mt-2">
                Anonim analitik kayıtları 6 ay, rezervasyon/teklif kayıtları 24 ay
                sonunda silinir veya anonimleştirilir.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-rm-off-white">
                5. Haklarınız (KVKK m.11)
              </h2>
              <p className="mt-2">
                Verilerinize erişme, düzeltme, silme ve işlemeye itiraz etme
                haklarına sahipsiniz. Talepleriniz için {siteConfig.email} adresine
                yazabilirsiniz. Çerez onayınızı istediğiniz zaman geri
                çekebilirsiniz; reddettiğinizde site normal çalışmaya devam eder.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-rm-off-white">
                6. Üçüncü Taraflar
              </h2>
              <p className="mt-2">
                Reklam performansını ölçmek için Meta (Facebook) ve Google analitik
                hizmetleri kullanılabilir. Bu aktarımlar ilgili platformların
                politikalarına tabidir.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
