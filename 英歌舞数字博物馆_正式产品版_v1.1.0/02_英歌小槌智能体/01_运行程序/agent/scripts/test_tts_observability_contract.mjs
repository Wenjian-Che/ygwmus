import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const server = fs.readFileSync(path.join(root, "backend", "server.mjs"), "utf8");

assert.match(server, /x-voice-segments/, "TTS 响应必须暴露服务端实际拆分段数，便于诊断长回答延迟");
assert.match(server, /x-voice-engine, x-voice-segments/, "浏览器必须能够读取朗读引擎与分段诊断头");
assert.match(server, /TENCENT_TTS_FAILED/, "云端朗读失败必须与本地回退失败区分开来");

console.log("tts observability contract tests passed");
