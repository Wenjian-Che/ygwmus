import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createStore } from "../backend/store.mjs";

const automationDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(automationDir, "..");
const configPath = path.join(automationDir, "sources.json");
const inboxDir = path.join(automationDir, "inbox");
const date = new Date().toISOString().slice(0, 10);

if (!fs.existsSync(configPath)) {
  console.error("缺少 automation/sources.json：请从 sources.example.json 复制后配置官方 Feed。");
  process.exitCode = 1;
  process.exit();
}
const sources = JSON.parse(fs.readFileSync(configPath, "utf8")).filter((source) => source.enabled && source.url);
const planOnly = process.argv.includes("--plan-only");
fs.mkdirSync(inboxDir, { recursive: true });
const outputPath = path.join(inboxDir, `${date}.jsonl`);
const taskPlanPath = path.join(inboxDir, `task-plans-${date}.jsonl`);
const seenPath = path.join(automationDir, "seen.json");
const seen = fs.existsSync(seenPath) ? JSON.parse(fs.readFileSync(seenPath, "utf8")) : {};
const candidates = [];
const store = await createStore(path.join(root, "backend"));
const openTasks = store.listKnowledgeTasks("open");

function hash(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function stripHtml(value) { return value.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function decode(value) { return value.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"'); }
function taskTerms(task) {
  const intentTerms = {
    history: ["成立", "起源", "沿革", "传承", "队史"],
    team: ["队伍", "地区", "编制", "人数", "队史"],
    movement: ["动作", "步法", "阵形", "队形", "槌法"],
    percussion: ["锣鼓", "鼓点", "鼓谱", "八拍", "吆喝", "司鼓"],
    face: ["脸谱", "角色", "人物", "头槌", "时迁"],
    protection: ["非遗", "保护单位", "传承人", "教学", "数字化"],
    freshness: ["最新", "近期", "活动", "演出", "展演", "日程"],
  };
  const words = String(task.question || "").split(/[，。！？、；：\s]+/).filter((word) => word.length >= 2);
  return [...new Set([...(intentTerms[task.intent] || []), ...words])].slice(0, 12);
}
const taskPlans = openTasks.map((task) => ({ task_id: task.task_id, question: task.question, intent: task.intent, search_terms: taskTerms(task), sources: sources.map((source) => ({ id: source.id, url: source.url, publisher: source.publisher })) }));
if (taskPlans.length) fs.writeFileSync(taskPlanPath, `${taskPlans.map((item) => JSON.stringify({ ...item, generated_at: new Date().toISOString(), status: "research_needed" })).join("\n")}\n`, { flag: "a" });
if (planOnly) {
  console.log(JSON.stringify({ date, tasks: taskPlans.length, output: taskPlanPath }, null, 2));
  process.exit(0);
}

function parseRss(text, source) {
  const items = [...text.matchAll(/<item[\s\S]*?<\/item>/gi)].map((match) => match[0]);
  return items.map((item) => {
    const read = (tag) => decode(item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] || "").trim();
    const title = stripHtml(read("title"));
    const link = read("link") || read("guid");
    const summary = stripHtml(read("description") || read("content:encoded"));
    return { title, url: link, summary, published_at: read("pubDate") || read("published"), source };
  }).filter((item) => item.title && item.url);
}

for (const source of sources) {
  try {
    const response = await fetch(source.url, { headers: { "user-agent": "YinggeKnowledgeRefresh/1.0" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const items = source.type === "rss" || /<rss|<feed/i.test(text) ? parseRss(text, source) : [{ title: source.title || source.url, url: source.url, summary: stripHtml(text).slice(0, 4000), published_at: null, source }];
    for (const item of items) {
      if (!/英歌|英歌舞|非遗|潮阳|普宁|甲子|汕尾|汕头|揭阳/i.test(`${item.title} ${item.summary}`)) continue;
      const id = hash(`${item.url}|${item.title}`);
      if (seen[id]) continue;
      const matchedTasks = openTasks.filter((task) => taskTerms(task).some((term) => `${item.title} ${item.summary}`.includes(term)));
      candidates.push({ candidate_id: id, discovered_at: new Date().toISOString(), status: "pending_review", topic: matchedTasks.length ? "英歌舞知识补充" : "英歌舞相关动态", evidence_level: source.grade || "D", task_ids: matchedTasks.map((task) => task.task_id), task_questions: matchedTasks.map((task) => task.question), ...item });
      seen[id] = { first_seen: date, url: item.url };
    }
  } catch (error) {
    candidates.push({ candidate_id: hash(`${source.id}|${date}|error`), discovered_at: new Date().toISOString(), status: "source_error", source, error: error.message });
  }
}

if (candidates.length) fs.writeFileSync(outputPath, `${candidates.map((item) => JSON.stringify(item)).join("\n")}\n`, { flag: "a" });
fs.writeFileSync(seenPath, JSON.stringify(seen, null, 2), "utf8");
console.log(JSON.stringify({ date, sources: sources.length, candidates: candidates.length, output: path.relative(root, outputPath) }, null, 2));
