import { mergeSort } from "../algorithms/MergeSort";
import { getAllDocuments } from "./documentService";
import { parseQuery } from "../utils/queryParser";

const MAX_RECENT = 20;          // keep only the last 20 searches
const MAX_TRACKED_KEYS = 1000;  // memory cap for distinct queries / terms

export interface RecentSearch {
  query: string;
  timeMs: number;
  resultCount: number;
  at: string; // ISO timestamp
}

interface TermEntry {
  label: string; // readable word shown in the UI (first spelling seen)
  count: number;
}

// All of this lives in memory and resets when the server restarts.
let startedAt = new Date().toISOString();
let totalSearches = 0;
let zeroResultSearches = 0;
let totalTimeMs = 0;
let minTimeMs: number | null = null;
let maxTimeMs: number | null = null;

// HASHMAPS for frequency counting.
const queryCounts = new Map<string, number>();     // normalized query -> times searched
const termCounts = new Map<string, TermEntry>();   // stemmed term -> label + times searched
let recentSearches: RecentSearch[] = [];           // newest first

/** "Data   Structures " and "data structures" are the same query. O(q). */
function normalizeQuery(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Record one real search.
 * Time: O(q). Each Map update is O(1) on average.
 */
export function recordSearch(rawQuery: string, timeMs: number, resultCount: number): void {
  totalSearches++;
  totalTimeMs += timeMs;
  minTimeMs = minTimeMs === null ? timeMs : Math.min(minTimeMs, timeMs);
  maxTimeMs = maxTimeMs === null ? timeMs : Math.max(maxTimeMs, timeMs);
  if (resultCount === 0) zeroResultSearches++;

  // 1. Count the whole query (frequency counting with a HashMap).
  const key = normalizeQuery(rawQuery);
  const known = queryCounts.get(key);
  if (known !== undefined) {
    queryCounts.set(key, known + 1);
  } else if (queryCounts.size < MAX_TRACKED_KEYS) {
    queryCounts.set(key, 1);
  }

  // 2. Count each distinct TERM once per query. We reuse the real query parser,
  //    so stop words are ignored and "algorithms"/"algorithm" count together.
  const parsed = parseQuery(rawQuery);
  const tokens = [...parsed.words, ...parsed.phrases.flatMap((phrase) => phrase.tokens)];
  const seenInThisQuery = new Set<string>();
  for (const token of tokens) {
    if (seenInThisQuery.has(token.term)) continue;
    seenInThisQuery.add(token.term);

    const entry = termCounts.get(token.term);
    if (entry) {
      entry.count++;
    } else if (termCounts.size < MAX_TRACKED_KEYS) {
      termCounts.set(token.term, { label: token.original, count: 1 });
    }
  }

  // 3. Bounded history: newest first, drop the oldest.
  recentSearches.unshift({
    query: rawQuery,
    timeMs,
    resultCount,
    at: new Date().toISOString(),
  });
  if (recentSearches.length > MAX_RECENT) recentSearches.pop();
}

/** Documents per category: another HashMap frequency count. O(D). */
function getDocumentsPerCategory(): { category: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const doc of getAllDocuments()) {
    counts.set(doc.category, (counts.get(doc.category) ?? 0) + 1);
  }
  const rows = Array.from(counts, ([category, count]) => ({ category, count }));
  return mergeSort(rows, (a, b) => b.count - a.count || a.category.localeCompare(b.category));
}

/**
 * Everything the Statistics page needs.
 * The "top" lists are sorted with OUR Merge Sort (highest count first, ties alphabetical).
 */
export function getSearchStats(topLimit = 10) {
  const queries = Array.from(queryCounts, ([query, count]) => ({ query, count }));
  const topQueries = mergeSort(
    queries,
    (a, b) => b.count - a.count || a.query.localeCompare(b.query)
  ).slice(0, topLimit);

  const terms = Array.from(termCounts.values(), (entry) => ({ term: entry.label, count: entry.count }));
  const topTerms = mergeSort(
    terms,
    (a, b) => b.count - a.count || a.term.localeCompare(b.term)
  ).slice(0, topLimit);

  return {
    startedAt,
    totalSearches,
    zeroResultSearches,
    averageTimeMs: totalSearches === 0 ? 0 : Number((totalTimeMs / totalSearches).toFixed(3)),
    minTimeMs,
    maxTimeMs,
    topQueries,
    topTerms,
    recentSearches, // newest first
    documentsPerCategory: getDocumentsPerCategory(),
  };
}

/** Clear all search statistics (handy before a demo). */
export function resetSearchStats(): void {
  startedAt = new Date().toISOString();
  totalSearches = 0;
  zeroResultSearches = 0;
  totalTimeMs = 0;
  minTimeMs = null;
  maxTimeMs = null;
  queryCounts.clear();
  termCounts.clear();
  recentSearches = [];
}