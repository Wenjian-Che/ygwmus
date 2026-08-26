(() => {
  const refinement = document.createElement('link'); refinement.rel = 'stylesheet'; refinement.href = 'assistant-overrides.css'; document.head.appendChild(refinement);
  const polish = document.createElement('link'); polish.rel = 'stylesheet'; polish.href = 'assistant-polish.css'; document.head.appendChild(polish);
  const dialog = document.createElement('link'); dialog.rel = 'stylesheet'; dialog.href = 'assistant-dialog.css'; document.head.appendChild(dialog);
  const API = 'http://127.0.0.1:8787';
  const historyKey = 'yingge-admin-assistant-history';
  const stream = document.querySelector('#chatStream');
  const form = document.querySelector('#assistantForm');
  const input = document.querySelector('#assistantInput');
  const modeBadge = document.querySelector('#modeBadge');
  let mode = '展览策划';

  const tokenHeaders = () => {
    const token = sessionStorage.getItem('yingge-admin-token');
    return token ? {Authorization: `Bearer ${token}`} : {};
  };
  const saveHistory = () => {
    const messages = [...stream.querySelectorAll('.message')].map(item => ({role: item.classList.contains('user') ? 'user' : 'assistant', text: item.querySelector('.message-body')?.textContent || ''}));
    sessionStorage.setItem(historyKey, JSON.stringify(messages.slice(-20)));
  };
  const addMessage = (role, text, error = false) => {
    const item = document.createElement('div');
    item.className = `message ${role}`;
    const body = document.createElement('div');
    body.className = `message-body${error ? ' error-message' : ''}`;
    body.textContent = text;
    item.appendChild(body);
    stream.appendChild(item);
    stream.scrollTop = stream.scrollHeight;
    saveHistory();
  };
  const archivePlan = async (request, answer, citations) => {
    const payload = {title: `${mode} · ${request.slice(0, 28)}`, mode, request, answer, citations};
    try {
      const response = await fetch(`${API}/api/admin/plans`, {method: 'POST', headers: {'Content-Type': 'application/json', ...tokenHeaders()}, body: JSON.stringify(payload)});
      if (!response.ok) throw new Error('archive failed');
    } catch {
      const queue = JSON.parse(localStorage.getItem('yingge-admin-plan-queue') || '[]');
      localStorage.setItem('yingge-admin-plan-queue', JSON.stringify([payload, ...queue].slice(0, 20)));
    }
  };
  const restoreHistory = () => {
    try {
      const items = JSON.parse(sessionStorage.getItem(historyKey) || '[]');
      items.forEach(item => addMessage(item.role, item.text));
    } catch { /* ignore malformed local history */ }
  };
  const setMode = next => {
    mode = next;
    if (modeBadge) modeBadge.textContent = next;
    const inlineMode = document.querySelector('#composerMode');
    if (inlineMode) inlineMode.textContent = next;
    document.querySelectorAll('.capability').forEach(button => button.classList.toggle('is-active', button.dataset.mode === next));
  };
  document.querySelector('#modeSelect')?.addEventListener('change', event => setMode(event.target.value));
  document.querySelectorAll('.capability').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
  document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => { input.value = button.dataset.prompt; input.focus(); }));
  document.querySelector('#clearInput')?.addEventListener('click', () => { input.value = ''; input.focus(); });
  document.querySelector('#newChat')?.addEventListener('click', () => { sessionStorage.removeItem(historyKey); stream.querySelectorAll('.message').forEach(item => item.remove()); input.value = ''; input.focus(); });
  document.querySelector('#exportChat')?.addEventListener('click', () => {
    const lines = [...stream.querySelectorAll('.message')].map(item => `${item.classList.contains('user') ? '我' : '英歌小槌'}：${item.querySelector('.message-body')?.textContent || ''}`);
    if (!lines.length) return;
    const blob = new Blob([`# 英歌小槌对话\n\n${lines.join('\n\n')}`], {type: 'text/markdown;charset=utf-8'});
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = '英歌小槌-对话.md'; link.click(); URL.revokeObjectURL(link.href);
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addMessage('user', text);
    input.value = '';
    const button = form.querySelector('.send-button'); button.disabled = true;
    const recent = [...stream.querySelectorAll('.message')].slice(-6).map(item => `${item.classList.contains('user') ? '管理人员' : '英歌小槌'}：${item.querySelector('.message-body')?.textContent || ''}`).join('\n');
    const prompt = `你是英歌舞数字博物馆面向B端管理人员的“英歌小槌”项目策划助手。当前场景：${mode}。请根据下面需求给出可执行建议：先给结论，再列出目标、受众、内容结构、执行步骤、资源需求、风险与需要核实的事实。涉及馆内事实时附[证据N]引用；不要把单一地区、队伍或版本泛化为全部英歌舞。以下是最近对话上下文，请承接但不要重复：\n${recent}\n\n本轮需求：${text}`;
    try {
      const response = await fetch(`${API}/api/admin/test`, {method: 'POST', headers: {'Content-Type': 'application/json', ...tokenHeaders()}, body: JSON.stringify({app_id: 'yingge-h5', message: prompt, context: {audience: document.querySelector('#audience').value, detail_level: document.querySelector('#detail').value, source_mode: 'brief'}})});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || '助手暂时无法回答');
      const citations = Array.isArray(data.citations) && data.citations.length
        ? `\n\n来源：\n${data.citations.map((item, index) => `[证据${index + 1}] ${item.title || item.name || item.url || '馆内资料'}`).join('\n')}`
        : '';
      addMessage('assistant', `${data.answer || '已收到需求，但暂时没有生成内容。'}${citations}`);
      archivePlan(text, data.answer || '', data.citations || []);
    } catch (error) {
      addMessage('assistant', `${error.message}\n\n如果是首次使用，请在后台配置 DEEPSEEK_API_KEY，或在管理台保存有效 Token。`, true);
    } finally { button.disabled = false; }
  });
  restoreHistory();
})();
