(() => {
  const NAV_ITEMS = Object.freeze([
    { key: "overview", label: "总览", href: "workspace.html#overview" },
    { key: "content", label: "网站内容", href: "workspace.html#content" },
    { key: "materials", label: "真实素材", href: "workspace.html#materials" },
    { key: "assistant", label: "智能助手", href: "workspace.html#assistant" },
    { key: "knowledge", label: "知识反馈", href: "workspace.html#knowledge" },
    { key: "settings", label: "设置", href: "workspace.html#settings" },
  ]);
  const ROLE_LABELS = Object.freeze({ owner: "管理员", author: "内容编辑", reviewer: "内容审核", publisher: "内容发布" });
  const shell = document.querySelector("[data-admin-shell]");
  const sidebar = shell?.querySelector("[data-admin-sidebar]");
  const embedded = new URLSearchParams(location.search).get("embedded") === "1";
  const declaredPage = document.body.dataset.adminPage || "overview";

  function resolveApiBase() {
    const local = location.hostname === "127.0.0.1" || location.hostname === "localhost";
    return local ? `${location.protocol}//${location.hostname}:8787` : location.origin;
  }

  function tokenHeaders() {
    const token = sessionStorage.getItem("yingge-admin-token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  if (embedded) {
    document.body.classList.add("admin-embedded");
    if (sidebar) {
      sidebar.hidden = true;
      sidebar.innerHTML = '<span id="actorState" data-admin-actor hidden>未登录</span>';
    }
    window.AdminShell = Object.freeze({ NAV_ITEMS, apiBase: resolveApiBase(), requestOptions: Object.freeze({ credentials: "include" }), refresh: async () => {}, closeMenu: () => {}, activate: () => {} });
    document.dispatchEvent(new CustomEvent("yingge:admin-shell-ready"));
    return;
  }

  if (declaredPage !== "workspace") {
    const target = { overview: "overview", content: "content", curation: "materials", assistant: "assistant", plans: "assistant" }[declaredPage] || "overview";
    location.replace(`workspace.html#${target}`);
    return;
  }

  if (!shell || !sidebar) return;

  const activeKey = location.hash.replace(/^#/, "") || "overview";
  const links = NAV_ITEMS.map((item) => {
    const current = item.key === activeKey;
    return `<a class="admin-primary-link${current ? " is-current" : ""}" data-admin-nav-key="${item.key}" href="${item.href}"${current ? ' aria-current="page"' : ""}>${item.label}</a>`;
  }).join("");

  sidebar.innerHTML = `
    <div class="admin-shell-head" data-admin-mobile-bar>
      <a class="admin-shell-brand" data-admin-brand href="workspace.html#overview">
        <img src="../assets/museum-mark-v3.svg" alt="">
        <span><strong>英歌舞数字博物馆</strong><small>运营工作台</small></span>
      </a>
      <button class="admin-nav-toggle" data-admin-menu-toggle type="button" aria-controls="adminPrimaryDrawer" aria-expanded="false">菜单</button>
    </div>
    <div class="admin-rail-body" id="adminPrimaryDrawer" data-admin-drawer aria-hidden="false">
      <nav class="admin-primary-nav" data-admin-nav aria-label="工作台主导航">${links}</nav>
      <div class="admin-shell-footer">
        <div class="admin-session" data-admin-identity>
          <span class="admin-status-dot system-dot" data-admin-status-indicator></span>
          <div><span>当前身份</span><strong id="actorState" data-admin-actor>正在验证</strong><small id="systemStatus" data-admin-status>正在检查知识服务</small></div>
        </div>
        <a class="admin-public-link" href="../index.html" target="_blank" rel="noopener">打开公众前台</a>
      </div>
    </div>
    <button class="admin-shell-scrim" data-admin-scrim type="button" aria-label="关闭菜单" tabindex="-1"></button>`;

  const toggle = sidebar.querySelector("[data-admin-menu-toggle]");
  const drawer = sidebar.querySelector("[data-admin-drawer]");
  const scrim = sidebar.querySelector("[data-admin-scrim]");
  const actor = sidebar.querySelector("[data-admin-actor]");
  const status = sidebar.querySelector("[data-admin-status]");
  const indicator = sidebar.querySelector("[data-admin-status-indicator]");
  const mobileQuery = window.matchMedia("(max-width: 780px)");
  const drawerFocusables = () => [...drawer.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");

  function setDrawer(open) {
    const mobileOpen = mobileQuery.matches && Boolean(open);
    const hidden = mobileQuery.matches && !mobileOpen;
    const wasOpen = toggle.getAttribute("aria-expanded") === "true";
    const focusWasInside = drawer.contains(document.activeElement);
    sidebar.classList.toggle("is-open", mobileOpen);
    toggle.setAttribute("aria-expanded", String(mobileOpen));
    drawer.setAttribute("aria-hidden", String(hidden));
    drawer.inert = hidden;
    document.body.classList.toggle("admin-nav-open", mobileOpen);
    if (mobileOpen && !wasOpen) drawerFocusables()[0]?.focus();
    if (hidden && (focusWasInside || wasOpen)) toggle.focus();
  }

  async function refreshStatus() {
    actor.textContent = "正在验证";
    status.textContent = "正在检查知识服务";
    indicator.dataset.state = "checking";
    const api = resolveApiBase();
    const [healthResult, sessionResult] = await Promise.allSettled([
      fetch(`${api}/api/health`, { credentials: "include" }).then(async (response) => ({ ok: response.ok, body: await response.json().catch(() => ({})) })),
      fetch(`${api}/api/admin/session`, { credentials: "include", headers: tokenHeaders() }).then(async (response) => ({ ok: response.ok, status: response.status, body: await response.json().catch(() => ({})) })),
    ]);

    const health = healthResult.status === "fulfilled" ? healthResult.value : null;
    const knowledgeReady = Boolean(health?.ok && health.body?.knowledge_available);
    status.textContent = knowledgeReady ? "知识服务已连接" : "知识服务未连接";
    indicator.dataset.state = knowledgeReady ? "ready" : "offline";

    const session = sessionResult.status === "fulfilled" ? sessionResult.value : null;
    if (session?.ok && session.body?.actor) {
      const sessionActor = session.body.actor;
      actor.textContent = `${ROLE_LABELS[sessionActor.role] || sessionActor.role} · ${sessionActor.display_name || sessionActor.id}`;
      return sessionActor;
    }
    actor.textContent = "未登录";
    return null;
  }

  function activate(section = location.hash.replace(/^#/, "") || "overview") {
    const selected = NAV_ITEMS.some((item) => item.key === section) ? section : "overview";
    for (const link of sidebar.querySelectorAll("[data-admin-nav-key]")) {
      const current = link.dataset.adminNavKey === selected;
      link.classList.toggle("is-current", current);
      if (current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
  }

  toggle.addEventListener("click", () => setDrawer(toggle.getAttribute("aria-expanded") !== "true"));
  scrim.addEventListener("click", () => setDrawer(false));
  drawer.addEventListener("click", (event) => { if (event.target.closest("a")) setDrawer(false); });
  drawer.addEventListener("keydown", (event) => {
    if (!mobileQuery.matches || toggle.getAttribute("aria-expanded") !== "true" || event.key !== "Tab") return;
    const focusables = drawerFocusables();
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables.at(-1);
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") setDrawer(false); });
  mobileQuery.addEventListener?.("change", () => setDrawer(false));
  window.addEventListener("hashchange", () => activate());

  window.AdminShell = Object.freeze({ NAV_ITEMS, apiBase: resolveApiBase(), requestOptions: Object.freeze({ credentials: "include" }), compatibilityHeaders: tokenHeaders, refresh: refreshStatus, closeMenu: () => setDrawer(false), activate });
  setDrawer(false);
  activate();
  refreshStatus().catch(() => {
    actor.textContent = "未登录";
    status.textContent = "知识服务未连接";
    indicator.dataset.state = "offline";
  });
  document.dispatchEvent(new CustomEvent("yingge:admin-shell-ready"));
})();
