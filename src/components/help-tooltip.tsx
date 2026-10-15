"use client";

import { useState, useRef, useEffect, useId } from "react";
import { HelpCircle } from "lucide-react";

type Props = {
  text: string;
  size?: number;
  className?: string;
};

/**
 * Tooltip brutalist — hover/focus untuk show help text.
 * Accessible: aria-describedby, keyboard focusable (tabindex).
 */
export function HelpTooltip({ text, size = 14, className = "" }: Props) {
  const [show, setShow] = useState(false);
  const id = useId();
  const ref = useRef<HTMLButtonElement>(null);

  // Hide on Escape
  useEffect(() => {
    if (!show) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShow(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [show]);

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        ref={ref}
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        onClick={(e) => {
          e.preventDefault();
          setShow((s) => !s);
        }}
        className="p-0.5 text-[#6b6b6b] hover:text-[var(--ink)] transition-colors"
        aria-describedby={show ? id : undefined}
        aria-label="Informasi"
        style={{ lineHeight: 0 }}
      >
        <HelpCircle size={size} strokeWidth={2.5} />
      </button>
      {show && (
        <span
          id={id}
          role="tooltip"
          className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-56 p-3 text-xs font-semibold text-left"
          style={{
            background: "var(--ink)",
            color: "#ffffff",
            border: "2.5px solid var(--ink)",
            borderRadius: 8,
            boxShadow: "4px 4px 0px var(--accent-primary)",
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
