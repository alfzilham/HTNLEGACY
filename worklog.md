# SIDU — Worklog

## Status: MVP LENGKAP (Semua 16 todo selesai)

## Checkpoint 3: Admin Lengkap + Transaksi/Grafik + Import + Siklus Bulanan + Audit Log + Polish UI

### Yang Selesai di Round Ini

**Todo 8 — Admin Data Anggota (tabel lengkap)**
- Halaman `/admin/anggota` dengan tabel (desktop) & card list (mobile)
- Kolom: Gender, Nama, No HP/WA, Status, Password (icon mata toggle reveal), Aksi (edit status, hapus)
- **Icon mata password**: klik → fetch `/api/anggota/[id]` (admin only) → decryptPassword → tampilkan password asli. Tombol copy ke clipboard. Ini membenarkan pilihan AES-256 reversible encryption.
- Edit status: modal dengan pilihan LUNAS/BELUM_LUNAS (TERTUNGGAK tidak bisa diset manual — derived)
- Hapus anggota: modal konfirmasi dengan warning cascade (Struk terkait ikut terhapus, Transaksi TIDAK)
- Tambah anggota: modal form (gender, nama, no HP, password) — admin bisa tambah manual tanpa import
- Filter: search (nama/no HP), filter gender (Semua/Pria/Wanita), filter status (dropdown brutal-select)
- API: `GET/PATCH/DELETE /api/anggota/[id]` dengan admin guard. PATCH bisa update status, gender, nama, noHp, password (re-encrypt).

**Todo 11 — Modul Transaksi + Grafik Kas**
- API `GET /api/transaksi?bulan=YYYY-MM` (list + summary + perBulan untuk grafik historis)
- API `POST /api/transaksi` (admin only, catat MASUK/KELUAR manual)
- API `DELETE /api/transaksi/[id]` (admin only, tidak bisa hapus transaksi otomatis dari struk)
- Halaman `/kas` (user, read-only) & `/admin/kas` (admin, dengan form input manual)
- Komponen `KasView` shared: 4 chart (bar Masuk vs Keluar, line Tren Saldo, pie Distribusi, riwayat list)
- Selector periode (6 bulan terakhir), summary cards (Masuk/Keluar/Saldo)
- Transaksi dari struk approved ditandai "dari struk approved" & tidak bisa dihapus manual

**Todo 12 — Import Excel/JSON**
- API `POST /api/anggota/import` (multipart/form-data)
- Support format: `.xlsx` (pakai library `xlsx`) & `.json` (array of object)
- Validasi per baris: gender (PRIA/WANITA), namaLengkap (min 2), noHpWa (format Indo), password (min 6)
- **Skip-duplicate**: cek `(namaLengkap, gender)` — jika sudah ada, skip dengan alasan
- Limit 500 baris per import
- Halaman `/admin/import` dengan: info format, download template JSON, upload zone (dashed border), **modal peringatan wajib** sebelum eksekusi (jelaskan konsekuensi: skip duplikat, password terenkripsi, tidak bisa dibatalkan)
- Result card: 3 stat (Total/Berhasil/Dilewati) + detail list yang di-skip dengan alasan

**Todo 13 — Siklus Bulanan (Tutup Bulan)**
- API `GET /api/laporan/info` (statistik periode berjalan)
- API `POST /api/laporan/generate` (generate .zip: rekap-anggota.xlsx + README.txt + struk/{nama}.jpg)
- API `POST /api/laporan/reset-siklus` (hapus storage struk + reset Anggota.status → BELUM_LUNAS, **Transaksi TIDAK dihapus**)
- Halaman `/admin/laporan` dengan info periode + tombol "Mulai Tutup Bulan"
- **Modal 1 (wajib download)**: tidak bisa ditutup, progress bar real-time (track Content-Length via ReadableStream reader), download .zip via Blob+anchor, transisi otomatis ke modal 2 setelah selesai
- **Modal 2 (konfirmasi reset)**: BOLEH dibatalkan (tombol Batal + X), warning jelas tentang konsekuensi
- **Modal 3 (done)**: ringkasan hasil reset
- Library: `archiver` v8 (ESM, pakai `ZipArchive` class bukan function call)

**Todo 15 — Audit Log (PRD Should Have)**
- Model `AuditLog` baru di Prisma: id, actor, aksi, targetId, targetLabel, detail, createdAt
- Helper `lib/audit.ts` dengan `auditLog(aksi, {targetId, targetLabel, detail})` — best-effort (try/catch, tidak gagalkan aksi utama)
- Integrasi ke endpoint kritis: APPROVE_STRUK, REJECT_STRUK, UPDATE_STATUS, UPDATE_ANGGOTA, DELETE_ANGGOTA, IMPORT_ANGGOTA, UPDATE_SETTINGS, ADD_TRANSAKSI, RESET_SIKLUS
- API `GET /api/audit-log` (filter by aksi)
- Halaman `/admin/audit-log` dengan: distribusi statistik per aksi, filter by aksi, list dengan icon per aksi (color-coded), timestamp

