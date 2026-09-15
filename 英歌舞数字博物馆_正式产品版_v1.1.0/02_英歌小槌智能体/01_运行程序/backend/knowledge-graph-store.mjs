import fs from "node:fs";
import path from "node:path";

const NODE_TYPES = new Set(["concept", "practice", "role", "formation", "rhythm", "region", "team", "event", "person", "source", "claim", "conflict", "gap", "media"]);
const EVIDENCE_GRADES = new Set(["A", "B", "C", "D", "unknown"]);
const REVIEW_STATUSES = new Set(["verified", "pending_review", "rejected", "draft"]);
const RIGHTS_STATUSES = new Set(["authorized", "pending_authorization", "not_applicable", "restricted", "unknown"]);
const PRIVACY_RISKS = new Set(["none", "low", "medium", "high", "unreviewed"]);
const WORKFLOW_STATUSES = new Set(["published", "pending_review", "draft", "withdrawn"]);
const CONFLICT_STATUSES = new Set(["none", "conflict", "gap", "resolved"]);

function problem(message) {
  return Object.assign(new Error(message), { code: "KNOWLEDGE_GRAPH_INVALID", status: 422 });
}

function plainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function exactObject(value, { label, required, optional = [] }) {
  if (!plainObject(value)) throw problem(`${label} 必须是对象`);
  const requiredSet = new Set(required);
  const allowed = new Set([...required, ...optional]);
  const keys = Object.keys(value);
  if (keys.some((key) => !allowed.has(key)) || [...requiredSet].some((key) => !Object.hasOwn(value, key))) {
    throw problem(`${label} 字段不完整或包含未知字段`);
  }
}

function cleanString(value, label, { min = 0, max = 500 } = {}) {
  if (typeof value !== "string") throw problem(`${label} 必须是文字`);
  const output = value.replace(/\r\n?/g, "\n").trim();
  if (output.length < min || output.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(output)) {
    throw problem(`${label} 长度或字符无效`);
  }
  return output;
}

function cleanId(value, label) {
  const output = cleanString(value, label, { min: 1, max: 120 });
  if (!/^[A-Za-z0-9][A-Za-z0-9:._-]*$/.test(output) || ["__proto__", "prototype", "constructor"].includes(output)) throw problem(`${label} 格式无效`);
  return output;
}

function cleanEnum(value, label, allowed) {
  const output = cleanString(value, label, { min: 1, max: 64 });
  if (!allowed.has(output)) throw problem(`${label} 取值无效`);
  return output;
}

function cleanVersion(value, label, { allowZero = false } = {}) {
  const minimum = allowZero ? 0 : 1;
  if (!Number.isSafeInteger(value) || value < minimum || value > 2_147_483_647) throw problem(`${label} 版本无效`);
  return value;
}

function cleanDate(value, label, { dateOnly = false } = {}) {
  const output = cleanString(value, label, { min: 1, max: 40 });
  if (dateOnly) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(output)
        || new Date(`${output}T00:00:00.000Z`).toISOString().slice(0, 10) !== output) throw problem(`${label} 日期格式无效`);
  } else if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(output)
      || Number.isNaN(Date.parse(output))
      || new Date(output).toISOString() !== output) throw problem(`${label} 日期格式无效`);
  return output;
}

function cleanHttps(value, label) {
  const output = cleanString(value, label, { min: 1, max: 1500 });
  let parsed;
  try { parsed = new URL(output); } catch { throw problem(`${label} URL 无效`); }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw problem(`${label} 只允许安全 HTTPS 地址`);
  return parsed.href;
}

function cleanLocator(value, label) {
  const output = cleanString(value, label, { max: 200 });
  if (/[/\\]/.test(output) || /^[A-Za-z]:/.test(output) || /^file:/i.test(output)) throw problem(`${label} 只能是段落或页码锚点`);
  return output;
}

