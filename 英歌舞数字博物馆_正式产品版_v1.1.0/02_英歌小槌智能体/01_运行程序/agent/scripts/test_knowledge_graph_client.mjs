import assert from "node:assert/strict";

await import("../../web/admin/knowledge-graph.js");

const api = globalThis.KnowledgeGraphWorkbench;
assert.equal(typeof api?.init, "function", "client must expose KnowledgeGraphWorkbench.init");
assert.equal(typeof api?.__test?.normalizePayload, "function", "client test contract is missing");

const nodes = Array.from({ length: 30 }, (_, index) => ({
  id: `node:${index}`,
  label: index < 4 ? `柔佛节点 ${index}` : `知识节点 ${index}`,
  type: index === 0 ? "source" : "claim",
  summary: "固定测试节点",
  region: index < 4 ? "柔佛" : "潮汕",
  evidence_grade: "A",
  review_status: "verified",
  rights_status: "not_applicable",
  privacy_risk: "none",
  contains_minors: false,
  workflow_status: "published",
  updated_at: "2026-08-30T00:00:00.000Z",
  source_ids: ["source:official"],
  tags: [],
  editor_target: "materials",
  conflict_status: "none",
}));
const graph = {
  schema_version: 1,
  generated_at: "2026-08-30T00:00:00.000Z",
  nodes,
  edges: [
    { id: "edge:0", source: "node:0", target: "node:1", relation: "支持", label: "支持" },
    { id: "edge:1", source: "node:1", target: "node:2", relation: "关联", label: "关联" },
    { id: "edge:2", source: "node:2", target: "node:3", relation: "关联", label: "关联" },
  ],
  sources: [],
};

const direct = api.__test.normalizePayload(graph);
assert.equal(direct.connected, true);
assert.equal(direct.graph.nodes.length, 30);

const envelope = api.__test.normalizePayload({ connected: true, source_status: "ready", graph, summary: { initial_node_limit: 18 } });
assert.equal(envelope.initialLimit, 18);
assert.equal(envelope.graph, graph);

const disconnected = api.__test.normalizePayload({ connected: false, source_status: "not_ready", graph: null });
assert.equal(disconnected.connected, false);

assert.equal(api.__test.safeHttps("https://example.com/source"), "https://example.com/source");
for (const unsafe of ["http://example.com", "javascript:alert(1)", "//example.com", "https://user:pass@example.com"]) {
  assert.equal(api.__test.safeHttps(unsafe), "", `unsafe URL was accepted: ${unsafe}`);
}

const initial = api.__test.selectVisibleNodes(graph, { mode: "relations", search: "", type: "all", limit: 24, expanded: new Set() });
assert.equal(initial.length, 24, "initial graph must respect the 24 node ceiling");

const searched = api.__test.selectVisibleNodes(graph, { mode: "relations", search: "柔佛", type: "all", limit: 24, expanded: new Set() });
assert.equal(searched.length, 4, "search must include every matching node without filler nodes");

const sources = api.__test.selectVisibleNodes(graph, { mode: "relations", search: "", type: "source", limit: 24, expanded: new Set() });
assert.deepEqual(sources.map((node) => node.id), ["node:0"]);

assert.deepEqual([...api.__test.neighborhood(graph, "node:0", 1)].sort(), ["node:0", "node:1"]);
assert.deepEqual([...api.__test.neighborhood(graph, "node:0", 2)].sort(), ["node:0", "node:1", "node:2"]);

console.log("knowledge graph client contract passed");
