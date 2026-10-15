# Technical Specification

## Status Receipt

```text
PENDING   menunggu review manual
APPROVED  disetujui Admin/Bendahara
REJECTED  ditolak dan dapat dikirim ulang
```

## Endpoint Receipt

- `POST /api/struk/upload`: validasi anggota, password per aksi, tipe file, ukuran file, dan receipt aktif; simpan file lalu buat `PENDING`.
- `POST /api/struk/[id]/verify`: Admin approve atau reject receipt.
- `GET /api/anggota/[id]/struk`: Admin melihat riwayat receipt tanpa pemrosesan isi otomatis.

## Aturan Submit

Receipt `PENDING` atau `APPROVED` memblokir submit kedua untuk anggota dan periode yang sama. Receipt `REJECTED` tidak memblokir pengiriman ulang. Pemeriksaan dilakukan di server, bukan hanya frontend.

## Approval dan Kas

Approval receipt memperbarui status anggota dan membuat transaksi `MASUK` dengan nominal iuran dalam transaksi database yang sama. Fitur pencatatan kas manual tetap dipertahankan.

## WhatsApp

WhatsApp hanya menggunakan link manual `https://wa.me/<nomor>?text=<pesan>`. Tidak ada session, webhook, service 24/7, atau pengiriman otomatis.
