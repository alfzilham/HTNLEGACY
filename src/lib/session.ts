// ============================================================
// SIDU — JWT Session (anggota + admin) — SERVER-ONLY
// ------------------------------------------------------------
// File ini boleh import `next/headers` (server context only).
// Untuk middleware (edge runtime), pakai `session-edge.ts`.
// ============================================================

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const ANGGOTA_COOKIE = "sidu_session";
const ADMIN_COOKIE = "sidu_admin";
const ANGGOTA_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 hari
const ADMIN_TTL_SECONDS = 60 * 60 * 8; // 8 jam

function getSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET belum diset di environment.");
  return s;
}

// ---------------- Anggota ----------------

export async function setAnggotaSession(anggotaId: string): Promise<void> {
  const token = jwt.sign({ anggotaId, kind: "anggota" }, getSecret(), {
    expiresIn: ANGGOTA_TTL_SECONDS,
  });
  const store = await cookies();
  store.set(ANGGOTA_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ANGGOTA_TTL_SECONDS,
  });
}

export async function getAnggotaSession(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(ANGGOTA_COOKIE)?.value;
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

export async function clearAnggotaSession(): Promise<void> {
  const store = await cookies();
  store.delete(ANGGOTA_COOKIE);
}

// ---------------- Admin ----------------

export async function setAdminSession(): Promise<void> {
  const token = jwt.sign({ kind: "admin", role: "admin" }, getSecret(), {
    expiresIn: ADMIN_TTL_SECONDS,
  });
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_TTL_SECONDS,
  });
}

export async function getAdminSession(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
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

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}
