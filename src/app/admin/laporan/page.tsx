"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileArchive,
  Download,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Lock,
  X,
} from "lucide-react";

type Info = {
  periode: string;
  strukApproved: number;
  anggotaLunas: number;
  totalKasMasuk: number;
  nominalIuran: number;
  deadlineTanggal: number;
};

export default function AdminLaporanPage() {
  const router = useRouter();
  const [info, setInfo] = useState<Info | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [step, setStep] = useState<"idle" | "downloading" | "confirm-reset" | "done">("idle");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloaded, setDownloaded] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/laporan/info");
        if (!res.ok) throw new Error("Gagal memuat info");
        const data = await res.json();
        setInfo(data);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Gagal memuat");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function startTutupBulan() {
    setStep("downloading");
    setDownloadProgress(0);
    setDownloaded(false);
    setErr(null);

    try {
      // Fetch .zip sebagai blob
      const res = await fetch("/api/laporan/generate", { method: "POST" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Gagal generate laporan");
      }

      // Track progress via reader
      const contentLength = Number(res.headers.get("Content-Length") ?? 0);
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Stream tidak tersedia");

      const chunks: Uint8Array[] = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          if (contentLength > 0) {
            setDownloadProgress(Math.round((received / contentLength) * 100));
          }
        }
      }

      const blob = new Blob(chunks as BlobPart[], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-${info?.periode ?? "bulanan"}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Beri jeda untuk memastikan download ter-trigger
      await new Promise((r) => setTimeout(r, 800));
      URL.revokeObjectURL(url);

      setDownloadProgress(100);
      setDownloaded(true);
      // Setelah download sukses, transisi ke modal 2 (konfirmasi reset)
      setTimeout(() => setStep("confirm-reset"), 600);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal download");
      setStep("idle");
    }
  }

  async function doReset() {
    setResetLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/laporan/reset-siklus", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Gagal reset");
      setResetResult(d.message);
      setStep("done");
      // Refresh info
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal reset");
    } finally {
      setResetLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="brutal-card p-6 text-center text-[#6b6b6b] font-semibold">
        Gagal memuat info laporan.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {err && (
        <div
          className="px-4 py-3 text-sm font-semibold flex items-center gap-2"
          style={{
            background: "var(--status-tertunggak-bg)",
            border: "3px solid var(--status-tertunggak)",
            borderRadius: 8,
            color: "#7f1d1d",
          }}
          role="alert"
        >
          <AlertTriangle size={16} strokeWidth={2.5} />
          <span>{err}</span>
        </div>
      )}

      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Laporan &amp; Reset Siklus</h1>
        <p className="text-sm font-semibold text-[#6b6b6b]">
          Tutup buku bulanan: unduh arsip .zip, lalu reset status anggota
        </p>
      </header>

      {/* Info periode */}
      <section className="brutal-card p-5">
        <h2 className="font-extrabold text-lg mb-4">Status Periode {info.periode}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            className="p-4 text-center"
            style={{ background: "var(--status-lunas-bg)", border: "3px solid #14532d", borderRadius: 8 }}
          >
            <div className="text-2xl font-extrabold tabular-nums" style={{ color: "#14532d" }}>
              {info.anggotaLunas}
            </div>
            <div className="text-xs font-bold mt-1" style={{ color: "#14532d" }}>ANGGOTA LUNAS</div>
          </div>
          <div
            className="p-4 text-center"
            style={{ background: "var(--bg-base)", border: "3px solid var(--ink)", borderRadius: 8 }}
          >
            <div className="text-2xl font-extrabold tabular-nums">{info.strukApproved}</div>
            <div className="text-xs font-bold mt-1 text-[#6b6b6b]">STRUK APPROVED</div>
          </div>
          <div
            className="p-4 text-center"
            style={{ background: "var(--accent-primary)", border: "3px solid var(--ink)", borderRadius: 8 }}
          >
            <div className="text-xl font-extrabold tabular-nums break-all">
              Rp {info.totalKasMasuk.toLocaleString("id-ID")}
            </div>
            <div className="text-xs font-bold mt-1">KAS MASUK</div>
          </div>
          <div
            className="p-4 text-center"
            style={{ background: "var(--bg-base)", border: "3px solid var(--ink)", borderRadius: 8 }}
          >
            <div className="text-2xl font-extrabold tabular-nums">Rp {info.nominalIuran.toLocaleString("id-ID")}</div>
            <div className="text-xs font-bold mt-1 text-[#6b6b6b]">IURAN/BLN</div>
          </div>
        </div>
      </section>

      {/* Tombol mulai */}
      <section className="brutal-card p-6">
        <div className="flex items-start gap-4">
          <div
            className="flex items-center justify-center w-14 h-14 shrink-0"
            style={{
              background: "var(--accent-primary)",
              border: "3px solid var(--ink)",
              borderRadius: 12,
              boxShadow: "4px 4px 0px var(--ink)",
            }}
          >
            <FileArchive size={28} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h2 className="font-extrabold text-lg">Mulai Tutup Bulan</h2>
            <p className="text-sm font-semibold text-[#6b6b6b] mt-1 mb-3">
              Proses dua langkah:
            </p>
            <ol className="list-decimal list-inside text-sm font-semibold space-y-1 mb-4">
              <li><b>Unduh laporan .zip</b> — berisi seluruh gambar struk + rekap Excel. Modal tidak bisa ditutup sebelum download selesai.</li>
              <li><b>Konfirmasi reset storage</b> — hapus file struk + reset status anggota ke BELUM_LUNAS. Boleh dibatalkan. Transaksi TIDAK dihapus.</li>
            </ol>
            <button
              type="button"
              onClick={startTutupBulan}
              disabled={step !== "idle"}
              className="brutal-btn brutal-btn-primary px-5 py-3"
            >
              <Download size={18} strokeWidth={2.5} />
              <span>Mulai Tutup Bulan</span>
            </button>
          </div>
        </div>
      </section>

      {/* MODAL 1 — Wajib Download (tidak bisa ditutup) */}
      {step === "downloading" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Unduh laporan wajib"
        >
          <div className="absolute inset-0 bg-black/70" aria-hidden="true" />
          <div
            className="relative brutal-card w-full max-w-md p-6"
            style={{ borderColor: "var(--accent-primary)", borderWidth: 4 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex items-center justify-center w-12 h-12"
                style={{
                  background: "var(--accent-primary)",
                  border: "3px solid var(--ink)",
                  borderRadius: 10,
                }}
              >
                <Lock size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-extrabold text-lg">Unduhan Wajib</h3>
                <p className="text-xs font-semibold text-[#6b6b6b]">
                  Modal ini tidak bisa ditutup sebelum download selesai
                </p>
              </div>
            </div>

            {!downloaded ? (
              <div>
                <p className="text-sm font-semibold mb-3">
                  {downloadProgress === 0
                    ? "Menyiapkan arsip .zip..."
                    : `Mengunduh... ${downloadProgress}%`}
                </p>
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
                      width: `${downloadProgress}%`,
                      background: "var(--accent-primary)",
                    }}
                  />
                </div>
                <div className="flex items-center justify-center py-2">
                  <Loader2 size={20} strokeWidth={2.5} className="animate-spin" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-4">
                <div
                  className="flex items-center justify-center w-14 h-14 mb-3"
                  style={{
                    background: "var(--status-lunas)",
                    border: "3px solid #14532d",
                    borderRadius: 12,
                  }}
                >
                  <CheckCircle2 size={28} strokeWidth={2.5} color="#14532d" />
                </div>
                <h3 className="font-extrabold text-lg">Download Selesai</h3>
                <p className="text-sm font-semibold text-[#6b6b6b] mt-1">
                  File .zip telah tersimpan di perangkat Anda.
                </p>
                <p className="text-xs font-semibold text-[#6b6b6b] mt-2">
                  Melanjutkan ke konfirmasi reset...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2 — Konfirmasi Reset (boleh dibatalkan) */}
      {step === "confirm-reset" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi reset siklus"
        >
          <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
          <div className="relative brutal-card w-full max-w-md p-5">
            <button
              type="button"
              onClick={() => setStep("idle")}
              className="brutal-btn brutal-btn-ghost p-1.5 absolute top-3 right-3"
              aria-label="Tutup"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="flex items-center justify-center w-10 h-10"
                style={{
                  background: "var(--status-tertunggak)",
                  border: "2.5px solid var(--ink)",
                  borderRadius: 8,
                }}
              >
                <ShieldAlert size={20} strokeWidth={2.5} color="#ffffff" />
              </div>
              <div>
                <h3 className="font-extrabold">Bersihkan Storage &amp; Reset?</h3>
                <p className="text-xs font-semibold text-[#6b6b6b]">
                  File laporan sudah aman terunduh
                </p>
              </div>
            </div>
            <div
              className="p-3 mb-4 text-sm font-semibold flex flex-col gap-2"
              style={{
                background: "var(--status-tertunggak-bg)",
                border: "2px solid var(--status-tertunggak)",
                borderRadius: 6,
                color: "#7f1d1d",
              }}
            >
              <p>Tindakan ini akan:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Menghapus seluruh file struk di storage periode {info.periode}</li>
                <li>Reset <b>{info.anggotaLunas} anggota</b> dari LUNAS → BELUM_LUNAS</li>
              </ul>
              <p className="mt-1">
                <b>Transaksi &amp; data grafik kas TIDAK dihapus</b> — tetap sebagai riwayat permanen.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("idle")}
                disabled={resetLoading}
                className="brutal-btn brutal-btn-neutral px-4 py-2.5 flex-1"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={doReset}
                disabled={resetLoading}
                className="brutal-btn brutal-btn-danger px-4 py-2.5 flex-1"
              >
                {resetLoading ? <Loader2 size={16} strokeWidth={2.5} className="animate-spin" /> : <RefreshCw size={16} strokeWidth={2.5} />}
                <span>Ya, Reset Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3 — Done */}
      {step === "done" && resetResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Reset selesai"
        >
          <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
          <div className="relative brutal-card w-full max-w-md p-6">
            <div className="flex flex-col items-center text-center">
              <div
                className="flex items-center justify-center w-14 h-14 mb-3"
                style={{
                  background: "var(--status-lunas)",
                  border: "3px solid #14532d",
                  borderRadius: 12,
                }}
              >
                <CheckCircle2 size={28} strokeWidth={2.5} color="#14532d" />
              </div>
              <h3 className="font-extrabold text-lg">Siklus Direset</h3>
              <p className="text-sm font-semibold text-[#6b6b6b] mt-2">{resetResult}</p>
              <button
                type="button"
                onClick={() => {
                  setStep("idle");
                  setResetResult(null);
                  router.refresh();
                }}
                className="brutal-btn brutal-btn-primary px-5 py-2.5 mt-4"
              >
                <span>Selesai</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
