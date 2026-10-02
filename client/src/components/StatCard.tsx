import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  muted?: boolean; // used for "coming soon" placeholders
}

export default function StatCard({ icon: Icon, label, value, hint, muted = false }: StatCardProps) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${muted ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>
      <div className="mt-3 text-3xl font-bold text-slate-800">{value}</div>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}