function cleanRelative(value, label) {
  const output = cleanString(value, label, { max: 500 });
  if (!output) return "";
  const normalized = output.replace(/\\/g, "/");
  if (/^[A-Za-z]:\//.test(normalized) || normalized.startsWith("/") || normalized.split("/").some((part) => part === ".." || part === ".")) {
    throw problem(`${label} 必须是安全相对引用`);
  }
  return normalized;
}

function cleanStringArray(value, label, { maxItems = 32, ids = false } = {}) {
  if (!Array.isArray(value) || value.length > maxItems) throw problem(`${label} 必须是有限数组`);
  const output = value.map((item, index) => ids ? cleanId(item, `${label}[${index}]`) : cleanString(item, `${label}[${index}]`, { min: 1, max: 80 }));
  if (new Set(output).size !== output.length) throw problem(`${label} 不能重复`);
  return output;
}

function normalizeNode(value, index) {
  const label = `nodes[${index}]`;
  exactObject(value, { label, required: ["id", "version", "reviewed_version", "published_version", "label", "type", "summary", "region", "evidence_grade", "review_status", "rights_status", "privacy_risk", "contains_minors", "workflow_status", "updated_at", "source_ids", "tags", "editor_target", "conflict_status"] });
  if (typeof value.contains_minors !== "boolean") throw problem(`${label}.contains_minors 必须是布尔值`);
  const editorTarget = cleanString(value.editor_target, `${label}.editor_target`, { min: 1, max: 30 });
  if (!new Set(["content", "materials"]).has(editorTarget)) throw problem(`${label}.editor_target 无效`);
  return {
    id: cleanId(value.id, `${label}.id`),
    version: cleanVersion(value.version, `${label}.version`),
    reviewed_version: cleanVersion(value.reviewed_version, `${label}.reviewed_version`, { allowZero: true }),
    published_version: cleanVersion(value.published_version, `${label}.published_version`, { allowZero: true }),
    label: cleanString(value.label, `${label}.label`, { min: 1, max: 100 }),
    type: cleanEnum(value.type, `${label}.type`, NODE_TYPES),
    summary: cleanString(value.summary, `${label}.summary`, { max: 1200 }),
    region: cleanString(value.region, `${label}.region`, { max: 80 }),
    evidence_grade: cleanEnum(value.evidence_grade, `${label}.evidence_grade`, EVIDENCE_GRADES),
    review_status: cleanEnum(value.review_status, `${label}.review_status`, REVIEW_STATUSES),
    rights_status: cleanEnum(value.rights_status, `${label}.rights_status`, RIGHTS_STATUSES),
    privacy_risk: cleanEnum(value.privacy_risk, `${label}.privacy_risk`, PRIVACY_RISKS),
    contains_minors: value.contains_minors,
    workflow_status: cleanEnum(value.workflow_status, `${label}.workflow_status`, WORKFLOW_STATUSES),
    updated_at: cleanDate(value.updated_at, `${label}.updated_at`),
    source_ids: cleanStringArray(value.source_ids, `${label}.source_ids`, { maxItems: 24, ids: true }),
    tags: cleanStringArray(value.tags, `${label}.tags`, { maxItems: 24 }),
    editor_target: editorTarget,
    conflict_status: cleanEnum(value.conflict_status, `${label}.conflict_status`, CONFLICT_STATUSES),
  };
}

