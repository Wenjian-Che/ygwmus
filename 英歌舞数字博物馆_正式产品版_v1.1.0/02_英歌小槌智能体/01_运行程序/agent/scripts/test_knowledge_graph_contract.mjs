import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createKnowledgeGraphStore } from "../../backend/knowledge-graph-store.mjs";

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "yingge-knowledge-graph-"));
const graphPath = path.join(temp, "knowledge_graph.json");

const fixture = {
  schema_version: 1,
  generator_version: "fixture-1",
  generated_at: "2026-08-30T00:00:00.000Z",
  nodes: [
    { id: "concept:yingge", version: 1, reviewed_version: 1, published_version: 1, label: "英歌", type: "concept", summary: "以群体表演为核心的传统舞蹈实践。", region: "潮汕", evidence_grade: "A", review_status: "verified", rights_status: "not_applicable", privacy_risk: "none", contains_minors: false, workflow_status: "published", updated_at: "2026-08-30T00:00:00.000Z", source_ids: ["source:official"], tags: ["总览"], editor_target: "content", conflict_status: "none" },
    { id: "event:pending", version: 1, reviewed_version: 0, published_version: 0, label: "待核活动", type: "event", summary: "尚待核验。", region: "新加坡", evidence_grade: "C", review_status: "pending_review", rights_status: "pending_authorization", privacy_risk: "high", contains_minors: true, workflow_status: "pending_review", updated_at: "2026-08-30T00:00:00.000Z", source_ids: ["source:pending"], tags: ["未成年人"], editor_target: "materials", conflict_status: "gap" },
    { id: "claim:formation", version: 1, reviewed_version: 1, published_version: 1, label: "队形是空间组织方式", type: "claim", summary: "具体做法需按地区与队伍核对。", region: "潮阳", evidence_grade: "B", review_status: "verified", rights_status: "not_applicable", privacy_risk: "low", contains_minors: false, workflow_status: "published", updated_at: "2026-08-30T00:00:00.000Z", source_ids: ["source:official"], tags: ["队形"], editor_target: "materials", conflict_status: "none" },
  ],
  edges: [
    { id: "edge:1", version: 1, reviewed_version: 1, source: "concept:yingge", target: "claim:formation", relation: "包含观察维度", label: "表演结构", evidence_grade: "B", review_status: "verified", source_ids: ["source:official"], updated_at: "2026-08-30T00:00:00.000Z", conflict_status: "none" },
    { id: "edge:2", version: 1, reviewed_version: 0, source: "concept:yingge", target: "event:pending", relation: "相关活动", label: "待核", evidence_grade: "C", review_status: "pending_review", source_ids: ["source:pending"], updated_at: "2026-08-30T00:00:00.000Z", conflict_status: "gap" },
  ],
  sources: [
    { id: "source:official", version: 1, reviewed_version: 1, label: "官方项目资料", url: "https://www.ihchina.cn/", source_type: "government_institution", evidence_grade: "A", publication: "中国非物质文化遗产网", published_at: "2026-01-01", accessed_at: "2026-08-30", source_document: "documents/official.docx", source_locator: "第 3 段", rights_status: "not_applicable", review_status: "verified", privacy_risk: "none", contains_minors: false },
    { id: "source:pending", version: 1, reviewed_version: 0, label: "合作候选材料", url: "https://example.org/pending", source_type: "first_party_material", evidence_grade: "C", publication: "合作方", published_at: "2026-01-02", accessed_at: "2026-08-30", source_document: "documents/pending.docx", source_locator: "第 8 段", rights_status: "pending_authorization", review_status: "pending_review", privacy_risk: "high", contains_minors: true },
  ],
};

