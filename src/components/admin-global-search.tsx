"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  Image as ImageIcon,
  Wallet,
  Loader2,
  X,
  ArrowRight,
  Mars,
  Venus,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";

type Result = {
  anggota: Array<{
    id: string;
    namaLengkap: string;
    gender: string;
    noHpWa: string;
    status: string;
  }>;
  struk: Array<{
    id: string;
    statusStruk: string;
    periodeBulan: string;
    createdAt: string;
    anggota: { namaLengkap: string; gender: string };
  }>;
  transaksi: Array<{
    id: string;
    tipe: string;
    nominal: number;
    keterangan: string;
    periodeBulan: string;
    createdAt: string;
  }>;
};

export function AdminGlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setOpen(true);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const hasResults =
    results &&
    (results.anggota.length > 0 ||
      results.struk.length > 0 ||
      results.transaksi.length > 0);

  function goToAnggota(id: string) {
    router.push(`/admin/anggota`);
    setOpen(false);
    setQ("");
    // TODO: could open detail modal via query param, but keep simple for now
    void id;
  }

  function goToStruk() {
    router.push(`/admin/struk`);
    setOpen(false);
    setQ("");
  }

  function goToKas() {
    router.push(`/admin/kas`);
    setOpen(false);
    setQ("");
  }

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md hidden md:block">
      <div className="relative">
        <Search
          size={16}
          strokeWidth={2.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70"
          aria-hidden="true"
        />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results && setOpen(true)}
          placeholder="Cari anggota, struk, transaksi..."
          className="w-full pl-9 pr-8 py-2 text-sm font-semibold bg-white/10 text-white placeholder:text-white/50 rounded-md border-2 border-white/30 focus:bg-white/20 focus:border-white/60 focus:outline-none transition-colors"
          aria-label="Pencarian global admin"
        />
        {loading && (
          <Loader2
            size={14}
            strokeWidth={2.5}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 animate-spin"
            aria-hidden="true"
          />
        )}
        {!loading && q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setResults(null);
              setOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/70 hover:text-white"
            aria-label="Hapus pencarian"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {open && hasResults && (
        <div
          className="absolute top-full left-0 right-0 mt-2 brutal-card p-2 z-50 max-h-[70vh] overflow-y-auto"
          style={{ background: "var(--surface)" }}
        >
          {/* Anggota results */}
          {results.anggota.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-[#9a9a9a] px-2 py-1 flex items-center gap-1.5">
                <Users size={11} strokeWidth={2.5} />
                Anggota ({results.anggota.length})
              </div>
              {results.anggota.slice(0, 5).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => goToAnggota(a.id)}
                  className="w-full flex items-center gap-2 px-2 py-2 hover:bg-[var(--bg-base)] rounded-md text-left transition-colors"
                >
                  {a.gender === "PRIA" ? (
                    <Mars size={14} strokeWidth={2.5} className="shrink-0 text-[var(--accent-secondary)]" />
                  ) : (
                    <Venus size={14} strokeWidth={2.5} className="shrink-0 text-[var(--accent-secondary)]" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{a.namaLengkap}</div>
                    <div className="text-[10px] font-mono text-[#6b6b6b] tabular-nums">{a.noHpWa}</div>
                  </div>
                  <StatusBadge status={a.status === "LUNAS" ? "LUNAS" : "BELUM_LUNAS"} />
                </button>
              ))}
            </div>
          )}

          {/* Struk results */}
          {results.struk.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-[#9a9a9a] px-2 py-1 flex items-center gap-1.5">
                <ImageIcon size={11} strokeWidth={2.5} />
                Struk ({results.struk.length})
              </div>
              {results.struk.slice(0, 5).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={goToStruk}
                  className="w-full flex items-center gap-2 px-2 py-2 hover:bg-[var(--bg-base)] rounded-md text-left transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{s.anggota.namaLengkap}</div>
                    <div className="text-[10px] font-semibold text-[#6b6b6b]">
                      {s.periodeBulan} · {new Date(s.createdAt).toLocaleDateString("id-ID")}
                    </div>
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
                </button>
              ))}
            </div>
          )}

          {/* Transaksi results */}
          {results.transaksi.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-[#9a9a9a] px-2 py-1 flex items-center gap-1.5">
                <Wallet size={11} strokeWidth={2.5} />
                Transaksi ({results.transaksi.length})
              </div>
              {results.transaksi.slice(0, 5).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={goToKas}
                  className="w-full flex items-center gap-2 px-2 py-2 hover:bg-[var(--bg-base)] rounded-md text-left transition-colors"
                >
                  <div
                    className="flex items-center justify-center w-7 h-7 shrink-0"
                    style={{
                      background: t.tipe === "MASUK" ? "var(--status-lunas)" : "var(--status-tertunggak)",
                      border: "1.5px solid var(--ink)",
                      borderRadius: 4,
                    }}
                  >
                    <span className="text-[10px] font-extrabold" style={{ color: t.tipe === "MASUK" ? "#14532d" : "#fff" }}>
                      {t.tipe === "MASUK" ? "+" : "−"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{t.keterangan}</div>
                    <div className="text-[10px] font-semibold text-[#6b6b6b]">{t.periodeBulan}</div>
                  </div>
                  <span
                    className="text-xs font-extrabold tabular-nums shrink-0"
                    style={{ color: t.tipe === "MASUK" ? "#14532d" : "#7f1d1d" }}
                  >
                    Rp {t.nominal.toLocaleString("id-ID")}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Footer */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
            }}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-2 mt-1 text-xs font-bold text-[#6b6b6b] hover:bg-[var(--bg-base)] rounded-md transition-colors"
          >
            <span>Tutup pencarian</span>
            <ArrowRight size={11} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* No results */}
      {open && !hasResults && !loading && q.trim().length >= 2 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 brutal-card p-6 z-50 text-center"
          style={{ background: "var(--surface)" }}
        >
          <Search size={28} strokeWidth={1.5} className="mx-auto mb-2 text-[#9a9a9a]" />
          <p className="text-sm font-semibold text-[#6b6b6b]">
            Tidak ada hasil untuk &quot;{q}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
