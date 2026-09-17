import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const app = fs.readFileSync(path.join(root, "01_公众网站", "app.js"), "utf8");
const mugeda = fs.readFileSync(path.join(root, "01_公众网站", "mugeda-agent.js"), "utf8");
const mugedaLoader = fs.readFileSync(path.join(root, "02_英歌小槌智能体", "01_运行程序", "agent", "scripts", "yingge.js"), "utf8");
const wakeAck = fs.readFileSync(path.join(root, "01_公众网站", "assets", "voice", "xiaochui-wake-response.wav"));
const wakeAckManifest = JSON.parse(fs.readFileSync(path.join(root, "01_公众网站", "assets", "voice", "xiaochui-wake-response.json"), "utf8"));

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
assert.match(mugedaLoader, /script\.src\s*=\s*["']https:\/\/yinggemus\.cn\/mugeda-agent\.js["']/, "木疙瘩加载器必须指向稳定的正式脚本地址");
assert.doesNotMatch(mugedaLoader, /mugeda-agent\.js\?v=/, "稳定脚本地址不能依赖人工递增查询参数刷新缓存");
assert.match(mugeda, /Array\.from\(question\.replace\(\/\\s\/g, ''\)\)\.length < 2/, "木疙瘩应拦截过短、低可信的识别结果");
assert.doesNotMatch(app, /if\(event==='done'\)\{await typing\?\.complete\(\)/, "微信 WebView 的最终回答不得等待动画帧完成");
assert.match(app, /if\(event==='done'\)\{typing\?\.cancel\(\);renderAgentAnswer/, "收到完成帧时应立即落下完整回答文字");
assert.match(app, /WAKE_TRIGGER_COOLDOWN_MS/, "重复唤醒应有短时去重保护");
assert.match(app, /wakeNoiseFloor/, "唤醒输入应使用自适应环境噪声门限");
assert.match(app, /wakeEchoGuardUntil/, "系统回应结束后应抑制短暂回声尾音");
const speakFlow = app.slice(app.indexOf("const speak=async"), app.indexOf("const bind="));
assert.match(speakFlow, /await armWakeDuringSpeech\(\)/, "朗读开始前必须等待打断监听会话就绪");
assert.ok(speakFlow.indexOf("await armWakeDuringSpeech()") < speakFlow.indexOf("currentAudio.play()"), "打断监听必须早于音频播放就绪");
assert.match(app, /reportVoiceEvent\('speech_interrupted'/, "成功语音打断必须留下匿名诊断事件");
assert.match(app, /if\(followup\)wakeDetectedAt=0/, "普通追问窗口不得沿用上一次唤醒时间");
assert.match(app, /voiceApi\+'\/events'/, "网站应上报匿名唤醒质量事件");
for (const event of ["wake_started", "wake_detected", "wake_timeout", "question_submitted", "wake_duplicate_suppressed", "asr_fallback"]) assert.match(app, new RegExp(event), `缺少匿名语音事件：${event}`);
assert.match(app, /voiceStatus\('小槌我在','awake'\)/, "唤醒回应文案应只有‘小槌我在’");
assert.match(app, /xiaochui-wake-response\.wav\?v=1\.2\.2/, "短唤醒回应必须刷新不可变音频缓存");
assert.doesNotMatch(app, /小槌我在，有什么|小槌我在，回应结束后请开始说/, "唤醒回应不得附加服务式长句");

assert.equal(wakeAck.subarray(0, 4).toString("ascii"), "RIFF", "唤醒回应必须是 WAV");
const sampleRate = wakeAck.readUInt32LE(24);
const dataSize = wakeAck.readUInt32LE(40);
const channels = wakeAck.readUInt16LE(22);
const bits = wakeAck.readUInt16LE(34);
const wakeAckSeconds = dataSize / (sampleRate * channels * (bits / 8));
assert.ok(wakeAckSeconds >= .35 && wakeAckSeconds <= 1.8, `‘小槌我在’回应应简短，当前 ${wakeAckSeconds.toFixed(2)} 秒`);
assert.equal(wakeAckManifest.text, "小槌我在", "唤醒音频清单不得包含额外服务式问句");
assert.equal(crypto.createHash("sha256").update(wakeAck).digest("hex"), wakeAckManifest.sha256, "唤醒音频必须与‘小槌我在’审核清单一致");

for (const name of fs.readdirSync(path.join(root, "01_公众网站")).filter(name => name.endsWith(".html"))) {
  const html = fs.readFileSync(path.join(root, "01_公众网站", name), "utf8");
  if (html.includes("app.js?v=")) assert.match(html, /app\.js\?v=1\.5\.2/, `${name} 必须刷新不可变缓存版本`);
}

console.log("voice latency contract tests passed");
