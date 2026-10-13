// ============================================================
// Admin layout — server-side guard
// ------------------------------------------------------------
// Cek admin session. Jika tidak ada, redirect ke /admin gate.
// Halaman /admin (gate) itu sendiri TIDAK pakai layout ini
// (di-redirect ke /login-style page). Karena /admin adalah route
// sendiri tanpa children layout, kita handle dengan layout group.
//
// Trick: layout ini berlaku untuk SEMUA route /admin/* KEcuali
// /admin itu sendiri. Karena /admin/page.tsx ada di root /admin,
// Next akan tetap apply layout ini ke /admin juga. Maka kita
// cek: jika path === "/admin" dan tidak ada session, render
// children apa adanya (gate page). Jika path !== "/admin" dan
// tidak ada session, redirect.
// ============================================================

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { isAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await isAdmin();
  const h = await headers();
  const pathname = h.get("x-pathname") || "";

  // Jika di gate (/admin) dan belum login → render children (gate page)
  // Tanpa AdminShell (gate pakai AuthShell sendiri).
  if (pathname === "/admin" && !admin) {
    return <>{children}</>;
  }

  // Jika belum login & bukan di gate → redirect ke gate
  if (!admin) {
    redirect("/admin");
  }

  return <AdminShell>{children}</AdminShell>;
}
