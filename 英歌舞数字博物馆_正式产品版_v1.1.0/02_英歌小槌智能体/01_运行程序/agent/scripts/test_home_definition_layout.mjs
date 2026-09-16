import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const script = fs.readFileSync(path.join(root, "01_公众网站", "home-story.js"), "utf8");
const css = fs.readFileSync(path.join(root, "01_公众网站", "home-story.css"), "utf8");
const knowledge = fs.readFileSync(path.join(root, "01_公众网站", "knowledge.js"), "utf8");
const exhibit = fs.readFileSync(path.join(root, "01_公众网站", "exhibit-depth.js"), "utf8");

for (const key of ["body", "clubs", "sound", "role", "space"]) {
  assert.match(script, new RegExp(`data-definition=["']${key}["']`), `缺少 ${key} 导览入口`);
}
assert.match(script, /definition-stage-guide/, "导览图应明确提示可以点击切换视角");
assert.match(script, /definition-readout-label/, "阅读条应显示当前视角名称");
assert.match(css, /\.home-definition-stage\s*\{[^}]*padding:/s, "桌面导览舞台应设置安全内边距，防止标签裁切");
assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.home-definition-stage\s*\{[^}]*display:\s*grid/s, "手机端应使用稳定网格而不是拥挤的绝对定位");
assert.doesNotMatch(css, /\.point-(?:clubs|sound)\s*\{\s*right:\s*0(?:px|%|;)/, "右侧入口不得贴边裁切");
assert.doesNotMatch(script, /onComplete:\s*\(\)\s*=>\s*\{\s*updateReadout\(\)/, "首页选中态与说明文字不得依赖动画完成");
assert.doesNotMatch(knowledge, /onComplete:\s*\(\)\s*=>\s*\{\s*update\(\)/, "知识树选中态与说明文字不得依赖动画完成");
assert.doesNotMatch(knowledge, /onComplete:\s*\(\)\s*=>\s*\{\s*writeCase\(copy\)/, "队伍个案选中态与内容不得依赖动画完成");
assert.doesNotMatch(exhibit, /onComplete:\s*update/, "展厅切换内容不得依赖动画完成");

console.log("home definition layout contract tests passed");
