// ============================================================
// SIDU — Empty State Component (reusable)
// ------------------------------------------------------------
// Tampilkan ketika list/data kosong dengan icon + message + optional action.
// Brutalist style: card-flat dengan border, icon besar, text bold.
// ============================================================

import { type LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  compact?: boolean;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? "p-6" : "p-10"}`}
      style={{
        background: "var(--bg-base)",
        border: "2.5px solid var(--ink)",
        borderRadius: 12,
      }}
    >
      <div
        className={`flex items-center justify-center mb-3 ${compact ? "w-12 h-12" : "w-16 h-16"}`}
        style={{
          background: "var(--surface)",
          border: "2.5px solid var(--ink)",
          borderRadius: 10,
          boxShadow: "3px 3px 0px var(--ink)",
        }}
      >
        <Icon
          size={compact ? 24 : 32}
          strokeWidth={1.75}
          className="text-[#9a9a9a]"
          aria-hidden="true"
        />
      </div>
      <h3 className={`font-extrabold ${compact ? "text-base" : "text-lg"} mb-1`}>
        {title}
      </h3>
      {description && (
        <p className={`text-sm font-semibold text-[#6b6b6b] ${compact ? "max-w-xs" : "max-w-sm"}`}>
          {description}
        </p>
      )}
      {action && (
        <a
          href={action.href}
          onClick={action.onClick}
          className="brutal-btn brutal-btn-primary px-4 py-2 mt-4 text-sm"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}
