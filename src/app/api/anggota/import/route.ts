// ============================================================
// POST /api/anggota/import
// ------------------------------------------------------------
// Body (multipart/form-data): file (.xlsx atau .json)
// Proses: parse baris → cek (namaLengkap, gender) duplikat → skip atau insert
// Return: { ok, inserted, skipped: [{ namaLengkap, gender, reason }] }
//
// Password di-enkripsi AES-256 saat insert.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { encryptPassword } from "@/lib/crypto";
import { isValidGender } from "@/lib/constants";
import { isValidIndoPhone, normalizePhone } from "@/lib/status";
import * as XLSX from "xlsx";
import { auditLog } from "@/lib/audit";

type Row = {
  gender?: string;
  namaLengkap?: string;
  noHpWa?: string;
  password?: string;
};

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const fd = await req.formData();
    const file = fd.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    let rows: Row[] = [];

    if (file.name.endsWith(".json")) {
      const parsed = JSON.parse(buf.toString("utf8"));
      if (!Array.isArray(parsed)) {
        return NextResponse.json(
          { error: "JSON harus berupa array of object." },
          { status: 400 }
        );
      }
      rows = parsed as Row[];
    } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      const wb = XLSX.read(buf, { type: "buffer" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json<Row>(ws);
    } else {
      return NextResponse.json(
        { error: "Format file harus .xlsx atau .json" },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada baris data di file." },
        { status: 400 }
      );
    }

    // Limit max 500 baris per import
    if (rows.length > 500) {
      return NextResponse.json(
        { error: "Maksimal 500 baris per import." },
        { status: 400 }
      );
    }

    const inserted: { namaLengkap: string; gender: string }[] = [];
    const skipped: { namaLengkap: string; gender: string; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const gender = (r.gender ?? "").toString().trim().toUpperCase();
      const nama = (r.namaLengkap ?? "").toString().trim();
      const noHp = (r.noHpWa ?? "").toString().trim();
      const pwd = (r.password ?? "").toString();

      if (!nama) {
        skipped.push({
          namaLengkap: `(baris ${i + 2})`,
          gender: gender || "?",
          reason: "Nama kosong",
        });
        continue;
      }
      if (!isValidGender(gender)) {
        skipped.push({
          namaLengkap: nama,
          gender: gender || "?",
          reason: "Gender harus PRIA/WANITA",
        });
        continue;
      }
      if (!isValidIndoPhone(noHp)) {
        skipped.push({
          namaLengkap: nama,
          gender,
          reason: "No HP/WA tidak valid",
        });
        continue;
      }
      if (pwd.length < 6) {
        skipped.push({
          namaLengkap: nama,
          gender,
          reason: "Password < 6 karakter",
        });
        continue;
      }

      // Cek duplikat
      const exist = await db.anggota.findUnique({
        where: { namaLengkap_gender: { namaLengkap: nama, gender } },
      });
      if (exist) {
        skipped.push({
          namaLengkap: nama,
          gender,
          reason: "Sudah terdaftar (skip duplicate)",
        });
        continue;
      }

      try {
        await db.anggota.create({
          data: {
            gender,
            namaLengkap: nama,
            noHpWa: normalizePhone(noHp),
            passwordEnc: encryptPassword(pwd),
            status: "BELUM_LUNAS",
          },
        });
        inserted.push({ namaLengkap: nama, gender });
      } catch (e) {
        skipped.push({
          namaLengkap: nama,
          gender,
          reason: e instanceof Error ? e.message : "Insert gagal",
        });
      }
    }

    await auditLog("IMPORT_ANGGOTA", {
      targetLabel: file.name,
      detail: `${inserted.length} inserted, ${skipped.length} skipped dari ${rows.length} baris`,
    });

    return NextResponse.json({
      ok: true,
      total: rows.length,
      inserted: inserted.length,
      skipped: skipped.length,
      insertedList: inserted,
      skippedList: skipped,
    });
  } catch (e) {
    console.error("[anggota import] error", e);
    return NextResponse.json(
      { error: "Terjadi kesalahan server: " + (e instanceof Error ? e.message : "") },
      { status: 500 }
    );
  }
}
