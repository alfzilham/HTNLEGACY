"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

type Props = {
  page: number; // 0-indexed
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: Props) {
  if (totalPages <= 1) return null;

  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between gap-2 flex-wrap mt-4">
      <div className="text-xs font-semibold text-[#6b6b6b]">
        Menampilkan {start}–{end} dari {totalItems} anggota
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(0)}
          disabled={page === 0}
          className="brutal-btn brutal-btn-neutral p-1.5"
          aria-label="Halaman pertama"
          title="Halaman pertama"
        >
          <ChevronsLeft size={14} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="brutal-btn brutal-btn-neutral p-1.5"
          aria-label="Halaman sebelumnya"
          title="Sebelumnya"
        >
          <ChevronLeft size={14} strokeWidth={2.5} />
        </button>
        <div
          className="px-3 py-1.5 text-xs font-bold tabular-nums"
          style={{
            background: "var(--bg-base)",
            border: "2px solid var(--ink)",
            borderRadius: 6,
          }}
        >
          {page + 1} / {totalPages}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page === totalPages - 1}
          className="brutal-btn brutal-btn-neutral p-1.5"
          aria-label="Halaman berikutnya"
          title="Berikutnya"
        >
          <ChevronRight size={14} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={page === totalPages - 1}
          className="brutal-btn brutal-btn-neutral p-1.5"
          aria-label="Halaman terakhir"
          title="Halaman terakhir"
        >
          <ChevronsRight size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
