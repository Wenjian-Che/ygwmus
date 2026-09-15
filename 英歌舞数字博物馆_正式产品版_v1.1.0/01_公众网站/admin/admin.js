(() => {
  const local = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
  const API = window.AdminShell?.apiBase || (local ? `${location.protocol}//${location.hostname}:8787` : location.origin);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  // Primary navigation and shared status now belong to admin-shell.js.
  const overview = document.querySelector('[data-panel="overview"]');
  if (overview && !overview.querySelector('.admin-orientation')) {
    const lead = overview.querySelector('.overview-lead');
    lead?.insertAdjacentHTML('afterend', '<section class="admin-orientation" aria-label="管理台导览"><div class="orientation-intro"><p class="eyebrow">怎么使用这套后台</p><h3>先看信号，再做动作</h3><p>这里不是公众展馆，而是团队用来判断问题、管理内容、制定项目和校验答案的工作台。</p></div><div class="orientation-steps"><div><span>01</span><strong>观察</strong><small>访客洞察<br>看大家正在问什么</small></div><div><span>02</span><strong>管理</strong><small>内容审核<br>把知识缺口变成任务</small></div><div><span>03</span><strong>策划</strong><small>项目策划<br>把信号整理成方案</small></div><div><span>04</span><strong>校验</strong><small>知识评测<br>确认回答是否可靠</small></div></div></section>');
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
      chart.innerHTML = items.length ? items.map(item => { const count = Number(item.count || item.question_count || 0); const label = esc(item.label || item.name || '未命名主题'); return `<div class="topic-row"><span title="${label}">${label}</span><div class="bar-track"><i style="width:${Math.max(8, Math.round(count / max * 100))}%"></i></div><em>${count}</em></div>`; }).join('') : '<div class="empty-state-line">问题积累后将在这里显示主题分布</div>';
    } catch { chart.innerHTML = '<div class="empty-state-line">暂时无法读取问题主题</div>'; }
  };
  document.head.appendChild(base);
})();
