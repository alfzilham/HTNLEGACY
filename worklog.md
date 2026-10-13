# SIDU — Worklog

## Status: MVP LENGKAP + Enhancements (Cron Review #5 selesai)

## Checkpoint 7: Global Search + Rate Limiting + Help Tooltips

### Yang Selesai di Round Ini

**Todo 29 — Global Search di Top Bar Admin (NEW)**
- API `GET /api/admin/search?q=keyword` — search anggota (nama/no HP), struk (by nama anggota), transaksi (by keterangan). Return grouped results, max 10 per kategori.
- Komponen `AdminGlobalSearch` (`src/components/admin-global-search.tsx`):
  - Input di top bar admin (dark theme, white text on dark bg).
  - Debounce 300ms, dropdown results dengan 3 section (Anggota/Struk/Transaksi).
  - Each result: icon + label + status badge/nominal + click to navigate.
  - Click outside to close, X button to clear, "Tutup pencarian" footer.
  - Empty state: "Tidak ada hasil untuk '...'".
- Integrasi di `AdminShell` top bar (desktop only, mobile pakai hamburger menu).
- Verifikasi via agent-browser: search "Dewi" → dropdown show "Dewi Test" (ANGGOTA, LUNAS badge) + struk (Disetujui). Click → navigate ke /admin/anggota.

**Todo 30 — Rate Limiting untuk Brute-Force Mitigation (NEW, RISK FIX)**
- Helper `lib/rate-limit.ts` dengan sliding window strategy:
  - `checkRateLimit(key, maxAttempts, windowSeconds, lockSeconds)` → return `{ok, remaining, retryAfterSeconds}`.
  - `resetRateLimit(key)` — clear attempts setelah login sukses.
  - `getClientIp(req)` — ekstrak IP dari X-Forwarded-For / X-Real-IP.
  - In-memory store (reset saat server restart), cleanup idle entries setiap 5 menit.
- Applied ke 3 endpoint kritis:
  - `POST /api/auth/login` — 5 attempts/5 menit, lock 60s. Error: "Password salah. Sisa percobaan: X." → "Terlalu banyak percobaan login. Coba lagi dalam 60 detik." (429).
  - `POST /api/auth/verify-password` — 5 attempts/5 menit per anggotaId+IP, lock 60s.
  - `POST /api/admin/auth` — 5 attempts/5 menit, lock 60s.
- Reset on success: login sukses → clear attempts (user tidak di-penalize untuk wrong attempts sebelum sukses).
- Verifikasi via curl: 5 wrong logins → countdown "Sisa percobaan: 4,3,2,1,0" → 6th attempt: 429 locked 60s. Even correct password ditolak saat locked.
- HTTP 429 + `Retry-After` header (standard).

**Todo 31 — Help Tooltips (NEW)**
- Komponen `HelpTooltip` (`src/components/help-tooltip.tsx`):
  - Icon HelpCircle (lucide), hover/focus/click untuk show tooltip.
  - Brutalist style: dark bg (var(--ink)), white text, 2.5px border, shadow offset accent-primary.
  - Accessible: aria-describedby, keyboard focusable (tabindex via button), Esc to dismiss.
  - Reusable: `<HelpTooltip text="..." />`.
- Applied ke 3 field ambigu:
  1. **Nominal Iuran** (admin settings): "Nominal iuran bulanan per anggota. Dipakai untuk transaksi otomatis (MASUK) saat struk di-approve admin. Bisa diubah kapan saja — perubahan berlaku untuk struk yang di-approve SETELAH perubahan."
  2. **Tanggal Deadline** (admin settings): "Tanggal dalam bulan sebagai batas waktu pembayaran. Anggota yang BELUM_LUNAS setelah tanggal ini akan otomatis berstatus TERTUNGGAK (dihitung on-the-fly, bukan field permanen). Maks 28 untuk hindari Februari."
  3. **Password re-entry** (upload struk modal): "By design: siapa pun bisa upload struk atas nama anggota lain, asal tahu password orang tsb. Ini fitur, bukan bug — memudahkan anggota saling bantu upload struk pembayaran."
- Verifikasi via agent-browser: hover tooltip → dark tooltip muncul dengan help text lengkap.

