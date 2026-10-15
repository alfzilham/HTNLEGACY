import { normalizePhone } from "./status";

export function buildStrukDitolakMessage(namaLengkap: string, alasan: string): string {
  return `SIDU - Notifikasi Struk Ditolak\n\nHalo ${namaLengkap},\n\nStruk pembayaran iuran Anda ditolak oleh admin.\n\nAlasan: ${alasan}\n\nSilakan upload ulang struk atau hubungi Bendahara.\n\nPanel SIDU`;
}

export function buildWhatsAppManualUrl(phone: string, message: string): string {
  const normalized = normalizePhone(phone);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
