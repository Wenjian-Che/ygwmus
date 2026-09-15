import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createTencentVoiceClient, readTencentCredentialFile } from "../../backend/tencent-voice.mjs";

const unavailable = createTencentVoiceClient({});
assert.equal(unavailable.status().configured, false, "缺少凭据时云端语音必须保持关闭");
assert.equal(unavailable.status().asr.available, false);
assert.equal(unavailable.status().tts.available, false);
assert.equal(JSON.stringify(unavailable.status()).includes("secret"), false, "状态接口不得泄漏凭据");

const cloud = createTencentVoiceClient({
  TENCENT_SECRET_ID: "AKIDexample",
  TENCENT_SECRET_KEY: "example-secret-key",
  TENCENT_APP_ID: "1234567890",
  TENCENT_ASR_ENGINE_MODEL_TYPE: "16k_zh_large",
  TENCENT_TTS_VOICE_TYPE: "603000"
});
const status = cloud.status();
assert.equal(status.configured, true);
assert.equal(status.asr.available, true);
assert.equal(status.asr.engine, "tencent-realtime-asr");
assert.equal(status.asr.engineModelType, "16k_zh_large");
assert.equal(status.tts.available, true);
assert.equal(status.tts.engine, "tencent-tts");
assert.equal(status.tts.voiceType, 603000);
assert.equal(JSON.stringify(status).includes("AKIDexample"), false, "公开状态不得泄漏 SecretId");

const boutique = createTencentVoiceClient({
  TENCENT_SECRET_ID: "AKIDexample", TENCENT_SECRET_KEY: "example-secret-key", TENCENT_APP_ID: "1234567890",
  TENCENT_TTS_VOICE_TYPE: "101030", TENCENT_TTS_SAMPLE_RATE: "16000"
});
assert.equal(boutique.status().tts.voiceType, 101030, "智柯应使用官方精品音色 ID");
assert.equal(boutique.status().tts.sampleRate, 16000, "智柯只应请求 16k 音频");

const credentialFixture = path.join(os.tmpdir(), `yingge-voice-${process.pid}.txt`);
fs.writeFileSync(credentialFixture, "SecretId:\r\nAKIDfixture\r\n\r\nSecretKey:\r\nfixture-secret\r\n\r\nappid:\r\n1234567890\r\n", "utf16le");
const parsedFixture = readTencentCredentialFile(credentialFixture);
fs.unlinkSync(credentialFixture);
assert.equal(parsedFixture.TENCENT_SECRET_ID, "AKIDfixture", "应读取 UTF-16 分行凭据文件");
assert.equal(parsedFixture.TENCENT_SECRET_KEY, "fixture-secret");
assert.equal(parsedFixture.TENCENT_APP_ID, "1234567890");

const requests = [];
const tts = createTencentVoiceClient({
  TENCENT_SECRET_ID: "AKIDexample",
  TENCENT_SECRET_KEY: "example-secret-key",
  TENCENT_APP_ID: "1234567890"
}, {
  fetchFn: async (url, init) => {
    requests.push({ url, init });
    return { ok: true, json: async () => ({ Response: { Audio: Buffer.from("RIFFtest").toString("base64"), RequestId: "request-safe" } }) };
  }
});
const speech = await tts.synthesize("你好，小槌。", { speed: 1.08 });
assert.equal(speech.engine, "tencent-tts");
assert.equal(speech.contentType, "audio/wav");
assert.ok(speech.audio.subarray(0, 4).equals(Buffer.from("RIFF")));
assert.equal(requests.length, 1);
assert.equal(requests[0].url, "https://tts.tencentcloudapi.com/");
assert.equal(requests[0].init.headers["X-TC-Action"], "TextToVoice");
assert.equal(requests[0].init.headers.Authorization.includes("example-secret-key"), false, "签名头不得携带 SecretKey 明文");

