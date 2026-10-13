// ============================================================
// POST /api/auth/login
// Body: { gender, namaLengkap, password }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidGender } from "@/lib/constants";
import { verifyPassword } from "@/lib/crypto";
import { setAnggotaSession } from "@/lib/session";
import { checkRateLimit, resetRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limit (5 attempts / 5 menit, lock 60s)
    const ip = getClientIp(req);
    const rl = checkRateLimit(`login:${ip}`, 5, 300, 60);
    if (!rl.ok) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan login. Coba lagi dalam ${rl.retryAfterSeconds} detik.`,
          retryAfter: rl.retryAfterSeconds,
        },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds ?? 60) } }
      );
    }

    const body = await req.json();
    const { gender, namaLengkap, password } = body as {
      gender?: string;
      namaLengkap?: string;
      password?: string;
    };

    if (!gender || !isValidGender(gender)) {
      return NextResponse.json(
        { error: "Gender harus PRIA atau WANITA." },
        { status: 400 }
      );
    }
    const nama = (namaLengkap ?? "").trim();
    if (!nama || !password) {
      return NextResponse.json(
        { error: "Nama lengkap dan password wajib diisi." },
        { status: 400 }
      );
    }

    const anggota = await db.anggota.findUnique({
      where: {
        namaLengkap_gender: { namaLengkap: nama, gender: gender as string },
      },
    });
    if (!anggota) {
      return NextResponse.json(
        { error: "Nama tidak ditemukan. Periksa gender & nama, atau daftar dulu." },
        { status: 404 }
      );
    }

    if (!verifyPassword(password, anggota.passwordEnc)) {
      return NextResponse.json(
        { error: `Password salah. Sisa percobaan: ${rl.remaining}.` },
        { status: 401 }
      );
    }

    // Login sukses — reset rate limit
    resetRateLimit(`login:${ip}`);
    await setAnggotaSession(anggota.id);
    return NextResponse.json({ ok: true, anggotaId: anggota.id });
  } catch (e) {
    console.error("[login] error", e);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
