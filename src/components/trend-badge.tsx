// Trend badge — tampilkan perbandingan dengan bulan lalu
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function TrendBadge({
  current,
  previous,
  invertColors = false,
}: {
  current: number;
  previous: number;
  invertColors?: boolean; // true: untuk "keluar" di mana naik = buruk
}) {
  if (previous === 0 && current === 0) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold"
        style={{
          background: "var(--bg-base)",
          border: "1.5px solid var(--ink)",
          borderRadius: 999,
          color: "#6b6b6b",
        }}
      >
        <Minus size={10} strokeWidth={2.5} />
        <span>0</span>
      </span>
    );
  }

  let pct: number;
  if (previous === 0) {
    pct = 100; // dari 0 → ada = +100%
  } else {
    pct = Math.round(((current - previous) / previous) * 100);
  }

  const isUp = current > previous;
  const isFlat = current === previous;
  const isGood = invertColors ? !isUp : isUp;

  const color = isFlat
    ? "#6b6b6b"
    : isGood
    ? "#14532d"
    : "#7f1d1d";
  const bg = isFlat
    ? "var(--bg-base)"
    : isGood
    ? "var(--status-lunas-bg)"
    : "var(--status-tertunggak-bg)";
  const border = isFlat ? "var(--ink)" : isGood ? "#14532d" : "#7f1d1d";
  const Icon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold"
      style={{
        background: bg,
        border: `1.5px solid ${border}`,
        borderRadius: 999,
        color,
      }}
      title={`Bulan lalu: ${previous.toLocaleString("id-ID")} → Bulan ini: ${current.toLocaleString("id-ID")}`}
    >
      <Icon size={10} strokeWidth={2.5} />
      <span>
        {isUp ? "+" : current < previous ? "" : ""}
        {pct}%
      </span>
    </span>
  );
}
