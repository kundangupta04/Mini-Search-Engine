import { Request, Response } from "express";
import { mergeSort, MergeStep, SortStats } from "../algorithms/MergeSort";

const MAX_NUMBERS = 50;

/**
 * GET /api/dsa/sort?numbers=5,2,9,1&order=asc
 * Sorts the numbers with our own Merge Sort and reports the comparisons made
 * and every merge step (for the visualizer).
 */
export function sortDemo(req: Request, res: Response): void {
  const raw = req.query.numbers;

  if (typeof raw !== "string" || raw.trim() === "") {
    res.status(400).json({ error: "Please provide numbers, e.g. ?numbers=5,2,9,1" });
    return;
  }

  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");

  if (parts.length === 0 || parts.length > MAX_NUMBERS) {
    res.status(400).json({ error: `Provide between 1 and ${MAX_NUMBERS} numbers.` });
    return;
  }

  const numbers = parts.map(Number);
  if (numbers.some((n) => !Number.isFinite(n))) {
    res.status(400).json({ error: "Every value must be a valid number." });
    return;
  }

  const order = req.query.order === "desc" ? "desc" : "asc";
  const stats: SortStats = { comparisons: 0 };
  const steps: MergeStep<number>[] = [];

  const start = performance.now();
  const sorted = mergeSort(
    numbers,
    order === "desc" ? (a, b) => b - a : (a, b) => a - b,
    stats,
    steps
  );
  const timeMs = performance.now() - start;

  res.json({
    algorithm: "Merge Sort",
    order,
    input: numbers,
    sorted,
    comparisons: stats.comparisons,
    steps,
    timeMs: Number(timeMs.toFixed(3)),
  });
}