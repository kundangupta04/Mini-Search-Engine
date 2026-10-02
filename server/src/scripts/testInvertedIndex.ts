import { InvertedIndex } from "../algorithms/InvertedIndex";
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

console.log("\nInverted Index tests\n");

const docs: Document[] = [
  {
    id: 1,
    title: "Data Structures",
    category: "Test",
    content: "Data structures store data. Algorithms use data structures.",
    source: "test",
  },
  {
    id: 2,
    title: "Relational Databases",
    category: "Test",
    content: "Databases keep data in tables. The structures of data are hidden.",
    source: "test",
  },
  {
    id: 3,
    title: "Sorting",
    category: "Test",
    content: "Sorting algorithms sort data. Merge sort is fast.",
    source: "test",
  },
];

const index = new InvertedIndex();
docs.forEach((doc) => index.addDocument(doc));

// --- Lookups ---
check("'data' is in documents 1, 2, 3", index.getPostings("data").map((p) => p.docId), [1, 2, 3]);
check("document frequency of 'data'", index.getDocumentFrequency("data"), 3);
check("document frequency of 'algorithm'", index.getDocumentFrequency("algorithm"), 2);
check("document frequency of unknown term", index.getDocumentFrequency("zzz"), 0);

// --- Posting details (key order matters for this comparison) ---
check("posting: 'data' in doc 1", index.getPosting("data", 1), {
  docId: 1, frequency: 4, positions: [0, 3, 6, 9], inTitle: true,
});
check("posting: 'data' in doc 2", index.getPosting("data", 2), {
  docId: 2, frequency: 2, positions: [5, 11], inTitle: false,
});
check("posting: 'sort' in doc 3 (stemmed from 'sorting')", index.getPosting("sort", 3), {
  docId: 3, frequency: 4, positions: [0, 2, 4, 7], inTitle: true,
});

check("hasTerm: stemmed term exists", index.hasTerm("database"), true);
check("hasTerm: unstemmed form is NOT in the index", index.hasTerm("databases"), false);
check("getPosting for a document without the term", index.getPosting("data", 99), undefined);

// --- Phrase search ---
// Doc 1 matches 3 times. Doc 2 has "data" and "structures" but NOT adjacent, so it must not match.
check(
  "phrase 'data structures'",
  Object.fromEntries(index.searchPhrase(preprocess("data structures"))),
  { 1: 3 }
);
check("phrase in the wrong order", Object.fromEntries(index.searchPhrase(preprocess("structures data"))), {});
check("phrase with a word not in the index", Object.fromEntries(index.searchPhrase(preprocess("data banana"))), {});
check("single-word phrase", Object.fromEntries(index.searchPhrase(preprocess("sort"))), { 3: 4 });
check("empty phrase", Object.fromEntries(index.searchPhrase([])), {});

// --- Statistics ---
check("top 3 terms by document frequency", index.getTopTerms(3).map((t) => t.term), [
  "data", "algorithm", "structure",
]);
check("stats before removal", index.getStats(), {
  documentCount: 3, termCount: 13, totalPostings: 17, totalTokens: 27, averageDocLength: 9,
});

// --- Adding a duplicate id must fail loudly ---
let threw = false;
try {
  index.addDocument(docs[0]);
} catch {
  threw = true;
}
check("duplicate document id is rejected", threw, true);

// --- Removal (HashMap deletion) ---
check("removeDocument returns true", index.removeDocument(2), true);
check("'data' is now only in documents 1 and 3", index.getPostings("data").map((p) => p.docId), [1, 3]);
check("terms that only doc 2 had are gone", [index.hasTerm("relational"), index.hasTerm("database")], [false, false]);
check("stats after removal", index.getStats(), {
  documentCount: 2, termCount: 8, totalPostings: 10, totalTokens: 18, averageDocLength: 9,
});
check("removing an unknown document returns false", index.removeDocument(99), false);

// --- A document made only of stop words must not crash ---
index.addDocument({ id: 4, title: "The", category: "Test", content: "of and the", source: "test" });
check("stop-word-only document adds no terms", index.getStats().termCount, 8);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);