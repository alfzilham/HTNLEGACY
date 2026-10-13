// ============================================================
// POST /api/struk/upload
// ------------------------------------------------------------
// Body (multipart/form-data): file, anggotaId, password
// Flow:
// 1. Validasi file (tipe, ukuran)
// 2. Verifikasi password anggota (re-entry per aksi, SPEC §4.2)
// 3. Upload gambar ke /public/uploads/struk/{YYYY-MM}/{anggotaId}-{ts}.ext
// 4. OCR via Gemini AI (lihat lib/ocr.ts) — fallback gagal = REJECTED otomatis
// 5. Create record Struk status=PENDING + ocrRawText
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";
import { getPeriodeBulan } from "@/lib/status";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { runOcr } from "@/lib/ocr";

const ALLOWED = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData();
    const file = fd.get("file");
    const anggotaId = fd.get("anggotaId");
    const password = fd.get("password");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File struk tidak ditemukan." }, { status: 400 });
    }
    if (typeof anggotaId !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "anggotaId dan password wajib diisi." }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: "Format tidak didukung. Pakai PNG/JPG/WebP." },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ukuran file melebihi 5MB." }, { status: 400 });
    }

    // 1. Cari anggota
    const anggota = await db.anggota.findUnique({ where: { id: anggotaId } });
    if (!anggota) {
      return NextResponse.json({ error: "Anggota tidak ditemukan." }, { status: 404 });
    }

    // 2. Verifikasi password (re-entry per aksi — BUKAN sesi login)
    if (!verifyPassword(password, anggota.passwordEnc)) {
      return NextResponse.json(
        { error: "Password salah untuk anggota ini." },
        { status: 401 }
      );
    }

    // 3. Simpan gambar ke /public/uploads/struk/{YYYY-MM}/...
    const periode = getPeriodeBulan();
    const ext = file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "webp";
    const filename = `${anggotaId}-${Date.now()}.${ext}`;
    const relPath = `/uploads/struk/${periode}/${filename}`;
    const dir = path.join(process.cwd(), "public", "uploads", "struk", periode);
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    const fullPath = path.join(dir, filename);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(fullPath, buf);

    // 4. OCR via Gemini AI (atau fallback python-ocr hook di masa depan)
    let ocrRawText: string | null = null;
    let ocrSource: string | null = null;
    let ocrError: string | null = null;
    try {
      const result = await runOcr(buf, file.type);
      ocrRawText = result.rawText;
      ocrSource = result.source;
      if (!result.ok) ocrError = result.error;
    } catch (e) {
      ocrError = e instanceof Error ? e.message : "OCR error";
    }

    // 5. Jika OCR total gagal → reject otomatis (SPEC §5 langkah 4)
    if (ocrError && !ocrRawText) {
      // Tetap simpan record dengan status REJECTED + alasan
      await db.struk.create({
        data: {
          anggotaId,
          imageUrl: relPath,
          statusStruk: "REJECTED",
          ocrRawText: null,
          ocrSource,
          ditolakAlasan: `OCR gagal membaca struk: ${ocrError}. Silakan upload ulang dengan gambar lebih jelas.`,
          periodeBulan: periode,
          verifiedAt: new Date(),
        },
      });
      return NextResponse.json(
        {
          ok: false,
          error: "Struk tidak dapat dibaca (OCR gagal). Silakan upload ulang dengan gambar lebih jelas.",
        },
        { status: 422 }
      );
    }

    // 6. Create record Struk PENDING
    const struk = await db.struk.create({
      data: {
        anggotaId,
        imageUrl: relPath,
        statusStruk: "PENDING",
        ocrRawText,
        ocrSource,
        periodeBulan: periode,
      },
    });

    return NextResponse.json({ ok: true, strukId: struk.id });
  } catch (e) {
    console.error("[struk/upload] error", e);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
