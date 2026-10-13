import { AppShell } from "@/components/app-shell";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getCurrentAnggota } from "@/lib/auth";
import { computeStatusTampil, formatRupiah, getPeriodeBulan, normalizePhone } from "@/lib/status";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { User, Phone, Calendar, Wallet, QrCode, ArrowRight, CheckCircle2, Clock, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const me = await getCurrentAnggota();
  if (!me) redirect("/login");

  const [anggota, settings, strukList, transaksiList] = await Promise.all([
    db.anggota.findUnique({
      where: { id: me.id },
      select: {
        id: true,
        gender: true,
        namaLengkap: true,
        noHpWa: true,
        status: true,
        createdAt: true,
      },
    }),
    getSettings(),
    db.struk.findMany({
      where: { anggotaId: me.id, periodeBulan: getPeriodeBulan() },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.transaksi.findMany({
      where: { anggotaId: me.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  if (!anggota) redirect("/login");
  const statusTampil = computeStatusTampil(
    anggota.status,
    settings.deadlineTanggal
  );

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-extrabold tracking-tight">Profil Saya</h1>
          <p className="text-sm font-semibold text-[#6b6b6b]">
            Data keanggotaan &amp; riwayat iuran Anda
          </p>
        </header>

        {/* Identitas */}
        <section className="brutal-card p-5">
          <div className="flex items-start gap-4">
            <div
              className="flex items-center justify-center w-16 h-16 shrink-0"
              style={{
                background: anggota.gender === "PRIA" ? "var(--accent-secondary)" : "#f9a8d4",
                border: "3px solid var(--ink)",
                borderRadius: 12,
                boxShadow: "4px 4px 0px var(--ink)",
              }}
            >
              <User size={32} strokeWidth={2.5} color="#ffffff" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-extrabold text-xl break-words">{anggota.namaLengkap}</h2>
                <StatusBadge status={statusTampil as "LUNAS" | "BELUM_LUNAS" | "TERTUNGGAK"} />
              </div>
              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#6b6b6b] w-20">Gender</span>
                  <span className="font-semibold">{anggota.gender}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} strokeWidth={2.5} className="text-[#6b6b6b]" />
                  <span className="font-bold text-[#6b6b6b] w-20">No HP/WA</span>
                  <span className="font-mono font-semibold tabular-nums">{anggota.noHpWa}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} strokeWidth={2.5} className="text-[#6b6b6b]" />
                  <span className="font-bold text-[#6b6b6b] w-20">Bergabung</span>
                  <span className="font-semibold">
                    {new Date(anggota.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Status iuran bulan ini */}
        <section className="brutal-card p-5">
          <h2 className="font-extrabold text-lg mb-4 flex items-center gap-2">
            <Wallet size={20} strokeWidth={2.5} />
            Status Iuran Periode {getPeriodeBulan()}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div
              className="p-4"
              style={{
                background: "var(--bg-base)",
                border: "3px solid var(--ink)",
                borderRadius: 8,
              }}
            >
              <div className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wide">Nominal Iuran</div>
              <div className="text-lg font-extrabold tabular-nums mt-1">
                {formatRupiah(settings.nominalIuran)}
              </div>
            </div>
            <div
              className="p-4"
              style={{
                background: "var(--bg-base)",
                border: "3px solid var(--ink)",
                borderRadius: 8,
              }}
            >
              <div className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wide">Deadline</div>
              <div className="text-lg font-extrabold tabular-nums mt-1">Tgl {settings.deadlineTanggal}</div>
            </div>
            <div
              className="p-4 col-span-2 sm:col-span-1"
              style={{
                background:
                  statusTampil === "LUNAS"
                    ? "var(--status-lunas-bg)"
                    : statusTampil === "TERTUNGGAK"
                    ? "var(--status-tertunggak-bg)"
                    : "var(--bg-base)",
                border: `3px solid ${
                  statusTampil === "LUNAS"
                    ? "#14532d"
                    : statusTampil === "TERTUNGGAK"
                    ? "#7f1d1d"
                    : "var(--ink)"
                }`,
                borderRadius: 8,
              }}
            >
              <div className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wide">Status Anda</div>
              <div className="mt-1">
                <StatusBadge status={statusTampil as "LUNAS" | "BELUM_LUNAS" | "TERTUNGGAK"} />
              </div>
            </div>
          </div>
          {statusTampil !== "LUNAS" && (
            <div className="mt-4">
              <Link href="/barcode" className="brutal-btn brutal-btn-primary px-4 py-2.5 inline-flex">
                <QrCode size={16} strokeWidth={2.5} />
                <span>Lihat Barcode Pembayaran</span>
                <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
            </div>
          )}
        </section>

        {/* Riwayat struk bulan ini */}
        <section className="brutal-card p-5">
          <h2 className="font-extrabold text-lg mb-4 flex items-center gap-2">
            <FileText size={20} strokeWidth={2.5} />
            Riwayat Struk {getPeriodeBulan()}
          </h2>
          {strukList.length === 0 ? (
            <div className="text-center py-6 text-sm font-semibold text-[#6b6b6b]">
              Belum ada struk diupload periode ini.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {strukList.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3"
                  style={{
                    background: "var(--bg-base)",
                    border: "2px solid var(--ink)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    className="flex items-center justify-center w-9 h-9 shrink-0"
                    style={{
                      background:
                        s.statusStruk === "APPROVED"
                          ? "var(--status-lunas)"
                          : s.statusStruk === "REJECTED"
                          ? "var(--status-tertunggak)"
                          : "var(--status-pending)",
                      border: "2px solid var(--ink)",
                      borderRadius: 6,
                    }}
                  >
                    {s.statusStruk === "APPROVED" ? (
                      <CheckCircle2 size={16} strokeWidth={2.5} color="#14532d" />
                    ) : s.statusStruk === "REJECTED" ? (
                      <Clock size={16} strokeWidth={2.5} color="#7f1d1d" />
                    ) : (
                      <Clock size={16} strokeWidth={2.5} color="#78350f" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold">
                      {new Date(s.createdAt).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {s.ditolakAlasan && (
                      <div className="text-xs font-semibold text-[#7f1d1d] truncate">
                        Ditolak: {s.ditolakAlasan}
                      </div>
                    )}
                  </div>
                  <StatusBadge
                    status={
                      s.statusStruk === "APPROVED"
                        ? "APPROVED"
                        : s.statusStruk === "REJECTED"
                        ? "REJECTED"
                        : "PENDING"
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Riwayat transaksi (semua bulan) */}
        <section className="brutal-card p-5">
          <h2 className="font-extrabold text-lg mb-4 flex items-center gap-2">
            <Wallet size={20} strokeWidth={2.5} />
            Riwayat Transaksi Iuran
          </h2>
          {transaksiList.length === 0 ? (
            <div className="text-center py-6 text-sm font-semibold text-[#6b6b6b]">
              Belum ada transaksi iuran tercatat.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {transaksiList.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3"
                  style={{
                    background: "var(--bg-base)",
                    border: "2px solid var(--ink)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    className="flex items-center justify-center w-9 h-9 shrink-0"
                    style={{
                      background: t.tipe === "MASUK" ? "var(--status-lunas)" : "var(--status-tertunggak)",
                      border: "2px solid var(--ink)",
                      borderRadius: 6,
                    }}
                  >
                    <Wallet size={16} strokeWidth={2.5} color={t.tipe === "MASUK" ? "#14532d" : "#ffffff"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{t.keterangan}</div>
                    <div className="text-xs font-semibold text-[#6b6b6b]">
                      {new Date(t.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · Periode {t.periodeBulan}
                    </div>
                  </div>
                  <div
                    className="font-extrabold tabular-nums text-sm shrink-0"
                    style={{ color: t.tipe === "MASUK" ? "#14532d" : "#7f1d1d" }}
                  >
                    {t.tipe === "MASUK" ? "+" : "−"} {formatRupiah(t.nominal)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Info keamanan */}
        <section
          className="p-4 text-sm font-semibold"
          style={{
            background: "var(--status-pending-bg)",
            border: "2px solid var(--status-pending)",
            borderRadius: 8,
            color: "#78350f",
          }}
        >
          <b>Informasi Keamanan:</b> Password Anda disimpan terenkripsi (AES-256) dan dapat
          dilihat oleh admin jika Anda lupa. Untuk mengubah password, hubungi Bendahara.
          Nomor HP/WA juga hanya bisa diubah oleh admin.
        </section>
      </div>
    </AppShell>
  );
}
