import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { computeStatusTampil, formatRupiah, getPeriodeBulan } from "@/lib/status";
import { getPrevPeriodeBulan, formatPeriodeLabel } from "@/lib/periode";
import { TrendBadge } from "@/components/trend-badge";
import { RecentActivity } from "@/components/recent-activity";
import Link from "next/link";
import { Users, Image as ImageIcon, Wallet, Settings as SettingsIcon, ArrowRight, CheckCircle2, CircleDashed, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const periode = getPeriodeBulan();
  const prevPeriode = getPrevPeriodeBulan(periode);

  const [anggota, strukPending, transaksi, prevTransaksi, settings] = await Promise.all([
    db.anggota.findMany({ orderBy: { namaLengkap: "asc" } }),
    db.struk.count({ where: { statusStruk: "PENDING" } }),
    db.transaksi.findMany({ where: { periodeBulan: periode } }),
    db.transaksi.findMany({ where: { periodeBulan: prevPeriode } }),
    getSettings(),
  ]);

  const now = new Date();
  const lunas = anggota.filter((a) => a.status === "LUNAS").length;
  const belumBayar = anggota.filter((a) => a.status === "BELUM_LUNAS").length;
  const tertunggak = anggota.filter(
    (a) => computeStatusTampil(a.status, settings.deadlineTanggal, now) === "TERTUNGGAK"
  ).length;

  const masuk = transaksi
    .filter((t) => t.tipe === "MASUK")
    .reduce((a, b) => a + b.nominal, 0);
  const keluar = transaksi
    .filter((t) => t.tipe === "KELUAR")
    .reduce((a, b) => a + b.nominal, 0);

  const prevMasuk = prevTransaksi
    .filter((t) => t.tipe === "MASUK")
    .reduce((a, b) => a + b.nominal, 0);
  const prevKeluar = prevTransaksi
    .filter((t) => t.tipe === "KELUAR")
    .reduce((a, b) => a + b.nominal, 0);

  const stats = [
    {
      label: "Total Anggota",
      value: anggota.length.toString(),
      icon: Users,
      bg: "var(--accent-secondary)",
      fg: "#ffffff",
      trend: null as React.ReactNode,
    },
    {
      label: "Struk Pending",
      value: strukPending.toString(),
      icon: ImageIcon,
      bg: "var(--status-pending)",
      fg: "#78350f",
      trend: null as React.ReactNode,
    },
    {
      label: `Kas Masuk ${formatPeriodeLabel(periode)}`,
      value: formatRupiah(masuk),
      icon: Wallet,
      bg: "var(--status-lunas)",
      fg: "#14532d",
      trend: <TrendBadge current={masuk} previous={prevMasuk} />,
    },
    {
      label: `Kas Keluar ${formatPeriodeLabel(periode)}`,
      value: formatRupiah(keluar),
      icon: Wallet,
      bg: "var(--status-tertunggak)",
      fg: "#7f1d1d",
      trend: <TrendBadge current={keluar} previous={prevKeluar} invertColors />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard Admin</h1>
        <p className="text-sm font-semibold text-[#6b6b6b]">
          Ringkasan status iuran periode {formatPeriodeLabel(periode)}
          {prevTransaksi.length > 0 && (
            <span className="ml-2 text-xs">
              (vs {formatPeriodeLabel(prevPeriode)})
            </span>
          )}
        </p>
      </header>

      {/* Stat cards dengan trend */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="brutal-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div
                  className="flex items-center justify-center w-9 h-9"
                  style={{
                    background: s.bg,
                    border: "2.5px solid var(--ink)",
                    borderRadius: 8,
                  }}
                >
                  <Icon size={18} strokeWidth={2.5} color={s.fg} />
                </div>
                {s.trend}
              </div>
              <div className="text-xl md:text-2xl font-extrabold tabular-nums break-all">
                {s.value}
              </div>
              <div className="text-xs font-semibold text-[#6b6b6b] mt-1">
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status breakdown */}
      <section className="brutal-card p-5">
        <h2 className="font-extrabold text-lg mb-4">Ringkasan Status Anggota</h2>
        <div className="grid grid-cols-3 gap-3">
          <div
            className="p-4 text-center"
            style={{
              background: "var(--status-lunas-bg)",
              border: "3px solid #14532d",
              borderRadius: 10,
            }}
          >
            <CheckCircle2 size={20} strokeWidth={2.5} color="#14532d" className="mx-auto mb-1" />
            <div className="text-3xl font-extrabold tabular-nums" style={{ color: "#14532d" }}>
              {lunas}
            </div>
            <div className="text-xs font-bold mt-1" style={{ color: "#14532d" }}>
              LUNAS
            </div>
          </div>
          <div
            className="p-4 text-center"
            style={{
              background: "#f3f0e7",
              border: "3px solid var(--ink)",
              borderRadius: 10,
            }}
          >
            <CircleDashed size={20} strokeWidth={2.5} className="mx-auto mb-1 text-[#6b6b6b]" />
            <div className="text-3xl font-extrabold tabular-nums">{belumBayar}</div>
            <div className="text-xs font-bold mt-1">BELUM LUNAS</div>
          </div>
          <div
            className="p-4 text-center"
            style={{
              background: "var(--status-tertunggak-bg)",
              border: "3px solid #7f1d1d",
              borderRadius: 10,
            }}
          >
            <AlertTriangle size={20} strokeWidth={2.5} color="#7f1d1d" className="mx-auto mb-1" />
            <div className="text-3xl font-extrabold tabular-nums" style={{ color: "#7f1d1d" }}>
              {tertunggak}
            </div>
            <div className="text-xs font-bold mt-1" style={{ color: "#7f1d1d" }}>
              TERTUNGGAK
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 text-sm">
          <div className="flex items-center justify-between p-3" style={{ background: "var(--bg-base)", border: "2px solid var(--ink)", borderRadius: 8 }}>
            <span className="font-semibold text-[#6b6b6b] flex items-center gap-1.5">
              <Users size={14} strokeWidth={2.5} /> Total
            </span>
            <span className="font-extrabold tabular-nums">{anggota.length}</span>
          </div>
          <div className="flex items-center justify-between p-3" style={{ background: "var(--bg-base)", border: "2px solid var(--ink)", borderRadius: 8 }}>
            <span className="font-semibold text-[#6b6b6b] flex items-center gap-1.5">
              <Wallet size={14} strokeWidth={2.5} /> Saldo
            </span>
            <span className="font-extrabold tabular-nums">{formatRupiah(masuk - keluar)}</span>
          </div>
          <div className="flex items-center justify-between p-3 col-span-2 sm:col-span-1" style={{ background: "var(--bg-base)", border: "2px solid var(--ink)", borderRadius: 8 }}>
            <span className="font-semibold text-[#6b6b6b] flex items-center gap-1.5">
              <AlertTriangle size={14} strokeWidth={2.5} /> Deadline
            </span>
            <span className="font-extrabold tabular-nums">Tgl {settings.deadlineTanggal}</span>
          </div>
        </div>
      </section>

      {/* Recent activity + Quick links in 2-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentActivity limit={5} />
        <section className="flex flex-col gap-4">
          <Link href="/admin/struk" className="brutal-card brutal-hover-lift p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-10 h-10"
                  style={{ background: "var(--status-pending)", border: "2.5px solid var(--ink)", borderRadius: 8 }}
                >
                  <ImageIcon size={20} strokeWidth={2.5} color="#78350f" />
                </div>
                <div>
                  <div className="font-extrabold">Verifikasi Struk</div>
                  <div className="text-xs text-[#6b6b6b] font-semibold">
                    {strukPending} struk menunggu
                  </div>
                </div>
              </div>
              <ArrowRight size={20} strokeWidth={2.5} />
            </div>
          </Link>
          <Link href="/admin/settings" className="brutal-card brutal-hover-lift p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-10 h-10"
                  style={{ background: "var(--accent-primary)", border: "2.5px solid var(--ink)", borderRadius: 8 }}
                >
                  <SettingsIcon size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="font-extrabold">Pengaturan</div>
                  <div className="text-xs text-[#6b6b6b] font-semibold">
                    Iuran: {formatRupiah(settings.nominalIuran)}
                  </div>
                </div>
              </div>
              <ArrowRight size={20} strokeWidth={2.5} />
            </div>
          </Link>
          <Link href="/admin/anggota" className="brutal-card brutal-hover-lift p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-10 h-10"
                  style={{ background: "var(--accent-secondary)", border: "2.5px solid var(--ink)", borderRadius: 8 }}
                >
                  <Users size={20} strokeWidth={2.5} color="#ffffff" />
                </div>
                <div>
                  <div className="font-extrabold">Data Anggota</div>
                  <div className="text-xs text-[#6b6b6b] font-semibold">
                    {anggota.length} anggota terdaftar
                  </div>
                </div>
              </div>
              <ArrowRight size={20} strokeWidth={2.5} />
            </div>
          </Link>
        </section>
      </div>

      {/* Info card */}
      <section
        className="p-4 text-sm font-semibold"
        style={{
          background: "var(--status-pending-bg)",
          border: "2px solid var(--status-pending)",
          borderRadius: 8,
          color: "#78350f",
        }}
      >
        <b>💡 Tips:</b> TERTUNGGAK dihitung otomatis untuk anggota BELUM_LUNAS setelah tanggal {settings.deadlineTanggal}.
        Nominal iuran {formatRupiah(settings.nominalIuran)} otomatis tercatat sebagai transaksi MASUK saat struk di-approve.
      </section>
    </div>
  );
}
