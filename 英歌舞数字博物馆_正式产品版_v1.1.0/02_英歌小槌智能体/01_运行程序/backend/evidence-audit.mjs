/**
 * Evidence-audit data contract and deterministic validation.
 *
 * This module deliberately does not call a model, read files, or access the
 * network. It only normalizes and validates the claim -> evidence -> source
 * structure used by later audit API and admin UI work packages.
 */

export const EVIDENCE_AUDIT_ENUMS = Object.freeze({
  claim_type: Object.freeze(["fact", "mechanism", "comparison", "identity", "date", "number", "realtime", "inference"]),
  risk_level: Object.freeze(["low", "medium", "high", "critical"]),
  support: Object.freeze(["direct", "partial", "conflict", "none"]),
  status: Object.freeze(["supported", "partial", "unsupported", "conflicted"]),
  grade: Object.freeze(["A", "B", "C", "D"]),
});

const ENUM_SETS = Object.fromEntries(
  Object.entries(EVIDENCE_AUDIT_ENUMS).map(([key, values]) => [key, new Set(values)]),
);

const MAX_QUOTE_LENGTH = 1000;

function text(value) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function hasText(value) {
  return text(value).length > 0;
}

function issue(path, code, message) {
  return { path, code, message };
}

function normalizeEnum(value, key) {
  const candidate = text(value);
  if (key === "grade") return candidate.toUpperCase();
  return candidate;
}

function normalizeEvidenceRef(ref = {}) {
  return {
    chunk_id: text(ref.chunk_id),
    source_file: text(ref.source_file),
    source_id: text(ref.source_id),
    quote: text(ref.quote).slice(0, MAX_QUOTE_LENGTH),
    grade: normalizeEnum(ref.grade, "grade"),
    url: text(ref.url),
    support: normalizeEnum(ref.support, "support"),
  };
}

export function normalizeClaim(claim = {}) {
  return {
    claim_id: text(claim.claim_id),
    text: text(claim.text),
    claim_type: normalizeEnum(claim.claim_type, "claim_type"),
    risk_level: normalizeEnum(claim.risk_level, "risk_level"),
    evidence_refs: Array.isArray(claim.evidence_refs)
      ? claim.evidence_refs.map(normalizeEvidenceRef)
      : [],
    status: normalizeEnum(claim.status, "status"),
  };
}

export function normalizeAudit(input = {}) {
  const claims = Array.isArray(input.claims) ? input.claims.map(normalizeClaim) : [];
  return {
    audit_id: text(input.audit_id),
    message_id: text(input.message_id),
    question: text(input.question),
    answer: text(input.answer),
    generated_at: text(input.generated_at || input.created_at) || null,
    claims,
    metadata: input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
      ? { ...input.metadata }
      : {},
  };
}

export function validateEvidenceRef(ref = {}, path = "evidence_ref") {
  const normalized = normalizeEvidenceRef(ref);
  const errors = [];
  for (const field of ["chunk_id", "source_file", "source_id", "quote", "grade", "url", "support"]) {
    if (!hasText(normalized[field])) errors.push(issue(`${path}.${field}`, "required", `${field} 不能为空`));
  }
  if (hasText(normalized.grade) && !ENUM_SETS.grade.has(normalized.grade)) {
    errors.push(issue(`${path}.grade`, "enum", `grade 必须是 ${EVIDENCE_AUDIT_ENUMS.grade.join("/中的一个")}`));
  }
  if (hasText(normalized.support) && !ENUM_SETS.support.has(normalized.support)) {
    errors.push(issue(`${path}.support`, "enum", `support 必须是 ${EVIDENCE_AUDIT_ENUMS.support.join("/中的一个")}`));
  }
  if (hasText(normalized.quote) && text(ref.quote).length > MAX_QUOTE_LENGTH) {
    errors.push(issue(`${path}.quote`, "too_long", `quote 不能超过 ${MAX_QUOTE_LENGTH} 个字符`));
  }
  if (hasText(normalized.url)) {
    try {
      const url = new URL(normalized.url);
      if (url.protocol !== "https:") errors.push(issue(`${path}.url`, "url_protocol", "真实来源链接必须使用 HTTPS"));
    } catch {
      errors.push(issue(`${path}.url`, "url_format", "url 不是有效链接"));
    }
  }
  return { valid: errors.length === 0, errors, normalized };
}

