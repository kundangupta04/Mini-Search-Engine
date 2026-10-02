import { getJson } from "./api";
import type {
  IndexDemoResponse,
  PipelineResponse,
  SortDemoResponse,
  TrieDemoResponse,
} from "../types/dsa";

export function getTrieDemo(prefix: string): Promise<TrieDemoResponse> {
  return getJson(`/api/dsa/trie?prefix=${encodeURIComponent(prefix)}`);
}

export function getIndexDemo(term: string): Promise<IndexDemoResponse> {
  return getJson(`/api/dsa/index?term=${encodeURIComponent(term)}`);
}

export function getSortDemo(numbers: string, order: "asc" | "desc"): Promise<SortDemoResponse> {
  return getJson(`/api/dsa/sort?numbers=${encodeURIComponent(numbers)}&order=${order}`);
}

export function getPipeline(query: string): Promise<PipelineResponse> {
  return getJson(`/api/dsa/pipeline?q=${encodeURIComponent(query)}`);
}