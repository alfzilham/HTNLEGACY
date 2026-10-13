"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Venus, Mars, KeyRound, ArrowRight, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";

export default function LoginPage() {
  const router = useRouter();
  const [gender, setGender] = useState<"PRIA" | "WANITA">("PRIA");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gender, namaLengkap, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal login.");
        return;
      }
      router.push("/beranda");
      router.refresh();
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="brutal-card p-6 md:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="flex items-center justify-center w-14 h-14 mb-3"
            style={{
              background: "var(--accent-primary)",
              border: "3px solid var(--ink)",
              borderRadius: 12,
              boxShadow: "4px 4px 0px var(--ink)",
            }}
          >
            <span className="font-extrabold text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Masuk SIDU
          </h1>
          <p className="text-sm font-semibold text-[#6b6b6b] mt-1">
            {process.env.NEXT_PUBLIC_INSTANCE_NAME ?? "HTN 26"} · Iuran Kas Bulanan
          </p>
        </div>

        {error && (
          <div
            className="mb-4 px-4 py-3 text-sm font-semibold"
            style={{
              background: "var(--status-tertunggak-bg)",
              border: "3px solid var(--status-tertunggak)",
              borderRadius: 8,
              color: "#7f1d1d",
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Gender */}
          <div>
            <label className="block text-sm font-bold mb-2">Gender</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender("PRIA")}
                className="brutal-btn px-3 py-3"
                style={{
                  background:
                    gender === "PRIA" ? "var(--accent-secondary)" : "var(--surface)",
                  color: gender === "PRIA" ? "#ffffff" : "var(--ink)",
                }}
                aria-pressed={gender === "PRIA"}
              >
                <Mars size={18} strokeWidth={2.5} />
                <span>Pria</span>
              </button>
              <button
                type="button"
                onClick={() => setGender("WANITA")}
                className="brutal-btn px-3 py-3"
                style={{
                  background:
                    gender === "WANITA" ? "var(--accent-secondary)" : "var(--surface)",
                  color: gender === "WANITA" ? "#ffffff" : "var(--ink)",
                }}
                aria-pressed={gender === "WANITA"}
              >
                <Venus size={18} strokeWidth={2.5} />
                <span>Wanita</span>
              </button>
            </div>
          </div>

          {/* Nama Lengkap */}
          <div>
            <label htmlFor="nama" className="block text-sm font-bold mb-2">
              Nama Lengkap
            </label>
            <div className="relative">
              <User
                size={18}
                strokeWidth={2.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]"
                aria-hidden="true"
              />
              <input
                id="nama"
                type="text"
                autoComplete="name"
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                placeholder="Nama sesuai pendaftaran"
                className="brutal-input pl-10"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="pwd" className="block text-sm font-bold mb-2">
              Password
            </label>
            <div className="relative">
              <KeyRound
                size={18}
                strokeWidth={2.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]"
                aria-hidden="true"
              />
              <input
                id="pwd"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 karakter"
                className="brutal-input pl-10"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="brutal-btn brutal-btn-primary px-4 py-3 mt-2"
          >
            {loading ? (
              <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />
            ) : (
              <ArrowRight size={18} strokeWidth={2.5} />
            )}
            <span>Masuk</span>
          </button>
        </form>

        <div className="mt-6 text-center text-sm font-semibold text-[#6b6b6b]">
          Belum punya akun?{" "}
          <Link
            href="/signup"
            className="font-bold underline decoration-2 underline-offset-2"
            style={{ color: "var(--ink)" }}
          >
            Daftar di sini
          </Link>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/admin"
          className="text-xs font-semibold text-[#6b6b6b] hover:text-[var(--ink)] underline underline-offset-2"
        >
          Panel Admin →
        </Link>
      </div>
    </AuthShell>
  );
}
