import { AppShell } from "@/components/app-shell";
import { getCurrentAnggota } from "@/lib/auth";

export default async function BerandaPage() {
  const me = await getCurrentAnggota();
  return (
    <AppShell>
      <div className="brutal-card p-6">
        <h1 className="text-2xl font-extrabold">Beranda (placeholder)</h1>
        <p className="mt-2 font-semibold">
          Halo, {me?.namaLengkap ?? "Anggota"} ({me?.gender})
        </p>
        <p className="text-sm text-[#6b6b6b] mt-2">
          Halaman beranda lengkap akan dibangun di Todo 3.
        </p>
      </div>
    </AppShell>
  );
}
