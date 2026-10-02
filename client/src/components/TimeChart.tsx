interface TimeChartProps {
  points: { label: string; timeMs: number }[]; // oldest first
}

/** Vertical bars, one per search. Hover a bar to see the query and its time. */
export default function TimeChart({ points }: TimeChartProps) {
  if (points.length === 0) {
    return <p className="text-sm text-slate-400">Run a few searches to see their timings here.</p>;
  }

  const max = Math.max(...points.map((p) => p.timeMs), 0.001);

  return (
    <div>
      <div className="flex h-32 items-end gap-1">
        {points.map((point, i) => (
          <div
            key={i}
            className="flex h-full flex-1 items-end"
            title={`${point.label || "(empty)"}: ${point.timeMs} ms`}
          >
            <div
              className="w-full rounded-t bg-indigo-500"
              style={{ height: `${Math.max(4, Math.round((point.timeMs / max) * 100))}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-400">
        <span>oldest</span>
        <span>tallest bar = {max} ms</span>
        <span>newest</span>
      </div>
    </div>
  );
}