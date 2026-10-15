# SPEC.md — Functional & Technical Specification

## 1. Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React / Next.js (App Router) |
| Backend | Next.js Route Handlers (`app/api/**/route.ts`) |
| ORM | Prisma |
| Database | PostgreSQL (rekomendasi: Supabase Postgres atau Neon) |
| File Storage | Supabase Storage (gambar struk) |
| OCR | Python OCR service (terpisah, dipanggil via HTTP dari Next.js API route) |
| AI Fallback OCR | Gemini AI API |
| Notifikasi | WAHA (WhatsApp HTTP API) — self-hosted/terhubung ke satu nomor WA organisasi |
| Auth | Custom (bukan NextAuth) — session berbasis cookie/JWT sederhana, lihat §4 |
| Enkripsi Password | AES-256 (reversible), bukan bcrypt/argon2 — lihat ARCHITECTURE.md §Keamanan |

## 2. Struktur Rute (Routing)

```
/                          → Redirect ke /login jika belum ada sesi, else /beranda
/login                     → Form login (Gender, Nama Lengkap, Password)
/signup                    → Form sign up (Gender, Nama Lengkap, No HP/WA, Password)
/beranda                   → Halaman utama user: progres + daftar semua anggota
/barcode                   → Barcode pembayaran statis + kontak panitia
/daftar/lunas               → Filter anggota status lunas
/daftar/belum-lunas         → Filter anggota status belum_lunas
/daftar/tertunggak          → Filter anggota status tertunggak
/kas                        → Grafik pemasukan vs pengeluaran (per bulan)

/admin                      → Gate password admin (form password tunggal)
/admin/dashboard            → Dashboard: tabel anggota, ringkasan status
/admin/struk                → Daftar struk pending untuk diverifikasi
/admin/kas                  → Input manual pemasukan/pengeluaran + grafik
/admin/import               → Import Excel/JSON
/admin/settings             → Pengaturan nominal iuran, deadline, dsb
/admin/laporan               → Unduh laporan bulanan + trigger reset siklus

/api/auth/signup            → POST: buat akun baru
/api/auth/login              → POST: validasi login, buat sesi
/api/auth/verify-password    → POST: verifikasi password user tertentu (untuk re-entry saat upload struk)
/api/admin/auth               → POST: validasi password admin, buat sesi admin
/api/anggota                  → GET (list), POST (create manual oleh admin)
/api/anggota/[id]              → GET, PATCH (update status/data), DELETE (hapus akun)
/api/anggota/import             → POST: import bulk dari .xlsx/.json
/api/struk/upload                → POST: upload gambar struk + trigger OCR
/api/struk/[id]/verify             → POST: admin approve/reject struk
/api/transaksi                       → GET (list by bulan), POST (catat manual masuk/keluar)
/api/transaksi/summary                 → GET: ringkasan grafik per bulan
/api/settings                          → GET, PATCH (nominal iuran, deadline)
/api/laporan/generate                   → POST: generate .zip laporan bulan berjalan
/api/laporan/reset-siklus                 → POST: hapus storage struk + reset status (dipanggil setelah konfirmasi modal ke-2)
/api/webhook/waha                          → (opsional) callback status pengiriman WA
```

## 3. Model Data (Prisma Schema — Konsep)

