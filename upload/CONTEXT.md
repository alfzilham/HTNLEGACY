# CONTEXT.md

## Latar Belakang

Aplikasi ini dibangun untuk kebutuhan internal sebuah organisasi/komunitas (kode proyek: **SIDU**, dengan contoh event/instance bernama "HTN 26") untuk mencatat dan mengelola **iuran kas bulanan anggota**. Sebelumnya proses ini kemungkinan dilakukan manual (catatan kertas, grup WhatsApp, atau spreadsheet terpisah), yang menyulitkan:

- Bendahara melacak siapa yang sudah/belum membayar iuran bulanan.
- Anggota mengetahui status pembayaran mereka sendiri maupun transparansi kolektif.
- Verifikasi bukti transfer dilakukan manual satu per satu.
- Pencatatan kas (pemasukan dari iuran + pengeluaran operasional) terpisah dari data keanggotaan.
- Pengingat ke anggota yang menunggak dilakukan manual.

## Asal Mula Requirement

Requirement awal berasal dari catatan tulisan tangan yang mencantumkan struktur dasar: halaman utama dengan total anggota, status lunas/belum lunas/nunggak (dengan kode warna hijau/putih/merah), top bar, side bar dengan menu navigasi, halaman barcode pembayaran dengan kontak panitia (Bendahara, Sekretaris, Kompting), dan pemisahan data berdasarkan gender.

Referensi arsitektur aplikasi sejenis diambil dari proyek open-source **PeusijeukAdoeApp** (github.com/pusakajeumala26/PeusijeukAdoeApp) — sebuah platform pencatatan kehadiran reuni sekolah dengan pola: import data massal dari Excel, konfirmasi mandiri oleh peserta via link, rekap real-time oleh panitia, dan export laporan multi-format. Pola arsitektural ini diadaptasi, namun **domain bisnisnya berbeda total** — dari "kehadiran reuni" menjadi "pencatatan & verifikasi iuran kas bulanan dengan alur persetujuan bukti bayar".

Melalui sesi brainstorming lanjutan, scope berkembang signifikan dari requirement awal menjadi sistem keuangan kas yang mencakup: autentikasi pengguna, verifikasi struk otomatis (OCR + AI fallback), integrasi notifikasi WhatsApp, pencatatan buku kas (pemasukan/pengeluaran), grafik keuangan, dan siklus hidup bulanan (reset status + arsip data).

## Siapa Pengguna Sistem Ini

1. **Anggota (User)** — individu yang terdaftar dan wajib membayar iuran bulanan. Mendaftar sekali (sign up permanen), lalu login tiap kali mengakses aplikasi. Bisa melihat status seluruh anggota, melihat progres kolektif, dan meng-upload bukti bayar (struk) — baik untuk dirinya sendiri maupun (dengan otorisasi password) membantu anggota lain.

2. **Admin / Bendahara** — pengelola sistem yang memverifikasi struk, mencatat transaksi manual (kas masuk dari pembayaran tunai, kas keluar untuk pengeluaran operasional), mengelola data anggota, melakukan impor data massal di awal, dan menjalankan siklus penutupan bulanan (unduh arsip + reset status). Mengakses lewat rute tersembunyi `/admin` yang diproteksi satu password bersama (disimpan di environment variable), dibagikan terbatas hanya ke pihak yang berwenang (Bendahara, dan pihak lain yang dipercaya).

3. **Sistem otomatis** — proses background yang menjalankan OCR struk, fallback ke Gemini AI saat OCR gagal, dan mengirim notifikasi WhatsApp (via WAHA) ke anggota saat struk ditolak atau mendekati/lewat tenggat waktu.

## Siklus Hidup Bulanan (Konsep Inti)

Sistem ini beroperasi dalam **siklus bulanan berulang**:

1. Anggota membayar iuran sepanjang bulan berjalan → status masing-masing berubah dari `belum_lunas` menjadi `lunas` (via verifikasi struk atau input manual admin) atau `tertunggak` (jika lewat tenggat dan belum bayar).
2. Transaksi kas (pemasukan dari iuran + pengeluaran manual) terakumulasi sepanjang bulan dan **tidak pernah dihapus** — menjadi riwayat keuangan permanen yang bisa dilihat per bulan di halaman grafik.
3. Di akhir siklus, admin mengunduh laporan (file `.zip` berisi seluruh gambar struk bulan tersebut + rekap Excel), setelah itu mengonfirmasi pembersihan storage struk, yang memicu reset status seluruh anggota kembali ke `belum_lunas` — menandai dimulainya siklus bulan berikutnya.
4. Akun anggota (nama, gender, no HP, password) **bersifat permanen** dan tidak ikut ter-reset — anggota tidak perlu mendaftar ulang setiap bulan.

Konsep ini membedakan aplikasi ini dari sistem pencatatan keanggotaan biasa: ia adalah aplikasi "keuangan kas periodik" di mana identitas pengguna persisten, tetapi status transaksionalnya siklikal per bulan, sementara riwayat/arsip keuangan bersifat kumulatif permanen.

## Batasan & Asumsi yang Disepakati

- Ini adalah sistem internal skala kecil (satu organisasi/komunitas), bukan produk SaaS multi-tenant.
- Tidak ada hierarki role kompleks — hanya dua level akses: **Anggota** dan **Admin** (dengan Bendahara sebagai bagian dari Admin).
- Password anggota disimpan dengan **enkripsi reversibel** (bukan hash satu arah), by design, agar admin dapat melihat/memberitahukan password asli saat anggota lupa — trade-off keamanan yang disadari dan diterima mengingat skala & konteks penggunaan internal.
- Tidak ada fitur ubah password mandiri oleh anggota; perubahan password hanya lewat admin.
- Nominal iuran bersifat tunggal (berlaku sama untuk semua anggota), namun dapat diubah admin kapan saja melalui halaman pengaturan.
- Reset siklus bulanan bersifat **manual** (dipicu aksi admin), bukan terjadwal otomatis berdasarkan tanggal kalender.
