import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The formal package keeps the public site beside the agent runtime, not in runtime/web.
const publicRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "01_公众网站");
const adminRoot = path.join(publicRoot, "admin");
const pages = new Map([
  ["workspace.html", "workspace"],
  ["index.html", "overview"],
  ["content.html", "content"],
  ["curation.html", "curation"],
  ["assistant.html", "assistant"],
  ["plans.html", "plans"],
]);

for (const [file, active] of pages) {
  const html = fs.readFileSync(path.join(adminRoot, file), "utf8");
  assert.match(html, /href="admin-shell\.css(?:\?[^"']*)?"/, `${file} 必须加载统一后台样式`);
  assert.match(html, /src="admin-shell\.js(?:\?[^"']*)?"/, `${file} 必须加载统一后台导航`);
  assert.equal((html.match(/data-admin-shell/g) || []).length, 1, `${file} 只能有一个后台主侧栏`);
  assert.match(html, new RegExp(`data-admin-page="${active}"`), `${file} 必须声明唯一当前栏目`);
  assert.doesNotMatch(html, /class="(?:admin-rail|content-rail|assistant-sidebar|ops-rail|plans-rail)"/, `${file} 仍包含旧侧栏`);
}

const shell = fs.readFileSync(path.join(adminRoot, "admin-shell.js"), "utf8");
const expectedOrder = ["总览", "网站内容", "真实素材", "智能助手", "知识反馈", "设置"];
let cursor = -1;
for (const label of expectedOrder) {
  const next = shell.indexOf(label);
  assert.ok(next > cursor, `统一导航缺少或顺序错误：${label}`);
  cursor = next;
}
assert.doesNotMatch(shell, />\s*(?:01|02|03|04|05|06|07|08)\s*</, "主导航不应再使用混乱的编号");

const indexScript = fs.readFileSync(path.join(adminRoot, "admin.js"), "utf8");
assert.doesNotMatch(indexScript, /insertAdjacentHTML\([^\n]+(?:content\.html|curation\.html|assistant\.html|plans\.html)/, "总览页不得运行时追加另一套主导航");

for (const file of ["admin.js", "admin-base.js", "content.js", "curation-v2.js", "assistant.js", "plans.js"]) {
  const source = fs.readFileSync(path.join(adminRoot, file), "utf8");
  assert.doesNotMatch(source, /(?:const|let|var)\s+API\s*=\s*['"]http:\/\/127\.0\.0\.1:8787/, `${file} 不得维护另一套固定服务地址`);
}
assert.match(shell, /apiBase/, "统一后台壳必须向业务模块提供同一服务地址");
assert.doesNotMatch(shell, /href:\s*"(?:assistant|plans|content|curation)\.html/, "一级导航不得再跳到独立后台页面");
assert.match(shell, /location\.replace\(`workspace\.html#/, "旧后台地址必须回到统一工作台");

const workspace = fs.readFileSync(path.join(adminRoot, "workspace.html"), "utf8");
assert.match(workspace, /id="workspaceAssistantForm"/, "智能助手必须位于统一工作台内");
assert.match(workspace, /id="planHistory"/, "方案历史必须位于助手工作区内");
assert.match(workspace, /content\.html\?embedded=1/, "网站内容编辑器必须嵌入统一工作台");
assert.match(workspace, /curation\.html\?embedded=1/, "真实素材编辑器必须嵌入统一工作台");

const curation = fs.readFileSync(path.join(adminRoot, "curation.html"), "utf8");
assert.match(curation, /data-admin-local-nav/, "策展锚点应作为页内导航保留在工作区中");

console.log("admin unified shell source contract ok");
