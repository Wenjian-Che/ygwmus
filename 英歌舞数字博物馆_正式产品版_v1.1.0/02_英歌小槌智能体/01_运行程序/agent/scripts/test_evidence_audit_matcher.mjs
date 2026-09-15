import {
  answerToClaims,
  auditAnswerEvidence,
  classifyClaimText,
  matchClaimEvidence,
  splitAnswerSentences,
} from "../../backend/evidence-audit-matcher.mjs";

const registry = {
  sources: {
    mechanism: { grade: "A", url: "https://example.com/mechanism", title: "机制来源" },
    identity: { grade: "A", url: "https://example.com/identity", title: "身份来源" },
    boundary: { grade: "A", url: "https://example.com/boundary", title: "边界来源" },
    conflict: { grade: "A", url: "https://example.com/conflict", title: "冲突来源" },
  },
  file_map: {
    "56_锣鼓动作队形协同机制.md": ["mechanism"],
    "74_英歌代表性传承人名录时效审计.md": ["identity"],
    "30_常见争议与事实辨析.md": ["boundary"],
    "conflict.md": ["conflict"],
  },
};

const chunks = [
  {
    id: "chunk-mechanism",
    source_file: "56_锣鼓动作队形协同机制.md",
    heading_path: ["锣鼓动作队形协同机制"],
    content: "槌击可以承担动作与节奏之间的时间标记，并与锣鼓和队形转换协同。",
  },
  {
    id: "chunk-identity",
    source_file: "74_英歌代表性传承人名录时效审计.md",
    heading_path: ["代表性传承人名录"],
    content: "林忠诚（林松）于2025年正式入选第六批国家级非物质文化遗产代表性传承人，对应英歌（潮阳英歌）。",
  },
  {
    id: "chunk-boundary",
    source_file: "30_常见争议与事实辨析.md",
    heading_path: ["事实边界"],
    content: "不同地区和队伍的动作、鼓点与阵形会有差异，不能把单支队伍个案当作全国统一标准。",
  },
  {
    id: "chunk-conflict",
    source_file: "conflict.md",
    heading_path: ["冲突材料"],
    content: "部分旧资料曾将该身份写成第五批，但正式名单显示为第六批，两个说法存在冲突。",
  },
];
const retrieve = (query, limit) => {
  const q = String(query);
  if (q.includes("敲槌") || q.includes("槌击")) return [chunks[0]];
  if (q.includes("第五批")) return [chunks[1], chunks[3]];
  if (q.includes("林忠诚") || q.includes("第六批")) return [chunks[1]];
  if (q.includes("全国统一") || q.includes("不能")) return [chunks[2]];
  if (q.includes("第五批") || q.includes("第六批")) return [chunks[1], chunks[3]];
  return chunks.slice(0, limit);
};

