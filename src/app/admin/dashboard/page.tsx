import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { computeStatusTampil, formatRupiah, getPeriodeBulan } from "@/lib/status";
import Link from "next/link";
import { Users, Image as ImageIcon, Wallet, Settings as SettingsIcon, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [anggota, strukPending, transaksi, settings] = await Promise.all([
    db.anggota.findMany({ orderBy: { namaLengkap: "asc" } }),
    db.struk.count({ where: { statusStruk: "PENDING" } }),
    db.transaksi.findMany({ where: { periodeBulan: getPeriodeBulan() } }),
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

  const stats = [
    {
      label: "Total Anggota",
      value: anggota.length.toString(),
      icon: Users,
      bg: "var(--accent-secondary)",
      fg: "#ffffff",
    },
    {
      label: "Struk Pending",
      value: strukPending.toString(),
      icon: ImageIcon,
      bg: "var(--status-pending)",
      fg: "#78350f",
    },
    {
      label: `Kas Masuk ${getPeriodeBulan()}`,
      value: formatRupiah(masuk),
      icon: Wallet,
      bg: "var(--status-lunas)",
      fg: "#14532d",
    },
    {
      label: `Kas Keluar ${getPeriodeBulan()}`,
      value: formatRupiah(keluar),
      icon: Wallet,
      bg: "var(--status-tertunggak)",
      fg: "#7f1d1d",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard Admin</h1>
        <p className="text-sm font-semibold text-[#6b6b6b]">
          Ringkasan status iuran bulan {getPeriodeBulan()}
        </p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="brutal-card p-4">
              <div
                className="flex items-center justify-center w-9 h-9 mb-3"
                style={{
                  background: s.bg,
                  border: "2.5px solid var(--ink)",
                  borderRadius: 8,
                }}
              >
                <Icon size={18} strokeWidth={2.5} color={s.fg} />
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
            <div className="text-3xl font-extrabold tabular-nums" style={{ color: "#7f1d1d" }}>
              {tertunggak}
            </div>
            <div className="text-xs font-bold mt-1" style={{ color: "#7f1d1d" }}>
              TERTUNGGAK
            </div>
          </div>
        </div>
        <p className="text-xs text-[#6b6b6b] font-semibold mt-3">
          TERTUNGGAK dihitung on-the-fly: anggota BELUM_LUNAS setelah tanggal {settings.deadlineTanggal}. Nominal iuran saat ini: {formatRupiah(settings.nominalIuran)}.
        </p>
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/struk" className="brutal-card p-5 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform">
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
        <Link href="/admin/settings" className="brutal-card p-5 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform">
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
                  Iuran, deadline, kontak
                </div>
              </div>
            </div>
            <ArrowRight size={20} strokeWidth={2.5} />
          </div>
        </Link>
      </section>
    </div>
  );
}
