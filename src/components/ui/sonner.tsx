"use client";

import { Toaster as Sonner, toast } from "sonner";

const Toaster = () => {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        style: {
          background: "var(--surface)",
          color: "var(--ink)",
          border: "3px solid var(--ink)",
          borderRadius: 8,
          boxShadow: "4px 4px 0px var(--ink)",
          fontWeight: 600,
        },
        classNames: {
          success: "!bg-[var(--status-lunas-bg)] !text-[#14532d] !border-[#14532d]",
          error: "!bg-[var(--status-tertunggak-bg)] !text-[#7f1d1d] !border-[#7f1d1d]",
          warning: "!bg-[var(--status-pending-bg)] !text-[#78350f] !border-[#78350f]",
        },
      }}
    />
  );
};

export { Toaster, toast };
