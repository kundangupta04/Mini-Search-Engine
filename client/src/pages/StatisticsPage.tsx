import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Clock,
  FileText,
  Hash,
  Layers,
  Loader2,
  RotateCcw,
  SearchX,
  TrendingUp,
} from "lucide-react";
import StatCard from "../components/StatCard";
import BarList from "../components/BarList";
import TimeChart from "../components/TimeChart";
import { getStats, resetStats } from "../services/api";
import type { StatsResponse } from "../types";

export default function StatisticsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      setStats(await getStats());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }, []);

  // Load now, then refresh every 5 seconds.
  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  async function handleReset(): Promise<void> {
    if (!window.confirm("Reset all search statistics?")) return;
    try {
      await resetStats();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset the statistics.");
    }
  }

  if (!stats) {
    if (error) {
      return (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Could not load statistics</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading statistics...
      </div>
    );
  }

  const { search, trie, index } = stats;
  const hasSearches = search.totalSearches > 0;

  // The server sends newest first; the chart reads left (oldest) to right (newest).
  const timings = [...search.recentSearches]
    .reverse()
    .map((item) => ({ label: item.query, timeMs: item.timeMs }));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Statistics Dashboard</h1>
          <p className="mt-1 text-slate-500">
            Live numbers from the running search engine (refreshes every 5 seconds).
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <RotateCcw className="h-4 w-4" />
          Reset search stats
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          Could not refresh: {error}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={FileText} label="Total Documents" value={stats.documents} />
        <StatCard
          icon={Hash}
          label="Total Unique Words"
          value={trie.wordCount}
          hint={`Stored in a Trie of ${trie.nodeCount} nodes`}
        />
        <StatCard
          icon={Layers}
          label="Indexed Terms"
          value={index.termCount}
          hint={`Index built in ${index.buildTimeMs} ms`}
        />
        <StatCard
          icon={TrendingUp}
          label="Searches Performed"
          value={search.totalSearches}
          hint="Counted since the server started"
        />
        <StatCard
          icon={Clock}
          label="Average Search Time"
          value={hasSearches ? `${search.averageTimeMs} ms` : "—"}
          hint={
            hasSearches
              ? `fastest ${search.minTimeMs} ms · slowest ${search.maxTimeMs} ms`
              : "Run a search first"
          }
        />
        <StatCard
          icon={SearchX}
          label="Searches With No Results"
          value={search.zeroResultSearches}
        />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Most Searched Terms</h2>
          <p className="mb-4 text-xs text-slate-400">
            Each word counted once per search (stop words ignored, stemmed forms combined).
          </p>
          <BarList
            items={search.topTerms.map((t) => ({ label: t.term, value: t.count }))}
            emptyText="No searches yet. Try a few on the home page."
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Most Searched Queries</h2>
          <p className="mb-4 text-xs text-slate-400">Whole queries, ignoring case and extra spaces.</p>
          <BarList
            items={search.topQueries.map((q) => ({ label: q.query || "(empty)", value: q.count }))}
            emptyText="No searches yet."
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
          <h2 className="font-semibold text-slate-800">Search time of the last {timings.length || 20} searches</h2>
          <p className="mb-4 text-xs text-slate-400">
            Measured on the server with performance.now(): parse, index lookup, scoring and Merge Sort.
          </p>
          <TimeChart points={timings} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Documents per Category</h2>
          <div className="mt-4">
            <BarList
              items={search.documentsPerCategory.map((c) => ({ label: c.category, value: c.count }))}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Size of the Data Structures</h2>
          <div className="mt-4">
            <BarList
              items={[
                { label: "Unique words (Trie)", value: trie.wordCount },
                { label: "Indexed terms (after stemming)", value: index.termCount },
                { label: "Postings (term, document) pairs", value: index.totalPostings },
                { label: "Trie nodes", value: trie.nodeCount },
              ]}
            />
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Stemming merges “algorithm” and “algorithms”, so there are fewer terms than words.
            Shared prefixes keep the Trie smaller than the total number of letters.
          </p>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800">Recent Searches</h2>
        {search.recentSearches.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No searches yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-2 pr-4">Query</th>
                  <th className="py-2 pr-4">Results</th>
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2">When</th>
                </tr>
              </thead>
              <tbody>
                {search.recentSearches.map((item, i) => (
                  <tr key={`${item.at}-${i}`} className="border-t border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-700">{item.query}</td>
                    <td className="py-2 pr-4">{item.resultCount}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{item.timeMs} ms</td>
                    <td className="py-2 text-slate-500">{new Date(item.at).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}