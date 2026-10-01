import { Request, Response } from "express";
import { getSuggestionsForQuery } from "../services/trieService";

/**
 * GET /api/suggestions?q=alg
 * An empty or missing query is NOT an error: it simply has no suggestions.
 */
export function suggest(req: Request, res: Response): void {
  const q = req.query.q;

  if (typeof q !== "string" || q.trim() === "") {
    res.json({ query: "", prefix: "", suggestions: [], timeMs: 0 });
    return;
  }
  if (q.length > 100) {
    res.status(400).json({ error: "Query is too long (maximum 100 characters)." });
    return;
  }

  // Real measurement of the Trie lookup, not a made-up number.
  const start = performance.now();
  const { prefix, suggestions } = getSuggestionsForQuery(q, 8);
  const timeMs = performance.now() - start;

  res.json({
    query: q,
    prefix, // the part actually completed, e.g. "str" for "data str"
    suggestions: suggestions.map((s) => s.word),
    timeMs: Number(timeMs.toFixed(3)),
  });
}