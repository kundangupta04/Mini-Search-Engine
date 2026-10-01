import { Trie } from "../algorithms/Trie";

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

console.log("\nTrie tests\n");

// Build a small Trie. The second argument is how many times the word "occurred".
const trie = new Trie();
trie.insert("algorithm", 3);
trie.insert("algorithms", 2);
trie.insert("algorithmic", 1);
trie.insert("algebra", 1);
trie.insert("data", 5);
trie.insert("database", 2);
trie.insert("computer", 1);
trie.insert("computing", 1);
trie.insert("compare", 1);

// search(): exact words only
check("search: full word", trie.search("algorithm"), true);
check("search: prefix is not a word", trie.search("algo"), false);
check("search: word not present", trie.search("algorithmz"), false);
check("search: empty string", trie.search(""), false);

// startsWith(): prefixes
check("startsWith: valid prefix", trie.startsWith("algo"), true);
check("startsWith: full word counts as prefix", trie.startsWith("data"), true);
check("startsWith: invalid prefix", trie.startsWith("xyz"), false);

// getSuggestions(): ordered by frequency, then alphabetically
check(
  "suggestions for 'alg'",
  trie.getSuggestions("alg").map((s) => s.word),
  ["algorithm", "algorithms", "algebra", "algorithmic"]
);
check(
  "suggestions respect the limit",
  trie.getSuggestions("alg", 2).map((s) => s.word),
  ["algorithm", "algorithms"]
);
check(
  "a complete word is also its own suggestion",
  trie.getSuggestions("data").map((s) => s.word),
  ["data", "database"]
);
check(
  "suggestions for 'comp' (all frequency 1, so alphabetical)",
  trie.getSuggestions("comp").map((s) => s.word),
  ["compare", "computer", "computing"]
);
check("frequency is stored", trie.getSuggestions("data", 1)[0].frequency, 5);
check("no suggestions for unknown prefix", trie.getSuggestions("zzz"), []);
check("no suggestions for empty prefix", trie.getSuggestions(""), []);

// getPath(): used by the visualizer
check(
  "path for 'alg' is found at every step",
  trie.getPath("alg").map((s) => s.found),
  [true, true, true]
);
check(
  "path stops at the first missing character",
  trie.getPath("alx").map((s) => s.found),
  [true, true, false]
);
check(
  "children after 'alg'",
  trie.getPath("alg")[2].children,
  ["e", "o"]
);

// Duplicate insert only raises frequency, it does not add a new word
trie.insert("data");
check("duplicate insert raises frequency", trie.getSuggestions("data", 1)[0].frequency, 6);

// Size: 9 distinct words, 38 nodes (shared prefixes are stored once)
check("stats", trie.getStats(), { wordCount: 9, nodeCount: 38 });

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);