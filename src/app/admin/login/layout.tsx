import type { Metadata } from "next";

// Giriş sayfası "use client" olduğu için metadata burada: Google'da çıkmasın.
export const metadata: Metadata = {
  title: "Yönetici girişi | REDMEDYA",
  robots: { index: false, follow: false },
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
