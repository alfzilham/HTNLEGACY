# PRD.md — Product Requirements Document

## 1. Ringkasan Produk

**Nama Proyek:** SIDU (contoh instance: "HTN 26")
**Jenis:** Aplikasi web internal untuk pencatatan & verifikasi iuran kas bulanan organisasi.
**Target Pengguna:** Anggota organisasi (pembayar iuran) dan Admin/Bendahara (pengelola kas).

**Tujuan Produk:**
Menggantikan proses pencatatan iuran kas manual dengan sistem digital yang transparan (semua anggota bisa lihat status pembayaran), terverifikasi (struk diperiksa otomatis + manual), dan terdokumentasi (riwayat keuangan per bulan, arsip otomatis).

## 2. Masalah yang Diselesaikan

| Masalah Lama | Solusi di Produk Ini |
|---|---|
| Bendahara mencatat manual siapa yang sudah bayar | Status otomatis ter-update saat struk diverifikasi |
| Anggota tidak tahu status dirinya/orang lain | Daftar status real-time dengan badge warna, terlihat semua anggota |
| Verifikasi bukti transfer manual satu-satu | OCR otomatis + fallback AI, bendahara tinggal approve/reject |
| Anggota menunggak tidak ditegur tepat waktu | Notifikasi WhatsApp otomatis via WAHA saat struk ditolak |
| Pencatatan kas (masuk/keluar) terpisah dari data iuran | Satu sistem terintegrasi, grafik kas per bulan |
| Data struk menumpuk, storage penuh | Arsip otomatis ke `.zip` + pembersihan storage terkontrol di akhir bulan |

## 3. User Roles & Permissions

### 3.1 Anggota (User)
- Sign up sekali (permanen): Gender, Nama Lengkap, No. HP/WhatsApp aktif, Password.
- Login: Gender, Nama Lengkap, Password.
- Melihat halaman beranda: progres % lunas bulan berjalan + daftar semua anggota dengan status.
- Melihat halaman barcode pembayaran (statis) + kontak panitia.
- Melihat daftar terfilter: Lunas / Belum Lunas / Tertunggak.
- Melihat halaman grafik kas (pemasukan vs pengeluaran, per bulan, terarsip).
- Upload struk pembayaran — atas nama dirinya sendiri atau anggota lain, dengan syarat memasukkan ulang password milik nama yang dipilih (otorisasi per-aksi).
- **Tidak bisa**: mengubah password sendiri, mengubah status pembayaran manapun, mengakses data admin, menghapus data.

### 3.2 Admin (termasuk Bendahara)
- Akses via rute tersembunyi `/admin`, diproteksi satu password bersama (`.env`), tanpa akun individual.
- Melihat & mengelola tabel seluruh anggota: Gender, Status, Nama Lengkap, No. HP/WA, Password (dapat dilihat via icon mata — lihat catatan keamanan di ARCHITECTURE.md), aksi hapus akun (row), aksi preview struk yang pernah diupload.
- Mengubah status pembayaran anggota secara manual.
- Memverifikasi (approve/reject) struk yang berstatus `pending`.
- Mencatat transaksi pemasukan manual (uang cash diterima langsung).
- Mencatat transaksi pengeluaran manual (operasional organisasi).
- Melihat grafik pemasukan vs pengeluaran per bulan.
- Import data anggota massal dari `.xlsx` atau `.json` (untuk setup awal).
- Mengatur nominal iuran bulanan (default Rp15.000, editable).
- Mengunduh laporan bulanan (`.zip`: seluruh gambar struk + rekap Excel) dan memicu reset siklus bulanan.
- Menghapus seluruh data (reset total, aksi destruktif, butuh konfirmasi eksplisit).

### 3.3 Sistem Otomatis
- Menjalankan OCR pada struk yang diupload.
- Fallback ke Gemini AI jika OCR gagal membaca.
- Mengirim notifikasi WhatsApp (via WAHA) ke nomor anggota saat struk ditolak oleh bendahara.
- (Opsional/masa depan) Mengirim pengingat H- sebelum atau saat status berubah jadi tertunggak.

## 4. User Flows Utama

### 4.1 Flow Anggota Baru
1. Buka aplikasi → diarahkan ke halaman Login (default).
2. Belum punya akun → klik link ke halaman Sign Up.
3. Isi form: Gender, Nama Lengkap, No. HP/WA, Password → submit.
4. Redirect ke halaman Login → login dengan kredensial yang baru dibuat.
5. Masuk ke Beranda.

