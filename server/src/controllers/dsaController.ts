import { Request, Response } from "express";
import {
  toLowerCase,
  removePunctuation,
  tokenize,
  isStopWord,
  preprocess,
  countFrequencies,
} from "../utils/textProcessor";
import {
  extractPrefix,
  getTrieTraversal,
  getTrieStats,
} from "../services/trieService";

/**
 * GET /api/dsa/preprocess?text=...
 * Runs the pipeline step by step and returns the output of every stage.
 */
export function preprocessDemo(req: Request, res: Response): void {
  const text = req.query.text;

  if (typeof text !== "string" || text.trim() === "") {
    res.status(400).json({ error: "Please provide some text, e.g. ?text=Hello World" });
    return;
  }
  if (text.length > 5000) {
    res.status(400).json({ error: "Text is too long (maximum 5000 characters)." });
    return;
  }

  const lowercased = toLowerCase(text);
  const withoutPunctuation = removePunctuation(lowercased);
  const tokens = tokenize(withoutPunctuation);
  const afterStopWords = tokens.filter((t) => t.length >= 2 && !isStopWord(t));
  const processed = preprocess(text);
  const terms = processed.map((t) => t.term);

  res.json({
    original: text,
    lowercased,
    withoutPunctuation,
    tokens,
    afterStopWords,
    processed, // original + stemmed term + position
    terms,
    frequencies: Object.fromEntries(countFrequencies(terms)),
  });
}

/**
 * GET /api/dsa/trie?prefix=alg
 * Shows how the Trie walks the prefix, one character per step,
 * plus the suggestions found below it.
 */
export function trieDemo(req: Request, res: Response): void {
  const raw = req.query.prefix;

  if (typeof raw !== "string" || raw.length > 50) {
    res.status(400).json({ error: "Please provide a prefix, e.g. ?prefix=alg (max 50 characters)." });
    return;
  }

  const prefix = extractPrefix(raw);
  if (prefix === "") {
    res.status(400).json({ error: "Prefix must contain at least one letter or digit." });
    return;
  }

  const start = performance.now();
  const traversal = getTrieTraversal(prefix, 8);
  const timeMs = performance.now() - start;

  res.json({
    prefix,
    ...traversal,
    stats: getTrieStats(),
    timeMs: Number(timeMs.toFixed(3)),
  });
}