**Todo 14 — Polish UI (DESIGN.md compliance)**
- Custom scrollbar (webkit + Firefox fallback) — sudah ada sebelumnya
- Custom checkbox `.brutal-checkbox` (appearance none, checkmark via ::after)
- Custom select `.brutal-select` (appearance none, chevron via SVG background-image)
- Focus-visible global (3px solid accent-tertiary outline)
- Animation `brutal-fade-in` untuk modal (200ms ease-out, translateY 8px → 0)
- Hover-lift `.brutal-hover-lift` untuk card clickable
- Applied `brutal-animate-in` ke upload-struk-modal
- Applied `brutal-select` ke filter status di admin anggota

### Bug Fixes Saat Development
1. **`middleware.ts` deprecated di Next 16** → rename ke `proxy.ts` dengan `export function proxy` (bukan `middleware`). Edge runtime, import dari `session-edge.ts` (tidak boleh import `next/headers`).
2. **Admin auth 401 di middleware** → `/api/admin/auth` & `/api/admin/logout` di-whitelist dari rule admin di proxy.ts.
3. **Cookie anggota tidak terbaca di middleware** → pecah `session.ts` jadi 2 file: `session.ts` (server-only, pakai `next/headers`) & `session-edge.ts` (edge-safe, untuk middleware).
4. **z-ai-web-dev-sdk vision** → pakai `chat.completions.createVision` (bukan `create`) dengan model `glm-4.5v`. Content type `image_url` support di `VisionMessage`.
5. **archiver v8 ESM** → import `{ ZipArchive as ArchiverZip }` (bukan default), instantiate dengan `new ArchiverZip({zlib:{level:6}})` (bukan `archiver("zip", ...)`).
6. **Prisma client tidak pick up model baru** → run `bun run db:generate` setelah `db:push` saat menambah model `AuditLog`, lalu restart dev server.

### Verifikasi End-to-End (agent-browser)
- ✅ Login anggota → beranda (4 anggota: Dewi=Lunas, Budi/Siti/Test User 1=Tertunggak)
- ✅ Admin login → dashboard → semua 8 halaman admin (200 OK)
- ✅ Admin anggota: icon mata reveal password "password123" untuk Test User 1 — fitur AES-256 decrypt bekerja
- ✅ Admin struk: approve/reject dengan modal preview + OCR details
- ✅ Admin kas: 4 chart (bar/line/pie/list) + form input manual transaksi
- ✅ Admin import: upload JSON → modal peringatan → result (2 berhasil, 3 skip dengan alasan)
- ✅ Admin laporan: Mulai Tutup Bulan → modal 1 (download progress) → otomatis modal 2 (konfirmasi reset) → Batal (modal 2 bisa dibatalkan) — sesuai SPEC §8.2
- ✅ Admin audit-log: 2 entri (APPROVE_STRUK, ADD_TRANSAKSI) tercatat dengan detail
- ✅ User kas page: chart + riwayat (read-only, no form input)
- ✅ Semua 18 rute (user + admin) return 200 dengan session yang benar
- ✅ Lint bersih (0 error, 0 warning)

---

## Checkpoint 2: Verifikasi Struk + Transaksi Otomatis + WAHA Stub

### Tambahan yang Selesai
- **Todo 10 — Admin verifikasi struk**: endpoint `POST /api/struk/[id]/verify` dengan action approve/reject.
  - **Approve**: Struk→APPROVED, Anggota.status→LUNAS, Transaksi(MASUK, nominal=settings.nominalIuran) dibuat otomatis dalam satu `$transaction` (atomic).
  - **Reject**: Struk→REJECTED+ditolakAlasan, Anggota.status→BELUM_LUNAS (kembali), WAHA stub dikirim (best-effort, try/catch TERPISAH dari logika utama).
  - **WAHA stub** (`lib/waha.ts`): log-only ke console, template pesan "Struk Ditolak". Tinggal ganti isi `sendWahaMessage` untuk production tanpa sentuh logika reject.
- **Halaman `/admin/struk`**: daftar struk periode bulan berjalan, terbagi "Menunggu Verifikasi" & "Sudah Diproses". Card menampilkan thumbnail, nama anggota+gender, badge status, summary OCR (nominal/tanggal/bank), alasan ditolak (jika REJECTED). Tombol Approve/Reject/Detail. Modal preview menampilkan gambar besar + OCR details + teks mentah OCR. Modal reject dengan textarea alasan.

