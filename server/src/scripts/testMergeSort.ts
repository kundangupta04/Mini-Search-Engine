import { mergeSort, SortStats } from "../algorithms/MergeSort";

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

console.log("\nMerge Sort tests\n");

const ascending = (a: number, b: number) => a - b;
const descending = (a: number, b: number) => b - a;

check("ascending with duplicates", mergeSort([5, 2, 9, 1, 5, 6], ascending), [1, 2, 5, 5, 6, 9]);
check("descending", mergeSort([3, 1, 2], descending), [3, 2, 1]);
check("empty array", mergeSort([], ascending), []);
check("single item", mergeSort([42], ascending), [42]);
check("already sorted", mergeSort([1, 2, 3, 4], ascending), [1, 2, 3, 4]);
check("reverse sorted", mergeSort([5, 4, 3, 2, 1], ascending), [1, 2, 3, 4, 5]);
check("all equal", mergeSort([7, 7, 7], ascending), [7, 7, 7]);
check("negative numbers", mergeSort([0, -3, 3, -3, 2], ascending), [-3, -3, 0, 2, 3]);

// The input array must not be modified.
const original = [3, 1, 2];
mergeSort(original, ascending);
check("input array is not modified", original, [3, 1, 2]);

// STABILITY: items with equal keys keep their original order (b before d, a before c).
const people = [
  { key: 2, tag: "a" },
  { key: 1, tag: "b" },
  { key: 2, tag: "c" },
  { key: 1, tag: "d" },
];
check(
  "stable: equal keys keep their original order",
  mergeSort(people, (x, y) => x.key - y.key).map((p) => p.tag),
  ["b", "d", "a", "c"]
);

// Comparison counting. Sorted input of 8 items: 4 + 4 + 4 = 12 comparisons
// (four 1+1 merges, two 2+2 merges, one 4+4 merge, each finishing when the left side empties).
const sortedStats: SortStats = { comparisons: 0 };
mergeSort([1, 2, 3, 4, 5, 6, 7, 8], ascending, sortedStats);
check("comparison count on sorted input of 8", sortedStats.comparisons, 12);

// 1000 pseudo-random numbers (deterministic generator) must match the built-in sort.
let seed = 12345;
const nextRandom = () => {
  seed = (seed * 16807) % 2147483647; // Park-Miller generator
  return seed % 10000;
};
const big = Array.from({ length: 1000 }, nextRandom);
const bigStats: SortStats = { comparisons: 0 };
check(
  "1000 random numbers match the built-in sort",
  mergeSort(big, ascending, bigStats),
  big.slice().sort(ascending)
);
// Upper bound: n * ceil(log2 n) = 1000 * 10
check("comparisons stay within n log n", bigStats.comparisons <= 10000, true);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);