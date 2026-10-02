import type { SearchStatus } from "./index";

export interface TrieStep {
  char: string;
  found: boolean;
  isEndOfWord: boolean;
  children: string[];
}

export interface TrieDemoResponse {
  prefix: string;
  steps: TrieStep[];
  rootChildren: string[];
  suggestions: { word: string; frequency: number }[];
  fullyMatched: boolean;
  stats: { wordCount: number; nodeCount: number };
  timeMs: number;
}

export interface IndexPosting {
  docId: number;
  title: string;
  category: string;
  frequency: number;
  inTitle: boolean;
  positions: number[];
}

export interface IndexDemoResponse {
  word: string;
  term: string | null;
  documentFrequency: number;
  note?: string;
  postings: IndexPosting[];
  stats: { termCount: number; totalPostings: number; documentCount: number };
  topTerms: { term: string; documentFrequency: number }[];
  timeMs: number;
}

export interface SortStepData {
  depth: number;
  left: number[];
  right: number[];
  merged: number[];
}

export interface SortDemoResponse {
  algorithm: string;
  order: "asc" | "desc";
  input: number[];
  sorted: number[];
  comparisons: number;
  steps: SortStepData[];
  timeMs: number;
}

export interface RankedItem {
  docId: number;
  title: string;
  score: number;
}

export interface PipelineStepData {
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
    docIds: number[];
  }[];
  unmatchedWords: string[];
  beforeSort: RankedItem[];
  afterSort: RankedItem[];
  mergeSteps: PipelineStepData[];
  sort: { algorithm: string; items: number; comparisons: number };
  timings: { searchMs: number; scoreMs: number; sortMs: number; totalMs: number };
}