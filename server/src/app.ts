import express from "express";
import cors from "cors";
import type { NextFunction, Request, Response } from "express";
import documentRoutes from "./routes/documentRoutes";
import dsaRoutes from "./routes/dsaRoutes";
import suggestionRoutes from "./routes/suggestionRoutes";
import searchRoutes from "./routes/searchRoutes";
import statsRoutes from "./routes/statsRoutes";
import { getDocumentCount } from "./services/documentService";
import { getTrieStats } from "./services/trieService";
import { getIndexStats } from "./services/invertedIndexService";

const app = express();

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
app.use("/api/search", searchRoutes);
app.use("/api/stats", statsRoutes);

// Any other /api/... URL: a clean JSON 404 instead of an HTML error page.
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Unknown API route." });
});

// Last resort: an unexpected crash becomes a JSON 500, and the server keeps running.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

export default app;