**Polish UI Tambahan**
- Global search: dark theme input (white/10 bg, white/30 border) match admin top bar.
- Tooltips: brutalist dark style with accent-primary shadow offset.
- Rate limit errors: clear Indonesian messages with countdown + retry-after.

### Verifikasi End-to-End
- ✅ Global search: search "Dewi" → dropdown with Anggota + Struk results, click → navigate
- ✅ Rate limit: 5 wrong logins → countdown → 6th: 429 locked 60s; correct password during lock: rejected
- ✅ Help tooltips: hover nominal/deadline/password → tooltip muncul dengan help text
- ✅ Semua 18 halaman return 200
- ✅ Lint bersih (0 error, 0 warning)
- ✅ Login normal (correct password) tetap bekerja setelah lock expired

---

## Checkpoint 6: Full Sonner Toast Integration + Esc-to-close All Modals + Anggota Detail Modal

### Yang Selesai di Round Ini

**Todo 26 — Sonner Toast Integration ke Semua Aksi (NEW)**
- **Upload struk modal**: success ("Struk berhasil diupload" + desc "Menunggu verifikasi admin"), error, password verified, password salah.
- **Admin struk verify**: approve success ("Struk disetujui" + desc "Anggota LUNAS + transaksi MASUK Rp 15.000"), reject success ("Struk ditolak" + desc "Notifikasi WA dikirim ke anggota"), all errors.
- **Admin settings**: save success ("Pengaturan berhasil disimpan"), barcode upload success ("Barcode pembayaran berhasil diperbarui"), errors.
- **Admin import**: success ("Import selesai" + desc "X berhasil, Y dilewati dari Z baris"), errors.
- **Admin laporan**: download success ("Laporan .zip berhasil diunduh" + desc periode), reset success ("Siklus bulanan direset" + desc "X anggota → BELUM_LUNAS, Y transaksi tetap"), errors.
- All toasts use brutalist styling (border 3px, shadow offset, color-coded success/error/warning).
- Verifikasi via agent-browser: approve struk → toast "Struk disetujui\nAnggota LUNAS + transaksi MASUK Rp 15.000" muncul top-right.

**Todo 27 — Esc-to-close ke Semua Modal (NEW)**
- **Upload struk modal**: Esc tutup saat tidak di step success & tidak loading.
- **Admin struk preview modal**: Esc tutup saat tidak loading.
- **Admin struk reject modal**: Esc tutup saat tidak loading.
- **Admin anggota edit status modal**: Esc tutup saat tidak loading.
- **Admin anggota delete confirm modal**: Esc tutup saat tidak loading.
- **Admin anggota add new modal**: Esc tutup (selalu dismissible).
- **Admin anggota detail modal**: Esc tutup saat tidak loading.
- **Admin import warning modal**: Esc tutup saat tidak loading.
- Semua pakai hook `useEscapeToClose(onClose, dismissible)` yang reusable.
- Verifikasi via agent-browser: buka struk preview → Esc → modal tertutup.

**Todo 28 — Anggota Detail Modal (NEW FITUR)**
- API `GET /api/anggota/[id]/struk` — return anggota + semua struk historis (semua periode, semua status) dengan OCR parsed.
- Tombol "Detail" (icon FileText) di kolom Aksi tabel anggota (desktop) & card (mobile).
- Modal "Riwayat Struk Anggota" menampilkan:
  - Header: nama, gender, badge status
  - List struk historis: thumbnail (pakai StrukImage dengan fallback), tanggal upload, status badge, periode, tanggal diproses, OCR details (nominal/tanggal/bank), alasan ditolak (jika REJECTED).
  - Empty state: "Belum ada struk yang pernah diupload."
- Pakai StrukImage component (fallback "Gambar dihapus" untuk struk post-reset).
- Esc-to-close + click outside to close.
- Verifikasi via agent-browser: Dewi Test detail modal menampilkan 1 struk APPROVED dengan OCR Rp 15.000, 2026-10-13, BCA. Budi Santoso detail modal menampilkan "Belum ada struk".

