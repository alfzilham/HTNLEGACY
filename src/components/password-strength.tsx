"use client";

import { useMemo } from "react";
import { Check, X } from "lucide-react";

type Props = {
  password: string;
};

type Strength = {
  score: number; // 0-4
  label: string;
  color: string;
  bgColor: string;
  checks: { label: string; passed: boolean }[];
};

function calcStrength(pwd: string): Strength {
  const checks = [
    { label: "Min. 6 karakter", passed: pwd.length >= 6 },
    { label: "Min. 10 karakter", passed: pwd.length >= 10 },
    { label: "Ada huruf besar", passed: /[A-Z]/.test(pwd) },
    { label: "Ada angka", passed: /\d/.test(pwd) },
    { label: "Ada simbol", passed: /[^A-Za-z0-9]/.test(pwd) },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  let score = 0;
  if (pwd.length >= 6) score = 1;
  if (pwd.length >= 8 && passedCount >= 2) score = 2;
  if (pwd.length >= 10 && passedCount >= 3) score = 3;
  if (pwd.length >= 12 && passedCount >= 4) score = 4;

  const config = [
    { label: "Sangat lemah", color: "#7f1d1d", bgColor: "var(--status-tertunggak)" },
    { label: "Lemah", color: "#7f1d1d", bgColor: "var(--status-tertunggak)" },
    { label: "Cukup", color: "#78350f", bgColor: "var(--status-pending)" },
    { label: "Baik", color: "#14532d", bgColor: "var(--status-lunas)" },
    { label: "Kuat", color: "#14532d", bgColor: "var(--status-lunas)" },
  ];

  return {
    score,
    label: pwd.length === 0 ? "" : config[score].label,
    color: config[score].color,
    bgColor: config[score].bgColor,
    checks,
  };
}

export function PasswordStrength({ password }: Props) {
  const strength = useMemo(() => calcStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="mt-2 flex flex-col gap-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-1.5 flex-1 transition-all duration-200"
              style={{
                background: i < strength.score ? strength.bgColor : "var(--bg-base)",
                border: "1.5px solid var(--ink)",
                borderRadius: 2,
              }}
            />
          ))}
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
          style={{ color: strength.color }}
        >
          {strength.label}
        </span>
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {strength.checks.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 text-[10px] font-semibold"
            style={{ color: c.passed ? "#14532d" : "#9a9a9a" }}
          >
            {c.passed ? (
              <Check size={10} strokeWidth={3} />
            ) : (
              <X size={10} strokeWidth={3} />
            )}
            <span>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
