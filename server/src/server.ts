import express from "express";
import cors from "cors";
import documentRoutes from "./routes/documentRoutes";
import dsaRoutes from "./routes/dsaRoutes";
import suggestionRoutes from "./routes/suggestionRoutes";
import { getDocumentCount } from "./services/documentService";
import { getTrieStats } from "./services/trieService";
import { getIndexStats } from "./services/invertedIndexService";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Mini Search Engine server is running",
    documentsLoaded: getDocumentCount(),
    trie: getTrieStats(),
    index: getIndexStats(),
    time: new Date().toISOString(),
  });
});

app.use("/api/documents", documentRoutes);
app.use("/api/dsa", dsaRoutes);
app.use("/api/suggestions", suggestionRoutes);

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