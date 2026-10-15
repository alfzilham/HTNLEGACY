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
import { checkRateLimit, resetRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limit (5 attempts / 5 menit, lock 60s) — key per anggotaId + IP
    const ip = getClientIp(req);
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

    const rlKey = `verify:${anggotaId}:${ip}`;
    const rl = checkRateLimit(rlKey, 5, 300, 60);
    if (!rl.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Terlalu banyak percobaan. Coba lagi dalam ${rl.retryAfterSeconds} detik.`,
          retryAfter: rl.retryAfterSeconds,
        },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds ?? 60) } }
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
        { ok: false, error: `Password salah. Sisa percobaan: ${rl.remaining}.` },
        { status: 401 }
      );
    }

    // Verifikasi sukses — reset rate limit
    resetRateLimit(rlKey);
    return NextResponse.json({ ok: true, namaLengkap: anggota.namaLengkap });
  } catch (e) {
    console.error("[verify-password] error", e);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
