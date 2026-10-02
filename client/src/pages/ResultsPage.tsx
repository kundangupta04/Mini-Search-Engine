import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, Info, Loader2, SearchX } from "lucide-react";
import SearchBar from "../components/SearchBar";
import ResultCard from "../components/ResultCard";
import { searchApi } from "../services/api";
import type { SearchResponse } from "../types";

export default function ResultsPage() {
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";

  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false; // ignore a reply that arrives after the query changed
    setLoading(true);
    setError(null);

    searchApi(query)
      .then((response) => {
        if (!cancelled) setData(response);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div>
      {/* key={query} recreates the search bar when the query changes, so its text stays in sync */}
      <SearchBar key={query} initialValue={query} />

      <div className="mt-6">
        {loading && (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Searching...
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Could not complete the search</p>
              <p className="text-sm">{error}</p>
              <p className="mt-1 text-sm text-red-500">Is the server running on port 5000?</p>
            </div>
          </div>
        )}

        {!loading && !error && data && <ResultsBody data={data} query={query} />}
      </div>
    </div>
  );
}

function ResultsBody({ data, query }: { data: SearchResponse; query: string }) {
  // Empty query, only stop words, or no match.
  if (data.totalResults === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <SearchX className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-lg font-medium text-slate-700">
          {data.message ?? "No matching documents found."}
        </p>

        {data.relatedTerms.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-slate-500">Did you mean:</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {data.relatedTerms.map((term) => (
                <Link
                  key={term}
                  to={`/search?q=${encodeURIComponent(term)}`}
                  className="rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700 hover:bg-indigo-100"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-800">
          {data.totalResults} {data.totalResults === 1 ? "result" : "results"} found
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Search completed in <span className="font-mono">{data.timeMs} ms</span> · ranked with{" "}
          {data.sort.algorithm} ({data.sort.items} items, {data.sort.comparisons} comparisons)
        </p>
      </div>

      {data.message && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          {data.message}
        </div>
      )}

      <QueryInterpretation data={data} />

      <div className="space-y-4">
        {data.results.map((result) => (
          <ResultCard key={result.docId} result={result} query={query} />
        ))}
      </div>
    </div>
  );
}

/** Shows how the engine understood the query. Great for explaining the pipeline in the viva. */
function QueryInterpretation({ data }: { data: SearchResponse }) {
  const { phrases, resolved, unmatchedWords } = data.interpretation;
  if (phrases.length === 0 && resolved.length === 0) return null;

  return (
    <details className="mb-5 rounded-xl border border-slate-200 bg-white p-4 text-sm">
      <summary className="cursor-pointer font-medium text-slate-600">
        How the engine read your query
      </summary>
      <div className="mt-3 flex flex-wrap gap-2">
        {phrases.map((phrase) => (
          <span key={phrase} className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
            phrase: “{phrase}”
          </span>
        ))}
        {resolved.map((item) => (
          <span
            key={`${item.queryWord}-${item.term}`}
            className="rounded-full bg-slate-100 px-3 py-1 text-slate-600"
          >
            {item.queryWord} → <span className="font-mono">{item.term}</span>
            {item.matchType === "prefix" && (
              <span className="ml-1 text-xs text-indigo-500">(partial, via Trie)</span>
            )}
          </span>
        ))}
        {unmatchedWords.map((word) => (
          <span key={word} className="rounded-full bg-red-50 px-3 py-1 text-red-600">
            {word} → no match
          </span>
        ))}
      </div>
    </details>
  );
}
