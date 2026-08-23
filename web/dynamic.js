const list = document.querySelector("#dynamic-list");
const pill = document.querySelector("#status-pill");
const saved = JSON.parse(localStorage.getItem("yingge-admin-config") || "{}");
const apiBase = (saved.apiBase || "http://127.0.0.1:8787").replace(/\/$/, "");
function escapeHtml(text) { return String(text ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m])); }
function render(items, registry = {}) {
  list.textContent = "";
  if (!items.length) { list.innerHTML = '<div class="empty">暂时还没有已审核的最新动态。可以先运行每日抓取，再到候选审核页发布。</div>'; return; }
  items.forEach((item) => {
    const card = document.createElement("article"); card.className = "dynamic-card";
    const date = item.published_at || item.discovered_at;
    const registrySource = registry.sources?.[item.source?.id];
    const title = /^https?:\/\//.test(item.title || "") ? (item.source?.title || registrySource?.title || item.source?.publisher || "英歌舞动态") : (item.title || "英歌动态");
    card.innerHTML = `<div class="dynamic-meta"><span class="fresh">最新动态</span><span>${escapeHtml(date ? new Date(date).toLocaleDateString("zh-CN") : "日期待核")}</span><span>${escapeHtml(item.source?.publisher || "官方来源")}</span></div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(item.summary || "暂无摘要，请查看原文。")}</p><a href="${escapeHtml(item.url || "#")}" target="_blank" rel="noreferrer">查看原文 ↗</a>`;
    list.appendChild(card);
  });
}
Promise.all([fetch(`${apiBase}/api/dynamic`), fetch("./data/source_registry.json")]).then(async ([dynamicResponse, registryResponse]) => { const data = await dynamicResponse.json(); const registry = registryResponse.ok ? await registryResponse.json() : {}; if (!dynamicResponse.ok) throw new Error(data.message || "动态接口不可用"); pill.className = "status-pill ready"; pill.querySelector("span").textContent = `${data.items.length} 条动态`; render(data.items, registry); }).catch((error) => { pill.className = "status-pill fail"; pill.querySelector("span").textContent = "动态接口不可达"; list.innerHTML = `<div class="empty">${escapeHtml(error.message)}<br>请先启动 backend/server.mjs。</div>`; });
