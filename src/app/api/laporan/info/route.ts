// ============================================================
// GET /api/laporan/info
// ------------------------------------------------------------
// Return info untuk halaman laporan: jumlah struk approved bulan ini,
// jumlah anggota lunas, total kas masuk, indikasi "siap reset".
// ============================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getPeriodeBulan } from "@/lib/status";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const periode = getPeriodeBulan();
  const [strukApproved, strukPending, anggotaLunas, transaksiMasuk, settings] = await Promise.all([
    db.struk.count({
      where: { periodeBulan: periode, statusStruk: "APPROVED" },
    }),
    db.struk.count({
      where: { statusStruk: "PENDING" },
    }),
    db.anggota.count({ where: { status: "LUNAS" } }),
    db.transaksi.aggregate({
      where: { periodeBulan: periode, tipe: "MASUK" },
      _sum: { nominal: true },
    }),
    getSettings(),
  ]);

  return NextResponse.json({
    periode,
    strukApproved,
    strukPending,
    anggotaLunas,
    totalKasMasuk: transaksiMasuk._sum.nominal ?? 0,
    nominalIuran: settings.nominalIuran,
    deadlineTanggal: settings.deadlineTanggal,
  });
}
