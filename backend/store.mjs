import fs from "node:fs";
import path from "node:path";

export async function createStore(backendDir) {
  let DatabaseSync;
  try {
    ({ DatabaseSync } = await import("node:sqlite"));
  } catch {
    return createJsonFallback();
  }

  const dbPath = path.join(backendDir, "yingge.sqlite");
  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps (
      app_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS review_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id TEXT NOT NULL,
      status TEXT NOT NULL,
      review_note TEXT,
      reviewed_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS dynamic_items (
      candidate_id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      published_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS usage_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      status INTEGER NOT NULL,
      latency_ms INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS unanswered_questions (
      app_id TEXT NOT NULL,
      question TEXT NOT NULL,
      intent TEXT NOT NULL,
      quality TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'open',
      first_seen TEXT NOT NULL,
      last_seen TEXT NOT NULL,
      PRIMARY KEY (app_id, question)
    );
    CREATE TABLE IF NOT EXISTS knowledge_tasks (
      task_id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      question TEXT NOT NULL,
      intent TEXT NOT NULL,
      quality TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS knowledge_revisions (
      revision_id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      task_ids TEXT NOT NULL,
      backup_path TEXT NOT NULL,
      status TEXT NOT NULL,
      chunk_count INTEGER,
      created_at TEXT NOT NULL,
      note TEXT
    );
    CREATE TABLE IF NOT EXISTS chat_interactions (
      message_id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      intent TEXT NOT NULL,
      quality TEXT NOT NULL,
      citation_count INTEGER NOT NULL DEFAULT 0,
      citation_files TEXT,
      status TEXT NOT NULL DEFAULT 'observed',
      rating TEXT,
      feedback_reasons TEXT,
      feedback_note TEXT,
      created_at TEXT NOT NULL,
      feedback_at TEXT,
      reviewed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS evidence_audits (
      message_id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  function ensureColumn(table, name, type) {
    const exists = db.prepare(`PRAGMA table_info(${table})`).all().some((column) => column.name === name);
    if (!exists) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
  }
  for (const [name, type] of [["model", "TEXT"], ["intent", "TEXT"], ["evidence_quality", "TEXT"], ["retrieval_ms", "REAL"], ["citation_integrity", "INTEGER"]]) {
    ensureColumn("usage_events", name, type);
  }
  for (const [name, type] of [["model", "TEXT"], ["retrieval_ms", "REAL"], ["citation_integrity", "INTEGER"]]) {
    ensureColumn("chat_interactions", name, type);
  }

  const countApps = db.prepare("SELECT COUNT(*) AS count FROM apps").get().count;
  if (!countApps) {
    const appsPath = path.join(backendDir, "apps.json");
    if (fs.existsSync(appsPath)) {
      const seed = JSON.parse(fs.readFileSync(appsPath, "utf8"));
      for (const app of seed) upsertApp(app);
    }
  }
  const countDynamic = db.prepare("SELECT COUNT(*) AS count FROM dynamic_items").get().count;
  if (!countDynamic) {
    const dynamicPath = path.join(backendDir, "..", "automation", "dynamic.jsonl");
    if (fs.existsSync(dynamicPath)) {
      for (const line of fs.readFileSync(dynamicPath, "utf8").split(/\r?\n/).filter(Boolean)) {
        try { upsertDynamic(JSON.parse(line)); } catch (_) {}
      }
    }
  }

  function listApps() {
    return db.prepare("SELECT app_id, name, enabled FROM apps ORDER BY app_id").all().map((app) => ({ ...app, enabled: Boolean(app.enabled) }));
  }
  function upsertApp(app) {
    const now = new Date().toISOString();
    db.prepare("INSERT INTO apps (app_id, name, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(app_id) DO UPDATE SET name=excluded.name, enabled=excluded.enabled, updated_at=excluded.updated_at").run(app.app_id, app.name || app.app_id, app.enabled === false ? 0 : 1, now, now);
  }
  function recordReview(item) {
    db.prepare("INSERT INTO review_events (candidate_id, status, review_note, reviewed_at) VALUES (?, ?, ?, ?)").run(item.candidate_id, item.status, item.review_note || "", item.reviewed_at || new Date().toISOString());
  }
  function upsertDynamic(item) {
    db.prepare("INSERT INTO dynamic_items (candidate_id, payload, published_at) VALUES (?, ?, ?) ON CONFLICT(candidate_id) DO UPDATE SET payload=excluded.payload, published_at=excluded.published_at").run(item.candidate_id, JSON.stringify(item), item.published_to_dynamic_at || new Date().toISOString());
  }
  function listDynamic() {
    return db.prepare("SELECT payload FROM dynamic_items").all().flatMap((row) => { try { return [JSON.parse(row.payload)]; } catch { return []; } });
  }
  function recordUsage(event) {
    db.prepare("INSERT INTO usage_events (app_id, endpoint, status, latency_ms, model, intent, evidence_quality, retrieval_ms, citation_integrity, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(event.app_id || "yingge-h5", event.endpoint, event.status, event.latency_ms, event.model || null, event.intent || null, event.evidence_quality || null, Number.isFinite(Number(event.retrieval_ms)) ? Number(event.retrieval_ms) : null, event.citation_integrity === undefined ? null : (event.citation_integrity ? 1 : 0), event.created_at || new Date().toISOString());
  }
  function recordInteraction(event) {
    const quality = String(event.quality || "insufficient");
    const status = quality === "supported" ? "observed" : "needs_review";
    db.prepare("INSERT INTO chat_interactions (message_id, app_id, question, answer, intent, quality, citation_count, citation_files, model, retrieval_ms, citation_integrity, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(message_id) DO UPDATE SET answer=excluded.answer, intent=excluded.intent, quality=excluded.quality, citation_count=excluded.citation_count, citation_files=excluded.citation_files, model=excluded.model, retrieval_ms=excluded.retrieval_ms, citation_integrity=excluded.citation_integrity, status=CASE WHEN chat_interactions.rating='down' THEN 'needs_review' ELSE excluded.status END")
      .run(String(event.message_id), event.app_id || "yingge-h5", String(event.question || "").slice(0, 8000), String(event.answer || "").slice(0, 30000), event.intent || "general", quality, Number(event.citation_count || 0), JSON.stringify(Array.isArray(event.citation_files) ? event.citation_files : []), event.model || null, Number.isFinite(Number(event.retrieval_ms)) ? Number(event.retrieval_ms) : null, event.citation_integrity === undefined ? null : (event.citation_integrity ? 1 : 0), status, event.created_at || new Date().toISOString());
  }
  function recordFeedback(event) {
    const rating = event.rating === "up" ? "up" : (event.rating === "down" ? "down" : null);
    if (!rating) return false;
    const reasons = JSON.stringify(Array.isArray(event.reasons) ? event.reasons.map(String).slice(0, 6) : []);
    const status = rating === "down" ? "needs_review" : "accepted";
    const result = db.prepare("UPDATE chat_interactions SET rating = ?, feedback_reasons = ?, feedback_note = ?, feedback_at = ?, status = ? WHERE message_id = ?")
      .run(rating, reasons, String(event.note || "").slice(0, 1000), event.feedback_at || new Date().toISOString(), status, String(event.message_id || ""));
    return Number(result.changes || 0) > 0;
  }
  function listInteractions(status = "review") {
    const select = "SELECT message_id, app_id, question, answer, intent, quality, citation_count, citation_files, model, retrieval_ms, citation_integrity, status, rating, feedback_reasons, feedback_note, created_at, feedback_at, reviewed_at FROM chat_interactions";
    let rows;
    if (status === "all") rows = db.prepare(`${select} ORDER BY created_at DESC LIMIT 300`).all();
    else if (status === "golden") rows = db.prepare(`${select} WHERE status = 'golden' ORDER BY reviewed_at DESC LIMIT 300`).all();
    else rows = db.prepare(`${select} WHERE status = 'needs_review' OR rating = 'down' OR quality != 'supported' ORDER BY CASE WHEN rating='down' THEN 0 ELSE 1 END, created_at DESC LIMIT 300`).all();
    return rows.map((row) => {
      let feedbackReasons = [];
      let citationFiles = [];
      try { feedbackReasons = JSON.parse(row.feedback_reasons || "[]"); } catch (_) {}
      try { citationFiles = JSON.parse(row.citation_files || "[]"); } catch (_) {}
      return { ...row, feedback_reasons: feedbackReasons, citation_files: citationFiles };
    });
  }
  function updateInteractionStatus(event) {
    const allowed = new Set(["observed", "needs_review", "accepted", "resolved", "golden"]);
    const status = allowed.has(event.status) ? event.status : "resolved";
    const result = db.prepare("UPDATE chat_interactions SET status = ?, reviewed_at = ? WHERE message_id = ?")
      .run(status, event.reviewed_at || new Date().toISOString(), String(event.message_id || ""));
    return Number(result.changes || 0) > 0;
  }
  function deleteInteraction(event) {
    const result = db.prepare("DELETE FROM chat_interactions WHERE message_id = ?").run(String(event.message_id || ""));
    return Number(result.changes || 0) > 0;
  }
  function saveEvidenceAudit(audit) {
    const messageId = String(audit?.message_id || "").trim();
    if (!messageId) return false;
    const now = new Date().toISOString();
    db.prepare("INSERT INTO evidence_audits (message_id, payload, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(message_id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at")
      .run(messageId, JSON.stringify(audit), now, now);
    return true;
  }
  function getEvidenceAudit(messageId) {
    const row = db.prepare("SELECT payload FROM evidence_audits WHERE message_id = ?").get(String(messageId || ""));
    if (!row) return null;
    try { return JSON.parse(row.payload); } catch (_) { return null; }
  }
  function interactionMetrics() {
    const row = db.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN status='needs_review' THEN 1 ELSE 0 END) AS needs_review, SUM(CASE WHEN rating='down' THEN 1 ELSE 0 END) AS downvotes, SUM(CASE WHEN quality!='supported' THEN 1 ELSE 0 END) AS low_confidence, SUM(CASE WHEN status='golden' THEN 1 ELSE 0 END) AS golden FROM chat_interactions").get();
    return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value || 0)]));
  }
  function recordUnanswered(event) {
    const now = event.created_at || new Date().toISOString();
    const question = String(event.question || "").trim().slice(0, 500);
    if (!question) return;
    db.prepare("INSERT INTO unanswered_questions (app_id, question, intent, quality, count, status, first_seen, last_seen) VALUES (?, ?, ?, ?, 1, 'open', ?, ?) ON CONFLICT(app_id, question) DO UPDATE SET intent=excluded.intent, quality=excluded.quality, count=unanswered_questions.count + 1, status='open', last_seen=excluded.last_seen").run(event.app_id || "yingge-h5", question, event.intent || "general", event.quality || "insufficient", now, now);
  }
  function listUnanswered(status = "open") {
    const rows = status === "all"
      ? db.prepare("SELECT app_id, question, intent, quality, count, status, first_seen, last_seen FROM unanswered_questions ORDER BY last_seen DESC LIMIT 200").all()
      : db.prepare("SELECT app_id, question, intent, quality, count, status, first_seen, last_seen FROM unanswered_questions WHERE status = ? ORDER BY last_seen DESC LIMIT 200").all(status);
    return rows;
  }
  function resolveUnanswered(event) {
    const question = String(event.question || "").trim().slice(0, 500);
    if (!question) return false;
    const result = db.prepare("UPDATE unanswered_questions SET status = ? WHERE app_id = ? AND question = ?").run(event.status || "resolved", event.app_id || "yingge-h5", question);
    return Number(result.changes || 0) > 0;
  }
  function createKnowledgeTask(task) {
    const now = task.created_at || new Date().toISOString();
    db.prepare("INSERT INTO knowledge_tasks (task_id, app_id, question, intent, quality, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(task_id) DO UPDATE SET status=excluded.status, updated_at=excluded.updated_at").run(task.task_id, task.app_id || "yingge-h5", String(task.question || "").slice(0, 500), task.intent || "general", task.quality || "insufficient", task.status || "open", now, now);
    return task;
  }
  function listKnowledgeTasks(status = "open") {
    const sql = status === "all" ? "SELECT task_id, app_id, question, intent, quality, status, created_at, updated_at FROM knowledge_tasks ORDER BY updated_at DESC LIMIT 200" : "SELECT task_id, app_id, question, intent, quality, status, created_at, updated_at FROM knowledge_tasks WHERE status = ? ORDER BY updated_at DESC LIMIT 200";
    return status === "all" ? db.prepare(sql).all() : db.prepare(sql).all(status);
  }
  function updateKnowledgeTask(task) {
    const result = db.prepare("UPDATE knowledge_tasks SET status = ?, updated_at = ? WHERE task_id = ?").run(task.status || "open", task.updated_at || new Date().toISOString(), task.task_id);
    return Number(result.changes || 0) > 0;
  }
  function recordRevision(revision) {
    db.prepare("INSERT INTO knowledge_revisions (revision_id, candidate_id, task_ids, backup_path, status, chunk_count, created_at, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(revision.revision_id, revision.candidate_id, JSON.stringify(revision.task_ids || []), revision.backup_path, revision.status || "built", Number(revision.chunk_count || 0), revision.created_at || new Date().toISOString(), revision.note || "");
    return revision;
  }
  function listRevisions() {
    return db.prepare("SELECT revision_id, candidate_id, task_ids, backup_path, status, chunk_count, created_at, note FROM knowledge_revisions ORDER BY created_at DESC LIMIT 100").all().map((row) => ({ ...row, task_ids: JSON.parse(row.task_ids || "[]") }));
  }
  function metrics() {
    const raw = db.prepare("SELECT COUNT(*) AS requests, SUM(CASE WHEN status < 400 THEN 1 ELSE 0 END) AS successes, SUM(CASE WHEN status >= 400 THEN 1 ELSE 0 END) AS errors, ROUND(AVG(latency_ms), 1) AS avg_latency_ms, ROUND(AVG(retrieval_ms), 2) AS avg_retrieval_ms, ROUND(AVG(CASE WHEN citation_integrity IS NOT NULL THEN citation_integrity END), 4) AS citation_integrity_rate FROM usage_events").get();
    const summary = { requests: Number(raw.requests || 0), successes: Number(raw.successes || 0), errors: Number(raw.errors || 0), avg_latency_ms: Number(raw.avg_latency_ms || 0), avg_retrieval_ms: Number(raw.avg_retrieval_ms || 0), citation_integrity_rate: Number(raw.citation_integrity_rate || 0) };
    const byApp = db.prepare("SELECT app_id, COUNT(*) AS requests, SUM(CASE WHEN status < 400 THEN 1 ELSE 0 END) AS successes, ROUND(AVG(latency_ms), 1) AS avg_latency_ms, ROUND(AVG(retrieval_ms), 2) AS avg_retrieval_ms FROM usage_events GROUP BY app_id ORDER BY requests DESC").all();
    return { summary, by_app: byApp };
  }
  return { mode: "sqlite", listApps, upsertApp, recordReview, upsertDynamic, listDynamic, recordUsage, recordInteraction, recordFeedback, listInteractions, updateInteractionStatus, deleteInteraction, saveEvidenceAudit, getEvidenceAudit, interactionMetrics, recordUnanswered, listUnanswered, resolveUnanswered, createKnowledgeTask, listKnowledgeTasks, updateKnowledgeTask, recordRevision, listRevisions, metrics, path: dbPath };
}

function createJsonFallback() {
  const interactions = new Map();
  const audits = new Map();
  return { mode: "json", listApps: () => [], upsertApp: () => {}, recordReview: () => {}, upsertDynamic: () => {}, listDynamic: () => [], recordUsage: () => {}, recordInteraction: (item) => interactions.set(item.message_id, { ...item, status: item.quality === "supported" ? "observed" : "needs_review" }), recordFeedback: (item) => { const current = interactions.get(item.message_id); if (!current) return false; interactions.set(item.message_id, { ...current, rating: item.rating, feedback_reasons: item.reasons || [], feedback_note: item.note || "", status: item.rating === "down" ? "needs_review" : "accepted" }); return true; }, listInteractions: (status = "review") => [...interactions.values()].filter((item) => status === "all" || item.status === "needs_review"), updateInteractionStatus: (item) => { const current = interactions.get(item.message_id); if (!current) return false; interactions.set(item.message_id, { ...current, status: item.status }); return true; }, deleteInteraction: (item) => interactions.delete(item.message_id), saveEvidenceAudit: (audit) => { const messageId = String(audit?.message_id || "").trim(); if (!messageId) return false; audits.set(messageId, audit); return true; }, getEvidenceAudit: (messageId) => audits.get(String(messageId || "")) || null, interactionMetrics: () => ({ total: interactions.size, needs_review: [...interactions.values()].filter((item) => item.status === "needs_review").length, downvotes: [...interactions.values()].filter((item) => item.rating === "down").length, low_confidence: [...interactions.values()].filter((item) => item.quality !== "supported").length, golden: [...interactions.values()].filter((item) => item.status === "golden").length }), recordUnanswered: () => {}, listUnanswered: () => [], resolveUnanswered: () => false, createKnowledgeTask: (task) => task, listKnowledgeTasks: () => [], updateKnowledgeTask: () => false, recordRevision: (revision) => revision, listRevisions: () => [], metrics: () => ({ summary: { requests: 0, successes: 0, errors: 0, avg_latency_ms: 0 }, by_app: [] }), path: null };
}
