// ============================================================
// POST /api/admin/upload-barcode
// ------------------------------------------------------------
// Upload gambar barcode statis (bukan generate dinamis).
// Disimpan di /public/uploads/barcode.{ext} (overwrite lama).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { db } from "@/lib/db";

const ALLOWED = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

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
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: "Format tidak didukung. Pakai PNG/JPG/WebP." },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file melebihi 5MB." },
        { status: 400 }
      );
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "webp";
    const dir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });

    const { unlink } = await import("fs/promises");
    // Hapus file barcode lama (semua ekstensi yang mungkin)
    for (const e of ["png", "jpg", "webp"]) {
      const p = path.join(dir, `barcode.${e}`);
      try {
        if (existsSync(p)) await unlink(p);
      } catch {
        /* ignore */
      }
    }

    const filename = `barcode.${ext}`;
    const fullPath = path.join(dir, filename);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(fullPath, buf);

    const url = `/uploads/${filename}`;
    // Update settings
    await db.settings.upsert({
      where: { id: "singleton" },
      update: { barcodeImageUrl: url },
      create: { id: "singleton", barcodeImageUrl: url },
    });

    return NextResponse.json({ ok: true, url });
  } catch (e) {
    console.error("[upload-barcode] error", e);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
