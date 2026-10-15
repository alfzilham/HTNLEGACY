# ARCHITECTURE.md — System Architecture

## 1. Gambaran Arsitektur Tingkat Tinggi

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│   React Components (Next.js App Router) — Mobile-first           │
└───────────────────────────────┬───────────────────────────────────┘
                                 │ HTTPS
┌───────────────────────────────▼───────────────────────────────────┐
│                  NEXT.JS APPLICATION (Single Deployment)           │
│                                                                     │
│  ┌───────────────┐   ┌─────────────────┐   ┌────────────────────┐ │
│  │  App Router    │   │  Route Handlers  │   │  Middleware        │ │
│  │  (Pages/UI)    │   │  (/api/**)       │   │  (auth guard utk    │ │
│  │                │   │                   │   │   /admin & session) │ │
│  └───────────────┘   └────────┬──────────┘   └────────────────────┘ │
│                                 │                                    │
│                        ┌────────▼─────────┐                         │
│                        │  Prisma Client     │                        │
│                        └────────┬───────────┘                        │
└────────────────────────────────┼─────────────────────────────────────┘
                                   │
                 ┌─────────────────┼──────────────────┬───────────────────┐
                 │                 │                  │                   │
        ┌────────▼───────┐ ┌──────▼───────┐  ┌────────▼────────┐ ┌────────▼────────┐
        │  PostgreSQL     │ │  Supabase     │  │  Python OCR      │ │  Gemini AI API    │
        │  (Neon/Supabase)│ │  Storage      │  │  Service          │ │  (fallback OCR)    │
        │  via Prisma     │ │  (gambar struk)│  │  (microservice)   │ │                    │
        └─────────────────┘ └───────────────┘  └───────────────────┘ └────────────────────┘
                                                          │
                                                 ┌────────▼────────┐
                                                 │  WAHA             │
                                                 │  (WhatsApp HTTP   │
                                                 │   API self-hosted)│
                                                 └───────────────────┘
```

## 2. Prinsip Arsitektur

1. **Monolith sederhana, bukan microservices penuh** — Next.js menangani frontend + backend API dalam satu deployment untuk meminimalkan kompleksitas operasional (sesuai konteks: tim kecil, aplikasi internal). Pengecualian: OCR Python berjalan sebagai service terpisah karena kebutuhan library Python (misal Tesseract/EasyOCR) yang tidak native di runtime Node.js/Next.js.
2. **Tanpa job scheduler wajib** — status `TERTUNGGAK` dihitung on-the-fly, reset bulanan dipicu manual oleh admin. Ini sengaja menghindari ketergantungan pada cron job eksternal (Vercel Cron, dsb) yang menambah titik kegagalan dan kompleksitas deployment.
3. **Dua ranah otorisasi terpisah**: sesi anggota (akses baca) dan sesi admin (akses kelola), keduanya independen — admin tidak "login sebagai salah satu anggota", dan anggota tidak otomatis jadi admin meski tahu data lain.
4. **Otorisasi berlapis untuk aksi sensitif** — login sesi hanya untuk *melihat*; aksi *mengubah data* (upload struk) butuh re-entry password per aksi. Ini pola yang tidak umum tapi disengaja sesuai kebutuhan produk (siapa pun bisa bantu input, asal tahu password orang tsb).
5. **Data transaksional vs data arsip dipisah secara eksplisit** — `Anggota.status` bersifat siklikal (reset tiap bulan), `Transaksi` bersifat permanen/kumulatif. Pemisahan ini krusial dan harus konsisten diterapkan di semua query terkait grafik vs status.

## 3. Komponen Sistem

### 3.1 Next.js Application (Core)
- **Frontend**: App Router, React Server Components untuk halaman statis/list, Client Components untuk form interaktif (modal password, upload struk, grafik).
- **Backend**: Route Handlers di `app/api/**/route.ts`, menjalankan business logic, validasi, dan akses Prisma.
- **Middleware**: `middleware.ts` mengecek cookie sesi untuk melindungi rute `/admin/**` dan `/api/admin/**`; rute publik (`/login`, `/signup`, `/barcode`) tidak terproteksi middleware ini, namun rute seperti `/beranda`, `/daftar/**`, `/kas` butuh sesi anggota aktif.

### 3.2 Database Layer (Prisma + PostgreSQL)
- Single source of truth untuk seluruh data terstruktur (anggota, struk metadata, transaksi, settings).
- Rekomendasi hosting: Supabase Postgres (karena storage juga dari Supabase, satu provider menyederhanakan setup) atau Neon sebagai alternatif.
- Migrasi dikelola lewat `prisma migrate`.

### 3.3 File Storage (Supabase Storage)
- Bucket khusus untuk gambar struk, terorganisir per periode bulan: `struk/{YYYY-MM}/{anggotaId}-{timestamp}.ext`.
- Akses publik dibatasi (bucket private + signed URL) agar gambar struk tidak bisa diakses sembarangan tanpa melalui aplikasi.
- Lifecycle: dihapus manual via API saat admin konfirmasi reset siklus bulanan (lihat SPEC.md §8.3).

### 3.4 OCR Service (Python, terpisah)
- Microservice kecil (bisa Flask/FastAPI) yang menerima URL/gambar struk, menjalankan OCR (misal Tesseract atau EasyOCR), mengembalikan teks terstruktur (nominal, tanggal, nama bank, dsb) dalam JSON.
- Dipanggil dari Next.js API route via HTTP fetch internal.
- Dideploy terpisah dari aplikasi Next.js (karena runtime Python berbeda) — bisa di VM kecil, Railway, atau Render.

### 3.5 Gemini AI Fallback
- Dipanggil langsung dari Next.js API route (tidak perlu service terpisah, karena ini REST API call ke Google).
- Prompt terstruktur meminta Gemini mengekstrak data serupa dengan output OCR Python, dalam format JSON yang konsisten agar downstream logic sama.

### 3.6 WAHA (WhatsApp Notification)
- Instance WAHA berjalan terpisah (self-hosted, kemungkinan di VPS yang sama/berbeda), terhubung ke satu nomor WhatsApp organisasi.
- Next.js memanggil REST API WAHA untuk mengirim pesan teks; tidak ada integrasi dua arah kompleks (cukup kirim, tidak perlu terima balasan di MVP).

## 4. Keamanan — Catatan Penting & Trade-off

### 4.1 Enkripsi Password (Bukan Hash)
**Keputusan produk**: password anggota disimpan dengan **enkripsi reversibel (AES-256-GCM)**, bukan hash satu arah (bcrypt/argon2), agar admin dapat melihat password asli lewat fitur "icon mata" di tabel admin — kebutuhan bisnis: anggota yang lupa password harus bisa diberi tahu passwordnya kembali oleh admin, bukan di-reset ke password baru.

**Implikasi keamanan yang harus disadari tim development:**
- Kunci enkripsi (`ENCRYPTION_KEY`, 32-byte) disimpan di environment variable, **tidak pernah di-commit ke repository**.
- Jika database bocor **dan** kunci enkripsi juga bocor, seluruh password anggota dapat didekripsi. Ini risiko yang lebih tinggi dibanding hash (yang mustahil dibalik meski kunci/salt juga bocor).
- Mitigasi yang direkomendasikan:
  - Kunci enkripsi disimpan terpisah dari database (berbeda provider/vault jika memungkinkan).
  - Akses ke environment variable produksi dibatasi ketat.
  - Password anggota **tidak boleh sama dengan password akun penting lain** (edukasi non-teknis ke anggota saat sign up, misal tooltip "gunakan password unik").
- Pendekatan ini diterima secara sadar oleh pemilik produk karena konteks: organisasi internal skala kecil, password berfungsi ganda sebagai PIN otorisasi transaksi (bukan sekadar kredensial login), dan prioritas UX (kemudahan admin membantu anggota) dianggap lebih penting daripada risiko teoretis kebocoran database.

### 4.2 Admin Password Tunggal
- Satu password admin di `.env` (`ADMIN_PASSWORD`), dibagikan terbatas ke pihak berwenang (Bendahara dkk).
- Tidak ada audit trail "siapa admin yang melakukan aksi X" di MVP, karena tidak ada akun admin individual — ini diterima sebagai batasan yang disadari (lihat PRD.md §5 Should Have untuk kemungkinan masa depan).
- Rekomendasi minimal: password admin cukup panjang/kompleks (bukan "admin123"), dan di-rotate berkala jika ada pergantian pengurus organisasi.

### 4.3 Validasi Re-entry Password per Aksi
- Endpoint upload struk memvalidasi password terhadap anggota yang namanya dipilih, bukan terhadap sesi login aktif — penting agar developer tidak secara keliru "menyederhanakan" alur ini dengan memakai sesi login saja (yang akan menghilangkan keamanan per-aksi yang diminta).

### 4.4 Rate Limiting Dasar
- Disarankan menambahkan rate-limit sederhana (misal berbasis IP atau cookie) pada endpoint login, verify-password, dan admin auth untuk mencegah brute-force kasar, meski bukan prioritas MVP yang menghalangi rilis awal.

## 5. Alur Data Kunci (Sequence Ringkas)

### 5.1 Upload & Verifikasi Struk
```
User → POST /api/struk/upload (gambar, anggotaId, password)
     → Server: decrypt & compare password
     → Server: upload gambar ke Supabase Storage
     → Server: call OCR Python service
         → gagal → Server: call Gemini AI fallback
             → gagal juga → Server: respond "struk ditolak, coba lagi"
     → Server: create record Struk (status=PENDING)
     → Server: respond sukses ke User

Admin → GET /admin/struk (lihat daftar pending)
Admin → POST /api/struk/{id}/verify (action: approve/reject)
     → approve: update Anggota.status=LUNAS, create Transaksi(MASUK)
     → reject: update Struk.status=REJECTED, call WAHA API → kirim WA ke Anggota
```

### 5.2 Siklus Bulanan
```
Admin → klik "Mulai Tutup Bulan" di /admin/laporan
     → Modal 1 muncul (wajib) → Admin klik "Unduh Sekarang"
     → POST /api/laporan/generate → server generate .zip → stream download
     → Modal 1 tertutup otomatis setelah download terkonfirmasi selesai
     → Modal 2 muncul: "Bersihkan storage?"
Admin → konfirmasi
     → POST /api/laporan/reset-siklus
         → hapus semua file Supabase Storage path struk/{bulanIni}/**
         → update semua Anggota.status = BELUM_LUNAS
         → (Transaksi TIDAK disentuh)
```

## 6. Environment Variables yang Dibutuhkan

```
DATABASE_URL=              # Postgres connection string (Prisma)
ENCRYPTION_KEY=            # 32-byte key untuk AES-256 password encryption
ADMIN_PASSWORD=            # password tunggal akses /admin
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=
OCR_SERVICE_URL=           # endpoint microservice Python OCR
GEMINI_API_KEY=
WAHA_BASE_URL=
WAHA_SESSION=
WAHA_API_KEY=              # jika instance WAHA mewajibkan API key
JWT_SECRET=                # untuk signing sesi anggota & admin
```

## 7. Deployment

- **Next.js App**: Vercel (paling kompatibel dengan App Router) atau VPS dengan Node.js + PM2.
- **PostgreSQL**: Supabase atau Neon (managed, tidak perlu kelola server DB sendiri).
- **Supabase Storage**: otomatis tersedia jika memakai Supabase untuk DB (satu project).
- **Python OCR Service**: deploy terpisah — opsi: Render, Railway, atau VPS kecil; harus bisa diakses via HTTP dari Vercel (pastikan tidak ada restriksi firewall).
- **WAHA**: self-hosted via Docker, biasanya di VPS yang sama dengan OCR service atau terpisah, terhubung ke satu nomor WhatsApp dedicated organisasi.

## 8. Skalabilitas & Batasan yang Disadari

- Sistem ini didesain untuk skala **puluhan hingga beberapa ratus anggota**, bukan ribuan — pola query (fetch semua anggota sekaligus di halaman beranda) belum dioptimasi untuk pagination skala besar.
- Tidak ada caching layer (Redis, dsb) di MVP — dianggap tidak perlu untuk skala pengguna internal organisasi.
- OCR Python sebagai service terpisah adalah satu-satunya bagian yang benar-benar "microservice"; selebihnya monolith Next.js cukup untuk kebutuhan ini.
