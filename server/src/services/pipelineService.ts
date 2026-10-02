import { SearchEngine, SearchStatus } from "../algorithms/Search";
import { scoreCandidates, ScoredCandidate } from "../algorithms/Ranking";
import { mergeSort, MergeStep, SortStats } from "../algorithms/MergeSort";
import { getInvertedIndex } from "./invertedIndexService";
import { expandPrefix } from "./trieService";
import { getDocumentById } from "./documentService";
import {
  toLowerCase,
  removePunctuation,
  tokenize,
  isStopWord,
  preprocess,
} from "../utils/textProcessor";

// Same wiring as the real search: the shared index and the real Trie.
// The engine itself stores no data, so a second instance is safe.
const engine = new SearchEngine({ index: getInvertedIndex(), expandPrefix });

export interface RankedItem {
  docId: number;
  title: string;
  score: number;
}

export interface PipelineStepJson {
  depth: number;
  left: RankedItem[];
  right: RankedItem[];
  merged: RankedItem[];
}

export interface PipelineResponse {
  query: string;
  status: SearchStatus;
  parse: { phrases: string[]; words: string[]; truncated: boolean };
  stages: {
    original: string;
    lowercased: string;
    withoutPunctuation: string;
    tokens: string[];
    afterStopWords: string[];
    terms: string[];
  };
  lookups: {
    queryWord: string;
    term: string;
    matchType: "exact" | "prefix";
    documentFrequency: number;
    docIds: number[]; // first 12 only
  }[];
  unmatchedWords: string[];
  beforeSort: RankedItem[]; // scored, in document-id order
  afterSort: RankedItem[];  // after Merge Sort, best first
  mergeSteps: PipelineStepJson[];
  sort: { algorithm: string; items: number; comparisons: number };
  timings: { searchMs: number; scoreMs: number; sortMs: number; totalMs: number };
}

const round = (value: number): number => Number(value.toFixed(3));

function toItem(scored: ScoredCandidate): RankedItem {
  return {
    docId: scored.candidate.docId,
    title: getDocumentById(scored.candidate.docId)?.title ?? "(unknown)",
    score: scored.score,
  };
}

/** Run a query through the real pipeline and keep every intermediate result. */
export function explainSearch(rawQuery: string): PipelineResponse {
  // Stage timings: each one is a real measurement.
  const t0 = performance.now();
  const outcome = engine.search(rawQuery); // parse -> resolve -> index lookups -> candidates
  const t1 = performance.now();
  const scored = scoreCandidates(outcome.candidates, outcome.resolved); // id order
  const t2 = performance.now();

  const stats: SortStats = { comparisons: 0 };
  const trace: MergeStep<ScoredCandidate>[] = [];
  // Same comparator as sortByScore in Ranking.ts (highest score first).
  const ranked = mergeSort(scored, (a, b) => b.score - a.score, stats, trace);
  const t3 = performance.now();

  // Text-processing stages, shown one by one (same functions as preprocess()).
  const lowercased = toLowerCase(rawQuery);
  const withoutPunctuation = removePunctuation(lowercased);
  const tokens = tokenize(withoutPunctuation);
  const afterStopWords = tokens.filter((t) => t.length >= 2 && !isStopWord(t));

  const index = getInvertedIndex();
  const lookups = outcome.resolved.map((r) => {
    const postings = index.getPostings(r.term);
    return {
      queryWord: r.queryWord,
      term: r.term,
      matchType: r.matchType,
      documentFrequency: postings.length,
      docIds: postings.slice(0, 12).map((p) => p.docId),
    };
  });

  return {
    query: rawQuery,
    status: outcome.status,
    parse: {
      phrases: outcome.query.phrases.map((p) => p.text),
      words: outcome.query.words.map((w) => w.original),
      truncated: outcome.query.truncated,
    },
    stages: {
      original: rawQuery,
      lowercased,
      withoutPunctuation,
      tokens,
      afterStopWords,
      terms: preprocess(rawQuery).map((t) => t.term),
    },
    lookups,
    unmatchedWords: outcome.unmatchedWords,
    beforeSort: scored.map(toItem),
    afterSort: ranked.map(toItem),
    mergeSteps: trace.map((step) => ({
      depth: step.depth,
      left: step.left.map(toItem),
      right: step.right.map(toItem),
      merged: step.merged.map(toItem),
    })),
    sort: { algorithm: "Merge Sort", items: scored.length, comparisons: stats.comparisons },
    timings: {
      searchMs: round(t1 - t0),
      scoreMs: round(t2 - t1),
      sortMs: round(t3 - t2),
      totalMs: round(t3 - t0),
    },
  };
}