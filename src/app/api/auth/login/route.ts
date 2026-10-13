// ============================================================
// POST /api/auth/login
// Body: { gender, namaLengkap, password }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidGender } from "@/lib/constants";
import { verifyPassword } from "@/lib/crypto";
import { setAnggotaSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
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
        { error: "Password salah." },
        { status: 401 }
      );
    }

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