function normalizeEdge(value, index) {
  const label = `edges[${index}]`;
  exactObject(value, { label, required: ["id", "version", "reviewed_version", "source", "target", "relation", "label", "evidence_grade", "review_status", "source_ids", "updated_at", "conflict_status"] });
  return {
    id: cleanId(value.id, `${label}.id`),
    version: cleanVersion(value.version, `${label}.version`),
    reviewed_version: cleanVersion(value.reviewed_version, `${label}.reviewed_version`, { allowZero: true }),
    source: cleanId(value.source, `${label}.source`),
    target: cleanId(value.target, `${label}.target`),
    relation: cleanString(value.relation, `${label}.relation`, { min: 1, max: 100 }),
    label: cleanString(value.label, `${label}.label`, { max: 100 }),
    evidence_grade: cleanEnum(value.evidence_grade, `${label}.evidence_grade`, EVIDENCE_GRADES),
    review_status: cleanEnum(value.review_status, `${label}.review_status`, REVIEW_STATUSES),
    source_ids: cleanStringArray(value.source_ids, `${label}.source_ids`, { maxItems: 24, ids: true }),
    updated_at: cleanDate(value.updated_at, `${label}.updated_at`),
    conflict_status: cleanEnum(value.conflict_status, `${label}.conflict_status`, CONFLICT_STATUSES),
  };
}

function normalizeSource(value, index) {
  const label = `sources[${index}]`;
  exactObject(value, { label, required: ["id", "version", "reviewed_version", "label", "url", "source_type", "evidence_grade", "publication", "published_at", "accessed_at", "source_document", "source_locator", "rights_status", "review_status", "privacy_risk", "contains_minors"] });
  if (typeof value.contains_minors !== "boolean") throw problem(`${label}.contains_minors 必须是布尔值`);
  return {
    id: cleanId(value.id, `${label}.id`),
    version: cleanVersion(value.version, `${label}.version`),
    reviewed_version: cleanVersion(value.reviewed_version, `${label}.reviewed_version`, { allowZero: true }),
    label: cleanString(value.label, `${label}.label`, { min: 1, max: 160 }),
    url: cleanHttps(value.url, `${label}.url`),
    source_type: cleanString(value.source_type, `${label}.source_type`, { min: 1, max: 64 }),
    evidence_grade: cleanEnum(value.evidence_grade, `${label}.evidence_grade`, EVIDENCE_GRADES),
    publication: cleanString(value.publication, `${label}.publication`, { max: 160 }),
    published_at: cleanDate(value.published_at, `${label}.published_at`, { dateOnly: true }),
    accessed_at: cleanDate(value.accessed_at, `${label}.accessed_at`, { dateOnly: true }),
    source_document: cleanRelative(value.source_document, `${label}.source_document`),
    source_locator: cleanLocator(value.source_locator, `${label}.source_locator`),
    rights_status: cleanEnum(value.rights_status, `${label}.rights_status`, RIGHTS_STATUSES),
    review_status: cleanEnum(value.review_status, `${label}.review_status`, REVIEW_STATUSES),
    privacy_risk: cleanEnum(value.privacy_risk, `${label}.privacy_risk`, PRIVACY_RISKS),
    contains_minors: value.contains_minors,
  };
}

function uniqueById(items, label) {
  const ids = items.map((item) => item.id);
  if (new Set(ids).size !== ids.length) throw problem(`${label} 存在重复 id`);
}