```prisma
enum Gender {
  PRIA
  WANITA
}

enum StatusIuran {
  BELUM_LUNAS
  LUNAS
  TERTUNGGAK
}

enum StatusStruk {
  PENDING
  APPROVED
  REJECTED
}

enum TipeTransaksi {
  MASUK
  KELUAR
}

model Anggota {
  id            String       @id @default(cuid())
  gender        Gender
  namaLengkap   String
  noHpWa        String
  passwordEnc   String       // AES-256 encrypted, bukan hash
  status        StatusIuran  @default(BELUM_LUNAS)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  struk         Struk[]

  @@unique([namaLengkap, gender]) // kombinasi nama+gender harus unik untuk login
}

model Struk {
  id            String       @id @default(cuid())
  anggotaId     String
  anggota       Anggota      @relation(fields: [anggotaId], references: [id])
  imageUrl      String       // path di Supabase Storage
  statusStruk   StatusStruk  @default(PENDING)
  ocrRawText    String?      // hasil OCR mentah (debug/audit)
  ocrSource     String?      // "python-ocr" | "gemini-fallback"
  ditolakAlasan String?
  createdAt     DateTime     @default(now())
  verifiedAt    DateTime?
}

model Transaksi {
  id          String         @id @default(cuid())
  tipe        TipeTransaksi
  nominal     Int
  keterangan  String
  strukId     String?        // relasi opsional jika transaksi berasal dari struk approved
  periodeBulan String        // format "2026-10" — untuk pengelompokan grafik per bulan, TIDAK ikut reset
  createdAt   DateTime       @default(now())
}

model Settings {
  id              String   @id @default("singleton")
  nominalIuran    Int      @default(15000)
  deadlineTanggal Int      @default(10) // tanggal dalam bulan sebagai acuan "tertunggak"
  namaBank        String?
  nomorRekening   String?
  barcodeImageUrl String?
  kontakBendahara String?
  kontakSekretaris String?
  kontakKompting  String?
}

model AdminSession {
  id        String   @id @default(cuid())
  token     String   @unique
  createdAt DateTime @default(now())
  expiresAt DateTime
}
```

> Catatan: `AdminSession` opsional tergantung pendekatan sesi (lihat §4). Jika memakai JWT stateless, tabel ini tidak diperlukan.

## 4. Autentikasi & Otorisasi

### 4.1 Sesi Anggota (Login)
- Login dengan kombinasi `(gender, namaLengkap, password)`.
- Password diverifikasi dengan mendekripsi `passwordEnc` dan membandingkan dengan input (bukan hash-compare).
- Sesi disimpan di cookie `httpOnly` berisi JWT sederhana (`anggotaId`, `exp`).
- Sesi ini **hanya untuk mengakses halaman** (beranda, daftar, kas, barcode) — bukan untuk otorisasi aksi upload struk.

### 4.2 Otorisasi Per-Aksi (Upload Struk)
- Terlepas dari sesi login aktif, **setiap kali** user menekan tombol upload struk atas nama X, sistem meminta password milik X lagi (re-entry wajib).
- Endpoint `/api/struk/upload` mewajibkan field `anggotaId` + `password` (plaintext dari form) → backend mendekripsi password tersimpan dan membandingkan.
- Ini memungkinkan satu anggota membantu upload struk anggota lain, asal tahu passwordnya — sesuai keputusan produk.

### 4.3 Sesi Admin
- Form tunggal di `/admin` meminta satu password yang dicocokkan dengan `process.env.ADMIN_PASSWORD`.
- Jika cocok, sesi admin (cookie terpisah `admin_session`, JWT dengan klaim `role: admin`) dibuat.
- Semua rute `/admin/**` dan `/api/admin/**` diproteksi middleware yang memvalidasi cookie ini.
- Tidak ada akun admin individual — satu password untuk semua pemegang akses admin.

## 5. Alur OCR & Verifikasi Struk (Detail Teknis)

1. **Upload**: Frontend kirim `multipart/form-data` (gambar + anggotaId + password) ke `/api/struk/upload`.
2. **Simpan sementara**: Gambar diupload ke Supabase Storage di path `struk/{periodeBulan}/{anggotaId}-{timestamp}.jpg`.
3. **OCR Python**: Backend memanggil service OCR Python (microservice terpisah atau serverless function) dengan URL gambar.
   - Jika OCR mengembalikan data valid (nominal, tanggal, dsb terbaca) → lanjut ke langkah 5.
   - Jika gagal/confidence rendah → lanjut ke langkah 4.
