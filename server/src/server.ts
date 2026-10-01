import express from "express";
import cors from "cors";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Middleware: runs on every request before our routes.
app.use(cors());          // allow the browser to call this API
app.use(express.json());  // parse JSON request bodies

// Health-check route: lets us confirm the server is alive.
// Later this will also report how many documents are indexed.
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Mini Search Engine server is running",
    time: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});