const errors = [];
const sentences = splitAnswerSentences("# 结论\n槌击可以承担动作与节奏之间的时间标记。\n因此，\n请提供演出地点？");
if (sentences.length !== 1 || !sentences[0].includes("槌击")) errors.push("sentence splitter should ignore heading, transition-only and follow-up");
const inference = classifyClaimText("这说明槌击有助于组织队伍节奏。", { question: "英歌为什么要敲槌？" });
if (inference.claim_type !== "inference" || inference.risk_level !== "low") errors.push("inference classification incorrect");
const identity = classifyClaimText("林忠诚（林松）是第六批国家级代表性传承人。", {});
if (identity.claim_type !== "identity" || identity.risk_level !== "critical") errors.push("identity risk classification incorrect");
const mechanism = matchClaimEvidence({ claim_id: "c1", text: "槌击可以承担动作与节奏之间的时间标记。", claim_type: "mechanism", risk_level: "medium", status: "unsupported" }, { retrieve, sourceRegistry: registry, limit: 6 });
if (mechanism.claim.status !== "supported" || mechanism.claim.evidence_refs[0]?.support !== "direct") errors.push("direct mechanism match failed");
const high = matchClaimEvidence({ claim_id: "c2", text: "林忠诚（林松）是第六批国家级代表性传承人。", claim_type: "identity", risk_level: "critical", status: "unsupported" }, { retrieve, sourceRegistry: registry });
if (high.claim.status !== "supported" || high.claim.evidence_refs.length !== 1) errors.push("high-risk direct identity match failed");
const negative = matchClaimEvidence({ claim_id: "c3", text: "不能把单支队伍的阵形当作全国统一标准。", claim_type: "inference", risk_level: "low", status: "unsupported" }, { retrieve, sourceRegistry: registry });
if (negative.claim.status !== "supported" || negative.claim.evidence_refs[0]?.support !== "direct") errors.push("negation-aligned match failed");
const positiveAgainstNegative = matchClaimEvidence({ claim_id: "c4", text: "所有英歌队都采用全国统一标准。", claim_type: "fact", risk_level: "high", status: "unsupported" }, { retrieve, sourceRegistry: registry });
if (positiveAgainstNegative.claim.status !== "unsupported" || positiveAgainstNegative.claim.evidence_refs[0]?.support !== "conflict") errors.push("negation mismatch should not become direct support");
const noEvidence = matchClaimEvidence({ claim_id: "c5", text: "英歌舞者每天都在月球训练。", claim_type: "fact", risk_level: "high", status: "unsupported" }, { retrieve: () => [], sourceRegistry: registry });
if (noEvidence.claim.status !== "unsupported" || noEvidence.claim.evidence_refs.length) errors.push("no-evidence case failed");
const partial = matchClaimEvidence({ claim_id: "c6", text: "潮阳英歌的表演空间会影响观众动线。", claim_type: "mechanism", risk_level: "medium", status: "unsupported" }, { retrieve: () => [chunks[2]], sourceRegistry: registry });
if (!["partial", "unsupported"].includes(partial.claim.status)) errors.push("partial match classification failed");
const highPartial = matchClaimEvidence({ claim_id: "c6b", text: "潮阳英歌的表演空间会影响观众动线。", claim_type: "mechanism", risk_level: "high", status: "unsupported" }, { retrieve: () => [chunks[2]], sourceRegistry: registry });
if (highPartial.claim.status !== "unsupported") errors.push("high-risk partial evidence must remain unsupported");
const conflict = matchClaimEvidence({ claim_id: "c7", text: "林忠诚（林松）是第五批国家级代表性传承人。", claim_type: "identity", risk_level: "critical", status: "unsupported" }, { retrieve, sourceRegistry: registry });
if (conflict.claim.status !== "unsupported" || !conflict.claim.evidence_refs.some((item) => item.support === "conflict")) errors.push("high-risk conflict must remain unsupported and retain conflict evidence");
const answerAudit = auditAnswerEvidence({ message_id: "m-1", question: "英歌为什么要敲槌？", answer: "槌击可以承担动作与节奏之间的时间标记。", retrieve, sourceRegistry: registry });
if (!answerAudit.claims.length || !answerAudit.diagnostics.length) errors.push("answer audit output missing claims/diagnostics");
const empty = auditAnswerEvidence({ message_id: "m-2", question: "介绍一下", answer: "这是一个没有事实内容的追问。", retrieve, sourceRegistry: registry });
if (empty.claims.length !== 0) errors.push("non-factual transition should not create claim");
const alias = answerToClaims("英歌为什么要敲槌？槌击可以提示队伍变阵。", { question: "英歌为什么要敲槌？" });
if (alias.length !== 1 || alias[0].claim_type !== "mechanism") errors.push("claim extraction should retain mechanism sentence");
const contextual = answerToClaims("英歌为什么要敲槌？这样可以让观众更清楚地感受到力量。", { question: "英歌为什么要敲槌？" });
if (contextual.length !== 1 || contextual[0].claim_type !== "mechanism") errors.push("contextual mechanism sentence should be retained");

console.log(JSON.stringify({ status: errors.length ? "fail" : "pass", cases: 16, errors, sample: answerAudit.summary }, null, 2));
if (errors.length) process.exitCode = 1;
