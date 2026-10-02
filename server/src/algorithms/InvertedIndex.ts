import { Document, Posting } from "../types";
import { preprocess } from "../utils/textProcessor";

/** The minimum a phrase search needs from each query word. ProcessedToken fits this shape. */
export interface PhraseToken {
  term: string;
  position: number;
}

export interface IndexStats {
  documentCount: number;
  termCount: number;       // distinct terms in the index
  totalPostings: number;   // (term, document) pairs
  totalTokens: number;     // kept tokens across all documents
  averageDocLength: number;
}

/**
 * INVERTED INDEX: term -> documents that contain it.
 *
 * Structure (a HashMap of HashMaps):
 *    index:  Map< term , Map< docId , Posting > >
 *
 * The outer Map finds a term in O(1) average.
 * The inner Map answers "is this term in document D?" in O(1) average,
 * which makes phrase search and multi-term lookups cheap.
 *
 * Callers must pass already-normalized (stemmed) terms to the lookup methods.
 */
export class InvertedIndex {
  private index = new Map<string, Map<number, Posting>>();
  // docId -> the set of terms it contains (lets us remove a document without scanning everything)
  private docTerms = new Map<number, Set<string>>();
  // docId -> number of kept tokens (document length, useful for statistics)
  private docLengths = new Map<number, number>();

  /**
   * INDEX ONE DOCUMENT.
   *  1. Preprocess title and content (Step 4).
   *  2. For each token, update a small local Map: term -> Posting
   *     (this is the frequency counting).
   *  3. Copy each local posting into the main index.
   *
   * Time: O(T) for T tokens. Space: O(T) for the stored positions.
   */
  addDocument(doc: Document): void {
    if (this.docLengths.has(doc.id)) {
      throw new Error(`Document ${doc.id} is already indexed.`);
    }

    const titleTokens = preprocess(doc.title);
    const contentTokens = preprocess(doc.content);

    // Content positions start after the title, with a gap so that a phrase
    // can never match across the title/content boundary.
    const lastTitlePosition =
      titleTokens.length > 0 ? titleTokens[titleTokens.length - 1].position : 0;
    const contentOffset = lastTitlePosition + 2;

    const local = new Map<string, Posting>();

    const addToken = (term: string, position: number, isTitle: boolean): void => {
      let posting = local.get(term);
      if (!posting) {
        posting = { docId: doc.id, frequency: 0, positions: [], inTitle: false };
        local.set(term, posting);
      }
      posting.frequency++;            // frequency counting
      posting.positions.push(position); // always ascending, see offset above
      if (isTitle) posting.inTitle = true;
    };

    for (const token of titleTokens) {
      addToken(token.term, token.position, true);
    }
    for (const token of contentTokens) {
      addToken(token.term, token.position + contentOffset, false);
    }

    // Merge this document's postings into the main index.
    for (const [term, posting] of local) {
      let postingsForTerm = this.index.get(term);
      if (!postingsForTerm) {
        postingsForTerm = new Map<number, Posting>();
        this.index.set(term, postingsForTerm);
      }
      postingsForTerm.set(doc.id, posting);
    }

    this.docTerms.set(doc.id, new Set(local.keys()));
    this.docLengths.set(doc.id, titleTokens.length + contentTokens.length);
  }

  /**
   * REMOVE ONE DOCUMENT (HashMap deletion).
   * We know exactly which terms the document contains, so we only touch those.
   * If a term is left with no documents, the term itself is deleted.
   * Time: O(U_d) for U_d unique terms in that document.
   * Returns false if the document was never indexed.
   *
   * Note: our Trie has no delete, so autocomplete may still suggest words
   * from a removed document. We don't need removal in this app; it is here
   * to demonstrate HashMap deletion.
   */
  removeDocument(docId: number): boolean {
    const terms = this.docTerms.get(docId);
    if (!terms) return false;

    for (const term of terms) {
      const postings = this.index.get(term);
      if (!postings) continue;
      postings.delete(docId);
      if (postings.size === 0) this.index.delete(term);
    }

    this.docTerms.delete(docId);
    this.docLengths.delete(docId);
    return true;
  }

