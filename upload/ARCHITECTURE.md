# Architecture

Next.js menangani frontend dan API, Prisma menangani database, dan filesystem menyimpan file receipt. Alur receipt adalah validasi dasar, simpan file, buat `PENDING`, lalu review manual Admin/Bendahara. Approval dan transaksi pemasukan dilakukan atomik. WhatsApp hanya berupa tautan manual `wa.me`; tidak ada service tambahan.
