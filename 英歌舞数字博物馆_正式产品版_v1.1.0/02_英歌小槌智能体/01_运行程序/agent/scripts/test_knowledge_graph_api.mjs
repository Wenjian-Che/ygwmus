import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "yingge-graph-api-"));
const graphPath = path.join(temp, "knowledge_graph.json");
fs.copyFileSync(path.resolve("agent/scripts/knowledge_graph.fixture.json"), graphPath);
const port = 9700 + Math.floor(Math.random() * 200);
const base = `http://127.0.0.1:${port}`;
const origin = "http://127.0.0.1:8096";
const credentials = JSON.stringify({ "author-secret": { id: "author-a", role: "author" } });
const child = spawn(process.execPath, ["backend/server.mjs"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: "test",
    AGENT_PORT: String(port),
    AGENT_STORE_DIR: temp,
    ADMIN_PRIVATE_STATE_DIR: temp,
    ADMIN_CREDENTIALS_JSON: credentials,
    AGENT_ALLOWED_ORIGINS: origin,
    SITE_CONTENT_PATH: path.join(temp, "site-content.json"),
    SITE_CONTENT_AUDIT_PATH: path.join(temp, "site-content-audit.jsonl"),
    KNOWLEDGE_GRAPH_PATH: graphPath,
    DEEPSEEK_API_KEY: "",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverOutput = "";
child.stdout.on("data", (chunk) => { serverOutput += chunk; });
child.stderr.on("data", (chunk) => { serverOutput += chunk; });

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try { if ((await fetch(`${base}/api/health`)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  throw new Error(`knowledge graph API server did not start: ${serverOutput}`);
}

const headers = (extra = {}) => ({ origin, authorization: "Bearer author-secret", ...extra });

try {
  await waitForServer();
  assert.equal((await fetch(`${base}/api/admin/knowledge-graph`, { headers: { origin } })).status, 401, "图谱治理数据必须要求管理身份");
  const response = await fetch(`${base}/api/admin/knowledge-graph`, { headers: headers() });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store", "敏感图谱响应不得缓存");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff", "图谱响应必须禁用 MIME 嗅探");
  const payload = await response.json();
  assert.equal(payload.connected, true);
  assert.equal(payload.graph.schema_version, 1);
  assert.equal(payload.graph.nodes.length, 3, "后台应能看到待审核治理节点");
  assert.deepEqual(payload.public_preview.nodes.map((item) => item.id).sort(), ["claim:formation", "concept:yingge"]);
  const serialized = JSON.stringify(payload);
  assert.doesNotMatch(serialized, new RegExp(temp.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")), "响应不得泄漏图谱绝对路径");
  assert.doesNotMatch(JSON.stringify(payload.public_preview), /source_document|source_locator|privacy_risk|contains_minors|pending_authorization|pending_review/);

  const noPublicEndpoint = await fetch(`${base}/api/knowledge-graph`, { headers: { origin } });
  assert.equal(noPublicEndpoint.status, 404, "第一阶段不得意外增加公众图谱接口");
  const malicious = await fetch(`${base}/api/admin/knowledge-graph`, { headers: { authorization: "Bearer author-secret", origin: "https://evil.example" } });
  assert.equal(malicious.status, 403);

  fs.renameSync(graphPath, `${graphPath}.offline`);
  const missing = await fetch(`${base}/api/admin/knowledge-graph`, { headers: headers() });
  assert.equal(missing.status, 200);
  assert.deepEqual((await missing.json()).source_status, "not_ready");
} finally {
  if (child.exitCode === null) {
    const exited = new Promise((resolve) => child.once("exit", resolve));
    child.kill();
    await exited;
  }
  fs.rmSync(temp, { recursive: true, force: true });
}

console.log("knowledge graph admin-only API and public isolation ok");
