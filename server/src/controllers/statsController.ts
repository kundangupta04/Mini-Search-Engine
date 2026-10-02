import { Request, Response } from "express";
import { getDocumentCount } from "../services/documentService";
import { getTrieStats } from "../services/trieService";
import { getIndexStats } from "../services/invertedIndexService";
import { getSearchStats, resetSearchStats } from "../services/statsService";

/** GET /api/stats: structure sizes plus live search activity. */
export function stats(_req: Request, res: Response): void {
  res.json({
    documents: getDocumentCount(),
    trie: getTrieStats(),
    index: getIndexStats(),
    search: getSearchStats(10),
  });
}

/** POST /api/stats/reset: clear the search statistics. */
export function reset(_req: Request, res: Response): void {
  resetSearchStats();
  res.json({ ok: true });
}