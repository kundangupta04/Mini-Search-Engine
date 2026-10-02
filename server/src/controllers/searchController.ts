import { Request, Response } from "express";
import { searchDocuments } from "../services/searchService";
import { recordSearch } from "../services/statsService";

const MAX_QUERY_LENGTH = 200;

/** GET /api/search?q=data structures   (add &track=false to skip statistics) */
export function search(req: Request, res: Response): void {
  const q = req.query.q ?? "";

  if (typeof q !== "string") {
    res.status(400).json({ error: "Query parameter q must be a single text value." });
    return;
  }
  if (q.length > MAX_QUERY_LENGTH) {
    res.status(400).json({ error: `Query is too long (maximum ${MAX_QUERY_LENGTH} characters).` });
    return;
  }

  const response = searchDocuments(q);

  // Count only searches that really ran (not empty or stop-word-only queries).
  const shouldTrack = req.query.track !== "false";
  if (shouldTrack && (response.status === "ok" || response.status === "no_results")) {
    recordSearch(q, response.timeMs, response.totalResults);
  }

  res.json(response);
}