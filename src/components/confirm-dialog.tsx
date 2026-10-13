"use client";

import { type LucideIcon, Loader2, AlertTriangle } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  variant?: "danger" | "primary" | "neutral";
  icon?: LucideIcon;
};

/**
 * Confirmation dialog brutalist — replace native confirm().
 * Consistent styling with modals lain (border 3px, shadow offset).
 * Mendukung loading state (disable both buttons saat loading).
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  onConfirm,
  onCancel,
  loading = false,
  variant = "danger",
  icon: Icon = AlertTriangle,
}: Props) {
  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "brutal-btn-danger"
      : variant === "primary"
      ? "brutal-btn-primary"
      : "brutal-btn-neutral";

  const iconBg =
    variant === "danger"
      ? "var(--status-tertunggak)"
      : variant === "primary"
      ? "var(--accent-primary)"
      : "var(--bg-base)";
  const iconColor = variant === "danger" ? "#ffffff" : "var(--ink)";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={loading ? undefined : onCancel}
        aria-hidden="true"
      />
      <div className="relative brutal-card brutal-animate-in w-full max-w-md p-5">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="flex items-center justify-center w-10 h-10 shrink-0"
            style={{
              background: iconBg,
              border: "2.5px solid var(--ink)",
              borderRadius: 8,
            }}
          >
            <Icon size={20} strokeWidth={2.5} color={iconColor} />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-extrabold text-lg leading-tight">{title}</h3>
            {description && (
              <p className="text-sm font-semibold text-[#6b6b6b] mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="brutal-btn brutal-btn-neutral px-4 py-2.5 flex-1"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`brutal-btn ${confirmClass} px-4 py-2.5 flex-1`}
          >
            {loading ? (
              <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
            ) : null}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
