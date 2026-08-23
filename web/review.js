const $ = (s) => document.querySelector(s);
const saved = JSON.parse(localStorage.getItem("yingge-admin-config") || "{}");
const apiBase = (saved.apiBase || "http://127.0.0.1:8787").replace(/\/$/, "");
function adminHeaders() { const token = sessionStorage.getItem("yingge-admin-token") || ""; return token ? { "x-admin-token": token } : {}; }
function pill(ok, text) { const el = $("#health-pill"); el.className = `status-pill ${ok ? "ready" : "fail"}`; el.querySelector("span").textContent = text; }
function toast(text) { const el = document.createElement("div"); el.className = "toast"; el.textContent = text; document.body.appendChild(el); setTimeout(() => el.remove(), 2600); }
function render(items) {
  const list = $("#candidate-list");
  list.textContent = "";
  if (!items.length) { list.innerHTML = '<div class="empty">当前筛选下没有候选内容。运行 daily_refresh.mjs 后再来看看。</div>'; return; }
  const template = $("#candidate-template");
  items.forEach((item, index) => {
    const card = template.content.cloneNode(true);
    const root = card.querySelector(".candidate-card");
    root.style.animationDelay = `${Math.min(index, 8) * 45}ms`;
    card.querySelector(".grade").textContent = `来源 ${item.evidence_level || "待定"}`;
    card.querySelector(".date").textContent = item.published_at ? new Date(item.published_at).toLocaleDateString("zh-CN") : "日期待核";
    card.querySelector(".source").textContent = item.source?.publisher || "未标注来源";
    card.querySelector(".candidate-title").textContent = item.title || "未命名候选";
    card.querySelector(".candidate-summary").textContent = item.summary || "暂无摘要，请打开原文核验。";
    const link = card.querySelector(".candidate-link"); link.href = item.url || "#";
    card.querySelector(".candidate-id").textContent = item.candidate_id || "";
    card.querySelector(".approve").addEventListener("click", () => review(item, "approved"));
    card.querySelector(".reject").addEventListener("click", () => review(item, "rejected"));
    list.appendChild(card);
  });
}
async function load() {
  const status = $("#status-filter").value;
  try {
    const response = await fetch(`${apiBase}/api/admin/candidates?status=${encodeURIComponent(status)}`, { headers: adminHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "候选接口不可用");
    pill(true, `${data.items.length} 条候选`); render(data.items);
  } catch (error) { pill(false, "候选接口不可达"); $("#candidate-list").innerHTML = `<div class="empty">${error.message}<br>请先启动 backend/server.mjs。</div>`; }
}
async function review(item, status) {
  const label = status === "approved" ? "通过" : "驳回";
  if (!window.confirm(`确定${label}：${item.title || "这条候选"}？`)) return;
  try {
    const response = await fetch(`${apiBase}/api/admin/candidates/review`, { method: "POST", headers: { "content-type": "application/json", ...adminHeaders() }, body: JSON.stringify({ candidate_id: item.candidate_id, status }) });
    const data = await response.json(); if (!response.ok) throw new Error(data.message || "保存失败");
    toast(`已${label}，审核记录已保存`); load();
  } catch (error) { toast(error.message); }
}
$("#refresh-btn").addEventListener("click", load);
$("#status-filter").addEventListener("change", load);
load();
