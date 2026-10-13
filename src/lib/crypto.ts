// ============================================================
// SIDU — AES-256-GCM Reversible Password Encryption
// ------------------------------------------------------------
// BY DESIGN (lihat ARCHITECTURE.md §4.1): password anggota
// disimpan dengan enkripsi REVERSIBEL, bukan hash satu arah.
// Tujuan: admin dapat melihat password asli via icon mata di
// tabel admin, untuk memberitahu anggota yang lupa password.
//
// Trade-off keamanan disadari: jika DB + ENCRYPTION_KEY bocor,
// seluruh password dapat didekripsi. Diterima karena konteks
// internal skala kecil + password berfungsi ganda sebagai PIN
// otorisasi transaksi (re-entry upload struk).
//
// Format penyimpanan: `${ivHex}:${authTagHex}:${ciphertextHex}`
// ============================================================

import crypto from "crypto";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY belum diset di environment. Lihat .env.example."
    );
  }
  // Terima hex 64-char (32 byte) atau string 32-char (raw bytes).
  let buf: Buffer;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    buf = Buffer.from(raw, "hex");
  } else if (raw.length === 32) {
    buf = Buffer.from(raw, "utf8");
  } else {
    throw new Error(
      "ENCRYPTION_KEY harus 32-byte (64 hex char atau 32 char string)."
    );
  }
  return buf;
}

export function encryptPassword(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12); // 96-bit IV standar GCM
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptPassword(stored: string): string {
  const key = getKey();
  const parts = stored.split(":");
  if (parts.length !== 3) {
    throw new Error("Format password terenkripsi tidak valid.");
  }
  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  const dec = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return dec.toString("utf8");
}

/** Bandingkan password plaintext dengan stored encrypted — constant-time-ish. */
export function verifyPassword(plaintext: string, stored: string): boolean {
  try {
    const decrypted = decryptPassword(stored);
    // Gunakan timingSafeEqual untuk mitigasi timing attack dasar.
    const a = Buffer.from(plaintext, "utf8");
    const b = Buffer.from(decrypted, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
