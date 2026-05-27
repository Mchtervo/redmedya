import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Admin Panel | REDMEDYA",
  robots: { index: false, follow: false },
};

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

  return <AdminShell>{children}</AdminShell>;
}
