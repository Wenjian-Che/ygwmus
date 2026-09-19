import assert from "node:assert/strict";
import { queueKnowledgeGapCandidate } from "../../backend/knowledge-gap-queue.mjs";

const unanswered = [];
const tasks = [];
const resolved = [];
const store = {
  recordUnanswered(item) { unanswered.push(item); },
  listKnowledgeTasks() { return tasks; },
  createKnowledgeTask(item) { tasks.push({ ...item }); return item; },
  resolveUnanswered(item) { resolved.push(item); return true; },
};

const gap = queueKnowledgeGapCandidate({
  store,
  appId: "yingge-h5",
  question: "  某甲英歌队的快板有什么特点？  ",
  intent: "performance.style",
  quality: "insufficient",
  trigger: "knowledge_gap",
  knowledgeRelated: true,
});

assert.equal(gap.queued, true, "英歌知识空缺应进入审核队列");
assert.equal(gap.created, true, "首个空缺问题应建立知识任务");
assert.equal(tasks.length, 1, "不得拆成多条重复知识任务");
assert.equal(tasks[0].status, "open");
assert.equal(tasks[0].quality, "insufficient");
assert.match(tasks[0].task_id, /^gap-[a-f0-9]{16}$/);
assert.equal(unanswered.length, 1, "空缺问题仍应保留在未答好统计中");
assert.equal(resolved[0]?.status, "task_created", "任务创建后应回写未答好问题状态");

const duplicate = queueKnowledgeGapCandidate({
  store,
  appId: "yingge-h5",
  question: "某甲英歌队 的快板有什么特点？",
  intent: "performance.style",
  quality: "insufficient",
  trigger: "knowledge_gap",
  knowledgeRelated: true,
});
assert.equal(duplicate.queued, true);
assert.equal(duplicate.created, false, "同一问题的空白和空格变体不得重复建任务");
assert.equal(tasks.length, 1);
assert.equal(unanswered.length, 2, "重复出现仍应累积未答好信号");

const downvote = queueKnowledgeGapCandidate({
  store,
  appId: "yingge-h5",
  question: "英歌舞里的快板和慢板有什么区别？",
  intent: "performance.style",
  quality: "supported",
  trigger: "downvote",
  knowledgeRelated: true,
});
assert.equal(downvote.created, true, "英歌知识问答被点踩也应留下待复核补证任务");
assert.equal(tasks[1].quality, "feedback_downvote", "点踩来源必须让后台可辨识");

const unrelated = queueKnowledgeGapCandidate({
  store,
  appId: "yingge-h5",
  question: "今天天气怎么样？",
  intent: "general",
  quality: "insufficient",
  trigger: "knowledge_gap",
  knowledgeRelated: false,
});
assert.equal(unrelated.queued, false, "非英歌知识问题不应污染知识补证队列");
assert.equal(tasks.length, 2);

console.log("knowledge gap auto-queue contract passed");
