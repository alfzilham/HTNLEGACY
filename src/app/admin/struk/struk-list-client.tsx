"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Eye, Loader2, Mars, Venus, Download } from "lucide-react";
import { StatusBadge, statusBadgeFromStruk } from "@/components/status-badge";
import { StrukImage } from "@/components/struk-image";
import { toast as sonnerToast } from "@/components/ui/sonner";

type StrukItem = {
  id: string;
  imageUrl: string;
  statusStruk: string;
  ditolakAlasan: string | null;
  periodeBulan: string;
  createdAt: string;
  verifiedAt: string | null;
  anggota: { id: string; namaLengkap: string; gender: string; noHpWa: string };
};

export function StrukListClient({ strukList, periode }: { strukList: StrukItem[]; periode: string }) {
  const router = useRouter();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectAlasan, setRejectAlasan] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pending = strukList.filter((s) => s.statusStruk === "PENDING");
  const decided = strukList.filter((s) => s.statusStruk !== "PENDING");
  const preview = strukList.find((s) => s.id === previewId);
  const reject = strukList.find((s) => s.id === rejectId);

  async function verify(id: string, action: "approve" | "reject", alasan?: string) {
    setLoadingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/struk/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, alasan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal memproses struk.");
      sonnerToast.success(action === "approve" ? "Struk disetujui" : "Struk ditolak", {
        description: action === "reject" ? "Anggota dapat mengirim ulang struk." : "Transaksi pemasukan telah dicatat.",
      });
      setRejectId(null);
      setRejectAlasan("");
      setPreviewId(null);
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Gagal memproses struk.";
      setError(message);
      sonnerToast.error(message);
    } finally {
      setLoadingId(null);
    }
  }

  function Card({ item }: { item: StrukItem }) {
    return <div className="brutal-card p-4"><div className="flex items-start gap-3">
      <button type="button" onClick={() => setPreviewId(item.id)} className="shrink-0 w-20 h-20 flex items-center justify-center bg-[var(--bg-base)]" style={{ border: "2.5px solid var(--ink)", borderRadius: 8, overflow: "hidden" }} aria-label={`Lihat struk ${item.anggota.namaLengkap}`}><StrukImage src={item.imageUrl} alt={`Struk ${item.anggota.namaLengkap}`} className="w-full h-full object-cover" /></button>
      <div className="flex-1 min-w-0"><div className="flex items-center justify-between gap-2 mb-1"><div className="flex items-center gap-1.5 min-w-0">{item.anggota.gender === "PRIA" ? <Mars size={14} className="shrink-0 text-[var(--accent-secondary)]" /> : <Venus size={14} className="shrink-0 text-[var(--accent-secondary)]" />}<span className="font-bold truncate">{item.anggota.namaLengkap}</span></div><StatusBadge status={statusBadgeFromStruk(item.statusStruk)} /></div>
        <div className="text-xs font-semibold text-[#6b6b6b] mt-2">Dikirim {new Date(item.createdAt).toLocaleString("id-ID")}</div>
        {item.statusStruk === "REJECTED" && item.ditolakAlasan && <div className="mt-2 px-2 py-1 text-xs font-semibold" style={{ background: "var(--status-tertunggak-bg)", border: "1.5px solid var(--status-tertunggak)", borderRadius: 4, color: "#7f1d1d" }}>Ditolak: {item.ditolakAlasan}</div>}
        {item.statusStruk === "PENDING" && <div className="flex gap-2 mt-3"><button type="button" onClick={() => verify(item.id, "approve")} disabled={loadingId === item.id} className="brutal-btn px-3 py-1.5 text-xs" style={{ background: "var(--status-lunas)", color: "#14532d" }}><CheckCircle2 size={12} /><span>Approve</span></button><button type="button" onClick={() => { setRejectId(item.id); setRejectAlasan(""); }} disabled={loadingId === item.id} className="brutal-btn brutal-btn-danger px-3 py-1.5 text-xs"><XCircle size={12} /><span>Reject</span></button><button type="button" onClick={() => setPreviewId(item.id)} className="brutal-btn brutal-btn-neutral px-3 py-1.5 text-xs ml-auto"><Eye size={12} /><span>Detail</span></button></div>}
      </div>
    </div></div>;
  }

  return <div className="flex flex-col gap-6">
    {error && <div className="px-4 py-3 text-sm font-semibold" style={{ background: "var(--status-tertunggak-bg)", border: "3px solid var(--status-tertunggak)", borderRadius: 8, color: "#7f1d1d" }}>{error}</div>}
    <section><div className="flex items-center justify-between mb-3"><h2 className="font-extrabold text-lg">Menunggu Review</h2><span className="text-xs font-bold">{pending.length} receipt</span></div>{pending.length === 0 ? <div className="brutal-card-flat p-6 text-center text-sm font-semibold text-[#6b6b6b]">Tidak ada receipt yang menunggu review.</div> : <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{pending.map((s) => <Card key={s.id} item={s} />)}</div>}</section>
    {decided.length > 0 && <section><h2 className="font-extrabold text-lg mb-3">Sudah Diproses</h2><div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{decided.map((s) => <Card key={s.id} item={s} />)}</div></section>}
    {preview && <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Preview receipt"><div className="absolute inset-0 bg-black/50" onClick={() => setPreviewId(null)} /><div className="relative brutal-card w-full max-w-2xl p-5"><div className="flex items-center justify-between mb-4"><div><h3 className="font-extrabold text-lg">{preview.anggota.namaLengkap}</h3><p className="text-xs font-semibold text-[#6b6b6b]">{preview.periodeBulan} · {new Date(preview.createdAt).toLocaleString("id-ID")}</p></div><StatusBadge status={statusBadgeFromStruk(preview.statusStruk)} /></div><div className="relative flex items-center justify-center bg-[var(--bg-base)] p-2" style={{ border: "2.5px solid var(--ink)", borderRadius: 8 }}><StrukImage src={preview.imageUrl} alt={`Struk ${preview.anggota.namaLengkap}`} className="max-w-full max-h-[400px] object-contain" iconSize={48} /><a href={preview.imageUrl} download={`struk-${preview.anggota.namaLengkap.replace(/\s+/g, "-").toLowerCase()}.jpg`} className="brutal-btn brutal-btn-neutral p-2 absolute top-2 right-2" aria-label="Download struk"><Download size={16} /></a></div><div className="flex gap-2 mt-4"><button type="button" onClick={() => setPreviewId(null)} className="brutal-btn brutal-btn-neutral px-4 py-2.5 flex-1">Tutup</button>{preview.statusStruk === "PENDING" && <><button type="button" onClick={() => verify(preview.id, "approve")} disabled={loadingId === preview.id} className="brutal-btn px-4 py-2.5" style={{ background: "var(--status-lunas)", color: "#14532d" }}>{loadingId === preview.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Approve</button><button type="button" onClick={() => { setRejectId(preview.id); setPreviewId(null); }} disabled={loadingId === preview.id} className="brutal-btn brutal-btn-danger px-4 py-2.5"><XCircle size={16} /> Reject</button></>}</div></div></div>}
    {reject && <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Tolak receipt"><div className="absolute inset-0 bg-black/50" onClick={() => setRejectId(null)} /><div className="relative brutal-card w-full max-w-md p-5"><h3 className="font-extrabold text-lg">Tolak Receipt</h3><p className="text-sm font-semibold text-[#6b6b6b] mt-1 mb-4">{reject.anggota.namaLengkap} · keputusan dilakukan manual</p><textarea value={rejectAlasan} onChange={(e) => setRejectAlasan(e.target.value)} placeholder="Tulis alasan penolakan..." className="brutal-input min-h-28 resize-y" autoFocus /><div className="flex gap-2 mt-4"><button type="button" onClick={() => setRejectId(null)} className="brutal-btn brutal-btn-neutral px-4 py-2.5 flex-1">Batal</button><button type="button" onClick={() => verify(reject.id, "reject", rejectAlasan.trim())} disabled={!rejectAlasan.trim() || loadingId === reject.id} className="brutal-btn brutal-btn-danger px-4 py-2.5 flex-1">{loadingId === reject.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Tolak</button></div></div></div>}
  </div>;
}
