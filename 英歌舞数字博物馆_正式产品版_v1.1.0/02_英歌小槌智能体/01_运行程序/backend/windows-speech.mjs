import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const MAX_WAVE_BYTES = 4 * 1024 * 1024;

export function windowsSpeechAvailable() {
  return process.platform === "win32" && process.env.LOCAL_WINDOWS_SPEECH !== "false";
}

function assertWave(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 44) throw Object.assign(new Error("音频数据无效"), { code: "INVALID_AUDIO" });
  if (buffer.length > MAX_WAVE_BYTES) throw Object.assign(new Error("录音时间过长"), { code: "AUDIO_TOO_LARGE" });
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw Object.assign(new Error("只支持 PCM WAV 音频"), { code: "INVALID_AUDIO_FORMAT" });
  }
}

export function transcribeWaveBuffer(buffer, { timeoutMs = 15000 } = {}) {
  assertWave(buffer);
  if (!windowsSpeechAvailable()) throw Object.assign(new Error("本机中文语音识别不可用"), { code: "LOCAL_SPEECH_UNAVAILABLE" });

  const wavePath = path.join(os.tmpdir(), `yingge-stt-${crypto.randomUUID()}.wav`);
  const escapedPath = wavePath.replaceAll("'", "''");
  const script = [
    "[Console]::OutputEncoding=[Text.Encoding]::UTF8",
    "Add-Type -AssemblyName System.Speech",
    "$info=[System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers() | Where-Object {$_.Culture.Name -eq 'zh-CN'} | Select-Object -First 1",
    "if(-not $info){throw 'ZH_RECOGNIZER_NOT_FOUND'}",
    "$engine=New-Object System.Speech.Recognition.SpeechRecognitionEngine -ArgumentList $info",
    "$grammar=New-Object System.Speech.Recognition.DictationGrammar",
    "$engine.LoadGrammar($grammar)",
    `$engine.SetInputToWaveFile('${escapedPath}')`,
    "$result=$engine.Recognize([TimeSpan]::FromSeconds(12))",
    "if($result){[pscustomobject]@{text=$result.Text;confidence=[Math]::Round($result.Confidence,4);engine='windows-system-speech'} | ConvertTo-Json -Compress}else{[pscustomobject]@{text='';confidence=0;engine='windows-system-speech'} | ConvertTo-Json -Compress}",
    "$engine.Dispose()"
  ].join(";");

  fs.writeFileSync(wavePath, buffer);
  try {
    const encoded = Buffer.from(script, "utf16le").toString("base64");
    const run = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", encoded], {
      encoding: "utf8",
      windowsHide: true,
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024
    });
    if (run.error) throw Object.assign(new Error(run.error.message), { code: run.error.code === "ETIMEDOUT" ? "SPEECH_TIMEOUT" : "LOCAL_SPEECH_FAILED" });
    if (run.status !== 0) throw Object.assign(new Error(String(run.stderr || run.stdout || "本机语音识别失败").trim()), { code: "LOCAL_SPEECH_FAILED" });
    const line = String(run.stdout || "").trim().split(/\r?\n/).filter(Boolean).at(-1);
    let result;
    try { result = JSON.parse(line || "{}"); } catch { throw Object.assign(new Error("本机语音识别返回无效结果"), { code: "LOCAL_SPEECH_FAILED" }); }
    return {
      text: String(result.text || "").trim(),
      confidence: Number(result.confidence || 0),
      engine: "windows-system-speech"
    };
  } finally {
    try { fs.rmSync(wavePath, { force: true }); } catch {}
  }
}

export const speechLimits = { maxWaveBytes: MAX_WAVE_BYTES };
