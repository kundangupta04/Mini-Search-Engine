import type {
  DocumentData,
  HealthResponse,
  SearchResponse,
  SuggestionResponse,
} from "../types";

/** Fetch JSON and turn server errors ({ error: "..." }) into a readable Error. */
async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body && typeof body.error === "string") message = body.error;
    } catch {
      // the body was not JSON; keep the generic message
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export function searchApi(query: string): Promise<SearchResponse> {
  return getJson(`/api/search?q=${encodeURIComponent(query)}`);
}

export function fetchSuggestions(query: string): Promise<SuggestionResponse> {
  return getJson(`/api/suggestions?q=${encodeURIComponent(query)}`);
}

export function getDocument(id: number): Promise<{ document: DocumentData }> {
  return getJson(`/api/documents/${id}`);
}

export function getHealth(): Promise<HealthResponse> {
  return getJson("/api/health");
}