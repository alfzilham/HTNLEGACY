"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  Clock,
  Image as ImageIcon,
  Mars,
  Venus,
  Wallet,
  Calendar,
  Building2,
} from "lucide-react";
import { StatusBadge, statusBadgeFromStruk } from "@/components/status-badge";

type StrukItem = {
  id: string;
  imageUrl: string;
  statusStruk: string;
  ocrRawText: string | null;
  ocrSource: string | null;
  ocrParsed: {
    nominal: number | null;
    tanggal: string | null;
    namaBank: string | null;
    rawOcrText: string;
  } | null;
  ditolakAlasan: string | null;
  periodeBulan: string;
  createdAt: string;
  verifiedAt: string | null;
  anggota: {
    id: string;
    namaLengkap: string;
    gender: string;
    noHpWa: string;
  };
};

export function StrukListClient({
  strukList,
  periode,
}: {
  strukList: StrukItem[];
  periode: string;
}) {
  const router = useRouter();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // strukId being processed
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectAlasan, setRejectAlasan] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const pending = strukList.filter((s) => s.statusStruk === "PENDING");
  const decided = strukList.filter((s) => s.statusStruk !== "PENDING");
  const previewStruk = strukList.find((s) => s.id === previewId);
  const rejectStruk = strukList.find((s) => s.id === rejectId);

  async function handleApprove(id: string) {
    setActionLoading(id);
    setErr(null);
    try {
      const res = await fetch(`/api/struk/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal approve");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal approve");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject() {
    if (!rejectStruk) return;
    if (!rejectAlasan.trim()) {
      setErr("Alasan penolakan wajib diisi.");
      return;
    }
    setActionLoading(rejectStruk.id);
    setErr(null);
    try {
      const res = await fetch(`/api/struk/${rejectStruk.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", alasan: rejectAlasan.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal reject");
      setRejectId(null);
      setRejectAlasan("");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal reject");
    } finally {
      setActionLoading(null);
    }
  }

  function StrukCard({ s }: { s: StrukItem }) {
    return (
      <div className="brutal-card p-4">
        <div className="flex items-start gap-3">
          {/* Thumbnail */}
          <button
            type="button"
            onClick={() => setPreviewId(s.id)}
            className="shrink-0 w-20 h-20 flex items-center justify-center bg-[var(--bg-base)]"
            style={{ border: "2.5px solid var(--ink)", borderRadius: 8, overflow: "hidden" }}
            aria-label={`Lihat struk ${s.anggota.namaLengkap}`}
          >
            <img
              src={s.imageUrl}
              alt={`Struk ${s.anggota.namaLengkap}`}
              className="w-full h-full object-cover"
            />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                {s.anggota.gender === "PRIA" ? (
                  <Mars size={14} strokeWidth={2.5} className="shrink-0 text-[var(--accent-secondary)]" />
                ) : (
                  <Venus size={14} strokeWidth={2.5} className="shrink-0 text-[var(--accent-secondary)]" />
                )}
                <span className="font-bold truncate">{s.anggota.namaLengkap}</span>
              </div>
              <StatusBadge status={statusBadgeFromStruk(s.statusStruk)} />
            </div>

            {/* OCR summary */}
            {s.ocrParsed && (
              <div className="grid grid-cols-3 gap-1 text-xs mt-2">
                <div className="flex items-center gap-1 font-semibold text-[#6b6b6b]">
                  <Wallet size={11} strokeWidth={2.5} />
                  <span className="tabular-nums">
                    {s.ocrParsed.nominal
                      ? `Rp ${s.ocrParsed.nominal.toLocaleString("id-ID")}`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1 font-semibold text-[#6b6b6b]">
                  <Calendar size={11} strokeWidth={2.5} />
                  <span>{s.ocrParsed.tanggal ?? "—"}</span>
                </div>
                <div className="flex items-center gap-1 font-semibold text-[#6b6b6b]">
                  <Building2 size={11} strokeWidth={2.5} />
                  <span className="truncate">{s.ocrParsed.namaBank ?? "—"}</span>
                </div>
              </div>
            )}

            {/* Reject reason */}
            {s.statusStruk === "REJECTED" && s.ditolakAlasan && (
              <div
                className="mt-2 px-2 py-1 text-xs font-semibold"
                style={{
                  background: "var(--status-tertunggak-bg)",
                  border: "1.5px solid var(--status-tertunggak)",
                  borderRadius: 4,
                  color: "#7f1d1d",
                }}
              >
                Ditolak: {s.ditolakAlasan}
              </div>
            )}

            {/* Actions */}
            {s.statusStruk === "PENDING" && (
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => handleApprove(s.id)}
                  disabled={actionLoading === s.id}
                  className="brutal-btn px-3 py-1.5 text-xs"
                  style={{ background: "var(--status-lunas)", color: "#14532d" }}
                >
                  {actionLoading === s.id ? (
                    <Loader2 size={12} strokeWidth={2.5} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={12} strokeWidth={2.5} />
                  )}
                  <span>Approve</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectId(s.id);
                    setRejectAlasan("");
                    setErr(null);
                  }}
                  disabled={actionLoading === s.id}
                  className="brutal-btn brutal-btn-danger px-3 py-1.5 text-xs"
                >
                  <XCircle size={12} strokeWidth={2.5} />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewId(s.id)}
                  className="brutal-btn brutal-btn-neutral px-3 py-1.5 text-xs ml-auto"
                  aria-label="Lihat detail"
                >
                  <Eye size={12} strokeWidth={2.5} />
                  <span>Detail</span>
                </button>
              </div>
            )}

            {s.statusStruk !== "PENDING" && (
              <div className="mt-2 text-xs font-semibold text-[#6b6b6b]">
                {s.verifiedAt && `Diproses: ${new Date(s.verifiedAt).toLocaleString("id-ID")}`}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {err && (
        <div
          className="px-4 py-3 text-sm font-semibold"
          style={{
            background: "var(--status-tertunggak-bg)",
            border: "3px solid var(--status-tertunggak)",
            borderRadius: 8,
            color: "#7f1d1d",
          }}
          role="alert"
        >
          {err}
        </div>
      )}

      {/* Pending section */}
      <section>
        <h2 className="font-extrabold text-lg mb-3 flex items-center gap-2">
          <Clock size={18} strokeWidth={2.5} />
          Menunggu Verifikasi
          <span
            className="ml-1 px-2 py-0.5 text-xs font-bold"
            style={{
              background: "var(--status-pending)",
              border: "2px solid var(--ink)",
              borderRadius: 999,
            }}
          >
            {pending.length}
          </span>
        </h2>
        {pending.length === 0 ? (
          <div className="brutal-card-flat p-6 text-center text-[#6b6b6b] font-semibold text-sm">
            Tidak ada struk pending.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {pending.map((s) => (
              <StrukCard key={s.id} s={s} />
            ))}
          </div>
        )}
      </section>

      {/* Decided section */}
      {decided.length > 0 && (
        <section>
          <h2 className="font-extrabold text-lg mb-3">Sudah Diproses</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {decided.map((s) => (
              <StrukCard key={s.id} s={s} />
            ))}
          </div>
        </section>
      )}

      {/* Preview modal */}
      {previewStruk && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Preview struk"
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setPreviewId(null)}
            aria-hidden="true"
          />
          <div className="relative brutal-card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-lg">{previewStruk.anggota.namaLengkap}</h3>
                <p className="text-xs font-semibold text-[#6b6b6b]">
                  {previewStruk.anggota.gender} · {previewStruk.periodeBulan} ·{" "}
                  {new Date(previewStruk.createdAt).toLocaleString("id-ID")}
                </p>
              </div>
              <StatusBadge status={statusBadgeFromStruk(previewStruk.statusStruk)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image */}
              <div>
                <div
                  className="w-full bg-[var(--bg-base)] flex items-center justify-center"
                  style={{ border: "3px solid var(--ink)", borderRadius: 8, minHeight: 300 }}
                >
                  <img
                    src={previewStruk.imageUrl}
                    alt={`Struk ${previewStruk.anggota.namaLengkap}`}
                    className="max-w-full max-h-[400px] object-contain"
                  />
                </div>
              </div>

              {/* OCR details */}
              <div className="flex flex-col gap-3">
                <div className="brutal-card-sm p-3">
                  <div className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wide mb-2">
                    Hasil OCR
                  </div>
                  {previewStruk.ocrParsed ? (
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-semibold text-[#6b6b6b]">Nominal</span>
                        <span className="font-bold tabular-nums">
                          {previewStruk.ocrParsed.nominal
                            ? `Rp ${previewStruk.ocrParsed.nominal.toLocaleString("id-ID")}`
                            : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-[#6b6b6b]">Tanggal</span>
                        <span className="font-bold">{previewStruk.ocrParsed.tanggal ?? "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-[#6b6b6b]">Bank</span>
                        <span className="font-bold">{previewStruk.ocrParsed.namaBank ?? "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-[#6b6b6b]">Sumber OCR</span>
                        <span className="font-bold">{previewStruk.ocrSource ?? "—"}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-[#6b6b6b]">
                      OCR tidak menghasilkan data terstruktur.
                    </p>
                  )}
                </div>

                {previewStruk.ocrParsed?.rawOcrText && (
                  <div className="brutal-card-sm p-3">
                    <div className="text-xs font-bold text-[#6b6b6b] uppercase tracking-wide mb-2">
                      Teks Mentah OCR
                    </div>
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                      {previewStruk.ocrParsed.rawOcrText}
                    </pre>
                  </div>
                )}

                {previewStruk.statusStruk === "REJECTED" && previewStruk.ditolakAlasan && (
                  <div
                    className="p-3 text-sm font-semibold"
                    style={{
                      background: "var(--status-tertunggak-bg)",
                      border: "2px solid var(--status-tertunggak)",
                      borderRadius: 8,
                      color: "#7f1d1d",
                    }}
                  >
                    Alasan ditolak: {previewStruk.ditolakAlasan}
                  </div>
                )}

                {previewStruk.statusStruk === "PENDING" && (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleApprove(previewStruk.id);
                        setPreviewId(null);
                      }}
                      disabled={actionLoading === previewStruk.id}
                      className="brutal-btn px-4 py-2.5"
                      style={{ background: "var(--status-lunas)", color: "#14532d" }}
                    >
                      {actionLoading === previewStruk.id ? (
                        <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={16} strokeWidth={2.5} />
                      )}
                      <span>Approve Struk</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectId(previewStruk.id);
                        setRejectAlasan("");
                        setPreviewId(null);
                      }}
                      disabled={actionLoading === previewStruk.id}
                      className="brutal-btn brutal-btn-danger px-4 py-2.5"
                    >
                      <XCircle size={16} strokeWidth={2.5} />
                      <span>Reject Struk</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectStruk && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Tolak struk"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setRejectId(null)}
            aria-hidden="true"
          />
          <div className="relative brutal-card w-full max-w-md p-5">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="flex items-center justify-center w-10 h-10"
                style={{
                  background: "var(--status-tertunggak)",
                  border: "2.5px solid var(--ink)",
                  borderRadius: 8,
                }}
              >
                <XCircle size={20} strokeWidth={2.5} color="#ffffff" />
              </div>
              <div>
                <h3 className="font-extrabold">Tolak Struk</h3>
                <p className="text-xs font-semibold text-[#6b6b6b]">
                  {rejectStruk.anggota.namaLengkap} · notifikasi WA akan dikirim
                </p>
              </div>
            </div>
            <label className="block text-sm font-bold mb-2">Alasan Penolakan</label>
            <textarea
              value={rejectAlasan}
              onChange={(e) => setRejectAlasan(e.target.value)}
              placeholder="Contoh: Nominal tidak sesuai, gambar buram, bukan struk pembayaran..."
              className="brutal-input min-h-[100px] resize-y"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setRejectId(null);
                  setRejectAlasan("");
                  setErr(null);
                }}
                className="brutal-btn brutal-btn-neutral px-4 py-2.5 flex-1"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading === rejectStruk.id}
                className="brutal-btn brutal-btn-danger px-4 py-2.5 flex-1"
              >
                {actionLoading === rejectStruk.id ? (
                  <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
                ) : (
                  <XCircle size={16} strokeWidth={2.5} />
                )}
                <span>Reject &amp; Kirim WA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden import to avoid unused warning */}
      <span className="hidden">
        <ImageIcon />
        Periode: {periode}
      </span>
    </div>
  );
}
