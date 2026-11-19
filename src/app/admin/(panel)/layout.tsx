import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Admin Panel | REDMEDYA",
  robots: { index: false, follow: false },
};

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!verifyAdminSessionToken(token)) {
    redirect("/admin/login");
  }

  return <AdminShell fontClass={`${jakarta.variable} ${inter.variable}`}>{children}</AdminShell>;
}
