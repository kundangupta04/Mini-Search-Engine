import type { ScoreBreakdown as Breakdown } from "../types";

const ROWS: { key: keyof Breakdown; label: string; rule: string }[] = [
  { key: "termFrequency", label: "Term frequency", rule: "+1 per occurrence (max 10 per word)" },
  { key: "keywordMatch", label: "Keyword match", rule: "+3 per query word found" },
  { key: "titleMatch", label: "Title match", rule: "+10 per query word in the title" },
  { key: "exactPhrase", label: "Exact phrase", rule: "+8 per quoted phrase found" },
  { key: "allKeywords", label: "All-keywords bonus", rule: "+5 when every word of a multi-word query matches" },
];

interface ScoreBreakdownProps {
  breakdown: Breakdown;
  score: number;
}

export default function ScoreBreakdown({ breakdown, score }: ScoreBreakdownProps) {
  return (
    <div className="space-y-3">
      {ROWS.map((row) => {
        const value = breakdown[row.key];
        const width = score > 0 ? Math.round((value / score) * 100) : 0;
        return (
          <div key={row.key} className={value === 0 ? "opacity-50" : ""}>
            <div className="flex justify-between text-sm">
              <span className="font-medium">{row.label}</span>
              <span className="font-mono">+{value}</span>
            </div>
            <div className="mt-1 h-1.5 rounded bg-slate-100">
              <div className="h-1.5 rounded bg-indigo-500" style={{ width: `${width}%` }} />
            </div>
            <p className="mt-0.5 text-xs text-slate-400">{row.rule}</p>
          </div>
        );
      })}
      <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-semibold">
        <span>Total relevance score</span>
        <span className="font-mono">{score}</span>
      </div>
    </div>
  );
}