export function normalizeKnowledgeGraph(input, { maxNodes = 5000, maxEdges = 15000 } = {}) {
  exactObject(input, { label: "knowledge_graph", required: ["schema_version", "generated_at", "nodes", "edges", "sources"], optional: ["generator_version"] });
  if (input.schema_version !== 1) throw problem("knowledge_graph.schema_version 必须为 1");
  if (!Array.isArray(input.nodes) || input.nodes.length > maxNodes) throw problem("knowledge_graph.nodes 超出限制");
  if (!Array.isArray(input.edges) || input.edges.length > maxEdges) throw problem("knowledge_graph.edges 超出限制");
  if (!Array.isArray(input.sources) || input.sources.length > maxNodes) throw problem("knowledge_graph.sources 超出限制");
  const graph = {
    schema_version: 1,
    generator_version: cleanString(input.generator_version || "unspecified", "knowledge_graph.generator_version", { min: 1, max: 80 }),
    generated_at: cleanDate(input.generated_at, "knowledge_graph.generated_at"),
    nodes: input.nodes.map(normalizeNode),
    edges: input.edges.map(normalizeEdge),
    sources: input.sources.map(normalizeSource),
  };
  for (const node of graph.nodes) {
    if (node.reviewed_version > node.version || node.published_version > node.version) throw problem(`节点 ${node.id} 的审核或发布版本超前`);
  }
  for (const edge of graph.edges) if (edge.reviewed_version > edge.version) throw problem(`关系 ${edge.id} 的审核版本超前`);
  for (const source of graph.sources) if (source.reviewed_version > source.version) throw problem(`来源 ${source.id} 的审核版本超前`);
  uniqueById(graph.nodes, "nodes");
  uniqueById(graph.edges, "edges");
  uniqueById(graph.sources, "sources");
  const nodeIds = new Set(graph.nodes.map((item) => item.id));
  const sourceIds = new Set(graph.sources.map((item) => item.id));
  for (const node of graph.nodes) if (node.source_ids.some((id) => !sourceIds.has(id))) throw problem(`节点 ${node.id} 引用了不存在的来源`);
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) throw problem(`关系 ${edge.id} 引用了不存在的节点`);
    if (edge.source === edge.target) throw problem(`关系 ${edge.id} 不能自连`);
    if (edge.source_ids.some((id) => !sourceIds.has(id))) throw problem(`关系 ${edge.id} 引用了不存在的来源`);
  }
  return graph;
}

function safeForPublic(item) {
  return item.review_status === "verified"
    && item.reviewed_version === item.version
    && ["authorized", "not_applicable"].includes(item.rights_status)
    && ["none", "low"].includes(item.privacy_risk)
    && item.contains_minors === false;
}

export function publicKnowledgeGraphProjection(graph) {
  const safeSources = new Map(graph.sources.filter(safeForPublic).map((item) => [item.id, item]));
  const nodes = graph.nodes.filter((item) => item.workflow_status === "published"
    && item.published_version === item.version
    && safeForPublic(item)
    && item.conflict_status !== "conflict"
    && item.conflict_status !== "gap"
    && item.source_ids.length > 0
    && item.source_ids.every((id) => safeSources.has(id)));
  const nodeIds = new Set(nodes.map((item) => item.id));
  const edges = graph.edges.filter((item) => item.review_status === "verified"
    && item.reviewed_version === item.version
    && item.conflict_status !== "conflict"
    && item.conflict_status !== "gap"
    && nodeIds.has(item.source)
    && nodeIds.has(item.target)
    && item.source_ids.length > 0
    && item.source_ids.every((id) => safeSources.has(id)));
  const usedSourceIds = new Set([...nodes, ...edges].flatMap((item) => item.source_ids));
  return {
    schema_version: 1,
    generated_at: graph.generated_at,
    nodes: nodes.map(({ id, label, type, summary, region, evidence_grade, updated_at, tags }) => ({ id, label, type, summary, region, evidence_grade, updated_at, tags })),
    edges: edges.map(({ id, source, target, relation, label, evidence_grade, updated_at }) => ({ id, source, target, relation, label, evidence_grade, updated_at })),
    sources: [...usedSourceIds].map((id) => safeSources.get(id)).filter(Boolean).map(({ id, label, url, source_type, evidence_grade, publication, published_at }) => ({ id, label, url, source_type, evidence_grade, publication, published_at })),
  };
}

function counts(items, key) {
  return items.reduce((result, item) => {
    const value = item[key] || "unknown";
    result[value] = (result[value] || 0) + 1;
    return result;
  }, {});
}

