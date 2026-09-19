import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

async function waitForHealth(url) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("server did not start");
}

function sseEvents(text) {
  return text.split(/\n\n/).flatMap((packet) => {
    const event = packet.match(/^event:\s*(.+)$/m)?.[1];
    const raw = packet.match(/^data:\s*(.+)$/m)?.[1];
    if (!event || !raw) return [];
    try { return [{ event, data: JSON.parse(raw) }]; } catch { return []; }
  });
}

async function chat(api, origin, message) {
  const response = await fetch(`${api}/api/agent/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, "x-app-id": "yingge-h5" },
    body: JSON.stringify({ app_id: "yingge-h5", message }),
  });
  const body = await response.text();
  assert.equal(response.status, 200, `chat should succeed: ${body}`);
  const events = sseEvents(body);
  const meta = events.find((item) => item.event === "meta")?.data;
  const done = events.find((item) => item.event === "done")?.data;
  assert.ok(meta?.message_id && done?.message_id, "chat must return a persisted message id");
  return { meta, done, events };
}

const isolated = fs.mkdtempSync(path.join(os.tmpdir(), "yingge-gap-queue-"));
const port = 8900 + Math.floor(Math.random() * 400);
const api = `http://127.0.0.1:${port}`;
const origin = api;
const credentials = JSON.stringify({ "reviewer-secret": { id: "reviewer-a", role: "reviewer" } });
const child = spawn(process.execPath, ["backend/server.mjs"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: "test",
    AGENT_PORT: String(port),
    AGENT_ALLOWED_ORIGINS: origin,
    DEEPSEEK_API_KEY: "",
    ADMIN_CREDENTIALS_JSON: credentials,
    AGENT_STORE_DIR: isolated,
    ADMIN_PRIVATE_STATE_DIR: isolated,
    SITE_CONTENT_PATH: path.join(isolated, "site-content.json"),
    SITE_CONTENT_AUDIT_PATH: path.join(isolated, "site-content-audit.jsonl"),
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
child.stdout.on("data", (chunk) => { output += chunk; });
child.stderr.on("data", (chunk) => { output += chunk; });

try {
  await waitForHealth(api);
  const first = await chat(api, origin, "海边测试英歌队的快板有什么特点？");
  assert.equal(first.meta.scope, "knowledge_gap", "无法被馆内证据支撑的英歌问题应明确为知识空缺");

  const auth = { authorization: "Bearer reviewer-secret" };
  const initialTasks = await (await fetch(`${api}/api/admin/knowledge-tasks`, { headers: auth })).json();
  assert.equal(initialTasks.items.length, 1, "知识空缺应自动成为一个待审核补证任务");
  assert.equal(initialTasks.items[0].status, "open");
  assert.equal(initialTasks.items[0].question, "海边测试英歌队的快板有什么特点？");

  const known = await chat(api, origin, "英歌舞里的快板和慢板有什么区别？");
  assert.equal(known.done.evidence_quality, "supported", "点踩回归用例必须先获得有证据的正常回答");
  const feedback = await fetch(`${api}/api/agent/feedback`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, "x-app-id": "yingge-h5" },
    body: JSON.stringify({ message_id: known.meta.message_id, rating: "down", reasons: ["没有回答到重点"] }),
  });
  assert.equal(feedback.status, 200);
  const afterDownvote = await (await fetch(`${api}/api/admin/knowledge-tasks`, { headers: auth })).json();
  assert.equal(afterDownvote.items.length, 2, "英歌知识回答被点踩应自动建立待复核知识任务");
  const downvoteTask = afterDownvote.items.find((item) => item.question === "英歌舞里的快板和慢板有什么区别？");
  assert.equal(downvoteTask?.quality, "feedback_downvote", "后台要能辨认该任务来自用户点踩");

  const unanswered = await (await fetch(`${api}/api/admin/unanswered`, { headers: auth })).json();
  assert.equal(unanswered.items.length, 0, "已自动转成任务的空缺不应仍显示为未分流问题");
} finally {
  if (child.exitCode === null) {
    const exited = new Promise((resolve) => child.once("exit", resolve));
    child.kill();
    await exited;
  }
  assert.doesNotMatch(output, /reviewer-secret/i, "日志不得泄漏后台凭据");
}

console.log("knowledge gap automatic queue API passed");
