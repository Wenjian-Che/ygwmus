(() => {
  function resolveApiBase() {
    if (window.AdminShell?.apiBase) return window.AdminShell.apiBase;
    const local = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
    return local ? `${location.protocol}//${location.hostname}:8787` : location.origin;
  }

  const API = resolveApiBase();
  const form = document.querySelector('#contentForm');
  const frame = document.querySelector('#previewFrame');
  const state = document.querySelector('#saveState');
  const workflowState = document.querySelector('#workflowState');
  const actorState = document.querySelector('#actorState');
  const authNotice = document.querySelector('#authNotice');
  const previewState = document.querySelector('#previewState');
  const saveButton = document.querySelector('#saveDraft');
  const publishButton = document.querySelector('#publishContent');
  const previewButton = document.querySelector('#previewContent');
  const reasonField = document.querySelector('#changeReason');
  const diagnosticButton = document.querySelector('#runDiagnostics');
  const diagnosticSummary = document.querySelector('#diagnosticSummary');
  const diagnosticChecks = document.querySelector('#diagnosticChecks');
  const toast = document.querySelector('#toast');
  const fallback = {
    hero: { eyebrow: '国家级非物质文化遗产 英歌', titleLine1: '看见英歌，', titleLine2: '也看懂英歌。', body: '影像、互动与知识档案，共同解释动作、阵法、人物和地方传承。', primaryCta: '进入数字展馆' },
    experiences: { title: '三件核心展项', intro: '先看真实表演，再进互动叙事；遇到不懂的内容，随时问英歌小槌。', cards: { video: { title: '看英歌', description: '从完整表演进入动作、阵形、人物与地方现场。' }, h5: { title: '互动特展', description: '沿着互动叙事认识英歌，并随时返回博物馆继续参观。' }, agent: { title: '问小槌', description: '围绕当前展品回答，并说明资料来源和适用范围。' } } },
  };
  const fields = ['hero.eyebrow', 'hero.titleLine1', 'hero.titleLine2', 'hero.body', 'hero.primaryCta', 'experiences.title', 'experiences.intro', 'experiences.cards.video.title', 'experiences.cards.video.description', 'experiences.cards.agent.title', 'experiences.cards.agent.description'];
  const roleLabels = { owner: '管理员', author: '内容编辑', reviewer: '内容审核', publisher: '内容发布' };
  const checkLabels = {
    browser_page: '管理页与公众预览', browser_api: '浏览器到智能体服务', runtime_service: '知识运行时', frontend_contract: '公众网页接入', app_registration: '应用注册', knowledge_artifacts: '知识产物完整性', knowledge_version: '知识版本一致性', source_registry: '资料来源映射', knowledge_source: '知识源与重建', retrieval_probe: '固定问题检索', model_config: '回答模型配置', public_projection: '公众内容投影',
  };
  let sourceState = { version: 1, workflow_status: 'published', draft: structuredClone(fallback), published: structuredClone(fallback) };
  let actor = null;
  let contentReady = false;
  let dirty = false;
  let toastTimer = 0;

  const field = (name) => form.querySelector(`[name="${name}"]`);
  const value = (name) => field(name)?.value || '';
  const set = (name, data) => { const node = field(name); if (node) node.value = name.split('.').reduce((target, part) => target?.[part], data) || ''; };
  const headers = (json = false) => {
    const token = sessionStorage.getItem('yingge-admin-token');
    return { ...(json ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };
  const readForm = () => ({
    hero: { eyebrow: value('hero.eyebrow'), titleLine1: value('hero.titleLine1'), titleLine2: value('hero.titleLine2'), body: value('hero.body'), primaryCta: value('hero.primaryCta') },
    experiences: { title: value('experiences.title'), intro: value('experiences.intro'), cards: { video: { title: value('experiences.cards.video.title'), description: value('experiences.cards.video.description') }, h5: sourceState.draft?.experiences?.cards?.h5 || fallback.experiences.cards.h5, agent: { title: value('experiences.cards.agent.title'), description: value('experiences.cards.agent.description') } } },
  });

  function fill(data) {
    fields.forEach((name) => set(name, data));
    postPreview(data);
  }

  function postPreview(content) {
    frame.contentWindow?.postMessage({ type: 'yingge:site-content-preview', content }, location.origin);
  }

  frame.addEventListener('load', () => {
    if (contentReady) postPreview(readForm());
  });

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, { ...options, credentials: 'include' });
    let payload = {};
    try { payload = await response.json(); } catch {}
    if (!response.ok) {
      const error = new Error(payload.message || `请求失败（${response.status}）`);
      error.status = response.status;
      error.code = payload.code || 'REQUEST_FAILED';
      throw error;
    }
    return payload;
  }

  function showToast(message, error = false) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.toggle('is-error', error);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 4200);
  }

  function setSaveState(message, kind = '') {
    state.textContent = message;
    state.classList.toggle('is-dirty', kind === 'dirty');
    state.classList.toggle('is-error', kind === 'error');
  }

  function updateAccess() {
    const role = actor?.role || '';
    actorState.textContent = actor ? `${roleLabels[role] || role} · ${actor.display_name || actor.id}` : '未登录';
    const editable = ['author', 'owner'].includes(role) && contentReady;
    fields.forEach((name) => { const node = field(name); if (node) node.disabled = !editable; });
    reasonField.disabled = !actor || !contentReady;
    saveButton.disabled = !editable || !dirty;
    previewButton.disabled = !actor || !contentReady;
    publishButton.disabled = !contentReady || !['publisher', 'owner'].includes(role) || sourceState.workflow_status !== 'draft' || dirty;
    diagnosticButton.disabled = !actor;
    workflowState.textContent = sourceState.workflow_status === 'draft' ? '草稿待发布' : '公众版已同步';
    workflowState.dataset.state = sourceState.workflow_status;
  }

  function handleFailure(error, fallbackMessage) {
    const message = error.code === 'SITE_CONTENT_VERSION_CONFLICT' ? '内容已被其他人更新，请刷新页面后再编辑。' : (error.message || fallbackMessage);
    setSaveState(message, 'error');
    showToast(message, true);
  }

  function switchInspector(name) {
    document.querySelectorAll('[data-inspector]').forEach((button) => {
      const active = button.dataset.inspector === name;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    document.querySelector('#previewPanel').hidden = name !== 'preview';
    document.querySelector('#diagnosticsPanel').hidden = name !== 'diagnostics';
  }

  async function load() {
    try {
      const session = await request('/api/admin/session', { headers: headers() });
      actor = session.actor;
      updateAccess();
    } catch (error) {
      actor = null;
      contentReady = false;
      authNotice.hidden = false;
      authNotice.querySelector('strong').textContent = '管理服务未连接';
      authNotice.querySelector('span').textContent = error.message || '请检查后台服务与管理凭据。';
      fill(fallback);
      updateAccess();
      handleFailure(error, '无法验证管理身份');
      return;
    }
    try {
      const content = await request('/api/admin/site-content', { headers: headers() });
      sourceState = content;
      contentReady = true;
      fill(content.draft || content.published || fallback);
      dirty = false;
      authNotice.hidden = true;
      setSaveState(content.workflow_status === 'draft' ? '草稿已保存，等待发布者复核' : '已读取当前公众版本');
      updateAccess();
    } catch (error) {
      contentReady = false;
      authNotice.hidden = false;
      authNotice.querySelector('strong').textContent = '内容读取失败';
      authNotice.querySelector('span').textContent = error.message || '请稍后重试；当前不会允许保存或发布。';
      fill(fallback);
      updateAccess();
      handleFailure(error, '无法读取内容');
    }
  }

  form.addEventListener('input', () => {
    dirty = true;
    setSaveState('有未保存修改 · 预览尚未校验', 'dirty');
    previewState.textContent = '当前是本地即时预览，尚未通过服务端字段校验';
    previewState.className = 'preview-state';
    postPreview(readForm());
    updateAccess();
  });

  frame.addEventListener('load', () => {
    postPreview(readForm());
    previewState.textContent = '公众页面已载入，可即时查看文字变化';
  });

  previewButton.addEventListener('click', async () => {
    previewButton.disabled = true;
    previewState.textContent = '正在校验字段并生成预览';
    try {
      const result = await request('/api/admin/site-content/preview', { method: 'POST', headers: headers(true), body: JSON.stringify({ expected_version: sourceState.version, content: readForm() }) });
      postPreview(result.content);
      previewState.textContent = '字段校验通过；这里只预览，不会修改公众页面';
      previewState.className = 'preview-state is-valid';
      switchInspector('preview');
    } catch (error) {
      previewState.textContent = error.message || '预览校验失败';
      previewState.className = 'preview-state is-invalid';
      handleFailure(error, '预览校验失败');
    } finally { updateAccess(); }
  });

  saveButton.addEventListener('click', async () => {
    saveButton.disabled = true;
    setSaveState('正在保存草稿');
    try {
      sourceState = await request('/api/admin/site-content/draft', { method: 'PUT', headers: headers(true), body: JSON.stringify({ expected_version: sourceState.version, content: readForm(), reason: reasonField.value.trim() }) });
      dirty = false;
      fill(sourceState.draft);
      setSaveState('草稿已保存，公众页面尚未改变');
      showToast('草稿已安全保存，等待发布者复核。');
    } catch (error) { handleFailure(error, '草稿保存失败'); }
    updateAccess();
  });

  publishButton.addEventListener('click', async () => {
    if (dirty) return showToast('请先保存当前修改，再由发布者确认发布。', true);
    if (!window.confirm('确认把当前草稿更新到公众首页吗？这一步会留下发布审计记录。')) return;
    publishButton.disabled = true;
    setSaveState('正在发布');
    try {
      sourceState = await request('/api/admin/site-content/publish', { method: 'POST', headers: headers(true), body: JSON.stringify({ expected_version: sourceState.version, reason: reasonField.value.trim() }) });
      setSaveState('公众首页已更新');
      workflowState.textContent = '公众版已同步';
      frame.src = `../index.html?admin-preview=${Date.now()}`;
      showToast('发布完成，公众首页已经使用新版本。');
    } catch (error) { handleFailure(error, '发布失败'); }
    updateAccess();
  });

  function browserChecks() {
    const documentReady = (() => {
      try { return Boolean(frame.contentDocument?.querySelector('[data-guide-open]') && frame.contentDocument?.querySelector('#agentForm')); }
      catch { return false; }
    })();
    return [{ id: 'browser_page', layer: 'browser', status: documentReady ? 'pass' : 'fail', blocking: true, summary: documentReady ? '公众预览中已找到英歌小槌入口与问答表单' : '公众预览没有完整加载英歌小槌入口', metrics: {}, remediation: documentReady ? '' : '刷新公众预览并检查 app.js 是否正常执行' }];
  }

  async function browserApiCheck() {
    try {
      const response = await fetch(`${API}/api/health`, { credentials: 'include', headers: { 'x-app-id': 'yingge-h5' } });
      const payload = await response.json();
      const ready = response.ok && payload.ok === true && (Number(payload.chunks || 0) > 0 || payload.knowledge_available === true);
      return { id: 'browser_api', layer: 'browser', status: ready ? 'pass' : 'fail', blocking: true, summary: ready ? '当前浏览器可以到达智能体服务和知识运行时' : '浏览器虽收到响应，但知识运行时未就绪', metrics: { reachable: response.ok }, remediation: ready ? '' : '检查 API 地址、CORS 与知识索引加载状态' };
    } catch {
      return { id: 'browser_api', layer: 'browser', status: 'fail', blocking: true, summary: '当前浏览器无法连接智能体服务', metrics: { reachable: false }, remediation: '本地开发请启动 8787 服务；生产环境应使用同源 /api' };
    }
  }

  function renderDiagnostics(report, checks) {
    diagnosticChecks.replaceChildren();
    const statusText = { healthy: '连接完整', degraded: '当前可用，但有维护缺口', blocked: '存在阻断项' };
    diagnosticSummary.dataset.status = report.status;
    diagnosticSummary.querySelector('strong').textContent = statusText[report.status] || '检查完成';
    const serving = report.overall?.serving_now ? '现在可以回答' : '现在无法可靠回答';
    const rebuild = report.overall?.knowledge_rebuild_ready ? '知识库也可持续重建' : '知识库暂时不能持续重建';
    diagnosticSummary.querySelector('span').textContent = `${serving}；${rebuild}。通过 ${checks.filter((check) => check.status === 'pass').length}/${checks.length} 项，真实模型连通性未发起计费验证。`;
    checks.forEach((check) => {
      const details = document.createElement('details');
      details.className = 'diagnostic-check';
      details.dataset.status = check.status;
      const summary = document.createElement('summary');
      const indicator = document.createElement('span');
      indicator.className = 'check-indicator';
      const copy = document.createElement('span');
      const title = document.createElement('strong');
      title.textContent = checkLabels[check.id] || check.id;
      const description = document.createElement('small');
      description.textContent = check.summary;
      copy.append(title, description);
      const status = document.createElement('span');
      status.className = 'check-status';
      status.textContent = check.status === 'pass' ? '通过' : (check.status === 'warning' ? '需留意' : '未通过');
      summary.append(indicator, copy, status);
      const detail = document.createElement('p');
      detail.className = 'check-detail';
      const metrics = Object.keys(check.metrics || {}).length ? `检查数据：${Object.entries(check.metrics).map(([key, value]) => `${key}=${value}`).join('，')}\n` : '';
      detail.textContent = `${metrics}${check.remediation ? `建议：${check.remediation}` : '无需处理。'}`;
      details.append(summary, detail);
      diagnosticChecks.append(details);
    });
  }

  diagnosticButton.addEventListener('click', async () => {
    switchInspector('diagnostics');
    diagnosticButton.disabled = true;
    diagnosticButton.textContent = '正在检查网页、知识库与检索';
    diagnosticSummary.dataset.status = 'idle';
    diagnosticSummary.querySelector('strong').textContent = '诊断进行中';
    diagnosticSummary.querySelector('span').textContent = '所有检查均在本机服务内完成，不会调用计费模型。';
    diagnosticChecks.replaceChildren();
    try {
      const [report, apiCheck] = await Promise.all([
        request('/api/admin/diagnostics/run', { method: 'POST', headers: headers(true), body: JSON.stringify({ mode: 'safe' }) }),
        browserApiCheck(),
      ]);
      const checks = [...browserChecks(), apiCheck, ...report.checks];
      const blocking = checks.some((check) => check.status === 'fail' && check.blocking);
      const warning = checks.some((check) => check.status === 'warning' || check.status === 'fail');
      renderDiagnostics({ ...report, status: blocking ? 'blocked' : (warning ? 'degraded' : 'healthy') }, checks);
    } catch (error) {
      diagnosticSummary.dataset.status = 'blocked';
      diagnosticSummary.querySelector('strong').textContent = '诊断服务未完成';
      diagnosticSummary.querySelector('span').textContent = error.message || '请检查管理服务与凭据后重试。';
      showToast(error.message || '诊断失败', true);
    } finally {
      diagnosticButton.textContent = '重新检查整条连接';
      updateAccess();
    }
  });

  document.querySelectorAll('[data-inspector]').forEach((button) => button.addEventListener('click', () => switchInspector(button.dataset.inspector)));
  document.querySelectorAll('[data-viewport]').forEach((button) => button.addEventListener('click', () => {
    const viewport = button.dataset.viewport;
    document.querySelector('.preview-frame').dataset.viewportState = viewport;
    document.querySelectorAll('[data-viewport]').forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
  }));

  load();
})();
