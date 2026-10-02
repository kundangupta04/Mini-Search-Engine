/**
 * MERGE SORT, implemented manually (divide and conquer).
 *
 *   1. SPLIT the array into two halves.
 *   2. Recursively sort each half.      (an array of 0 or 1 items is already sorted)
 *   3. MERGE the two sorted halves into one sorted array.
 *
 * Time:  O(n log n) in every case (best, average, worst).
 * Space: O(n) extra memory for the merged arrays.
 * Stable: equal items keep their original relative order.
 *
 * The caller supplies a `compare` function, like the built-in sort:
 *   compare(a, b) < 0  -> a comes first
 *   compare(a, b) > 0  -> b comes first
 *   compare(a, b) = 0  -> tie (the original order is kept)
 */

export type Comparator<T> = (a: T, b: T) => number;

/** Optional counter so we can SHOW how much work the sort did. */
export interface SortStats {
  comparisons: number;
}

/**
 * One merge, recorded for the visualizer.
 * depth 0 is the final merge; larger depths happen earlier, on smaller pieces.
 */
export interface MergeStep<T> {
  depth: number;
  left: T[];
  right: T[];
  merged: T[];
}

/**
 * Returns a NEW sorted array. The input array is never modified.
 * Pass `trace` (an empty array) to have every merge recorded in the order it happened.
 * When `trace` is omitted, nothing is recorded and there is no extra cost.
 */
export function mergeSort<T>(
  items: readonly T[],
  compare: Comparator<T>,
  stats?: SortStats,
  trace?: MergeStep<T>[]
): T[] {
  return sortRecursive(items, compare, 0, stats, trace);
}

function sortRecursive<T>(
  items: readonly T[],
  compare: Comparator<T>,
  depth: number,
  stats?: SortStats,
  trace?: MergeStep<T>[]
): T[] {
  // Base case: 0 or 1 items are already sorted.
  if (items.length <= 1) return items.slice();

  // 1. Split
  const middle = Math.floor(items.length / 2);
  const left = sortRecursive(items.slice(0, middle), compare, depth + 1, stats, trace);
  const right = sortRecursive(items.slice(middle), compare, depth + 1, stats, trace);

  // 3. Merge
  const merged = merge(left, right, compare, stats);
  if (trace) trace.push({ depth, left, right, merged });
  return merged;
}

/**
 * Merge two ALREADY SORTED arrays into one sorted array.
 * Two pointers walk along the arrays; we always take the front item that
 * should come first. Time: O(left.length + right.length).
 */
function merge<T>(left: T[], right: T[], compare: Comparator<T>, stats?: SortStats): T[] {
  const merged: T[] = [];
  let i = 0; // pointer into left
  let j = 0; // pointer into right

  while (i < left.length && j < right.length) {
    if (stats) stats.comparisons++;

    // "<= 0" means: on a tie take the LEFT item first.
    // That single choice is what makes the sort stable.
    if (compare(left[i], right[j]) <= 0) {
      merged.push(left[i]);
      i++;
    } else {
      merged.push(right[j]);
      j++;
    }
  }

  // One side ran out; whatever remains on the other side is already in order.
  while (i < left.length) merged.push(left[i++]);
  while (j < right.length) merged.push(right[j++]);

  return merged;
}