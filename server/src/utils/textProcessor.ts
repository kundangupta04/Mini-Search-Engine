import { ProcessedToken } from "../types";

/**
 * STOP WORDS: very common words that carry little meaning ("the", "is", "of").
 * Removing them makes the index smaller and the search more relevant.
 *
 * DSA: stored in a HashSet, so checking a word is O(1) on average.
 */
const STOP_WORDS = new Set<string>([
  "a", "an", "the", "and", "or", "but", "if", "of", "to", "in", "on", "at",
  "by", "for", "with", "from", "as", "is", "are", "was", "were", "be", "been",
  "being", "am", "it", "its", "this", "that", "these", "those", "which", "who",
  "whom", "what", "when", "where", "how", "so", "than", "then", "there",
  "their", "them", "they", "he", "she", "we", "you", "your", "i", "me", "my",
  "our", "us", "his", "her", "not", "no", "can", "will", "would", "should",
  "could", "has", "have", "had", "do", "does", "did", "into", "over", "such",
  "also", "more", "most", "other", "some", "any", "each", "both", "about",
  "up", "down", "out", "off", "very", "just", "while", "because", "between",
  "through", "during", "before", "after", "only", "own", "same", "too",
]);

/** Step 1: convert to lowercase so "Data" and "data" match. O(n). */
export function toLowerCase(text: string): string {
  return text.toLowerCase();
}

/**
 * Step 2: remove punctuation. O(n).
 * - Apostrophes are deleted:    "it's"   -> "its"
 * - Everything else that is not a letter, digit or space becomes a space:
 *                               "B-Trees," -> "b trees "
 * Must be called AFTER toLowerCase, because the pattern only keeps a-z.
 */
export function removePunctuation(text: string): string {
  return text.replace(/['’]/g, "").replace(/[^a-z0-9\s]/g, " ");
}

/** Step 3: split the text into words. Extra spaces create empty strings, so we filter them. O(n). */
export function tokenize(text: string): string[] {
  return text.split(/\s+/).filter((token) => token.length > 0);
}

/** Step 4: is this word a stop word? O(1) average (HashSet lookup). */
export function isStopWord(word: string): boolean {
  return STOP_WORDS.has(word);
}

/** Does the text contain at least one vowel? Used so we never stem "string" into "str". */
function hasVowel(text: string): boolean {
  return /[aeiouy]/.test(text);
}

/**
 * Step 5: normalize a word with simple suffix-stripping rules (see the table above).
 * Time: O(k) where k is the word length (tiny), so effectively constant.
 */
export function stem(word: string): string {
  // Very short words are left alone ("sql", "dns", "css").
  if (word.length <= 3) return word;

  let result = word;

  // --- Plural rules (only the first matching rule is applied) ---
  if (result.endsWith("sses")) {
    result = result.slice(0, -2);              // classes -> class
  } else if (result.endsWith("ies") && result.length > 4) {
    result = result.slice(0, -3) + "y";        // queries -> query
  } else if (
    result.endsWith("ches") ||
    result.endsWith("shes") ||
    result.endsWith("xes")
  ) {
    result = result.slice(0, -2);              // searches -> search
  } else if (
    result.endsWith("s") &&
    !result.endsWith("ss") &&
    !result.endsWith("us") &&
    !result.endsWith("is")
  ) {
    result = result.slice(0, -1);              // algorithms -> algorithm
  }

  // --- Suffix rules: "ing" and "ed" ---
  let stripped: string | null = null;
  if (result.endsWith("ing") && result.length > 5) {
    stripped = result.slice(0, -3);            // searching -> search
  } else if (result.endsWith("ed") && result.length > 4) {
    stripped = result.slice(0, -2);            // indexed -> index
  }

  if (stripped !== null && hasVowel(stripped)) {
    result = stripped;

    // Undo doubled consonants: running -> runn -> run, mapped -> mapp -> map.
    // Letters l, s, z are excluded so "install" and "pass" keep their double letter.
    const last = result[result.length - 1];
    const secondLast = result[result.length - 2];
    if (last === secondLast && /[a-z]/.test(last) && !"lsz".includes(last)) {
      result = result.slice(0, -1);
    }
  }

  return result;
}

/**
 * THE MAIN PIPELINE: raw text -> list of processed tokens.
 *
 *   lowercase -> remove punctuation -> tokenize -> drop stop words -> stem
 *
 * Each kept token remembers its position in the ORIGINAL token list
 * (stop words still use up a position number). This is what makes
 * exact phrase search correct in Step 7.
 *
 * Time: O(n), Space: O(n).
 */
export function preprocess(text: string): ProcessedToken[] {
  const rawTokens = tokenize(removePunctuation(toLowerCase(text)));
  const result: ProcessedToken[] = [];

  rawTokens.forEach((word, position) => {
    // Skip one-letter tokens ("a", "b" from "B-Trees") and stop words.
    if (word.length < 2 || isStopWord(word)) return;

    result.push({ original: word, term: stem(word), position });
  });

  return result;
}

/** Convenience: just the stemmed terms, without positions. */
export function getTerms(text: string): string[] {
  return preprocess(text).map((token) => token.term);
}

/**
 * Step 6: FREQUENCY COUNTING with a HashMap (term -> count).
 * Time: O(T) for T terms (each update is O(1) average).
 * Space: O(U) for U unique terms.
 */
export function countFrequencies(terms: string[]): Map<string, number> {
  const frequencies = new Map<string, number>();
  for (const term of terms) {
    frequencies.set(term, (frequencies.get(term) ?? 0) + 1);
  }
  return frequencies;
}