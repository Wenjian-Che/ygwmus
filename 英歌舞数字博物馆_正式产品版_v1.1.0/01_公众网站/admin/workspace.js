(() => {
  const API = window.AdminShell?.apiBase || location.origin;
  const VALID_SECTIONS = new Set(["overview", "content", "materials", "assistant", "settings"]);
  const TITLES = Object.freeze({ overview: "运营总览", content: "网站内容", materials: "真实素材", assistant: "智能助手", settings: "连接与设置" });
  const state = { actor: null, auth: null, plans: [], initialized: false, graphInitialized: false, materialsView: "records" };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function compatibilityHeaders() {
    return window.AdminShell?.compatibilityHeaders?.() || {};
  }

  async function request(path, options = {}) {
    const init = { ...options, credentials: "include" };
    init.headers = {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...compatibilityHeaders(),
      ...(options.headers || {}),
    };
    const response = await fetch(`${API}${path}`, init);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.message || `请求失败（${response.status}）`);
      error.status = response.status;
      error.code = payload.code;
      throw error;
    }
    return payload;
  }

  function notice(message, tone = "info") {
    const box = $("#workspaceNotice");
    box.textContent = message;
    box.dataset.tone = tone;
    box.hidden = !message;
  }

  function sectionFromHash() {
    const value = location.hash.replace(/^#/, "");
    return VALID_SECTIONS.has(value) ? value : "overview";
  }

  function setMaterialsView(view = "records") {
    const next = view === "graph" ? "graph" : "records";
    state.materialsView = next;
    for (const button of $$('[data-materials-view]')) {
      const active = button.dataset.materialsView === next;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    }
    for (const pane of $$('[data-materials-pane]')) pane.hidden = pane.dataset.materialsPane !== next;
    if (next === "graph" && !state.graphInitialized) {
      const root = $("[data-knowledge-graph]");
      if (root && window.KnowledgeGraphWorkbench?.init) {
        state.graphInitialized = true;
        Promise.resolve(window.KnowledgeGraphWorkbench.init(root)).catch((error) => {
          state.graphInitialized = false;
          notice(`证据图谱加载失败：${error.message}`, "error");
        });
      }
    }
  }

  function showSection(section = sectionFromHash()) {
    if (!VALID_SECTIONS.has(section)) section = "overview";
    for (const panel of $$("[data-workspace-panel]")) {
      const active = panel.dataset.workspacePanel === section;
      panel.classList.toggle("is-active", active);
      panel.hidden = !active;
    }
    $("#workspaceTitle").textContent = TITLES[section];
    window.AdminShell?.activate(section);
    if (section === "overview" && state.actor) refreshOverview();
    if (section === "assistant" && state.actor) loadPlans();
    if (section === "settings" && state.actor) loadModelSettings();
    if (section === "materials") setMaterialsView(state.materialsView);
  }

  function setActor(actor) {
    state.actor = actor || null;
    const label = actor ? `${actor.display_name || actor.username || actor.id} · 管理员` : "尚未登录";
    $("#workspaceActor").textContent = label;
    $("#settingsActor").textContent = label;
    $("#logoutButton").hidden = !actor;
    window.AdminShell?.refresh();
  }

  function showAuth(mode, message = "") {
    const gate = $("#authGate");
    const modelKey = $("#deepseekApiKey");
    if (modelKey) modelKey.value = "";
    gate.hidden = false;
    $("#setupSection").hidden = mode !== "setup";
    $("#loginSection").hidden = mode !== "login";
    $("#authMessage").textContent = message;
    window.AdminShell?.closeMenu();
    $("[data-admin-shell]").inert = true;
    requestAnimationFrame(() => $(mode === "setup" ? "#setupDisplayName" : "#loginUsername")?.focus());
  }

  function hideAuth() {
    $("#authGate").hidden = true;
    $("[data-admin-shell]").inert = false;
    $("#authMessage").textContent = "";
  }

  async function loadAuth() {
    try {
      const auth = await request("/api/admin/auth/status");
      state.auth = auth;
      if (auth.authenticated && auth.actor) {
        setActor(auth.actor);
        hideAuth();
        if (!state.initialized) {
          state.initialized = true;
          await Promise.allSettled([refreshOverview(), loadPlans(), loadModelSettings()]);
        }
        return true;
      }
      setActor(null);
      showAuth(auth.setup_required ? "setup" : "login");
      return false;
    } catch (error) {
      setActor(null);
      showAuth("login", `管理服务暂时无法连接：${error.message}`);
      return false;
    }
  }

  async function authenticate(path, form, extra = {}) {
    const data = Object.fromEntries(new FormData(form));
    $("#authMessage").textContent = "正在连接…";
    try {
      const result = await request(path, { method: "POST", body: JSON.stringify({ ...data, ...extra }) });
      form.reset();
      setActor(result.actor);
      state.initialized = false;
      hideAuth();
      await loadAuth();
      notice(path.endsWith("setup") ? "管理员账户已创建，工作台已经连接。" : "登录成功。", "success");
    } catch (error) {
      $("#authMessage").textContent = error.message;
    }
  }

  async function logout() {
    try { await request("/api/admin/logout", { method: "POST", body: "{}" }); } catch {}
    const graphRoot = $("[data-knowledge-graph]");
    graphRoot?.__knowledgeGraphController?.destroy?.();
    state.graphInitialized = false;
    setMaterialsView("records");
    state.initialized = false;
    setActor(null);
    showAuth("login", "已安全退出。");
  }

  function workflowLabel(value) {
    return ({ published: "公众版已同步", draft: "有草稿待复核", pending_review: "等待审核", withdrawn: "已撤回" })[value] || "状态待确认";
  }

  async function refreshOverview() {
    const output = await Promise.allSettled([
      request("/api/health"),
      request("/api/admin/site-content"),
      request("/api/admin/curation"),
      request("/api/admin/settings/model"),
    ]);
    const [health, content, curation, model] = output.map((item) => item.status === "fulfilled" ? item.value : null);
    $("#contentWorkflowStatus").textContent = content ? workflowLabel(content.workflow_status) : "读取失败";
    const pending = curation?.media_assets?.filter((item) => item.rights_status !== "authorized" || item.privacy_review_status !== "approved").length;
    $("#materialWorkflowStatus").textContent = curation ? (pending ? `${pending} 项素材待核验` : "素材门禁已通过") : "读取失败";
    $("#knowledgeWorkflowStatus").textContent = health?.knowledge_available ? "知识库已连接" : "知识库未连接";
    $("#modelWorkflowStatus").textContent = model?.api_key_configured ? (model.verified_at ? "连接已验证" : "已配置，待测试") : "尚未配置";
  }

  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "时间未知" : new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(date);
  }

  function renderPlans() {
    const container = $("#planHistory");
    container.replaceChildren();
    if (!state.plans.length) {
      const empty = document.createElement("p");
      empty.className = "workspace-empty";
      empty.textContent = "还没有保存的方案。向小槌提问后，可把结果归档在这里。";
      container.append(empty);
      return;
    }
    for (const plan of state.plans.slice(0, 20)) {
      const article = document.createElement("article");
      const title = document.createElement("strong");
      const meta = document.createElement("span");
      const summary = document.createElement("p");
      title.textContent = plan.title || "未命名方案";
      meta.textContent = `${plan.mode || "项目策划"} · ${formatDate(plan.created_at)}`;
      summary.textContent = String(plan.answer || "").slice(0, 140);
      article.append(title, meta, summary);
      container.append(article);
    }
  }

  async function loadPlans() {
    try {
      const result = await request("/api/admin/plans");
      state.plans = Array.isArray(result.items) ? result.items : [];
      renderPlans();
    } catch (error) {
      $("#planHistory").textContent = error.message;
    }
  }

  function addChatMessage(role, text, meta = "") {
    const stream = $("#workspaceChatStream");
    $(".workspace-chat-intro", stream)?.remove();
    const message = document.createElement("article");
    message.className = `workspace-message is-${role}`;
    const label = document.createElement("strong");
    const body = document.createElement("p");
    label.textContent = role === "user" ? "你" : "英歌小槌";
    body.textContent = text;
    message.append(label, body);
    if (meta) {
      const detail = document.createElement("small");
      detail.textContent = meta;
      message.append(detail);
    }
    stream.append(message);
    stream.scrollTop = stream.scrollHeight;
    return message;
  }

  async function askAssistant(event) {
    event.preventDefault();
    const input = $("#workspaceAssistantInput");
    const prompt = input.value.trim();
    if (!prompt) return;
    const target = $("#assistantTarget").value;
    input.value = "";
    addChatMessage("user", prompt, target);
    const pending = addChatMessage("assistant", "正在结合馆内知识和当前任务整理建议……");
    const button = $("#workspaceAssistantForm button[type='submit']");
    button.disabled = true;
    try {
      const result = await request("/api/admin/test", {
        method: "POST",
        body: JSON.stringify({ app_id: "yingge-h5", message: `你正在协助管理英歌舞数字博物馆的${target}。请给出准确、自然、可执行的建议；不确定的事实要明确说明需要核验。\n\n管理人员的问题：${prompt}`, context: { audience: "museum_operator", detail_level: "deep", source_mode: "brief" } }),
      });
      pending.remove();
      addChatMessage("assistant", result.answer || "没有生成可用回答。", result.model ? `模型：${result.model}` : "");
      await request("/api/admin/plans", { method: "POST", body: JSON.stringify({ title: prompt.slice(0, 36), mode: target, request: prompt, answer: result.answer || "", citations: result.citations || [] }) });
      await loadPlans();
    } catch (error) {
      pending.remove();
      addChatMessage("assistant", `暂时无法完成：${error.message}`);
    } finally {
      button.disabled = false;
      input.focus();
    }
  }

  async function loadModelSettings() {
    try {
      const result = await request("/api/admin/settings/model");
      $("#deepseekModel").value = result.model || "deepseek-v4-flash";
      $("#deepseekThinking").checked = result.thinking !== false;
      $("#modelConnectionState").textContent = result.api_key_configured ? (result.verified_at ? "已验证" : "已配置") : "未配置";
      $("#modelSettingsResult").textContent = result.api_key_configured ? "密钥已安全保存在本机服务端，页面不会回显。" : "输入 DeepSeek API Key 后保存。";
    } catch (error) {
      $("#modelConnectionState").textContent = "读取失败";
      $("#modelSettingsResult").textContent = error.message;
    }
  }

  async function saveModelSettings(event) {
    event.preventDefault();
    const keyInput = $("#deepseekApiKey");
    const payload = { api_key: keyInput.value.trim(), model: $("#deepseekModel").value, thinking: $("#deepseekThinking").checked };
    if (!payload.api_key) {
      $("#modelSettingsResult").textContent = "请输入新的 DeepSeek API Key。现有密钥不会从服务端回显。";
      return;
    }
    const submit = $("#modelSettingsForm button[type='submit']");
    submit.disabled = true;
    try {
      const result = await request("/api/admin/settings/model", { method: "PUT", body: JSON.stringify(payload) });
      keyInput.value = "";
      $("#modelConnectionState").textContent = "已配置，待测试";
      $("#modelSettingsResult").textContent = `已保存 ${result.model}。点击“测试连接”确认账号余额与网络状态。`;
      await refreshOverview();
    } catch (error) {
      keyInput.value = "";
      $("#modelSettingsResult").textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  }

  async function testModelConnection() {
    const button = $("#testModelConnection");
    button.disabled = true;
    $("#modelSettingsResult").textContent = "正在进行一次最小连接测试，可能产生少量模型用量……";
    try {
      const result = await request("/api/admin/settings/model/test", { method: "POST", body: "{}" });
      $("#modelConnectionState").textContent = "连接已验证";
      $("#modelSettingsResult").textContent = `连接成功：${result.model || "DeepSeek"}。`;
      await refreshOverview();
    } catch (error) {
      $("#modelConnectionState").textContent = "连接失败";
      $("#modelSettingsResult").textContent = error.message;
    } finally {
      button.disabled = false;
    }
  }

  async function runDiagnostics() {
    const button = $("#runWorkspaceDiagnostics");
    const output = $("#workspaceDiagnosticResult");
    button.disabled = true;
    output.textContent = "正在运行只读诊断……";
    try {
      const result = await request("/api/admin/diagnostics/run", { method: "POST", body: JSON.stringify({ mode: "safe" }) });
      const checks = Array.isArray(result.checks) ? result.checks : [];
      const failed = checks.filter((item) => item.status && item.status !== "pass" && item.status !== "ready");
      output.textContent = failed.length ? `${failed.length} 项需要处理：${failed.map((item) => item.label || item.name).filter(Boolean).join("、")}` : "诊断完成：网页、知识库与公众投影未发现阻断项。";
    } catch (error) {
      output.textContent = `诊断未完成：${error.message}`;
    } finally {
      button.disabled = false;
    }
  }

  $("#setupForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const password = $("#setupPassword").value;
    if (password !== $("#setupPasswordConfirm").value) {
      $("#authMessage").textContent = "两次输入的密码不一致。";
      return;
    }
    authenticate("/api/admin/auth/setup", event.currentTarget);
  });
  $("#loginForm").addEventListener("submit", (event) => { event.preventDefault(); authenticate("/api/admin/login", event.currentTarget); });
  $("#logoutButton").addEventListener("click", logout);
  $("#settingsLogout").addEventListener("click", logout);
  $("#refreshWorkspace").addEventListener("click", refreshOverview);
  $("#refreshPlanHistory").addEventListener("click", loadPlans);
  $("#workspaceAssistantForm").addEventListener("submit", askAssistant);
  $("#modelSettingsForm").addEventListener("submit", saveModelSettings);
  $("#testModelConnection").addEventListener("click", testModelConnection);
  $("#runWorkspaceDiagnostics").addEventListener("click", runDiagnostics);
  for (const button of $$('[data-materials-view]')) {
    button.addEventListener("click", () => setMaterialsView(button.dataset.materialsView));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const tabs = $$('[data-materials-view]');
      const next = tabs[(tabs.indexOf(button) + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      next.focus();
      setMaterialsView(next.dataset.materialsView);
    });
  }
  for (const button of $$("[data-open-workspace]")) button.addEventListener("click", () => { location.hash = button.dataset.openWorkspace; });
  for (const button of $$("[data-assistant-context]")) button.addEventListener("click", () => {
    $("#assistantTarget").value = button.dataset.assistantContext === "真实素材审核" ? "真实素材审核" : "网站内容";
    $("#workspaceAssistantInput").value = `请协助我处理“${button.dataset.assistantContext}”，先指出需要核验的事实和最安全的修改步骤。`;
    location.hash = "assistant";
  });
  window.addEventListener("hashchange", () => showSection());
  showSection();
  loadAuth();
})();
