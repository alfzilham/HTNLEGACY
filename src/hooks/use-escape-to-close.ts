"use client";

import { useEffect } from "react";

/**
 * Hook untuk menutup modal/dialog saat user tekan Escape.
 * Tidak akan close jika modal non-dismissible (modalId tidak di-supply atau `dismissible=false`).
 *
 * @param onClose Callback saat Esc ditekan
 * @param dismissible Apakah modal bisa ditutup via Esc (default true)
 */
export function useEscapeToClose(
  onClose: () => void,
  dismissible: boolean = true
) {
  useEffect(() => {
    if (!dismissible) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, dismissible]);
}
