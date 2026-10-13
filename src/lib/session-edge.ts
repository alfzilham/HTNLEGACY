// ============================================================
// SIDU — Edge-safe session readers (untuk middleware.ts)
// ------------------------------------------------------------
// File ini TIDAK boleh meng-import `next/headers` atau Prisma.
// Hanya butuh jsonwebtoken + tipe RequestCookies dari next internal.
// ============================================================

import jwt from "jsonwebtoken";
import type { RequestCookies } from "next/dist/server/web/extension";

const ANGGOTA_COOKIE = "sidu_session";
const ADMIN_COOKIE = "sidu_admin";

function getSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET belum diset di environment.");
  return s;
}

export function readAdminFromCookies(
  cookieStore: RequestCookies
): boolean {
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  try {
    const payload = jwt.verify(token, getSecret()) as {
      kind?: string;
      role?: string;
    };
    return payload.kind === "admin" && payload.role === "admin";
  } catch {
    return false;
  }
}

export function readAnggotaFromCookies(
  cookieStore: RequestCookies
): string | null {
  const token = cookieStore.get(ANGGOTA_COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getSecret()) as {
      anggotaId?: string;
      kind?: string;
    };
    if (payload.kind !== "anggota" || !payload.anggotaId) return null;
    return payload.anggotaId;
  } catch {
    return null;
  }
}
