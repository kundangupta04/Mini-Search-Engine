import { useEffect, useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import DemoForm from "./DemoForm";
import { ErrorBox, LoadingLine } from "./Status";
import { useRemote } from "../../hooks/useRemote";
import { getTrieDemo } from "../../services/dsaApi";
import type { TrieDemoResponse } from "../../types/dsa";

interface PathNode {
  label: string;
  state: "root" | "found" | "missing";
  isEndOfWord: boolean;
  children: string[];
  nextChar: string | null; // the branch the walk takes from this node
}

const CIRCLE_CLASS: Record<PathNode["state"], string> = {
  root: "bg-slate-700 text-white",
  found: "bg-indigo-600 text-white",
  missing: "bg-red-500 text-white",
};

export default function TrieVisualizer() {
  const [input, setInput] = useState("alg");
  const [submitted, setSubmitted] = useState("alg");
  const { data, error, loading } = useRemote(() => getTrieDemo(submitted), submitted);

  function run(value: string): void {
    setInput(value);
    setSubmitted(value);
  }

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Type the start of a word. The Trie walks it one character at a time, then collects every
        word below the last node.
      </p>
      <DemoForm
        value={input}
        onChange={setInput}
        onSubmit={() => setSubmitted(input)}
        placeholder="Type a prefix, e.g. alg"
        buttonLabel="Walk the Trie"
        examples={["alg", "comp", "data", "str", "xyz"]}
        onExample={run}
        maxLength={50}
      />

      <div className="mt-6">
        {loading && !data && <LoadingLine />}
        {error && <ErrorBox message={error} />}
        {data && !error && <TriePath key={data.prefix} data={data} />}
      </div>
    </div>
  );
}

function TriePath({ data }: { data: TrieDemoResponse }) {
  const total = data.steps.length;
  const [shown, setShown] = useState(0); // how many characters have been walked so far

  // Reveal one more character every 500 ms until the whole prefix has been walked.
  useEffect(() => {
    if (shown >= total) return;
    const timer = setTimeout(() => setShown(shown + 1), 500);
    return () => clearTimeout(timer);
  }, [shown, total]);

  // Node 0 is the root; node i (i >= 1) is the node reached after i characters.
  const nodes: PathNode[] = [
    {
      label: "root",
      state: "root",
      isEndOfWord: false,
      children: data.rootChildren,
      nextChar: data.steps[0]?.char ?? null,
    },
  ];
  data.steps.forEach((step, i) => {
    nodes.push({
      label: step.char,
      state: step.found ? "found" : "missing",
      isEndOfWord: step.isEndOfWord,
      children: step.children,
      nextChar: data.steps[i + 1]?.char ?? null,
    });
  });

  const finished = shown >= total;
  const missing = data.steps.find((step) => !step.found);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-slate-800">
          Walking the prefix <span className="font-mono text-indigo-600">“{data.prefix}”</span>
        </h2>
        <button
          type="button"
          onClick={() => setShown(0)}
          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          <RotateCcw className="h-4 w-4" />
          Replay
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-start gap-2">
        {nodes.map((node, i) => {
          if (i > shown) return null; // not reached yet
          const chosen = i < shown ? node.nextChar : null; // highlight once the next node appears
          return (
            <div key={i} className="flex items-start gap-2">
              {i > 0 && <ArrowRight className="mt-3 h-5 w-5 shrink-0 text-slate-300" />}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-11 min-w-11 items-center justify-center rounded-full px-2 font-mono text-lg font-bold ${CIRCLE_CLASS[node.state]} ${
                    node.isEndOfWord ? "ring-4 ring-amber-300" : ""
                  }`}
                >
                  {node.state === "missing" ? `${node.label} ✕` : node.label}
                </div>

                {node.isEndOfWord && (
                  <span className="text-xs font-medium text-amber-600">word ends here</span>
                )}
                {node.state === "missing" && (
                  <span className="text-xs font-medium text-red-600">no such branch</span>
                )}

                {node.children.length > 0 && (
                  <div className="flex max-w-56 flex-wrap justify-center gap-1">
                    {node.children.map((child) => (
                      <span
                        key={child}
                        className={`rounded px-1.5 py-0.5 font-mono text-xs ${
                          child === chosen
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {child}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {finished && (
        <div className="mt-6 border-t border-slate-100 pt-4">
          {data.fullyMatched ? (
            <>
              <h3 className="text-sm font-semibold text-slate-600">
                Words below this node (most frequent first)
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.suggestions.map((s) => (
                  <span
                    key={s.word}
                    className="rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700"
                  >
                    {s.word}
                    <span className="ml-2 text-xs text-indigo-400">×{s.frequency}</span>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-red-600">
              No word in the documents starts with “{data.prefix}”. The walk broke at the letter “
              {missing?.char}”.
            </p>
          )}

          <p className="mt-4 text-xs text-slate-400">
            Walking {total} {total === 1 ? "character" : "characters"} cost{" "}
            <span className="font-mono">O(P) = O({total})</span>
            {data.fullyMatched &&
              ", then a depth-first search below the last node collected the words"}
            . The Trie holds {data.stats.wordCount} words in {data.stats.nodeCount} nodes. Server
            time: {data.timeMs} ms.
          </p>
        </div>
      )}
    </div>
  );
}
