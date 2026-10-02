import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown } from "lucide-react";
import DemoForm from "./DemoForm";
import { ErrorBox, LoadingLine } from "./Status";
import { useRemote } from "../../hooks/useRemote";
import { getIndexDemo } from "../../services/dsaApi";
import type { IndexDemoResponse } from "../../types/dsa";

const MAX_POSITIONS_SHOWN = 15;

export default function IndexVisualizer() {
  const [input, setInput] = useState("algorithms");
  const [submitted, setSubmitted] = useState("algorithms");
  const { data, error, loading } = useRemote(() => getIndexDemo(submitted), submitted);

  function run(value: string): void {
    setInput(value);
    setSubmitted(value);
  }

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Type a word. It is normalized, then looked up in the inverted index (a HashMap from term to
        documents). No document is scanned.
      </p>
      <DemoForm
        value={input}
        onChange={setInput}
        onSubmit={() => setSubmitted(input)}
        placeholder="Type a word, e.g. algorithms"
        buttonLabel="Look up"
        examples={["algorithms", "databases", "searching", "the", "zzzz"]}
        onExample={run}
        maxLength={50}
      />

      <div className="mt-6">
        {loading && !data && <LoadingLine />}
        {error && <ErrorBox message={error} />}
        {data && !error && <IndexResult data={data} onPick={run} />}
      </div>
    </div>
  );
}

function IndexResult({ data, onPick }: { data: IndexDemoResponse; onPick: (term: string) => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col items-center gap-2">
        <span className="rounded-full bg-slate-100 px-4 py-1.5 font-mono text-slate-700">
          “{data.word}”
        </span>

        {data.term === null ? (
          <p className="mt-2 max-w-md text-center text-sm text-amber-700">
            {data.note ?? "Nothing to look up."}
          </p>
        ) : (
          <>
            <ArrowDown className="h-5 w-5 text-slate-300" />
            <span className="text-xs text-slate-400">lowercase → remove punctuation → stem</span>
            <ArrowDown className="h-5 w-5 text-slate-300" />
            <span className="rounded-full bg-indigo-600 px-4 py-1.5 font-mono text-white">
              index.get(“{data.term}”)
            </span>
            <span className="text-xs text-slate-400">
              HashMap lookup · O(1) average · {data.timeMs} ms
            </span>
            <ArrowDown className="h-5 w-5 text-slate-300" />

            {data.postings.length === 0 ? (
              <p className="text-sm text-slate-500">
                The term “{data.term}” is not in the index, so no documents match.
              </p>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-600">
                  Found in {data.documentFrequency}{" "}
                  {data.documentFrequency === 1 ? "document" : "documents"}
                </p>
                <div className="mt-1 w-full space-y-2">
                  {data.postings.map((posting) => (
                    <div
                      key={posting.docId}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link
                          to={`/document/${posting.docId}`}
                          className="font-medium text-indigo-700 hover:underline"
                        >
                          Document {posting.docId}: {posting.title}
                        </Link>
                        <span className="text-xs text-slate-500">
                          frequency <span className="font-mono">{posting.frequency}</span>
                          {posting.inTitle && (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                              in title
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <span className="mr-1 text-xs text-slate-400">positions:</span>
                        {posting.positions.slice(0, MAX_POSITIONS_SHOWN).map((position) => (
                          <span
                            key={position}
                            className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-slate-600 ring-1 ring-slate-200"
                          >
                            {position}
                          </span>
                        ))}
                        {posting.positions.length > MAX_POSITIONS_SHOWN && (
                          <span className="text-xs text-slate-400">
                            +{posting.positions.length - MAX_POSITIONS_SHOWN} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-slate-600">Terms found in the most documents</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {data.topTerms.map((item) => (
            <button
              key={item.term}
              type="button"
              onClick={() => onPick(item.term)}
              className="rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700 hover:bg-indigo-100"
            >
              {item.term}
              <span className="ml-2 text-xs text-indigo-400">{item.documentFrequency} docs</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          The index holds {data.stats.termCount} terms and {data.stats.totalPostings} postings across{" "}
          {data.stats.documentCount} documents.
        </p>
      </div>
    </div>
  );
}