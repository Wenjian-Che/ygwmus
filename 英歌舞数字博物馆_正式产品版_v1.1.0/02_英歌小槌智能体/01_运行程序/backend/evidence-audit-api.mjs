import { auditAnswerEvidence } from "./evidence-audit-matcher.mjs";

const MAX_MESSAGE_ID = 200;
const MAX_QUESTION = 8000;
const MAX_ANSWER = 30000;

function text(value, limit) {
  return String(value ?? "").trim().slice(0, limit);
}

function findInteraction(store, messageId) {
  if (!store || typeof store.listInteractions !== "function") return null;
  return store.listInteractions("all").find((item) => String(item.message_id || "") === messageId) || null;
}

function sourceDetailsFor(audit, sourceRegistry = {}) {
  const sources = sourceRegistry.sources || {};
  const seen = new Set();
  const result = [];
  for (const claim of audit.claims || []) {
    for (const ref of claim.evidence_refs || []) {
      const source = sources[ref.source_id] || {};
      const url = String(ref.url || source.url || "");
      if (!/^https:\/\//i.test(url)) continue;
      const key = `${ref.source_id}|${url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        source_id: ref.source_id,
        source_file: ref.source_file,
        grade: ref.grade,
        title: source.title || ref.source_id,
        publisher: source.publisher || "待核来源",
        url,
        claim_ids: (audit.claims || []).filter((item) => (item.evidence_refs || []).some((candidate) => candidate.source_id === ref.source_id && candidate.url === url)).map((item) => item.claim_id),
      });
    }
  }
  return result;
}

function evidenceChunksFor(audit, sourceRegistry = {}) {
  const sources = sourceRegistry.sources || {};
  return (audit.claims || []).flatMap((claim) => (claim.evidence_refs || []).map((ref) => ({
    claim_id: claim.claim_id,
    chunk_id: ref.chunk_id,
    source_file: ref.source_file,
    source_id: ref.source_id,
    quote: String(ref.quote || "").slice(0, 1000),
    grade: ref.grade,
    support: ref.support,
    title: sources[ref.source_id]?.title || ref.source_id,
    publisher: sources[ref.source_id]?.publisher || "待核来源",
    url: /^https:\/\//i.test(String(ref.url || "")) ? ref.url : "",
  })));
}

function acceptanceDecision(audit) {
  const summary = audit.summary || {};
  const statusCounts = summary.status_counts || {};
  const reasons = [];
  if (!summary.total_claims) reasons.push("回答未识别出可审计的英歌舞事实句");
  if (Number(summary.high_risk_gaps || 0) > 0) reasons.push("存在高风险或关键事实缺少直接证据");
  if (Number(summary.conflict_count || 0) > 0) reasons.push("存在证据冲突，需要人工复核");
  if (Number(statusCounts.unsupported || 0) > 0) reasons.push("存在未支持的事实句");
  return { passed: reasons.length === 0, can_continue: reasons.length === 0, reasons };
}

export function auditInteractionEvidence(input = {}) {
  const store = input.store;
  const body = input.body || {};
  const messageId = text(body.message_id, MAX_MESSAGE_ID);
  if (!messageId) return { status: 400, body: { code: "MESSAGE_ID_REQUIRED", message: "message_id 不能为空" } };
  if (String(body.message_id || "").length > MAX_MESSAGE_ID) return { status: 400, body: { code: "MESSAGE_ID_TOO_LONG", message: "message_id 超出长度限制" } };

  const interaction = findInteraction(store, messageId);
  if (!interaction) return { status: 404, body: { code: "INTERACTION_NOT_FOUND", message: "未找到对应回答" } };

  const answer = text(body.answer === undefined ? interaction.answer : body.answer, MAX_ANSWER);
  const question = text(body.question === undefined ? interaction.question : body.question, MAX_QUESTION);
  if (!answer) return { status: 400, body: { code: "ANSWER_REQUIRED", message: "answer 不能为空" } };
  if (String(body.answer || "").length > MAX_ANSWER || String(body.question || "").length > MAX_QUESTION) {
    return { status: 400, body: { code: "AUDIT_INPUT_TOO_LONG", message: "answer 或 question 超出长度限制" } };
  }

  const audit = auditAnswerEvidence({
    audit_id: text(body.audit_id, 200),
    message_id: messageId,
    question,
    answer,
    retrieve: input.retrieve,
    sourceRegistry: input.sourceRegistry || {},
  });
  const decision = acceptanceDecision(audit);
  const payload = {
    ok: true,
    message_id: messageId,
    question,
    answer,
    generated_at: audit.generated_at,
    passed: decision.passed,
    can_continue: decision.can_continue,
    decision_reasons: decision.reasons,
    summary: audit.summary,
    claims: audit.claims,
    diagnostics: audit.diagnostics,
    evidence_chunks: evidenceChunksFor(audit, input.sourceRegistry || {}),
    sources: sourceDetailsFor(audit, input.sourceRegistry || {}),
    audit,
  };
  if (store && typeof store.saveEvidenceAudit === "function") store.saveEvidenceAudit(payload);
  return { status: 200, body: payload };
}

export function getInteractionEvidenceAudit(input = {}) {
  const messageId = text(input.message_id, MAX_MESSAGE_ID);
  if (!messageId) return { status: 400, body: { code: "MESSAGE_ID_REQUIRED", message: "message_id 不能为空" } };
  if (String(input.message_id || "").length > MAX_MESSAGE_ID) return { status: 400, body: { code: "MESSAGE_ID_TOO_LONG", message: "message_id 超出长度限制" } };
  const audit = input.store && typeof input.store.getEvidenceAudit === "function" ? input.store.getEvidenceAudit(messageId) : null;
  if (!audit) return { status: 404, body: { code: "EVIDENCE_AUDIT_NOT_FOUND", message: "未找到该回答的证据审计记录" } };
  return { status: 200, body: audit };
}

