import { InvertedIndex } from "../algorithms/InvertedIndex";
import { Trie } from "../algorithms/Trie";
import { SearchEngine, Candidate } from "../algorithms/Search";
import { scoreCandidate, scoreCandidates, sortByScore } from "../algorithms/Ranking";
import { SortStats } from "../algorithms/MergeSort";
import { preprocess } from "../utils/textProcessor";
import { Document } from "../types";

let passed = 0;
let failed = 0;

function check(name: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}`);
    console.log(`        expected: ${JSON.stringify(expected)}`);
    console.log(`        actual:   ${JSON.stringify(actual)}`);
  }
}

console.log("\nRanking tests\n");

// ---- Same tiny collection as the search tests -----------------------------------
const docs: Document[] = [
  { id: 1, title: "Data Structures", category: "Test",
    content: "Data structures store data. Algorithms use data structures.", source: "test" },
  { id: 2, title: "Relational Databases", category: "Test",
    content: "Databases keep data in tables. The structures of data are hidden.", source: "test" },
  { id: 3, title: "Sorting", category: "Test",
    content: "Sorting algorithms sort data. Merge sort is fast.", source: "test" },
  { id: 4, title: "Algorithmic Thinking", category: "Test",
    content: "Algorithmic ideas solve problems.", source: "test" },
];

const index = new InvertedIndex();
const trie = new Trie();
for (const doc of docs) {
  index.addDocument(doc);
  for (const token of preprocess(`${doc.title}. ${doc.content}`)) trie.insert(token.original);
}
const engine = new SearchEngine({
  index,
  expandPrefix: (prefix) => trie.getSuggestions(prefix, 20).map((s) => s.word),
});

/** Full pipeline: search -> score -> Merge Sort. */
function rank(query: string, stats?: SortStats) {
  const outcome = engine.search(query);
  return sortByScore(scoreCandidates(outcome.candidates, outcome.resolved), stats);
}
const ids = (query: string) => rank(query).map((r) => r.candidate.docId);
const scores = (query: string) => rank(query).map((r) => r.score);

// ---- "algorithms data": the worked example (26, 13, 5) --------------------------
check("'algorithms data' order", ids("algorithms data"), [1, 3, 2]);
check("'algorithms data' scores", scores("algorithms data"), [26, 13, 5]);
check("score breakdown of document 1", rank("algorithms data")[0].breakdown, {
  termFrequency: 5, keywordMatch: 6, titleMatch: 10, exactPhrase: 0, allKeywords: 5,
});
const sortStats: SortStats = { comparisons: 0 };
rank("algorithms data", sortStats);
check("Merge Sort made 2 comparisons for 3 results", sortStats.comparisons, 2);

// ---- Single word: the all-keywords bonus does NOT apply ----------------------------
check("'data' order", ids("data"), [1, 2, 3]);
check("'data' scores (17 = 4 + 3 + 10, 5 = 2 + 3, 4 = 1 + 3)", scores("data"), [17, 5, 4]);

// ---- Exact phrase ---------------------------------------------------------------------
check("phrase 'data structures' finds only doc 1", ids('"data structures"'), [1]);
check("phrase score is 46", scores('"data structures"'), [46]);
check("phrase score breakdown", rank('"data structures"')[0].breakdown, {
  termFrequency: 7, keywordMatch: 6, titleMatch: 20, exactPhrase: 8, allKeywords: 5,
});

// ---- Partial search + ties ----------------------------------------------------------------
check("'algo': title match first, ties keep id order", ids("algo"), [4, 1, 3]);
check("'algo' scores (15 = 2 + 3 + 10, then 4 and 4)", scores("algo"), [15, 4, 4]);

// ---- More keywords beats a bigger title match on one word --------------------------
check("'sort data': doc 3 matches both words", ids("sort data"), [3, 1, 2]);
check("'sort data' scores", scores("sort data"), [26, 17, 5]);

// ---- Direct scoring rules ------------------------------------------------------------------
const stuffed: Candidate = {
  docId: 9,
  termMatches: [
    { queryWord: "x", term: "x", matchType: "exact", frequency: 50, inTitle: false, positions: [] },
  ],
  phraseMatches: [],
};
check("frequency is capped at 10 (10 + 3)", scoreCandidate(stuffed, 1).score, 13);

const twoTerms: Candidate = {
  docId: 9,
  termMatches: [
    { queryWord: "algo", term: "algorithm", matchType: "prefix", frequency: 2, inTitle: false, positions: [] },
    { queryWord: "algo", term: "algorithmic", matchType: "prefix", frequency: 3, inTitle: false, positions: [] },
  ],
  phraseMatches: [],
};
check("one query word matching two terms gets ONE keyword bonus (5 + 3)", scoreCandidate(twoTerms, 1).score, 8);

check(
  "score always equals the sum of its breakdown",
  rank("algorithms data").every(
    (r) => r.score === Object.values(r.breakdown).reduce((sum, value) => sum + value, 0)
  ),
  true
);

// ---- Edge cases ---------------------------------------------------------------------------------
check("no results: nothing to rank", ids("zzzz"), []);

const manyScores = scores("data structures algorithms");
check(
  "scores never increase down the list",
  manyScores.every((score, i) => i === 0 || manyScores[i - 1] >= score),
  true
);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);