**Polish UI Tambahan**
- Brutal-animate-in class ke detail modal (fade-in + translateY animation).
- Mobile card layout: 3 buttons (Detail/Edit/Hapus) dengan flex-1 untuk konsisten.
- All modals now consistent: Esc-to-close + click outside + X button (untuk yang dismissible).

### Verifikasi End-to-End (agent-browser)
- ✅ Sonner toast: approve struk → "Struk disetujui\nAnggota LUNAS + transaksi MASUK Rp 15.000" muncul
- ✅ Esc-to-close: struk preview modal → Esc → tertutup
- ✅ Anggota detail modal: Dewi Test → 1 struk APPROVED + OCR details; Budi → empty state
- ✅ Detail modal: StrukImage fallback "Gambar dihapus" untuk struk post-reset
- ✅ Mobile card: 3 action buttons (Detail/Edit/Hapus)
- ✅ Semua 18 halaman return 200
- ✅ Lint bersih (0 error, 0 warning)

---

## Checkpoint 5: Bug Fix (Broken Images) + Pagination + Esc-to-close + Sonner Toast + Gender Breakdown

### Yang Selesai di Round Ini

**Bug Fixes**
1. **Broken images di admin struk setelah reset siklus** — setelah reset siklus bulanan, 4 struk "sudah diproses" tetap di DB dengan `imageUrl` pointing ke file yang sudah dihapus (sesuai SPEC §8.3 "imageUrl jadi stale link — diterima untuk bebaskan storage"). Tapi UX-nya jelek (broken image icon). **Fixed**: buat komponen `StrukImage` dengan fallback — tampilkan placeholder "Gambar dihapus" (icon ImageOff) saat image onError. Pakai `key={src}` trick untuk reset state otomatis saat src berubah (menghindari setState-in-effect anti-pattern).
2. **Lint error di StrukImage** (setState in useEffect) → refactored pakai `key` prop trick + useState langsung.

**Todo 22 — Pagination di Admin Anggota (NEW)**
- Komponen `Pagination` reusable di `src/components/pagination.tsx` — buttons first/prev/next/last + page indicator "1 / N" + text "Menampilkan X-Y dari Z anggota".
- Integrasi di `anggota-table-client.tsx`: PAGE_SIZE=20, state `page`, `useEffect` reset page ke 0 saat search/filter berubah.
- Slice `filtered` → `paged` untuk render (table desktop + cards mobile).
- Threshold: pagination muncul hanya jika totalPages > 1 (saat ini belum terlihat karena baru 6 anggota — akan muncul saat > 20).

**Todo 23 — Keyboard Shortcut Esc untuk Tutup Modal (NEW)**
- Hook `useEscapeToClose(onClose, dismissible)` di `src/hooks/use-escape-to-close.ts`.
- Applied ke `upload-struk-modal.tsx` — Esc tutup modal saat tidak di step success & tidak loading.
- Pattern reusable: tinggal call `useEscapeToClose(onClose, canDismiss)` di komponen modal lain.
- `dismissible` flag: false untuk modal wajib (modal 1 laporan), true untuk modal biasa.

**Todo 24 — Sonner Toast Notifications (NEW)**
- Setup Sonner Toaster di `src/components/ui/sonner.tsx` dengan brutalist styling (border 3px, shadow offset, color-coded per type success/error/warning).
- Mount di `src/app/layout.tsx` (parallel dengan radix Toaster lama).
- Position top-right, 4 detik auto-dismiss.
- Integrasi di `anggota-table-client.tsx`: `showToast()` sekarang fire both legacy inline toast + sonner toast.
- Verifikasi: edit status Budi → sonner toast "Status Budi Santoso → BELUM LUNAS" muncul.

**Todo 25 — Gender Breakdown di Beranda (NEW)**
- Section "Partisipasi per Gender" di beranda — 2 card (Pria/Wanita) dengan:
  - Mini progress bar (% lunas)
  - Counter "X dari Y lunas"
  - Badge "Selesai!" jika 100%
  - Color-coded: Pria (ungu accent-secondary), Wanita (pink)
- Implementasi sesuai CONTEXT.md "pemisahan data berdasarkan gender".
- Pakai IIFE untuk compute pria/wanita stats inline di JSX.

