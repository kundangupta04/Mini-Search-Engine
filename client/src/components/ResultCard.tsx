import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, Quote } from "lucide-react";
import type { SearchResultItem } from "../types";
import { highlightText } from "../utils/highlight";
import ScoreBreakdown from "./ScoreBreakdown";

interface ResultCardProps {
  result: SearchResultItem;
  query: string;
}

export default function ResultCard({ result, query }: ResultCardProps) {
  const [showScore, setShowScore] = useState(false);
  const detailsLink = `/document/${result.docId}?q=${encodeURIComponent(query)}`;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-slate-500">
              #{result.rank}
            </span>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 font-medium text-indigo-700">
              {result.category}
            </span>
            {result.phraseMatches.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 font-medium text-amber-700">
                <Quote className="h-3 w-3" />
                exact phrase
              </span>
            )}
          </div>
          <Link
            to={detailsLink}
            className="text-lg font-semibold text-indigo-700 hover:underline"
          >
            {highlightText(result.title, result.matchedKeywords)}
          </Link>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-xs text-slate-400">Relevance Score</div>
          <div className="text-2xl font-bold text-slate-800">{result.score}</div>
        </div>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {highlightText(result.snippet, result.matchedKeywords)}
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span>Source: {result.source}</span>
        <button
          type="button"
          onClick={() => setShowScore((open) => !open)}
          className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-800"
        >
          Why this score?
          {showScore ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {showScore && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <ScoreBreakdown breakdown={result.scoreBreakdown} score={result.score} />
        </div>
      )}
    </article>
  );
}