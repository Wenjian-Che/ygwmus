import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { runProductionPreflight } from "../../backend/production-preflight.mjs";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "yingge-production-server-"));
const privateRoot = path.join(root, "private");
const publicRoot = path.join(root, "public");
const runtimeData = path.join(privateRoot, "knowledge", "runtime");
const governance = path.join(privateRoot, "knowledge", "governance");
const catalog = path.join(privateRoot, "curation", "exhibits.json");
const publicProjection = path.join(publicRoot, "data", "exhibits.public.json");
const port = 19200 + Math.floor(Math.random() * 500);

fs.mkdirSync(path.dirname(catalog), { recursive: true });
fs.mkdirSync(path.dirname(publicProjection), { recursive: true });
fs.mkdirSync(runtimeData, { recursive: true });
fs.mkdirSync(governance, { recursive: true });
for (const directory of [
  path.join(privateRoot, "agent"), path.join(privateRoot, "admin"), path.join(privateRoot, "audit"),
  path.join(privateRoot, "content"), path.join(privateRoot, "plans"), path.join(privateRoot, "apps"),
  path.join(privateRoot, "operations"), path.join(privateRoot, "knowledge", "content"),
  path.join(privateRoot, "knowledge", "generated"), path.join(privateRoot, "backups"),
]) fs.mkdirSync(directory, { recursive: true });
fs.copyFileSync("content/curation/exhibits.json", catalog);
fs.copyFileSync("web/data/exhibits.public.json", publicProjection);
for (const name of ["chunks.jsonl", "lexical_index.json", "source_registry.json", "build_report.json"]) {
  const source = path.join("agent", "runtime", name);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(runtimeData, name));
}
for (const name of ["rag_config.json", "retrieval_eval.json", "golden_answer_eval.json", "intents.json", "knowledge_manifest.json", "golden_answers.json"]) {
  fs.copyFileSync(path.join("agent", name), path.join(governance, name));
}

const productionEnv = {
    ...process.env,
    NODE_ENV: "production",
    AGENT_PORT: String(port),
    AGENT_HOST: "127.0.0.1",
    AGENT_ALLOWED_ORIGINS: "https://museum.example.cn",
    AGENT_COOKIE_SECURE: "true",
    YINGGE_PRIVATE_STATE_ROOT: privateRoot,
    AGENT_STORE_DIR: path.join(privateRoot, "agent"),
    ADMIN_PRIVATE_STATE_DIR: path.join(privateRoot, "admin"),
    CURATION_CATALOG_PATH: catalog,
    CURATION_AUDIT_PATH: path.join(privateRoot, "audit", "curation.jsonl"),
    CURATION_PUBLIC_PATH: publicProjection,
    SITE_CONTENT_PATH: path.join(privateRoot, "content", "site-content.json"),
    SITE_CONTENT_AUDIT_PATH: path.join(privateRoot, "audit", "site-content.jsonl"),
    ADMIN_PLANS_PATH: path.join(privateRoot, "plans", "plans.json"),
    ADMIN_APPS_PATH: path.join(privateRoot, "apps", "apps.json"),
    AGENT_OPERATIONS_STATE_DIR: path.join(privateRoot, "operations"),
    KNOWLEDGE_GOVERNANCE_DIR: governance,
    KNOWLEDGE_SOURCE_DIR: path.join(privateRoot, "knowledge", "content"),
    KNOWLEDGE_BUILD_OUTPUT_DIR: path.join(privateRoot, "knowledge", "generated"),
    KNOWLEDGE_RUNTIME_DATA_DIR: runtimeData,
    KNOWLEDGE_GRAPH_PATH: path.join(privateRoot, "knowledge", "knowledge_graph.json"),
    YINGGE_BACKUP_DIR: path.join(privateRoot, "backups"),
    ADMIN_CREDENTIALS_JSON: "",
    DEEPSEEK_API_KEY: "",
    CURATION_PRIVATE_MEDIA_ROOT: "",
};

const preflight = await runProductionPreflight({
  env: {
    ...productionEnv,
    ADMIN_CREDENTIALS_JSON: JSON.stringify({
      "reviewer-token-at-least-32-random-characters": { id: "release-reviewer", role: "reviewer" },
      "publisher-token-at-least-32-random-characters": { id: "release-publisher", role: "publisher" },
    }),
  },
});
assert.equal(preflight.ok, true);
assert.equal(preflight.persistent_storage, "sqlite");

const child = spawn(process.execPath, ["backend/server.mjs"], {
  cwd: process.cwd(),
  env: productionEnv,
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
child.stdout.on("data", (part) => { output += part; });
child.stderr.on("data", (part) => { output += part; });
const base = `http://127.0.0.1:${port}`;

async function waitForServer() {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`production server exited early (${child.exitCode}): ${output}`);
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`production server did not start: ${output}`);
}

try {
  await waitForServer();
  const ready = await fetch(`${base}/api/ready`);
  assert.equal(ready.status, 200);
  assert.deepEqual(await ready.json(), { ready: true, knowledge_available: true, persistent_storage: true });

  const allowed = await fetch(`${base}/api/health`, { headers: { origin: "https://museum.example.cn" } });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers.get("access-control-allow-origin"), "https://museum.example.cn");

  const malicious = await fetch(`${base}/api/health`, { headers: { origin: "https://evil.example", host: "evil.example" } });
  assert.equal(malicious.status, 403, "生产 CORS 不能把任意同 Host 来源当成可信域名");

  const setup = await fetch(`${base}/api/admin/auth/setup`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "release-admin", password: "Release-pass-2026", display_name: "部署验收" }),
  });
  assert.equal(setup.status, 201);
  const cookie = setup.headers.get("set-cookie") || "";
  assert.match(cookie, /__Host-yingge_admin_session=/);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Strict/i);
  assert.match(cookie, /Secure/i);
  assert.doesNotMatch(JSON.stringify(await setup.json()), /Release-pass-2026|session_token|password_hash/);

  const adminStatus = await fetch(`${base}/api/admin/auth/status`);
  assert.equal(adminStatus.headers.get("cache-control"), "no-store");
  assert.equal(adminStatus.headers.get("x-content-type-options"), "nosniff");
} finally {
  if (child.exitCode === null) child.kill();
  await new Promise((resolve) => child.exitCode !== null ? resolve() : child.once("exit", resolve));
  fs.rmSync(root, { recursive: true, force: true });
}

console.log("production server CORS, readiness and secure admin cookie ok");
