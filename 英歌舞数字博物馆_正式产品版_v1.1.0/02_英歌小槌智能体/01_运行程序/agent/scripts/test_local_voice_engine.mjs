import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_TTS_SID,
  createLocalVoiceEngine,
  normalizeWakeTranscript,
  transcriptHasWakeWord
} from "../../backend/local-voice.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const engine = createLocalVoiceEngine({ rootDir: root });
assert.equal(DEFAULT_TTS_SID, 75, "小槌默认音色应使用 Kokoro 更轻快的中文男声 zm_041");
const status = engine.status();

assert.equal(status.asr.available, true, "中文本地 ASR 模型应可用");
assert.equal(status.tts.available, true, "中文本地 TTS 模型应可用");
assert.equal(status.tts.engine, "sherpa-onnx-kokoro-zh", "朗读应使用 24kHz Kokoro 中文多音色模型");
assert.equal(status.tts.speakers, 103, "Kokoro 中文模型应提供 103 个可选音色");
assert.equal(status.wake.engine, "sherpa-onnx-kws-ppinyin", "唤醒词必须由专用拼音 KWS 模型识别");
assert.equal(normalizeWakeTranscript("小锤，小锤！"), "小槌小槌");
assert.equal(transcriptHasWakeWord("你好，小槌小槌"), true);
assert.equal(transcriptHasWakeWord("小崔，小崔"), true, "应容忍普通话识别器对“槌”的常见同音误识别");
assert.equal(transcriptHasWakeWord("我想了解英歌"), false);

const asrModelDir = path.join(root, "backend/models/sherpa-onnx-streaming-zipformer-zh-int8-2025-06-30");
const sampleWave = fs.readdirSync(path.join(asrModelDir, "test_wavs")).find(name => name.endsWith(".wav"));
assert.ok(sampleWave, "ASR 模型应带有测试音频");
const recognition = engine.transcribeWave(fs.readFileSync(path.join(asrModelDir, "test_wavs", sampleWave)));
assert.ok(recognition.text.length > 0, "本地 ASR 应返回文字");
assert.equal(recognition.engine, "sherpa-onnx-zipformer-zh");

const speech = await engine.synthesize("你好，我是英歌小槌。", { speed: 0.98 });
assert.equal(speech.engine, "sherpa-onnx-kokoro-zh");
assert.equal(speech.contentType, "audio/wav");
assert.ok(speech.audio.subarray(0, 4).equals(Buffer.from("RIFF")), "TTS 应返回 WAV");
assert.ok(speech.audio.length > 1024, "TTS 音频不应为空");
assert.ok(speech.sampleRate >= 24000, "小槌朗读不应再使用 8kHz 低清语音");

console.log(JSON.stringify({ status, recognition, ttsBytes: speech.audio.length }, null, 2));
