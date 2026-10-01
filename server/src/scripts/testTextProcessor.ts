import { preprocess, getTerms, countFrequencies, stem } from "../utils/textProcessor";

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

console.log("\nText processor tests\n");

// 1. The example from the project brief
check(
  "full pipeline example",
  getTerms("Algorithms are important for Computer Science!"),
  ["algorithm", "important", "computer", "science"]
);

// 2. Punctuation and symbols
check(
  "punctuation and symbols",
  getTerms("Data structures, Algorithms & Databases!"),
  ["data", "structure", "algorithm", "database"]
);

// 3. Apostrophes, hyphens, plural rules
check(
  "plural rules",
  getTerms("It's a Hash-Table: queries, libraries & classes"),
  ["hash", "table", "query", "library", "class"]
);

// 4. Different forms of one word collapse into one term
check(
  "search variants",
  Object.fromEntries(countFrequencies(getTerms("searching searched searches search"))),
  { search: 4 }
);

// 5. Doubled consonants
check("doubled consonants", getTerms("running runs mapped"), ["run", "run", "map"]);

// 6. Words that must NOT be damaged
check("protected words", getTerms("string analysis status class"), [
  "string", "analysis", "status", "class",
]);

// 7. Duplicate words and mixed case
check(
  "duplicate words",
  Object.fromEntries(countFrequencies(getTerms("data data DATA"))),
  { data: 3 }
);

// 8. Empty and punctuation-only input must not crash
check("empty string", getTerms(""), []);
check("only punctuation", getTerms("!!! ??? ..."), []);
check("only stop words", getTerms("the and of is"), []);

// 9. Positions: stop words still use up a position number
check("positions", preprocess("the history of data structures"), [
  { original: "history", term: "history", position: 1 },
  { original: "data", term: "data", position: 3 },
  { original: "structures", term: "structure", position: 4 },
]);

// 10. Short words are untouched
check("short words", [stem("sql"), stem("dns")], ["sql", "dns"]);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);