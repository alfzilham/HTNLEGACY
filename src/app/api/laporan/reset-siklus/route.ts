// ============================================================
// POST /api/laporan/reset-siklus
// ------------------------------------------------------------
// Reset siklus bulanan:
// 1. Hapus seluruh file struk di /public/uploads/struk/{periodeBulan}/**
// 2. Update seluruh Anggota.status → BELUM_LUNAS
// 3. TIDAK menghapus record Struk maupun Transaksi dari database
//    (gambar fisik hilang, imageUrl jadi stale link — diterima untuk bebaskan storage)
// 4. Transaksi TETAP utuh selamanya (basis grafik kas historis)
// ============================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { getPeriodeBulan } from "@/lib/status";
import { rm } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { auditLog } from "@/lib/audit";

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const periode = getPeriodeBulan();
    const strukDir = path.join(process.cwd(), "public", "uploads", "struk", periode);

    // 1. Hapus folder struk periode ini
    let storageCleared = false;
    if (existsSync(strukDir)) {
      try {
        await rm(strukDir, { recursive: true, force: true });
        storageCleared = true;
      } catch (e) {
        console.warn("[reset-siklus] gagal hapus storage:", e);
      }
    }

    // 2. Reset semua Anggota.status → BELUM_LUNAS
    const result = await db.anggota.updateMany({
      where: { status: "LUNAS" },
      data: { status: "BELUM_LUNAS" },
    });

    // 3. Catat transaksi (TIDAK dihapus — hanya statistik untuk response)
    const transaksiCount = await db.transaksi.count({
      where: { periodeBulan: periode },
    });

    // Audit log
    await auditLog("RESET_SIKLUS", {
      targetLabel: `Periode ${periode}`,
      detail: `${result.count} anggota reset, ${transaksiCount} transaksi tetap, storage ${storageCleared ? "dihapus" : "tidak ada"}`,
    });

    return NextResponse.json({
      ok: true,
      periode,
      storageCleared,
      anggotaReset: result.count,
      transaksiTetap: transaksiCount,
      message: `Siklus ${periode} direset. ${result.count} anggota kembali ke BELUM_LUNAS. ${transaksiCount} transaksi tetap dipertahankan untuk grafik historis.`,
    });
  } catch (e) {
    console.error("[reset-siklus] error", e);
    return NextResponse.json(
      { error: "Gagal reset siklus: " + (e instanceof Error ? e.message : "") },
      { status: 500 }
    );
  }
}
