// ============================================================
// POST /api/admin/auth
// ------------------------------------------------------------
// Body: { password }
// Validasi terhadap process.env.ADMIN_PASSWORD.
// Jika cocok, set cookie admin_session (JWT stateless).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { setAdminSession } from "@/lib/session";
import { checkRateLimit, resetRateLimit, getClientIp } from "@/lib/rate-limit";
import { timingSafeEqual } from "crypto";

function safeCompare(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit (5 attempts / 5 menit, lock 60s)
    const ip = getClientIp(req);
    const rl = checkRateLimit(`admin:${ip}`, 5, 300, 60);
    if (!rl.ok) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan. Coba lagi dalam ${rl.retryAfterSeconds} detik.`,
          retryAfter: rl.retryAfterSeconds,
        },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds ?? 60) } }
      );
    }

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
        { error: `Password admin salah. Sisa percobaan: ${rl.remaining}.` },
        { status: 401 }
      );
    }

    // Login sukses — reset rate limit
    resetRateLimit(`admin:${ip}`);
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
