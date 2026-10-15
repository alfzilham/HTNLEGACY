# Technical Specification

`POST /api/struk/upload` hanya memvalidasi data dasar dan file, lalu menyimpan receipt berstatus `PENDING`. Tidak ada pembacaan atau validasi isi receipt otomatis.

`POST /api/struk/[id]/verify` mendukung `approve` dan `reject`. Receipt aktif `PENDING` atau `APPROVED` mencegah submit kedua, sedangkan `REJECTED` dapat dikirim ulang. WhatsApp hanya menggunakan tautan manual `wa.me`.
