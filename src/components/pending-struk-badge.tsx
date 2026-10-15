"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Badge untuk sidebar admin — tampilkan count struk PENDING.
 * Auto-refresh saat route change & setiap 30 detik.
 * Hidden jika count = 0.
 */
export function PendingStrukBadge() {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCount() {
      try {
        const res = await fetch("/api/laporan/info");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setCount(data.strukPending ?? 0);
        }
      } catch {
        /* ignore */
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30000); // refresh setiap 30s
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pathname]);

  if (count === null || count === 0) return null;

  return (
    <span
      className="ml-auto px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums"
      style={{
        background: "var(--status-pending)",
        border: "1.5px solid var(--ink)",
        borderRadius: 999,
        color: "#78350f",
        minWidth: 18,
        textAlign: "center",
      }}
      aria-label={`${count} struk menunggu verifikasi`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
