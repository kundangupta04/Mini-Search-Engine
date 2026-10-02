# Mini Search Engine Using Data Structures and Algorithms

A full-stack search engine over a small computer-science knowledge base. Every core
algorithm (Trie, inverted index, ranking, Merge Sort) is implemented by hand. No search
library, no database and no paid API is used, and everything runs offline.

## Features

- Search with multi-word queries, `"exact phrases"` and partial words (`algo`)
- Autocomplete from a hand-written Trie
- Inverted index (HashMap of postings: frequency, word positions, title flag)
- Ranking with a visible score breakdown on every result
- Results sorted by a hand-written, stable Merge Sort
- "Did you mean" suggestions and friendly empty and no-result states
- DSA Dashboard (purpose and complexity of every component)
- DSA Visualizer (search pipeline, Trie walk, index lookup, Merge Sort steps)
- Live Statistics (searches performed, average time, most searched terms)
- 191 automated checks, including tests that compare the index to brute-force scans

## Tech stack

React, TypeScript, Vite, Tailwind CSS, Lucide icons, Node.js, Express and local JSON data.

## Architecture

```text
Browser (React)  --/api-->  Express routes -> controllers -> services -> algorithms
                                                                    |
                              Trie . InvertedIndex . Search . Ranking . MergeSort
```

The index and the Trie are built once at server start-up from `server/src/data/documents.json`.
Each search reuses them, so its cost depends on how many documents match, not on how many exist.

### Search pipeline

```text
Query -> Parse -> Preprocess -> Inverted Index lookup (Trie expands partial words)
      -> Candidates -> Scoring -> Merge Sort -> Results
```

## Data structures and algorithms

| Component | File | Time | Space |
|---|---|---|---|
| HashMap (`Map`) | `InvertedIndex.ts`, `documentService.ts` | O(1) average | O(n) |
| Trie | `Trie.ts` | insert / search O(L), prefix O(P) | O(total characters) |
| Inverted index | `InvertedIndex.ts` | build O(N), lookup O(1) average | O(N) |
| Text preprocessing | `textProcessor.ts` | O(n) | O(n) |
| Searching | `Search.ts` | O(q + postings touched) | O(candidates) |
| Ranking | `Ranking.ts` | O(candidates x matches) | O(candidates) |
| Merge Sort | `MergeSort.ts` | O(n log n) | O(n) |

### Ranking formula

| Rule | Points |
|---|---|
| Term frequency | +1 per occurrence (max 10 per word) |
| Keyword match | +3 per distinct query word found |
| Title match | +10 per distinct query word in the title |
| Exact phrase | +8 per quoted phrase found |
| All-keywords bonus | +5 when a 2+ word query is fully matched |

## Getting started

Requires Node.js 18 or newer.

```bash
npm run install:all
npm run dev
```

- App: http://localhost:5173
- API health check: http://localhost:5000/api/health

## Tests

```bash
npm run test:all --prefix server
```

Individual suites: `test:text`, `test:trie`, `test:index`, `test:search`, `test:sort`,
`test:rank`, `test:api`, `test:pipeline`.

## Production build

```bash
npm run build --prefix server && npm run start --prefix server
npm run build --prefix client && npm run preview --prefix client
```

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/search?q=...` | Ranked search (`&track=false` skips statistics) |
| GET | `/api/suggestions?q=...` | Trie autocomplete |
| GET | `/api/documents`, `/api/documents/:id`, `/api/documents/categories` | Documents |
| GET | `/api/stats`, POST `/api/stats/reset` | Statistics |
| GET | `/api/dsa/preprocess`, `/trie`, `/index`, `/sort`, `/pipeline` | Visualizer data |

## Project structure

```text
client/src/  components, pages, services, hooks, types, utils
server/src/  algorithms, controllers, routes, services, utils, data, scripts
```

## Limitations and future work

- The stemmer is simple and rule-based (`computer` and `computing` differ; `cache` and `caches` differ).
- Ranking weights are hand-chosen. TF-IDF or BM25 would weight rare words higher.
- Stop words inside a quoted phrase act as wildcards.
- Misspellings are handled only through prefixes, not edit distance.
- Everything is in memory: the index is rebuilt at start-up and statistics reset on restart.
- Only English letters and digits are indexed.
- The statistics reset endpoint is unauthenticated (fine for a local demo).
- Possible next steps: persistence, a min-heap for top-K, BM25 ranking, Trie deletion.