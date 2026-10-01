import { Request, Response } from "express";
import {
  getAllDocuments,
  getDocumentById,
  getCategories,
} from "../services/documentService";

/** GET /api/documents  (optional: ?category=Algorithms) */
export function listDocuments(req: Request, res: Response): void {
  const category = req.query.category;
  let documents = getAllDocuments();

  if (typeof category === "string" && category.trim() !== "") {
    documents = documents.filter((doc) => doc.category === category);
  }

  res.json({ count: documents.length, documents });
}

/** GET /api/documents/categories */
export function listCategories(_req: Request, res: Response): void {
  res.json({ categories: getCategories() });
}

/** GET /api/documents/:id */
export function getDocument(req: Request, res: Response): void {
  const id = Number(req.params.id);

  // Number("abc") is NaN, so reject anything that isn't a whole number.
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Document id must be a number." });
    return;
  }

  const document = getDocumentById(id); // HashMap lookup, O(1) average
  if (!document) {
    res.status(404).json({ error: `Document ${id} not found.` });
    return;
  }

  res.json({ document });
}