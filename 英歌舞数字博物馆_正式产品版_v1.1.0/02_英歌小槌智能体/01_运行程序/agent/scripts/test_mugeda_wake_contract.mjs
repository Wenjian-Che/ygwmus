import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const mugeda = fs.readFileSync(path.join(root, "01_公众网站", "mugeda-agent.js"), "utf8");
const loader = fs.readFileSync(path.join(root, "02_英歌小槌智能体", "01_运行程序", "agent", "scripts", "yingge.js"), "utf8");

assert.match(mugeda, /class="settings"/, "木疙瘩头部必须提供紧凑的语音设置入口");
assert.match(mugeda, /页面唤醒/, "设置中必须说明页面内唤醒能力");
assert.match(mugeda, /function startMugedaWakeStandby\(/, "木疙瘩必须有独立的页面唤醒启动器");
assert.match(mugeda, /function stopMugedaWakeStandby\(/, "木疙瘩必须能安全关闭页面唤醒");
assert.match(mugeda, /mode:\s*'wake'/, "木疙瘩唤醒必须使用服务端本地 KWS 会话");
assert.match(mugeda, /MUGEDA_WAKE_COOLDOWN_MS/, "木疙瘩唤醒必须有重复触发保护");
assert.match(mugeda, /startMugedaWakeQuestion\(/, "唤醒成功后必须自动转入问题识别窗口");
assert.match(mugeda, /document\.hidden\).*stopMugedaWakeStandby/, "页面隐藏时必须停止唤醒监听");
assert.match(mugeda, /mugeda-wake-enabled/, "用户的页面唤醒偏好必须独立持久化");
assert.match(mugeda, /activeSpeechButton/, "唤醒打断朗读时必须同时复位原朗读按钮状态");
assert.match(loader, /script\.src\s*=\s*["']https:\/\/yinggemus\.cn\/mugeda-agent\.js["']/, "木疙瘩加载器必须使用稳定的正式脚本地址");
assert.doesNotMatch(loader, /mugeda-agent\.js\?v=/, "稳定脚本地址的更新应由服务端重新校验，而不是要求木疙瘩改版本参数");

console.log("mugeda wake contract tests passed");
