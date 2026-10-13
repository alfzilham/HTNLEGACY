// ============================================================
// /api/anggota/[id] — GET, PATCH, DELETE
// ------------------------------------------------------------
// GET: detail anggota. Hanya admin yang dapat passwordEnc
//      (untuk fitur icon mata). Anggota biasa hanya dapat data publik.
// PATCH: update status/data anggota. Admin only.
// DELETE: hapus akun anggota. Admin only.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin, getCurrentAnggota } from "@/lib/auth";
import { decryptPassword } from "@/lib/crypto";
import { isValidGender, isValidStatusIuranStored } from "@/lib/constants";
import { isValidIndoPhone, normalizePhone } from "@/lib/status";
import { getSettings } from "@/lib/settings";
import { computeStatusTampil } from "@/lib/status";
import { auditLog } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const anggota = await db.anggota.findUnique({
    where: { id },
    select: {
      id: true,
      gender: true,
      namaLengkap: true,
      noHpWa: true,
      passwordEnc: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!anggota) {
    return NextResponse.json({ error: "Anggota tidak ditemukan." }, { status: 404 });
  }

  const admin = await isAdmin();
  const settings = await getSettings();
  const statusTampil = computeStatusTampil(
    anggota.status,
    settings.deadlineTanggal
  );

  // Anggota non-admin hanya boleh lihat data sendiri (terbatas)
  // Tapi di SIDU semua anggota bisa lihat semua anggota (transparansi),
  // jadi GET ini dipakai admin untuk dapat passwordEnc.
  // Untuk anggota biasa, passwordEnc TIDAK di-return.
  return NextResponse.json({
    id: anggota.id,
    gender: anggota.gender,
    namaLengkap: anggota.namaLengkap,
    noHpWa: admin ? anggota.noHpWa : null,
    status: anggota.status,
    statusTampil,
    passwordPlain: admin ? decryptPassword(anggota.passwordEnc) : undefined,
    createdAt: anggota.createdAt,
    updatedAt: anggota.updatedAt,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (typeof body.gender === "string" && isValidGender(body.gender)) {
      data.gender = body.gender;
    }
    if (typeof body.namaLengkap === "string" && body.namaLengkap.trim().length >= 2) {
      data.namaLengkap = body.namaLengkap.trim();
    }
    if (typeof body.noHpWa === "string" && isValidIndoPhone(body.noHpWa)) {
      data.noHpWa = normalizePhone(body.noHpWa);
    }
    if (typeof body.status === "string" && isValidStatusIuranStored(body.status)) {
      data.status = body.status;
    }
    if (typeof body.password === "string" && body.password.length >= 6) {
      // Admin bisa reset password anggota
      const { encryptPassword } = await import("@/lib/crypto");
      data.passwordEnc = encryptPassword(body.password);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada field valid untuk diupdate." },
        { status: 400 }
      );
    }

    // Cek duplikat jika nama/gender diubah
    if (data.namaLengkap || data.gender) {
      const current = await db.anggota.findUnique({ where: { id } });
      if (!current) {
        return NextResponse.json({ error: "Anggota tidak ditemukan." }, { status: 404 });
      }
      const newNama = (data.namaLengkap as string) ?? current.namaLengkap;
      const newGender = (data.gender as string) ?? current.gender;
      const dup = await db.anggota.findUnique({
        where: { namaLengkap_gender: { namaLengkap: newNama, gender: newGender } },
      });
      if (dup && dup.id !== id) {
        return NextResponse.json(
          { error: "Nama+gender sudah dipakai anggota lain." },
          { status: 409 }
        );
      }
    }

    const updated = await db.anggota.update({
      where: { id },
      data,
      select: { id: true, namaLengkap: true, gender: true, status: true },
    });

    const aksi = data.status ? "UPDATE_STATUS" : "UPDATE_ANGGOTA";
    await auditLog(aksi, {
      targetId: id,
      targetLabel: updated.namaLengkap,
      detail: Object.keys(data).join(", ") + (data.status ? ` → ${data.status}` : ""),
    });

    return NextResponse.json({ ok: true, anggota: updated });
  } catch (e) {
    console.error("[anggota PATCH] error", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    // Cek exist
    const anggota = await db.anggota.findUnique({ where: { id } });
    if (!anggota) {
      return NextResponse.json({ error: "Anggota tidak ditemukan." }, { status: 404 });
    }
    // Cascade delete akan hapus Struk terkait (onDelete: Cascade di schema)
    await db.anggota.delete({ where: { id } });
    await auditLog("DELETE_ANGGOTA", {
      targetId: id,
      targetLabel: anggota.namaLengkap,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[anggota DELETE] error", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

// suppress unused
void getCurrentAnggota;
