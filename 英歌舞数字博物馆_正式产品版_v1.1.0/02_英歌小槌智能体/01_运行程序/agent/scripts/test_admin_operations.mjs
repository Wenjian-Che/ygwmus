import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createSiteContentStore, defaultSiteContent } from "../../backend/site-content-store.mjs";
import { runAdminDiagnostics } from "../../backend/admin-diagnostics.mjs";

function expectCode(operation, code) {
  assert.throws(operation, (error) => error?.code === code, `应拒绝并返回 ${code}`);
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "yingge-admin-operations-"));
const contentPath = path.join(tempRoot, "site-content.json");
const auditPath = path.join(tempRoot, "site-content-audit.jsonl");
const author = { id: "author-a", role: "author" };
const publisher = { id: "publisher-b", role: "publisher" };

const store = createSiteContentStore({ contentPath, auditPath });
const initialAdmin = store.adminProjection();
assert.equal(initialAdmin.version, 1);
assert.equal(initialAdmin.workflow_status, "published");
assert.equal(store.publicProjection().hero.titleLine1, defaultSiteContent.hero.titleLine1);

const edited = structuredClone(defaultSiteContent);
edited.hero.titleLine1 = "从一声锣鼓，";
edited.hero.titleLine2 = "走近英歌。";
const draft = store.saveDraft({ expected_version: 1, content: edited }, { actor: author, reason: "调整首页开场" });
assert.equal(draft.workflow_status, "draft");
assert.equal(draft.version, 2);
assert.equal(draft.draft.hero.titleLine1, "从一声锣鼓，");
assert.equal(store.publicProjection().hero.titleLine1, defaultSiteContent.hero.titleLine1, "草稿不能直接泄漏到公众接口");
expectCode(() => store.saveDraft({ expected_version: 1, content: edited }, { actor: author }), "SITE_CONTENT_VERSION_CONFLICT");
expectCode(() => store.saveDraft({ expected_version: 2, content: { ...edited, unexpected: true } }, { actor: author }), "SITE_CONTENT_INVALID_INPUT");
const polluted = JSON.parse(JSON.stringify(edited).replace(/^{/, '{"__proto__":{"polluted":true},'));
expectCode(() => store.saveDraft({ expected_version: 2, content: polluted }, { actor: author }), "SITE_CONTENT_INVALID_INPUT");
const tooLong = structuredClone(edited);
tooLong.hero.body = "英".repeat(141);
expectCode(() => store.saveDraft({ expected_version: 2, content: tooLong }, { actor: author }), "SITE_CONTENT_INVALID_INPUT");
expectCode(() => store.publish({ expected_version: 2 }, { actor: author }), "SITE_CONTENT_ROLE_FORBIDDEN");
expectCode(() => store.publish({ expected_version: 2 }, { actor: { id: "author-a", role: "publisher" } }), "SITE_CONTENT_SELF_PUBLISH");

const published = store.publish({ expected_version: 2 }, { actor: publisher, reason: "确认首页文案" });
assert.equal(published.workflow_status, "published");
assert.equal(published.version, 3);
assert.equal(store.publicProjection().hero.titleLine1, "从一声锣鼓，");
assert.equal(store.publicProjection().version, 3);
assert.ok(fs.existsSync(contentPath), "内容状态应原子持久化");
const audit = fs.readFileSync(auditPath, "utf8").trim().split(/\r?\n/).map(JSON.parse);
assert.deepEqual(audit.map((item) => item.operation), ["save_draft", "publish"]);
assert.equal(audit[0].actor.id, "author-a");
assert.equal(audit[1].actor.role, "publisher");

const fixtureRoot = path.join(tempRoot, "diagnostics-fixture");
fs.mkdirSync(path.join(fixtureRoot, "agent"), { recursive: true });
fs.mkdirSync(path.join(fixtureRoot, "web", "data"), { recursive: true });
fs.mkdirSync(path.join(fixtureRoot, "web"), { recursive: true });
fs.mkdirSync(path.join(fixtureRoot, "knowledge-base", "content"), { recursive: true });
fs.writeFileSync(path.join(fixtureRoot, "knowledge-base", "content", "00.md"), "# 英歌\n\n受治理的知识源。\n");
fs.writeFileSync(path.join(fixtureRoot, "agent", "knowledge_manifest.json"), JSON.stringify({ knowledge_version: "2026.08.30.1" }));
fs.writeFileSync(path.join(fixtureRoot, "web", "data", "build_report.json"), JSON.stringify({ knowledge_version: "2026.08.30.1", chunks: 1 }));
fs.writeFileSync(path.join(fixtureRoot, "web", "data", "lexical_index.json"), JSON.stringify({ version: "2026.08.30.1", chunk_count: 1, postings: {}, document_frequency: {} }));
fs.writeFileSync(path.join(fixtureRoot, "web", "data", "chunks.jsonl"), `${JSON.stringify({ id: "chunk-1", source_file: "00.md", content: "英歌是流行于潮汕及周边地区的民间表演艺术。", source_ids: ["source-a"] })}\n`);
fs.writeFileSync(path.join(fixtureRoot, "web", "data", "source_registry.json"), JSON.stringify({ sources: { "source-a": { title: "权威来源", url: "https://example.com/source" } } }));
fs.writeFileSync(path.join(fixtureRoot, "web", "index.html"), '<script src="app.js"></script><button data-guide-open>问小槌</button>');
fs.writeFileSync(path.join(fixtureRoot, "web", "app.js"), "fetch('http://127.0.0.1:8787/api/agent/chat',{headers:{'x-app-id':'yingge-h5'}})");

const healthy = await runAdminDiagnostics({
  projectRoot: fixtureRoot,
  runtime: {
    knowledgeVersion: "2026.08.30.1",
    chunks: [{ id: "chunk-1" }],
    apps: [{ app_id: "yingge-h5", enabled: true }],
    model: { configured: true, name: "museum-model" },
    retrieval: () => ({ results: [{ chunk: { id: "chunk-1", content: "英歌是民间表演艺术", source_ids: ["source-a"] }, score: 3.2 }], meta: { elapsed_ms: 2.4 } }),
    publicContent: store.publicProjection(),
    publicExhibits: { exhibits: [] },
  },
});
assert.equal(healthy.status, "healthy");
assert.ok(healthy.checks.length >= 7);
assert.ok(healthy.checks.every((check) => ["pass", "warning", "fail"].includes(check.status)));
assert.ok(healthy.checks.some((check) => check.id === "retrieval_probe" && check.status === "pass"));
assert.ok(healthy.checks.some((check) => check.id === "frontend_contract" && check.status === "pass"));
const serialized = JSON.stringify(healthy);
assert.doesNotMatch(serialized, /diagnostics-fixture|yingge-admin-operations|DEEPSEEK|api[_-]?key|author-secret|[A-Z]:\\/i, "诊断响应不得泄漏路径或密钥线索");

const stale = await runAdminDiagnostics({
  projectRoot: fixtureRoot,
  runtime: {
    knowledgeVersion: "2026.08.29.9",
    chunks: [{ id: "chunk-1" }],
    apps: [{ app_id: "yingge-h5", enabled: true }],
    model: { configured: false, name: "museum-model" },
    retrieval: () => ({ results: [], meta: { elapsed_ms: 1 } }),
    publicContent: store.publicProjection(),
    publicExhibits: { exhibits: [] },
  },
});
assert.equal(stale.status, "blocked");
assert.equal(stale.checks.find((check) => check.id === "knowledge_version")?.status, "fail");
assert.equal(stale.checks.find((check) => check.id === "retrieval_probe")?.status, "fail");
assert.equal(stale.checks.find((check) => check.id === "model_config")?.status, "warning", "模型未配置不应伪装成知识库故障");

console.log("admin operations store and diagnostics contract ok");
