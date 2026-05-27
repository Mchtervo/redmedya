import type { Metadata } from "next";
import { PackageBuilderClient } from "./package-builder-client";

export const metadata: Metadata = {
  title: "Paket Oluştur | REDMEDYA.CO",
  description:
    "Kendi düğün paketinizi oluşturun. Hizmetleri seçin, canlı fiyat görün, indirim kazanın ve WhatsApp ile rezervasyon yapın.",
};

export default function PaketOlusturPage() {
  return <PackageBuilderClient />;
}
