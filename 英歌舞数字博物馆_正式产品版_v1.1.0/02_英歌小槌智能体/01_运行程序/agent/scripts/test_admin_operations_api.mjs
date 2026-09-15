import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

async function waitForHealth(port) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`server ${port} did not start`);
}

async function withServer(port, env, run) {
  const child = spawn(process.execPath, ["backend/server.mjs"], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: "test", AGENT_PORT: String(port), ADMIN_CREDENTIALS_JSON: "", AGENT_ALLOWED_ORIGINS: "", ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  try {
    await waitForHealth(port);
    await run();
  } finally {
    if (child.exitCode === null) {
      const exited = new Promise((resolve) => child.once("exit", resolve));
      child.kill();
      await exited;
    }
    assert.doesNotMatch(output, /author-secret|reviewer-secret|publisher-secret/i, "日志不得包含管理凭据");
  }
}

const isolated = fs.mkdtempSync(path.join(os.tmpdir(), "yingge-admin-api-"));
const credentials = JSON.stringify({
  "author-secret": { id: "author-a", role: "author" },
  "reviewer-secret": { id: "reviewer-b", role: "reviewer" },
  "publisher-secret": { id: "publisher-c", role: "publisher" },
});
const commonEnv = {
  ADMIN_CREDENTIALS_JSON: credentials,
  AGENT_ALLOWED_ORIGINS: "http://127.0.0.1:8096",
  ADMIN_PRIVATE_STATE_DIR: isolated,
  AGENT_STORE_DIR: isolated,
  SITE_CONTENT_PATH: path.join(isolated, "site-content.json"),
  SITE_CONTENT_AUDIT_PATH: path.join(isolated, "site-content-audit.jsonl"),
};
const apiPort = 8800 + Math.floor(Math.random() * 500);
const api = `http://127.0.0.1:${apiPort}`;
const auth = (token, extra = {}) => ({ authorization: `Bearer ${token}`, ...extra });

await withServer(apiPort, commonEnv, async () => {
  const publicHealth = await (await fetch(`${api}/api/health`)).json();
  assert.deepEqual(Object.keys(publicHealth).sort(), ["chat_mode", "knowledge_available", "ok"], "公众健康接口不得泄漏模型、上游地址、Key、存储或语音指纹");
  const unauthorized = await fetch(`${api}/api/admin/diagnostics/run`, { method: "POST" });
  assert.equal(unauthorized.status, 401);
  const maliciousOrigin = await fetch(`${api}/api/admin/diagnostics/run`, { method: "POST", headers: auth("reviewer-secret", { origin: "https://evil.example", "content-type": "application/json" }), body: "{}" });
  assert.equal(maliciousOrigin.status, 403);

  const first = await fetch(`${api}/api/admin/site-content`, { headers: auth("author-secret") });
  assert.equal(first.status, 200);
  const initial = await first.json();
  assert.equal(initial.workflow_status, "published");
  assert.ok(initial.draft?.hero && initial.published?.hero);

  const content = structuredClone(initial.draft);
  content.hero.titleLine1 = "从一声锣鼓，";
  const reviewerEdit = await fetch(`${api}/api/admin/site-content/draft`, { method: "PUT", headers: auth("reviewer-secret", { "content-type": "application/json" }), body: JSON.stringify({ expected_version: initial.version, content }) });
  assert.equal(reviewerEdit.status, 403, "reviewer 不能代替作者编辑页面");
  const savedResponse = await fetch(`${api}/api/admin/site-content/draft`, { method: "PUT", headers: auth("author-secret", { "content-type": "application/json" }), body: JSON.stringify({ expected_version: initial.version, content, reason: "调整首页开场" }) });
  assert.equal(savedResponse.status, 200);
  const saved = await savedResponse.json();
  assert.equal(saved.workflow_status, "draft");
  const publicBefore = await (await fetch(`${api}/api/site-content`)).json();
  assert.notEqual(publicBefore.hero.titleLine1, "从一声锣鼓，", "草稿不能进入公众 API");
  const conflict = await fetch(`${api}/api/admin/site-content/draft`, { method: "PUT", headers: auth("author-secret", { "content-type": "application/json" }), body: JSON.stringify({ expected_version: initial.version, content, reason: "陈旧保存" }) });
  assert.equal(conflict.status, 409);
  const authorPublish = await fetch(`${api}/api/admin/site-content/publish`, { method: "POST", headers: auth("author-secret", { "content-type": "application/json" }), body: JSON.stringify({ expected_version: saved.version, reason: "越权发布" }) });
  assert.equal(authorPublish.status, 403);
  const publishedResponse = await fetch(`${api}/api/admin/site-content/publish`, { method: "POST", headers: auth("publisher-secret", { "content-type": "application/json" }), body: JSON.stringify({ expected_version: saved.version, reason: "复核通过" }) });
  assert.equal(publishedResponse.status, 200);
  const publicAfter = await (await fetch(`${api}/api/site-content`)).json();
  assert.equal(publicAfter.hero.titleLine1, "从一声锣鼓，");

  const injected = await fetch(`${api}/api/admin/diagnostics/run`, { method: "POST", headers: auth("reviewer-secret", { "content-type": "application/json" }), body: JSON.stringify({ mode: "safe", api_key: "do-not-log", url: "http://127.0.0.1:1", model: "expensive-model" }) });
  assert.equal(injected.status, 400, "诊断接口必须拒绝 URL、密钥和模型覆盖");
  const diagnosticsResponse = await fetch(`${api}/api/admin/diagnostics/run`, { method: "POST", headers: auth("reviewer-secret", { "content-type": "application/json", origin: "http://127.0.0.1:8096" }), body: JSON.stringify({ mode: "safe" }) });
  assert.equal(diagnosticsResponse.status, 200);
  const diagnostics = await diagnosticsResponse.json();
  assert.equal(diagnostics.mode, "safe_offline");
  assert.equal(diagnostics.live_probe.billable, false);
  assert.ok(diagnostics.checks.some((check) => check.id === "frontend_contract" && check.status === "pass"));
  assert.ok(diagnostics.checks.some((check) => check.id === "retrieval_probe"));
  const serialized = JSON.stringify(diagnostics);
  assert.doesNotMatch(serialized, /author-secret|reviewer-secret|publisher-secret|do-not-log|[A-Z]:\\/i);
});

console.log("admin operations API workflow and diagnostics security ok");
