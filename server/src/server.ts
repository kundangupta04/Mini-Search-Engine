import app from "./app";
import { getDocumentCount } from "./services/documentService";
import { getTrieStats } from "./services/trieService";
import { getIndexStats } from "./services/invertedIndexService";

const PORT = Number(process.env.PORT) || 5000;

// Locally we listen on a port. On Vercel the platform runs the exported app itself.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    const trie = getTrieStats();
    const index = getIndexStats();
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Documents loaded: ${getDocumentCount()}`);
    console.log(`Trie built: ${trie.wordCount} words, ${trie.nodeCount} nodes`);
    console.log(
      `Inverted index built: ${index.termCount} terms, ${index.totalPostings} postings in ${index.buildTimeMs} ms`
    );
  });
}

export default app;