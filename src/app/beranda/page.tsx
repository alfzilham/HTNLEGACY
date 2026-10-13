import { AppShell } from "@/components/app-shell";
import { AnggotaListClient } from "@/components/anggota-list-client";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getCurrentAnggota } from "@/lib/auth";
import { computeStatusTampil, formatRupiah, getPeriodeBulan } from "@/lib/status";
import { TrendingUp, Users, CheckCircle2, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BerandaPage() {
  const me = await getCurrentAnggota();
  const [anggota, settings] = await Promise.all([
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
  ]);

  const now = new Date();
  const list = anggota.map((a) => ({
    ...a,
    statusTampil: computeStatusTampil(a.status, settings.deadlineTanggal, now),
  }));

  const total = anggota.length;
  const lunas = list.filter((a) => a.statusTampil === "LUNAS").length;
  const belumLunas = list.filter((a) => a.statusTampil === "BELUM_LUNAS").length;
  const tertunggak = list.filter((a) => a.statusTampil === "TERTUNGGAK").length;
  const pct = total > 0 ? Math.round((lunas / total) * 100) : 0;
  const periode = getPeriodeBulan(now);
  const target = total * settings.nominalIuran;
  const terkumpul = lunas * settings.nominalIuran;

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
