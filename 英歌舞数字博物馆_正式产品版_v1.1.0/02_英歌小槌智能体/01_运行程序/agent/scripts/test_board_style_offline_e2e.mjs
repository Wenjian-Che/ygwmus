import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "yingge-board-style-"));
const port = 8807;
const child = spawn(process.execPath, ["backend/server.mjs"], {
  cwd: root,
  env: {
    ...process.env,
    AGENT_PORT: String(port),
    AGENT_STORE_DIR: path.join(temp, "store"),
    ADMIN_PRIVATE_STATE_DIR: path.join(temp, "admin"),
    AGENT_OPERATIONS_STATE_DIR: path.join(temp, "operations"),
    DEEPSEEK_API_KEY: "",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

async function waitForServer() {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  throw new Error("board-style offline test server did not start");
}

try {
  await waitForServer();
  const response = await fetch(`http://127.0.0.1:${port}/api/agent/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-app-id": "yingge-h5" },
    body: JSON.stringify({ app_id: "yingge-h5", message: "英歌舞里的快班和慢版有什么区别", history: [] }),
  });
  assert.equal(response.status, 200);
  const sse = await response.text();
  const meta = JSON.parse(sse.match(/event: meta\ndata: (.+)/)?.[1] || "{}");
  const answer = JSON.parse(sse.match(/event: delta\ndata: (.+)/)?.[1] || "{}").text || "";
  assert.equal(meta.intent, "style", "板式同音问题必须进入 style 路由");
  assert.match(answer, /慢板/);
  assert.match(answer, /快板/);
  assert.match(answer, /节奏|鼓点/);
  assert.doesNotMatch(answer, /戏曲脸谱会影响英歌/);
  console.log("board style offline e2e tests passed");
} finally {
  if (child.exitCode === null) {
    const exited = new Promise((resolve) => child.once("exit", resolve));
    child.kill();
    await exited;
  }
  fs.rmSync(temp, { recursive: true, force: true });
}
