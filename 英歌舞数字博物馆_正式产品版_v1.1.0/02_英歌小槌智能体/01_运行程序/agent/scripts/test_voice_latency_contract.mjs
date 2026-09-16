import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const app = fs.readFileSync(path.join(root, "01_公众网站", "app.js"), "utf8");
const mugeda = fs.readFileSync(path.join(root, "01_公众网站", "mugeda-agent.js"), "utf8");
const mugedaLoader = fs.readFileSync(path.join(root, "02_英歌小槌智能体", "01_运行程序", "agent", "scripts", "yingge.js"), "utf8");

assert.match(app, /\[应鹰莺\].*英歌/, "网站实时转写应修正‘应歌舞’等同音结果");
assert.match(mugeda, /应歌舞.*英歌舞/, "木疙瘩转写应修正‘应歌舞’");

const awakeFlow = app.slice(app.indexOf("const enterAwakeConversation"), app.indexOf("const enterFollowupWindow"));
assert.ok(awakeFlow.indexOf("beginWakeQuestionWindow") < awakeFlow.indexOf("await closeWakeSession"), "唤醒回应必须先于识别会话重建");
assert.match(app, /wakeChunkLength>=context\.sampleRate\*\.25/, "唤醒音频应以 250ms 小批次低延迟发送");
assert.match(app, /},250\);\s*return true/, "识别终点后的确认等待不得超过 250ms");
assert.match(app, /const submitManualVoiceQuestion=/, "网站语音输入结束后应有统一的自动提交入口");
assert.doesNotMatch(app, /已完成转写，请确认后发送|已识别，请确认后发送/, "网站不应在识别完成后停留等待手动发送");
assert.match(mugeda, /function submitRecognizedVoice\(/, "木疙瘩语音输入结束后应自动提交");
assert.doesNotMatch(mugeda, /识别完成，请确认文字后发送/, "木疙瘩不应在识别完成后停留等待手动发送");
assert.match(mugeda, /\/api\/voice\/session/, "木疙瘩应使用与网站一致的实时语音会话");
assert.match(mugeda, /finish=1/, "木疙瘩结束录音时应显式结束实时识别会话");
assert.doesNotMatch(mugeda, /\/api\/voice\/transcribe/, "木疙瘩不应等待整段 WAV 上传后才开始识别");
assert.match(mugedaLoader, /mugeda-agent\.js\?v=1\.2\.0/, "木疙瘩加载器必须刷新不可变脚本缓存");
assert.match(mugeda, /Array\.from\(question\.replace\(\/\\s\/g, ''\)\)\.length < 2/, "木疙瘩应拦截过短、低可信的识别结果");
assert.doesNotMatch(app, /if\(event==='done'\)\{await typing\?\.complete\(\)/, "微信 WebView 的最终回答不得等待动画帧完成");
assert.match(app, /if\(event==='done'\)\{typing\?\.cancel\(\);renderAgentAnswer/, "收到完成帧时应立即落下完整回答文字");

for (const name of fs.readdirSync(path.join(root, "01_公众网站")).filter(name => name.endsWith(".html"))) {
  const html = fs.readFileSync(path.join(root, "01_公众网站", name), "utf8");
  if (html.includes("app.js?v=")) assert.match(html, /app\.js\?v=1\.2\.0/, `${name} 必须刷新不可变缓存版本`);
}

console.log("voice latency contract tests passed");
