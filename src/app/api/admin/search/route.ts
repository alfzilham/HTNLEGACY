// ============================================================
// GET /api/admin/search?q=keyword
// ------------------------------------------------------------
// Global search untuk admin: cari anggota by nama/no HP, struk
// by nama anggota, transaksi by keterangan. Return grouped results.
// Admin only.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ anggota: [], struk: [], transaksi: [] });
  }

  const [anggota, struk, transaksi] = await Promise.all([
    db.anggota.findMany({
      where: {
        OR: [
          { namaLengkap: { contains: q } },
          { noHpWa: { contains: q } },
        ],
      },
      take: 10,
      orderBy: { namaLengkap: "asc" },
      select: {
        id: true,
        namaLengkap: true,
        gender: true,
        noHpWa: true,
        status: true,
      },
    }),
    db.struk.findMany({
      where: {
        anggota: {
          OR: [
            { namaLengkap: { contains: q } },
            { noHpWa: { contains: q } },
          ],
        },
      },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        anggota: {
          select: { namaLengkap: true, gender: true },
        },
      },
    }),
    db.transaksi.findMany({
      where: {
        keterangan: { contains: q },
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ anggota, struk, transaksi });
}
