// ============================================================
// POST /api/struk/[id]/verify
// ------------------------------------------------------------
// Body: { action: "approve" | "reject", alasan?: string }
//
// Approve:
//   - Struk.statusStruk = APPROVED, verifiedAt = now
//   - Anggota.status = LUNAS
//   - Create Transaksi(MASUK, nominal=settings.nominalIuran, strukId, anggotaId, periodeBulan)
//
// Reject:
//   - Struk.statusStruk = REJECTED, ditolakAlasan, verifiedAt = now
//   - Anggota.status kembali ke kondisi sebelumnya (BELUM_LUNAS — TERTUNGGAK derived)
//   - WAHA stub: kirim notifikasi (best-effort, try/catch terpisah)
//
// Hanya admin.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getPeriodeBulan } from "@/lib/status";
import { sendWahaMessage, buildStrukDitolakMessage } from "@/lib/waha";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, alasan } = body as { action?: string; alasan?: string };

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Action harus 'approve' atau 'reject'." },
        { status: 400 }
      );
    }

    const struk = await db.struk.findUnique({
      where: { id },
      include: { anggota: true },
    });
    if (!struk) {
      return NextResponse.json({ error: "Struk tidak ditemukan." }, { status: 404 });
    }
    if (struk.statusStruk !== "PENDING") {
      return NextResponse.json(
        { error: `Struk sudah ${struk.statusStruk}, tidak bisa diverifikasi ulang.` },
        { status: 400 }
      );
    }

    const settings = await getSettings();
    const now = new Date();

    if (action === "approve") {
      // Approve: update struk + anggota LUNAS + transaksi MASUK otomatis
      await db.$transaction([
        db.struk.update({
          where: { id },
          data: { statusStruk: "APPROVED", verifiedAt: now },
        }),
        db.anggota.update({
          where: { id: struk.anggotaId },
          data: { status: "LUNAS" },
        }),
        db.transaksi.create({
          data: {
            tipe: "MASUK",
            nominal: settings.nominalIuran,
            keterangan: `Iuran ${struk.periodeBulan} — ${struk.anggota.namaLengkap} (${struk.anggota.gender})`,
            strukId: struk.id,
            anggotaId: struk.anggotaId,
            periodeBulan: struk.periodeBulan,
          },
        }),
      ]);

      return NextResponse.json({
        ok: true,
        action: "approve",
        nominal: settings.nominalIuran,
      });
    }

    // Reject
    const alasanText = (alasan ?? "").trim();
    if (!alasanText) {
      return NextResponse.json(
        { error: "Alasan penolakan wajib diisi." },
        { status: 400 }
      );
    }

    await db.$transaction([
      db.struk.update({
        where: { id },
        data: {
          statusStruk: "REJECTED",
          ditolakAlasan: alasanText,
          verifiedAt: now,
        },
      }),
      // Anggota.status kembali ke BELUM_LUNAS (TERTUNGGAK akan derived jika lewat deadline)
      db.anggota.update({
        where: { id: struk.anggotaId },
        data: { status: "BELUM_LUNAS" },
      }),
    ]);

    // WAHA stub — best-effort, try/catch TERPISAH dari logika utama
    try {
      const msg = buildStrukDitolakMessage(struk.anggota.namaLengkap, alasanText);
      await sendWahaMessage(struk.anggota.noHpWa, msg);
    } catch (e) {
      console.warn("[verify struk] WAHA gagal (best-effort, tidak menggagalkan reject):", e);
    }

    return NextResponse.json({ ok: true, action: "reject" });
  } catch (e) {
    console.error("[struk verify] error", e);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
