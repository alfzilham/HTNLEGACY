// ============================================================
// POST /api/auth/signup
// Body: { gender, namaLengkap, noHpWa, password }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidGender } from "@/lib/constants";
import { encryptPassword } from "@/lib/crypto";
import { setAnggotaSession } from "@/lib/session";
import { isValidIndoPhone, normalizePhone } from "@/lib/status";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gender, namaLengkap, noHpWa, password } = body as {
      gender?: string;
      namaLengkap?: string;
      noHpWa?: string;
      password?: string;
    };

    // --- Validasi ---
    if (!gender || !isValidGender(gender)) {
      return NextResponse.json(
        { error: "Gender harus PRIA atau WANITA." },
        { status: 400 }
      );
    }
    const nama = (namaLengkap ?? "").trim();
    if (nama.length < 2) {
      return NextResponse.json(
        { error: "Nama lengkap minimal 2 karakter." },
        { status: 400 }
      );
    }
    if (!noHpWa || !isValidIndoPhone(noHpWa)) {
      return NextResponse.json(
        { error: "Nomor HP/WA tidak valid. Contoh: 08123456789." },
        { status: 400 }
      );
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter." },
        { status: 400 }
      );
    }

    // --- Cek duplikat (nama+gender) ---
    const exist = await db.anggota.findUnique({
      where: {
        namaLengkap_gender: { namaLengkap: nama, gender: gender as string },
      },
      select: { id: true },
    });
    if (exist) {
      return NextResponse.json(
        {
          error:
            "Nama lengkap dengan gender ini sudah terdaftar. Gunakan nama lain atau login.",
        },
        { status: 409 }
      );
    }

    // --- Insert ---
    const created = await db.anggota.create({
      data: {
        gender: gender as string,
        namaLengkap: nama,
        noHpWa: normalizePhone(noHpWa),
        passwordEnc: encryptPassword(password),
        status: "BELUM_LUNAS",
      },
    });

    await setAnggotaSession(created.id);
    return NextResponse.json({ ok: true, anggotaId: created.id });
  } catch (e) {
    console.error("[signup] error", e);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
