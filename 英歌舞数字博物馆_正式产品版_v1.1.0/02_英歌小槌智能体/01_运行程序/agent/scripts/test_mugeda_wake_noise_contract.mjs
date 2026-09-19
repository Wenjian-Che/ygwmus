import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const mugeda = fs.readFileSync(path.join(root, "01_公众网站", "mugeda-agent.js"), "utf8");

assert.match(mugeda, /mugedaWakeNoiseFloor/, "木疙瘩唤醒必须维护环境噪声基线");
assert.match(mugeda, /mugedaWakeEchoGuardUntil/, "木疙瘩唤醒必须有短暂回声抑制窗口");
assert.match(mugeda, /likelyVoice/, "只有明显语音能量的唤醒结果才可进入会话");
assert.match(mugeda, /function primeMugedaAudioOutput\(/, "设置或点按语音时必须尝试解锁移动端音频输出");
assert.match(mugeda, /wakeSetting\.onclick[\s\S]*primeMugedaAudioOutput\(\)/, "用户主动开启页面唤醒时必须执行音频解锁");

console.log("mugeda wake noise contract tests passed");
