// ============================================================
// POST /api/auth/verify-password
// ------------------------------------------------------------
// Dipakai untuk re-entry password saat upload struk (SPEC §4.2).
// Body: { anggotaId, password }
// Returns: { ok: true } jika cocok, { ok: false, error } jika tidak.
//
// CATATAN: endpoint ini TIDAK membuat sesi baru — hanya memverifikasi.
// Aksi upload struk yang sebenarnya memvalidasi password ulang di
// /api/struk/upload. Endpoint ini opsional untuk pre-check UI.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { anggotaId, password } = body as {
      anggotaId?: string;
      password?: string;
    };

    if (!anggotaId || !password) {
      return NextResponse.json(
        { error: "anggotaId dan password wajib diisi." },
        { status: 400 }
      );
    }

    const anggota = await db.anggota.findUnique({
      where: { id: anggotaId },
      select: { id: true, passwordEnc: true, namaLengkap: true },
    });
    if (!anggota) {
      return NextResponse.json(
        { error: "Anggota tidak ditemukan." },
        { status: 404 }
      );
    }

    const valid = verifyPassword(password, anggota.passwordEnc);
    if (!valid) {
      return NextResponse.json(
        { ok: false, error: "Password salah." },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true, namaLengkap: anggota.namaLengkap });
  } catch (e) {
    console.error("[verify-password] error", e);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