function graphSummary(graph, publicPreview) {
  const conflictsAndGaps = graph.nodes.filter((item) => ["conflict", "gap"].includes(item.conflict_status) || ["conflict", "gap"].includes(item.type)).length;
  return {
    nodes: graph.nodes.length,
    edges: graph.edges.length,
    sources: graph.sources.length,
    public_nodes: publicPreview.nodes.length,
    conflicts_and_gaps: conflictsAndGaps,
    by_type: counts(graph.nodes, "type"),
    by_region: counts(graph.nodes, "region"),
    by_evidence: counts(graph.nodes, "evidence_grade"),
    by_review: counts(graph.nodes, "review_status"),
    initial_node_limit: Math.min(24, Math.max(1, graph.nodes.length)),
    large_graph: graph.nodes.length > 1000 || graph.edges.length > 5000,
  };
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function sameFileIdentity(left, right) {
  return Boolean(left && right)
    && left.dev === right.dev
    && left.ino === right.ino
    && left.size === right.size
    && left.mtimeMs === right.mtimeMs;
}

export function createKnowledgeGraphStore({ graphPath, maxBytes = 25 * 1024 * 1024, maxNodes = 5000, maxEdges = 15000 } = {}) {
  if (!graphPath) throw new TypeError("graphPath is required");
  const resolvedPath = path.resolve(graphPath);
  const normalizedResolvedPath = process.platform === "win32" ? path.normalize(resolvedPath).toLowerCase() : path.normalize(resolvedPath);
  let cache = null;

  function inspectFile() {
    let linkStat;
    try { linkStat = fs.lstatSync(resolvedPath); }
    catch (error) {
      if (error.code === "ENOENT") return null;
      throw problem("knowledge_graph.json 无法安全检查");
    }
    if (linkStat.isSymbolicLink()) throw problem("knowledge_graph.json 不允许符号链接或重解析点");
    let realPath;
    try { realPath = fs.realpathSync.native(resolvedPath); }
    catch { throw problem("knowledge_graph.json 无法安全解析"); }
    const normalizedRealPath = process.platform === "win32" ? path.normalize(realPath).toLowerCase() : path.normalize(realPath);
    if (normalizedRealPath !== normalizedResolvedPath) throw problem("knowledge_graph.json 不允许符号链接或重解析路径");
    let stat;
    try { stat = fs.statSync(resolvedPath); }
    catch { throw problem("knowledge_graph.json 无法安全检查"); }
    if (!stat.isFile() || stat.size > maxBytes) throw problem("knowledge_graph.json 不是可读取的受控文件");
    return { dev: stat.dev, ino: stat.ino, size: stat.size, mtimeMs: stat.mtimeMs };
  }

  function loadRecord() {
    const before = inspectFile();
    if (!before) {
      cache = null;
      return null;
    }
    if (cache && sameFileIdentity(cache.identity, before)) return cache;
    let bytes;
    try { bytes = fs.readFileSync(resolvedPath); }
    catch { throw problem("knowledge_graph.json 无法安全读取"); }
    const after = inspectFile();
    if (!sameFileIdentity(before, after) || bytes.byteLength !== before.size) throw problem("knowledge_graph.json 在读取期间发生变化");
    let parsed;
    try { parsed = JSON.parse(bytes.toString("utf8")); }
    catch { throw problem("knowledge_graph.json 不是有效 JSON"); }
    const graph = normalizeKnowledgeGraph(parsed, { maxNodes, maxEdges });
    const publicPreview = publicKnowledgeGraphProjection(graph);
    const projection = deepFreeze({ connected: true, source_status: "ready", graph, summary: graphSummary(graph, publicPreview), public_preview: publicPreview });
    cache = { identity: after, graph, projection };
    return cache;
  }

  function read() {
    return loadRecord()?.graph || null;
  }

  function adminProjection() {
    const record = loadRecord();
    if (!record) return deepFreeze({ connected: false, source_status: "not_ready", graph: null, summary: { nodes: 0, edges: 0, sources: 0, public_nodes: 0, conflicts_and_gaps: 0, by_type: {}, by_region: {}, by_evidence: {}, by_review: {}, initial_node_limit: 24, large_graph: false }, public_preview: { schema_version: 1, generated_at: null, nodes: [], edges: [], sources: [] } });
    return record.projection;
  }

  return Object.freeze({ read, adminProjection });
}
