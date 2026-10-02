import type { Server } from "http";
import type { AddressInfo } from "net";
import app from "../app";
import { getAllDocuments } from "../services/documentService";
import { getTerms, preprocess, stem } from "../utils/textProcessor";

let passed = 0;
let failed = 0;

function check(name: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}`);
    console.log(`        expected: ${JSON.stringify(expected)}`);
    console.log(`        actual:   ${JSON.stringify(actual)}`);
  }
}

// JSON coming from the API; we check its shape ourselves in the tests.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

async function main(): Promise<void> {
  console.log("\nAPI end-to-end tests (real server, real engine)\n");

  // Start the REAL Express app on any free port.
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  async function get(path: string): Promise<{ status: number; body: Json }> {
    const response = await fetch(base + path);
    return { status: response.status, body: await response.json() };
  }

  const enc = encodeURIComponent;
  const search = (q: string) => get(`/api/search?q=${enc(q)}&track=false`);
  const docIds = (body: Json): number[] => body.results.map((r: Json) => r.docId);
  const sorted = (ids: number[]) => ids.slice().sort((a, b) => a - b);

  // ---- Independent "slow but obviously correct" answers ------------------------------
  const docs = getAllDocuments();

  // docId -> set of terms in that document (a plain scan, no inverted index involved)
  const termsByDoc = new Map<number, Set<string>>();
  for (const doc of docs) {
    termsByDoc.set(doc.id, new Set(getTerms(`${doc.title}. ${doc.content}`)));
  }

  /** Documents containing ANY query term, found by scanning every document. */
  function bruteForceAny(query: string): number[] {
    const queryTerms = getTerms(query);
    return sorted(
      docs
        .filter((doc) => queryTerms.some((term) => termsByDoc.get(doc.id)!.has(term)))
        .map((doc) => doc.id)
    );
  }

  /** Documents containing the phrase (terms at consecutive positions), by scanning every document. */
  function bruteForcePhrase(phrase: string): number[] {
    const wanted = preprocess(phrase);
    const ids: number[] = [];
    for (const doc of docs) {
      let found = false;
      for (const text of [doc.title, doc.content]) {
        const tokens = preprocess(text);
        for (let i = 0; i < tokens.length && !found; i++) {
          let ok = true;
          for (let j = 0; j < wanted.length; j++) {
            const token = tokens[i + j];
            const expectedGap = wanted[j].position - wanted[0].position;
            if (
              !token ||
              token.term !== wanted[j].term ||
              token.position - tokens[i].position !== expectedGap
            ) {
              ok = false;
              break;
            }
          }
          if (ok) found = true;
        }
        if (found) break;
      }
      if (found) ids.push(doc.id);
    }
    return sorted(ids);
  }

  // The Trie's vocabulary: every original word of every document.
  const vocabulary = new Set<string>();
  for (const doc of docs) {
    for (const token of preprocess(`${doc.title}. ${doc.content}`)) vocabulary.add(token.original);
  }
  const suggest = async (q: string): Promise<string[]> =>
    (await get(`/api/suggestions?q=${enc(q)}`)).body.suggestions;

  // ================= Health ==============================================================
  const health = await get("/api/health");
  check("health: server answers", [health.status, health.body.status], [200, "ok"]);
  check("health: every document on disk is loaded", health.body.documentsLoaded, docs.length);

  // ================= Search -> ranking -> Merge Sort, through the API ====================
  const ds = await search("data structures");
  const results: Json[] = ds.body.results;
  const n = results.length;

  check("search: status ok", [ds.status, ds.body.status], [200, "ok"]);
  check("search: ranks are 1..n", results.map((r) => r.rank), results.map((_, i) => i + 1));
  check(
    "search: scores never increase down the list",
    results.every((r, i) => i === 0 || results[i - 1].score >= r.score),
    true
  );
  check("search: best match for 'data structures' is document 1", results[0].docId, 1);
  check(
    "search: every score equals the sum of its breakdown",
    results.every(
      (r) =>
        r.score ===
        Object.values(r.scoreBreakdown as Record<string, number>).reduce((sum, v) => sum + v, 0)
    ),
    true
  );
  check(
    "search: Merge Sort really ran (0 < comparisons <= n * ceil(log2 n))",
    ds.body.sort.comparisons > 0 && ds.body.sort.comparisons <= n * Math.ceil(Math.log2(n)),
    true
  );
  check("search: timing is a real number", Number.isFinite(ds.body.timeMs) && ds.body.timeMs >= 0, true);
  check(
    "search: our Merge Sort order equals the built-in stable sort",
    results
      .slice()
      .sort((a, b) => a.docId - b.docId)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.docId),
    results.map((r) => r.docId)
  );

  // ================= Inverted index vs. scanning every document ===========================
  const queries = [
    "algorithm",
    "database",
    "network",
    "sorting",
    "cache",
    "machine learning",
    "data structures algorithms",
    "operating system",
  ];
  for (const query of queries) {
    const response = await search(query);
    check(
      `index vs scan: "${query}"`,
      sorted(docIds(response.body)),
      bruteForceAny(query)
    );
  }

  // ================= Phrase search vs. scanning every document ============================
  for (const phrase of ["data structures", "machine learning", "merge sort", "hash table"]) {
    const response = await search(`"${phrase}"`);
    check(
      `phrase vs scan: "${phrase}"`,
      sorted(docIds(response.body)),
      bruteForcePhrase(phrase)
    );
  }

  // ================= Trie autocomplete vs. the vocabulary =================================
  const algWords = Array.from(vocabulary).filter((w) => w.startsWith("alg"));
  const alg = await suggest("alg");

  check(
    "autocomplete: every 'alg' suggestion starts with alg and exists in the documents",
    alg.length > 0 && alg.every((w) => w.startsWith("alg") && vocabulary.has(w)),
    true
  );
  check(
    "autocomplete: 'algorithm' and 'algorithms' are suggested",
    alg.includes("algorithm") && alg.includes("algorithms"),
    true
  );
  check("autocomplete: count matches a vocabulary scan (max 8)", alg.length, Math.min(8, algWords.length));
  check("autocomplete: case-insensitive", await suggest("ALG"), alg);

  const lastWord = await suggest("data str");
  check(
    "autocomplete: only the last word is completed",
    lastWord.length > 0 && lastWord.every((w) => w.startsWith("str")),
    true
  );
  check("autocomplete: empty input gives no suggestions", await suggest(""), []);
  check("autocomplete: unknown prefix gives no suggestions", await suggest("zzzz"), []);

  const comp = await suggest("comp");
  check(
    "autocomplete: 'comp' suggests computer and computing",
    comp.includes("computer") && comp.includes("computing"),
    true
  );

  // ================= Partial search through the API =======================================
  const algo = await search("algo");
  check(
    "partial search: 'algo' is resolved by the Trie into prefix matches",
    algo.body.interpretation.resolved.length > 0 &&
      algo.body.interpretation.resolved.every((r: Json) => r.matchType === "prefix") &&
      algo.body.interpretation.resolved.some((r: Json) => r.term === "algorithm"),
    true
  );

  // ================= Edge cases ===========================================================
  const empty = await get("/api/search?q=");
  check(
    "edge: empty query is a friendly response, not an error",
    [empty.status, empty.body.status, empty.body.totalResults, empty.body.sort.comparisons],
    [200, "empty_query", 0, 0]
  );

  check("edge: only stop words", (await search("the of and")).body.status, "no_searchable_terms");

  const special = await search("<script>alert(1)</script>");
  check(
    "edge: special characters do not crash",
    [special.status, ["ok", "no_results"].includes(special.body.status)],
    [200, true]
  );

  check(
    "edge: duplicate words give the same results as one word",
    docIds((await search("data data data")).body),
    docIds((await search("data")).body)
  );

  const large = await search("data " + Array.from({ length: 30 }, (_, i) => `term${i}`).join(" "));
  check(
    "edge: large query is truncated but still works",
    [large.status, large.body.status, large.body.interpretation.truncated],
    [200, "ok", true]
  );

  const tooLong = await get(`/api/search?q=${"a".repeat(201)}&track=false`);
  check("edge: query over 200 characters is rejected", [tooLong.status, typeof tooLong.body.error], [400, "string"]);

  check("edge: repeated q parameter is rejected", (await get("/api/search?q=a&q=b")).status, 400);

  check(
    "edge: unknown document is 404 and a non-numeric id is 400",
    [(await get("/api/documents/99999")).status, (await get("/api/documents/abc")).status],
    [404, 400]
  );

  const unknownRoute = await get("/api/nope");
  check("edge: unknown API route is a JSON 404", [unknownRoute.status, typeof unknownRoute.body.error], [404, "string"]);

  // ================= Search statistics tracking ===========================================
  await fetch(base + "/api/stats/reset", { method: "POST" });
  const stats = async (): Promise<Json> => (await get("/api/stats")).body.search;

  const s0 = await stats();
  check("stats: reset sets searches to 0", s0.totalSearches, 0);

  // Same query, different case and spacing: must count as ONE query searched twice.
  await get(`/api/search?q=${enc("Data Structures")}`);
  await get(`/api/search?q=${enc("data  structures")}`);
  const s1 = await stats();
  check("stats: two real searches are counted", s1.totalSearches, 2);
  check(
    "stats: case and spacing are normalized into one query",
    s1.topQueries[0],
    { query: "data structures", count: 2 }
  );

  await search("data"); // track=false
  await get("/api/search?q="); // empty query
  const s2 = await stats();
  check("stats: track=false is not counted", s2.totalSearches, 2);
  check("stats: an empty query is not counted", s2.totalSearches, 2);

  await get("/api/search?q=zzzz");
  const s3 = await stats();
  check(
    "stats: a no-result search is counted (3 searches, 1 with no results)",
    [s3.totalSearches, s3.zeroResultSearches],
    [3, 1]
  );

  const meanOfRecent =
    s3.recentSearches.reduce((sum: number, r: Json) => sum + r.timeMs, 0) / s3.recentSearches.length;
  check(
    "stats: the average time is the mean of the recorded times",
    Math.abs(s3.averageTimeMs - meanOfRecent) < 0.002,
    true
  );
  check(
    "stats: 'data' is the top term with 2 searches",
    s3.topTerms.some((t: Json) => t.term === "data" && t.count === 2),
    true
  );
  check("stats: recent searches are newest first", s3.recentSearches[0].query, "zzzz");

  const categoryTotal = s3.documentsPerCategory.reduce((sum: number, c: Json) => sum + c.count, 0);
  check(
    "stats: documents per category add up to all documents",
    [categoryTotal, s3.documentsPerCategory.length],
    [docs.length, new Set(docs.map((d) => d.category)).size]
  );

  // ================= Finish ================================================================
  console.log(`\n${passed} passed, ${failed} failed\n`);
  server.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});