import { useEffect, useState } from "react";
import { AlertCircle, BarChart3, Clock, FileText, Layers, Loader2, Network, Hash, TrendingUp } from "lucide-react";
import StatCard from "../components/StatCard";
import { getHealth } from "../services/api";
import type { HealthResponse } from "../types";

export default function StatisticsPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then((response) => {
        if (!cancelled) setHealth(response);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  if (!health) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading statistics...
      </div>
    );
  }

  const sizes = [
    { label: "Unique words (Trie)", value: health.trie.wordCount },
    { label: "Indexed terms (after stemming)", value: health.index.termCount },
    { label: "Postings (term, document) pairs", value: health.index.totalPostings },
  ];
  const largest = Math.max(...sizes.map((s) => s.value), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Statistics Dashboard</h1>
      <p className="mt-1 text-slate-500">Live numbers from the running search engine.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={FileText} label="Total Documents" value={health.documentsLoaded} />
        <StatCard
          icon={Hash}
          label="Total Unique Words"
          value={health.trie.wordCount}
          hint="Distinct words stored in the Trie"
        />
        <StatCard
          icon={Layers}
          label="Indexed Terms"
          value={health.index.termCount}
          hint="Distinct stemmed terms in the inverted index"
        />
        <StatCard
          icon={Network}
          label="Trie Nodes"
          value={health.trie.nodeCount}
          hint="Shared prefixes are stored only once"
        />
        <StatCard
          icon={Clock}
          label="Index Build Time"
          value={`${health.index.buildTimeMs} ms`}
          hint={`Avg. ${health.index.averageDocLength} tokens per document`}
        />
        <StatCard
          icon={BarChart3}
          label="Total Tokens Indexed"
          value={health.index.totalTokens}
          hint="After removing stop words"
        />
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800">Size of the data structures</h2>
        <div className="mt-4 space-y-4">
          {sizes.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">{item.label}</span>
                <span className="font-mono">{item.value}</span>
              </div>
              <div className="mt-1 h-3 rounded bg-slate-100">
                <div
                  className="h-3 rounded bg-indigo-500"
                  style={{ width: `${Math.round((item.value / largest) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Stemming merges variants such as “algorithm” and “algorithms”, so there are fewer indexed
          terms than unique words. Many terms appear in several documents, so postings outnumber terms.
        </p>
      </section>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Search activity (added in Step 10)
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        <StatCard icon={TrendingUp} label="Searches Performed" value="—" hint="Server tracking comes next" muted />
        <StatCard icon={Clock} label="Average Search Time" value="—" hint="Server tracking comes next" muted />
        <StatCard icon={BarChart3} label="Most Searched Terms" value="—" hint="Server tracking comes next" muted />
      </div>
    </div>
  );
}