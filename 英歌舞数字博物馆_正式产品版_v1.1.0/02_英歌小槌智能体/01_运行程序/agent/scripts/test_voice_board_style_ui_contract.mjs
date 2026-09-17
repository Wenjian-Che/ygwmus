import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
for (const name of ["app.js", "mugeda-agent.js"]) {
  const source = fs.readFileSync(path.join(root, "01_公众网站", name), "utf8");
  assert.match(source, /中快\[班版办\]/, `${name} 必须显示层兜底校正‘中快班’`);
  assert.match(source, /\(\[快慢中\]\)\[班版办\]/, `${name} 必须显示层兜底校正快/慢/中板同音字`);
}

console.log("voice board style UI contract tests passed");
