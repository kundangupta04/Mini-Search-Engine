import { InvertedIndex } from "../algorithms/InvertedIndex";
import { Trie } from "../algorithms/Trie";
import { SearchEngine } from "../algorithms/Search";
import { preprocess } from "../utils/textProcessor";
import { findHits, buildSnippet } from "../utils/snippet";
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

console.log("\nSearch engine tests\n");

// ---- Tiny hand-made collection -------------------------------------------
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

const ids = (query: string) => engine.search(query).candidates.map((c) => c.docId);

// ---- Basic and multi-word -------------------------------------------------
check("single word", ids("data"), [1, 2, 3]);
check("single word is an exact match", engine.search("data").resolved.map((r) => r.matchType), ["exact"]);
check("plural query finds singular/plural forms", ids("structures"), [1, 2]);
check("multi-word search is OR", ids("algorithms database"), [1, 2, 3]);
check("three-word search", ids("data structures algorithms"), [1, 2, 3]);
check(
  "terms matched per document (doc1: 3, doc2: 2, doc3: 2)",
  engine.search("data structures algorithms").candidates.map((c) => c.termMatches.length),
  [3, 2, 2]
);
check("duplicate query words", ids("data data DATA"), [1, 2, 3]);
check("duplicate words collapse to one", engine.search("data data DATA").query.words.length, 1);

// ---- Phrases --------------------------------------------------------------
check("exact phrase", ids('"data structures"'), [1]);
check(
  "phrase occurrence count",
  engine.search('"data structures"').candidates[0].phraseMatches,
  [{ phrase: "data structures", count: 3 }]
);
check("phrase in the wrong order", engine.search('"structures data"').status, "no_results");
check("phrase plus a free word keeps the phrase filter", ids('"data structures" sort'), [1]);
check(
  "phrase words are recorded as matched terms",
  engine.search('"data structures" sort').candidates[0].termMatches.length,
  2
);
check("two phrases must both match", ids('"data structures" "algorithms use"'), [1]);
check("second phrase fails, so no results", engine.search('"data structures" "sort data"').status, "no_results");
check(
  "stop word inside a phrase acts as a wildcard (doc 1 matches via 'structures store data')",
  ids('"structures of data"'),
  [1, 2]
);
check("curly quotes work", ids("\u201Cdata structures\u201D"), [1]);
check("unbalanced quote is ignored", ids('"data structures'), [1, 2, 3]);
check("unbalanced quote makes no phrase", engine.search('"data structures').query.phrases.length, 0);

// ---- Partial search (Trie) ------------------------------------------------
check("partial word 'algo'", ids("algo"), [1, 3, 4]);
check(
  "partial matches are marked as prefix",
  Array.from(new Set(engine.search("algo").resolved.map((r) => r.matchType))),
  ["prefix"]
);
check(
  "partial 'algo' expands to two index terms",
  engine.search("algo").resolved.map((r) => r.term).sort(),
  ["algorithm", "algorithmic"]
);
check("two partial words", ids("algo struct"), [1, 2, 3, 4]);

// ---- No results, empty, edge cases ------------------------------------------
check("unknown word: no results", engine.search("zzzz").status, "no_results");
check("unknown word is reported", engine.search("zzzz").unmatchedWords, ["zzzz"]);
check(
  "typo gives related terms from the Trie",
  engine.search("algoritm").relatedTerms.sort(),
  ["algorithmic", "algorithms"]
);
check("no related terms when there are results", engine.search("data").relatedTerms, []);
check("empty query", engine.search("").status, "empty_query");
check("blank query", engine.search("   ").status, "empty_query");
check("only stop words", engine.search("the of and").status, "no_searchable_terms");
check("only punctuation", engine.search("!!! ???").status, "no_searchable_terms");
check("special characters do not crash", ids("data; <script>alert(1)</script>"), [1, 2, 3]);

const longQuery = "data " + Array.from({ length: 30 }, (_, i) => `term${i}`).join(" ");
check("large query is flagged as truncated", engine.search(longQuery).query.truncated, true);
check("large query is capped at 10 words", engine.search(longQuery).query.words.length, 10);
check("large query still searches", ids(longQuery), [1, 2, 3]);

// ---- Snippets ---------------------------------------------------------------
check(
  "findHits matches by stem",
  findHits("Algorithms use data structures", new Set(["algorithm"])).map((h) => h.word),
  ["algorithms"]
);
check("findHits skips stop words and reports positions", findHits("The data", new Set(["data"])), [
  { word: "data", start: 4, end: 8 },
]);
check("short text is returned unchanged", buildSnippet("Short text.", []), "Short text.");

const filler = "word ".repeat(100);
const longText = filler + "target " + filler;
const snippet = buildSnippet(longText, findHits(longText, new Set(["target"])));
check("long snippet contains the match", snippet.includes("target"), true);
check("long snippet starts with ...", snippet.startsWith("..."), true);
check("long snippet ends with ...", snippet.endsWith("..."), true);
check("long snippet is short", snippet.length <= 210, true);
check("snippet without hits shows the beginning", buildSnippet(filler, []).endsWith("..."), true);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);