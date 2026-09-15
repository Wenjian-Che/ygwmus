import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createAdminAuthService } from "../../backend/admin-auth.mjs";
import { createAdminModelSettingsStore } from "../../backend/admin-model-settings.mjs";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "yingge-admin-login-"));

try {
  const auth = createAdminAuthService({ stateDir: root, sessionTtlMs: 60_000 });
  assert.deepEqual(auth.status(), { setup_required: true, account_count: 0 });

  const setup = await auth.bootstrap({ username: "museum-admin", password: "Museum-pass-2026", display_name: "全栈工程师" });
  assert.equal(setup.actor.role, "owner");
  assert.equal(setup.actor.display_name, "全栈工程师");
  assert.deepEqual(auth.status(), { setup_required: false, account_count: 1 });
  await assert.rejects(() => auth.bootstrap({ username: "second", password: "Another-pass-2026", display_name: "第二账号" }), /已经完成/);

  const authFile = fs.readFileSync(path.join(root, "admin-auth.json"), "utf8");
  assert.doesNotMatch(authFile, /Museum-pass-2026/);
  assert.match(authFile, /password_hash/);

  await assert.rejects(() => auth.login({ username: "museum-admin", password: "wrong-password" }), /账号或密码/);
  const login = await auth.login({ username: "museum-admin", password: "Museum-pass-2026" });
  assert.ok(login.session_token.length >= 40);
  assert.equal(auth.actorForToken(login.session_token)?.id, setup.actor.id);
  assert.doesNotMatch(JSON.stringify(login.actor), /password|hash|salt/i);
  auth.logout(login.session_token);
  assert.equal(auth.actorForToken(login.session_token), null);

  const reloaded = createAdminAuthService({ stateDir: root });
  const secondLogin = await reloaded.login({ username: "museum-admin", password: "Museum-pass-2026" });
  assert.equal(secondLogin.actor.display_name, "全栈工程师");

  const settings = createAdminModelSettingsStore({ stateDir: root, env: {} });
  assert.deepEqual(settings.summary(), {
    provider: "deepseek",
    base_url: "https://api.deepseek.com",
    model: "deepseek-v4-flash",
    thinking: true,
    api_key_configured: false,
    verified_at: null,
  });

  const updated = settings.update({ api_key: "sk-private-example", model: "deepseek-v4-pro", thinking: false });
  assert.equal(updated.api_key_configured, true);
  assert.equal(updated.model, "deepseek-v4-pro");
  assert.equal(settings.runtime().api_key, "sk-private-example");
  assert.doesNotMatch(JSON.stringify(updated), /sk-private-example/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, "model-settings.json"), "utf8"), /sk-private-example/);
  await assert.rejects(async () => settings.update({ api_key: "sk-another-private-key", model: "other-model", thinking: true }), /模型/);

  let seenAuthorization = "";
  const verified = await settings.testConnection({
    fetchImpl: async (_url, options) => {
      seenAuthorization = options.headers.Authorization;
      return new Response(JSON.stringify({ choices: [{ message: { content: "连接成功" } }], model: "deepseek-v4-pro" }), { status: 200, headers: { "content-type": "application/json" } });
    },
  });
  assert.equal(seenAuthorization, "Bearer sk-private-example");
  assert.equal(verified.ok, true);
  assert.ok(settings.summary().verified_at);

  settings.clearKey();
  assert.equal(settings.summary().api_key_configured, false);
  assert.equal(settings.runtime().api_key, "");

  const exdevRoot = path.join(root, "efs-simulation");
  fs.mkdirSync(exdevRoot, { recursive: true });
  const originalRenameSync = fs.renameSync;
  let exdevRenameAttempts = 0;
  fs.renameSync = (source, destination) => {
    if (path.dirname(path.resolve(source)) === path.resolve(exdevRoot)) {
      exdevRenameAttempts += 1;
      throw Object.assign(new Error(`cross-device link not permitted, rename '${source}' -> '${destination}'`), { code: "EXDEV" });
    }
    return originalRenameSync(source, destination);
  };
  try {
    const encryptedDirectoryAuth = createAdminAuthService({ stateDir: exdevRoot });
    await encryptedDirectoryAuth.bootstrap({ username: "efs-admin", password: "Efs-safe-pass-2026", display_name: "加密目录管理员" });
    const encryptedDirectoryLogin = await encryptedDirectoryAuth.login({ username: "efs-admin", password: "Efs-safe-pass-2026" });
    assert.equal(encryptedDirectoryLogin.actor.display_name, "加密目录管理员");

    const encryptedDirectorySettings = createAdminModelSettingsStore({ stateDir: exdevRoot, env: {} });
    encryptedDirectorySettings.update({ api_key: "sk-efs-first-key", model: "deepseek-v4-flash", thinking: true });
    encryptedDirectorySettings.update({ api_key: "sk-efs-latest-key", model: "deepseek-v4-pro", thinking: false });
    const reloadedEncryptedSettings = createAdminModelSettingsStore({ stateDir: exdevRoot, env: {} });
    assert.equal(reloadedEncryptedSettings.runtime().api_key, "sk-efs-latest-key");
    assert.equal(reloadedEncryptedSettings.runtime().model, "deepseek-v4-pro");
    assert.equal(fs.readdirSync(exdevRoot).some((name) => name.endsWith(".tmp") || name.endsWith(".bak")), false, "EXDEV 回退后不应残留临时或备份文件");
  } finally {
    fs.renameSync = originalRenameSync;
  }
  assert.ok(exdevRenameAttempts >= 4, "回归必须实际经过 EXDEV 文件系统分支");
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

console.log("admin login and private model settings contract ok");
