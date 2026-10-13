// ============================================================
// SIDU — Periode helpers (untuk trend comparison)
// ============================================================

/**
 * Dapatkan periode bulan sebelumnya dari YYYY-MM.
 * Contoh: "2026-10" → "2026-09", "2026-01" → "2025-12"
 */
export function getPrevPeriodeBulan(periode: string): string {
  const [y, m] = periode.split("-").map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, "0")}`;
}

/**
 * Format periode YYYY-MM ke label manusiawi.
 * Contoh: "2026-10" → "Okt 2026"
 */
export function formatPeriodeLabel(periode: string): string {
  const [y, m] = periode.split("-").map(Number);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
  ];
  return `${months[m - 1]} ${y}`;
}

/**
 * Hitung persentase perubahan (current vs previous).
 * Return null jika previous = 0 (tidak bisa hitung %).
 */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
