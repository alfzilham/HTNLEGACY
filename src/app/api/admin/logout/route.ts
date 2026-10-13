import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/session";

export async function POST() {
  try {
    await clearAdminSession();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/logout] error", e);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
