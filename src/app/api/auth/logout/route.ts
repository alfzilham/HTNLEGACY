// ============================================================
// POST /api/auth/logout — clear anggota session
// ============================================================

import { NextResponse } from "next/server";
import { clearAnggotaSession } from "@/lib/session";

export async function POST() {
  try {
    await clearAnggotaSession();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[logout] error", e);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
