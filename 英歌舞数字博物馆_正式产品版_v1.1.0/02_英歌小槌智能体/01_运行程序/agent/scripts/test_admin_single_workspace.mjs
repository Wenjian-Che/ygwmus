import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const adminRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "01_公众网站", "admin");
const index = fs.readFileSync(path.join(adminRoot, "workspace.html"), "utf8");
const shell = fs.readFileSync(path.join(adminRoot, "admin-shell.js"), "utf8");

const expectedNavigation = ["总览", "网站内容", "真实素材", "智能助手", "知识反馈", "设置"];
const labels = [...shell.matchAll(/label:\s*"([^"]+)"/g)].map((match) => match[1]);
const hrefs = [...shell.matchAll(/href:\s*"([^"]+)"/g)].map((match) => match[1]);
assert.deepEqual(labels, expectedNavigation, "后台一级导航必须是单工作台的六个区域");
assert.ok(hrefs.every((href) => href.startsWith("workspace.html#")), "一级导航不得再跳到独立后台页面");
assert.doesNotMatch(shell, /assistant\.html|plans\.html|content\.html"|curation\.html"/);

for (const panel of ["overview", "content", "materials", "assistant", "knowledge", "settings"]) {
  assert.match(index, new RegExp(`data-workspace-panel=["']${panel}["']`), `缺少 ${panel} 工作区`);
}
assert.match(index, /content\.html\?embedded=1/);
assert.match(index, /curation\.html\?embedded=1/);
assert.match(index, /id=["']planHistory["']/);
assert.match(index, /id=["']modelSettingsForm["']/);
assert.match(index, /id=["']authGate["']/);
assert.match(index, /id=["']loginForm["']/);
assert.match(index, /id=["']setupForm["']/);
assert.doesNotMatch(index, /id=["']adminToken["']|管理 Token|保存凭据/);

console.log("single admin workspace source contract ok");
