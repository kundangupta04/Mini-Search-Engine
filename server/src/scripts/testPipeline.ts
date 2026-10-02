import { mergeSort, MergeStep } from "../algorithms/MergeSort";
import { explainSearch } from "../services/pipelineService";
import { searchDocuments } from "../services/searchService";

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

console.log("\nPipeline and Merge Sort trace tests\n");

const ascending = (a: number, b: number) => a - b;

// ---- Merge Sort trace -------------------------------------------------------
const trace: MergeStep<number>[] = [];
const traced = mergeSort([5, 2, 9, 1], ascending, undefined, trace);

check("trace: merges happen in this order", trace.map((s) => s.merged), [[2, 5], [1, 9], [1, 2, 5, 9]]);
check("trace: depths are 1, 1, then 0 for the final merge", trace.map((s) => s.depth), [1, 1, 0]);

const sixTrace: MergeStep<number>[] = [];
mergeSort([5, 2, 9, 1, 7, 3], ascending, undefined, sixTrace);
check("trace: n items need exactly n - 1 merges (6 items, 5 merges)", sixTrace.length, 5);

check("trace: recording does not change the result", traced, mergeSort([5, 2, 9, 1], ascending));

// ---- Pipeline vs the real search -----------------------------------------------
const query = "data structures";
const explained = explainSearch(query);
const real = searchDocuments(query);

check(
  "pipeline: 'after sort' order equals the real search order",
  explained.afterSort.map((item) => item.docId),
  real.results.map((result) => result.docId)
);

const beforeIds = explained.beforeSort.map((item) => item.docId);
check(
  "pipeline: 'before sort' is in ascending document-id order",
  beforeIds.every((id, i) => i === 0 || beforeIds[i - 1] < id),
  true
);

check(
  "pipeline: same number of Merge Sort comparisons as the real search",
  explained.sort.comparisons,
  real.sort.comparisons
);

check(
  "pipeline: candidates - 1 merge steps",
  explained.mergeSteps.length,
  explained.beforeSort.length - 1
);

check(
  "pipeline: the final merge equals the sorted list",
  explained.mergeSteps[explained.mergeSteps.length - 1].merged.map((item) => item.score),
  explained.afterSort.map((item) => item.score)
);

// ---- Edge cases and text stages --------------------------------------------------
const empty = explainSearch("");
check(
  "pipeline: empty query has no candidates and no merges",
  [empty.status, empty.beforeSort.length, empty.mergeSteps.length],
  ["empty_query", 0, 0]
);

const stages = explainSearch("Algorithms are Important!").stages;
check("pipeline: text stages", { afterStopWords: stages.afterStopWords, terms: stages.terms }, {
  afterStopWords: ["algorithms", "important"],
  terms: ["algorithm", "important"],
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);