import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const port = 8791;
const child = spawn(process.execPath, ["backend/server.mjs"], {
  cwd: root,
  env: { ...process.env, AGENT_PORT: String(port), LOCAL_WINDOWS_SPEECH: "false", TENCENT_CREDENTIALS_FILE: "" },
  stdio: ["ignore", "pipe", "pipe"]
});

function pcmFromWave(wave) {
  const data = wave.indexOf(Buffer.from("data"));
  if (data < 0) throw new Error("test wave has no data chunk");
  return {
    sampleRate: wave.readUInt32LE(24),
    pcm: wave.subarray(data + 8, data + 8 + wave.readUInt32LE(data + 4))
  };
}

async function waitForServer() {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 120));
  }
  throw new Error("voice API test server did not start");
}

try {
  await waitForServer();
  const statusResponse = await fetch(`http://127.0.0.1:${port}/api/voice/status`, { headers: { "x-app-id": "yingge-h5" } });
  assert.equal(statusResponse.status, 200);
  const status = await statusResponse.json();
  assert.equal(status.asr.available, true);
  assert.equal(status.wake.phrase, "小槌小槌");
  assert.equal(status.tts.available, true);
  assert.equal(status.tts.engine, "sherpa-onnx-kokoro-zh");
  assert.equal(status.tts.sampleRate, 24000);
  assert.equal(status.tts.defaultSid, 75);

  const asrDir = path.join(root, "backend/models/sherpa-onnx-streaming-zipformer-zh-int8-2025-06-30/test_wavs");
  const sample = fs.readdirSync(asrDir).find(name => name.endsWith(".wav"));
  const sampleBuffer = fs.readFileSync(path.join(asrDir, sample));
  const live = await fetch(`http://127.0.0.1:${port}/api/voice/session`, { method: "POST", headers: { "content-type": "application/json", "x-app-id": "yingge-h5" }, body: JSON.stringify({ mode: "transcribe" }) });
  assert.equal(live.status, 201);
  const liveSession = await live.json();
  assert.ok(liveSession.session_id);
  assert.equal(liveSession.mode, "transcribe");
  const raw = pcmFromWave(sampleBuffer);
  const liveResultResponse = await fetch(`http://127.0.0.1:${port}/api/voice/session/${liveSession.session_id}/chunk?sample_rate=${raw.sampleRate}&finish=1`, {
    method: "POST",
    headers: { "content-type": "application/octet-stream", "x-app-id": "yingge-h5" },
    body: raw.pcm
  });
  assert.equal(liveResultResponse.status, 200);
  const liveResult = await liveResultResponse.json();
  assert.ok(liveResult.text);
  assert.equal(liveResult.awake, false);
  const closeLive = await fetch(`http://127.0.0.1:${port}/api/voice/session/${liveSession.session_id}`, { method: "DELETE", headers: { "x-app-id": "yingge-h5" } });
  assert.equal(closeLive.status, 204);

  const wakeSessionResponse = await fetch(`http://127.0.0.1:${port}/api/voice/session`, { method: "POST", headers: { "content-type": "application/json", "x-app-id": "yingge-h5" }, body: JSON.stringify({ mode: "wake" }) });
  assert.equal(wakeSessionResponse.status, 201);
  const wakeSession = await wakeSessionResponse.json();
  assert.equal(wakeSession.mode, "wake");
  const closeWake = await fetch(`http://127.0.0.1:${port}/api/voice/session/${wakeSession.session_id}`, { method: "DELETE", headers: { "x-app-id": "yingge-h5" } });
  assert.equal(closeWake.status, 204);

  const transcribeResponse = await fetch(`http://127.0.0.1:${port}/api/voice/transcribe`, {
    method: "POST",
    headers: { "content-type": "audio/wav", "x-app-id": "yingge-h5" },
    body: sampleBuffer
  });
  assert.equal(transcribeResponse.status, 200);
  const recognition = await transcribeResponse.json();
  assert.equal(recognition.engine, "sherpa-onnx-zipformer-zh");
  assert.ok(recognition.text);

  const speechResponse = await fetch(`http://127.0.0.1:${port}/api/voice/synthesize`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-app-id": "yingge-h5" },
    body: JSON.stringify({ text: "你好，我是英歌小槌。", speed: 1.04 })
  });
  assert.equal(speechResponse.status, 200);
  assert.match(speechResponse.headers.get("content-type") || "", /^audio\/wav/);
  const audio = Buffer.from(await speechResponse.arrayBuffer());
  assert.ok(audio.subarray(0, 4).equals(Buffer.from("RIFF")));
  assert.equal(audio.readUInt32LE(24), 24000);

  console.log(JSON.stringify({ status, recognition, ttsBytes: audio.length }, null, 2));
} finally {
  child.kill();
}
