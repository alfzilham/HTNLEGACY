// DELETE /api/transaksi/[id] — admin only, hapus transaksi manual
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { auditLog } from "@/lib/audit";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const t = await db.transaksi.findUnique({ where: { id } });
    if (!t) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
    }
    // Tidak boleh hapus transaksi yang berasal dari struk approved (strukId !== null)
    if (t.strukId) {
      return NextResponse.json(
        { error: "Transaksi otomatis dari struk tidak bisa dihapus. Hapus/reject struk terkait dulu." },
        { status: 400 }
      );
    }
    await db.transaksi.delete({ where: { id } });
    await auditLog("DELETE_TRANSAKSI", {
      targetId: id,
      targetLabel: t.keterangan,
      detail: `${t.tipe} Rp ${t.nominal.toLocaleString("id-ID")} (${t.periodeBulan})`,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[transaksi DELETE] error", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
