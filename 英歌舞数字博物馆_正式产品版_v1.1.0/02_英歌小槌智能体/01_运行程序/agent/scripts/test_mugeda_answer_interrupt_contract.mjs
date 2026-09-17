import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const mugeda = fs.readFileSync(path.join(root, "01_公众网站", "mugeda-agent.js"), "utf8");

assert.match(mugeda, /var part = await reader\.read\(\); if \(answerRun !== activeAnswerRun\) return; if \(part\.done\) break;/, "被唤醒打断的流式旧回答必须立即退出，不能继续渲染或朗读");
assert.match(mugeda, /if \(!mugedaWakeTransitioning\) setStatus\('已准备倾听新的问题'\)/, "旧回答中止不得覆盖‘小槌我在’的唤醒状态");

console.log("mugeda answer interrupt contract tests passed");
