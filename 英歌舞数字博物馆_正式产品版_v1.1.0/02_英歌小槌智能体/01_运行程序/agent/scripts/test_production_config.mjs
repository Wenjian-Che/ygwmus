import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validateProductionEnvironment } from "../../backend/production-config.mjs";

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "yingge-production-config-"));
try {
  const projectRoot = path.join(sandbox, "release");
  const webRoot = path.join(projectRoot, "web");
  const stateRoot = path.join(sandbox, "state");
  const publicRoot = path.join(sandbox, "public");
  fs.mkdirSync(webRoot, { recursive: true });
  fs.mkdirSync(stateRoot, { recursive: true });
  fs.mkdirSync(publicRoot, { recursive: true });

  const env = {
    NODE_ENV: "production",
    AGENT_HOST: "127.0.0.1",
    AGENT_ALLOWED_ORIGINS: "https://museum.example.cn",
    AGENT_COOKIE_SECURE: "true",
    YINGGE_PRIVATE_STATE_ROOT: stateRoot,
    YINGGE_BACKUP_DIR: path.join(stateRoot, "backups"),
    AGENT_STORE_DIR: path.join(stateRoot, "agent"),
    ADMIN_PRIVATE_STATE_DIR: path.join(stateRoot, "admin"),
    CURATION_CATALOG_PATH: path.join(stateRoot, "curation", "exhibits.json"),
    CURATION_AUDIT_PATH: path.join(stateRoot, "audit", "curation.jsonl"),
    CURATION_PUBLIC_PATH: path.join(publicRoot, "data", "exhibits.public.json"),
    SITE_CONTENT_PATH: path.join(stateRoot, "content", "site-content.json"),
    SITE_CONTENT_AUDIT_PATH: path.join(stateRoot, "audit", "site-content.jsonl"),
    ADMIN_PLANS_PATH: path.join(stateRoot, "plans", "plans.json"),
    ADMIN_APPS_PATH: path.join(stateRoot, "apps", "apps.json"),
    AGENT_OPERATIONS_STATE_DIR: path.join(stateRoot, "operations"),
    KNOWLEDGE_GOVERNANCE_DIR: path.join(stateRoot, "knowledge", "governance"),
    KNOWLEDGE_SOURCE_DIR: path.join(stateRoot, "knowledge", "content"),
    KNOWLEDGE_BUILD_OUTPUT_DIR: path.join(stateRoot, "knowledge", "generated"),
    KNOWLEDGE_RUNTIME_DATA_DIR: path.join(stateRoot, "knowledge", "runtime"),
    KNOWLEDGE_GRAPH_PATH: path.join(stateRoot, "knowledge", "knowledge_graph.json"),
  };

  const valid = validateProductionEnvironment({ env, projectRoot, webRoot });
  assert.equal(valid.production, true);
  assert.equal(valid.bindHost, "127.0.0.1");
  assert.equal(valid.cookieSecure, true);
  assert.deepEqual(valid.allowedOrigins, ["https://museum.example.cn"]);
  assert.equal(valid.paths.adminStateDir, path.resolve(env.ADMIN_PRIVATE_STATE_DIR));

  assert.throws(() => validateProductionEnvironment({ env: { ...env, AGENT_ALLOWED_ORIGINS: "" }, projectRoot, webRoot }), /AGENT_ALLOWED_ORIGINS/);
  assert.throws(() => validateProductionEnvironment({ env: { ...env, AGENT_ALLOWED_ORIGINS: "http:\/\/museum.example.cn" }, projectRoot, webRoot }), /HTTPS/);
  assert.throws(() => validateProductionEnvironment({ env: { ...env, AGENT_ALLOWED_ORIGINS: "https:\/\/*.example.cn" }, projectRoot, webRoot }), /确切域名/);
  assert.throws(() => validateProductionEnvironment({ env: { ...env, AGENT_ALLOWED_ORIGINS: "https:\/\/user:pass@museum.example.cn" }, projectRoot, webRoot }), /凭据/);
  assert.throws(() => validateProductionEnvironment({ env: { ...env, AGENT_COOKIE_SECURE: "false" }, projectRoot, webRoot }), /Secure/);
  assert.throws(() => validateProductionEnvironment({ env: { ...env, AGENT_HOST: "0.0.0.0" }, projectRoot, webRoot }), /回环地址/);
  assert.throws(() => validateProductionEnvironment({ env: { ...env, ADMIN_PRIVATE_STATE_DIR: path.join(webRoot, "admin") }, projectRoot, webRoot }), /项目目录之外/);
  assert.throws(() => validateProductionEnvironment({ env: { ...env, CURATION_PUBLIC_PATH: path.join(stateRoot, "public.json") }, projectRoot, webRoot }), /公众数据.*私密状态/);
} finally {
  fs.rmSync(sandbox, { recursive: true, force: true });
}

console.log("production deployment configuration contract ok");
