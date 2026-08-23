const evalMetrics = document.querySelector("#eval-metrics");
const evalMisses = document.querySelector("#eval-misses");
const evalStatus = document.querySelector("#eval-status");
const evalHistory = document.querySelector("#eval-history");
const evalRun = document.querySelector("#run-eval");
const evalLimit = document.querySelector("#eval-limit");
const answerRun = document.querySelector("#run-answer-eval");
const answerLimit = document.querySelector("#answer-eval-limit");
const answerMetrics = document.querySelector("#answer-metrics");
const answerStatus = document.querySelector("#answer-status");
const answerResults = document.querySelector("#answer-results");
const answerBadge = document.querySelector("#answer-eval-badge");
const readinessBadge = document.querySelector("#readiness-badge");
const readinessSummary = document.querySelector("#readiness-summary");
const readinessChecks = document.querySelector("#readiness-checks");
const automationBadge = document.querySelector("#automation-badge");
const automationSummary = document.querySelector("#automation-summary");
const automationHistory = document.querySelector("#automation-history");

function evalPercent(value) { return `${Math.round(Number(value || 0) * 100)}%`; }
function renderEvaluation(data) {
  const cards = [[data.recall_at_1, "Recall@1"], [data.recall_at_3, "Recall@3"], [data.recall_at_6, "Recall@6"], [data.must_term_coverage, "必备词覆盖"], [data.route_accuracy, "路由准确率"]];
  evalMetrics.innerHTML = cards.map(([value, label]) => `<div class="eval-card ${Number(value) >= .9 ? "good" : "warn"}"><b>${evalPercent(value)}</b><span>${label}</span></div>`).join("");
  const misses = data.misses_at_6 || [];
  evalMisses.innerHTML = misses.length ? `<table class="eval-table"><thead><tr><th>编号</th><th>问题</th><th>预期文件</th></tr></thead><tbody>${misses.map((item) => `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.query)}</td><td>${(item.expected_files || []).map(escapeHtml).join("<br>")}</td></tr>`).join("")}</tbody></table>` : `<div class="eval-note">Top ${evalLimit.value} 已覆盖全部可回答问题，没有发现漏召回。</div>`;
  evalStatus.textContent = `共评测 ${data.evaluated_answerable} 条可回答问题、${data.route_cases} 条边界路由；生成于 ${new Date(data.generated_at).toLocaleString("zh-CN")}`;
}
async function runEvaluation() {
  evalRun.disabled = true; evalRun.textContent = "评测中…";
  evalStatus.textContent = "正在读取标准问题集并计算检索指标…";
  try {
    const response = await fetch(`${base()}/api/admin/evaluation/run`, { method: "POST", headers: { "content-type": "application/json", ...adminHeaders() }, body: JSON.stringify({ limit: Number(evalLimit.value) }) });
    const data = await response.json(); if (!response.ok) throw new Error(data.message || "评测接口不可用");
    renderEvaluation(data); await loadEvaluationHistory();
  } catch (error) { evalMisses.textContent = error.message; evalStatus.textContent = "评测失败，请确认 backend/server.mjs 已启动"; }
  finally { evalRun.disabled = false; evalRun.textContent = "运行评测"; }
}
async function loadEvaluationHistory() {
  if (!evalHistory) return;
  try {
    const response = await fetch(`${base()}/api/admin/evaluation/history`, { headers: adminHeaders() });
    const data = await response.json(); if (!response.ok) throw new Error(data.message || "历史接口不可用");
    const items = data.items || [];
    evalHistory.innerHTML = items.length ? `<table class="eval-table"><thead><tr><th>时间</th><th>Top K</th><th>Recall@3</th><th>Recall@6</th><th>必备词</th></tr></thead><tbody>${items.map((item) => `<tr><td>${escapeHtml(new Date(item.generated_at).toLocaleString("zh-CN"))}</td><td>${item.limit}</td><td>${evalPercent(item.recall_at_3)}</td><td>${evalPercent(item.recall_at_6)}</td><td>${evalPercent(item.must_term_coverage)}</td></tr>`).join("")}</tbody></table>` : "暂无评测快照";
  } catch (error) { evalHistory.textContent = error.message; }
}
function renderAnswerQuality(data) {
  const cards = [[data.average_score, "平均分"], [data.pass_rate, "通过率"], [data.focus_rate, "开头切题率"], [data.citation_integrity_rate, "证据完整率"], [data.boundary_rate, "边界合格率"], [data.concise_rate, "精简度"], [data.forbidden_safe_rate, "错误泛化规避"]];
  answerMetrics.innerHTML = cards.map(([value, label]) => `<div class="eval-card ${Number(value) >= .75 ? "good" : "warn"}"><b>${evalPercent(value)}</b><span>${label}</span></div>`).join("");
  answerBadge.textContent = data.status === "partial" ? "部分完成" : "已完成";
  answerStatus.textContent = `${data.suite === "golden" ? "黄金集" : "检索集"}已生成 ${data.completed}/${data.requested} 题，模型 ${data.model}；${data.failures?.length ? `另有 ${data.failures.length} 题调用失败。` : "模型调用全部完成。"}`;
  answerResults.innerHTML = (data.results || []).map((item) => `<details class="answer-result"><summary><span><b>${escapeHtml(item.id)}</b>　${escapeHtml(item.query)}</span><span class="score">${item.score}%</span></summary><div class="answer-flags">${item.passed ? "通过" : "需复核"} · ${escapeHtml((item.issues || []).join("；") || "所有硬性指标通过")} · ${item.answer_chars || 0} 字符</div><div class="answer-copy">${escapeHtml(item.answer || "").replace(/\n/g, "<br>")}</div></details>`).join("") || "暂无结果";
}
async function runAnswerQuality() {
  answerRun.disabled = true; answerRun.textContent = "质检中…"; answerStatus.textContent = "正在逐题调用模型；不会用失败请求生成分数。";
  try {
    const response = await fetch(`${base()}/api/admin/evaluation/answers/run`, { method: "POST", headers: { "content-type": "application/json", ...adminHeaders() }, body: JSON.stringify({ limit: Number(answerLimit.value), suite: "golden", thinking: false }) });
    const data = await response.json();
    if (!response.ok) { answerBadge.textContent = "未完成"; answerStatus.textContent = data.message || "模型服务当前不可达，未生成假分数"; if (data.detail) answerStatus.textContent += `（${data.detail}）`; return; }
    renderAnswerQuality(data);
  } catch (error) { answerBadge.textContent = "连接失败"; answerStatus.textContent = `回答质检失败：${error.message}`; }
  finally { answerRun.disabled = false; answerRun.textContent = "运行黄金回归"; }
}
async function loadAnswerQualityHistory() {
  try {
    const response = await fetch(`${base()}/api/admin/evaluation/answers/history`, { headers: adminHeaders() });
    const data = await response.json();
    if (response.ok && data.items?.[0]) renderAnswerQuality(data.items[0]);
  } catch (_) {}
}
async function loadReadiness() {
  if (!readinessBadge) return;
  try {
    const response = await fetch(`${base()}/api/admin/evaluation/readiness`, { headers: adminHeaders() });
    const data = await response.json(); if (!response.ok) throw new Error(data.message || "门禁接口不可用");
    readinessBadge.textContent = data.label;
    readinessSummary.textContent = data.status === "ready" ? "检索与回答质量均达到上线阈值，可以进入 H5 联调。" : (data.status === "pending" ? "检索指标已满足，但还没有成功的模型回答质检快照。" : "有指标未达到上线阈值，请先修复并重新运行评测。");
    readinessChecks.innerHTML = (data.checks || []).map((item) => `<div class="readiness-check ${item.pass ? "pass" : (item.value === null ? "" : "fail")}"><b>${item.value === null ? "待测" : evalPercent(item.value)}</b><span>${escapeHtml(item.label)} · 阈值 ${evalPercent(item.threshold)}</span></div>`).join("");
  } catch (error) { readinessBadge.textContent = "检查失败"; readinessSummary.textContent = error.message; }
}
async function loadAutomationHistory() {
  if (!automationBadge) return;
  try {
    const response = await fetch(`${base()}/api/admin/automation/quality-history`, { headers: adminHeaders() });
    const data = await response.json(); if (!response.ok) throw new Error(data.message || "自动化记录接口不可用");
    const items = data.items || [];
    if (!items.length) { automationBadge.textContent = "未运行"; automationSummary.textContent = "尚未发现每日回归记录。可运行 automation/quality_regression.mjs。"; return; }
    const latest = items[0];
    automationBadge.textContent = latest.error ? "有异常" : "运行正常";
    automationSummary.textContent = `最近一次：${new Date(latest.generated_at).toLocaleString("zh-CN")} · 检索 ${latest.retrieval?.status || "未知"} · 门禁 ${latest.readiness?.label || "未知"}`;
    automationHistory.innerHTML = `<table class="eval-table"><thead><tr><th>时间</th><th>检索</th><th>门禁</th><th>模型质检</th></tr></thead><tbody>${items.slice(0, 8).map((item) => `<tr><td>${escapeHtml(new Date(item.generated_at).toLocaleString("zh-CN"))}</td><td>${escapeHtml(item.retrieval?.status || "未知")}</td><td>${escapeHtml(item.readiness?.label || "未知")}</td><td>${escapeHtml(item.answer_quality?.status || (item.model_qa_requested ? "不可用" : "未运行"))}</td></tr>`).join("")}</tbody></table>`;
  } catch (error) { automationBadge.textContent = "读取失败"; automationSummary.textContent = error.message; }
}
evalRun?.addEventListener("click", runEvaluation);
answerRun?.addEventListener("click", runAnswerQuality);
runEvaluation();
loadEvaluationHistory();
loadAnswerQualityHistory();
loadReadiness();
loadAutomationHistory();
