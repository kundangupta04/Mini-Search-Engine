import { SearchEngine, SearchOutcome, SearchStatus, ResolvedTerm, PhraseMatch } from "../algorithms/Search";
import { getInvertedIndex } from "./invertedIndexService";
import { expandPrefix } from "./trieService";
import { getDocumentById } from "./documentService";
import { findHits, buildSnippet } from "../utils/snippet";
import { MAX_QUERY_WORDS, MAX_QUERY_PHRASES } from "../utils/queryParser";

// The one search engine, wired to the real index and the real Trie.
const engine = new SearchEngine({
  index: getInvertedIndex(),
  expandPrefix,
});

export interface SearchResultItem {
  docId: number;
  title: string;
  category: string;
  source: string;
  snippet: string;
  matchedKeywords: string[];   // words as they appear in the text (the client highlights these)
  matchedQueryWords: string[]; // which query words matched this document
  totalOccurrences: number;    // sum of term frequencies
  phraseMatches: PhraseMatch[];
}

export interface SearchResponse {
  query: string;
  status: SearchStatus;
  message: string | null;
  timeMs: number;
  totalResults: number;
  results: SearchResultItem[];
  interpretation: {            // "how the engine understood your query"
    words: string[];
    phrases: string[];
    resolved: ResolvedTerm[];
    unmatchedWords: string[];
    truncated: boolean;
  };
  relatedTerms: string[];
}

function buildMessage(outcome: SearchOutcome): string | null {
  switch (outcome.status) {
    case "empty_query":
      return "Please type something to search.";
    case "no_searchable_terms":
      return "Your search only contains very common words or symbols, which are ignored. Try a more specific word.";
    case "no_results":
      return outcome.query.phrases.length > 0
        ? "No matching documents found. Try removing the quotes to search the words separately."
        : "No matching documents found.";
    default:
      return outcome.query.truncated
        ? `Your query was long, so only the first ${MAX_QUERY_WORDS} words and ${MAX_QUERY_PHRASES} phrases were used.`
        : null;
  }
}

export function searchDocuments(rawQuery: string): SearchResponse {
  // Real measurement of the search itself (parse -> index lookups -> candidates).
  const start = performance.now();
  const outcome = engine.search(rawQuery);
  const timeMs = Number((performance.now() - start).toFixed(3));

  // Presentation: build one result card per candidate.
  const results: SearchResultItem[] = [];
  for (const candidate of outcome.candidates) {
    const doc = getDocumentById(candidate.docId); // HashMap lookup, O(1) average
    if (!doc) continue;

    const matchedTerms = new Set(candidate.termMatches.map((m) => m.term));
    const contentHits = findHits(doc.content, matchedTerms);
    const titleHits = findHits(doc.title, matchedTerms);

    results.push({
      docId: doc.id,
      title: doc.title,
      category: doc.category,
      source: doc.source,
      snippet: buildSnippet(doc.content, contentHits),
      matchedKeywords: Array.from(new Set([...titleHits, ...contentHits].map((h) => h.word))),
      matchedQueryWords: Array.from(new Set(candidate.termMatches.map((m) => m.queryWord))),
      totalOccurrences: candidate.termMatches.reduce((sum, m) => sum + m.frequency, 0),
      phraseMatches: candidate.phraseMatches,
    });
  }

  return {
    query: rawQuery,
    status: outcome.status,
    message: buildMessage(outcome),
    timeMs,
    totalResults: results.length,
    results,
    interpretation: {
      words: outcome.query.words.map((w) => w.original),
      phrases: outcome.query.phrases.map((p) => p.text),
      resolved: outcome.resolved,
      unmatchedWords: outcome.unmatchedWords,
      truncated: outcome.query.truncated,
    },
    relatedTerms: outcome.relatedTerms,
  };
}