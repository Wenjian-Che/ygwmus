import crypto from "node:crypto";

const automaticTriggers = new Set(["knowledge_gap", "evidence_insufficient", "citation_integrity", "downvote"]);

function displayQuestion(question = "") {
  return String(question || "").trim().slice(0, 500);
}

function questionKey(question = "") {
  return displayQuestion(question)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\u3000]/gu, "")
    .replace(/[，,。！？!?；;：:"'“”‘’（）()【】\[\]《》<>]/gu, "");
}

function reviewQuality(quality, trigger) {
  if (trigger === "downvote") return "feedback_downvote";
  const value = String(quality || "").trim();
  return value && value !== "supported" ? value : "insufficient";
}

export function knowledgeGapTaskId(appId, question) {
  const key = `${String(appId || "yingge-h5").trim() || "yingge-h5"}:${questionKey(question)}`;
  return `gap-${crypto.createHash("sha1").update(key).digest("hex").slice(0, 16)}`;
}

export function queueKnowledgeGapCandidate({
  store,
  appId = "yingge-h5",
  question,
  intent = "general",
  quality = "insufficient",
  trigger = "evidence_insufficient",
  knowledgeRelated = false,
  createdAt,
} = {}) {
  const normalizedQuestion = displayQuestion(question);
  const automatic = automaticTriggers.has(trigger);
  if (!normalizedQuestion || !knowledgeRelated || (!automatic && trigger !== "manual")) {
    return { queued: false, created: false, reason: "not_eligible" };
  }
  if (!store || typeof store.recordUnanswered !== "function" || typeof store.listKnowledgeTasks !== "function" || typeof store.createKnowledgeTask !== "function" || typeof store.resolveUnanswered !== "function") {
    throw new TypeError("knowledge gap queue requires unanswered and knowledge task storage");
  }

  const resolvedAppId = String(appId || "yingge-h5").trim() || "yingge-h5";
  const resolvedIntent = String(intent || "general").trim() || "general";
  const resolvedQuality = reviewQuality(quality, trigger);
  const now = createdAt || new Date().toISOString();
  const canonicalQuestion = questionKey(normalizedQuestion);

  store.recordUnanswered({
    app_id: resolvedAppId,
    question: normalizedQuestion,
    intent: resolvedIntent,
    quality: resolvedQuality,
    created_at: now,
  });

  const existing = store.listKnowledgeTasks("all").find((item) => (
    String(item.app_id || "yingge-h5") === resolvedAppId
      && questionKey(item.question) === canonicalQuestion
      && String(item.status || "open") !== "closed"
  ));
  const task = existing || {
    task_id: knowledgeGapTaskId(resolvedAppId, normalizedQuestion),
    app_id: resolvedAppId,
    question: normalizedQuestion,
    intent: resolvedIntent,
    quality: resolvedQuality,
    status: "open",
    created_at: now,
  };
  if (!existing) store.createKnowledgeTask(task);
  store.resolveUnanswered({ app_id: resolvedAppId, question: normalizedQuestion, status: "task_created" });

  return { queued: true, created: !existing, task, trigger };
}
