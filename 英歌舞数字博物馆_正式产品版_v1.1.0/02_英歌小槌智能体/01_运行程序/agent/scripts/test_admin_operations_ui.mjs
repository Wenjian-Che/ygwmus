import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const html = fs.readFileSync(path.join(root, "web", "admin", "content.html"), "utf8");
const script = fs.readFileSync(path.join(root, "web", "admin", "content.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "web", "admin", "content.css"), "utf8");
const publicScript = fs.readFileSync(path.join(root, "web", "app.js"), "utf8");
const overviewScript = fs.readFileSync(path.join(root, "web", "admin", "admin.js"), "utf8");
const shellScript = fs.readFileSync(path.join(root, "web", "admin", "admin-shell.js"), "utf8");

for (const label of ["内容运营", "首页内容", "实时预览", "连接诊断", "保存草稿", "确认发布", "一键检查整条连接", "不会调用计费模型", "知识运行时", "知识源与重建"]) {
  assert.match(`${html}\n${script}`, new RegExp(label), `后台缺少“${label}”`);
}
for (const id of ["contentForm", "previewFrame", "previewContent", "saveDraft", "publishContent", "runDiagnostics", "diagnosticSummary", "diagnosticChecks", "authNotice"]) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `后台缺少 #${id}`);
}
assert.match(shellScript, /id="actorState"/, "统一后台壳缺少 #actorState");
assert.match(script, /api\/admin\/site-content\/preview/);
assert.match(script, /api\/admin\/site-content\/draft/);
assert.match(script, /api\/admin\/site-content\/publish/);
assert.match(script, /api\/admin\/diagnostics\/run/);
assert.match(script, /postMessage/);
assert.match(script, /expected_version/);
assert.match(script, /response\.status\s*===\s*409|SITE_CONTENT_VERSION_CONFLICT/);
assert.doesNotMatch(script, /已保存本机草稿|localStorage\.setItem\(['"]yingge-site-content/, "后台断线时不得把本机缓存伪装成已保存草稿");
assert.doesNotMatch(html, /B 端|DRAFT|接入预留|保存并发布/, "运营后台不应暴露开发占位话术或合并草稿与发布");
assert.match(styles, /@media\s*\(max-width:\s*760px\)/);
assert.match(styles, /:focus-visible/);
assert.match(publicScript, /yingge:site-content-preview/);
assert.match(publicScript, /resolveYinggeApiBase/);
assert.doesNotMatch(publicScript, /http:\/\/127\.0\.0\.1:8787\/api\/(?:site-content|agent|health|voice)/, "公众前台不能把生产 API 固定到访问者本机");
assert.doesNotMatch(overviewScript, /const API\s*=\s*['"]http:\/\/127\.0\.0\.1:8787/, "后台总览也必须使用安全的 API 地址解析");
assert.match(shellScript, /网站内容/);
assert.match(shellScript, /workspace\.html#materials/);
assert.match(overviewScript, /&lt;/, "问题聚类文字必须经过 HTML 转义");

console.log("admin visual editor and diagnostics UI contract ok");
