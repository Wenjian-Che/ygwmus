import { clusterQuestions, questionSimilarity } from "../../backend/question-clusters.mjs";

const records = [
  { message_id: "1", question: "英歌为什么一直敲手里的棒子？", intent: "movement", quality: "supported", rating: "up", created_at: "2026-08-16T08:00:00Z" },
  { message_id: "2", question: "不停敲英歌槌有什么作用？", intent: "movement", quality: "supported", rating: "down", created_at: "2026-08-16T09:00:00Z" },
  { message_id: "3", question: "英歌舞敲木棒是干什么用的", intent: "movement", quality: "limited", created_at: "2026-08-16T10:00:00Z" },
  { message_id: "4", question: "英歌是联合国教科文组织非遗吗？", intent: "protection", quality: "supported", created_at: "2026-08-16T08:00:00Z" },
  { message_id: "5", question: "英歌已经成为联合国非遗了吗", intent: "protection", quality: "supported", created_at: "2026-08-16T10:00:00Z" },
  { message_id: "6", question: "这周末哪里有英歌演出？", intent: "freshness", quality: "limited", created_at: "2026-08-16T08:00:00Z" },
  { message_id: "7", question: "明天英歌几点开始表演", intent: "freshness", quality: "insufficient", created_at: "2026-08-16T10:00:00Z" },
  { message_id: "8", question: "英歌脸谱为什么要画成这样", intent: "face", quality: "supported", created_at: "2026-08-16T08:00:00Z" },
];
const clusters = clusterQuestions(records);
const byTitle = new Map(clusters.map((item) => [item.title, item]));
const errors = [];
if (clusters.length !== 4) errors.push(`expected 4 clusters, got ${clusters.length}`);
if (byTitle.get("槌击作用")?.volume !== 3) errors.push("槌击作用 cluster should contain 3 questions");
if (byTitle.get("非遗级别")?.volume !== 2) errors.push("非遗级别 cluster should contain 2 questions");
if (byTitle.get("实时演出")?.volume !== 2) errors.push("实时演出 cluster should contain 2 questions");
if ((byTitle.get("槌击作用")?.priority_score || 0) < 70) errors.push("mixed downvote and low-confidence cluster should be P0");
if (questionSimilarity(records[0], records[1]) < .48) errors.push("known paraphrases should meet cluster threshold");
console.log(JSON.stringify({ status: errors.length ? "fail" : "pass", cluster_count: clusters.length, clusters: clusters.map((item) => ({ title: item.title, volume: item.volume, priority: item.priority, action: item.suggested_action })), errors }, null, 2));
if (errors.length) process.exitCode = 1;
