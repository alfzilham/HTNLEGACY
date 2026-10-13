import { db } from "@/lib/db";
import { parseOcrResult } from "@/lib/ocr";
import { getPeriodeBulan } from "@/lib/status";
import { StrukListClient } from "./struk-list-client";
import { Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminStrukPage() {
  const periode = getPeriodeBulan();
  const strukList = await db.struk.findMany({
    where: { periodeBulan: periode },
    include: {
      anggota: {
        select: { id: true, namaLengkap: true, gender: true, noHpWa: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const pending = strukList.filter((s) => s.statusStruk === "PENDING");
  const decided = strukList.filter((s) => s.statusStruk !== "PENDING");

  const parsed = strukList.map((s) => ({
    ...s,
    ocrParsed: parseOcrResult(s.ocrRawText),
  }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Verifikasi Struk</h1>
        <p className="text-sm font-semibold text-[#6b6b6b]">
          Periode {periode} — {pending.length} pending, {decided.length} sudah diproses
        </p>
      </header>

      {strukList.length === 0 ? (
        <div className="brutal-card p-10 flex flex-col items-center text-center gap-3">
          <div
            className="flex items-center justify-center w-16 h-16"
            style={{
              background: "var(--bg-base)",
              border: "3px solid var(--ink)",
              borderRadius: 12,
            }}
          >
            <Inbox size={28} strokeWidth={2} className="text-[#9a9a9a]" />
          </div>
          <h2 className="font-extrabold text-lg">Belum ada struk</h2>
          <p className="text-sm font-semibold text-[#6b6b6b] max-w-sm">
            Anggota yang upload struk pembayaran akan muncul di sini untuk diverifikasi.
          </p>
        </div>
      ) : (
        <StrukListClient strukList={parsed} periode={periode} />
      )}
    </div>
  );
}
