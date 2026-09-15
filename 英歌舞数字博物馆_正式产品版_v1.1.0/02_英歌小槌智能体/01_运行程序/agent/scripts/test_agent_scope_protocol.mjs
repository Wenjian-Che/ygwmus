import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const isolated = fs.mkdtempSync(path.join(os.tmpdir(), "yingge-agent-scope-"));
const port = 9300 + Math.floor(Math.random() * 400);
const child = spawn(process.execPath, ["backend/server.mjs"], {
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: "test", AGENT_STORE_DIR: isolated, ADMIN_PRIVATE_STATE_DIR: isolated, SITE_CONTENT_PATH: path.join(isolated, "site-content.json"), SITE_CONTENT_AUDIT_PATH: path.join(isolated, "site-content-audit.jsonl"), AGENT_PORT: String(port), DEEPSEEK_API_KEY: "" },
  stdio: ["ignore", "pipe", "pipe"],
});

async function waitForServer() {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error("agent test server did not start");
}

try {
  await waitForServer();
  const ask = (message) => fetch(`http://127.0.0.1:${port}/api/agent/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-app-id": "yingge-h5" },
    body: JSON.stringify({ app_id: "yingge-h5", message, history: [] }),
  });
  const response = await ask("你好，你是哪个智能体？");
  assert.equal(response.status, 200);
  const stream = await response.text();
  assert.match(stream, /我是\\u201c英歌小槌\\u201d|我是“英歌小槌”/, "身份问题必须使用正式名称英歌小槌");
  assert.doesNotMatch(stream, /我是\\u201c问英歌小槌\\u201d|我是“问英歌小槌”/, "不得把入口动作误写成智能体名称");
  assert.match(stream, /英歌舞数字博物馆/);
  assert.doesNotMatch(stream, /傩文化|女子英歌|发源|起源/, "身份问题不得拼接相邻检索片段");
  assert.match(stream, /"items":\[\]/, "非知识回答不得附带不相关资料来源");

  const unsupportedResponse = await ask("某某英歌队的队长是谁？");
  assert.equal(unsupportedResponse.status, 200);
  const unsupportedStream = await unsupportedResponse.text();
  assert.match(unsupportedStream, /不能据相邻资料推断/, "缺少具体队伍资料时应明确知识边界");
  assert.doesNotMatch(unsupportedStream, /傩文化|女子英歌|发源|起源/, "资料不足时不得拼接相邻主题材料");
  assert.match(unsupportedStream, /"items":\[\]/, "知识缺口回答不得附带不相干来源");
  console.log("agent scope protocol ok");
} finally {
  if (child.exitCode === null) {
    const exited = new Promise((resolve) => child.once("exit", resolve));
    child.kill("SIGTERM");
    await exited;
  }
  fs.rmSync(isolated, { recursive: true, force: true });
}
