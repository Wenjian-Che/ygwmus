const DEFAULTS = {
  candidateK: 48,
  cacheMaxEntries: 256,
  cacheTtlMs: 5 * 60 * 1000,
  k1: 1.25,
  b: 0.72,
};

function normalizeText(value = "") {
  return String(value).toLowerCase().normalize("NFKC");
}

export function retrievalTokens(value = "") {
  const spans = normalizeText(value).match(/[\u4e00-\u9fff]+|[a-z0-9][a-z0-9_-]*/g) || [];
  const tokens = [];
  for (const span of spans) {
    if (/^[\u4e00-\u9fff]+$/u.test(span)) {
      if (span.length === 1) tokens.push(span);
      for (let index = 0; index < span.length - 1; index += 1) tokens.push(span.slice(index, index + 2));
    } else {
      tokens.push(span);
    }
  }
  return tokens;
}

function buildLexicalIndex(chunks = []) {
  const documentFrequency = {};
  const postings = {};
  for (const chunk of chunks) {
    const counts = new Map();
    const text = `${chunk.source_file || ""} ${(chunk.heading_path || []).join(" ")} ${chunk.content || ""}`;
    for (const token of retrievalTokens(text)) counts.set(token, (counts.get(token) || 0) + 1);
    for (const [token, count] of counts) {
      documentFrequency[token] = (documentFrequency[token] || 0) + 1;
      (postings[token] ||= []).push([chunk.id, count]);
    }
  }
  return { chunk_count: chunks.length, document_frequency: documentFrequency, postings };
}

function safeNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function createRetrievalEngine({ chunks = [], lexicalIndex = null, options = {} } = {}) {
  const settings = { ...DEFAULTS, ...options };
  const index = lexicalIndex?.postings && lexicalIndex?.document_frequency
    ? lexicalIndex
    : buildLexicalIndex(chunks);
  const chunkById = new Map(chunks.map((chunk) => [String(chunk.id), chunk]));
  const averageLength = chunks.length
    ? chunks.reduce((sum, chunk) => sum + Math.max(1, Number(chunk.char_count || String(chunk.content || "").length)), 0) / chunks.length
    : 1;
  const cache = new Map();
  const stats = {
    queries: 0,
    cache_hits: 0,
    total_ms: 0,
    last_ms: 0,
    last_candidates: 0,
  };

  function pruneCache(now) {
    for (const [key, entry] of cache) if (entry.expires_at <= now) cache.delete(key);
    while (cache.size > settings.cacheMaxEntries) cache.delete(cache.keys().next().value);
  }

  function search(query, searchOptions = {}) {
    const startedAt = performance.now();
    const candidateK = Math.max(1, Math.min(200, safeNumber(searchOptions.candidateK, settings.candidateK)));
    const uniqueTokens = [...new Set(retrievalTokens(query))];
    const usefulTokens = uniqueTokens.filter((token) => token.length > 1 || /^[a-z0-9]/.test(token));
    const queryTokens = usefulTokens.length ? usefulTokens : uniqueTokens;
    const cacheKey = `${candidateK}:${queryTokens.slice().sort().join("|")}`;
    const now = Date.now();
    const cached = cache.get(cacheKey);
    stats.queries += 1;
    if (cached && cached.expires_at > now) {
      stats.cache_hits += 1;
      stats.last_ms = Number((performance.now() - startedAt).toFixed(3));
      stats.total_ms += stats.last_ms;
      stats.last_candidates = cached.results.length;
      return { results: cached.results, meta: { cached: true, elapsed_ms: stats.last_ms, candidate_count: cached.results.length } };
    }

    const scores = new Map();
    const documentCount = Math.max(1, Number(index.chunk_count || chunks.length));
    for (const token of queryTokens) {
      const rows = index.postings?.[token] || [];
      const documentFrequency = Math.max(0, Number(index.document_frequency?.[token] || rows.length));
      if (!documentFrequency) continue;
      const idf = Math.log(1 + (documentCount - documentFrequency + 0.5) / (documentFrequency + 0.5));
      for (const row of rows) {
        const chunkId = String(row[0]);
        const chunk = chunkById.get(chunkId);
        if (!chunk) continue;
        const frequency = Math.max(0, Number(row[1] || 0));
        const length = Math.max(1, Number(chunk.char_count || String(chunk.content || "").length));
        const denominator = frequency + settings.k1 * (1 - settings.b + settings.b * (length / averageLength));
        const score = idf * ((frequency * (settings.k1 + 1)) / Math.max(0.001, denominator));
        scores.set(chunkId, (scores.get(chunkId) || 0) + score);
      }
    }

    const results = [...scores.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, candidateK)
      .map(([chunkId, score], rank) => ({ chunk: chunkById.get(chunkId), score, rank: rank + 1 }));
    const elapsed = Number((performance.now() - startedAt).toFixed(3));
    stats.last_ms = elapsed;
    stats.total_ms += elapsed;
    stats.last_candidates = results.length;
    cache.set(cacheKey, { results, expires_at: now + settings.cacheTtlMs });
    pruneCache(now);
    return { results, meta: { cached: false, elapsed_ms: elapsed, candidate_count: results.length } };
  }

  function diagnostics() {
    return {
      engine: "bm25+domain-rerank",
      documents: chunks.length,
      cache_entries: cache.size,
      queries: stats.queries,
      cache_hits: stats.cache_hits,
      cache_hit_rate: stats.queries ? Number((stats.cache_hits / stats.queries).toFixed(4)) : 0,
      average_ms: stats.queries ? Number((stats.total_ms / stats.queries).toFixed(3)) : 0,
      last_ms: stats.last_ms,
      last_candidates: stats.last_candidates,
    };
  }

  return { search, diagnostics, clear: () => cache.clear() };
}

