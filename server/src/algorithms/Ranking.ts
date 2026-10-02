import { Candidate, ResolvedTerm } from "./Search";
import { mergeSort, SortStats } from "./MergeSort";

/**
 * THE SCORING WEIGHTS: all in one place so they are easy to explain and tune.
 */
export const WEIGHTS = {
  termFrequency: 1,        // points per occurrence of a matched word
  maxFrequencyPerTerm: 10, // cap per term, so repeating a word 50 times cannot dominate
  keywordMatch: 3,         // per distinct query word found in the document
  titleMatch: 10,          // per distinct query word found in the title
  exactPhrase: 8,          // per quoted phrase found in the document
  allKeywords: 5,          // bonus when a 2+ word query is fully matched
} as const;

/** How the score was made: shown in the UI so the ranking is explainable. */
export interface ScoreBreakdown {
  termFrequency: number;
  keywordMatch: number;
  titleMatch: number;
  exactPhrase: number;
  allKeywords: number;
}

export interface ScoredCandidate {
  candidate: Candidate;
  score: number;
  breakdown: ScoreBreakdown;
}

/**
 * Score ONE candidate document.
 * `totalQueryWords` = how many distinct query words the search resolved.
 * Time: O(m) for m term matches of this document (m <= number of resolved terms).
 */
export function scoreCandidate(candidate: Candidate, totalQueryWords: number): ScoredCandidate {
  let termFrequency = 0;
  const matchedWords = new Set<string>(); // HashSet: distinct query words found in the document
  const titleWords = new Set<string>();   // HashSet: distinct query words found in the title

  for (const match of candidate.termMatches) {
    const counted = Math.min(match.frequency, WEIGHTS.maxFrequencyPerTerm);
    termFrequency += counted * WEIGHTS.termFrequency;

    matchedWords.add(match.queryWord);
    if (match.inTitle) titleWords.add(match.queryWord);
  }

  const keywordMatch = matchedWords.size * WEIGHTS.keywordMatch;
  const titleMatch = titleWords.size * WEIGHTS.titleMatch;
  const exactPhrase = candidate.phraseMatches.length * WEIGHTS.exactPhrase;
  const allKeywords =
    totalQueryWords >= 2 && matchedWords.size >= totalQueryWords ? WEIGHTS.allKeywords : 0;

  const breakdown: ScoreBreakdown = {
    termFrequency,
    keywordMatch,
    titleMatch,
    exactPhrase,
    allKeywords,
  };
  const score = termFrequency + keywordMatch + titleMatch + exactPhrase + allKeywords;

  return { candidate, score, breakdown };
}

/**
 * Score every candidate. The result is still UNSORTED (document-id order).
 * Time: O(c * m) for c candidates.
 */
export function scoreCandidates(candidates: Candidate[], resolved: ResolvedTerm[]): ScoredCandidate[] {
  // Distinct query words (HashSet): "algo" expanding into 2 terms is still ONE query word.
  const totalQueryWords = new Set(resolved.map((r) => r.queryWord)).size;
  return candidates.map((candidate) => scoreCandidate(candidate, totalQueryWords));
}

/**
 * Sort by score, highest first, using OUR Merge Sort.
 * Because Merge Sort is stable and candidates arrive in document-id order,
 * documents with equal scores stay in id order.
 * Time: O(c log c). Space: O(c).
 */
export function sortByScore(scored: ScoredCandidate[], stats?: SortStats): ScoredCandidate[] {
  return mergeSort(scored, (a, b) => b.score - a.score, stats);
}

/** Convenience: score, then sort. */
export function rankCandidates(
  candidates: Candidate[],
  resolved: ResolvedTerm[],
  stats?: SortStats
): ScoredCandidate[] {
  return sortByScore(scoreCandidates(candidates, resolved), stats);
}