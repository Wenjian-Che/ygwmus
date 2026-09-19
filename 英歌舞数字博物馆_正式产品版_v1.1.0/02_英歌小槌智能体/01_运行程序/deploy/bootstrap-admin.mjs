#!/usr/bin/env node
// Create the first local administrator through the loopback-only API. It
// intentionally never accepts a password from the command line or logs one.
const endpoint = process.env.YINGGE_ADMIN_SETUP_URL || "http://127.0.0.1:8787/api/admin/auth/setup";
const username = String(process.env.YINGGE_ADMIN_USERNAME || "").trim();
const password = String(process.env.YINGGE_ADMIN_PASSWORD || "");
const displayName = String(process.env.YINGGE_ADMIN_DISPLAY_NAME || username).trim();

if (!username || !password) {
  console.error("请在当前终端临时设置 YINGGE_ADMIN_USERNAME 和 YINGGE_ADMIN_PASSWORD 后再执行；不要把密码写入命令历史或环境文件。");
  process.exitCode = 64;
} else {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password, display_name: displayName }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error(JSON.stringify({ ok: false, status: response.status, code: body.code || "ADMIN_SETUP_FAILED", message: body.message || "首次管理员创建失败" }));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ ok: true, actor: body.actor || null, expires_at: body.expires_at || null }));
  }
}