**Polish UI Tambahan**
- StrukImage component: fallback placeholder untuk broken images (icon ImageOff + "Gambar dihapus" text).
- Sonner toast: brutalist styling (border 3px solid, shadow offset, color-coded).
- Pagination: brutalist buttons dengan disabled state.
- Gender breakdown: mini progress bar dengan conditional color (lunas green saat 100%).

### Verifikasi End-to-End (agent-browser)
- ✅ Admin struk setelah reset siklus: 4 struk "sudah diproses" show placeholder "Gambar dihapus" (no broken images)
- ✅ Admin anggota: pagination code jalan (akan muncul saat > 20 anggota)
- ✅ Upload struk modal: Esc tutup modal saat di step password/upload
- ✅ Admin anggota edit status: sonner toast "Status Budi Santoso → BELUM_LUNAS" muncul top-right
- ✅ Beranda: "Partisipasi per Gender" section dengan 2 card + mini progress bar
- ✅ Semua 18 halaman (8 admin + 10 user) return 200
- ✅ Lint bersih (0 error, 0 warning)

---

## Checkpoint 4: Bug Fix + Fitur Baru (Profil, Trend, Export CSV) + Polish UI

### Yang Selesai di Round Ini

**Bug Fixes**
1. **DELETE_TRANSAKSI audit log missing** — endpoint `DELETE /api/transaksi/[id]` tidak tercatat di audit log. Fixed: tambah `auditLog("DELETE_TRANSAKSI", ...)` setelah hapus.
2. **GENERATE_LAPORAN audit log missing** — endpoint `POST /api/laporan/generate` tidak tercatat. Fixed: tambah `auditLog("GENERATE_LAPORAN", ...)` setelah generate zip.

**Todo 16 — Halaman Profil Anggota (NEW)**
- Halaman `/profil` (anggota, read-only) — anggota lihat data diri sendiri tanpa bisa edit (sesuai PRD: anggota tidak bisa ubah password/data sendiri).
- Konten: identitas (nama, gender, no HP, tanggal bergabung), status iuran periode berjalan dengan nominal iuran & deadline, riwayat struk 5 terakhir periode ini, riwayat transaksi iuran 10 terakhir (semua bulan), info keamanan tentang enkripsi password.
- CTA: "Bayar Sekarang" (link ke /barcode) jika belum lunas, "Profil" button.
- Add `/profil` ke proxy.ts ANGGOTA_PROTECTED + sidebar AppShell.

**Todo 17 — Trend Comparison di Dashboard Admin (NEW)**
- Komponen `TrendBadge` reusable: tampilkan % perubahan current vs previous, color-coded (hijau=naik bagus, merah=naik buruk untuk pengeluaran).
- Helper `lib/periode.ts`: `getPrevPeriodeBulan()`, `formatPeriodeLabel()`, `pctChange()`.
- Dashboard admin: stat cards Kas Masuk & Kas Keluar kini menampilkan TrendBadge (+167%, +67%, dll) + label "(vs Sep 2026)".
- Icon status di breakdown (CheckCircle2/CircleDashed/AlertTriangle) untuk visual clarity.

**Todo 18 — Export CSV Transaksi (NEW)**
- Tombol "CSV" di KasView (admin & user) — download transaksi bulan terpilih sebagai CSV.
- Format: Tanggal, Tipe, Nominal, Keterangan, Periode, Dari Struk (Ya/Tidak).
- UTF-8 BOM untuk Excel compatibility, filename `transaksi-{bulan}.csv`.

**Todo 19 — Beranda Status Banner (NEW + Polish)**
- Banner prominent di atas progress bar beranda: "Status Iuran Anda" dengan icon & color sesuai status (hijau=Lunas, merah=Tertunggak, netral=Belum Lunas).
- CTA contextual: "Bayar Sekarang" → /barcode (jika belum lunas), "Profil" → /profil.
- Pesan dinamis: "Terima kasih, iuran sudah lunas!" / "Lewat deadline, segera bayar" / "Bayar sebelum tgl X".

