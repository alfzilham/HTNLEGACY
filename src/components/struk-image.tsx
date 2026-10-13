"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  // Style untuk container (lebih reliable dari className untuk dimensi fixed)
  containerStyle?: React.CSSProperties;
  iconSize?: number;
};

/**
 * Image dengan fallback untuk struk yang gambarnya sudah dihapus
 * (setelah reset siklus bulanan — imageUrl jadi stale link, sesuai SPEC §8.3).
 *
 * Menggunakan `key={src}` trick di parent untuk reset state otomatis saat src berubah,
 * menghindari setState-in-effect anti-pattern.
 */
export function StrukImage({
  src,
  alt,
  className,
  containerStyle,
  iconSize = 24,
}: Props) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1 ${className ?? ""}`}
        style={{
          background: "var(--bg-base)",
          color: "#9a9a9a",
          ...containerStyle,
        }}
        aria-label={`${alt} (gambar tidak tersedia)`}
        role="img"
      >
        <ImageOff size={iconSize} strokeWidth={1.5} />
        <span className="text-[10px] font-semibold">Gambar dihapus</span>
      </div>
    );
  }

  return (
    <img
      key={src}
      src={src}
      alt={alt}
      className={className}
      style={containerStyle}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}
