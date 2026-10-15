// ============================================================
// SIDU — Current user helpers (server-side)
// ============================================================

import { db } from "@/lib/db";
import { getAnggotaSession, getAdminSession } from "@/lib/session";

export type CurrentAnggota = {
  id: string;
  namaLengkap: string;
  gender: string;
  noHpWa: string;
};

export async function getCurrentAnggota(): Promise<CurrentAnggota | null> {
  const id = await getAnggotaSession();
  if (!id) return null;
  const a = await db.anggota.findUnique({
    where: { id },
    select: { id: true, namaLengkap: true, gender: true, noHpWa: true },
  });
  return a ?? null;
}

export async function isAdmin(): Promise<boolean> {
  return getAdminSession();
}
