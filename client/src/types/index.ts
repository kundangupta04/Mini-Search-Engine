export interface DocumentData {
  id: number;
  title: string;
  category: string;
  content: string;
  source: string;
}

export interface ScoreBreakdown {
  termFrequency: number;
  keywordMatch: number;
  titleMatch: number;
  exactPhrase: number;
  allKeywords: number;
}

export interface PhraseMatch {
  phrase: string;
  count: number;
}

export interface SearchResultItem {
  rank: number;
  docId: number;
  title: string;
  category: string;
  source: string;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  snippet: string;
  matchedKeywords: string[];
  matchedQueryWords: string[];
  totalOccurrences: number;
  phraseMatches: PhraseMatch[];
}

export type SearchStatus = "ok" | "empty_query" | "no_searchable_terms" | "no_results";

export interface ResolvedTerm {
  queryWord: string;
  term: string;
  matchType: "exact" | "prefix";
}

export interface SearchResponse {
  query: string;
  status: SearchStatus;
  message: string | null;
  timeMs: number;
  totalResults: number;
  results: SearchResultItem[];
  sort: { algorithm: string; items: number; comparisons: number };
  interpretation: {
    words: string[];
    phrases: string[];
    resolved: ResolvedTerm[];
    unmatchedWords: string[];
    truncated: boolean;
  };
  relatedTerms: string[];
}

export interface SuggestionResponse {
  query: string;
  prefix: string;
  suggestions: string[];
  timeMs: number;
}

export interface HealthResponse {
  status: string;
  message: string;
  documentsLoaded: number;
  trie: { wordCount: number; nodeCount: number };
  index: {
    documentCount: number;
    termCount: number;
    totalPostings: number;
    totalTokens: number;
    averageDocLength: number;
    buildTimeMs: number;
  };
  time: string;
}

export interface RecentSearch {
  query: string;
  timeMs: number;
  resultCount: number;
  at: string;
}

export interface StatsResponse {
  documents: number;
  trie: { wordCount: number; nodeCount: number };
  index: {
    documentCount: number;
    termCount: number;
    totalPostings: number;
    totalTokens: number;
    averageDocLength: number;
    buildTimeMs: number;
  };
  search: {
    startedAt: string;
    totalSearches: number;
    zeroResultSearches: number;
    averageTimeMs: number;
    minTimeMs: number | null;
    maxTimeMs: number | null;
    topQueries: { query: string; count: number }[];
    topTerms: { term: string; count: number }[];
    recentSearches: RecentSearch[]; // newest first
    documentsPerCategory: { category: string; count: number }[];
  };
}