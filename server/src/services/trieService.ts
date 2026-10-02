import { Trie, Suggestion, TrieStep } from "../algorithms/Trie";
import { getAllDocuments } from "./documentService";
import { preprocess } from "../utils/textProcessor";

const trie = new Trie();

/**
 * Build the Trie from all documents. Runs once at startup.
 * We insert the ORIGINAL words (e.g. "computing"), not stemmed terms ("comput"),
 * so suggestions look natural to the user.
 * Stop words never reach the Trie because preprocess() already removed them.
 */
function buildTrie(): void {
  for (const doc of getAllDocuments()) {
    const tokens = preprocess(`${doc.title}. ${doc.content}`);
    for (const token of tokens) {
      trie.insert(token.original);
    }
  }
}

buildTrie();

/**
 * Turn whatever the user typed into a clean prefix:
 *   - take only the LAST word ("data str" -> "str"), since that is the word being typed
 *   - lowercase it and strip anything that is not a-z or 0-9
 * If the text ends with a space, the last word is empty, so there is nothing to complete.
 */
export function extractPrefix(rawQuery: string): string {
  const lastWord = rawQuery.toLowerCase().split(/\s+/).pop() ?? "";
  return lastWord.replace(/[^a-z0-9]/g, "");
}

/** Autocomplete for the text currently in the search box. */
export function getSuggestionsForQuery(
  rawQuery: string,
  limit = 8
): { prefix: string; suggestions: Suggestion[] } {
  const prefix = extractPrefix(rawQuery);
  return { prefix, suggestions: trie.getSuggestions(prefix, limit) };
}

/** Everything the Trie visualizer needs for one prefix. */
export function getTrieTraversal(prefix: string, limit = 8): {
  steps: TrieStep[];
  rootChildren: string[];
  suggestions: Suggestion[];
  fullyMatched: boolean;
} {
  const steps = trie.getPath(prefix);
  return {
    steps,
    rootChildren: trie.getRootChildren(),
    suggestions: trie.getSuggestions(prefix, limit),
    fullyMatched: steps.length > 0 && steps.every((step) => step.found),
  };
}

export function getTrieStats(): { wordCount: number; nodeCount: number } {
  return trie.getStats();
}


/**
 * Words in the vocabulary that start with `prefix` (original, unstemmed).
 * The search engine uses this for partial search ("algo") and "did you mean".
 */
export function expandPrefix(prefix: string, limit = 100): string[] {
  return trie.getSuggestions(prefix, limit).map((suggestion) => suggestion.word);
}