---

## Checkpoint 1: Setup + Auth + Beranda + OCR + Admin Settings

### Sudah Selesai
- **Setup project**: Prisma schema (SQLite, enum → String + validasi app layer), `.env.example` lengkap sesuai ARCHITECTURE.md §6, design system neo-brutalist (globals.css dengan CSS vars: status lunas/belum-lunas/tertunggak/pending, accent primary/secondary/tertiary, Plus Jakarta Sans via next/font, komponen brutal-card/brutal-btn/brutal-input/brutal-badge).
- **Auth anggota**: sign up + login + logout + verify-password (re-entry per aksi). Password disimpan dengan **AES-256-GCM reversible encryption** (lib/crypto.ts) — BUKAN hash, sesuai ARCHITECTURE.md §4.1. JWT session cookie `sidu_session` (httpOnly, 7 hari). Session edge-safe terpisah (session-edge.ts) untuk middleware.
- **Admin gate + session**: `/admin` (gate form password tunggal, dicocokkan dengan `ADMIN_PASSWORD` env), cookie `sidu_admin` (8 jam).
- **Proxy.ts (Next 16 rename dari middleware.ts)**: guard rute `/admin/**`, `/api/admin/**`, `/beranda`, `/daftar/**`, `/kas`, `/barcode`. Set `x-pathname` request header untuk admin layout deteksi gate vs panel.
- **Settings singleton**: model Settings dengan auto-create default (nominalIuran=15000, deadlineTanggal=10). API GET (public) + PATCH (admin only).
- **Admin settings page**: form lengkap + upload barcode statis.
- **Admin dashboard ringkasan**: stat cards + status breakdown + quick links.
- **Halaman beranda**: progress bar % lunas, breakdown status, daftar anggota dengan filter, klik anggota → modal upload struk.
- **Modal upload struk**: 3-step (verify password → upload file → success). OCR Gemini AI via `chat.completions.createVision` — output JSON terstruktur.
- **Halaman barcode** & **halaman daftar filter** (`/daftar/[jenis]`).

### Catatan Teknis Penting
- **SQLite**: enum disimpan sebagai String + validasi di `lib/constants.ts`. Saat migrasi ke Postgres, ganti ke native enum tanpa ubah downstream logic.
- **Status TERTUNGGAK**: derived on-the-fly di `lib/status.ts` `computeStatusTampil()`. Field `status` di DB tetap `BELUM_LUNAS` literal. Tidak ada cron job.
- **Password encryption**: AES-256-GCM reversible (lib/crypto.ts). Format `ivHex:authTagHex:ciphertextHex`. Admin bisa decrypt untuk fitur "icon mata".
- **OCR**: Gemini via `z-ai-web-dev-sdk` `chat.completions.createVision` dengan model `glm-4.5v`. Hook Python OCR (`OCR_SERVICE_URL`) tersedia di lib/ocr.ts untuk masa depan.
- **Storage struk**: local filesystem `/public/uploads/struk/{YYYY-MM}/{anggotaId}-{ts}.ext`. Path disimpan di `Struk.imageUrl`. Dihapus saat reset siklus bulanan.
- **Transaksi TIDAK PERNAH direset** — `periodeBulan` sebagai pembeda untuk grafik historis.
- **Proxy.ts**: Next 16 mengganti `middleware.ts` → `proxy.ts` dengan `export function proxy`. Edge runtime, import dari `session-edge.ts`.
- **Audit log**: best-effort, tidak menggagalkan aksi utama. Actor selalu "admin" (single shared password di MVP).

### Environment
- Dev server: `bun run dev` di port 3000 (setsid --fork untuk persistensi)
- Database: SQLite `/home/z/my-project/db/custom.db`
- Test users: PRIA "Test User 1" / "password123", WANITA "Dewi Test" / "dewi12345", PRIA "Budi Santoso" / "budi12345", WANITA "Siti Aminah" / "siti12345"
- Admin password: "sidu-admin-2026"

### Rekomendasi Phase Berikutnya
1. **Production hardening**: ganti WAHA stub ke WAHA instance sungguhan, set GEMINI_API_KEY & ENCRYPTION_KEY production, migrasi ke PostgreSQL.
2. **Fitur tambahan**: reminder WA H-sebelum deadline (PRD Could Have), export PDF laporan, multi-admin dengan akun individual & log terpisah.
3. **Polish**: pagination untuk tabel anggota jika skala > 100 orang, optimistic UI update untuk reduce loading states, skeleton loaders.
4. **Testing**: tambah unit test untuk crypto.ts (encrypt/decrypt round-trip), integration test untuk upload struk → OCR → approve flow, E2E test untuk siklus bulanan.
