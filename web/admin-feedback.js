const feedbackList = document.querySelector("#feedback-list");
const feedbackMetrics = document.querySelector("#feedback-metrics");
const feedbackFilter = document.querySelector("#feedback-filter");
const feedbackBadge = document.querySelector("#feedback-badge");
const feedbackStatus = document.querySelector("#feedback-status");
const goldenDialog = document.querySelector("#golden-dialog");
let feedbackItems = [];
let questionClusters = [];

function formatTime(value) { return value ? new Date(value).toLocaleString("zh-CN") : "—"; }
function renderMetrics(metrics = {}) {
  const cards = [[metrics.total, "总问答"], [metrics.needs_review, "待复核"], [metrics.downvotes, "用户点踩"], [metrics.low_confidence, "低置信度"], [metrics.golden, "已进黄金集"]];
  feedbackMetrics.innerHTML = cards.map(([value, label]) => `<div class="feedback-card"><b>${Number(value || 0)}</b><span>${label}</span></div>`).join("");
}
function renderItems() {
  feedbackBadge.textContent = `${feedbackItems.length} 条`;
  feedbackList.innerHTML = feedbackItems.map((item) => `<article class="feedback-item" data-message-id="${escapeHtml(item.message_id)}"><div class="feedback-head"><h3>${escapeHtml(item.question)}</h3><small>${escapeHtml(formatTime(item.created_at))}</small></div><div class="feedback-tags"><span>${escapeHtml(item.app_id)}</span><span>${escapeHtml(item.intent)}</span><span class="${item.quality === "supported" ? "" : "bad"}">${escapeHtml(item.quality)}</span><span>${item.citation_count || 0} 个来源</span>${item.rating ? `<span class="${item.rating === "down" ? "bad" : ""}">${item.rating === "down" ? "用户点踩" : "用户点赞"}</span>` : ""}${(item.feedback_reasons || []).map((reason) => `<span class="bad">${escapeHtml(reason)}</span>`).join("")}</div><div class="feedback-answer">${escapeHtml(item.answer || "暂无回答")}</div><div class="feedback-actions"><button class="button ghost" data-create-task>生成知识任务</button><button class="button ghost" data-resolve>标记已处理</button><button class="button ghost" data-delete>删除记录</button><button class="button primary" data-open-golden>审核并加入黄金集</button></div></article>`).join("") || `<div class="feedback-empty">当前筛选条件下没有记录。</div>`;
}
async function loadFeedback() {
  feedbackStatus.textContent = "正在同步真实问答记录…";
  try {
    const response = await fetch(`${base()}/api/admin/feedback?status=${encodeURIComponent(feedbackFilter.value)}`, { headers: adminHeaders() });
    const data = await response.json(); if (!response.ok) throw new Error(data.message || "反馈接口不可用");
    feedbackItems = data.items || []; renderMetrics(data.metrics); renderItems();
    feedbackStatus.textContent = `更新于 ${formatTime(data.generated_at)}。系统不记录用户 IP，仅保存问题、回答、证据等级与主动反馈。`;
  } catch (error) { feedbackBadge.textContent = "读取失败"; feedbackStatus.textContent = error.message; }
}
async function post(path, body) {
  const response = await fetch(`${base()}${path}`, { method: "POST", headers: { "content-type": "application/json", ...adminHeaders() }, body: JSON.stringify(body) });
  const data = await response.json(); if (!response.ok) throw new Error(data.message || "操作失败"); return data;
}
function renderClusters(data) {
  questionClusters = data.clusters || [];
  const counts = data.priority_counts || {};
  document.querySelector("#cluster-summary").textContent = `${data.interaction_count || 0} 条真实问答聚合成 ${data.cluster_count || 0} 个主题 · P0 ${counts.P0 || 0} · P1 ${counts.P1 || 0} · 更新于 ${formatTime(data.generated_at)}`;
  document.querySelector("#cluster-list").innerHTML = questionClusters.map((item) => `<article class="cluster-item" data-cluster-id="${escapeHtml(item.cluster_id)}"><div class="cluster-head"><h3>${escapeHtml(item.title)}</h3><span class="priority ${escapeHtml(item.priority)}">${escapeHtml(item.priority)}</span></div><div class="cluster-stats"><span>${item.volume} 次提问</span><span>${item.unique_questions} 种问法</span><span>${item.downvotes} 次点踩</span><span>${item.low_confidence} 次低置信</span><span>优先分 ${item.priority_score}</span></div><p class="cluster-action">${escapeHtml(item.suggested_action)}</p><details><summary>查看归并问法</summary><ul class="cluster-questions">${(item.questions || []).map((question) => `<li>${escapeHtml(question)}</li>`).join("")}</ul></details><button class="button ghost" data-cluster-task>生成主题知识任务</button></article>`).join("") || `<div class="feedback-empty">真实问答积累后，这里会自动形成主题。</div>`;
}
async function loadClusters() {
  try {
    const response = await fetch(`${base()}/api/admin/feedback/clusters`, { headers: adminHeaders() });
    const data = await response.json(); if (!response.ok) throw new Error(data.message || "聚类接口不可用");
    renderClusters(data);
  } catch (error) { document.querySelector("#cluster-summary").textContent = error.message; }
}
function openGolden(item) {
  document.querySelector("#golden-message-id").value = item.message_id;
  document.querySelector("#golden-question").value = item.question || "";
  document.querySelector("#golden-answer").value = item.answer || "";
  document.querySelector("#golden-category").value = item.intent || "真实用户问题";
  document.querySelector("#golden-aliases").value = "";
  document.querySelector("#golden-direct").value = "";
  document.querySelector("#golden-must").value = "";
  document.querySelector("#golden-forbidden").value = "";
  document.querySelector("#golden-sources").value = (item.citation_files || []).join("\n");
  document.querySelector("#golden-boundary").checked = true;
  document.querySelector("#golden-status").textContent = "";
  goldenDialog.showModal();
}
feedbackList.addEventListener("click", async (event) => {
  const card = event.target.closest(".feedback-item"); if (!card) return;
  const item = feedbackItems.find((entry) => entry.message_id === card.dataset.messageId); if (!item) return;
  try {
    if (event.target.closest("[data-open-golden]")) return openGolden(item);
    if (event.target.closest("[data-create-task]")) await post("/api/admin/unanswered/promote", { app_id: item.app_id, question: item.question, intent: item.intent, quality: item.quality });
    else if (event.target.closest("[data-resolve]")) await post("/api/admin/feedback/status", { message_id: item.message_id, status: "resolved" });
    else if (event.target.closest("[data-delete]")) { if (!window.confirm("确认永久删除这条问答与反馈记录？")) return; await post("/api/admin/feedback/delete", { message_id: item.message_id }); }
    else return;
    await loadFeedback();
  } catch (error) { feedbackStatus.textContent = error.message; }
});
document.querySelector("#cluster-list").addEventListener("click", async (event) => {
  const card = event.target.closest(".cluster-item"); if (!card || !event.target.closest("[data-cluster-task]")) return;
  const cluster = questionClusters.find((item) => item.cluster_id === card.dataset.clusterId); if (!cluster) return;
  try {
    await post("/api/admin/unanswered/promote", { app_id: "yingge-h5", question: `[聚类] ${cluster.title}：${cluster.representative}`, intent: cluster.intent, quality: cluster.low_confidence ? "insufficient" : "review" });
    feedbackStatus.textContent = `已为“${cluster.title}”生成知识补充任务。`;
  } catch (error) { feedbackStatus.textContent = error.message; }
});
document.querySelector("#golden-cancel").addEventListener("click", () => goldenDialog.close());
document.querySelector("#golden-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const status = document.querySelector("#golden-status"); status.textContent = "正在写入黄金回答与回归集…";
  try {
    const data = await post("/api/admin/feedback/promote-golden", { message_id: document.querySelector("#golden-message-id").value, question: document.querySelector("#golden-question").value, approved_answer: document.querySelector("#golden-answer").value, category: document.querySelector("#golden-category").value, aliases: document.querySelector("#golden-aliases").value, direct_terms: document.querySelector("#golden-direct").value, must_terms: document.querySelector("#golden-must").value, forbidden_terms: document.querySelector("#golden-forbidden").value, source_files: document.querySelector("#golden-sources").value, require_boundary: document.querySelector("#golden-boundary").checked });
    status.textContent = `已加入 ${data.item.id} / ${data.evaluation.id}，知识版本 ${data.version}`;
    window.setTimeout(() => { goldenDialog.close(); loadFeedback(); health().catch(() => {}); }, 900);
  } catch (error) { status.textContent = error.message; }
});
document.querySelector("#feedback-refresh").addEventListener("click", loadFeedback);
document.querySelector("#cluster-run").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  try { renderClusters(await post("/api/admin/feedback/clusters/run", {})); }
  catch (error) { document.querySelector("#cluster-summary").textContent = error.message; }
  finally { button.disabled = false; }
});
feedbackFilter.addEventListener("change", loadFeedback);
loadFeedback(); loadClusters();
