const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const on = (selector, event, handler) => { const node = $(selector); if (node) node.addEventListener(event, handler); return node; };
const adminNav = document.querySelector(".sidebar-nav");
if (adminNav && !adminNav.querySelector('[href="./admin-evaluation.html"]')) {
  const evaluationLink = document.createElement("a");
  evaluationLink.href = "./admin-evaluation.html";
  evaluationLink.innerHTML = '<span class="nav-icon">✓</span>质量评测';
  adminNav.appendChild(evaluationLink);
}
if (adminNav && !adminNav.querySelector('[href="./admin-feedback.html"]')) {
  const feedbackLink = document.createElement("a");
  feedbackLink.href = "./admin-feedback.html";
  feedbackLink.innerHTML = '<span class="nav-icon">↺</span>反馈闭环';
  adminNav.appendChild(feedbackLink);
}
const saved = JSON.parse(localStorage.getItem("yingge-admin-config") || "{}");
if ($("#api-base")) $("#api-base").value = saved.apiBase || "http://127.0.0.1:8787";
if ($("#admin-token")) $("#admin-token").value = sessionStorage.getItem("yingge-admin-token") || "";
if ($("#app-id")) $("#app-id").value = saved.appId || "yingge-h5";
if ($("#model")) $("#model").value = saved.model || "deepseek-v4-flash";
if ($("#thinking")) $("#thinking").checked = saved.thinking !== false;
if ($("#remote-enabled")) $("#remote-enabled").checked = saved.enabled === true;