const rejected = createTencentVoiceClient({ TENCENT_SECRET_ID: "AKIDexample", TENCENT_SECRET_KEY: "example-secret-key", TENCENT_APP_ID: "1234567890" }, {
  fetchFn: async () => ({ ok: false, json: async () => ({ Response: { Error: { Code: "FailedOperation.ServiceNotOpened" }, RequestId: "request-safe" } }) })
});
await assert.rejects(() => rejected.synthesize("你好"), error => error.code === "TENCENT_TTS_FAILED" && error.providerCode === "FailedOperation.ServiceNotOpened");

const socketLog = { url: "", messages: [] };
class FakeSocket {
  constructor(url) { this.url = url; socketLog.url = url; setTimeout(() => this.onopen?.(), 0); }
  send(message) {
    socketLog.messages.push(message);
    if (message === '{"type":"end"}') setTimeout(() => this.onmessage?.({ data: JSON.stringify({ code: 0, final: 1, result: { voice_text_str: "英歌是什么" } }) }), 0);
  }
  close() { this.onclose?.(); }
}
const asr = createTencentVoiceClient({ TENCENT_SECRET_ID: "AKIDexample", TENCENT_SECRET_KEY: "example-secret-key", TENCENT_APP_ID: "1234567890", TENCENT_ASR_ENGINE_MODEL_TYPE: "Hy-ASR-3.0-preview" }, { WebSocketImpl: FakeSocket });
const recognitionSession = await asr.createRecognitionSession();
const recognition = await recognitionSession.push(Buffer.from([0, 0, 1, 0]), { finish: true });
assert.equal(recognition.text, "英歌是什么");
assert.equal(recognition.engine, "tencent-realtime-asr");
assert.match(socketLog.url, /^wss:\/\/asr\.cloud\.tencent\.com\/asr\/v2\/1234567890\?/);
assert.equal(socketLog.url.includes("example-secret-key"), false, "ASR 请求不得泄漏 SecretKey");
assert.equal(socketLog.url.includes("input_sample_rate"), false, "大模型 2.0 预览引擎仅接收 16k PCM，不应发送不支持的采样率参数");
const hotwords = new URL(socketLog.url).searchParams.get("hotword_list") || "";
for (const term of ["英歌舞", "英歌小槌", "潮汕", "潮阳", "普宁", "揭阳", "脸谱", "槌法", "锣鼓", "阵法"]) {
  assert.match(hotwords, new RegExp(`${term}\\|\\d+`), `腾讯云 ASR 请求应真实携带领域热词：${term}`);
}
assert.equal(new URL(socketLog.url).searchParams.get("reinforce_hotword"), "1");
assert.equal(asr.status().asr.hotwordsConfigured, true, "状态接口应明确告知热词已下发");
const signedUrl = new URL(socketLog.url);
const receivedSignature = signedUrl.searchParams.get("signature");
const rawParameters = [...signedUrl.searchParams.entries()].filter(([key]) => key !== "signature").sort(([a], [b]) => a.localeCompare(b));
const canonicalSource = `asr.cloud.tencent.com${signedUrl.pathname}?${rawParameters.map(([key, value]) => `${key}=${value}`).join("&")}`;
const expectedSignature = crypto.createHmac("sha1", "example-secret-key").update(canonicalSource).digest("base64");
assert.equal(receivedSignature, expectedSignature, "ASR 应按腾讯官方 SDK 规则对排序后的原始参数签名");
assert.equal(socketLog.messages.at(-1), '{"type":"end"}');

socketLog.url = ""; socketLog.messages = [];
const standardAsr = createTencentVoiceClient({ TENCENT_SECRET_ID: "AKIDexample", TENCENT_SECRET_KEY: "example-secret-key", TENCENT_APP_ID: "1234567890", TENCENT_ASR_ENGINE_MODEL_TYPE: "16k_zh" }, { WebSocketImpl: FakeSocket });
const standardSession = await standardAsr.createRecognitionSession();
assert.equal(new URL(socketLog.url).searchParams.has("input_sample_rate"), false, "16k 实时引擎应直接接收 16k PCM，不声明 8k 兼容参数");
standardSession.close();

console.log("tencent voice config tests passed");