4. **Fallback Gemini AI**: Backend mengirim gambar ke Gemini API dengan prompt ekstraksi data struk.
   - Berhasil → lanjut ke langkah 5.
   - Gagal juga → Struk otomatis ditandai gagal, respons ke user: "Struk tidak dapat dibaca, silakan coba unggah ulang dengan gambar lebih jelas." (tidak membuat record `Struk`, atau membuat dengan status langsung `REJECTED` + alasan "OCR gagal").
5. **Set status PENDING**: Record `Struk` dibuat dengan `statusStruk: PENDING`, hasil OCR mentah disimpan untuk referensi admin.
6. **Verifikasi Admin**: Admin membuka `/admin/struk`, melihat gambar struk + hasil OCR, memilih Approve/Reject.
   - **Approve** → `Struk.statusStruk = APPROVED`, `Anggota.status = LUNAS`, buat `Transaksi` tipe `MASUK` otomatis dengan nominal = `Settings.nominalIuran`.
   - **Reject** → `Struk.statusStruk = REJECTED` + `ditolakAlasan` diisi admin, `Anggota.status` kembali ke kondisi sebelumnya, sistem memanggil WAHA API untuk kirim pesan WA ke `Anggota.noHpWa`.

## 6. Logika Status `TERTUNGGAK`

- Dihitung **on-the-fly** (bukan field yang di-update background), untuk menghindari kebutuhan cron job:
  ```
  jika status === BELUM_LUNAS DAN tanggalHariIni > Settings.deadlineTanggal pada bulan berjalan
    → tampilkan sebagai TERTUNGGAK di UI
  ```
- Field `status` di database tetap menyimpan `BELUM_LUNAS` secara literal; "tertunggak" adalah **derived state** di layer query/presentasi (bisa diimplementasikan sebagai computed property saat fetch list, atau view/raw query Prisma).
- Alternatif: jika tim teknis lebih suka eksplisit, boleh dijalankan sebagai cron job harian yang meng-update field `status` sungguhan menjadi `TERTUNGGAK` — namun pendekatan on-the-fly lebih direkomendasikan karena tidak butuh infrastruktur job scheduler tambahan.

## 7. Import Data (.xlsx / .json)

- Format kolom minimal yang diharapkan: `gender, namaLengkap, noHpWa, password`.
- Proses: baca file → parse baris → untuk tiap baris, cek `(namaLengkap, gender)` sudah ada di DB?
  - Ada → skip, masukkan ke daftar "dilewati".
  - Tidak ada → insert baru (password di-enkripsi saat insert).
- **Sebelum proses dimulai**, tampilkan modal peringatan wajib dikonfirmasi, menjelaskan:
  - Data dengan nama+gender yang sama akan dilewati, tidak ditimpa.
  - Password di file akan tersimpan terenkripsi, pastikan sumber file terpercaya.
  - Proses tidak dapat dibatalkan di tengah jalan.
- Setelah selesai, tampilkan ringkasan: jumlah berhasil, jumlah dilewati (dengan daftar nama yang dilewati).

## 8. Siklus Bulanan — Detail Teknis

### 8.1 Generate Laporan (`/api/laporan/generate`)
1. Query seluruh `Struk` dengan `statusStruk = APPROVED` pada periode bulan berjalan.
2. Download seluruh gambar dari Supabase Storage, susun dalam struktur folder sementara (server-side, misal `/tmp`) dengan penamaan file `{namaLengkap}.jpg`.
3. Generate file Excel rekap (gunakan skill `xlsx` saat implementasi, atau library seperti `exceljs` di kode aplikasi) berisi seluruh data anggota: nama, gender, status final, nominal.
4. Compress semuanya (gambar + Excel) menjadi satu `.zip`.
5. Kembalikan file `.zip` sebagai response download (streaming), atau simpan sementara dan beri link unduh.

