(() => {
  const panel = document.querySelector(".formation-controls");
  const toggle = document.querySelector("#formationPanelToggle");
  const body = document.querySelector("#formationPanelBody");
  if (!panel || !toggle || !body) return;

  const mobileQuery = window.matchMedia("(max-width: 760px)");
  let expanded = false;

  function render() {
    const translate = text => window.yinggeLocale?.translate(text) || text;
    if (!mobileQuery.matches) {
      panel.dataset.mobilePanel = "desktop";
      body.setAttribute("aria-hidden", "false");
      body.inert = false;
      return;
    }
    panel.dataset.mobilePanel = expanded ? "expanded" : "collapsed";
    body.setAttribute("aria-hidden", String(!expanded));
    body.inert = !expanded;
    toggle.setAttribute("aria-expanded", String(expanded));
    const label = expanded ? "收起队形面板" : "展开队形面板";
    toggle.setAttribute("aria-label", translate(label));
    toggle.textContent = translate(label);
  }

  toggle.addEventListener("click", () => {
    if (!mobileQuery.matches) return;
    expanded = !expanded;
    render();
  });
  mobileQuery.addEventListener?.("change", render);
  render();
  window.__yinggeLocaleRefresh?.();
})();
