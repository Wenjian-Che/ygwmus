import assert from "node:assert/strict";
import { createRealtimeVoiceSession } from "../../backend/realtime-voice-session.mjs";

const localCalls = [];
const localVoice = {
  createSession({ mode }) { localCalls.push(mode); return { local: true, mode }; }
};
const cloudSession = { push() {} };
const cloudVoice = {
  status() { return { asr: { available: true } }; },
  async createRecognitionSession() { return cloudSession; }
};

const transcribe = await createRealtimeVoiceSession({ mode: "transcribe", localVoice, cloudVoice });
assert.equal(transcribe.provider, "tencent", "实时问题转写必须优先走带热词的腾讯 ASR");
assert.equal(transcribe.session, cloudSession);
assert.deepEqual(localCalls, []);

const wake = await createRealtimeVoiceSession({ mode: "wake", localVoice, cloudVoice });
assert.equal(wake.provider, "local", "唤醒词继续使用低延迟本地 KWS");
assert.deepEqual(localCalls, ["wake"]);

const fallback = await createRealtimeVoiceSession({
  mode: "transcribe",
  localVoice,
  cloudVoice: { status: () => ({ asr: { available: true } }), createRecognitionSession: async () => { throw new Error("cloud down"); } }
});
assert.equal(fallback.provider, "local", "腾讯建连失败时必须明确回退本地识别");
assert.equal(fallback.fallback, true);

console.log("realtime voice provider tests passed");
