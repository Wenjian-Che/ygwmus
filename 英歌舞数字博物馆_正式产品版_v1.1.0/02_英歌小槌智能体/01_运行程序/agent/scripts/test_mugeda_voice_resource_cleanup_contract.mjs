import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const mugeda = fs.readFileSync(path.join(root, "01_公众网站", "mugeda-agent.js"), "utf8");

assert.match(mugeda, /function acquireMugedaVoiceResources\(/, "唤醒和转写会话必须通过可清理的成对资源获取器启动");
assert.match(mugeda, /stream\.getTracks\(\)\.forEach/, "单侧失败时必须停止已获得的麦克风轨道");
assert.match(mugeda, /deleteMugedaVoiceSession\(payload\.session_id\)/, "单侧失败时必须关闭已创建的服务端语音会话");
assert.match(mugeda, /acquireMugedaVoiceResources\(MUGEDA_WAKE_REQUEST\.mode\)/, "唤醒待机必须使用资源清理器");
assert.match(mugeda, /acquireMugedaVoiceResources\('transcribe'\)/, "唤醒后的问题转写也必须使用资源清理器");

console.log("mugeda voice resource cleanup contract tests passed");
