import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import ScoreBreakdown from "../components/ScoreBreakdown";
import { getDocument, searchApi } from "../services/api";
import { highlightText } from "../utils/highlight";
import type { DocumentData, SearchResultItem } from "../types";

export default function DocumentPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";

  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [hit, setHit] = useState<SearchResultItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const docId = Number(id);
    setLoading(true);
    setError(null);
    setHit(null);

    getDocument(docId)
      .then((response) => {
        if (!cancelled) setDoc(response.document);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Optional: if we came from a search, find this document's score in that search.
    if (query.trim() !== "") {
      searchApi(query, { track: false })
        .then((response) => {
          if (!cancelled) setHit(response.results.find((r) => r.docId === docId) ?? null);
        })
        .catch(() => {
          // not important enough to show an error
        });
    }

    return () => {
      cancelled = true;
    };
  }, [id, query]);

  const backLink = query ? `/search?q=${encodeURIComponent(query)}` : "/";
  const keywords = hit?.matchedKeywords ?? [];

  return (
    <div>
      <Link
        to={backLink}
        className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        <ArrowLeft className="h-4 w-4" />
        {query ? "Back to results" : "Back to home"}
      </Link>

      {loading && (
        <div className="mt-6 flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading document...
        </div>
      )}

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Could not load this document</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {!loading && doc && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
              {doc.category}
            </span>
            <h1 className="mt-3 text-2xl font-bold text-slate-800">
              {highlightText(doc.title, keywords)}
            </h1>
            <p className="mt-1 text-sm text-slate-400">Source: {doc.source}</p>
            <p className="mt-5 leading-relaxed text-slate-700">
              {highlightText(doc.content, keywords)}
            </p>
          </article>

          <aside className="space-y-4">
            {hit ? (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-slate-500">
                    Match for “{query}”
                  </h2>
                  <div className="mt-1 text-3xl font-bold text-slate-800">{hit.score}</div>
                  <p className="text-xs text-slate-400">relevance score · rank #{hit.rank}</p>

                  <h3 className="mt-4 text-sm font-semibold text-slate-500">Matched keywords</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {hit.matchedKeywords.map((word) => (
                      <span key={word} className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs text-slate-700">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-3 text-sm font-semibold text-slate-500">Score breakdown</h2>
                  <ScoreBreakdown breakdown={hit.scoreBreakdown} score={hit.score} />
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
                {query
                  ? `This document did not match “${query}”.`
                  : "Open a document from the search results to see its relevance score and matched keywords here."}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}