function base() { return ($("#api-base")?.value || saved.apiBase || "http://127.0.0.1:8787").replace(/\/$/, ""); }
function adminHeaders() { const token = $("#admin-token")?.value.trim() || sessionStorage.getItem("yingge-admin-token") || ""; if (token) sessionStorage.setItem("yingge-admin-token", token); return token ? { "x-admin-token": token } : {}; }
function setPill(ok, text) { const pill = $("#health-pill"); if (!pill) return; pill.className = `status-pill ${ok ? "ready" : "fail"}`; pill.querySelector("span").textContent = text; }
async function health() {
  try {
    const response = await fetch(`${base()}/api/health`, { headers: adminHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "接口不可用");
    setPill(true, data.api_key_configured ? "接口已连接 · Key 已配置" : "接口已连接 · 等待 Key");
    if ($("#sidebar-status-text")) $("#sidebar-status-text").textContent = "服务在线 · " + data.model;
    if ($("#quick-chunks")) $("#quick-chunks").textContent = data.chunks ?? "—";
    if ($("#quick-dynamic")) $("#quick-dynamic").textContent = String(data.dynamic_items ?? 0).padStart(2, "0");
    if ($("#quick-apps")) $("#quick-apps").textContent = String(data.apps ?? 0).padStart(2, "0");
    if ($("#quick-model")) $("#quick-model").textContent = data.api_key_configured ? "在线" : "待配置";
    if ($("#quick-model-name")) $("#quick-model-name").textContent = data.model || "模型状态未知";
    if ($("#version-text")) $("#version-text").textContent = `知识库 ${data.knowledge_version} · ${data.chunks} 个切片 · ${data.dynamic_items || 0} 条动态 · ${data.model}`;
    return data;
  } catch (error) {
    setPill(false, "接口未启动或不可达");
    if ($("#sidebar-status-text")) $("#sidebar-status-text").textContent = "服务离线 · 请检查后端";
    if ($("#version-text")) $("#version-text").textContent = "请先启动 backend/server.mjs";
    throw error;
  }
}
async function loadApps() {
  const list = $("#app-list"); if (!list) return;
  try { const response = await fetch(`${base()}/api/admin/apps`, { headers: adminHeaders() }); const data = await response.json(); if (!response.ok) throw new Error(data.message || "应用接口不可用"); list.innerHTML = (data.items || []).map((app) => `<div class="app-row"><span><b>${escapeHtml(app.app_id)}</b><small>${escapeHtml(app.name || "")}</small></span><small>${app.enabled === false ? "已停用" : "运行中"}</small></div>`).join("") || "暂无应用"; } catch (error) { list.textContent = error.message; }
}
async function loadMetrics() {
  const grid = $("#metric-grid"); if (!grid) return;
  try { const response = await fetch(`${base()}/api/admin/metrics`, { headers: adminHeaders() }); const data = await response.json(); if (!response.ok) throw new Error(data.message || "统计接口不可用"); const summary = data.summary || {}; grid.innerHTML = `<div class="metric"><b>${summary.requests || 0}</b><small>总请求</small></div><div class="metric"><b>${summary.successes || 0}</b><small>成功请求</small></div><div class="metric"><b>${summary.avg_latency_ms || 0} ms</b><small>平均响应</small></div>`; } catch (error) { grid.textContent = error.message; }
}
async function loadUnanswered() {
  const list = $("#unanswered-list"); if (!list) return;
  try { const response = await fetch(base() + "/api/admin/unanswered", { headers: adminHeaders() }); const data = await response.json(); if (!response.ok) throw new Error(data.message || "待补充接口不可用"); list.innerHTML = (data.items || []).map((item) => `<div class="app-row"><span><b>${escapeHtml(item.question)}</b><small>${escapeHtml(item.intent)} · ${escapeHtml(item.quality)} · ${item.count} 次 · ${escapeHtml(item.last_seen || "")}</small></span><button class="button ghost" data-promote-question="${escapeHtml(item.question)}" data-promote-app="${escapeHtml(item.app_id)}" data-promote-intent="${escapeHtml(item.intent)}" data-promote-quality="${escapeHtml(item.quality)}">生成补充任务</button></div>`).join("") || "暂无待补充问题"; } catch (error) { list.textContent = error.message; }
}
async function loadTasks() {
  const list = $("#task-list"); if (!list) return;
  try { const response = await fetch(base() + "/api/admin/knowledge-tasks", { headers: adminHeaders() }); const data = await response.json(); if (!response.ok) throw new Error(data.message || "任务接口不可用"); list.innerHTML = (data.items || []).map((item) => `<div class="app-row"><span><b>${escapeHtml(item.question)}</b><small>${escapeHtml(item.intent)} · ${escapeHtml(item.status)} · ${escapeHtml(item.created_at || "")}</small></span><span><code>${escapeHtml(item.task_id)}</code> <button class="button ghost" data-close-task="${escapeHtml(item.task_id)}">关闭</button></span></div>`).join("") || "暂无补充任务"; } catch (error) { list.textContent = error.message; }
}
async function loadRevisions() {
  const list = $("#revision-list"); if (!list) return;
  try { const response = await fetch(base() + "/api/admin/revisions", { headers: adminHeaders() }); const data = await response.json(); if (!response.ok) throw new Error(data.message || "版本接口不可用"); list.innerHTML = (data.items || []).map((item) => `<div class="app-row"><span><b>${escapeHtml(item.revision_id)}</b><small>${escapeHtml(item.status)} · ${item.chunk_count} 个切片 · ${escapeHtml(item.created_at || "")}</small></span><button class="button ghost" data-restore-revision="${escapeHtml(item.revision_id)}">恢复此版</button></div>`).join("") || "暂无变更记录"; } catch (error) { list.textContent = error.message; }
}
function escapeHtml(text) { return String(text ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m])); }
on("#health-btn", "click", async () => { try { await health(); } catch (error) { if ($("#test-output")) $("#test-output").textContent = error.message; } });
on("#save-btn", "click", () => { const config = { apiBase: base(), appId: $("#app-id")?.value.trim() || "yingge-h5", model: $("#model")?.value || "deepseek-v4-flash", thinking: $("#thinking")?.checked !== false, enabled: $("#remote-enabled")?.checked === true }; localStorage.setItem("yingge-admin-config", JSON.stringify(config)); if ($("#test-output")) $("#test-output").textContent = `页面配置已保存。远程模型${config.enabled ? "已启用" : "未启用"}，API Key 没有写入浏览器。`; });
on("#test-btn", "click", async () => { const output = $("#test-output"); if (!output) return; output.textContent = "正在检索英歌知识库并请求 DeepSeek…"; try { const response = await fetch(`${base()}/api/admin/test`, { method: "POST", headers: { "content-type": "application/json", ...adminHeaders() }, body: JSON.stringify({ message: $("#test-question")?.value || "英歌是什么？", app_id: $("#app-id")?.value.trim() || "yingge-h5", api_key: $("#api-key")?.value || undefined, model: $("#model")?.value, thinking: $("#thinking")?.checked }) }); const data = await response.json(); output.textContent = response.ok ? `${data.answer}\n\n路由：${data.intent?.label || "综合问答"}\n回答结构：${data.intent?.format || "通用结构"}\n证据等级：${data.evidence_quality?.label || "待核"}\n来源：${(data.citations || []).map((item) => item.title).join("、") || "无"}` : `${data.code || "ERROR"}：${data.message || "请求失败"}`; if (response.ok) setPill(true, "测试成功 · Key 未保存"); } catch (error) { output.textContent = `请求失败：${error.message}`; setPill(false, "测试失败"); } });
on("#add-app-btn", "click", async () => { const app_id = $("#new-app-id")?.value.trim(); const name = $("#new-app-name")?.value.trim() || app_id; try { const response = await fetch(`${base()}/api/admin/apps`, { method: "POST", headers: { "content-type": "application/json", ...adminHeaders() }, body: JSON.stringify({ app_id, name }) }); const data = await response.json(); if (!response.ok) throw new Error(data.message || "注册失败"); $("#new-app-id").value = ""; $("#new-app-name").value = ""; if ($("#app-id")) $("#app-id").value = app_id; loadApps(); } catch (error) { if ($("#test-output")) $("#test-output").textContent = `应用注册失败：${error.message}`; } });
on("#metrics-btn", "click", loadMetrics); on("#unanswered-btn", "click", loadUnanswered); on("#tasks-btn", "click", loadTasks); on("#revisions-btn", "click", loadRevisions);
on("#unanswered-list", "click", async (event) => { const button = event.target.closest("[data-promote-question]"); if (!button) return; button.disabled = true; try { const response = await fetch(base() + "/api/admin/unanswered/promote", { method: "POST", headers: { "content-type": "application/json", ...adminHeaders() }, body: JSON.stringify({ question: button.dataset.promoteQuestion, app_id: button.dataset.promoteApp, intent: button.dataset.promoteIntent, quality: button.dataset.promoteQuality }) }); if (!response.ok) throw new Error("生成任务失败"); loadUnanswered(); loadTasks(); } catch (error) { button.disabled = false; if ($("#test-output")) $("#test-output").textContent = "任务生成失败：" + error.message; } });
on("#task-list", "click", async (event) => { const button = event.target.closest("[data-close-task]"); if (!button) return; button.disabled = true; try { const response = await fetch(base() + "/api/admin/knowledge-tasks/status", { method: "POST", headers: { "content-type": "application/json", ...adminHeaders() }, body: JSON.stringify({ task_id: button.dataset.closeTask, status: "closed" }) }); if (!response.ok) throw new Error("关闭失败"); loadTasks(); } catch (error) { button.disabled = false; if ($("#test-output")) $("#test-output").textContent = "任务关闭失败：" + error.message; } });
on("#revision-list", "click", async (event) => { const button = event.target.closest("[data-restore-revision]"); if (!button || !window.confirm("确认恢复这个知识版本？当前版本文件会被替换。")) return; button.disabled = true; try { const response = await fetch(base() + "/api/admin/revisions/restore", { method: "POST", headers: { "content-type": "application/json", ...adminHeaders() }, body: JSON.stringify({ revision_id: button.dataset.restoreRevision }) }); const data = await response.json(); if (!response.ok) throw new Error(data.reason || "恢复失败"); if ($("#test-output")) $("#test-output").textContent = "知识版本已恢复，当前切片数：" + data.chunk_count; loadRevisions(); } catch (error) { button.disabled = false; if ($("#test-output")) $("#test-output").textContent = "版本恢复失败：" + error.message; } });

health().catch(() => {}); loadApps(); loadMetrics(); loadUnanswered(); loadTasks(); loadRevisions();
$$('.sidebar-nav a').forEach((link) => link.addEventListener('click', () => { $$('.sidebar-nav a').forEach((item) => item.classList.remove('active')); link.classList.add('active'); }));
