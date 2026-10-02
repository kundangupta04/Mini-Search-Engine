import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";

const POPULAR_TOPICS = [
  { label: "Algorithms", query: "algorithms" },
  { label: "Data Structures", query: "data structures" },
  { label: "AI", query: "artificial intelligence" },
  { label: "Database", query: "database" },
  { label: "Networking", query: "networking" },
  { label: "Operating Systems", query: "operating systems" },
];

// Each example shows off a different feature of the engine.
const EXAMPLES = [
  { label: "machine learning", query: "machine learning", note: "multi-word" },
  { label: '"data structures"', query: '"data structures"', note: "exact phrase" },
  { label: "algo", query: "algo", note: "partial (Trie)" },
];

function chipLink(query: string): string {
  return `/search?q=${encodeURIComponent(query)}`;
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl pt-10 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-slate-800 sm:text-5xl">
        Mini Search Engine
      </h1>
      <p className="mt-3 text-slate-500">Search the knowledge base</p>

      <div className="mt-8">
        <SearchBar large autoFocus />
      </div>

      <section className="mt-12">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Popular Topics
        </h2>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {POPULAR_TOPICS.map((topic) => (
            <Link
              key={topic.label}
              to={chipLink(topic.query)}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-indigo-300 hover:text-indigo-700"
            >
              {topic.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Try these searches
        </h2>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((example) => (
            <Link
              key={example.query}
              to={chipLink(example.query)}
              className="rounded-full bg-indigo-50 px-4 py-1.5 text-sm text-indigo-700 hover:bg-indigo-100"
            >
              {example.label}
              <span className="ml-2 text-xs text-indigo-400">{example.note}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}