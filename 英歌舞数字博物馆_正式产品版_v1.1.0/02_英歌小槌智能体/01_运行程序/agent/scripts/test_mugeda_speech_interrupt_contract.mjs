import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const mugeda = fs.readFileSync(path.join(root, "01_公众网站", "mugeda-agent.js"), "utf8");
const speech = mugeda.slice(mugeda.indexOf("function splitMugedaSpeechText"), mugeda.indexOf("function appendMessage"));

assert.match(mugeda, /function splitMugedaSpeechText\(/, "木疙瘩长回答必须先按句拆分，不能等待整段合成完毕");
assert.match(mugeda, /function armMugedaWakeDuringSpeech\(/, "朗读前必须显式建立可打断的唤醒监听");
assert.match(speech, /await armMugedaWakeDuringSpeech\(\)/, "唤醒监听必须在朗读音频播放前就绪");
assert.ok(speech.indexOf("await armMugedaWakeDuringSpeech()") < speech.indexOf(".play()"), "不能先播放再建立打断监听");
assert.match(mugeda, /朗读合成失败/, "朗读合成故障必须给出可辨识的状态");
assert.match(mugeda, /浏览器阻止朗读/, "微信/浏览器阻止自动播放时必须给出可辨识的状态");
assert.match(mugeda, /parts\.filter\(Boolean\)\.slice\(0, 6\)/, "分段朗读必须受总段数限制，避免撞上公共 TTS 限流");

console.log("mugeda speech interrupt contract tests passed");
