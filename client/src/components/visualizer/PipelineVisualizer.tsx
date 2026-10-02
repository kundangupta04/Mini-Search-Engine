import { useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import DemoForm from "./DemoForm";
import { ErrorBox, LoadingLine } from "./Status";
import { useRemote } from "../../hooks/useRemote";
import { getPipeline } from "../../services/dsaApi";
import type { PipelineResponse, RankedItem } from "../../types/dsa";

const DEFAULT_QUERY = "data structures algorithms";

const STATUS_TEXT: Record<PipelineResponse["status"], string | null> = {
  ok: null,
  empty_query: "The query is empty, so the pipeline stops at the first step.",
  no_searchable_terms: "Only very common words or symbols were left after preprocessing.",
  no_results: "No document matched, so there is nothing to score or sort.",
};

export default function PipelineVisualizer() {
  const [input, setInput] = useState(DEFAULT_QUERY);
  const [submitted, setSubmitted] = useState(DEFAULT_QUERY);
  const { data, error, loading } = useRemote(() => getPipeline(submitted), submitted);

  function run(value: string): void {
    setInput(value);
    setSubmitted(value);
  }

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Type a search. Every stage below is the real output of the engine for that query. This page
        does not count toward the search statistics.
      </p>
      <DemoForm
        value={input}
        onChange={setInput}
        onSubmit={() => setSubmitted(input)}
        placeholder="Type a search query"
        buttonLabel="Trace it"
        examples={[DEFAULT_QUERY, '"data structures"', "algo", "algoritm", "machine learning"]}
        onExample={run}
      />

      <div className="mt-6">
        {loading && !data && <LoadingLine />}
        {error && <ErrorBox message={error} />}
        {data && !error && <PipelineStages data={data} />}
      </div>
    </div>
  );
}

function Stage({
  n,
  title,
  concept,
  children,
}: {
  n: number;
  title: string;
  concept: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
          {n}
        </span>
        <div>
          <h2 className="font-semibold text-slate-800">{title}</h2>
          <p className="text-xs text-slate-400">{concept}</p>
        </div>
      </div>
      <div className="mt-3 text-sm text-slate-700">{children}</div>
    </section>
  );
}

function Chips({ values, className }: { values: string[]; className: string }) {
  if (values.length === 0) return <span className="text-slate-400">(none)</span>;
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {values.map((value, i) => (
        <span key={`${value}-${i}`} className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${className}`}>
          {value}
        </span>
      ))}
    </span>
  );
}

/** Horizontal bars, one per document. Same scale on both sides so they compare fairly. */
function ScoreBars({ items, max }: { items: RankedItem[]; max: number }) {
  return (
    <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
      {items.map((item) => (
        <div key={item.docId} className="flex items-center gap-2 text-xs" title={item.title}>
          <span className="w-10 shrink-0 font-mono text-slate-400">#{item.docId}</span>
          <div className="h-2 flex-1 rounded bg-slate-100">
            <div
              className="h-2 rounded bg-indigo-500"
              style={{ width: `${Math.max(2, Math.round((item.score / max) * 100))}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right font-mono">{item.score}</span>
        </div>
      ))}
    </div>
  );
}

function ScoreChips({ items }: { items: RankedItem[] }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className="text-slate-300">[</span>
      {items.map((item) => (
        <span
          key={item.docId}
          title={`Document ${item.docId}: ${item.title}`}
          className="rounded bg-white px-1.5 py-0.5 font-mono text-xs ring-1 ring-slate-200"
        >
          {item.score}
        </span>
      ))}
      <span className="text-slate-300">]</span>
    </span>
  );
}

