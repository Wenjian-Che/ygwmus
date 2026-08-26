(() => {
  const API = 'http://127.0.0.1:8787';
  // The static server exposes `web/` as its root; normalize legacy links kept in the compact admin markup.
  document.querySelectorAll('a[href="../web/index.html"]').forEach(link => { link.href = '../index.html'; });
  document.querySelectorAll('img[src="../web/assets/museum-logo.png"]').forEach(image => { image.src = '../assets/museum-logo.png'; });
  // Keep the operations console intact, while exposing the assistant as a separate product entry.
  const nav = document.querySelector('.rail-nav');
  if (nav && !nav.querySelector('[href="assistant.html"]')) {
    nav.insertAdjacentHTML('beforeend', '<a class="rail-link assistant-link" href="assistant.html"><span>AI</span>英歌小槌</a>');
  }
  const base = document.createElement('script');
  base.src = 'admin-base.js';
  base.onload = async () => {
    const chart = document.querySelector('#topicChart');
    if (!chart) return;
    try {
      const response = await fetch(`${API}/api/admin/feedback/clusters`, {headers: sessionStorage.getItem('yingge-admin-token') ? {'Authorization': `Bearer ${sessionStorage.getItem('yingge-admin-token')}`} : {}});
      const data = await response.json();
      const items = Array.isArray(data.clusters) ? data.clusters.slice(0, 5) : [];
      const max = Math.max(...items.map(item => Number(item.count || item.question_count || 0)), 1);
      chart.innerHTML = items.length ? items.map(item => { const count = Number(item.count || item.question_count || 0); return `<div class="topic-row"><span title="${String(item.label || item.name || '').replace(/"/g, '&quot;')}">${item.label || item.name || '未命名主题'}</span><div class="bar-track"><i style="width:${Math.max(8, Math.round(count / max * 100))}%"></i></div><em>${count}</em></div>`; }).join('') : '<div class="empty-state-line">问题积累后将在这里显示主题分布</div>';
    } catch { chart.innerHTML = '<div class="empty-state-line">暂时无法读取问题主题</div>'; }
  };
  document.head.appendChild(base);
})();
