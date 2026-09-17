import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const backend = fs.readFileSync(path.join(root, "02_英歌小槌智能体", "01_运行程序", "backend", "server.mjs"), "utf8");
const tencent = fs.readFileSync(path.join(root, "02_英歌小槌智能体", "01_运行程序", "backend", "tencent-voice.mjs"), "utf8");
const golden = JSON.parse(fs.readFileSync(path.join(root, "02_英歌小槌智能体", "02_正式知识库", "governance", "golden_answers.json"), "utf8"));

for (const term of ["快板", "慢板", "中板", "中快板", "板式", "鼓点", "槌长", "击槌", "步法", "身法", "前棚", "后棚", "司鼓"]) {
  assert.ok(tencent.includes(`${term}|`), `腾讯 ASR 临时热词必须包含领域词：${term}`);
}

assert.match(backend, /key: "style"/, "快/慢/中板比较必须走专用板式路由");
assert.match(backend, /style: "performance\.style"/, "板式路由必须映射到正式知识库的 performance.style 意图");
assert.match(backend, /14_快板中板慢板详解\.md/, "板式问题必须优先检索正式板式资料");
assert.match(backend, /53_地区板式队伍比较矩阵\.md/, "板式问题必须同时带入地区/队伍边界资料");

const richAnswer = golden.items.find((item) => item.id === "gold-091");
assert.ok(richAnswer?.aliases?.includes("英歌舞里的快板和慢板有什么区别"), "自然问法必须优先使用完整的板式比较答案");
assert.ok(Number(richAnswer?.priority) >= 100, "完整板式比较答案必须高于旧的泛化答案");

console.log("board style routing contract tests passed");
