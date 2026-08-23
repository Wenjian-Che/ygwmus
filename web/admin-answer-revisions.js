const revisionList = document.querySelector("#revision-list");
const revisionDetail = document.querySelector("#revision-detail");
const revisionFilter = document.querySelector("#revision-filter");
const drafts = new Map();
const audits = new Map();
const auditAnswers = new Map();
const auditLoads = new Set();
let revisionItems = [];
let selectedId = "";
let gatePassed = false;

function fmt(value) { return value ? new Date(value).toLocaleString("zh-CN") : "—"; }
function renderMetrics(data) {
  const counts = data.priority_counts || {};
  document.querySelector("#revision-metrics").innerHTML = [[data.count,"待诊断"],[counts.P0,"P0 紧急"],[counts.P1,"P1 高优"],[counts.P2,"P2 观察"],[counts.P3,"P3 正常"]].map(([value,label]) => `<div class="metric"><b>${Number(value || 0)}</b><span>${label}</span></div>`).join("");
}
function renderList() {
  document.querySelector("#revision-count").textContent = `${revisionItems.length} 条`;
  revisionList.innerHTML = revisionItems.map((item) => `<button class="revision-card ${item.message_id === selectedId ? "active" : ""}" data-id="${escapeHtml(item.message_id)}"><div class="revision-card-head"><h3>${escapeHtml(item.question)}</h3><span class="priority ${escapeHtml(item.priority)}">${escapeHtml(item.priority)}</span></div><p>风险 ${item.risk_score} · ${item.findings.length} 项诊断 · ${item.citation_count} 个来源</p></button>`).join("") || `<div class="empty-detail">当前没有需要修订的回答</div>`;
}
function citationHtml(draft, item) {
  const citations = draft?.citations || [];
  if (citations.length) return citations.map((source) => source.url ? `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.title || source.publisher || source.source_id)}</a>` : `<span>${escapeHtml(source.title || source.source_id)}</span>`).join("");
  return item.citation_files?.length ? `<span>内部证据索引已记录 · 真实来源请查看逐句审计</span>` : `<span>暂无可核验来源</span>`;
}
function auditStatusMeta(status) {
  return ({
    supported: { label: "直接支持", tone: "supported" },
    partial: { label: "部分支持", tone: "partial" },
    conflicted: { label: "存在冲突", tone: "conflict" },
    unsupported: { label: "无直接支持", tone: "unsupported" },
  })[status] || { label: "待核验", tone: "unsupported" };
}
function safeHttpsUrl(url) { return /^https:\/\//i.test(String(url || "")) ? String(url) : ""; }
function renderAuditSources(claim, audit) {
  const sourceMap = new Map((audit.sources || []).map((source) => [source.source_id, source]));
  const refs = claim.evidence_refs || [];
  const sources = refs.map((ref) => sourceMap.get(ref.source_id) || { source_id: ref.source_id, title: ref.source_id, publisher: "待核来源", url: ref.url }).filter((source, index, all) => source && all.findIndex((item) => item.source_id === source.source_id) === index);
  if (!sources.length) return `<div class="audit-no-source">未解析到可点击的真实来源。该句不能直接进入自动验收。</div>`;
  return sources.map((source) => {
    const url = safeHttpsUrl(source.url);
    const label = `${source.title || source.source_id} · ${source.publisher || "待核来源"}`;
    return url ? `<a class="audit-source" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}<br><small>${escapeHtml(source.grade || "待核等级")} · 打开原始来源 ↗</small></a>` : `<span class="audit-source">${escapeHtml(label)}</span>`;
  }).join("");
}
function renderEvidenceAudit(item) {
  const draft = drafts.get(item.message_id);
  const target = draft ? "draft" : "original";
  const audit = audits.get(item.message_id);
  const targetLabel = auditAnswers.get(item.message_id) === "draft" ? "修订草稿" : "原回答";
  if (!audit) return `<section class="evidence-audit"><div class="audit-head"><div><p class="audit-kicker">SENTENCE-LEVEL EVIDENCE</p><h3>逐句证据审计</h3><p>把回答拆成事实句，逐句检查证据、风险和真实来源；不会自动写入黄金集。</p></div><div class="audit-gate">尚未运行</div></div><div class="audit-empty"><b>先运行一次审计</b><p>当前将审计${target === "draft" ? "修订草稿" : "原回答"}。审计结果会保存，可在下次打开时继续查看。</p><button class="button ghost" data-audit="${target}">运行逐句审计</button></div></section>`;
  const counts = audit.summary?.status_counts || {};
  const gatePassed = audit.passed === true;
  const reasons = (audit.decision_reasons || []).map((reason) => `<li>${escapeHtml(reason)}</li>`).join("");
  const rows = (audit.claims || []).map((claim) => {
    const meta = auditStatusMeta(claim.status);
    const refs = (claim.evidence_refs || []).map((ref) => { const quote = String(ref.quote || "暂无短引文"); return `<details class="audit-ref"><summary>${escapeHtml(quote.slice(0, 96))}${quote.length > 96 ? "…" : ""}</summary><p>${escapeHtml(quote)}</p><small>${escapeHtml(ref.support || "待核")} · ${escapeHtml(ref.grade || "待核等级")} · ${escapeHtml(ref.chunk_id || "无切片 ID")}</small></details>`; }).join("") || `<div class="audit-no-source">暂无证据片段</div>`;
    return `<article class="audit-row"><div class="audit-cell"><div class="audit-cell-label"><span>事实声明</span><span>${escapeHtml(claim.claim_id)}</span></div><div class="audit-claim-text">${escapeHtml(claim.text)}</div><div class="audit-badges"><span class="audit-badge ${meta.tone}">${meta.label}</span><span class="audit-badge">${escapeHtml(claim.claim_type)}</span><span class="audit-badge">${escapeHtml(claim.risk_level)} 风险</span></div></div><div class="audit-cell"><div class="audit-cell-label"><span>证据片段</span><span>${(claim.evidence_refs || []).length} 条</span></div>${refs}</div><div class="audit-cell"><div class="audit-cell-label"><span>真实来源</span><span>可追溯</span></div>${renderAuditSources(claim, audit)}</div></article>`;
  }).join("") || `<div class="audit-empty"><b>没有识别出可审计事实句</b><p>这不代表回答正确，只表示当前回答更像建议、过渡或追问，需要人工判断。</p></div>`;
  return `<section class="evidence-audit"><div class="audit-head"><div><p class="audit-kicker">SENTENCE-LEVEL EVIDENCE</p><h3>逐句证据审计</h3><p>当前审计：${targetLabel} · 生成于 ${escapeHtml(fmt(audit.generated_at))}</p></div><div class="audit-gate ${gatePassed ? "pass" : "fail"}">${gatePassed ? "可继续自动验收" : "需要人工复核"}</div></div><div class="audit-stats"><div class="audit-stat"><b>${Number(audit.summary?.total_claims || 0)}</b><span>事实声明</span></div><div class="audit-stat"><b>${Number(counts.supported || 0)}</b><span>直接支持</span></div><div class="audit-stat"><b>${Number(counts.partial || 0)}</b><span>部分支持</span></div><div class="audit-stat"><b>${Number(counts.conflicted || 0)}</b><span>证据冲突</span></div><div class="audit-stat"><b>${Number(audit.summary?.high_risk_gaps || 0)}</b><span>高风险缺口</span></div></div><div class="audit-controls"><small>三列分别显示声明、证据片段和可点击的真实来源</small><button class="button ghost" data-audit="${target}">重新审计${target === "draft" ? "草稿" : "原回答"}</button></div><div class="audit-rows">${rows}</div>${reasons ? `<div class="audit-reasons"><b>验收闸门说明</b><ul>${reasons}</ul></div>` : ""}</section>`;
}
async function loadStoredAudit(item) {
  if (!item?.message_id || audits.has(item.message_id) || auditLoads.has(item.message_id)) return;
  auditLoads.add(item.message_id);
  try {
    const response = await fetch(`${base()}/api/admin/feedback/revisions/audits/${encodeURIComponent(item.message_id)}`, { headers: adminHeaders() });
    if (response.ok) {
      const data = await response.json();
      audits.set(item.message_id, data);
      auditAnswers.set(item.message_id, data.answer === (drafts.get(item.message_id)?.draft_answer || "") ? "draft" : "original");
      if (selectedId === item.message_id) renderDetail();
    }
  } catch (_) {
    // A missing audit is an expected first-run state; the button remains available.
  } finally { auditLoads.delete(item.message_id); }
}
function renderDetail() {
  const item = revisionItems.find((entry) => entry.message_id === selectedId);
  if (!item) { revisionDetail.innerHTML = `<div class="empty-detail">从左侧选择一条回答开始诊断</div>`; return; }
  const draft = drafts.get(item.message_id);
  const draftRisk = draft?.draft_diagnosis?.risk_score;
  revisionDetail.innerHTML = `<div class="detail-top"><div><p class="panel-kicker">SELECTED ANSWER</p><h2>${escapeHtml(item.question)}</h2><div class="detail-tags"><span>${escapeHtml(item.intent)}</span><span>${escapeHtml(item.quality)}</span>${item.rating ? `<span>${item.rating === "down" ? "用户点踩" : "用户点赞"}</span>` : ""}<span>${fmt(item.created_at)}</span></div></div><div class="risk-score"><b>${item.risk_score}</b><span>修订风险分 / 100</span></div></div><div class="findings">${item.findings.map((finding) => `<div class="finding ${escapeHtml(finding.severity)}"><i></i><div><b>${escapeHtml(finding.title)}</b><p>${escapeHtml(finding.detail)} ${escapeHtml(finding.action)}</p></div></div>`).join("")}</div><div class="outline"><h3>建议回答骨架</h3><ol>${item.suggested_outline.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ol></div><div class="diagnosis-grid"><section class="answer-box"><div class="answer-label"><span>原回答</span><span>${item.original_answer.length} 字</span></div><div class="answer-body">${escapeHtml(item.original_answer || "暂无回答")}</div></section><section class="answer-box draft"><div class="answer-label"><span>修订草稿</span><span>${draft ? `风险 ${draftRisk}` : "尚未生成"}</span></div>${draft ? `<div class="answer-body">${escapeHtml(draft.draft_answer)}</div>` : `<div class="draft-placeholder">按当前知识证据重新生成<br>不会自动发布</div>`}</section></div>${renderEvidenceAudit(item)}<div class="source-list">${citationHtml(draft, item)}</div>${item.golden_match ? `<div class="revision-status">匹配黄金回答：${escapeHtml(item.golden_match.question)}（${escapeHtml(item.golden_match.id)}）</div>` : ""}<div class="revision-actions"><button class="button primary" data-generate>${draft ? "重新生成修订稿" : "生成修订稿"}</button><button class="button ghost" data-create-task>生成知识任务</button>${draft ? `<button class="button ghost" data-open-golden>送入人工审核</button>` : ""}<button class="button ghost" data-resolve>标记已处理</button></div><div class="revision-status" id="revision-status"></div>`;
  loadStoredAudit(item);
}
async function apiPost(path, body) {
  const response = await fetch(`${base()}${path}`, { method:"POST", headers:{"content-type":"application/json",...adminHeaders()}, body:JSON.stringify(body) });
  const data = await response.json(); if (!response.ok) throw new Error(data.message || "操作失败"); return data;
}
async function loadRevisions() {
  revisionDetail.innerHTML = `<div class="empty-detail">正在分析真实回答…</div>`;
  try {
    const response = await fetch(`${base()}/api/admin/feedback/revisions?status=${encodeURIComponent(revisionFilter.value)}`, { headers:adminHeaders() });
    const data = await response.json(); if (!response.ok) throw new Error(data.message || "修订接口不可用");
    revisionItems = data.items || []; renderMetrics(data);
    if (!revisionItems.some((item) => item.message_id === selectedId)) selectedId = revisionItems[0]?.message_id || "";
    renderList(); renderDetail();
  } catch (error) { revisionList.innerHTML = `<div class="empty-detail">${escapeHtml(error.message)}</div>`; revisionDetail.innerHTML = ""; }
}
revisionList.addEventListener("click", (event) => { const card = event.target.closest("[data-id]"); if (!card) return; selectedId = card.dataset.id; renderList(); renderDetail(); });
revisionDetail.addEventListener("click", async (event) => {
  const item = revisionItems.find((entry) => entry.message_id === selectedId); if (!item) return;
  const status = document.querySelector("#revision-status");
  try {
    if (event.target.closest("[data-audit]")) {
      const button = event.target.closest("[data-audit]");
      const target = button.dataset.audit === "draft" ? "draft" : "original";
      const answer = target === "draft" ? drafts.get(item.message_id)?.draft_answer : item.original_answer;
      if (!answer) throw new Error("当前没有可审计的回答内容");
      button.disabled = true; button.textContent = "正在逐句匹配…";
      const data = await apiPost("/api/admin/feedback/revisions/audit-evidence", { message_id:item.message_id, question:item.question, answer });
      audits.set(item.message_id, data); auditAnswers.set(item.message_id, target); renderDetail();
      document.querySelector("#revision-status").textContent = data.passed ? "逐句审计通过，可继续自动验收；仍需人工确认。" : `逐句审计完成：${(data.decision_reasons || []).join("；") || "需要人工复核"}`;
    } else if (event.target.closest("[data-generate]")) {
      const button = event.target.closest("[data-generate]"); button.disabled = true; button.textContent = "正在按证据重写…";
      const draft = await apiPost("/api/admin/feedback/revisions/generate", { message_id:item.message_id }); drafts.set(item.message_id, draft); renderDetail();
    } else if (event.target.closest("[data-create-task]")) {
      const data = await apiPost("/api/admin/unanswered/promote", { app_id:item.app_id, question:item.question, intent:item.intent, quality:item.quality }); status.textContent = data.created ? "知识补充任务已创建。" : "该知识任务已经存在。";
    } else if (event.target.closest("[data-resolve]")) {
      await apiPost("/api/admin/feedback/status", { message_id:item.message_id, status:"resolved" }); await loadRevisions();
    } else if (event.target.closest("[data-open-golden]")) openGolden(item, drafts.get(item.message_id));
  } catch (error) { renderDetail(); document.querySelector("#revision-status").textContent = error.message; }
});
function openGolden(item, draft) {
  gatePassed = false;
  document.querySelector("#golden-message-id").value = item.message_id;
  document.querySelector("#golden-question").value = item.question;
  document.querySelector("#golden-answer").value = draft?.draft_answer || item.original_answer;
  document.querySelector("#golden-category").value = item.intent;
  document.querySelector("#golden-aliases").value = "";
  document.querySelector("#golden-direct").value = item.kind === "why" ? "因为,主要,作用" : item.kind === "compare" ? "区别,不同,相比" : "是,可以,需要";
  document.querySelector("#golden-must").value = "";
  document.querySelector("#golden-forbidden").value = "全国统一,所有队伍都一样";
  document.querySelector("#golden-sources").value = (item.citation_files || []).join("\n");
  document.querySelector("#golden-conflict-note").value = "";
  document.querySelector("#golden-status").textContent = item.citation_files?.length ? "" : "当前没有来源文件，请先生成知识任务并补齐证据。";
  document.querySelector("#golden-gate-report").innerHTML = `<div class="gate-score fail"><span>发布锁尚未解除</span><b>待验收</b></div>`;
  document.querySelector("#golden-submit").disabled = true;
  document.querySelector("#revision-golden-dialog").showModal();
}
function goldenPayload() {
  return { message_id:document.querySelector("#golden-message-id").value, question:document.querySelector("#golden-question").value, approved_answer:document.querySelector("#golden-answer").value, category:document.querySelector("#golden-category").value, aliases:document.querySelector("#golden-aliases").value, direct_terms:document.querySelector("#golden-direct").value, must_terms:document.querySelector("#golden-must").value, forbidden_terms:document.querySelector("#golden-forbidden").value, source_files:document.querySelector("#golden-sources").value, conflict_note:document.querySelector("#golden-conflict-note").value, require_boundary:document.querySelector("#golden-boundary").checked };
}
function renderGate(gate) {
  const report = document.querySelector("#golden-gate-report");
  report.innerHTML = `<div class="gate-score ${gate.passed ? "" : "fail"}"><span>${gate.passed ? "自动验收通过，发布锁已解除" : `还有 ${gate.failed_checks.length} 项未通过`}</span><b>${gate.score}</b></div><div class="gate-report">${gate.checks.map((item) => `<div class="gate-check ${item.pass ? "" : "fail"}"><i></i><span><b>${escapeHtml(item.label)}</b><br>${escapeHtml(item.detail)}</span></div>`).join("")}</div>`;
  gatePassed = gate.passed;
  document.querySelector("#golden-submit").disabled = !gatePassed;
}
document.querySelector("#golden-cancel").addEventListener("click", () => document.querySelector("#revision-golden-dialog").close());
document.querySelector("#golden-validate").addEventListener("click", async (event) => {
  const form = document.querySelector("#revision-golden-form"); if (!form.reportValidity()) return;
  const button = event.currentTarget; const status = document.querySelector("#golden-status"); button.disabled = true; status.textContent = "正在检查回答结构、来源和别名检索…";
  try { const gate = await apiPost("/api/admin/feedback/revisions/validate", goldenPayload()); renderGate(gate); status.textContent = gate.passed ? "自动验收通过。请继续人工核对事实后发布。" : "验收未通过，请按红色检查项继续修改。"; }
  catch (error) { status.textContent = error.message; }
  finally { button.disabled = false; }
});
document.querySelector("#revision-golden-form").addEventListener("input", () => {
  if (!gatePassed) return; gatePassed = false; document.querySelector("#golden-submit").disabled = true;
  document.querySelector("#golden-gate-report").innerHTML = `<div class="gate-score fail"><span>内容已改变，需要重新验收</span><b>已锁定</b></div>`;
});
document.querySelector("#revision-golden-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const status = document.querySelector("#golden-status"); if (!gatePassed) { status.textContent = "请先运行并通过自动验收。"; return; } status.textContent = "正在写入黄金集…";
  try {
    const data = await apiPost("/api/admin/feedback/promote-golden", goldenPayload());
    status.textContent = `已加入 ${data.item.id}，知识版本 ${data.version}`; window.setTimeout(() => { document.querySelector("#revision-golden-dialog").close(); loadRevisions(); }, 900);
  } catch (error) { status.textContent = error.message; }
});
document.querySelector("#revision-refresh").addEventListener("click", loadRevisions);
revisionFilter.addEventListener("change", loadRevisions);
loadRevisions();