try {
  const missing = createKnowledgeGraphStore({ graphPath: path.join(temp, "missing.json") }).adminProjection();
  assert.equal(missing.connected, false);
  assert.equal(missing.source_status, "not_ready");
  assert.equal(missing.graph, null);

  fs.writeFileSync(graphPath, JSON.stringify(fixture), "utf8");
  const store = createKnowledgeGraphStore({ graphPath });
  const admin = store.adminProjection();
  assert.equal(admin.connected, true);
  assert.equal(admin.graph.nodes.length, 3);
  assert.equal(admin.graph.edges.length, 2);
  assert.equal(admin.summary.conflicts_and_gaps, 1);
  assert.equal(admin.summary.initial_node_limit > 0, true);
  assert.doesNotMatch(JSON.stringify(admin), new RegExp(temp.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")), "管理 API 不得泄漏图谱绝对路径");

  const publicPreview = admin.public_preview;
  assert.deepEqual(publicPreview.nodes.map((item) => item.id).sort(), ["claim:formation", "concept:yingge"]);
  assert.deepEqual(publicPreview.edges.map((item) => item.id), ["edge:1"]);
  assert.deepEqual(publicPreview.sources.map((item) => item.id), ["source:official"]);
  assert.doesNotMatch(JSON.stringify(publicPreview), /source_document|source_locator|privacy_risk|contains_minors|pending_authorization|pending_review/);

  const staleNode = structuredClone(fixture);
  staleNode.nodes[0].summary = "已变化但尚未重新审核。";
  staleNode.nodes[0].version = 2;
  fs.writeFileSync(graphPath, JSON.stringify(staleNode), "utf8");
  assert.deepEqual(createKnowledgeGraphStore({ graphPath }).adminProjection().public_preview.nodes.map((item) => item.id), ["claim:formation"], "沿用旧审核与发布版本的节点不得公开");

  const staleSource = structuredClone(fixture);
  staleSource.sources[0].url = "https://www.ihchina.cn/changed";
  staleSource.sources[0].version = 2;
  fs.writeFileSync(graphPath, JSON.stringify(staleSource), "utf8");
  assert.equal(createKnowledgeGraphStore({ graphPath }).adminProjection().public_preview.nodes.length, 0, "来源变化后沿用旧审核版本不得支撑公开节点");

  const staleEdge = structuredClone(fixture);
  staleEdge.edges[0].relation = "已变化但尚未重新审核";
  staleEdge.edges[0].version = 2;
  fs.writeFileSync(graphPath, JSON.stringify(staleEdge), "utf8");
  assert.equal(createKnowledgeGraphStore({ graphPath }).adminProjection().public_preview.edges.length, 0, "关系变化后沿用旧审核版本不得公开");

  const unpublishedNode = structuredClone(fixture);
  unpublishedNode.nodes[0].version = 2;
  unpublishedNode.nodes[0].reviewed_version = 2;
  fs.writeFileSync(graphPath, JSON.stringify(unpublishedNode), "utf8");
  assert.equal(createKnowledgeGraphStore({ graphPath }).adminProjection().public_preview.nodes.some((item) => item.id === "concept:yingge"), false, "当前审核但未重新发布的节点不得公开");

  const broken = structuredClone(fixture);
  broken.edges[0].target = "missing:node";
  fs.writeFileSync(graphPath, JSON.stringify(broken), "utf8");
  assert.throws(() => createKnowledgeGraphStore({ graphPath }).adminProjection(), (error) => error.code === "KNOWLEDGE_GRAPH_INVALID");

  const unsafe = structuredClone(fixture);
  unsafe.sources[0].source_document = "D:\\private\\official.docx";
  fs.writeFileSync(graphPath, JSON.stringify(unsafe), "utf8");
  assert.throws(() => createKnowledgeGraphStore({ graphPath }).adminProjection(), (error) => error.code === "KNOWLEDGE_GRAPH_INVALID");

  for (const [field, value] of [["url", ""], ["published_at", "2026-02-30"], ["source_locator", "C:\\private\\official.docx"], ["source_locator", "\\\\server\\share\\official.docx"]]) {
    const invalidSource = structuredClone(fixture);
    invalidSource.sources[0][field] = value;
    fs.writeFileSync(graphPath, JSON.stringify(invalidSource), "utf8");
    assert.throws(() => createKnowledgeGraphStore({ graphPath }).adminProjection(), (error) => error.code === "KNOWLEDGE_GRAPH_INVALID", `${field}=${value} 必须被契约拒绝`);
  }

  const invalidTimestamp = structuredClone(fixture);
  invalidTimestamp.nodes[0].updated_at = "2026-08-30 00:00:00";
  fs.writeFileSync(graphPath, JSON.stringify(invalidTimestamp), "utf8");
  assert.throws(() => createKnowledgeGraphStore({ graphPath }).adminProjection(), (error) => error.code === "KNOWLEDGE_GRAPH_INVALID", "时间必须是规范 ISO UTC 时间");

  for (const mutate of [
    (item) => { item.nodes[0].reviewed_version = 2; },
    (item) => { item.nodes[0].published_version = 2; },
    (item) => { item.edges[0].reviewed_version = 2; },
    (item) => { item.sources[0].reviewed_version = 2; },
  ]) {
    const futureReview = structuredClone(fixture);
    mutate(futureReview);
    fs.writeFileSync(graphPath, JSON.stringify(futureReview), "utf8");
    assert.throws(() => createKnowledgeGraphStore({ graphPath }).adminProjection(), (error) => error.code === "KNOWLEDGE_GRAPH_INVALID", "审核或发布版本不得超过对象当前版本");
  }

  fs.writeFileSync(graphPath, JSON.stringify(fixture), "utf8");
  const cachedStore = createKnowledgeGraphStore({ graphPath });
  const cachedFirst = cachedStore.adminProjection();
  const cachedSecond = cachedStore.adminProjection();
  assert.strictEqual(cachedSecond, cachedFirst, "未变化的已核文件必须复用缓存投影");
  assert.equal(Object.isFrozen(cachedFirst), true, "共享缓存投影必须不可变");

  fs.writeFileSync(graphPath, `${JSON.stringify(fixture)}\n`, "utf8");
  const refreshed = cachedStore.adminProjection();
  assert.notStrictEqual(refreshed, cachedFirst, "文件身份变化后必须失效缓存");
  fs.renameSync(graphPath, `${graphPath}.offline`);
  assert.equal(cachedStore.adminProjection().connected, false, "文件消失后不得继续返回旧缓存");
  fs.renameSync(`${graphPath}.offline`, graphPath);
  assert.equal(cachedStore.adminProjection().connected, true, "图谱文件恢复后必须重新加载");

  const linkPath = path.join(temp, "knowledge_graph.link.json");
  try {
    fs.symlinkSync(graphPath, linkPath, "file");
    assert.throws(() => createKnowledgeGraphStore({ graphPath: linkPath }).adminProjection(), (error) => error.code === "KNOWLEDGE_GRAPH_INVALID", "图谱文件不得通过符号链接或重解析点读取");
  } catch (error) {
    if (!["EPERM", "EACCES", "ENOTSUP"].includes(error.code)) throw error;
  }
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

console.log("knowledge graph deterministic contract and public gate ok");
