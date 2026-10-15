// Skeleton loader untuk brutalist style
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        background:
          "linear-gradient(90deg, #f3f0e7 25%, #e5e0d3 50%, #f3f0e7 75%)",
        backgroundSize: "200% 100%",
        border: "2px solid var(--ink)",
        borderRadius: 6,
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="brutal-card p-4">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-9 h-9" />
        <div className="flex-1">
          <Skeleton className="h-3 w-20 mb-1.5" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
      <Skeleton className="h-5 w-full mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="brutal-card-flat overflow-hidden">
      <div className="hidden lg:block">
        <div
          className="grid gap-2 px-4 py-3"
          style={{ background: "var(--bg-base)", borderBottom: "3px solid var(--ink)" }}
        >
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-3" />
          ))}
        </div>
        {[...Array(rows)].map((_, i) => (
          <div
            key={i}
            className="grid gap-2 px-4 py-3"
            style={{ borderBottom: i < rows - 1 ? "1.5px solid var(--ink)" : "none" }}
          >
            {[...Array(6)].map((_, j) => (
              <Skeleton key={j} className="h-3.5" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
