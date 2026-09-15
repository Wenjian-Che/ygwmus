import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "yingge-admin-api-"));
const port = 8900 + Math.floor(Math.random() * 300);
const base = `http://127.0.0.1:${port}`;
const origin = "http://127.0.0.1:8096";
const catalogPath = path.join(stateDir, "exhibits.json");
fs.copyFileSync(path.resolve("content/curation/exhibits.json"), catalogPath);
const child = spawn(process.execPath, ["backend/server.mjs"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: "test",
    AGENT_PORT: String(port),
    AGENT_ALLOWED_ORIGINS: origin,
    ADMIN_CREDENTIALS_JSON: "",
    ADMIN_PRIVATE_STATE_DIR: stateDir,
    AGENT_STORE_DIR: stateDir,
    SITE_CONTENT_PATH: path.join(stateDir, "site-content.json"),
    SITE_CONTENT_AUDIT_PATH: path.join(stateDir, "site-content-audit.jsonl"),
    CURATION_CATALOG_PATH: catalogPath,
    DEEPSEEK_API_KEY: "",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let stderr = "";
child.stderr.on("data", (chunk) => { stderr += chunk; });

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try { if ((await fetch(`${base}/api/health`)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 75));
  }
  throw new Error(`server did not start: ${stderr}`);
}

const json = async (pathname, options = {}) => {
  const response = await fetch(`${base}${pathname}`, { ...options, headers: { origin, ...(options.body ? { "content-type": "application/json" } : {}), ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  return { response, body };
};

try {
  await waitForServer();

  const initial = await json("/api/admin/auth/status");
  assert.equal(initial.response.status, 200);
  assert.equal(initial.response.headers.get("access-control-allow-credentials"), "true", "Cookie 登录跨端口时必须显式允许凭据");
  assert.equal(initial.body.setup_required, true);
  assert.equal(initial.body.authenticated, false);

  const setup = await json("/api/admin/auth/setup", {
    method: "POST",
    body: JSON.stringify({ username: "museum-admin", password: "Museum-pass-2026", display_name: "全栈工程师" }),
  });
  assert.equal(setup.response.status, 201);
  assert.equal(setup.body.actor.role, "owner");
  assert.equal(Object.hasOwn(setup.body, "session_token"), false, "会话令牌不得进入 JSON");
  const setupCookie = setup.response.headers.get("set-cookie") || "";
  assert.match(setupCookie, /yingge_admin_session=/);
  assert.match(setupCookie, /HttpOnly/i);
  assert.match(setupCookie, /SameSite=Strict/i);
  const cookie = setupCookie.split(";")[0];

  const repeated = await json("/api/admin/auth/setup", { method: "POST", body: JSON.stringify({ username: "other-admin", password: "Another-pass-2026", display_name: "其他人" }) });
  assert.equal(repeated.response.status, 409);

  const session = await json("/api/admin/session", { headers: { cookie } });
  assert.equal(session.response.status, 200);
  assert.equal(session.body.actor.display_name, "全栈工程师");

  const editable = await json("/api/admin/site-content", { headers: { cookie } });
  assert.equal(editable.response.status, 200);
  const ownerDraft = structuredClone(editable.body.draft);
  ownerDraft.hero.body = "从真实影像、动作、阵形、人物和地方实践理解英歌。";
  const ownerSave = await json("/api/admin/site-content/draft", {
    method: "PUT",
    headers: { cookie },
    body: JSON.stringify({ expected_version: editable.body.version, content: ownerDraft, reason: "本机管理员编辑" }),
  });
  assert.equal(ownerSave.response.status, 200, "本机管理员应能在统一工作台保存内容草稿");
  assert.equal(ownerSave.body.draft_editor.id, setup.body.actor.id);
  const ownerSelfPublish = await json("/api/admin/site-content/publish", {
    method: "POST",
    headers: { cookie },
    body: JSON.stringify({ expected_version: ownerSave.body.version, reason: "尝试发布自己的修改" }),
  });
  assert.equal(ownerSelfPublish.response.status, 403, "管理员仍不能发布自己提交的同一修改");

  const settingsSave = await json("/api/admin/settings/model", {
    method: "PUT",
    headers: { cookie },
    body: JSON.stringify({ api_key: "sk-private-api-integration", model: "deepseek-v4-flash", thinking: true }),
  });
  assert.equal(settingsSave.response.status, 200);
  assert.equal(settingsSave.body.api_key_configured, true);
  assert.doesNotMatch(JSON.stringify(settingsSave.body), /sk-private-api-integration/);

  const settingsRead = await json("/api/admin/settings/model", { headers: { cookie } });
  assert.equal(settingsRead.response.status, 200);
  assert.equal(settingsRead.body.model, "deepseek-v4-flash");
  assert.doesNotMatch(JSON.stringify(settingsRead.body), /api_key\s*:/i);

  const health = await json("/api/health");
  assert.equal(health.body.chat_mode, "grounded_model");

  for (const pathname of ["/api/site-content", "/api/exhibits"]) {
    const publicResponse = await json(pathname);
    const serialized = JSON.stringify(publicResponse.body);
    assert.doesNotMatch(serialized, /sk-private-api-integration|museum-admin|password_hash|install-key|model-settings/i, `${pathname} 泄漏管理密钥或账户`);
  }

  const logout = await json("/api/admin/logout", { method: "POST", headers: { cookie }, body: "{}" });
  assert.equal(logout.response.status, 200);
  assert.match(logout.response.headers.get("set-cookie") || "", /Max-Age=0/i);
  const expired = await json("/api/admin/session", { headers: { cookie } });
  assert.equal(expired.response.status, 401);

  const wrong = await json("/api/admin/login", { method: "POST", body: JSON.stringify({ username: "museum-admin", password: "Wrong-pass-2026" }) });
  assert.equal(wrong.response.status, 401);
  const login = await json("/api/admin/login", { method: "POST", body: JSON.stringify({ username: "museum-admin", password: "Museum-pass-2026" }) });
  assert.equal(login.response.status, 200);
  assert.match(login.response.headers.get("set-cookie") || "", /HttpOnly/i);

  const malicious = await fetch(`${base}/api/admin/auth/status`, { headers: { origin: "https://evil.example" } });
  assert.equal(malicious.status, 403);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const rejected = await json("/api/admin/login", { method: "POST", body: JSON.stringify({ username: "nobody", password: "Wrong-pass-2026" }) });
    assert.equal(rejected.response.status, 401);
  }
  const limited = await json("/api/admin/login", { method: "POST", body: JSON.stringify({ username: "nobody", password: "Wrong-pass-2026" }) });
  assert.equal(limited.response.status, 429, "连续登录失败必须限流");
} finally {
  if (child.exitCode === null) {
    const exited = new Promise((resolve) => child.once("exit", resolve));
    child.kill();
    await exited;
  }
  fs.rmSync(stateDir, { recursive: true, force: true });
}

console.log("admin login cookie API and model settings security ok");
