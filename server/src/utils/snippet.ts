import { isStopWord, stem } from "./textProcessor";

export interface WordHit {
  word: string;   // lowercase word as it appears in the text, e.g. "algorithms"
  start: number;  // index of its first character in the text
  end: number;    // index just after its last character
}

/**
 * Find every word in `text` whose stem is one of the matched terms.
 * We apply the same rules as preprocess(): skip 1-letter words and stop words,
 * then stem. The term Set makes each check O(1) average.
 * Time: O(n) for n characters.
 */
export function findHits(text: string, terms: Set<string>): WordHit[] {
  const hits: WordHit[] = [];
  const wordPattern = /[a-z0-9]+/gi;
  let match: RegExpExecArray | null;

  while ((match = wordPattern.exec(text)) !== null) {
    const lower = match[0].toLowerCase();
    if (lower.length < 2 || isStopWord(lower)) continue;

    if (terms.has(stem(lower))) {
      hits.push({ word: lower, start: match.index, end: match.index + match[0].length });
    }
  }
  return hits;
}

/**
 * Build a short preview of `content`, centred on the densest cluster of hits.
 *   1. Short text: return it unchanged.
 *   2. No hits (e.g. the match was only in the title): return the beginning.
 *   3. Otherwise try a window around each hit and keep the one containing the most hits.
 * Edges are moved to word boundaries and "..." marks cut-off ends.
 * Time: O(m^2) for m hits (m is small), plus O(n) in findHits.
 */
export function buildSnippet(content: string, hits: WordHit[], maxLength = 200): string {
  if (content.length <= maxLength) return content;

  if (hits.length === 0) {
    const cut = content.lastIndexOf(" ", maxLength);
    return content.slice(0, cut > 0 ? cut : maxLength).trim() + "...";
  }

  // Find the window start that covers the most hits.
  let bestStart = 0;
  let bestCount = -1;
  for (const hit of hits) {
    const windowStart = Math.max(0, hit.start - 40); // show a little text before the hit
    const windowEnd = windowStart + maxLength;
    let count = 0;
    for (const other of hits) {
      if (other.start >= windowStart && other.end <= windowEnd) count++;
    }
    if (count > bestCount) {
      bestCount = count;
      bestStart = windowStart;
    }
  }

  // Move both edges to word boundaries so we never cut a word in half.
  let start = bestStart;
  let end = Math.min(content.length, start + maxLength);

  if (start > 0) {
    const space = content.indexOf(" ", start);
    if (space !== -1 && space < end) start = space + 1;
  }
  if (end < content.length) {
    const space = content.lastIndexOf(" ", end);
    if (space > start) end = space;
  }

  const prefix = start > 0 ? "..." : "";
  const suffix = end < content.length ? "..." : "";
  return prefix + content.slice(start, end).trim() + suffix;
}