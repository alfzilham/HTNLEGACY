# Context Project

Project ini adalah aplikasi administrasi iuran dan kas organisasi dengan multi-role anggota dan Admin/Bendahara.

## Prinsip Utama

- Anggota mengirim file receipt bersama data dasar yang valid.
- Server menyimpan file dan record receipt dengan status `PENDING`.
- Admin/Bendahara memeriksa gambar secara manual lalu memilih `APPROVED` atau `REJECTED`.
- Receipt yang ditolak dapat dikirim ulang setelah status aktif sebelumnya selesai.
- WhatsApp hanya digunakan melalui tautan manual `wa.me`.
- Transaksi, audit log, import/export, notifikasi manual, dan siklus laporan dipertahankan.

## Siklus Bulanan

Receipt dan status pembayaran dikelompokkan berdasarkan `periodeBulan`. Transaksi keuangan bersifat historis dan tidak dihapus saat reset siklus. Pembersihan storage receipt hanya dilakukan melalui aksi reset yang memang disediakan Admin setelah arsip dibuat.
