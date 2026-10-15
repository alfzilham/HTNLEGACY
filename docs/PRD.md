# Product Requirements Document

## Tujuan

Menyediakan sistem iuran, receipt, dan kas yang mudah digunakan serta dapat diverifikasi secara manual oleh Bendahara/Admin.

## Fitur

- Registrasi dan login anggota.
- Upload foto atau file receipt dengan validasi dasar.
- Receipt langsung masuk antrean review dengan status `PENDING`.
- Review manual gambar oleh Admin/Bendahara.
- Approve receipt membuat anggota `LUNAS` dan mencatat transaksi pemasukan secara atomik.
- Reject receipt menyimpan alasan dan membuat anggota dapat mengirim ulang.
- Anggota dengan receipt `PENDING` atau `APPROVED` tidak tersedia untuk submit receipt kedua pada periode yang sama.
- WhatsApp manual menggunakan tautan `wa.me`.
- Kas manual, audit log, import/export, laporan, storage, dan pengaturan tetap tersedia.

## Batasan

Tidak ada pembacaan isi gambar otomatis, penilaian gambar otomatis, service pemrosesan receipt, service WhatsApp, webhook WhatsApp, atau proses background WhatsApp.
