import { InvertedIndex, IndexStats } from "../algorithms/InvertedIndex";
import { getAllDocuments, getDocumentById } from "./documentService";
import { preprocess } from "../utils/textProcessor";

const invertedIndex = new InvertedIndex();

// Real measurement of how long indexing takes.
const buildStart = performance.now();
for (const doc of getAllDocuments()) {
  invertedIndex.addDocument(doc);
}
const buildTimeMs = Number((performance.now() - buildStart).toFixed(2));

/** The single shared index. Step 7 (the search engine) will use this. */
export function getInvertedIndex(): InvertedIndex {
  return invertedIndex;
}

export function getIndexStats(): IndexStats & { buildTimeMs: number } {
  return { ...invertedIndex.getStats(), buildTimeMs };
}

export function getTopTerms(limit = 10) {
  return invertedIndex.getTopTerms(limit);
}

export interface LookupResult {
  word: string;                 // what the caller typed
  term: string | null;          // the normalized term actually looked up
  documentFrequency: number;
  note?: string;
  postings: {
    docId: number;
    title: string;
    category: string;
    frequency: number;
    inTitle: boolean;
    positions: number[];
  }[];
}

/**
 * Look up ONE word the way a search would: normalize it first
 * ("Algorithms" -> "algorithm"), then ask the index.
 */
export function lookupWord(rawWord: string): LookupResult {
  const tokens = preprocess(rawWord);

  if (tokens.length === 0) {
    return {
      word: rawWord,
      term: null,
      documentFrequency: 0,
      note: "Nothing to look up: the input is empty or only stop words.",
      postings: [],
    };
  }

  const term = tokens[0].term;
  const postings = invertedIndex.getPostings(term).map((posting) => {
    const doc = getDocumentById(posting.docId); // HashMap lookup (Step 3)
    return {
      docId: posting.docId,
      title: doc?.title ?? "(unknown)",
      category: doc?.category ?? "(unknown)",
      frequency: posting.frequency,
      inTitle: posting.inTitle,
      positions: posting.positions,
    };
  });

  return {
    word: rawWord,
    term,
    documentFrequency: postings.length,
    note: tokens.length > 1 ? "Only the first word was looked up." : undefined,
    postings,
  };
}