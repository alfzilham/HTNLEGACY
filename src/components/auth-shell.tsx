// Auth layout wrapper (login & signup) — no sidebar, brutalist centered card

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "var(--bg-base) repeating-linear-gradient(45deg, transparent 0 12px, rgba(17,17,17,0.03) 12px 24px)",
      }}
    >
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
