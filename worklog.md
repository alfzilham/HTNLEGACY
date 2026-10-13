# SIDU — Worklog

## Checkpoint 2: Verifikasi Struk + Transaksi Otomatis + WAHA Stub

### Tambahan yang Selesai
- **Todo 10 — Admin verifikasi struk**: endpoint `POST /api/struk/[id]/verify` dengan action approve/reject.
  - **Approve**: Struk→APPROVED, Anggota.status→LUNAS, Transaksi(MASUK, nominal=settings.nominalIuran) dibuat otomatis dalam satu `$transaction` (atomic).
  - **Reject**: Struk→REJECTED+ditolakAlasan, Anggota.status→BELUM_LUNAS (kembali), WAHA stub dikirim (best-effort, try/catch TERPISAH dari logika utama).
  - **WAHA stub** (`lib/waha.ts`): log-only ke console, template pesan "Struk Ditolak". Tinggal ganti isi `sendWahaMessage` untuk production tanpa sentuh logika reject.
- **Halaman `/admin/struk`**: daftar struk periode bulan berjalan, terbagi "Menunggu Verifikasi" & "Sudah Diproses". Card menampilkan thumbnail, nama anggota+gender, badge status, summary OCR (nominal/tanggal/bank), alasan ditolak (jika REJECTED). Tombol Approve/Reject/Detail. Modal preview menampilkan gambar besar + OCR details + teks mentah OCR. Modal reject dengan textarea alasan.

### Verifikasi End-to-End (Checkpoint 2)
- ✅ Upload struk → OCR Gemini → record PENDING dengan ocrRawText JSON terstruktur
- ✅ Approve struk → Anggota.status LUNAS + Transaksi MASUK 15000 dibuat (atomic transaction)
- ✅ Reject struk dengan alasan → Anggota.status BELUM_LUNAS + WAHA stub terpanggil (log: `[WAHA STUB] To: 62xxx | Message: *SIDU — Notifikasi Struk Ditolak*...`)
- ✅ Modal preview menampilkan gambar + hasil OCR (nominal/tanggal/bank/sumber) + teks mentah
- ✅ Modal reject dengan textarea alasan wajib
- ✅ Lint bersih

---

## Checkpoint 1: Setup + Auth + Beranda + OCR + Admin Settings

### Sudah Selesai
- **Setup project**: Prisma schema (SQLite, enum → String + validasi app layer), `.env.example` lengkap sesuai ARCHITECTURE.md §6, design system neo-brutalist (globals.css dengan CSS vars: status lunas/belum-lunas/tertunggak/pending, accent primary/secondary/tertiary, Plus Jakarta Sans via next/font, komponen brutal-card/brutal-btn/brutal-input/brutal-badge).
- **Auth anggota**: sign up + login + logout + verify-password (re-entry per aksi). Password disimpan dengan **AES-256-GCM reversible encryption** (lib/crypto.ts) — BUKAN hash, sesuai ARCHITECTURE.md §4.1. JWT session cookie `sidu_session` (httpOnly, 7 hari). Session edge-safe terpisah (session-edge.ts) untuk middleware.
- **Admin gate + session**: `/admin` (gate form password tunggal, dicocokkan dengan `ADMIN_PASSWORD` env), cookie `sidu_admin` (8 jam). Endpoint `/api/admin/auth`, `/api/admin/logout`, `/api/admin/check`.
- **Proxy.ts (Next 16 rename dari middleware.ts)**: guard rute `/admin/**`, `/api/admin/**`, `/beranda`, `/daftar/**`, `/kas`, `/barcode`. Set `x-pathname` request header untuk admin layout deteksi gate vs panel.
- **Settings singleton**: model Settings dengan auto-create default (nominalIuran=15000, deadlineTanggal=10). API GET (public) + PATCH (admin only). Field: nominalIuran, deadlineTanggal, namaBank, nomorRekening, barcodeImageUrl, kontakBendahara/Sekretaris/Kompting.
- **Admin settings page**: `/admin/settings` — form lengkap (iuran, deadline, rekening, kontak panitia) + upload barcode statis (file upload ke `/public/uploads/barcode.{ext}`).
- **Admin dashboard ringkasan**: `/admin/dashboard` — stat cards (total anggota, struk pending, kas masuk/keluar bulan ini), status breakdown (lunas/belum-lunas/tertunggak), quick links.
- **Halaman beranda**: `/beranda` — progress bar % lunas, breakdown status, info target/terkumpul/deadline, daftar anggota dengan filter (search + gender), klik anggota → modal upload struk.
- **Modal upload struk**: 3-step (verify password → upload file → success). Re-entry password per aksi (bisa upload atas nama siapa saja asal tahu password). Integrasi OCR Gemini AI via `z-ai-web-dev-sdk` `chat.completions.createVision` — output JSON terstruktur (nominal, tanggal, namaBank, rawOcrText). Struk PENDING disimpan dengan ocrRawText. Jika OCR gagal total → auto-REJECTED.
- **Halaman barcode**: `/barcode` — tampil barcode (dari settings.barcodeImageUrl), rekening penampung, kontak panitia.
- **Halaman daftar filter**: `/daftar/[jenis]` (lunas/belum-lunas/tertunggak) — dynamic route, header berwarna sesuai status, daftar anggota terfilter dengan modal upload struk.

