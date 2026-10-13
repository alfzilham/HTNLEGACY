"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, KeyRound, ArrowRight, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";

export default function AdminGatePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // Cek apakah sudah login admin → langsung redirect ke dashboard
  useEffect(() => {
    (async () => {
      try {
        // Pakai endpoint yang butuh admin; jika 200 berarti sudah login
        const res = await fetch("/api/admin/check", { method: "GET" });
        if (res.ok) {
          router.replace("/admin/dashboard");
          return;
        }
      } catch {
        /* ignore */
      }
      setChecking(false);
    })();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal masuk.");
        return;
      }
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <AuthShell>
        <div className="brutal-card p-8 flex items-center justify-center">
          <Loader2 className="animate-spin" size={28} />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="brutal-card p-6 md:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="flex items-center justify-center w-14 h-14 mb-3"
            style={{
              background: "var(--ink)",
              border: "3px solid var(--ink)",
              borderRadius: 12,
              boxShadow: "4px 4px 0px var(--accent-primary)",
            }}
          >
            <Shield size={26} strokeWidth={2.5} color="#ffffff" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Panel Admin
          </h1>
          <p className="text-sm font-semibold text-[#6b6b6b] mt-1">
            Akses terbatas — Bendahara &amp; pengurus
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
          <div>
            <label htmlFor="pwd" className="block text-sm font-bold mb-2">
              Password Admin
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password bersama admin"
                className="brutal-input pl-10"
                required
                autoFocus
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
      </div>
    </AuthShell>
  );
}
