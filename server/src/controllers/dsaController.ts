import { Request, Response } from "express";
import {
  toLowerCase,
  removePunctuation,
  tokenize,
  isStopWord,
  preprocess,
  countFrequencies,
} from "../utils/textProcessor";

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