### 8.2 Modal Wajib Download (Frontend)
- Saat admin membuka halaman `/admin/laporan` dan ada indikasi "waktunya tutup bulan" (bisa berupa tombol manual yang selalu tersedia, bukan otomatis muncul berdasarkan tanggal — sesuai keputusan: trigger manual oleh aksi admin), modal muncul begitu admin **mengklik tombol "Mulai Tutup Bulan"**.
- Modal 1 (wajib download): tidak ada tombol "Tutup/Batal" selain "Unduh Sekarang". Modal baru bisa hilang otomatis setelah event `download selesai` terkonfirmasi dari browser (gunakan Blob + anchor download, track dengan `onClick` lalu set state `downloaded = true` setelah file berhasil di-generate dan diunduh).
- Modal 2 (konfirmasi bersihkan storage) muncul otomatis setelah Modal 1 tertutup: "Semua file struk bulan ini akan dihapus dari storage dan status anggota akan direset. Lanjutkan?" dengan tombol "Ya, Reset Sekarang" dan "Batal" (karena di titik ini file sudah aman terunduh, membatalkan reset masih masuk akal — datanya tetap ada sampai admin benar-benar mengonfirmasi).

### 8.3 Reset Siklus (`/api/laporan/reset-siklus`)
1. Hapus seluruh file di Supabase Storage path `struk/{periodeBulan}/**`.
2. Update seluruh `Anggota.status` menjadi `BELUM_LUNAS`.
3. **Tidak** menghapus record `Struk` maupun `Transaksi` dari database (opsional: tandai `Struk` lama sebagai arsip via field tambahan jika diperlukan audit, tapi tidak wajib untuk MVP) — namun gambar fisiknya sudah tidak ada di storage, sehingga field `imageUrl` menjadi stale link (ini diterima karena tujuan utamanya adalah bebaskan storage, bukan audit gambar permanen).
4. `Transaksi` tetap utuh selamanya — menjadi basis grafik kas historis per bulan (`periodeBulan` sebagai pembeda).

## 9. Grafik Kas (`/kas` dan `/admin/kas`)

- Data diambil dari `Transaksi`, dikelompokkan per `periodeBulan`.
- Endpoint `/api/transaksi/summary?bulan=2026-10` mengembalikan total masuk, total keluar, saldo bersih bulan tersebut.
- Halaman user (`/kas`) menampilkan grafik yang sama persis dengan admin (bar/line chart pemasukan vs pengeluaran), kecuali form input manual (yang hanya ada di `/admin/kas`).
- Halaman beranda user hanya menampilkan progress bar sederhana "% anggota lunas bulan ini" — bukan grafik kas penuh.

## 10. Integrasi Notifikasi WhatsApp (WAHA)

- Saat struk ditolak (`REJECTED`), backend memanggil WAHA API (`POST {WAHA_BASE_URL}/api/sendText`) dengan payload nomor tujuan `Anggota.noHpWa` dan pesan berisi nama anggota + alasan penolakan.
- WAHA base URL & session name disimpan sebagai environment variable (`WAHA_BASE_URL`, `WAHA_SESSION`, `WAHA_API_KEY` jika perlu).
- Kegagalan pengiriman WA (nomor invalid, WAHA down) tidak boleh menggagalkan proses reject struk — dijalankan sebagai best-effort/fire-and-forget dengan logging error.

## 11. Validasi & Error Handling Kunci

- Sign up: nama+gender harus unik (tidak boleh duplikat), no HP harus format Indonesia valid, password minimal panjang tertentu (misal 6 karakter).
- Upload struk: validasi tipe file (jpg/png/pdf opsional), ukuran maksimal (misal 5MB).
- Password re-entry salah 3x berturut-turut pada satu sesi upload → tampilkan cooldown singkat (opsional, untuk mencegah brute-force sederhana).
- Admin password salah → tidak ada lockout keras (karena shared password), tapi bisa ditambahkan rate-limit dasar di middleware.
