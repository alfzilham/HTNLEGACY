"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Trash2,
  Search,
  Mars,
  Venus,
  Plus,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Pencil,
  Phone,
  Copy,
  Check,
  FileText,
  Calendar,
  Building2,
  Wallet,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Pagination } from "@/components/pagination";
import { StrukImage } from "@/components/struk-image";
import { toast as sonnerToast } from "@/components/ui/sonner";
import { useEscapeToClose } from "@/hooks/use-escape-to-close";
import { PasswordStrength } from "@/components/password-strength";
import { Skeleton } from "@/components/skeleton";

type AnggotaItem = {
  id: string;
  gender: string;
  namaLengkap: string;
  noHpWa: string;
  status: string;
  statusTampil: string;
  createdAt: string;
};

export function AnggotaTableClient({
  anggota,
  nominalIuran,
}: {
  anggota: AnggotaItem[];
  nominalIuran: number;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<"ALL" | "PRIA" | "WANITA">("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "LUNAS" | "BELUM_LUNAS" | "TERTUNGGAK"
  >("ALL");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  // Password reveal: map anggotaId → revealed password (or null/loading)
  const [revealed, setRevealed] = useState<Record<string, string | null | "loading">>({});
  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<AnggotaItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // Edit status
  const [editTarget, setEditTarget] = useState<AnggotaItem | null>(null);
  const [editStatus, setEditStatus] = useState<string>("BELUM_LUNAS");
  const [editLoading, setEditLoading] = useState(false);
  // Add new
  const [showAdd, setShowAdd] = useState(false);
  // Detail modal (lihat struk historis anggota)
  const [detailTarget, setDetailTarget] = useState<AnggotaItem | null>(null);
  const [detailData, setDetailData] = useState<{
    anggota: AnggotaItem & { createdAt: string };
    strukList: Array<{
      id: string;
      imageUrl: string;
      statusStruk: string;
      periodeBulan: string;
      createdAt: string;
      verifiedAt: string | null;
      ditolakAlasan: string | null;
      ocrSource: string | null;
      ocrParsed: {
        nominal: number | null;
        tanggal: string | null;
        namaBank: string | null;
        rawOcrText: string;
      } | null;
    }>;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  // Toast (using sonner)
  // const [toast, setToast] = useState (legacy) — replaced with sonner
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  // Copied state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function showToast(type: "ok" | "err", msg: string) {
    // Update legacy state for inline toast (top-right card)
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
    // Also fire sonner toast
    if (type === "ok") sonnerToast.success(msg);
    else sonnerToast.error(msg);
  }

  const filtered = anggota.filter((a) => {
    const matchSearch = a.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
      a.noHpWa.includes(search);
    const matchGender = genderFilter === "ALL" || a.gender === genderFilter;
    const matchStatus = statusFilter === "ALL" || a.statusTampil === statusFilter;
    return matchSearch && matchGender && matchStatus;
  });

  // Reset page ke 0 saat filter/search berubah
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(0, totalPages - 1));
  const paged = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  // Reset page jika search/filter berubah
  useEffect(() => {
    setPage(0);
  }, [search, genderFilter, statusFilter]);

  // Esc to close modals (hanya saat tidak loading)
  useEscapeToClose(() => setEditTarget(null), !editLoading);
  useEscapeToClose(() => setDeleteTarget(null), !deleteLoading);
  useEscapeToClose(() => setShowAdd(false), true);
  useEscapeToClose(() => {
    setDetailTarget(null);
    setDetailData(null);
  }, !detailLoading);

  async function loadDetail(id: string) {
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await fetch(`/api/anggota/${id}/struk`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal memuat detail");
      setDetailData(data);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "Gagal memuat detail");
      setDetailTarget(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function toggleReveal(a: AnggotaItem) {
    if (revealed[a.id]) {
      // Hide
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[a.id];
        return next;
      });
      return;
    }
    setRevealed((prev) => ({ ...prev, [a.id]: "loading" }));
    try {
      const res = await fetch(`/api/anggota/${a.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal memuat password");
      setRevealed((prev) => ({ ...prev, [a.id]: data.passwordPlain ?? "—" }));
    } catch (e) {
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[a.id];
        return next;
      });
      showToast("err", e instanceof Error ? e.message : "Gagal memuat password");
    }
  }

  async function copyPassword(a: AnggotaItem) {
    const pwd = revealed[a.id];
    if (!pwd || pwd === "loading") return;
    try {
      await navigator.clipboard.writeText(pwd);
      setCopiedId(a.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      showToast("err", "Gagal copy ke clipboard");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/anggota/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal hapus");
      showToast("ok", `Anggota "${deleteTarget.namaLengkap}" dihapus.`);
      setDeleteTarget(null);
      router.refresh();
    } catch (e) {
      showToast("err", e instanceof Error ? e.message : "Gagal hapus");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleEditStatus() {
    if (!editTarget) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/anggota/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal update");
      showToast("ok", `Status ${editTarget.namaLengkap} → ${editStatus.replace("_", " ")}`);
      setEditTarget(null);
      router.refresh();
    } catch (e) {
      showToast("err", e instanceof Error ? e.message : "Gagal update");
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-3 text-sm font-semibold brutal-card-flat flex items-center gap-2"
          style={{
            background: toast.type === "ok" ? "var(--status-lunas-bg)" : "var(--status-tertunggak-bg)",
            borderColor: toast.type === "ok" ? "var(--status-lunas)" : "var(--status-tertunggak)",
            color: toast.type === "ok" ? "#14532d" : "#7f1d1d",
          }}
          role={toast.type === "ok" ? "status" : "alert"}
        >
          {toast.type === "ok" ? (
            <CheckCircle2 size={16} strokeWidth={2.5} />
          ) : (
            <AlertCircle size={16} strokeWidth={2.5} />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            strokeWidth={2.5}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau no HP..."
            className="brutal-input pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "PRIA", "WANITA"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenderFilter(g)}
              className="brutal-btn px-3 py-2 text-sm"
              style={{
                background: genderFilter === g ? "var(--accent-secondary)" : "var(--surface)",
                color: genderFilter === g ? "#ffffff" : "var(--ink)",
              }}
              aria-pressed={genderFilter === g}
            >
              {g === "PRIA" && <Mars size={16} strokeWidth={2.5} />}
              {g === "WANITA" && <Venus size={16} strokeWidth={2.5} />}
              <span>{g === "ALL" ? "Semua" : g === "PRIA" ? "Pria" : "Wanita"}</span>
            </button>
          ))}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="brutal-select px-3 py-2 text-sm w-auto"
          aria-label="Filter status"
        >
          <option value="ALL">Semua Status</option>
          <option value="LUNAS">Lunas</option>
          <option value="BELUM_LUNAS">Belum Lunas</option>
          <option value="TERTUNGGAK">Tertunggak</option>
        </select>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="brutal-btn brutal-btn-primary px-4 py-2 text-sm"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Tambah</span>
        </button>
      </div>

      {/* Result count */}
      <div className="text-xs font-semibold text-[#6b6b6b]">
        Menampilkan {filtered.length} dari {anggota.length} anggota
        {nominalIuran > 0 && ` · Iuran: Rp ${nominalIuran.toLocaleString("id-ID")}/bln`}
      </div>

      {/* Table (desktop) / Card list (mobile) */}
      {filtered.length === 0 ? (
        <div className="brutal-card-flat p-8 text-center text-[#6b6b6b] font-semibold">
          Tidak ada anggota yang cocok.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto brutal-card-flat">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left"
                  style={{ background: "var(--bg-base)", borderBottom: "3px solid var(--ink)" }}
                >
                  <th className="px-4 py-3 font-extrabold text-xs uppercase tracking-wide">Gender</th>
                  <th className="px-4 py-3 font-extrabold text-xs uppercase tracking-wide">Nama</th>
                  <th className="px-4 py-3 font-extrabold text-xs uppercase tracking-wide">No HP/WA</th>
                  <th className="px-4 py-3 font-extrabold text-xs uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 font-extrabold text-xs uppercase tracking-wide">Password</th>
                  <th className="px-4 py-3 font-extrabold text-xs uppercase tracking-wide text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((a, idx) => (
                  <tr
                    key={a.id}
                    style={{
                      borderBottom: idx < paged.length - 1 ? "1.5px solid var(--ink)" : "none",
                    }}
                  >
                    <td className="px-4 py-3">
                      {a.gender === "PRIA" ? (
                        <Mars size={16} strokeWidth={2.5} className="text-[var(--accent-secondary)]" />
                      ) : (
                        <Venus size={16} strokeWidth={2.5} className="text-[var(--accent-secondary)]" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold">{a.namaLengkap}</td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums">{a.noHpWa}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.statusTampil as "LUNAS" | "BELUM_LUNAS" | "TERTUNGGAK"} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-xs px-2 py-1 min-w-[100px]" style={{ background: "var(--bg-base)", border: "1.5px solid var(--ink)", borderRadius: 4 }}>
                          {revealed[a.id] === "loading"
                            ? "..."
                            : revealed[a.id] ?? "••••••"}
                        </code>
                        <button
                          type="button"
                          onClick={() => toggleReveal(a)}
                          className="brutal-btn brutal-btn-neutral p-1.5"
                          aria-label={revealed[a.id] ? `Sembunyikan password ${a.namaLengkap}` : `Lihat password ${a.namaLengkap}`}
                          title={revealed[a.id] ? "Sembunyikan" : "Lihat password"}
                        >
                          {revealed[a.id] ? <EyeOff size={14} strokeWidth={2.5} /> : <Eye size={14} strokeWidth={2.5} />}
                        </button>
                        {revealed[a.id] && revealed[a.id] !== "loading" && (
                          <button
                            type="button"
                            onClick={() => copyPassword(a)}
                            className="brutal-btn brutal-btn-neutral p-1.5"
                            aria-label="Copy password"
                            title="Copy"
                          >
                            {copiedId === a.id ? (
                              <Check size={14} strokeWidth={2.5} color="#14532d" />
                            ) : (
                              <Copy size={14} strokeWidth={2.5} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setDetailTarget(a);
                            loadDetail(a.id);
                          }}
                          className="brutal-btn brutal-btn-neutral p-1.5"
                          aria-label={`Lihat detail struk ${a.namaLengkap}`}
                          title="Lihat detail & riwayat struk"
                        >
                          <FileText size={14} strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditTarget(a);
                            setEditStatus(a.status === "LUNAS" ? "LUNAS" : "BELUM_LUNAS");
                          }}
                          className="brutal-btn brutal-btn-neutral p-1.5"
                          aria-label={`Edit status ${a.namaLengkap}`}
                          title="Edit status"
                        >
                          <Pencil size={14} strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(a)}
                          className="brutal-btn brutal-btn-danger p-1.5"
                          aria-label={`Hapus ${a.namaLengkap}`}
                          title="Hapus"
                        >
                          <Trash2 size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden flex flex-col gap-3">
            {paged.map((a) => (
              <div key={a.id} className="brutal-card-flat p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {a.gender === "PRIA" ? (
                      <Mars size={16} strokeWidth={2.5} className="shrink-0 text-[var(--accent-secondary)]" />
                    ) : (
                      <Venus size={16} strokeWidth={2.5} className="shrink-0 text-[var(--accent-secondary)]" />
                    )}
                    <span className="font-bold truncate">{a.namaLengkap}</span>
                  </div>
                  <StatusBadge status={a.statusTampil as "LUNAS" | "BELUM_LUNAS" | "TERTUNGGAK"} />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#6b6b6b] mb-2">
                  <Phone size={11} strokeWidth={2.5} />
                  <span className="tabular-nums">{a.noHpWa}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <code className="font-mono text-xs px-2 py-1 flex-1 min-w-0 truncate" style={{ background: "var(--bg-base)", border: "1.5px solid var(--ink)", borderRadius: 4 }}>
                    {revealed[a.id] === "loading" ? "..." : revealed[a.id] ?? "••••••"}
                  </code>
                  <button
                    type="button"
                    onClick={() => toggleReveal(a)}
                    className="brutal-btn brutal-btn-neutral p-1.5"
                    aria-label={revealed[a.id] ? `Sembunyikan password ${a.namaLengkap}` : `Lihat password ${a.namaLengkap}`}
                  >
                    {revealed[a.id] ? <EyeOff size={14} strokeWidth={2.5} /> : <Eye size={14} strokeWidth={2.5} />}
                  </button>
                  {revealed[a.id] && revealed[a.id] !== "loading" && (
                    <button
                      type="button"
                      onClick={() => copyPassword(a)}
                      className="brutal-btn brutal-btn-neutral p-1.5"
                      aria-label="Copy password"
                    >
                      {copiedId === a.id ? <Check size={14} strokeWidth={2.5} color="#14532d" /> : <Copy size={14} strokeWidth={2.5} />}
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDetailTarget(a);
                      loadDetail(a.id);
                    }}
                    className="brutal-btn brutal-btn-neutral px-3 py-1.5 text-xs flex-1"
                    aria-label={`Lihat detail ${a.namaLengkap}`}
                  >
                    <FileText size={12} strokeWidth={2.5} />
                    <span>Detail</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditTarget(a);
                      setEditStatus(a.status === "LUNAS" ? "LUNAS" : "BELUM_LUNAS");
                    }}
                    className="brutal-btn brutal-btn-neutral px-3 py-1.5 text-xs flex-1"
                  >
                    <Pencil size={12} strokeWidth={2.5} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(a)}
                    className="brutal-btn brutal-btn-danger px-3 py-1.5 text-xs flex-1"
                  >
                    <Trash2 size={12} strokeWidth={2.5} />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Edit status modal */}
      {editTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Edit status anggota"
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditTarget(null)} aria-hidden="true" />
          <div className="relative brutal-card w-full max-w-md p-5">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="flex items-center justify-center w-10 h-10"
                style={{ background: "var(--accent-primary)", border: "2.5px solid var(--ink)", borderRadius: 8 }}
              >
                <RotateCcw size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-extrabold">Ubah Status</h3>
                <p className="text-xs font-semibold text-[#6b6b6b]">{editTarget.namaLengkap}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 mb-4">
              <label className="block text-sm font-bold mb-1">Status Pembayaran</label>
              {(["BELUM_LUNAS", "LUNAS"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setEditStatus(s)}
                  className="brutal-btn px-4 py-2.5 justify-start"
                  style={{
                    background: editStatus === s
                      ? s === "LUNAS" ? "var(--status-lunas)" : "var(--bg-base)"
                      : "var(--surface)",
                  }}
                >
                  <StatusBadge status={s === "LUNAS" ? "LUNAS" : "BELUM_LUNAS"} />
                  <span className="ml-2 text-sm font-bold">{s === "LUNAS" ? "Lunas" : "Belum Lunas"}</span>
                </button>
              ))}
              <p className="text-xs text-[#6b6b6b] font-semibold mt-1">
                Catatan: TERTUNGGAK adalah status turunan (otomatis jika BELUM_LUNAS lewat deadline). Tidak bisa diset manual.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="brutal-btn brutal-btn-neutral px-4 py-2.5 flex-1"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleEditStatus}
                disabled={editLoading || editStatus === editTarget.status}
                className="brutal-btn brutal-btn-primary px-4 py-2.5 flex-1"
              >
                {editLoading ? <Loader2 size={16} strokeWidth={2.5} className="animate-spin" /> : <CheckCircle2 size={16} strokeWidth={2.5} />}
                <span>Simpan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi hapus anggota"
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} aria-hidden="true" />
          <div className="relative brutal-card w-full max-w-md p-5">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="flex items-center justify-center w-10 h-10"
                style={{ background: "var(--status-tertunggak)", border: "2.5px solid var(--ink)", borderRadius: 8 }}
              >
                <AlertCircle size={20} strokeWidth={2.5} color="#ffffff" />
              </div>
              <div>
                <h3 className="font-extrabold">Hapus Anggota?</h3>
                <p className="text-xs font-semibold text-[#6b6b6b]">Aksi ini tidak bisa dibatalkan</p>
              </div>
            </div>
            <div
              className="p-3 mb-4 text-sm font-semibold"
              style={{ background: "var(--status-tertunggak-bg)", border: "2px solid var(--status-tertunggak)", borderRadius: 6, color: "#7f1d1d" }}
            >
              Anggota <b>{deleteTarget.namaLengkap}</b> ({deleteTarget.gender}) akan dihapus permanen
              beserta seluruh riwayat struk-nya. Transaksi keuangan TIDAK dihapus (tetap sebagai record historis).
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="brutal-btn brutal-btn-neutral px-4 py-2.5 flex-1"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="brutal-btn brutal-btn-danger px-4 py-2.5 flex-1"
              >
                {deleteLoading ? <Loader2 size={16} strokeWidth={2.5} className="animate-spin" /> : <Trash2 size={16} strokeWidth={2.5} />}
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add new anggota modal */}
      {showAdd && (
        <AddAnggotaModal
          onClose={() => setShowAdd(false)}
          onSuccess={(nama) => {
            setShowAdd(false);
            showToast("ok", `Anggota "${nama}" ditambahkan.`);
            router.refresh();
          }}
          onError={(msg) => showToast("err", msg)}
        />
      )}

      {/* Pagination */}
      <Pagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      {/* Detail modal — lihat struk historis anggota */}
      {detailTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Detail struk ${detailTarget.namaLengkap}`}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setDetailTarget(null);
              setDetailData(null);
            }}
            aria-hidden="true"
          />
          <div className="relative brutal-card brutal-animate-in w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5">
            <button
              type="button"
              onClick={() => {
                setDetailTarget(null);
                setDetailData(null);
              }}
              className="brutal-btn brutal-btn-ghost p-1.5 absolute top-3 right-3"
              aria-label="Tutup"
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            <div className="mb-4 pr-8">
              <h3 className="font-extrabold text-lg">Riwayat Struk Anggota</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {detailTarget.gender === "PRIA" ? (
                  <Mars size={14} strokeWidth={2.5} className="text-[var(--accent-secondary)]" />
                ) : (
                  <Venus size={14} strokeWidth={2.5} className="text-[var(--accent-secondary)]" />
                )}
                <span className="font-bold">{detailTarget.namaLengkap}</span>
                <StatusBadge status={detailTarget.statusTampil as "LUNAS" | "BELUM_LUNAS" | "TERTUNGGAK"} />
              </div>
            </div>

            {detailLoading ? (
              <div className="flex flex-col gap-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3"
                    style={{ background: "var(--bg-base)", border: "2px solid var(--ink)", borderRadius: 8 }}
                  >
                    <Skeleton className="shrink-0 w-16 h-16" />
                    <div className="flex-1">
                      <Skeleton className="h-3 w-32 mb-2" />
                      <Skeleton className="h-2.5 w-48 mb-1.5" />
                      <Skeleton className="h-2.5 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : detailData ? (
              <div className="flex flex-col gap-3">
                {detailData.strukList.length === 0 ? (
                  <div className="text-center py-8 text-sm font-semibold text-[#6b6b6b]">
                    Belum ada struk yang pernah diupload.
                  </div>
                ) : (
                  detailData.strukList.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-start gap-3 p-3"
                      style={{ background: "var(--bg-base)", border: "2px solid var(--ink)", borderRadius: 8 }}
                    >
                      <div
                        className="shrink-0 w-16 h-16 flex items-center justify-center"
                        style={{ border: "2px solid var(--ink)", borderRadius: 6, overflow: "hidden" }}
                      >
                        <StrukImage
                          src={s.imageUrl}
                          alt={`Struk ${detailTarget.namaLengkap}`}
                          className="w-full h-full object-cover"
                          iconSize={20}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="text-xs font-bold text-[#6b6b6b]">
                            {new Date(s.createdAt).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <StatusBadge
                            status={
                              s.statusStruk === "APPROVED"
                                ? "APPROVED"
                                : s.statusStruk === "REJECTED"
                                ? "REJECTED"
                                : "PENDING"
                            }
                          />
                        </div>
                        <div className="text-xs font-semibold text-[#6b6b6b]">
                          Periode: {s.periodeBulan}
                          {s.verifiedAt && ` · Diproses: ${new Date(s.verifiedAt).toLocaleDateString("id-ID")}`}
                        </div>
                        {s.ocrParsed && (
                          <div className="flex flex-wrap gap-3 mt-1.5 text-xs">
                            {s.ocrParsed.nominal !== null && (
                              <span className="flex items-center gap-1 font-semibold text-[#6b6b6b]">
                                <Wallet size={11} strokeWidth={2.5} />
                                <span className="tabular-nums">Rp {s.ocrParsed.nominal.toLocaleString("id-ID")}</span>
                              </span>
                            )}
                            {s.ocrParsed.tanggal && (
                              <span className="flex items-center gap-1 font-semibold text-[#6b6b6b]">
                                <Calendar size={11} strokeWidth={2.5} />
                                <span>{s.ocrParsed.tanggal}</span>
                              </span>
                            )}
                            {s.ocrParsed.namaBank && (
                              <span className="flex items-center gap-1 font-semibold text-[#6b6b6b]">
                                <Building2 size={11} strokeWidth={2.5} />
                                <span>{s.ocrParsed.namaBank}</span>
                              </span>
                            )}
                          </div>
                        )}
                        {s.ditolakAlasan && (
                          <div
                            className="mt-1.5 px-2 py-1 text-xs font-semibold"
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
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Unused import guard */}
      <span className="hidden">
        <X />
      </span>
    </div>
  );
}

function AddAnggotaModal({
  onClose,
  onSuccess,
  onError,
}: {
  onClose: () => void;
  onSuccess: (nama: string) => void;
  onError: (msg: string) => void;
}) {
  const [gender, setGender] = useState<"PRIA" | "WANITA">("PRIA");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [noHpWa, setNoHpWa] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/anggota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gender, namaLengkap, noHpWa, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal tambah anggota");
      onSuccess(namaLengkap);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Gagal tambah");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Tambah anggota baru"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative brutal-card w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-lg">Tambah Anggota Baru</h3>
          <button
            type="button"
            onClick={onClose}
            className="brutal-btn brutal-btn-ghost p-1.5"
            aria-label="Tutup"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-bold mb-2">Gender</label>
            <div className="grid grid-cols-2 gap-2">
              {(["PRIA", "WANITA"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className="brutal-btn px-3 py-2.5"
                  style={{
                    background: gender === g ? "var(--accent-secondary)" : "var(--surface)",
                    color: gender === g ? "#ffffff" : "var(--ink)",
                  }}
                  aria-pressed={gender === g}
                >
                  {g === "PRIA" ? <Mars size={16} strokeWidth={2.5} /> : <Venus size={16} strokeWidth={2.5} />}
                  <span>{g === "PRIA" ? "Pria" : "Wanita"}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Nama Lengkap</label>
            <input
              type="text"
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
              className="brutal-input"
              required
              minLength={2}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">No HP/WA</label>
            <input
              type="tel"
              value={noHpWa}
              onChange={(e) => setNoHpWa(e.target.value)}
              placeholder="08123456789"
              className="brutal-input tabular-nums"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Password</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 karakter"
              className="brutal-input"
              required
              minLength={6}
            />
            <PasswordStrength password={password} />
            <p className="text-xs text-[#6b6b6b] font-semibold mt-1">
              Password dapat dilihat kembali oleh admin via icon mata.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="brutal-btn brutal-btn-primary px-4 py-2.5 mt-2"
          >
            {loading ? <Loader2 size={16} strokeWidth={2.5} className="animate-spin" /> : <Plus size={16} strokeWidth={2.5} />}
            <span>Tambah Anggota</span>
          </button>
        </form>
      </div>
    </div>
  );
}