### Yang Masih Harus Dikerjakan
1. **Todo 10**: Admin verifikasi struk (approve/reject) + transaksi otomatis (MASUK saat approve) + WAHA stub (log-only, try/catch terpisah).
2. **Todo 8**: Admin dashboard lengkap — tabel anggota dengan icon mata (lihat password via decrypt), aksi hapus/ubah status manual.
3. **Todo 11**: Modul transaksi — pemasukan/pengeluaran manual admin + grafik kas per bulan (recharts) di `/kas` dan `/admin/kas`.
4. **Todo 12**: Import Excel/JSON dengan skip-duplicate + modal peringatan.
5. **Todo 13**: Siklus bulanan — generate .zip laporan (gambar struk + Excel rekap) → modal wajib download (tidak bisa ditutup) → modal konfirmasi reset (boleh batal) → hapus storage struk + reset Anggota.status (Transaksi TIDAK dihapus).
6. **Todo 14**: Polish UI sesuai DESIGN.md (konsistensi warna status, custom scrollbar, dropdown, checkbox brutalist).

### Catatan Teknis Penting
- **SQLite**: enum disimpan sebagai String + validasi di `lib/constants.ts`. Saat migrasi ke Postgres, ganti ke native enum tanpa ubah downstream logic.
- **Status TERTUNGGAK**: derived on-the-fly di `lib/status.ts` `computeStatusTampil()`. Field `status` di DB tetap `BELUM_LUNAS` literal. Tidak ada cron job.
- **Password encryption**: AES-256-GCM reversible (lib/crypto.ts). Format `ivHex:authTagHex:ciphertextHex`. Admin bisa decrypt untuk fitur "icon mata" (Todo 8).
- **OCR**: Gemini via `z-ai-web-dev-sdk` `chat.completions.createVision` dengan model `glm-4.5v`. Hook Python OCR (`OCR_SERVICE_URL`) tersedia di lib/ocr.ts untuk masa depan — tinggal set env var.
- **Storage struk**: local filesystem `/public/uploads/struk/{YYYY-MM}/{anggotaId}-{ts}.ext`. Path disimpan di `Struk.imageUrl`. Akan dihapus saat reset siklus bulanan.
- **Transaksi TIDAK PERNAH direset** — `periodeBulan` sebagai pembeda untuk grafik historis.
- **Proxy.ts**: Next 16 mengganti `middleware.ts` → `proxy.ts` dengan `export function proxy` (bukan `middleware`). Edge runtime, import dari `session-edge.ts` (tidak boleh import `next/headers`).

### Verifikasi End-to-End (agent-browser)
- ✅ Signup → login → redirect /beranda
- ✅ Login wrong password → error alert
- ✅ Login not found → 404 error
- ✅ Admin gate → login → redirect /admin/dashboard
- ✅ Admin settings → update nominal iuran → tersimpan
- ✅ Beranda render progress bar + daftar anggota (Test User 1 muncul sebagai TERTUNGGAK karena tanggal 13 > deadline 10)
- ✅ Klik anggota → modal re-entry password → password salah → alert
- ✅ Password benar → step upload → upload struk → OCR Gemini → record PENDING + ocrRawText JSON
- ✅ Navigasi sidebar: Beranda → Barcode → Daftar Tertunggak
- ✅ Lint bersih (0 error, 0 warning)

### Environment
- Dev server: `bun run dev` di port 3000 (setsid --fork untuk persistensi)
- Database: SQLite `/home/z/my-project/db/custom.db`
- Test user: PRIA "Test User 1" / password "password123"
- Admin password: "sidu-admin-2026"
