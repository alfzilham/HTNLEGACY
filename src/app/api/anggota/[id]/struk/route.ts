// ============================================================
// GET /api/anggota/[id]/struk — list semua struk anggota (admin only)
// ------------------------------------------------------------
// Return seluruh struk anggota (semua periode, semua status),
// dengan info OCR parsed.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { parseOcrResult } from "@/lib/ocr";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const anggota = await db.anggota.findUnique({
    where: { id },
    select: {
      id: true,
      gender: true,
      namaLengkap: true,
      noHpWa: true,
      status: true,
      createdAt: true,
    },
  });
  if (!anggota) {
    return NextResponse.json({ error: "Anggota tidak ditemukan." }, { status: 404 });
  }

  const strukList = await db.struk.findMany({
    where: { anggotaId: id },
    orderBy: { createdAt: "desc" },
  });

  const strukWithParsed = strukList.map((s) => ({
    ...s,
    ocrParsed: parseOcrResult(s.ocrRawText),
  }));

  return NextResponse.json({
    anggota,
    strukList: strukWithParsed,
  });
}
