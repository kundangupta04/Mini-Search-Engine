import { Request, Response } from "express";
import { searchDocuments } from "../services/searchService";

const MAX_QUERY_LENGTH = 200;

/** GET /api/search?q=data structures */
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

  res.json(searchDocuments(q));
}