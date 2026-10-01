import express from "express";
import cors from "cors";
import documentRoutes from "./routes/documentRoutes";
import dsaRoutes from "./routes/dsaRoutes";
import suggestionRoutes from "./routes/suggestionRoutes";
import { getDocumentCount } from "./services/documentService";
import { getTrieStats } from "./services/trieService";

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
    time: new Date().toISOString(),
  });
});

app.use("/api/documents", documentRoutes);
app.use("/api/dsa", dsaRoutes);
app.use("/api/suggestions", suggestionRoutes);

app.listen(PORT, () => {
  const trie = getTrieStats();
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Documents loaded: ${getDocumentCount()}`);
  console.log(`Trie built: ${trie.wordCount} words, ${trie.nodeCount} nodes`);
});