// ============================================================
// SIDU — WAHA WhatsApp Notification (STUB for MVP)
// ------------------------------------------------------------
// Implementasi saat ini: LOG-ONLY ke console.
// Sesuai klarifikasi: stub best-effort/fire-and-forget, dipanggil
// dalam try/catch TERPISAH dari logika utama reject struk.
//
// Untuk production: ganti isi fungsi sendWahaMessage dengan
// HTTP call ke {WAHA_BASE_URL}/api/sendText tanpa sentuh
// logika inti reject struk di route.ts.
// ============================================================

import { normalizePhone } from "./status";

export type WahaResult = {
  ok: boolean;
  error?: string;
};

/**
 * Kirim pesan WhatsApp via WAHA. STUB — hanya log ke console.
 *
 * Production implementation:
 *   const r = await fetch(`${process.env.WAHA_BASE_URL}/api/sendText`, {
 *     method: "POST",
 *     headers: {
 *       "Content-Type": "application/json",
 *       ...(process.env.WAHA_API_KEY ? { "X-Api-Key": process.env.WAHA_API_KEY } : {}),
 *     },
 *     body: JSON.stringify({
 *       session: process.env.WAHA_SESSION ?? "default",
 *       chatId: `${phone}@c.us`,
 *       text: message,
 *     }),
 *   });
 *   return { ok: r.ok };
 */
export async function sendWahaMessage(
  phone: string,
  message: string
): Promise<WahaResult> {
  const normalized = normalizePhone(phone);
  console.log(
    `[WAHA STUB] To: ${normalized} | Message: ${message.substring(0, 120)}${message.length > 120 ? "..." : ""}`
  );

  // Simulasi delay kecil agar terasa realistis
  await new Promise((r) => setTimeout(r, 50));

  // Selalu return ok=true di stub (kegagalan WAHA tidak boleh menggagalkan reject)
  return { ok: true };
}

/**
 * Pesan template untuk notifikasi struk ditolak.
 */
export function buildStrukDitolakMessage(
  namaLengkap: string,
  alasan: string
): string {
  return `*SIDU — Notifikasi Struk Ditolak*

Halo ${namaLengkap},

Struk pembayaran iuran Anda telah *DITOLAK* oleh admin.

Alasan: ${alasan}

Silakan upload ulang struk dengan gambar yang lebih jelas, atau hubungi Bendahara jika ada pertanyaan.

— Panel SIDU`;
}
