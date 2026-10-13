# DESIGN.md — Design System (Neo-Brutalist Playful)

## 1. Arah Desain

Gaya visual yang digunakan adalah **neo-brutalist playful** — terinspirasi dari aplikasi referensi (kliping link bertema warna-warni), dicirikan oleh:

- Border tebal solid berwarna hitam di hampir semua elemen interaktif (card, button, input).
- Shadow offset solid (bukan blur/soft shadow) — efek "menempel" seperti stiker/kartu fisik.
- Warna blok cerah dan kontras tinggi sebagai aksen (bukan gradient, bukan pastel pudar).
- Tipografi besar, tebal (bold/black weight), sedikit playful tapi tetap terbaca jelas.
- Rounded corner **ringan** (radius kecil, bukan pill-shape penuh, bukan juga siku tajam 0px) — titik tengah antara brutalist keras dan friendly modern.
- Komponen terasa "fungsional dulu, dekoratif kemudian" — tidak ada ornamen yang mengurangi keterbacaan data (ingat ini aplikasi keuangan, kejelasan angka/status jauh lebih penting dari estetika).

Referensi struktural dari skill `industrial-brutalist-ui` diambil untuk **prinsip grid kaku dan ketegasan border**, namun **palet warna dan nuansa rounded mengikuti arah playful**, bukan arah industrial/tactical gelap-monospace dari skill tersebut.

## 2. Palet Warna

### 2.1 Warna Dasar (Netral)

```css
--bg-base: #faf9f6; /* latar belakang utama, off-white hangat */
--ink: #111111; /* teks utama & border, hampir hitam pekat */
--surface: #ffffff; /* latar card/komponen */
```

### 2.2 Warna Status (Krusial — Dipakai Konsisten di Seluruh App)

```css
--status-lunas: #4ade80; /* hijau cerah */
--status-lunas-bg: #d9ffe6; /* hijau pucat untuk background badge/card */

--status-belum-lunas: #ffffff; /* putih/netral, sesuai requirement awal "putih" */
--status-belum-lunas-border: #d4d4d4;

--status-tertunggak: #ff4d4d; /* merah cerah */
--status-tertunggak-bg: #ffe0e0;

--status-pending: #fbbf24; /* kuning amber, untuk struk menunggu verifikasi */
--status-pending-bg: #fff4d1;
```

### 2.3 Warna Aksen (Brand & Interaktif)

```css
--accent-primary: #ffc700; /* kuning cerah — tombol utama, highlight */
--accent-secondary: #a78bfa; /* ungu — elemen sekunder, badge gender/kategori */
--accent-tertiary: #60a5fa; /* biru — link, info */
--accent-danger: #ff4d4d; /* sama dengan tertunggak, untuk aksi destruktif (hapus) */
```

> Catatan implementasi: gunakan CSS variables (bukan hardcode hex di tiap komponen) agar tema bisa dikonsolidasi/diubah dari satu tempat (`globals.css` atau `tailwind.config` dengan `theme.extend.colors`).

## 3. Tipografi

- **Font utama**: **`Plus Jakarta Sans`** (wajib) — font sans-serif modern dengan karakter geometris-humanis yang tetap tegas saat bold/extrabold, cocok untuk nuansa brutalist playful. Diambil via Google Fonts (`@import` atau `<link>`), dengan fallback stack: `'Plus Jakarta Sans', 'Inter', system-ui, sans-serif`. Gunakan varian weight `400, 500, 600, 700, 800` sesuai kebutuhan skala di bawah.
- **Skala ukuran**:
  - Heading besar (judul halaman): `2rem–2.5rem`, weight `800` (extrabold/black).
  - Sub-heading (nama section): `1.25rem–1.5rem`, weight `700`.
  - Body text: `1rem`, weight `500–600` (medium/semibold — brutalist jarang pakai regular/light karena kurang tegas).
  - Angka nominal (uang, total): gunakan `tabular-nums` agar rata, weight `700`, ukuran sedikit lebih besar dari body text sekitarnya.

