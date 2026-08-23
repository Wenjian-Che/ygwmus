import { evaluateGoldenEvidenceGate } from "../../backend/golden-evidence-gate.mjs";

const claims = [
  { claim_id: "c1", text: "英歌舞以槌点组织节奏", risk_level: "critical", status: "supported" },
  { claim_id: "c2", text: "不同队伍会形成不同做法", risk_level: "high", status: "supported" },
  { claim_id: "c3", text: "表演强调队形变化", risk_level: "medium", status: "supported" },
  { claim_id: "c4", text: "现场声响具有感染力", risk_level: "low", status: "supported" },
  { claim_id: "c5", text: "观众会跟随节拍", risk_level: "low", status: "supported" },
  { claim_id: "c6", text: "动作存在地区差异", risk_level: "low", status: "supported" },
  { claim_id: "c7", text: "节庆时常见演出", risk_level: "low", status: "supported" },
  { claim_id: "c8", text: "队伍会使用槌", risk_level: "low", status: "supported" },
  { claim_id: "c9", text: "锣鼓与动作协同", risk_level: "low", status: "supported" },
  { claim_id: "c10", text: "可按个案核验", risk_level: "low", status: "supported" },
];
const answer = "英歌舞以槌点组织节奏。不同队伍会形成不同做法。表演强调队形变化，现场声响具有感染力，观众会跟随节拍，动作存在地区差异，节庆时常见演出，队伍会使用槌，锣鼓与动作协同，并应按个案核验。";
const baseAudit = { message_id: "gate-test", answer, claims };
const errors = [];

const passing = evaluateGoldenEvidenceGate({ audit: baseAudit, answer });
if (!passing.passed || passing.score !== 100) errors.push(`passing=${passing.passed}/${passing.score}`);

const missingAudit = evaluateGoldenEvidenceGate({ answer });
if (missingAudit.passed || !missingAudit.failed_checks.some((item) => item.key === "evidence_audit_current")) errors.push("missing audit was accepted");

const stale = evaluateGoldenEvidenceGate({ audit: baseAudit, answer: `${answer} 新增未经审计的句子。` });
if (stale.passed || !stale.failed_checks.some((item) => item.key === "evidence_audit_current")) errors.push("stale answer was accepted");

const criticalGap = evaluateGoldenEvidenceGate({ audit: { ...baseAudit, claims: claims.map((claim, index) => index === 0 ? { ...claim, status: "partial" } : claim) }, answer });
if (criticalGap.passed || !criticalGap.failed_checks.some((item) => item.key === "critical_claims_supported")) errors.push("critical gap was accepted");

const highConflict = evaluateGoldenEvidenceGate({ audit: { ...baseAudit, claims: claims.map((claim, index) => index === 1 ? { ...claim, status: "conflicted" } : claim) }, answer, conflict_note: "采用地方队伍原始记录，并保留该结论只适用于该队伍的边界。" });
if (highConflict.passed || !highConflict.failed_checks.some((item) => item.key === "high_claims_supported")) errors.push("high conflict was accepted");

const lowConflictWithNote = evaluateGoldenEvidenceGate({ audit: { ...baseAudit, claims: claims.map((claim, index) => index === 9 ? { ...claim, status: "conflicted" } : claim) }, answer, conflict_note: "两条资料发布时间不同，采用较新的官方记录，并标注适用范围。" });
if (!lowConflictWithNote.passed || lowConflictWithNote.summary.conflict_count !== 1) errors.push("low conflict note did not resolve");

const lowSupport = evaluateGoldenEvidenceGate({ audit: { ...baseAudit, claims: claims.map((claim, index) => [8, 9].includes(index) ? { ...claim, status: "partial" } : claim) }, answer });
if (lowSupport.passed || !lowSupport.failed_checks.some((item) => item.key === "evidence_support_rate")) errors.push("support rate threshold was not enforced");

console.log(JSON.stringify({ status: errors.length ? "fail" : "pass", passing_score: passing.score, missing_audit_failures: missingAudit.failed_checks.map((item) => item.key), stale_failures: stale.failed_checks.map((item) => item.key), errors }, null, 2));
if (errors.length) process.exitCode = 1;
