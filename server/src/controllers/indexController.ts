import { Request, Response } from "express";
import { lookupWord, getIndexStats, getTopTerms } from "../services/invertedIndexService";

/**
 * GET /api/dsa/index?term=algorithms
 * Shows what the inverted index stores for a word: the normalized term,
 * and every document that contains it with frequency and positions.
 */
export function indexDemo(req: Request, res: Response): void {
  const raw = req.query.term;

  if (typeof raw !== "string" || raw.trim() === "") {
    res.status(400).json({ error: "Please provide a word, e.g. ?term=algorithms" });
    return;
  }
  if (raw.length > 50) {
    res.status(400).json({ error: "Term is too long (maximum 50 characters)." });
    return;
  }

  // Real measurement of the lookup.
  const start = performance.now();
  const result = lookupWord(raw);
  const timeMs = performance.now() - start;

  res.json({
    ...result,
    stats: getIndexStats(),
    topTerms: getTopTerms(10), // handy "try these" list for the visualizer
    timeMs: Number(timeMs.toFixed(3)),
  });
}