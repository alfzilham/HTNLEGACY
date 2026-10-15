import { AppShell } from "@/components/app-shell";
import { AnggotaListClient } from "@/components/anggota-list-client";
import { StatusBadge } from "@/components/status-badge";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getCurrentAnggota } from "@/lib/auth";
import { computeStatusTampil, formatRupiah, getPeriodeBulan } from "@/lib/status";
import { formatPeriodeLabel } from "@/lib/periode";
import { TrendingUp, Users, CheckCircle2, AlertTriangle, CircleDashed, ArrowRight, QrCode, User } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BerandaPage() {
  const me = await getCurrentAnggota();
  const [anggota, settings, activeStruk] = await Promise.all([
    db.anggota.findMany({
      orderBy: [{ gender: "asc" }, { namaLengkap: "asc" }],
      select: {
        id: true,
        gender: true,
        namaLengkap: true,
        noHpWa: true,
        status: true,
      },
    }),
    getSettings(),
    db.struk.findMany({
      where: { periodeBulan: getPeriodeBulan(), statusStruk: { in: ["PENDING", "APPROVED"] } },
      select: { anggotaId: true, statusStruk: true },
    }),
  ]);

  const activeByAnggota = new Map(activeStruk.map((s) => [s.anggotaId, s.statusStruk]));

  const now = new Date();
  const list = anggota.map((a) => ({
    ...a,
    statusTampil: computeStatusTampil(a.status, settings.deadlineTanggal, now),
    receiptAktif: activeByAnggota.get(a.id) ?? null,
  }));

  const total = anggota.length;
  const lunas = list.filter((a) => a.statusTampil === "LUNAS").length;
  const belumLunas = list.filter((a) => a.statusTampil === "BELUM_LUNAS").length;
  const tertunggak = list.filter((a) => a.statusTampil === "TERTUNGGAK").length;
  const pct = total > 0 ? Math.round((lunas / total) * 100) : 0;
  const periode = getPeriodeBulan(now);
  const target = total * settings.nominalIuran;
  const terkumpul = lunas * settings.nominalIuran;

  // My status
  const myAnggota = me ? anggota.find((a) => a.id === me.id) : null;
  const myStatus = myAnggota
    ? computeStatusTampil(myAnggota.status, settings.deadlineTanggal, now)
    : "BELUM_LUNAS";

  // Style berdasarkan status
  const statusStyle =
    myStatus === "LUNAS"
      ? { bg: "var(--status-lunas-bg)", border: "#14532d", color: "#14532d", icon: CheckCircle2 }
      : myStatus === "TERTUNGGAK"
      ? { bg: "var(--status-tertunggak-bg)", border: "#7f1d1d", color: "#7f1d1d", icon: AlertTriangle }
      : { bg: "#f3f0e7", border: "var(--ink)", color: "var(--ink)", icon: CircleDashed };
  const StatusIcon = statusStyle.icon;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Beranda
          </h1>
          <p className="text-sm font-semibold text-[#6b6b6b]">
            Halo, {me?.namaLengkap ?? "Anggota"} — periode iuran{" "}
            <b>{periode}</b>
          </p>
        </header>

        {/* Status Anda banner */}
        <section
          className="brutal-card p-5"
          style={{ background: statusStyle.bg, borderColor: statusStyle.border }}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div
              className="flex items-center justify-center w-14 h-14 shrink-0"
              style={{
                background: "var(--surface)",
                border: `3px solid ${statusStyle.border}`,
                borderRadius: 12,
                boxShadow: "4px 4px 0px var(--ink)",
              }}
            >
              <StatusIcon size={28} strokeWidth={2.5} color={statusStyle.color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold uppercase tracking-wide" style={{ color: statusStyle.color }}>
                Status Iuran Anda
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-2xl font-extrabold" style={{ color: statusStyle.color }}>
                  {myStatus === "LUNAS" ? "Lunas" : myStatus === "TERTUNGGAK" ? "Tertunggak" : "Belum Lunas"}
                </span>
                <StatusBadge status={myStatus as "LUNAS" | "BELUM_LUNAS" | "TERTUNGGAK"} />
              </div>
              <p className="text-sm font-semibold mt-1" style={{ color: statusStyle.color, opacity: 0.85 }}>
                {myStatus === "LUNAS"
                  ? `Terima kasih, iuran ${formatPeriodeLabel(periode)} sudah lunas! 🎉`.replace("🎉", "")
                  : myStatus === "TERTUNGGAK"
                  ? `Lewat deadline (tgl ${settings.deadlineTanggal}). Segera bayar iuran ${formatRupiah(settings.nominalIuran)}.`
                  : `Iuran ${formatRupiah(settings.nominalIuran)} — bayar sebelum tgl ${settings.deadlineTanggal}.`}
              </p>
            </div>
            {myStatus !== "LUNAS" && (
              <Link
                href="/barcode"
                className="brutal-btn brutal-btn-primary px-4 py-2.5 shrink-0"
              >
                <QrCode size={16} strokeWidth={2.5} />
                <span>Bayar Sekarang</span>
                <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
            )}
            <Link
              href="/profil"
              className="brutal-btn brutal-btn-neutral px-4 py-2.5 shrink-0"
            >
              <User size={16} strokeWidth={2.5} />
              <span>Profil</span>
            </Link>
          </div>
        </section>

        {/* Progress bar */}
        <section className="brutal-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} strokeWidth={2.5} />
              <h2 className="font-extrabold text-lg">Progres Iuran Bulan Ini</h2>
            </div>
            <span className="text-2xl font-extrabold tabular-nums" style={{ color: "#14532d" }}>
              {pct}%
            </span>
          </div>
          <div
            className="h-6 mb-3"
            style={{
              background: "var(--bg-base)",
              border: "3px solid var(--ink)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              className="h-full transition-all"
              style={{
                width: `${pct}%`,
                background: "var(--status-lunas)",
                borderRight: pct > 0 && pct < 100 ? "3px solid var(--ink)" : "none",
              }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div
              className="p-3 text-center"
              style={{ background: "var(--status-lunas-bg)", border: "2.5px solid #14532d", borderRadius: 8 }}
            >
              <div className="text-xl font-extrabold tabular-nums" style={{ color: "#14532d" }}>{lunas}</div>
              <div className="text-[10px] font-bold mt-0.5" style={{ color: "#14532d" }}>LUNAS</div>
            </div>
            <div
              className="p-3 text-center"
              style={{ background: "#f3f0e7", border: "2.5px solid var(--ink)", borderRadius: 8 }}
            >
              <div className="text-xl font-extrabold tabular-nums">{belumLunas}</div>
              <div className="text-[10px] font-bold mt-0.5">BELUM LUNAS</div>
            </div>
            <div
              className="p-3 text-center"
              style={{ background: "var(--status-tertunggak-bg)", border: "2.5px solid #7f1d1d", borderRadius: 8 }}
            >
              <div className="text-xl font-extrabold tabular-nums" style={{ color: "#7f1d1d" }}>{tertunggak}</div>
              <div className="text-[10px] font-bold mt-0.5" style={{ color: "#7f1d1d" }}>TERTUNGGAK</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center justify-between gap-2 p-3" style={{ background: "var(--bg-base)", border: "2px solid var(--ink)", borderRadius: 8 }}>
              <span className="font-semibold text-[#6b6b6b] flex items-center gap-1.5">
                <Users size={14} strokeWidth={2.5} /> Total Anggota
              </span>
              <span className="font-extrabold tabular-nums">{total}</span>
            </div>
            <div className="flex items-center justify-between gap-2 p-3" style={{ background: "var(--bg-base)", border: "2px solid var(--ink)", borderRadius: 8 }}>
              <span className="font-semibold text-[#6b6b6b] flex items-center gap-1.5">
                <CheckCircle2 size={14} strokeWidth={2.5} /> Terkumpul
              </span>
              <span className="font-extrabold tabular-nums">{formatRupiah(terkumpul)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 p-3" style={{ background: "var(--bg-base)", border: "2px solid var(--ink)", borderRadius: 8 }}>
              <span className="font-semibold text-[#6b6b6b] flex items-center gap-1.5">
                <TrendingUp size={14} strokeWidth={2.5} /> Target
              </span>
              <span className="font-extrabold tabular-nums">{formatRupiah(target)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 p-3" style={{ background: "var(--bg-base)", border: "2px solid var(--ink)", borderRadius: 8 }}>
              <span className="font-semibold text-[#6b6b6b] flex items-center gap-1.5">
                <AlertTriangle size={14} strokeWidth={2.5} /> Deadline
              </span>
              <span className="font-extrabold tabular-nums">Tgl {settings.deadlineTanggal}</span>
            </div>
          </div>
        </section>

        {/* Breakdown per gender */}
        <section className="brutal-card p-5">
          <h2 className="font-extrabold text-lg mb-4 flex items-center gap-2">
            <Users size={20} strokeWidth={2.5} />
            Partisipasi per Gender
          </h2>
          {(() => {
            const pria = list.filter((a) => a.gender === "PRIA");
            const wanita = list.filter((a) => a.gender === "WANITA");
            const priaLunas = pria.filter((a) => a.statusTampil === "LUNAS").length;
            const wanitaLunas = wanita.filter((a) => a.statusTampil === "LUNAS").length;
            const priaPct = pria.length > 0 ? Math.round((priaLunas / pria.length) * 100) : 0;
            const wanitaPct = wanita.length > 0 ? Math.round((wanitaLunas / wanita.length) * 100) : 0;
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Pria", lunas: priaLunas, total: pria.length, pct: priaPct, color: "var(--accent-secondary)", fg: "#ffffff" },
                  { label: "Wanita", lunas: wanitaLunas, total: wanita.length, pct: wanitaPct, color: "#f9a8d4", fg: "#7f1d1d" },
                ].map((g) => (
                  <div key={g.label} className="p-4" style={{ background: "var(--bg-base)", border: "2.5px solid var(--ink)", borderRadius: 10 }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex items-center justify-center w-8 h-8"
                          style={{ background: g.color, border: "2px solid var(--ink)", borderRadius: 6 }}
                        >
                          <span className="font-extrabold text-xs" style={{ color: g.fg }}>
                            {g.label[0]}
                          </span>
                        </div>
                        <span className="font-extrabold">{g.label}</span>
                      </div>
                      <span className="text-lg font-extrabold tabular-nums">{g.pct}%</span>
                    </div>
                    <div
                      className="h-3 mb-2"
                      style={{ background: "var(--surface)", border: "2px solid var(--ink)", borderRadius: 999, overflow: "hidden" }}
                    >
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${g.pct}%`,
                          background: g.pct === 100 ? "var(--status-lunas)" : g.color,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold text-[#6b6b6b]">
                      <span>{g.lunas} dari {g.total} lunas</span>
                      {g.pct === 100 && g.total > 0 && (
                        <span className="font-bold" style={{ color: "#14532d" }}>Selesai!</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </section>

        {/* Daftar anggota */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-lg">Daftar Anggota</h2>
            <span className="text-xs font-semibold text-[#6b6b6b]">
              Klik nama untuk upload struk
            </span>
          </div>
          <AnggotaListClient anggota={list} myId={me?.id ?? null} />
        </section>
      </div>
    </AppShell>
  );
}
