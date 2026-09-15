const MAX_CONFLICT_NOTE = 1200;

function normalizeAnswer(value = "") {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function check(key, label, pass, detail, blocking = true) {
  return { key, label, pass: Boolean(pass), detail, blocking };
}

function claimStatusCounts(claims = []) {
  return claims.reduce((counts, claim) => {
    const status = String(claim?.status || "unsupported");
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, { supported: 0, partial: 0, conflicted: 0, unsupported: 0 });
}

/**
 * The golden set must have a server-side, current evidence audit before it can
 * be promoted. `audit` must come from store.getEvidenceAudit(); browser input
 * is deliberately not accepted here.
 */
export function evaluateGoldenEvidenceGate({ audit = null, answer = "", conflict_note = "" } = {}) {
  const currentAnswer = normalizeAnswer(answer);
  const storedAnswer = normalizeAnswer(audit?.answer || "");
  const claims = Array.isArray(audit?.claims) ? audit.claims : [];
  const counts = claimStatusCounts(claims);
  const total = claims.length;
  const supportRate = total ? counts.supported / total : 0;
  const criticalClaims = claims.filter((claim) => String(claim?.risk_level || "").toLowerCase() === "critical");
  const highClaims = claims.filter((claim) => String(claim?.risk_level || "").toLowerCase() === "high");
  const unsupportedCritical = criticalClaims.filter((claim) => claim.status !== "supported");
  const unsafeHigh = highClaims.filter((claim) => ["unsupported", "conflicted"].includes(String(claim.status || "unsupported")));
  const note = String(conflict_note || "").trim().slice(0, MAX_CONFLICT_NOTE);
  const current = Boolean(audit?.message_id) && Boolean(storedAnswer) && storedAnswer === currentAnswer;
  const conflictResolved = counts.conflicted === 0 || note.length >= 12;

  const checks = [
    check(
      "evidence_audit_current",
      "逐句审计已锁定",
      current,
      !audit?.message_id
        ? "尚未运行服务器端逐句证据审计"
        : !storedAnswer
          ? "审计缺少回答快照，必须重新审计"
          : current
            ? "服务器审计与当前审核答案一致"
            : "审核答案已改变，必须重新运行逐句审计",
    ),
    check(
      "critical_claims_supported",
      "关键声明有直接证据",
      Boolean(total) && unsupportedCritical.length === 0,
      !total ? "没有可验收的事实声明" : unsupportedCritical.length ? `${unsupportedCritical.length} 条 critical 声明不是直接支持` : `${criticalClaims.length} 条 critical 声明均为直接支持`,
    ),
    check(
      "high_claims_supported",
      "高风险声明有直接证据",
      unsafeHigh.length === 0,
      unsafeHigh.length ? `${unsafeHigh.length} 条 high 声明存在无证据或冲突` : `${highClaims.length} 条 high 声明均未发现高风险缺口`,
    ),
    check(
      "evidence_support_rate",
      "总声明支持率 ≥ 90%",
      Boolean(total) && supportRate >= 0.9,
      `${counts.supported}/${total || 0} 条直接支持（${Math.round(supportRate * 100)}%）`,
    ),
    check(
      "evidence_conflicts_resolved",
      "证据冲突已处理",
      conflictResolved,
      counts.conflicted === 0 ? "未发现冲突声明" : conflictResolved ? `发现 ${counts.conflicted} 条冲突，已填写人工处理说明` : `发现 ${counts.conflicted} 条冲突，需填写至少 12 字处理说明`,
    ),
  ];
  const blocking = checks.filter((item) => item.blocking !== false);
  const passed = blocking.every((item) => item.pass);
  return {
    passed,
    locked: !passed,
    score: Math.round((blocking.filter((item) => item.pass).length / Math.max(1, blocking.length)) * 100),
    checks,
    failed_checks: checks.filter((item) => !item.pass),
    conflict_note: note,
    summary: {
      total_claims: total,
      supported_claims: counts.supported,
      support_rate: Number(supportRate.toFixed(4)),
      status_counts: counts,
      critical_claims: criticalClaims.length,
      unsupported_critical: unsupportedCritical.length,
      high_claims: highClaims.length,
      unsafe_high: unsafeHigh.length,
      conflict_count: counts.conflicted,
    },
    audit_message_id: String(audit?.message_id || ""),
  };
}

export { normalizeAnswer };
