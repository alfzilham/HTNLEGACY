// ============================================================
// SIDU — Derived Status Logic (TERTUNGGAK on-the-fly)
// ------------------------------------------------------------
// Status TERTUNGGAK TIDAK disimpan sebagai field permanen.
// Dihitung on-the-fly dari kondisi:
//   status_stored === "BELUM_LUNAS" DAN
//   tanggal hari ini > Settings.deadlineTanggal pada bulan berjalan
//
// Field `status` di DB tetap menyimpan "BELUM_LUNAS" secara literal.
// "TERTUNGGAK" adalah derived state di layer presentasi/query.
// (Lihat SPEC.md §6)
// ============================================================

import { STATUS_IURAN, type StatusIuran } from "./constants";

/**
 * Compute status yang ditampilkan ke user.
 * - Jika stored LUNAS → LUNAS
 * - Jika stored BELUM_LUNAS:
 *   - Jika tanggal hari ini > deadlineTanggal → TERTUNGGAK
 *   - else → BELUM_LUNAS
 *
 * @param storedStatus nilai field `status` di DB (BELUM_LUNAS / LUNAS)
 * @param deadlineTanggal tanggal deadline dari Settings (1-31)
 * @param now tanggal referensi (default: new Date())
 */
export function computeStatusTampil(
  storedStatus: string,
  deadlineTanggal: number,
  now: Date = new Date()
): StatusIuran {
  if (storedStatus === STATUS_IURAN.LUNAS) return STATUS_IURAN.LUNAS;
  if (storedStatus !== STATUS_IURAN.BELUM_LUNAS) return storedStatus as StatusIuran;

  // BELUM_LUNAS — cek apakah lewat deadline bulan berjalan
  const today = now.getDate();
  if (today > deadlineTanggal) {
    return STATUS_IURAN.TERTUNGGAK;
  }
  return STATUS_IURAN.BELUM_LUNAS;
}

/**
 * Hitung periode bulan format "YYYY-MM" untuk tanggal tertentu.
 */
export function getPeriodeBulan(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * Format nominal ke rupiah.
 */
export function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Normalisasi nomor HP/WA ke format internasional 62xxx (untuk WAHA).
 * Menerima: 08xxx, +628xxx, 628xxx, 8xxx.
 */
export function normalizePhone(raw: string): string {
  let s = (raw || "").replace(/[^\d+]/g, "");
  if (s.startsWith("+62")) s = "62" + s.slice(3);
  else if (s.startsWith("08")) s = "62" + s.slice(1);
  else if (s.startsWith("8")) s = "62" + s;
  return s;
}

/**
 * Validasi format nomor HP Indonesia (sederhana).
 */
export function isValidIndoPhone(raw: string): boolean {
  const s = (raw || "").trim();
  if (!s) return false;
  const norm = normalizePhone(s);
  return /^62\d{8,13}$/.test(norm);
}
