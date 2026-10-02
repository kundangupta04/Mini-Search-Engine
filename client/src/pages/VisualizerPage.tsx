import { useSearchParams } from "react-router-dom";
import { ArrowDownWideNarrow, GitBranch, Library, ListOrdered } from "lucide-react";
import PipelineVisualizer from "../components/visualizer/PipelineVisualizer";
import TrieVisualizer from "../components/visualizer/TrieVisualizer";
import IndexVisualizer from "../components/visualizer/IndexVisualizer";
import SortVisualizer from "../components/visualizer/SortVisualizer";

const TABS = [
  { id: "pipeline", label: "Search pipeline", icon: ListOrdered },
  { id: "trie", label: "Trie", icon: GitBranch },
  { id: "index", label: "Inverted Index", icon: Library },
  { id: "sort", label: "Merge Sort", icon: ArrowDownWideNarrow },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTabId(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

export default function VisualizerPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab");
  const active: TabId = isTabId(requested) ? requested : "pipeline";

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">DSA Visualizer</h1>
      <p className="mt-1 text-slate-500">
        Watch the real algorithms work. Everything on this page is produced by the server.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setParams({ tab: tab.id })}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${
              active === tab.id
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {active === "pipeline" && <PipelineVisualizer />}
        {active === "trie" && <TrieVisualizer />}
        {active === "index" && <IndexVisualizer />}
        {active === "sort" && <SortVisualizer />}
      </div>
    </div>
  );
}