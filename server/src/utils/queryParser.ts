import { preprocess } from "./textProcessor";
import { ProcessedToken } from "../types";

// Safety limits so a huge query cannot make one request slow.
export const MAX_QUERY_WORDS = 10;
export const MAX_QUERY_PHRASES = 3;

export interface ParsedPhrase {
  text: string;              // the phrase as typed, e.g. "data structures"
  tokens: ProcessedToken[];  // preprocessed, with positions (stop words keep their slot)
}

export interface ParsedQuery {
  raw: string;
  words: ProcessedToken[];   // free (unquoted) words, one per distinct term
  phrases: ParsedPhrase[];   // quoted phrases
  truncated: boolean;        // true if we ignored extra words/phrases
}

/**
 * Split a raw query into quoted phrases and free words.
 *
 *   data "merge sort" algorithms
 *        └─ phrase ─┘  └─ free words: data, algorithms
 *
 * The regex matches PAIRS of quotes (straight " or curly “ ”).
 * A single unbalanced quote is not a pair, so it stays in the text
 * and is later removed as punctuation by preprocess().
 *
 * Time: O(q) for a query of q characters.
 */
export function parseQuery(raw: string): ParsedQuery {
  const phrases: ParsedPhrase[] = [];

  // replace() calls our function for every "..." pair and removes it from the text.
  const withoutPhrases = raw.replace(/["“”]([^"“”]*)["“”]/g, (_match, inside: string) => {
    const tokens = preprocess(inside);
    if (tokens.length > 0) {
      phrases.push({ text: inside.trim(), tokens });
    }
    return " ";
  });

  // Free words: preprocess, then drop duplicates (HashSet of seen terms).
  const words: ProcessedToken[] = [];
  const seenTerms = new Set<string>();
  for (const token of preprocess(withoutPhrases)) {
    if (!seenTerms.has(token.term)) {
      seenTerms.add(token.term);
      words.push(token);
    }
  }

  const truncated = words.length > MAX_QUERY_WORDS || phrases.length > MAX_QUERY_PHRASES;

  return {
    raw,
    words: words.slice(0, MAX_QUERY_WORDS),
    phrases: phrases.slice(0, MAX_QUERY_PHRASES),
    truncated,
  };
}