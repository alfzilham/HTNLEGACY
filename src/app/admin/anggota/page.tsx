import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { computeStatusTampil } from "@/lib/status";
import { AnggotaTableClient } from "./anggota-table-client";

export const dynamic = "force-dynamic";

export default async function AdminAnggotaPage() {
  const [anggota, settings] = await Promise.all([
    db.anggota.findMany({
      orderBy: [{ gender: "asc" }, { namaLengkap: "asc" }],
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
  ]);

  const now = new Date();
  const list = anggota.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    statusTampil: computeStatusTampil(a.status, settings.deadlineTanggal, now),
  }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Data Anggota</h1>
        <p className="text-sm font-semibold text-[#6b6b6b]">
          {anggota.length} anggota terdaftar — kelola, lihat password, ubah status
        </p>
      </header>
      <AnggotaTableClient anggota={list} nominalIuran={settings.nominalIuran} />
    </div>
  );
}
