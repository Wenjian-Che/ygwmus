import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const automationDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(automationDir, "..");
const outputPath = path.join(root, "agent", "generated", "daily_quality_runs.jsonl");
const baseUrl = (process.env.AGENT_BASE_URL || "http://127.0.0.1:8787").replace(/\/$/, "");
const withModel = process.argv.includes("--with-model") || process.env.YINGGE_RUN_MODEL_QA === "1";
const strict = process.argv.includes("--strict");

async function request(pathname, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(options.timeout || 30000));
  try {
    const auth = process.env.ADMIN_TOKEN ? { authorization: `Bearer ${process.env.ADMIN_TOKEN}` } : {};
    const response = await fetch(`${baseUrl}${pathname}`, { ...options, signal: controller.signal, headers: { "content-type": "application/json", ...auth, ...(options.headers || {}) } });
    const text = await response.text();
    let data; try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 500) }; }
    return { ok: response.ok, status: response.status, data };
  } finally { clearTimeout(timeout); }
}

const run = { generated_at: new Date().toISOString(), base_url: baseUrl, model_qa_requested: withModel };
try {
  const retrieval = await request("/api/admin/evaluation?limit=6");
  run.retrieval = retrieval.data;
  if (!retrieval.ok) run.error = `retrieval_http_${retrieval.status}`;
  const readiness = await request("/api/admin/evaluation/readiness");
  run.readiness = readiness.data;
  if (withModel) {
    const answer = await request("/api/admin/evaluation/answers/run", { method: "POST", body: JSON.stringify({ limit: Number(process.env.YINGGE_MODEL_QA_LIMIT || 4), thinking: true }), timeout: 60000 });
    run.answer_quality = answer.data;
    if (!answer.ok && answer.status !== 503) run.error = `answer_http_${answer.status}`;
  }
} catch (error) {
  run.error = String(error?.message || error);
}
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.appendFileSync(outputPath, `${JSON.stringify(run)}\n`, "utf8");
console.log(JSON.stringify({ generated_at: run.generated_at, retrieval: run.retrieval?.status || "unavailable", readiness: run.readiness?.status || "unavailable", model_qa: run.answer_quality?.status || (withModel ? "unavailable" : "skipped"), error: run.error || null, output: path.relative(root, outputPath) }, null, 2));
if (strict && run.error) process.exitCode = 1;
