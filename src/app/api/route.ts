import { NextResponse } from "next/server";

// Health check endpoint
export async function GET() {
  return NextResponse.json({ ok: true, app: "SIDU", version: "0.1.0" });
}