function PipelineStages({ data }: { data: PipelineResponse }) {
  const hasCandidates = data.beforeSort.length > 0;
  const statusText = STATUS_TEXT[data.status];
  const maxScore = Math.max(...data.beforeSort.map((item) => item.score), 1);

  return (
    <div className="space-y-4">
      {statusText && (
        <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{statusText}</div>
      )}

      <Stage n={1} title="Parse the query" concept="Quoted phrases are separated from free words">
        <div className="space-y-2">
          <div>
            Phrases:{" "}
            <Chips values={data.parse.phrases.map((p) => `“${p}”`)} className="bg-amber-50 text-amber-700" />
          </div>
          <div>
            Free words: <Chips values={data.parse.words} className="bg-slate-100 text-slate-600" />
          </div>
          {data.parse.truncated && (
            <p className="text-amber-700">The query was long, so extra words were ignored.</p>
          )}
        </div>
      </Stage>

      <Stage
        n={2}
        title="Preprocess"
        concept="String processing, HashSet of stop words, stemming (O(n))"
      >
        <dl className="space-y-2">
          <div>
            <dt className="text-xs text-slate-400">lowercase</dt>
            <dd className="whitespace-pre-wrap font-mono text-xs">{data.stages.lowercased || "(empty)"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">remove punctuation</dt>
            <dd className="whitespace-pre-wrap font-mono text-xs">
              {data.stages.withoutPunctuation.trim() || "(empty)"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">tokenize</dt>
            <dd><Chips values={data.stages.tokens} className="bg-slate-100 text-slate-600" /></dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">remove stop words</dt>
            <dd><Chips values={data.stages.afterStopWords} className="bg-slate-100 text-slate-600" /></dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">stem → terms used for lookup</dt>
            <dd><Chips values={data.stages.terms} className="bg-indigo-50 text-indigo-700" /></dd>
          </div>
        </dl>
      </Stage>

      <Stage
        n={3}
        title="Look up each term in the inverted index"
        concept="HashMap lookup, O(1) average per term; the Trie expands partial words"
      >
        {data.lookups.length === 0 && data.unmatchedWords.length === 0 ? (
          <p className="text-slate-400">No terms to look up.</p>
        ) : (
          <div className="space-y-2">
            {data.lookups.map((lookup) => (
              <div
                key={`${lookup.queryWord}-${lookup.term}`}
                className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3"
              >
                <span className="font-mono text-xs">{lookup.queryWord}</span>
                <ArrowRight className="h-4 w-4 text-slate-300" />
                <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 font-mono text-xs text-white">
                  {lookup.term}
                </span>
                {lookup.matchType === "prefix" && (
                  <span className="text-xs text-indigo-500">(partial, expanded by the Trie)</span>
                )}
                <span className="text-xs text-slate-500">
                  in {lookup.documentFrequency}{" "}
                  {lookup.documentFrequency === 1 ? "document" : "documents"}:{" "}
                  <span className="font-mono">
                    {lookup.docIds.join(", ")}
                    {lookup.documentFrequency > lookup.docIds.length ? ", …" : ""}
                  </span>
                </span>
              </div>
            ))}
            {data.unmatchedWords.map((word) => (
              <div key={word} className="rounded-xl bg-red-50 p-3 text-red-600">
                <span className="font-mono text-xs">{word}</span> → no match in the index or the Trie
              </div>
            ))}
          </div>
        )}
      </Stage>

      <Stage
        n={4}
        title="Collect candidate documents"
        concept="HashMap grouping by document id; quoted phrases must match by word position"
      >
        {hasCandidates ? (
          <p>
            <span className="font-semibold">{data.beforeSort.length}</span>{" "}
            {data.beforeSort.length === 1 ? "document matches" : "documents match"}. They arrive in
            document-id order, which matters because Merge Sort is stable.
          </p>
        ) : (
          <p className="text-slate-400">No candidates.</p>
        )}
      </Stage>

      {hasCandidates && (
        <Stage
          n={5}
          title="Score, then Merge Sort"
          concept="Ranking formula · Merge Sort O(n log n), stable"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Before sorting (document-id order)
              </h3>
              <ScoreBars items={data.beforeSort} max={maxScore} />
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                After Merge Sort (best first)
              </h3>
              <ScoreBars items={data.afterSort} max={maxScore} />
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            {data.sort.items} items sorted with {data.mergeSteps.length} merges and{" "}
            {data.sort.comparisons} comparisons. Equal scores keep their id order.
          </p>

          <details className="mt-3 rounded-xl border border-slate-200 p-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-600">
              Show every merge (the numbers are relevance scores; hover for the document)
            </summary>
            <div className="mt-3 space-y-2">
              {data.mergeSteps.map((step, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-2 text-sm"
                >
                  <span className="w-14 shrink-0 font-mono text-xs text-slate-400">step {i + 1}</span>
                  <ScoreChips items={step.left} />
                  <span className="text-slate-400">+</span>
                  <ScoreChips items={step.right} />
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                  <ScoreChips items={step.merged} />
                  {step.depth === 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                      final merge
                    </span>
                  )}
                </div>
              ))}
            </div>
          </details>

          <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Top results
          </h3>
          <ol className="list-inside list-decimal space-y-1">
            {data.afterSort.slice(0, 5).map((item) => (
              <li key={item.docId}>
                {item.title} <span className="font-mono text-xs text-slate-400">(score {item.score})</span>
              </li>
            ))}
          </ol>
        </Stage>
      )}

      <Stage
        n={hasCandidates ? 6 : 5}
        title="Timing"
        concept="Real measurements with performance.now(), in milliseconds"
      >
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ["Parse + lookup", data.timings.searchMs],
            ["Scoring", data.timings.scoreMs],
            ["Merge Sort", data.timings.sortMs],
            ["Total", data.timings.totalMs],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-400">{label}</div>
              <div className="font-mono text-lg font-semibold text-slate-800">{value} ms</div>
            </div>
          ))}
        </div>
      </Stage>
    </div>
  );
}