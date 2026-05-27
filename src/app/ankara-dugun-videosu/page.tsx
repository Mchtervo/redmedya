import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { ANKARA_SEO_KEYWORDS } from "@/config/seo-keywords";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";

export const metadata: Metadata = {
  title: "Ankara Düğün Videosu — Sinematik Klip",
  description:
    "Ankara düğün videosu ve sinematik klip çekimi: dış çekim, gelin alma, salon girişi, kına. REDMEDYA paket oluşturucu ile canlı fiyat.",
  keywords: ["ankara düğün videosu", "düğün klibi ankara", ...ANKARA_SEO_KEYWORDS],
  alternates: { canonical: `${siteConfig.url}/ankara-dugun-videosu` },
};

export default function AnkaraDugunVideosuPage() {
  return (
    <SeoLandingPage
      eyebrow="Düğün videosu · Ankara"
      h1="Ankara düğün videosu — etkinlik bazlı sinematik klipler"
      intro="Her düğün etkinliği için ayrı sinematik klip: dış çekimde standart video, gelin alma ve salonda özel kampanya klipleri. 4K kurgu, müzik ve renk düzenlemesi dahil."
      bullets={[
        "Dış çekim video — 5.000₺",
        "Salon girişi ve ilk dans klip kampanyası",
        "Drone ve omuz kamera ile tam gün hikâye",
        "%20 paket indirimi otomatik hesaplanır",
      ]}
      faq={[
        {
          q: "Ham görüntü veriyor musunuz?",
          a: "Omuz kamera paketinde ham ve kurgulu teslim seçenekleri vardır; etkinlik kartında açıklanır.",
        },
      ]}
    />
  );
}
