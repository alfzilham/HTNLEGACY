// ============================================================
// SIDU — Rate limiting sederhana (in-memory, per-IP)
// ------------------------------------------------------------
// Mitigasi brute-force dasar untuk endpoint login & verify-password
// (ARCHITECTURE.md §4.4 bilang "disarankan").
//
// MVP: in-memory (reset saat server restart). Untuk production,
// ganti ke Redis atau Upstash rate limit.
//
// Strategy: sliding window — max N attempts per windowSeconds.
// ============================================================

type Attempt = {
  count: number;
  firstAt: number;
  lockedUntil: number | null;
};

const store = new Map<string, Attempt>();

// Cleanup expired entries setiap 5 menit
let lastCleanup = 0;
function cleanup(now: number) {
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;
  for (const [key, val] of store) {
    if (val.lockedUntil && val.lockedUntil < now) {
      store.delete(key);
    } else if (!val.lockedUntil && now - val.firstAt > 15 * 60 * 1000) {
      // Hapus entry idle > 15 menit
      store.delete(key);
    }
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number | null; // jika locked, detik sampai unlock
};

/**
 * Cek rate limit. Return ok=false jika melebihi batas.
 *
 * @param key Identifier (biasanya IP address)
 * @param maxAttempts Maks percobaan dalam window
 * @param windowSeconds Durasi window (detik)
 * @param lockSeconds Durasi lock setelah melebihi max (detik)
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowSeconds: number = 300, // 5 menit
  lockSeconds: number = 60 // 1 menit lock
): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const existing = store.get(key);

  // Cek apakah sedang di-lock
  if (existing?.lockedUntil && existing.lockedUntil > now) {
    const retryAfter = Math.ceil((existing.lockedUntil - now) / 1000);
    return { ok: false, remaining: 0, retryAfterSeconds: retryAfter };
  }

  // Reset lock yang sudah expired
  if (existing?.lockedUntil && existing.lockedUntil <= now) {
    store.delete(key);
  }

  const windowMs = windowSeconds * 1000;
  const cur = store.get(key);

  if (!cur || now - cur.firstAt > windowMs) {
    // Window baru / first attempt
    store.set(key, { count: 1, firstAt: now, lockedUntil: null });
    return { ok: true, remaining: maxAttempts - 1, retryAfterSeconds: null };
  }

  // Increment count
  cur.count += 1;

  if (cur.count > maxAttempts) {
    // Lock!
    cur.lockedUntil = now + lockSeconds * 1000;
    store.set(key, cur);
    return { ok: false, remaining: 0, retryAfterSeconds: lockSeconds };
  }

  return {
    ok: true,
    remaining: maxAttempts - cur.count,
    retryAfterSeconds: null,
  };
}

/**
 * Reset rate limit setelah login sukses (clear attempts).
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Ekstrak IP dari request. Akun X-Forwarded-For jika ada (di belakang proxy).
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xri = req.headers.get("x-real-ip");
  if (xri) return xri;
  return "unknown";
}
