import { Request, Response } from "express";
import { explainSearch } from "../services/pipelineService";

const MAX_QUERY_LENGTH = 200;

/**
 * GET /api/dsa/pipeline?q=data structures
 * Shows every stage of a search. Not counted in the search statistics.
 * An empty query is allowed: it returns status "empty_query".
 */
export function pipelineDemo(req: Request, res: Response): void {
  const q = req.query.q ?? "";

  if (typeof q !== "string") {
    res.status(400).json({ error: "Query parameter q must be a single text value." });
    return;
  }
  if (q.length > MAX_QUERY_LENGTH) {
    res.status(400).json({ error: `Query is too long (maximum ${MAX_QUERY_LENGTH} characters).` });
    return;
  }

  res.json(explainSearch(q));
}