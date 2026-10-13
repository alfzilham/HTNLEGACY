import { AppShell } from "@/components/app-shell";
import { AnggotaListClient } from "@/components/anggota-list-client";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getCurrentAnggota } from "@/lib/auth";
import { computeStatusTampil } from "@/lib/status";
import { StatusBadge } from "@/components/status-badge";
import { CheckCircle2, CircleDashed, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

const CONFIG: Record<
  "lunas" | "belum-lunas" | "tertunggak",
  {
    title: string;
    filter: "LUNAS" | "BELUM_LUNAS" | "TERTUNGGAK";
    bg: string;
    fg: string;
    border: string;
    icon: React.ElementType;
    desc: string;
  }
> = {
  lunas: {
    title: "Anggota Lunas",
    filter: "LUNAS",
    bg: "var(--status-lunas-bg)",
    fg: "#14532d",
    border: "#14532d",
    icon: CheckCircle2,
    desc: "Anggota yang sudah membayar iuran bulan ini (struk approved).",
  },
  "belum-lunas": {
    title: "Anggota Belum Lunas",
    filter: "BELUM_LUNAS",
    bg: "#f3f0e7",
    fg: "var(--ink)",
    border: "var(--ink)",
    icon: CircleDashed,
    desc: "Anggota yang belum membayar — masih dalam batas waktu (sebelum deadline).",
  },
  tertunggak: {
    title: "Anggota Tertunggak",
    filter: "TERTUNGGAK",
    bg: "var(--status-tertunggak-bg)",
    fg: "#7f1d1d",
    border: "#7f1d1d",
    icon: AlertTriangle,
    desc: "Anggota belum bayar & sudah lewat deadline. Dihitung on-the-fly.",
  },
};

export default async function DaftarPage({
  params,
}: {
  params: Promise<{ jenis: "lunas" | "belum-lunas" | "tertunggak" }>;
}) {
  const { jenis } = await params;
  const cfg = CONFIG[jenis];
  const Icon = cfg.icon;
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
  const list = anggota
    .map((a) => ({
      ...a,
      statusTampil: computeStatusTampil(a.status, settings.deadlineTanggal, now),
    }))
    .filter((a) => a.statusTampil === cfg.filter);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <header
          className="brutal-card p-5"
          style={{ background: cfg.bg, borderColor: cfg.border }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-12 h-12 shrink-0"
              style={{
                background: "var(--surface)",
                border: `3px solid ${cfg.border}`,
                borderRadius: 10,
              }}
            >
              <Icon size={24} strokeWidth={2.5} color={cfg.fg} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: cfg.fg }}>
                {cfg.title}
              </h1>
              <p className="text-sm font-semibold opacity-80" style={{ color: cfg.fg }}>
                {cfg.desc}
              </p>
            </div>
            <div
              className="ml-auto px-4 py-2 shrink-0"
              style={{
                background: "var(--surface)",
                border: `3px solid ${cfg.border}`,
                borderRadius: 999,
              }}
            >
              <span className="font-extrabold text-2xl tabular-nums" style={{ color: cfg.fg }}>
                {list.length}
              </span>
              <span className="text-xs font-bold ml-1" style={{ color: cfg.fg }}>
                anggota
              </span>
            </div>
          </div>
        </header>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-lg">Daftar</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#6b6b6b]">Status:</span>
              <StatusBadge status={cfg.filter} />
            </div>
          </div>
          {list.length === 0 ? (
            <div className="brutal-card-flat p-8 text-center text-[#6b6b6b] font-semibold">
              Tidak ada anggota dengan status ini.
            </div>
          ) : (
            <AnggotaListClient anggota={list} myId={me?.id ?? null} />
          )}
        </section>
      </div>
    </AppShell>
  );
}
