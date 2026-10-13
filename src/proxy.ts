// ============================================================
// SIDU — Middleware (auth guard)
// ------------------------------------------------------------
// - Rute publik: /login, /signup, /barcode, /api/auth/*, /api/admin/auth
// - Rute anggota (/beranda, /daftar/*, /kas): butuh cookie sidu_session valid
// - Rute admin (/admin/** kecuali /admin itu sendiri, /api/admin/**): butuh cookie sidu_admin valid
//
// Catatan: middleware Next.js berjalan di edge runtime, jadi TIDAK
// menggunakan `next/headers` (yang hanya kompatibel server component).
// Pakai next/dist/server/web/extension RequestCookies.
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { readAdminFromCookies, readAnggotaFromCookies } from "@/lib/session-edge";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/api/auth/signup",
  "/api/auth/login",
  "/api/auth/verify-password",
  "/api/admin/auth",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cookies = req.cookies;

  if (process.env.DEBUG_MW === "1") {
    console.log("[mw]", pathname, "has sidu_session:", !!cookies.get("sidu_session")?.value);
  }

  // 1. Rute admin (kecuali /admin gate itu sendiri & /api/admin/auth & /api/admin/logout POST)
  const isAdminAuthEndpoint =
    pathname === "/api/admin/auth" || pathname === "/api/admin/logout";
  if (
    (pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/")) &&
    pathname !== "/admin" &&
    !isAdminAuthEndpoint
  ) {
    if (!readAdminFromCookies(cookies)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  // 2. Rute anggota
  const ANGGOTA_PROTECTED = ["/beranda", "/daftar", "/kas", "/barcode"];
  const isAnggotaProtected = ANGGOTA_PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isAnggotaProtected) {
    const anggotaId = readAnggotaFromCookies(cookies);
    if (process.env.DEBUG_MW === "1") {
      console.log("[mw] anggotaProtected, resolved anggotaId:", anggotaId);
    }
    if (!anggotaId) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // 3. Root → arahkan ke /login atau /beranda
  if (pathname === "/") {
    if (readAnggotaFromCookies(cookies)) {
      return NextResponse.redirect(new URL("/beranda", req.url));
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 4. Set x-pathname request header untuk dipakai server components (admin layout)
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|uploads|robots.txt).*)",
  ],
};
