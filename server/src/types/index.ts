/**
 * One article in our knowledge base.
 * Every document in documents.json must have exactly these fields.
 */
export interface Document {
  id: number;        // unique number, used as the key in our HashMap
  title: string;     // article title (title matches get a ranking bonus later)
  category: string;  // one of the 12 CS topics
  content: string;   // full article text (this is what we index)
  source: string;    // where the article comes from
}

/**
 * One processed word from a text.
 * Produced by the text processor, used by the Trie and the Inverted Index.
 */
export interface ProcessedToken {
  original: string; // lowercase word before stemming, e.g. "algorithms" (for the Trie)
  term: string;     // normalized word after stemming, e.g. "algorithm" (for the index)
  position: number; // index in the original token list (for phrase search)
}