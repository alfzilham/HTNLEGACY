// ============================================================
// POST /api/admin/auth
// ------------------------------------------------------------
// Body: { password }
// Validasi terhadap process.env.ADMIN_PASSWORD.
// Jika cocok, set cookie admin_session (JWT stateless).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { setAdminSession } from "@/lib/session";
import { timingSafeEqual } from "crypto";

function safeCompare(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body as { password?: string };
    const adminPwd = process.env.ADMIN_PASSWORD;

    if (!adminPwd) {
      return NextResponse.json(
        { error: "ADMIN_PASSWORD belum dikonfigurasi di server." },
        { status: 500 }
      );
    }
    if (!password || !safeCompare(String(password), adminPwd)) {
      return NextResponse.json(
        { error: "Password admin salah." },
        { status: 401 }
      );
    }

    await setAdminSession();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/auth] error", e);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
