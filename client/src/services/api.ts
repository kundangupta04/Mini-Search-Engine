import type {
  DocumentData,
  HealthResponse,
  SearchResponse,
  StatsResponse,
  SuggestionResponse,
} from "../types";


const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

/** Fetch JSON and turn server errors ({ error: "..." }) into a readable Error. */
export async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(API_BASE + url); 

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

/**
 * Run a search. Pass { track: false } when the search is only a background lookup
 * (for example the document page fetching a score), so it is not counted in the statistics.
 */
export function searchApi(
  query: string,
  options: { track?: boolean } = {}
): Promise<SearchResponse> {
  const trackPart = options.track === false ? "&track=false" : "";
  return getJson(`/api/search?q=${encodeURIComponent(query)}${trackPart}`);
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

export function getStats(): Promise<StatsResponse> {
  return getJson("/api/stats");
}

export async function resetStats(): Promise<void> {
  const response = await fetch(API_BASE + "/api/stats/reset", { method: "POST" });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
}