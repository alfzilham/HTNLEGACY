// ============================================================
// /api/transaksi — GET (list, filter by bulan), POST (catat manual admin)
// ------------------------------------------------------------
// GET: ?bulan=YYYY-MM (default: bulan ini). Return list + summary.
// POST: admin only. Body: { tipe, nominal, keterangan, periodeBulan? }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { getPeriodeBulan } from "@/lib/status";
import { isValidTipeTransaksi } from "@/lib/constants";
import { auditLog } from "@/lib/audit";
import { getAnggotaSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  if (!(await getAnggotaSession()) && !(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const bulan = url.searchParams.get("bulan") ?? getPeriodeBulan();

  const [list, all] = await Promise.all([
    db.transaksi.findMany({
      where: { periodeBulan: bulan },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    db.transaksi.findMany({
      select: { periodeBulan: true, tipe: true, nominal: true },
    }),
  ]);

  // Summary per bulan (semua bulan, untuk grafik historis)
  const bulanMap = new Map<string, { masuk: number; keluar: number }>();
  for (const t of all) {
    const cur = bulanMap.get(t.periodeBulan) ?? { masuk: 0, keluar: 0 };
    if (t.tipe === "MASUK") cur.masuk += t.nominal;
    else cur.keluar += t.nominal;
    bulanMap.set(t.periodeBulan, cur);
  }
  const perBulan = Array.from(bulanMap.entries())
    .map(([b, v]) => ({ bulan: b, ...v, saldo: v.masuk - v.keluar }))
    .sort((a, b) => a.bulan.localeCompare(b.bulan));

  const current = bulanMap.get(bulan) ?? { masuk: 0, keluar: 0 };

  return NextResponse.json({
    bulan,
    list,
    summary: {
      masuk: current.masuk,
      keluar: current.keluar,
      saldo: current.masuk - current.keluar,
    },
    perBulan,
  });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { tipe, nominal, keterangan, periodeBulan, anggotaId } = body as {
      tipe?: string;
      nominal?: number;
      keterangan?: string;
      periodeBulan?: string;
      anggotaId?: string;
    };

    if (!tipe || !isValidTipeTransaksi(tipe)) {
      return NextResponse.json({ error: "Tipe harus MASUK atau KELUAR." }, { status: 400 });
    }
    if (typeof nominal !== "number" || nominal <= 0) {
      return NextResponse.json({ error: "Nominal harus > 0." }, { status: 400 });
    }
    const ket = (keterangan ?? "").trim();
    if (!ket) {
      return NextResponse.json({ error: "Keterangan wajib diisi." }, { status: 400 });
    }
    const periode = periodeBulan ?? getPeriodeBulan();
    if (!/^\d{4}-\d{2}$/.test(periode)) {
      return NextResponse.json({ error: "Format periodeBulan: YYYY-MM." }, { status: 400 });
    }

    const created = await db.transaksi.create({
      data: {
        tipe,
        nominal: Math.floor(nominal),
        keterangan: ket,
        periodeBulan: periode,
        anggotaId: anggotaId || null,
      },
    });
    await auditLog("ADD_TRANSAKSI", {
      targetId: created.id,
      targetLabel: ket,
      detail: `${tipe} Rp ${Math.floor(nominal).toLocaleString("id-ID")} (${periode})`,
    });
    return NextResponse.json({ ok: true, transaksi: created });
  } catch (e) {
    console.error("[transaksi POST] error", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