export function validateClaim(claim = {}, path = "claim") {
  const normalized = normalizeClaim(claim);
  const errors = [];
  for (const field of ["claim_id", "text", "claim_type", "risk_level", "status"]) {
    if (!hasText(normalized[field])) errors.push(issue(`${path}.${field}`, "required", `${field} 不能为空`));
  }
  for (const key of ["claim_type", "risk_level", "status"]) {
    if (hasText(normalized[key]) && !ENUM_SETS[key].has(normalized[key])) {
      errors.push(issue(`${path}.${key}`, "enum", `${key} 不是允许的枚举值`));
    }
  }

  const refs = normalized.evidence_refs;
  refs.forEach((ref, index) => {
    errors.push(...validateEvidenceRef(ref, `${path}.evidence_refs[${index}]`).errors);
  });
  const directCount = refs.filter((ref) => ref.support === "direct").length;
  const conflictCount = refs.filter((ref) => ref.support === "conflict").length;

  if (normalized.status === "supported") {
    if (!refs.length) errors.push(issue(`${path}.evidence_refs`, "support_required", "supported 声明至少需要一个证据片段"));
    if (!directCount) errors.push(issue(`${path}.evidence_refs`, "direct_required", "supported 声明至少需要一条 direct 证据"));
    if (conflictCount) errors.push(issue(`${path}.status`, "conflict_status", "含 conflict 证据时不能标记为 supported"));
  }
  if (normalized.status === "partial" && !refs.length) {
    errors.push(issue(`${path}.evidence_refs`, "support_required", "partial 声明至少需要一个证据片段"));
  }
  if (normalized.status === "conflicted") {
    if (refs.length < 2) errors.push(issue(`${path}.evidence_refs`, "conflict_refs_required", "conflicted 声明至少需要两条证据片段"));
    if (!conflictCount) errors.push(issue(`${path}.evidence_refs`, "conflict_support_required", "conflicted 声明至少需要一条 support=conflict 的证据"));
  }
  if (normalized.status === "unsupported" && directCount) {
    errors.push(issue(`${path}.status`, "unsupported_has_direct", "含 direct 证据时不能标记为 unsupported"));
  }
  if (["high", "critical"].includes(normalized.risk_level) && !directCount && normalized.status !== "unsupported") {
    errors.push(issue(`${path}.status`, "high_risk_without_direct", "高风险声明没有 direct 证据时必须标记为 unsupported"));
  }

  return { valid: errors.length === 0, errors, normalized };
}

export function summarizeClaims(claims = []) {
  const normalizedClaims = Array.isArray(claims) ? claims.map(normalizeClaim) : [];
  const statusCounts = Object.fromEntries(EVIDENCE_AUDIT_ENUMS.status.map((key) => [key, 0]));
  const riskCounts = Object.fromEntries(EVIDENCE_AUDIT_ENUMS.risk_level.map((key) => [key, 0]));
  for (const claim of normalizedClaims) {
    if (Object.hasOwn(statusCounts, claim.status)) statusCounts[claim.status] += 1;
    if (Object.hasOwn(riskCounts, claim.risk_level)) riskCounts[claim.risk_level] += 1;
  }
  const supported = statusCounts.supported;
  return {
    total_claims: normalizedClaims.length,
    status_counts: statusCounts,
    risk_counts: riskCounts,
    support_rate: normalizedClaims.length ? Number((supported / normalizedClaims.length).toFixed(4)) : 1,
    high_risk_gaps: normalizedClaims.filter((claim) => ["high", "critical"].includes(claim.risk_level) && claim.status !== "supported").length,
    conflict_count: statusCounts.conflicted,
  };
}

export function validateEvidenceAudit(input = {}) {
  const normalized = normalizeAudit(input);
  const errors = [];
  for (const field of ["message_id", "answer"]) {
    if (!hasText(normalized[field])) errors.push(issue(field, "required", `${field} 不能为空`));
  }
  if (!Array.isArray(input.claims)) errors.push(issue("claims", "array_required", "claims 必须是数组"));
  normalized.claims.forEach((claim, index) => {
    errors.push(...validateClaim(claim, `claims[${index}]`).errors);
  });
  return {
    valid: errors.length === 0,
    errors,
    normalized,
    summary: summarizeClaims(normalized.claims),
  };
}

export function buildEvidenceAudit(input = {}) {
  const normalized = normalizeAudit({ ...input, generated_at: input.generated_at || new Date().toISOString() });
  const result = validateEvidenceAudit(normalized);
  return {
    ...result.normalized,
    summary: result.summary,
    valid: result.valid,
    errors: result.errors,
  };
}

export function assertValidEvidenceAudit(input = {}) {
  const result = validateEvidenceAudit(input);
  if (!result.valid) {
    const error = new Error(`Evidence audit validation failed: ${result.errors.map((item) => `${item.path} ${item.message}`).join("; ")}`);
    error.code = "EVIDENCE_AUDIT_INVALID";
    error.validation = result;
    throw error;
  }
  return result.normalized;
}

