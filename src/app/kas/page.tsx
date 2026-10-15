import { AppShell } from "@/components/app-shell";
import { KasView } from "@/components/kas-view";
import { db } from "@/lib/db";
import { getPeriodeBulan } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function KasPage() {
  const bulan = getPeriodeBulan();
  const [list, all] = await Promise.all([
    db.transaksi.findMany({
      where: { periodeBulan: bulan },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    db.transaksi.findMany({
      select: { periodeBulan: true, tipe: true, nominal: true },
    }),
  ]);

  const bulanMap = new Map<string, { masuk: number; keluar: number }>();
  for (const t of all) {
    const cur = bulanMap.get(t.periodeBulan) ?? { masuk: 0, keluar: 0 };
    if (t.tipe === "MASUK") cur.masuk += t.nominal;
    else cur.keluar += t.nominal;
    bulanMap.set(t.periodeBulan, cur);
  }
  const perBulan = Array.from(bulanMap.entries())
    .map(([b, v]) => ({ bulan: b, ...v, saldo: v.masuk - v.keluar }))
    .sort((a, b) => a.bulan.localeCompare(b.bulan));

  const current = bulanMap.get(bulan) ?? { masuk: 0, keluar: 0 };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-extrabold tracking-tight">Grafik Kas</h1>
          <p className="text-sm font-semibold text-[#6b6b6b]">
            Pemasukan vs pengeluaran per bulan
          </p>
        </header>
        <KasView
          initial={{
            bulan,
            list,
            summary: {
              masuk: current.masuk,
              keluar: current.keluar,
              saldo: current.masuk - current.keluar,
            },
            perBulan,
          }}
          canEdit={false}
        />
      </div>
    </AppShell>
  );
}
