"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  FileSpreadsheet,
  Download,
} from "lucide-react";

type Result = {
  ok: boolean;
  total: number;
  inserted: number;
  skipped: number;
  insertedList: { namaLengkap: string; gender: string }[];
  skippedList: { namaLengkap: string; gender: string; reason: string }[];
};

export default function AdminImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function onPickFile(f: File | null) {
    setFile(f);
    setResult(null);
    setErr(null);
    if (f) {
      setShowWarning(true);
    }
  }

  async function doImport() {
    if (!file) return;
    setShowWarning(false);
    setLoading(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/anggota/import", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal import");
      setResult(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal import");
    } finally {
      setLoading(false);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function downloadTemplate() {
    const template = [
      { gender: "PRIA", namaLengkap: "Contoh Pria 1", noHpWa: "081234567890", password: "password123" },
      { gender: "WANITA", namaLengkap: "Contoh Wanita 1", noHpWa: "089876543210", password: "password456" },
    ];
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-import-anggota.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Import Data Anggota</h1>
        <p className="text-sm font-semibold text-[#6b6b6b]">
          Import massal dari file Excel (.xlsx) atau JSON — skip duplikat otomatis
        </p>
      </header>

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
          <XCircle size={16} strokeWidth={2.5} />
          <span>{err}</span>
        </div>
      )}

      {/* Info & template */}
      <section className="brutal-card p-5">
        <h2 className="font-extrabold text-lg mb-3 flex items-center gap-2">
          <FileText size={20} strokeWidth={2.5} />
          Format File
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div
            className="p-3"
            style={{ background: "var(--bg-base)", border: "2px solid var(--ink)", borderRadius: 8 }}
          >
            <div className="font-bold mb-1">Excel (.xlsx)</div>
            <p className="text-xs font-semibold text-[#6b6b6b]">
              Kolom header: <code className="font-mono">gender, namaLengkap, noHpWa, password</code>
            </p>
          </div>
          <div
            className="p-3"
            style={{ background: "var(--bg-base)", border: "2px solid var(--ink)", borderRadius: 8 }}
          >
            <div className="font-bold mb-1">JSON</div>
            <p className="text-xs font-semibold text-[#6b6b6b]">
              Array of object: <code className="font-mono">[{"{gender,namaLengkap,noHpWa,password}"}]</code>
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={downloadTemplate}
            className="brutal-btn brutal-btn-neutral px-3 py-2 text-sm"
          >
            <Download size={14} strokeWidth={2.5} />
            <span>Download Template JSON</span>
          </button>
        </div>
        <div
          className="mt-3 p-3 text-xs font-semibold"
          style={{
            background: "var(--status-pending-bg)",
            border: "2px solid var(--status-pending)",
            borderRadius: 6,
            color: "#78350f",
          }}
        >
          <b>Aturan validasi:</b>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li><code>gender</code>: PRIA atau WANITA (case-insensitive)</li>
            <li><code>namaLengkap</code>: min 2 karakter, kombinasi nama+gender harus unik</li>
            <li><code>noHpWa</code>: format Indonesia valid (08xxx / 628xxx)</li>
            <li><code>password</code>: min 6 karakter (disimpan terenkripsi AES-256)</li>
            <li>Duplikat nama+gender akan di-skip, tidak ditimpa</li>
          </ul>
        </div>
      </section>

      {/* Upload zone */}
      <section className="brutal-card p-5">
        <h2 className="font-extrabold text-lg mb-3 flex items-center gap-2">
          <Upload size={20} strokeWidth={2.5} />
          Upload File
        </h2>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.json"
          className="sr-only"
          onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="brutal-btn brutal-btn-neutral px-4 py-8 w-full flex-col gap-2"
          style={{ borderStyle: "dashed" }}
        >
          {file ? (
            <>
              <FileSpreadsheet size={28} strokeWidth={2.5} />
              <span className="text-sm font-bold">{file.name}</span>
              <span className="text-xs font-semibold text-[#6b6b6b]">
                {(file.size / 1024).toFixed(1)} KB — klik untuk ganti
              </span>
            </>
          ) : (
            <>
              <Upload size={28} strokeWidth={2.5} />
              <span className="text-sm font-bold">Pilih File .xlsx atau .json</span>
              <span className="text-xs font-semibold text-[#6b6b6b]">
                Maks 500 baris per import
              </span>
            </>
          )}
        </button>
      </section>

      {/* Result */}
      {result && (
        <section className="brutal-card p-5">
          <h2 className="font-extrabold text-lg mb-3 flex items-center gap-2">
            <CheckCircle2 size={20} strokeWidth={2.5} color="#14532d" />
            Hasil Import
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div
              className="p-4 text-center"
              style={{ background: "var(--bg-base)", border: "3px solid var(--ink)", borderRadius: 8 }}
            >
              <div className="text-2xl font-extrabold tabular-nums">{result.total}</div>
              <div className="text-xs font-bold mt-1 text-[#6b6b6b]">TOTAL</div>
            </div>
            <div
              className="p-4 text-center"
              style={{ background: "var(--status-lunas-bg)", border: "3px solid #14532d", borderRadius: 8 }}
            >
              <div className="text-2xl font-extrabold tabular-nums" style={{ color: "#14532d" }}>
                {result.inserted}
              </div>
              <div className="text-xs font-bold mt-1" style={{ color: "#14532d" }}>BERHASIL</div>
            </div>
            <div
              className="p-4 text-center"
              style={{ background: "var(--status-pending-bg)", border: "3px solid var(--status-pending)", borderRadius: 8 }}
            >
              <div className="text-2xl font-extrabold tabular-nums" style={{ color: "#78350f" }}>
                {result.skipped}
              </div>
              <div className="text-xs font-bold mt-1" style={{ color: "#78350f" }}>DILEWATI</div>
            </div>
          </div>

          {result.skippedList.length > 0 && (
            <div>
              <h3 className="font-bold text-sm mb-2">Detail yang Dilewati:</h3>
              <div className="max-h-60 overflow-y-auto">
                <div className="flex flex-col gap-1.5">
                  {result.skippedList.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 text-xs"
                      style={{
                        background: "var(--bg-base)",
                        border: "1.5px solid var(--ink)",
                        borderRadius: 6,
                      }}
                    >
                      <XCircle size={12} strokeWidth={2.5} className="shrink-0" color="#7f1d1d" />
                      <span className="font-bold">{s.namaLengkap}</span>
                      <span className="text-[#6b6b6b]">({s.gender})</span>
                      <span className="text-[#6b6b6b] ml-auto">{s.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Warning modal */}
      {showWarning && file && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Peringatan import"
        >
          <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
          <div
            className="relative brutal-card w-full max-w-md p-5"
            style={{ borderColor: "var(--status-pending)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="flex items-center justify-center w-10 h-10"
                style={{
                  background: "var(--status-pending)",
                  border: "2.5px solid var(--ink)",
                  borderRadius: 8,
                }}
              >
                <AlertTriangle size={20} strokeWidth={2.5} color="#78350f" />
              </div>
              <div>
                <h3 className="font-extrabold">Peringatan Import</h3>
                <p className="text-xs font-semibold text-[#6b6b6b]">
                  Baca baik-baik sebelum lanjut
                </p>
              </div>
            </div>
            <div
              className="p-3 mb-4 text-sm font-semibold flex flex-col gap-2"
              style={{ background: "var(--status-pending-bg)", border: "2px solid var(--status-pending)", borderRadius: 6, color: "#78350f" }}
            >
              <p>• Data dengan <b>nama + gender yang sama</b> akan <b>dilewati</b>, tidak ditimpa.</p>
              <p>• Password di file akan <b>tersimpan terenkripsi</b>. Pastikan sumber file terpercaya.</p>
              <p>• Proses tidak dapat dibatalkan di tengah jalan.</p>
              <p>• Maks 500 baris per import.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowWarning(false);
                  setFile(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="brutal-btn brutal-btn-neutral px-4 py-2.5 flex-1"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={doImport}
                disabled={loading}
                className="brutal-btn brutal-btn-primary px-4 py-2.5 flex-1"
              >
                {loading ? <Loader2 size={16} strokeWidth={2.5} className="animate-spin" /> : <Upload size={16} strokeWidth={2.5} />}
                <span>{loading ? "Memproses..." : "Lanjut Import"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
