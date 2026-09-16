import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const app = fs.readFileSync(path.join(root, "01_公众网站", "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "01_公众网站", "guide-agent.css"), "utf8");

assert.match(app, /className='guide-info'/, "隐私与回答说明应渐进披露");
assert.match(app, /visualViewport\?\.height/, "移动端面板应跟随软键盘后的可视视口");
assert.match(app, /guide-agent\.css\?v=1\.4\.0/, "导览样式必须刷新不可变缓存");
assert.match(css, /\.voice-control-row \[hidden\] \{ display: none !important; \}/, "隐藏的停止按钮不得占据移动端空间");
assert.match(css, /height: var\(--guide-viewport-height,100dvh\)/, "手机面板应使用实时可视高度");
assert.match(css, /grid-template-columns: repeat\(3,minmax\(0,1fr\)\)/, "手机语音操作应保持紧凑三列");
assert.match(css, /@media \(min-width: 701px\) and \(max-width: 1024px\)/, "平板必须有独立布局断点");

console.log("responsive agent UI contract tests passed");