### 4.2 Flow Upload Struk
1. Di Beranda, anggota melihat daftar semua anggota dengan badge status.
2. Tap nama (bisa nama sendiri atau nama anggota lain).
3. Modal muncul meminta password milik nama yang dipilih.
4. Password benar → form upload gambar struk muncul.
5. Submit → sistem menjalankan OCR → (fallback AI jika perlu) → jika gagal total, sistem menolak otomatis dengan pesan error.
6. Jika scan berhasil, status berubah jadi `pending` menunggu verifikasi admin.

### 4.3 Flow Verifikasi Admin
1. Admin login ke `/admin` dengan password khusus.
2. Melihat daftar struk berstatus `pending`.
3. Approve → status anggota jadi `lunas`, transaksi pemasukan otomatis tercatat.
4. Reject → status anggota kembali ke status sebelumnya (`belum_lunas`/`tertunggak`), sistem mengirim notifikasi WhatsApp ke anggota via WAHA bahwa struknya ditolak.

### 4.4 Flow Penutupan Bulanan
1. Admin membuka halaman admin, sistem mendeteksi (berdasarkan kondisi yang ditentukan admin atau tombol manual) saatnya tutup bulan.
2. Admin klik "Unduh Laporan" → sistem generate `.zip` (gambar struk + Excel rekap) → modal wajib muncul (tidak bisa ditutup) sampai file selesai terdownload.
3. Setelah download sukses, modal konfirmasi kedua muncul: "Bersihkan storage sekarang?"
4. Admin konfirmasi → sistem menghapus seluruh file struk dari storage dan mereset status seluruh anggota ke `belum_lunas`. Data transaksi/grafik **tidak terhapus**.

### 4.5 Flow Import Data Awal
1. Admin membuka menu Import Excel/JSON di `/admin`.
2. Upload file.
3. Sistem memproses baris per baris; jika nama sudah ada di database, baris tersebut di-skip.
4. Sebelum eksekusi, sistem menampilkan modal peringatan risiko (menjelaskan konsekuensi duplikasi/skip) yang harus disetujui admin.
5. Hasil import ditampilkan (jumlah berhasil, jumlah di-skip).

## 5. Fitur Berdasarkan Prioritas

### Must Have (MVP)
- Auth (sign up/login) anggota
- Admin access via password `.env`
- CRUD data anggota + status manual oleh admin
- Upload & OCR struk + fallback Gemini AI
- Approval/rejection struk oleh admin
- Halaman beranda dengan daftar status & progres
- Halaman barcode statis + kontak panitia
- Filter daftar Lunas/Belum Lunas/Tertunggak
- Pencatatan transaksi (pemasukan otomatis dari struk approved, pemasukan & pengeluaran manual oleh admin)
- Grafik kas per bulan
- Import Excel/JSON dengan skip-duplicate + modal peringatan
- Siklus bulanan manual: unduh `.zip` → konfirmasi → reset status + clean storage
- Pengaturan nominal iuran (editable)
- Notifikasi WhatsApp via WAHA saat struk ditolak

### Should Have
- Pencarian/filter di tabel admin
- Statistik ringkasan (total kas, jumlah anggota per status) di dashboard admin
- Riwayat log aksi admin (audit trail sederhana)

### Could Have (Masa Depan, di luar scope awal)
- Reminder otomatis H-sebelum deadline via WhatsApp
- Multi-admin dengan akun individual & log terpisah
- Export laporan dalam format PDF

### Won't Have (Eksplisit di luar scope)
- Payment gateway terintegrasi (QRIS dinamis per transaksi) — barcode tetap statis
- Fitur ubah password mandiri oleh anggota
- Multi-organisasi/tenant dalam satu instance aplikasi

## 6. Metrik Keberhasilan (Kualitatif, karena internal tool)

- Admin tidak perlu lagi mencatat status iuran manual di luar sistem.
- Waktu verifikasi struk per anggota berkurang (OCR mengurangi input manual data nominal/tanggal).
- Semua anggota dapat mengecek status pembayaran mereka sendiri dan orang lain tanpa bertanya ke bendahara.
- Proses tutup buku bulanan terdokumentasi rapi tanpa kehilangan data histori keuangan.

## 7. Kebutuhan Non-Fungsional Ringkas

- Responsive (mobile-first, karena anggota kemungkinan besar akses dari HP).
- Operasional dengan tim developer kecil / solo — kompleksitas infrastruktur ditekan seminimal mungkin (tanpa cron job wajib, reset manual).
- Desain visual: neo-brutalist playful — lihat `DESIGN.md`.
- Keamanan: lihat catatan trade-off password reversible-encryption di `ARCHITECTURE.md` — diterima karena konteks organisasi internal berskala kecil.
