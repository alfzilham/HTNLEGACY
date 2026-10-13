"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings as SettingsIcon,
  Wallet,
  CalendarClock,
  Building2,
  CreditCard,
  QrCode,
  Phone,
  Save,
  Loader2,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { toast as sonnerToast } from "@/components/ui/sonner";

type Settings = {
  id: string;
  nominalIuran: number;
  deadlineTanggal: number;
  namaBank: string | null;
  nomorRekening: string | null;
  barcodeImageUrl: string | null;
  kontakBendahara: string | null;
  kontakSekretaris: string | null;
  kontakKompting: string | null;
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const [s, setS] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("Gagal memuat pengaturan");
        const data = await res.json();
        setS(data);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Gagal memuat");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!s) return;
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nominalIuran: s.nominalIuran,
          deadlineTanggal: s.deadlineTanggal,
          namaBank: s.namaBank,
          nomorRekening: s.nomorRekening,
          kontakBendahara: s.kontakBendahara,
          kontakSekretaris: s.kontakSekretaris,
          kontakKompting: s.kontakKompting,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan");
      setS(data);
      setMsg("Pengaturan berhasil disimpan.");
      sonnerToast.success("Pengaturan berhasil disimpan");
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal menyimpan";
      setErr(msg);
      sonnerToast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleBarcodeUpload(file: File) {
    setUploading(true);
    setErr(null);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-barcode", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal upload barcode");
      setS((prev) => (prev ? { ...prev, barcodeImageUrl: data.url } : prev));
      setMsg("Barcode pembayaran berhasil diperbarui.");
      sonnerToast.success("Barcode pembayaran berhasil diperbarui");
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal upload";
      setErr(msg);
      sonnerToast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!s) {
    return (
      <div className="brutal-card p-6 text-center text-[#6b6b6b] font-semibold">
        Gagal memuat pengaturan.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-11 h-11"
            style={{
              background: "var(--accent-primary)",
              border: "3px solid var(--ink)",
              borderRadius: 10,
              boxShadow: "3px 3px 0px var(--ink)",
            }}
          >
            <SettingsIcon size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Pengaturan</h1>
            <p className="text-sm font-semibold text-[#6b6b6b]">
              Konfigurasi iuran, deadline, kontak panitia, &amp; barcode
            </p>
          </div>
        </div>
      </header>

      {err && (
        <div
          className="px-4 py-3 text-sm font-semibold"
          style={{
            background: "var(--status-tertunggak-bg)",
            border: "3px solid var(--status-tertunggak)",
            borderRadius: 8,
            color: "#7f1d1d",
          }}
          role="alert"
        >
          {err}
        </div>
      )}
      {msg && (
        <div
          className="px-4 py-3 text-sm font-semibold flex items-center gap-2"
          style={{
            background: "var(--status-lunas-bg)",
            border: "3px solid var(--status-lunas)",
            borderRadius: 8,
            color: "#14532d",
          }}
          role="status"
        >
          <CheckCircle2 size={16} strokeWidth={2.5} />
          {msg}
        </div>
      )}

      {/* Form utama */}
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Iuran & Deadline */}
        <section className="brutal-card p-5">
          <h2 className="font-extrabold text-lg mb-4 flex items-center gap-2">
            <Wallet size={18} strokeWidth={2.5} />
            Iuran &amp; Tenggat
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nominal" className="block text-sm font-bold mb-2">
                Nominal Iuran (Rp)
              </label>
              <input
                id="nominal"
                type="number"
                min={1000}
                step={500}
                value={s.nominalIuran}
                onChange={(e) =>
                  setS({ ...s, nominalIuran: Number(e.target.value) })
                }
                className="brutal-input tabular-nums"
                required
              />
              <p className="text-xs text-[#6b6b6b] font-semibold mt-1">
                Dipakai untuk transaksi otomatis saat struk di-approve.
              </p>
            </div>
            <div>
              <label
                htmlFor="deadline"
                className="block text-sm font-bold mb-2 flex items-center gap-1.5"
              >
                <CalendarClock size={14} strokeWidth={2.5} />
                Tanggal Deadline (1-28)
              </label>
              <input
                id="deadline"
                type="number"
                min={1}
                max={28}
                value={s.deadlineTanggal}
                onChange={(e) =>
                  setS({ ...s, deadlineTanggal: Number(e.target.value) })
                }
                className="brutal-input tabular-nums"
                required
              />
              <p className="text-xs text-[#6b6b6b] font-semibold mt-1">
                Setelah tanggal ini, anggota belum bayar = TERTUNGGAK.
              </p>
            </div>
          </div>
        </section>

        {/* Rekening & Bank */}
        <section className="brutal-card p-5">
          <h2 className="font-extrabold text-lg mb-4 flex items-center gap-2">
            <Building2 size={18} strokeWidth={2.5} />
            Rekening Penampung
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bank" className="block text-sm font-bold mb-2">
                Nama Bank
              </label>
              <input
                id="bank"
                type="text"
                value={s.namaBank ?? ""}
                onChange={(e) => setS({ ...s, namaBank: e.target.value })}
                placeholder="Contoh: BCA"
                className="brutal-input"
              />
            </div>
            <div>
              <label htmlFor="rek" className="block text-sm font-bold mb-2">
                Nomor Rekening
              </label>
              <div className="relative">
                <CreditCard
                  size={16}
                  strokeWidth={2.5}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]"
                />
                <input
                  id="rek"
                  type="text"
                  value={s.nomorRekening ?? ""}
                  onChange={(e) =>
                    setS({ ...s, nomorRekening: e.target.value })
                  }
                  placeholder="Nomor rekening"
                  className="brutal-input pl-9 tabular-nums"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Kontak Panitia */}
        <section className="brutal-card p-5">
          <h2 className="font-extrabold text-lg mb-4 flex items-center gap-2">
            <Phone size={18} strokeWidth={2.5} />
            Kontak Panitia
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="bend" className="block text-sm font-bold mb-2">
                Bendahara
              </label>
              <input
                id="bend"
                type="text"
                value={s.kontakBendahara ?? ""}
                onChange={(e) =>
                  setS({ ...s, kontakBendahara: e.target.value })
                }
                placeholder="Nama / No HP"
                className="brutal-input"
              />
            </div>
            <div>
              <label htmlFor="sek" className="block text-sm font-bold mb-2">
                Sekretaris
              </label>
              <input
                id="sek"
                type="text"
                value={s.kontakSekretaris ?? ""}
                onChange={(e) =>
                  setS({ ...s, kontakSekretaris: e.target.value })
                }
                placeholder="Nama / No HP"
                className="brutal-input"
              />
            </div>
            <div>
              <label htmlFor="komp" className="block text-sm font-bold mb-2">
                Kompting
              </label>
              <input
                id="komp"
                type="text"
                value={s.kontakKompting ?? ""}
                onChange={(e) =>
                  setS({ ...s, kontakKompting: e.target.value })
                }
                placeholder="Nama / No HP"
                className="brutal-input"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="brutal-btn brutal-btn-primary px-5 py-3"
          >
            {saving ? (
              <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />
            ) : (
              <Save size={18} strokeWidth={2.5} />
            )}
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </form>

      {/* Barcode (terpisah dari form utama, upload file) */}
      <section className="brutal-card p-5">
        <h2 className="font-extrabold text-lg mb-1 flex items-center gap-2">
          <QrCode size={18} strokeWidth={2.5} />
          Barcode Pembayaran (Statis)
        </h2>
        <p className="text-xs text-[#6b6b6b] font-semibold mb-4">
          Upload gambar barcode statis (QRIS/rekening). Bukan generate dinamis — satu gambar untuk semua anggota.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div
            className="w-32 h-32 shrink-0 flex items-center justify-center bg-[var(--bg-base)]"
            style={{
              border: "3px solid var(--ink)",
              borderRadius: 8,
            }}
          >
            {s.barcodeImageUrl ? (
              <img
                src={s.barcodeImageUrl}
                alt="Barcode pembayaran"
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <QrCode size={40} strokeWidth={2} className="text-[#9a9a9a]" />
            )}
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label
              htmlFor="barcode-file"
              className="brutal-btn brutal-btn-neutral px-4 py-3 cursor-pointer text-sm"
            >
              {uploading ? (
                <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
              ) : (
                <Upload size={16} strokeWidth={2.5} />
              )}
              <span>
                {s.barcodeImageUrl ? "Ganti Gambar" : "Upload Gambar"}
              </span>
            </label>
            <input
              id="barcode-file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleBarcodeUpload(f);
                e.target.value = "";
              }}
            />
            <p className="text-xs text-[#6b6b6b] font-semibold">
              Format: PNG/JPG/WebP. Maks 5MB.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
