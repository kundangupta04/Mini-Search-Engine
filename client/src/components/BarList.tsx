interface BarListProps {
  items: { label: string; value: number }[];
  emptyText?: string;
}

/** Horizontal bars: the longest bar is the largest value. */
export default function BarList({ items, emptyText = "No data yet." }: BarListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">{emptyText}</p>;
  }

  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-sm">
            <span className="truncate pr-2 text-slate-600">{item.label}</span>
            <span className="font-mono">{item.value}</span>
          </div>
          <div className="mt-1 h-2.5 rounded bg-slate-100">
            <div
              className="h-2.5 rounded bg-indigo-500"
              style={{ width: `${Math.max(2, Math.round((item.value / max) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}