## 4. Komponen Kunci

### 4.1 Card / Container

```css
.brutal-card {
  background: var(--surface);
  border: 3px solid var(--ink);
  border-radius: 12px;
  box-shadow: 6px 6px 0px var(--ink); /* offset solid, bukan blur */
}
```

### 4.2 Button

- Border tebal sama seperti card, shadow offset yang mengecil/hilang saat ditekan (`:active`) untuk efek "tombol fisik tertekan":

```css
.brutal-button {
  border: 3px solid var(--ink);
  border-radius: 8px;
  box-shadow: 4px 4px 0px var(--ink);
  transition:
    transform 0.1s,
    box-shadow 0.1s;
}
.brutal-button:active {
  transform: translate(4px, 4px);
  box-shadow: 0px 0px 0px var(--ink);
}
```

- Varian warna: primary (`--accent-primary`), danger (`--accent-danger` untuk hapus/reject), neutral (putih/`--surface` untuk aksi sekunder).

### 4.3 Badge Status

Badge status (lunas/belum lunas/tertunggak/pending) adalah komponen paling sering dilihat user — harus konsisten di semua halaman (beranda, daftar filter, tabel admin):

```css
.badge-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border: 2px solid var(--ink);
  border-radius: 999px; /* badge boleh lebih pill dari card biasa, untuk diferensiasi visual */
  font-weight: 700;
  font-size: 0.875rem;
}
```

Setiap badge disertai label teks eksplisit (bukan hanya warna) — penting untuk aksesibilitas (tidak semua orang bisa bedakan warna dengan jelas): "● Lunas", "○ Belum Lunas", "● Tertunggak", "◐ Pending".

### 4.4 Input Field

```css
.brutal-input {
  border: 3px solid var(--ink);
  border-radius: 8px;
  padding: 10px 14px;
  background: var(--surface);
  font-weight: 600;
}
.brutal-input:focus {
  outline: none;
  box-shadow: 3px 3px 0px var(--accent-primary);
}
```

### 4.5 Modal

Mengingat ada modal penting yang **tidak bisa ditutup** (wajib download laporan), desain modal harus secara visual menegaskan urgensi:

- Modal wajib (non-dismissible): tanpa tombol "X" di pojok, border lebih tebal (`4px`), warna aksen `--accent-primary` atau `--status-pending` pada header untuk menandakan "aksi diperlukan".
- Modal konfirmasi biasa (bisa dibatalkan): tetap pakai border brutalist standar, ada tombol "X"/Batal.

### 4.6 Navigasi (Top Bar & Side Bar)

Mengacu ke requirement & gambar sidebar "HTN 26":

- **Top bar**: hamburger icon (kiri) + brand/logo + nama brand (tengah/kiri), search bar rata kanan — semua dengan border bawah tebal solid memisahkan dari konten.
- **Side bar**: brand + nama brand + collapse icon di atas, lalu grup menu dengan label kategori huruf kapital kecil abu-abu (seperti "KATEGORI", "NAVIGASI", "DATA" di referensi), tiap item menu pakai icon outline sederhana + label teks, item aktif mendapat background highlight abu-abu muda dengan border radius kecil.

## 5. Ikonografi

- **Wajib** menggunakan `lucide-react` sebagai satu-satunya icon library — outline/line-based, konsisten di seluruh aplikasi, tersedia sebagai library native di lingkungan React/Next.js (bukan via CDN gambar, tapi import komponen langsung: `import { Check, Clock, AlertTriangle } from 'lucide-react'`).
- **Dilarang** menggunakan icon emoji (🟢, ✅, ⏰, dsb.) di mana pun dalam UI — baik sebagai pengganti icon maupun dekorasi teks. Emoji tidak konsisten renderingnya lintas OS/browser dan tidak selaras dengan nuansa brutalist yang tegas.
- Hindari icon filled/solid penuh kecuali untuk menandakan status aktif/terpilih.
- Icon status harus selalu berpasangan dengan warna + bentuk berbeda (lingkaran centang untuk lunas, jam untuk belum lunas, dokumen/warning untuk tertunggak) — mengikuti pola di gambar referensi sidebar.
- Ukuran icon konsisten per konteks: `16px` untuk inline/badge, `20px` untuk item menu, `24px` untuk header/top bar. Gunakan `stroke-width` default `2` (sedikit lebih tebal, `2.5`, boleh dipakai untuk icon status agar senada dengan border tebal komponen lain).

