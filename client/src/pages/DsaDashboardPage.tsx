import {
  ArrowDownWideNarrow,
  ArrowRight,
  GitBranch,
  Hash,
  Library,
  Search,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface DsaCard {
  icon: LucideIcon;
  name: string;
  file: string;
  purpose: string;
  usage: string;
  time: string;
  space: string;
}

const CARDS: DsaCard[] = [
  {
    icon: GitBranch,
    name: "Trie",
    file: "algorithms/Trie.ts",
    purpose: "Fast prefix lookup, so we can autocomplete words as the user types.",
    usage:
      "Every word in the documents is inserted character by character. Typing “alg” walks a → l → g, then collects all words below that node. Also powers partial search and “did you mean”.",
    time: "insert / search O(L) · prefix walk O(P) · suggestions O(P + M + S log S)",
    space: "O(total characters), less when prefixes are shared",
  },
  {
    icon: Hash,
    name: "HashMap",
    file: "InvertedIndex.ts, documentService.ts",
    purpose: "Constant-time lookup of a value by key.",
    usage:
      "word → postings in the inverted index, docId → document for fetching a result, plus Sets for stop words and de-duplication, and Maps for frequency counting.",
    time: "insert / search / delete O(1) average (O(n) worst case with many collisions)",
    space: "O(n) for n stored keys",
  },
  {
    icon: Library,
    name: "Inverted Index",
    file: "algorithms/InvertedIndex.ts",
    purpose: "Find the documents containing a word without scanning every document.",
    usage:
      "Built once at startup: term → { document, frequency, positions, in-title }. A search looks up each query term; positions make exact phrase search possible.",
    time: "build O(N) for N tokens · term lookup O(1) average · phrase check O(k × f × m)",
    space: "O(N), because positions are stored for every token",
  },
  {
    icon: ArrowDownWideNarrow,
    name: "Merge Sort",
    file: "algorithms/MergeSort.ts",
    purpose: "Order the results from the highest score to the lowest.",
    usage:
      "Split the results in half, sort each half recursively, then merge by repeatedly taking the better front item. It is stable, so equal scores keep document-ID order.",
    time: "O(n log n) in best, average and worst case",
    space: "O(n) extra memory",
  },
  {
    icon: Search,
    name: "Searching",
    file: "algorithms/Search.ts",
    purpose: "Turn a query into a list of matching candidate documents.",
    usage:
      "Parse the query, normalize words, look each term up in the inverted index (or expand it with the Trie), check quoted phrases by position, and group the postings by document.",
    time: "O(q) parse + O(1) average per term + O(Σk) gathering postings",
    space: "O(c) for c candidate documents",
  },
  {
    icon: Trophy,
    name: "Ranking",
    file: "algorithms/Ranking.ts",
    purpose: "Decide which matching document is the best match.",
    usage:
      "Every candidate gets a score from term frequency, keyword matches, title matches, exact phrases and a bonus for matching all words. The breakdown is visible on every result.",
    time: "O(c × m) for c candidates with m term matches each",
    space: "O(c)",
  },
];

const PIPELINE = [
  "Query",
  "Preprocessing",
  "Inverted Index",
  "Candidates",
  "Scoring",
  "Merge Sort",
  "Results",
];

const FORMULA = [
  ["Term frequency", "+1 per occurrence (max 10 per word)"],
  ["Keyword match", "+3 per distinct query word found"],
  ["Title match", "+10 per distinct query word in the title"],
  ["Exact phrase", "+8 per quoted phrase found"],
  ["All-keywords bonus", "+5 when a 2+ word query is fully matched"],
];

export default function DsaDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">DSA Dashboard</h1>
      <p className="mt-1 text-slate-500">
        The data structures and algorithms behind every search, implemented by hand.
      </p>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Search pipeline
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {PIPELINE.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
                {step}
              </span>
              {i < PIPELINE.length - 1 && <ArrowRight className="h-4 w-4 text-slate-300" />}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Indexing happens once at server startup. Each search then reuses the index, so its cost
          depends on how many documents <em>match</em>, not on how many documents exist.
        </p>
      </section>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {CARDS.map((card) => (
          <section key={card.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">{card.name}</h2>
                <p className="font-mono text-xs text-slate-400">{card.file}</p>
              </div>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-medium text-slate-500">Purpose</dt>
                <dd className="text-slate-700">{card.purpose}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">How it is used</dt>
                <dd className="text-slate-700">{card.usage}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Time complexity</dt>
                <dd className="font-mono text-xs text-slate-700">{card.time}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Space complexity</dt>
                <dd className="font-mono text-xs text-slate-700">{card.space}</dd>
              </div>
            </dl>
          </section>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800">Ranking formula</h2>
        <table className="mt-3 w-full text-left text-sm">
          <tbody>
            {FORMULA.map(([rule, points]) => (
              <tr key={rule} className="border-t border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-700">{rule}</td>
                <td className="py-2 font-mono text-xs text-slate-500">{points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}