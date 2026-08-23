import { buildRevisionQueue, diagnoseInteraction } from "../../backend/answer-revisions.mjs";

const weak = diagnoseInteraction({
  message_id: "m-1", question: "英歌为什么要敲槌？", answer: "直接回答：因为很有气势。",
  quality: "limited", rating: "down", feedback_reasons: ["没有回答到重点"], citation_count: 0,
});
const grounded = diagnoseInteraction({
  message_id: "m-2", question: "普宁和潮阳英歌有什么不同？",
  answer: "两地英歌的差异不能用一个固定标准概括。公开资料显示，不同队伍会在节奏、阵形和角色配置上形成各自做法；比较时应落到具体队伍和演出资料，并分别核验来源。",
  quality: "supported", citation_count: 3, citation_files: ["01.md", "02.md", "03.md"],
});
const queue = buildRevisionQueue([grounded, weak]);
const errors = [];
if (weak.priority !== "P0") errors.push(`weak priority=${weak.priority}`);
if (!weak.needs_knowledge) errors.push("weak should need knowledge");
if (!weak.findings.some((item) => item.key === "lead-label")) errors.push("missing lead label finding");
if (grounded.priority !== "P3") errors.push(`grounded priority=${grounded.priority}`);
if (queue.items[0].message_id !== "m-1") errors.push("queue order incorrect");
console.log(JSON.stringify({ status: errors.length ? "fail" : "pass", weak_priority: weak.priority, weak_risk: weak.risk_score, grounded_priority: grounded.priority, errors }, null, 2));
if (errors.length) process.exitCode = 1;