## 6. Layout & Responsif

- **Mobile-first**: breakpoint utama di `640px` (mobile) dan `1024px` (desktop/tablet besar), karena mayoritas anggota kemungkinan akses dari HP.
- Side bar di mobile berubah jadi drawer/overlay (muncul dari kiri, menutupi konten saat dibuka via hamburger) — bukan sidebar permanen seperti di desktop.
- Tabel admin (daftar anggota dengan banyak kolom) di mobile sebaiknya beralih ke tampilan card per-baris (bukan scroll horizontal tabel biasa) agar tetap mudah dibaca.
- Grafik kas menggunakan library chart yang responsif (`recharts` direkomendasikan, kompatibel dengan React).

## 7. Prinsip Konsistensi Warna Status (Wajib Dipatuhi)

Karena status pembayaran adalah inti aplikasi ini, **warna status harus 100% konsisten** di seluruh halaman — beranda, daftar filter, tabel admin, bahkan notifikasi WA (jelaskan status dalam teks, bukan warna, untuk WA). Jangan sampai developer menggunakan warna berbeda untuk status yang sama di halaman berbeda — ini bisa membingungkan pengguna dan mengurangi kepercayaan pada data yang ditampilkan.

## 8. Dark Mode

Tidak menjadi prioritas MVP (di luar scope awal) — fokus pada satu tema terang (light) yang konsisten dengan nuansa playful-brutalist. Bisa ditambahkan di masa depan sebagai enhancement, bukan requirement awal.

## 9. Custom UI Controls (Scrollbar, Dropdown, Checkbox, dll.)

Komponen native browser (scrollbar, select/dropdown, checkbox) harus di-restyle agar konsisten dengan nuansa brutalist playful, bukan dibiarkan tampil default. Semua transisi/animasi menggunakan durasi pendek (`150–250ms`) dengan easing halus (`ease-out` / `cubic-bezier(0.4, 0, 0.2, 1)`) — smooth tapi tetap responsif, tidak lambat.

### 9.1 Custom Scrollbar (Webkit + Firefox fallback)

```css
/* Webkit (Chrome, Safari, Edge) */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
::-webkit-scrollbar-track {
  background: var(--bg-base);
}
::-webkit-scrollbar-thumb {
  background: var(--ink);
  border-radius: 8px;
  border: 2px solid var(--bg-base);
}
::-webkit-scrollbar-thumb:hover {
  background: var(--accent-primary);
}

/* Firefox fallback */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--ink) var(--bg-base);
}
```

### 9.2 Custom Dropdown / Select

- Tidak memakai `<select>` native tanpa styling — gunakan komponen custom (mis. Radix UI `Select` atau headless UI sejenis) yang di-style mengikuti `.brutal-input` (border 3px solid, radius kecil).
- Saat dibuka: panel dropdown muncul dengan transisi `opacity` + `translateY(-4px → 0)` durasi ~180ms, disertai shadow offset solid (`4px 4px 0px var(--ink)`) seperti card lain.
- Opsi aktif/hover mendapat background `--accent-primary` pudar atau highlight abu-abu muda, dengan transisi `background-color` smooth (~150ms) — bukan perubahan instan.
- Chevron icon (dari `lucide-react`, `ChevronDown`) berotasi 180° dengan transisi `transform 200ms ease-out` saat dropdown terbuka.

### 9.3 Custom Checkbox & Radio

```css
.brutal-checkbox {
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2.5px solid var(--ink);
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background-color 150ms ease-out,
    transform 100ms ease-out;
}
.brutal-checkbox:checked {
  background: var(--accent-primary);
}
.brutal-checkbox:active {
  transform: scale(0.92);
}
```

