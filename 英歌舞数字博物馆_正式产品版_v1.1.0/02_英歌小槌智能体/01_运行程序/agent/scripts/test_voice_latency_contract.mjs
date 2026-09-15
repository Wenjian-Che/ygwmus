import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const app = fs.readFileSync(path.join(root, "01_公众网站", "app.js"), "utf8");
const mugeda = fs.readFileSync(path.join(root, "01_公众网站", "mugeda-agent.js"), "utf8");

assert.match(app, /\[应鹰莺\].*英歌/, "网站实时转写应修正‘应歌舞’等同音结果");
assert.match(mugeda, /应歌舞.*英歌舞/, "木疙瘩转写应修正‘应歌舞’");

const awakeFlow = app.slice(app.indexOf("const enterAwakeConversation"), app.indexOf("const enterFollowupWindow"));
assert.ok(awakeFlow.indexOf("beginWakeQuestionWindow") < awakeFlow.indexOf("await closeWakeSession"), "唤醒回应必须先于识别会话重建");
assert.match(app, /wakeChunkLength>=context\.sampleRate\*\.25/, "唤醒音频应以 250ms 小批次低延迟发送");
assert.match(app, /},250\);\s*return true/, "识别终点后的确认等待不得超过 250ms");

console.log("voice latency contract tests passed");
