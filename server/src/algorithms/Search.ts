import { InvertedIndex } from "./InvertedIndex";
import { ParsedQuery, parseQuery } from "../utils/queryParser";
import { stem } from "../utils/textProcessor";

export type MatchType = "exact" | "prefix";

/** A query word mapped to one index term. */
export interface ResolvedTerm {
  queryWord: string;  // the word the user typed (lowercase, unstemmed)
  term: string;       // the term actually looked up in the index
  matchType: MatchType;
}

/** One term found in one document. Step 8 scores these. */
export interface TermMatch extends ResolvedTerm {
  frequency: number;
  inTitle: boolean;
  positions: number[];
}

export interface PhraseMatch {
  phrase: string;
  count: number; // how many times the phrase occurs in the document
}

/** A document that matched the query, with the evidence for why. */
export interface Candidate {
  docId: number;
  termMatches: TermMatch[];
  phraseMatches: PhraseMatch[];
}

export type SearchStatus = "ok" | "empty_query" | "no_searchable_terms" | "no_results";

export interface SearchOutcome {
  query: ParsedQuery;
  status: SearchStatus;
  candidates: Candidate[];
  resolved: ResolvedTerm[];     // every index term we looked up
  unmatchedWords: string[];     // query words that matched nothing
  relatedTerms: string[];       // "did you mean" words, only when there are no results
}

export interface SearchEngineDependencies {
  index: InvertedIndex;
  /** Words (original, unstemmed) in the vocabulary that start with `prefix`. Backed by the Trie. */
  expandPrefix: (prefix: string) => string[];
}

export class SearchEngine {
  private index: InvertedIndex;
  private expandPrefix: (prefix: string) => string[];

  constructor(deps: SearchEngineDependencies) {
    this.index = deps.index;
    this.expandPrefix = deps.expandPrefix;
  }

  /**
   * THE SEARCH PIPELINE (without scoring, which comes in Step 8).
   * Time: O(q + sum of postings touched), never proportional to the collection size.
   */
  search(rawQuery: string): SearchOutcome {
    // ---- 1. Parse ----------------------------------------------------------
    const query = parseQuery(rawQuery);

    if (rawQuery.trim() === "") {
      return this.outcome(query, "empty_query");
    }
    if (query.words.length === 0 && query.phrases.length === 0) {
      // e.g. "the of and" or "!!!": nothing left after preprocessing
      return this.outcome(query, "no_searchable_terms");
    }

    // ---- 2. Phrases are REQUIRED: intersect the documents of every phrase ---
    const phraseResults = query.phrases.map((phrase) => this.index.searchPhrase(phrase.tokens));
    let allowedDocs: Set<number> | null = null;

    if (phraseResults.length > 0) {
      allowedDocs = new Set(phraseResults[0].keys());
      for (const result of phraseResults) {
        for (const docId of Array.from(allowedDocs)) {
          if (!result.has(docId)) allowedDocs.delete(docId); // O(1) average check
        }
      }
      if (allowedDocs.size === 0) {
        return this.outcome(query, "no_results");
      }
    }

    // ---- 3. Resolve words to index terms -------------------------------------
    const resolved: ResolvedTerm[] = [];
    const unmatchedWords: string[] = [];
    const seen = new Set<string>(); // avoids resolving the same (word, term) twice

    const addResolved = (queryWord: string, term: string, matchType: MatchType): void => {
      const key = `${queryWord}|${term}`;
      if (seen.has(key)) return;
      seen.add(key);
      resolved.push({ queryWord, term, matchType });
    };

    for (const word of query.words) {
      if (this.index.hasTerm(word.term)) {
        // Exact match: one HashMap lookup, O(1) average.
        addResolved(word.original, word.term, "exact");
        continue;
      }

      // PARTIAL SEARCH: ask the Trie for words starting with what was typed,
      // stem each one (the index stores stemmed terms) and keep those that exist.
      let foundAny = false;
      for (const expansion of this.expandPrefix(word.original)) {
        const term = stem(expansion);
        if (this.index.hasTerm(term)) {
          addResolved(word.original, term, "prefix");
          foundAny = true;
        }
      }
      if (!foundAny) unmatchedWords.push(word.original);
    }

    // Words inside phrases also become matched terms (used for highlighting and scoring).
    for (const phrase of query.phrases) {
      for (const token of phrase.tokens) {
        if (this.index.hasTerm(token.term)) addResolved(token.original, token.term, "exact");
      }
    }

    // ---- 4. Gather candidate documents from the postings --------------------
    const candidateMap = new Map<number, Candidate>(); // HashMap: docId -> Candidate

    for (const r of resolved) {
      for (const posting of this.index.getPostings(r.term)) {
        if (allowedDocs && !allowedDocs.has(posting.docId)) continue;

        let candidate = candidateMap.get(posting.docId);
        if (!candidate) {
          candidate = { docId: posting.docId, termMatches: [], phraseMatches: [] };
          candidateMap.set(posting.docId, candidate);
        }
        candidate.termMatches.push({
          ...r,
          frequency: posting.frequency,
          inTitle: posting.inTitle,
          positions: posting.positions,
        });
      }
    }

    // Attach how often each phrase occurred in each candidate.
    query.phrases.forEach((phrase, i) => {
      for (const [docId, count] of phraseResults[i]) {
        candidateMap.get(docId)?.phraseMatches.push({ phrase: phrase.text, count });
      }
    });

    // TEMPORARY ORDER: by document id, so output is predictable.
    // Step 8 replaces this with scoring + our own Merge Sort.
    const candidates = Array.from(candidateMap.values()).sort((a, b) => a.docId - b.docId);

    const relatedTerms = candidates.length === 0 ? this.findRelatedTerms(unmatchedWords) : [];

    return {
      query,
      status: candidates.length > 0 ? "ok" : "no_results",
      candidates,
      resolved,
      unmatchedWords,
      relatedTerms,
    };
  }

  /**
   * "DID YOU MEAN": for a word that matched nothing, shorten it one letter at a time
   * (never below 3 letters) until the Trie finds words with that prefix.
   * Example: "algoritm" -> "algorit" -> Trie finds "algorithm", "algorithms".
   */
  private findRelatedTerms(unmatchedWords: string[]): string[] {
    const related = new Set<string>();

    for (const word of unmatchedWords) {
      const clean = word.replace(/[^a-z0-9]/g, "");
      for (let length = clean.length - 1; length >= 3; length--) {
        const words = this.expandPrefix(clean.slice(0, length));
        if (words.length > 0) {
          words.slice(0, 5).forEach((w) => related.add(w));
          break; // stop at the longest prefix that works
        }
      }
    }
    return Array.from(related).slice(0, 8);
  }

  private outcome(query: ParsedQuery, status: SearchStatus): SearchOutcome {
    return { query, status, candidates: [], resolved: [], unmatchedWords: [], relatedTerms: [] };
  }
}