- Checkmark icon (`Check` dari `lucide-react`) di-render di atas checkbox saat `:checked`, muncul dengan transisi `scale(0 → 1)` + `opacity` singkat agar terasa "pop" tapi tetap halus.
- Radio button mengikuti pola serupa dengan `border-radius: 999px` dan indikator titik tengah alih-alih checkmark.

### 9.4 Prinsip Umum Animasi

- Semua state transition (hover, focus, active, open/close) harus pakai `transition`, bukan perubahan instan — namun tetap singkat (150–250ms) agar terasa responsif, bukan "berat".
- Hindari animasi berlebihan (bounce/elastic ekstrem) yang bertentangan dengan karakter brutalist yang tegas — gunakan easing halus standar, bukan efek playful yang berlebihan.
- Hormati preferensi pengguna: sertakan media query berikut agar animasi dinonaktifkan untuk pengguna yang sensitif terhadap motion.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 10. Accessibility (A11y)

Aksesibilitas bukan tambahan opsional — berikut ketentuan wajib agar aplikasi dapat digunakan oleh audiens seluas mungkin, termasuk pengguna dengan keterbatasan penglihatan atau yang bergantung pada keyboard/screen reader:

- **Kontras warna**: semua kombinasi teks-di-atas-background harus memenuhi minimum WCAG AA (rasio kontras ≥ 4.5:1 untuk teks normal, ≥ 3:1 untuk teks besar/bold ≥18px). Perhatikan khusus warna status seperti `--status-pending` (#FBBF24) dan `--accent-primary` (#FFC700) di atas `--surface` putih — cek kontrasnya, tambahkan teks berwarna `--ink` di atasnya bila perlu, jangan andalkan warna terang sebagai background teks kecil.
- **Tidak bergantung pada warna saja**: status (lunas/belum lunas/tertunggak/pending) selalu disertai label teks eksplisit dan/atau bentuk ikon berbeda (sudah ditetapkan di §4.3 dan §5) — konsisten dipertahankan.
- **Focus indicator**: semua elemen interaktif (button, input, dropdown, checkbox, link, menu item) harus memiliki `focus-visible` state yang jelas terlihat — gunakan outline/shadow offset kontras tinggi (mis. `box-shadow: 0 0 0 3px var(--accent-tertiary)`), jangan pernah `outline: none` tanpa pengganti.
- **Navigasi keyboard penuh**: seluruh fungsi (termasuk dropdown custom, modal, sidebar drawer di mobile) harus bisa dioperasikan tanpa mouse — `Tab`/`Shift+Tab` untuk navigasi, `Enter`/`Space` untuk aktivasi, `Esc` untuk menutup modal/dropdown (kecuali modal wajib non-dismissible di §4.5).
- **Target sentuh (touch target)**: elemen interaktif di mobile minimal `44x44px` area tap, meskipun visual icon/elemennya lebih kecil (gunakan padding tambahan).
- **Atribut ARIA & semantik HTML**: gunakan elemen native semantik dulu (`<button>`, `<nav>`, `<label>` untuk input) sebelum menambah ARIA. Untuk komponen custom (dropdown, modal, checkbox custom) tambahkan role & atribut ARIA yang sesuai (`role="dialog"` + `aria-modal="true"` untuk modal, `aria-expanded` untuk dropdown, `aria-checked` untuk checkbox custom, dll.), serta `aria-label`/`aria-labelledby` untuk icon-only button.
- **Teks alternatif**: semua icon fungsional yang tidak disertai label teks (mis. icon-only button di top bar) wajib punya `aria-label` deskriptif.
- **Prefers-reduced-motion**: dihormati sesuai §9.4 di atas.
- **Skala teks responsif terhadap browser zoom**: gunakan unit relatif (`rem`) untuk ukuran font (sudah menjadi acuan di §3), pastikan layout tidak rusak saat teks di-zoom hingga 200%.
