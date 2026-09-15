import {
  assertValidEvidenceAudit,
  buildEvidenceAudit,
  summarizeClaims,
  validateClaim,
  validateEvidenceAudit,
} from "../../backend/evidence-audit.mjs";

const validRef = {
  chunk_id: "chunk-001",
  source_file: "56_锣鼓动作队形协同机制.md",
  source_id: "shantou_yingge_standard_2025",
  quote: "槌击与锣鼓、动作和队形转换共同构成表演的时间提示。",
  grade: "A",
  url: "https://example.com/source",
  support: "direct",
};

const validClaim = {
  claim_id: "claim-001",
  text: "槌击可以承担动作与节奏之间的时间标记。",
  claim_type: "mechanism",
  risk_level: "medium",
  evidence_refs: [validRef],
  status: "supported",
};

const audit = buildEvidenceAudit({
  audit_id: "audit-001",
  message_id: "message-001",
  question: "英歌为什么要敲槌？",
  answer: "槌击可以承担动作与节奏之间的时间标记。",
  claims: [validClaim],
});

const errors = [];
function expectInvalid(label, value, predicate = () => true) {
  const result = validateEvidenceAudit(value);
  if (result.valid || !predicate(result.errors)) errors.push(`${label} should be invalid`);
}
function expectClaimInvalid(label, value, predicate = () => true) {
  const result = validateClaim(value);
  if (result.valid || !predicate(result.errors)) errors.push(`${label} should be invalid`);
}

if (!audit.valid || audit.summary.support_rate !== 1 || audit.summary.total_claims !== 1) errors.push("valid audit should pass");
if (audit.claims[0].evidence_refs[0].grade !== "A") errors.push("grade should normalize to uppercase");
expectInvalid("missing message_id", { answer: "x", claims: [] }, (items) => items.some((item) => item.path === "message_id"));
expectInvalid("missing answer", { message_id: "m", claims: [] }, (items) => items.some((item) => item.path === "answer"));
expectInvalid("claims not array", { message_id: "m", answer: "x", claims: {} }, (items) => items.some((item) => item.code === "array_required"));
expectClaimInvalid("missing claim_id", { ...validClaim, claim_id: "" }, (items) => items.some((item) => item.path.endsWith("claim_id")));
expectClaimInvalid("missing claim text", { ...validClaim, text: "" }, (items) => items.some((item) => item.path.endsWith(".text")));
expectClaimInvalid("invalid claim type", { ...validClaim, claim_type: "opinion" }, (items) => items.some((item) => item.path.endsWith("claim_type") && item.code === "enum"));
expectClaimInvalid("invalid risk level", { ...validClaim, risk_level: "urgent" }, (items) => items.some((item) => item.path.endsWith("risk_level") && item.code === "enum"));
expectClaimInvalid("missing evidence field", { ...validClaim, evidence_refs: [{ ...validRef, quote: "" }] }, (items) => items.some((item) => item.path.includes("quote") && item.code === "required"));
expectClaimInvalid("non-https source", { ...validClaim, evidence_refs: [{ ...validRef, url: "http://example.com" }] }, (items) => items.some((item) => item.path.includes("url") && item.code === "url_protocol"));
expectClaimInvalid("supported without direct", { ...validClaim, status: "supported", evidence_refs: [{ ...validRef, support: "partial" }] }, (items) => items.some((item) => item.code === "direct_required"));
expectClaimInvalid("high risk without direct", { ...validClaim, risk_level: "high", status: "partial", evidence_refs: [{ ...validRef, support: "partial" }] }, (items) => items.some((item) => item.code === "high_risk_without_direct"));
const highUnsupported = validateClaim({ ...validClaim, risk_level: "critical", status: "unsupported", evidence_refs: [] });
if (!highUnsupported.valid) errors.push("critical unsupported claim without evidence should be structurally valid");
expectClaimInvalid("conflicted with one ref", { ...validClaim, status: "conflicted", evidence_refs: [{ ...validRef, support: "conflict" }] }, (items) => items.some((item) => item.code === "conflict_refs_required"));
expectClaimInvalid("conflicted without conflict support", { ...validClaim, status: "conflicted", evidence_refs: [{ ...validRef }, { ...validRef, chunk_id: "chunk-002", support: "partial" }] }, (items) => items.some((item) => item.code === "conflict_support_required"));
expectClaimInvalid("unsupported with direct", { ...validClaim, status: "unsupported" }, (items) => items.some((item) => item.code === "unsupported_has_direct"));

const mixedSummary = summarizeClaims([
  validClaim,
  { ...validClaim, claim_id: "claim-002", risk_level: "high", status: "unsupported", evidence_refs: [] },
]);
if (mixedSummary.total_claims !== 2 || mixedSummary.high_risk_gaps !== 1 || mixedSummary.support_rate !== 0.5) errors.push("summary counts incorrect");
try {
  assertValidEvidenceAudit({ message_id: "m", answer: "x", claims: [{ ...validClaim, claim_id: "" }] });
  errors.push("assertValidEvidenceAudit should throw");
} catch (error) {
  if (error.code !== "EVIDENCE_AUDIT_INVALID") errors.push("assertion error code missing");
}

console.log(JSON.stringify({
  status: errors.length ? "fail" : "pass",
  cases: 16,
  valid_summary: audit.summary,
  errors,
}, null, 2));
if (errors.length) process.exitCode = 1;