**Todo 20 — Skeleton Loader Component (NEW)**
- Komponen `Skeleton`, `SkeletonCard`, `SkeletonTable` di `src/components/skeleton.tsx`.
- Brutalist style dengan border 2px + animated pulse gradient.
- Siap dipakai di halaman yang loading state-nya perlu polish (belum diaplikasi full — untuk phase berikutnya).

**Todo 21 — Download Struk Individual (NEW)**
- Tombol download (icon Download) di modal preview struk admin — admin bisa download 1 gambar struk saja.
- Filename: `struk-{nama-lengkap}.jpg`.

**Polish UI Tambahan**
- Applied `brutal-hover-lift` ke quick links di admin dashboard.
- Applied `brutal-animate-in` ke upload-struk-modal.
- Applied `brutal-select` ke filter status di admin anggota.
- Add icon ke status breakdown di dashboard (CheckCircle2/CircleDashed/AlertTriangle).
- Info card dengan tips di dashboard admin.
- Mobile-responsive check: hamburger menu, card layout di mobile.

### Verifikasi End-to-End (agent-browser)
- ✅ Halaman `/profil` baru: render lengkap (identitas, status, riwayat struk, riwayat transaksi, info keamanan)
- ✅ Beranda banner: Test User 1 (TERTUNGGAK) → red banner "Tertunggak" + "Bayar Sekarang"
- ✅ Beranda banner: Dewi Test (LUNAS) → green banner "Lunas" + "Terima kasih"
- ✅ Dashboard admin trend: "(vs Sep 2026)" + TrendBadge +167% (Masuk), +67% (Keluar)
- ✅ Export CSV: tombol download di /admin/kas & /kas
- ✅ Download struk: tombol di modal preview struk
- ✅ Audit log: DELETE_TRANSAKSI & GENERATE_LAPORAN sekarang tercatat
- ✅ Semua 15 halaman (8 admin + 7 user) return 200
- ✅ Lint bersih (0 error, 0 warning)

---

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
2. **Fitur tambahan**: reminder WA H-sebelum deadline (PRD Could Have), export PDF laporan, multi-admin dengan akun individual & log terpisah, global search di top bar admin, bulk approve struk, anggota detail modal di admin (lihat struk historis anggota).
3. **Polish**: apply Skeleton component ke loading states (sudah dibuat, belum dipakai), optimistic UI updates, micro-interactions, apply useEscapeToClose ke semua modal (preview struk, edit status, delete, reject, import warning, reset confirm), apply sonner toast ke upload struk success/error & struk approve/reject feedback.
4. **Testing**: unit test untuk crypto.ts (encrypt/decrypt round-trip), integration test untuk upload struk → OCR → approve flow, E2E test untuk siklus bulanan, test edge cases (OCR gagal, password salah 3x, import file invalid).
5. **UX improvements**: apply sonner toast ke semua aksi (upload struk, approve/reject struk, import, settings save, laporan generate, reset siklus), keyboard shortcuts (Enter submit form), confirmation dialogs yang lebih jelas, help tooltips, loading skeletons.

### Unresolved Issues / Risks
- **SQLite untuk MVP**: kalau scale > 100 anggota dengan banyak struk, perlu migrate ke PostgreSQL. Schema sudah compatible (tinggal ganti provider + enum native).
- **WAHA stub**: notifikasi WA belum benar-benar terkirim. Production perlu setup WAHA instance + ganti isi `sendWahaMessage()`.
- **OCR dependency**: hanya Gemini AI. Kalau Gemini API down/rate-limited, struk auto-REJECTED. Hook Python OCR tersedia tapi belum diimplementasi.
- **Password reversible encryption**: trade-off keamanan disadari (DB + key bocor = password terbuka). Mitigasi: edukasi user pakai password unik. Rate limiting sekarang aktif untuk mitigasi brute-force.
- **Storage struk local filesystem**: tidak ada backup otomatis. Reset siklus hapus permanen. Production perlu Supabase Storage atau S3.
- **Rate limiting in-memory**: reset saat server restart. Untuk production multi-instance, perlu Redis atau Upstash rate limit.
- **Skeleton loaders belum dipakai**: komponen sudah dibuat (src/components/skeleton.tsx) tapi belum di-applied ke loading states halaman. Next phase: apply ke dashboard, struk list, kas view.