  /** Does the index contain this exact (stemmed) term? O(1) average. */
  hasTerm(term: string): boolean {
    return this.index.has(term);
  }

  /** All postings for a term. O(1) average to find, O(k) to copy k postings. */
  getPostings(term: string): Posting[] {
    const postings = this.index.get(term);
    return postings ? Array.from(postings.values()) : [];
  }

  /** The posting for one term in one document, or undefined. O(1) average. */
  getPosting(term: string, docId: number): Posting | undefined {
    return this.index.get(term)?.get(docId);
  }

  /** In how many documents does the term appear? O(1) average. */
  getDocumentFrequency(term: string): number {
    return this.index.get(term)?.size ?? 0;
  }

  /** Token count of a document (0 if unknown). */
  getDocumentLength(docId: number): number {
    return this.docLengths.get(docId) ?? 0;
  }

  /**
   * PHRASE SEARCH using word positions.
   *
   * A phrase matches at position `start` if every later word sits exactly
   * where it should relative to the first word:
   *    needed position = start + (word.position - firstWord.position)
   *
   * Using each word's own `position` (not just its index in the array) is
   * what lets stop words inside a phrase keep their slot.
   *
   * Returns: docId -> number of times the phrase occurs (only documents with 1+).
   * Time: roughly O(k * f * m), see the table above.
   */
  searchPhrase(tokens: PhraseToken[]): Map<number, number> {
    const matches = new Map<number, number>();
    if (tokens.length === 0) return matches;

    // Step 1: every word of the phrase must exist in the index at all.
    const postingMaps: Map<number, Posting>[] = [];
    for (const token of tokens) {
      const postings = this.index.get(token.term);
      if (!postings) return matches; // one missing word means no phrase can match
      postingMaps.push(postings);
    }

    const first = tokens[0];

    // Step 2: only documents containing the FIRST word can match, so start there.
    for (const [docId, firstPosting] of postingMaps[0]) {
      // Gather this document's posting for each word; skip if any word is absent.
      const postingsInDoc: Posting[] = [];
      let allPresent = true;
      for (const postings of postingMaps) {
        const posting = postings.get(docId); // O(1) average
        if (!posting) {
          allPresent = false;
          break;
        }
        postingsInDoc.push(posting);
      }
      if (!allPresent) continue;

      // Step 3: try each occurrence of the first word as a possible phrase start.
      let phraseCount = 0;
      for (const start of firstPosting.positions) {
        let isMatch = true;
        for (let i = 1; i < tokens.length; i++) {
          const neededPosition = start + (tokens[i].position - first.position);
          if (!postingsInDoc[i].positions.includes(neededPosition)) {
            isMatch = false;
            break;
          }
        }
        if (isMatch) phraseCount++;
      }

      if (phraseCount > 0) matches.set(docId, phraseCount);
    }

    return matches;
  }

  /**
   * The most widespread terms (appear in the most documents).
   * Built-in sort is fine: this is a small statistics helper, not the search ranking.
   */
  getTopTerms(limit = 10): { term: string; documentFrequency: number }[] {
    const all: { term: string; documentFrequency: number }[] = [];
    for (const [term, postings] of this.index) {
      all.push({ term, documentFrequency: postings.size });
    }
    all.sort(
      (a, b) =>
        b.documentFrequency - a.documentFrequency || a.term.localeCompare(b.term)
    );
    return all.slice(0, limit);
  }

  /** Size information for the statistics page. O(U) over terms. */
  getStats(): IndexStats {
    let totalPostings = 0;
    for (const postings of this.index.values()) totalPostings += postings.size;

    let totalTokens = 0;
    for (const length of this.docLengths.values()) totalTokens += length;

    const documentCount = this.docLengths.size;
    return {
      documentCount,
      termCount: this.index.size,
      totalPostings,
      totalTokens,
      averageDocLength:
        documentCount === 0 ? 0 : Number((totalTokens / documentCount).toFixed(2)),
    };
  }
}