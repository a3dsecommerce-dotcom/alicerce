"use client";

export default function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number, cols?: number }) {
  return (
    <div className="w-full space-y-4 animate-pulse p-8">
      <div className="flex gap-4 mb-8">
        <div className="h-10 bg-[var(--bg-base)] rounded-xl w-64"></div>
        <div className="h-10 bg-[var(--bg-base)] rounded-xl w-32"></div>
      </div>
      <div className="space-y-4">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            {[...Array(cols)].map((_, j) => (
              <div key={j} className="h-16 bg-[var(--bg-base)]/50 rounded-2xl flex-1"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
