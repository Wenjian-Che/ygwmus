import { auditInteractionEvidence, getInteractionEvidenceAudit } from "../../backend/evidence-audit-api.mjs";

const registry = {
  sources: {
    official: { grade: "A", title: "官方英歌项目资料", publisher: "中国非物质文化遗产网", url: "https://example.com/official" },
  },
  file_map: { "56_锣鼓动作队形协同机制.md": ["official"] },
};
const chunks = [{
  id: "chunk-1",
  source_file: "56_锣鼓动作队形协同机制.md",
  heading_path: ["锣鼓动作队形协同机制"],
  content: "槌击可以承担动作与节奏之间的时间标记，并与锣鼓和队形转换协同。",
}];
const retrieve = (query, limit) => String(query).includes("槌击") ? chunks.slice(0, limit) : [];
const interactions = new Map([[
  "m-supported",
  { message_id: "m-supported", question: "英歌为什么要敲槌？", answer: "槌击可以承担动作与节奏之间的时间标记。" },
], [
  "m-critical",
  { message_id: "m-critical", question: "谁是国家级代表性传承人？", answer: "某人是第六批国家级代表性传承人。" },
]]);
const audits = new Map();
const store = {
  listInteractions: () => [...interactions.values()],
  saveEvidenceAudit: (payload) => audits.set(payload.message_id, payload),
  getEvidenceAudit: (messageId) => audits.get(messageId) || null,
};

const errors = [];
const supported = auditInteractionEvidence({ body: { message_id: "m-supported", answer: "槌击可以承担动作与节奏之间的时间标记。", source_file: "../../secret.txt" }, store, retrieve, sourceRegistry: registry });
if (supported.status !== 200 || !supported.body.passed || !supported.body.can_continue) errors.push("supported audit should pass the continuation gate");
if (supported.body.sources[0]?.url !== "https://example.com/official") errors.push("real registered source URL missing");
if (!supported.body.evidence_chunks[0]?.quote || supported.body.evidence_chunks[0].quote.length > 1000) errors.push("evidence chunk quote missing or too long");
if (JSON.stringify(supported.body).includes("../../secret.txt")) errors.push("client supplied source path must be ignored");

const critical = auditInteractionEvidence({ body: { message_id: "m-critical" }, store, retrieve: () => [], sourceRegistry: registry });
if (critical.status !== 200 || critical.body.passed || critical.body.can_continue) errors.push("high-risk unsupported audit must block continuation");
if (!critical.body.decision_reasons.some((reason) => reason.includes("高风险"))) errors.push("high-risk block reason missing");

const missingId = auditInteractionEvidence({ body: {}, store, retrieve, sourceRegistry: registry });
if (missingId.status !== 400 || missingId.body.code !== "MESSAGE_ID_REQUIRED") errors.push("missing message_id validation failed");
const missingInteraction = auditInteractionEvidence({ body: { message_id: "does-not-exist" }, store, retrieve, sourceRegistry: registry });
if (missingInteraction.status !== 404 || missingInteraction.body.code !== "INTERACTION_NOT_FOUND") errors.push("missing interaction should return 404");
const stored = getInteractionEvidenceAudit({ message_id: "m-supported", store });
if (stored.status !== 200 || stored.body.message_id !== "m-supported") errors.push("stored audit GET failed");
const unknownAudit = getInteractionEvidenceAudit({ message_id: "unknown", store });
if (unknownAudit.status !== 404 || unknownAudit.body.code !== "EVIDENCE_AUDIT_NOT_FOUND") errors.push("unknown audit should return 404");

console.log(JSON.stringify({ status: errors.length ? "fail" : "pass", cases: 8, errors, sample: { supported: supported.body.summary, critical: critical.body.summary } }, null, 2));
if (errors.length) process.exitCode = 1;

