export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-white/[0.06] bg-surface-elevated"
          />
        ))}
      </div>
      {/* Chart */}
      <div className="h-80 rounded-2xl border border-white/[0.06] bg-surface-elevated" />
      {/* Table */}
      <div className="h-96 rounded-2xl border border-white/[0.06] bg-surface-elevated" />
    </div>
  );
}

export function ProjectAnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-white/[0.06] bg-surface-elevated"
          />
        ))}
      </div>
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-80 rounded-2xl border border-white/[0.06] bg-surface-elevated" />
        <div className="h-80 rounded-2xl border border-white/[0.06] bg-surface-elevated" />
      </div>
      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="h-64 rounded-2xl border border-white/[0.06] bg-surface-elevated" />
        <div className="h-64 rounded-2xl border border-white/[0.06] bg-surface-elevated" />
        <div className="h-64 rounded-2xl border border-white/[0.06] bg-surface-elevated" />
      </div>
    </div>
  );
}
