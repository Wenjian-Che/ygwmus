import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createStore } from "../../backend/store.mjs";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "yingge-voice-metrics-"));
const store = await createStore(dir, { requirePersistent: true });
try {
  store.recordVoiceEvent({ app_id: "yingge-h5", event: "wake_detected", engine: "sherpa-onnx-kws-ppinyin", latency_ms: 420, device_class: "mobile", transcript: "不得保存这段文字" });
  store.recordVoiceEvent({ app_id: "yingge-h5", event: "question_submitted", engine: "tencent-realtime-asr", latency_ms: 1320, device_class: "mobile" });
  store.recordVoiceEvent({ app_id: "yingge-h5", event: "wake_timeout", engine: "sherpa-onnx-kws-ppinyin", latency_ms: 9000, device_class: "mobile" });
  const metrics = store.voiceMetrics(24);
  assert.equal(metrics.total, 3);
  assert.equal(metrics.by_event.wake_detected, 1);
  assert.equal(metrics.by_event.question_submitted, 1);
  assert.equal(metrics.by_event.wake_timeout, 1);
  assert.equal(metrics.wake_to_question_rate, .5);
  assert.equal(JSON.stringify(metrics).includes("不得保存"), false, "语音指标不得保存或返回转写文本");
} finally {
  store.close();
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("voice telemetry tests passed");
