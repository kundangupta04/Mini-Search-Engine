import rawDocuments from "../data/documents.json";
import { Document } from "../types";

/**
 * HASHMAP: id -> Document
 * Looking up a document by id is O(1) on average,
 * instead of scanning an array which would be O(n).
 */
const documentMap = new Map<number, Document>();

/**
 * Load documents from JSON, validate them, and fill the HashMap.
 * Time: O(n) for n documents, run once at startup.
 * Space: O(n) to hold the Map.
 */
function loadDocuments(): void {
  const documents = rawDocuments as Document[];

  for (const doc of documents) {
    // 1. Check that every required field exists and is the right type.
    if (
      typeof doc.id !== "number" ||
      !doc.title?.trim() ||
      !doc.category?.trim() ||
      !doc.content?.trim() ||
      !doc.source?.trim()
    ) {
      throw new Error(`Invalid document data (id: ${doc.id}). Check documents.json`);
    }

    // 2. Check that the id is unique. Map.has() is an O(1) lookup.
    if (documentMap.has(doc.id)) {
      throw new Error(`Duplicate document id found: ${doc.id}`);
    }

    // 3. Insert into the HashMap. O(1) average.
    documentMap.set(doc.id, doc);
  }
}

// Runs once when this file is first imported (i.e., at server startup).
loadDocuments();

/** Return all documents as an array. O(n). */
export function getAllDocuments(): Document[] {
  return Array.from(documentMap.values());
}

/** Return one document by id, or undefined if it doesn't exist. O(1) average. */
export function getDocumentById(id: number): Document | undefined {
  return documentMap.get(id);
}

/** Return the list of distinct categories (sorted A to Z). */
export function getCategories(): string[] {
  const categories = new Set<string>();
  for (const doc of documentMap.values()) {
    categories.add(doc.category);
  }
  return Array.from(categories).sort();
}

/** Total number of documents. O(1). */
export function getDocumentCount(): number {
  return documentMap.size;
}