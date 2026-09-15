(function installKnowledgeGraph(global) {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const MODE_IDS = new Set(["relations", "provenance", "governance"]);
  const TYPE_LABELS = {
    all: "全部类型",
    concept: "概念",
    practice: "传承实践",
    role: "角色",
    formation: "阵法与队形",
    rhythm: "节奏",
    region: "地区",
    team: "队伍",
    event: "活动",
    person: "人物",
    source: "资料来源",
    claim: "知识主张",
    conflict: "事实冲突",
    gap: "证据缺口",
    media: "候选媒体",
    rights: "权利状态",
  };
  const REVIEW_LABELS = {
    all: "全部状态",
    verified: "已核验",
    approved: "已审核",
    pending_review: "待审核",
    pending: "待审核",
    needs_evidence: "待补证",
    rejected: "已驳回",
    draft: "草稿",
  };
  const RIGHTS_LABELS = {
    authorized: "已授权",
    pending_authorization: "待授权",
    not_applicable: "不适用",
    restricted: "限制使用",
    unknown: "未确认",
  };
  const PRIVACY_LABELS = {
    none: "无已知风险",
    low: "低风险",
    medium: "中风险",
    high: "高风险",
    unreviewed: "未复核",
  };
  const VIEW_WIDTH = 1200;
  const VIEW_HEIGHT = 720;

  function safeText(value, fallback = "未记录") {
    if (value === null || value === undefined || value === "") return fallback;
    return String(value);
  }

  function safeHttps(value) {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      const parsed = new URL(value.trim());
      if (parsed.protocol !== "https:" || parsed.username || parsed.password) return "";
      return parsed.href;
    } catch {
      return "";
    }
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizePayload(payload) {
    if (!payload || typeof payload !== "object") {
      return { connected: false, sourceStatus: "invalid", graph: null, summary: {}, initialLimit: 24, meta: {} };
    }
    if (Array.isArray(payload.nodes) && Array.isArray(payload.edges)) {
      return {
        connected: true,
        sourceStatus: "ready",
        graph: payload,
        summary: payload.summary || {},
        initialLimit: clamp(Number(payload.first_screen_limit) || 24, 1, 24),
        meta: payload,
      };
    }
    const graph = payload.graph && typeof payload.graph === "object" ? payload.graph : null;
    const initialLimit = clamp(Number(payload.summary?.initial_node_limit) || 24, 1, 24);
    return {
      connected: payload.connected === true && Boolean(graph),
      sourceStatus: safeText(payload.source_status, "not_ready"),
      graph,
      summary: payload.summary || {},
      initialLimit,
      meta: payload,
    };
  }

  function nodeReview(node) {
    return safeText(node.review_status || node.review?.status, "unknown");
  }

  function nodeRights(node) {
    return safeText(node.rights_status || node.rights?.status, "unknown");
  }

  function searchableNodeText(node) {
    return [
      node.label,
      node.summary,
      node.type,
      node.region,
      ...(Array.isArray(node.tags) ? node.tags : []),
      node.source?.title,
      node.source?.publisher,
      node.evidence?.supported_claim,
      node.review?.label,
      node.rights?.label,
    ].filter(Boolean).join(" ").toLocaleLowerCase("zh-CN");
  }

  function governanceNode(node) {
    return ["gap", "conflict", "media", "rights"].includes(node.type)
      || ["gap", "conflict"].includes(node.conflict_status)
      || !["verified", "approved"].includes(nodeReview(node))
      || ["pending_authorization", "restricted", "unknown"].includes(nodeRights(node));
  }

  function provenanceNode(node) {
    return node.type === "source"
      || Boolean(node.source)
      || (Array.isArray(node.source_ids) && node.source_ids.length > 0);
  }

  function neighborhood(graph, originId, depth = 1) {
    const seen = new Set([originId]);
    let frontier = new Set([originId]);
    const edges = Array.isArray(graph?.edges) ? graph.edges : [];
    for (let level = 0; level < clamp(Number(depth) || 1, 1, 2); level += 1) {
      const next = new Set();
      for (const edge of edges) {
        if (frontier.has(edge.source) && !seen.has(edge.target)) next.add(edge.target);
        if (frontier.has(edge.target) && !seen.has(edge.source)) next.add(edge.source);
      }
      next.forEach((id) => seen.add(id));
      frontier = next;
      if (!frontier.size) break;
    }
    return seen;
  }

  function selectVisibleNodes(graph, options = {}) {
    if (!Array.isArray(graph?.nodes)) return [];
    const mode = MODE_IDS.has(options.mode) ? options.mode : "relations";
    const search = safeText(options.search, "").trim().toLocaleLowerCase("zh-CN");
    const type = safeText(options.type, "all");
    const region = safeText(options.region, "all");
    const evidence = safeText(options.evidence, "all");
    const review = safeText(options.review, "all");
    const limit = clamp(Number(options.limit) || 24, 1, 24);
    let candidates = graph.nodes.filter((node) => {
      if (mode === "provenance" && !provenanceNode(node)) return false;
      if (mode === "governance" && !governanceNode(node)) return false;
      if (search && !searchableNodeText(node).includes(search)) return false;
      if (type !== "all" && node.type !== type) return false;
      if (region !== "all" && safeText(node.region, "未标注") !== region) return false;
      if (evidence !== "all" && safeText(node.evidence_grade, "unknown") !== evidence) return false;
      if (review !== "all" && nodeReview(node) !== review) return false;
      return true;
    });

    if (search || type !== "all" || region !== "all" || evidence !== "all" || review !== "all") {
      return candidates.slice(0, 120);
    }

    const visible = candidates.slice(0, limit);
    const visibleIds = new Set(visible.map((node) => node.id));
    const expanded = options.expanded instanceof Set ? options.expanded : new Set(options.expanded || []);
    for (const id of expanded) {
      const node = candidates.find((candidate) => candidate.id === id);
      if (node && !visibleIds.has(id)) {
        visible.push(node);
        visibleIds.add(id);
      }
    }
    return visible.slice(0, 120);
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function svgEl(tag, className) {
    const node = document.createElementNS(SVG_NS, tag);
    if (className) node.setAttribute("class", className);
    return node;
  }

  function addDefinitionList(section, entries) {
    const list = el("dl");
    for (const [term, value] of entries) {
      const row = el("div");
      row.append(el("dt", "", term), el("dd", "", safeText(value)));
      list.append(row);
    }
    section.append(list);
  }

  function detailSection(title) {
    const section = el("section", "graph-detail-section");
    section.append(el("h4", "", title));
    return section;
  }

  function ensureArray(value) {
    return Array.isArray(value) ? value : [];
  }

  class KnowledgeGraphController {
    constructor(root, options = {}) {
      if (!(root instanceof Element)) throw new TypeError("knowledge graph root is required");
      this.root = root;
      this.options = options;
      this.fetch = options.fetch || global.fetch?.bind(global);
      this.graph = null;
      this.summary = {};
      this.meta = {};
      this.mode = "relations";
      this.initialLimit = 24;
      this.expanded = new Set();
      this.selectedId = "";
      this.positions = new Map();
      this.transform = { x: 0, y: 0, scale: 1 };
      this.drag = null;
      this.pan = null;
      this.abort = new AbortController();
      this.loaded = false;
      this.loading = null;
      this.bindElements();
      this.bindEvents();
      this.setMode(this.root.dataset.graphMode || "relations", false);
      this.showState("loading", "正在读取证据关系", "只读取已经进入治理目录的确定性图谱，不会在此重新抽取或生成事实。");
    }

    bindElements() {
      this.modeButtons = [...this.root.querySelectorAll("[data-mode]")];
      this.search = this.root.querySelector("[data-graph-search]");
      this.filters = {
        type: this.root.querySelector('[data-graph-filter="type"], [data-graph-type]'),
        region: this.root.querySelector('[data-graph-filter="region"]'),
        evidence: this.root.querySelector('[data-graph-filter="evidence"]'),
        review: this.root.querySelector('[data-graph-filter="review"]'),
      };
      this.depth = this.root.querySelector("[data-graph-depth]");
      this.reset = this.root.querySelector("[data-graph-reset]");
      this.summaryNode = this.root.querySelector("[data-graph-summary]");
      this.activeFilters = this.root.querySelector("[data-graph-active-filters]");
      this.canvas = this.root.querySelector("[data-graph-canvas], .knowledge-graph-canvas");
      this.svg = this.root.querySelector(".graph-svg");
      this.viewport = this.root.querySelector("[data-graph-viewport], .graph-viewport");
      this.edgeLayer = this.root.querySelector('[data-graph-layer="edges"], .graph-edge-layer');
      this.edgeLabelLayer = this.root.querySelector('[data-graph-layer="edge-labels"], .graph-edge-label-layer');
      this.nodeLayer = this.root.querySelector('[data-graph-layer="nodes"], .graph-node-layer');
      this.stateOverlay = this.root.querySelector("[data-graph-state]");
      this.performance = this.root.querySelector("[data-graph-performance]");
      this.legend = this.root.querySelector("[data-graph-legend]");
      this.scaleReadout = this.root.querySelector("[data-graph-scale]");
      this.backdrop = this.root.querySelector("[data-graph-drawer-backdrop]");
      this.drawer = this.root.querySelector("[data-graph-detail]");
      this.drawerTitle = this.root.querySelector("[data-graph-detail-title]");
      this.drawerMeta = this.root.querySelector("[data-graph-detail-meta]");
      this.drawerBody = this.root.querySelector("[data-graph-detail-body]");
      this.drawerClose = this.root.querySelector("[data-graph-detail-close]");
      this.editorLink = this.root.querySelector("[data-graph-editor-link]");
      if (!this.canvas || !this.svg || !this.viewport || !this.edgeLayer || !this.nodeLayer || !this.stateOverlay) {
        throw new Error("knowledge graph HTML contract is incomplete");
      }
      this.svg.setAttribute("viewBox", `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`);
    }

    listen(target, type, handler, options = {}) {
      target?.addEventListener(type, handler, { ...options, signal: this.abort.signal });
    }

    bindEvents() {
      for (const button of this.modeButtons) {
        this.listen(button, "click", () => this.setMode(button.dataset.mode));
      }
      this.listen(this.search, "input", () => this.render());
      for (const select of Object.values(this.filters)) this.listen(select, "change", () => this.render());
      this.listen(this.depth, "change", () => {
        this.expanded.clear();
        this.render();
      });
      this.listen(this.reset, "click", () => this.resetView(true));
      this.root.querySelectorAll("[data-graph-zoom]").forEach((button) => {
        this.listen(button, "click", () => {
          if (button.dataset.graphZoom === "fit") this.resetView(false);
          else this.zoom(button.dataset.graphZoom === "in" ? 1.18 : 0.84);
        });
      });
      const legendButton = this.legend?.querySelector("button");
      this.listen(legendButton, "click", () => {
        const expanded = legendButton.getAttribute("aria-expanded") !== "false";
        legendButton.setAttribute("aria-expanded", String(!expanded));
        this.legend.classList.toggle("is-collapsed", expanded);
        const marker = legendButton.lastElementChild;
        if (marker) marker.textContent = expanded ? "+" : "−";
      });
      const performanceButton = this.performance?.querySelector("button");
      this.listen(performanceButton, "click", () => { this.performance.hidden = true; });
      this.listen(this.drawerClose, "click", () => this.closeDetail());
      this.listen(this.backdrop, "click", () => this.closeDetail());
      this.listen(document, "keydown", (event) => {
        if (event.key === "Escape" && this.drawer?.getAttribute("aria-hidden") === "false") this.closeDetail();
      });
      this.listen(this.canvas, "wheel", (event) => {
        event.preventDefault();
        this.zoom(event.deltaY < 0 ? 1.1 : 0.9, event);
      }, { passive: false });
      this.listen(this.canvas, "pointerdown", (event) => {
        if (event.target.closest?.("[data-graph-node]")) return;
        this.pan = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, originX: this.transform.x, originY: this.transform.y };
        this.canvas.setPointerCapture?.(event.pointerId);
        this.canvas.dataset.interaction = "panning";
      });
      this.listen(this.canvas, "pointermove", (event) => {
        if (!this.pan || event.pointerId !== this.pan.pointerId) return;
        this.transform.x = this.pan.originX + (event.clientX - this.pan.x);
        this.transform.y = this.pan.originY + (event.clientY - this.pan.y);
        this.applyViewportTransform();
      });
      const endPan = (event) => {
        if (!this.pan || event.pointerId !== this.pan.pointerId) return;
        this.pan = null;
        delete this.canvas.dataset.interaction;
      };
      this.listen(this.canvas, "pointerup", endPan);
      this.listen(this.canvas, "pointercancel", endPan);
      this.listen(global, "pointermove", (event) => this.moveNode(event));
      this.listen(global, "pointerup", (event) => this.endNodeDrag(event));
    }

    async load({ force = false } = {}) {
      if (this.loading && !force) return this.loading;
      if (!this.fetch) {
        this.showState("error", "证据图谱加载失败", "当前浏览器没有可用的网络请求能力。");
        return null;
      }
      this.showState("loading", "正在读取证据关系", "只读取已经进入治理目录的确定性图谱，不会在此重新抽取或生成事实。");
      this.loading = (async () => {
        try {
          const response = await this.fetch("/api/admin/knowledge-graph", { method: "GET", credentials: "include", headers: { Accept: "application/json" } });
          let payload = {};
          try { payload = await response.json(); } catch { payload = {}; }
          if (!response.ok) {
            const error = new Error(safeText(payload.message, response.status === 403 ? "当前账号无权查看证据图谱" : "证据图谱读取失败"));
            error.status = response.status;
            throw error;
          }
          const normalized = normalizePayload(payload);
          this.meta = normalized.meta;
          this.summary = normalized.summary;
          this.initialLimit = normalized.initialLimit;
          this.graph = normalized.graph;
          this.loaded = true;
          if (!normalized.connected) {
            this.clearGraph();
            this.showState("empty", "暂无证据图谱数据", "知识库任务尚未生成可治理的 knowledge_graph.json，当前不会展示测试数据或临时关系。");
            return normalized;
          }
          this.populateFilters();
          this.render();
          return normalized;
        } catch (error) {
          this.graph = null;
          this.loaded = false;
          this.clearGraph();
          if (error?.status === 403) this.showState("forbidden", "无权查看证据图谱", safeText(error.message, "当前账号没有图谱治理权限。"));
          else this.showState("error", "证据图谱加载失败", safeText(error?.message, "证据图谱暂时不可用。"), true);
          return null;
        } finally {
          this.loading = null;
        }
      })();
      return this.loading;
    }

    showState(kind, title, message, retry = false) {
      const overlay = this.stateOverlay;
      overlay.hidden = false;
      overlay.dataset.state = kind;
      overlay.className = `graph-state-overlay is-${kind}`;
      overlay.setAttribute("role", ["error", "forbidden"].includes(kind) ? "alert" : "status");
      const panel = overlay.querySelector(".graph-state-panel") || el("div", "graph-state-panel");
      panel.replaceChildren(el("h3", "", title), el("p", "", message));
      if (kind === "loading") {
        const lines = el("div", "graph-loading-lines");
        lines.setAttribute("aria-hidden", "true");
        lines.append(el("i", "graph-loading-line"), el("i", "graph-loading-line"), el("i", "graph-loading-line"));
        panel.append(lines);
      }
      if (retry) {
        const actions = el("div", "graph-state-actions");
        const button = el("button", "", "重新读取");
        button.type = "button";
        button.addEventListener("click", () => this.load({ force: true }), { once: true });
        actions.append(button);
        panel.append(actions);
      }
      if (!panel.parentNode) overlay.append(panel);
    }

    hideState() {
      this.stateOverlay.hidden = true;
      this.stateOverlay.removeAttribute("role");
    }

    clearGraph() {
      this.edgeLayer.replaceChildren();
      this.edgeLabelLayer?.replaceChildren();
      this.nodeLayer.replaceChildren();
      this.closeDetail();
      this.updateSummary(0, 0);
    }

    setMode(mode, shouldRender = true) {
      this.mode = MODE_IDS.has(mode) ? mode : "relations";
      this.root.dataset.graphMode = this.mode;
      for (const button of this.modeButtons) {
        const active = button.dataset.mode === this.mode;
        button.setAttribute("aria-pressed", String(active));
        button.classList.toggle("is-active", active);
      }
      this.expanded.clear();
      if (shouldRender && this.graph) this.render();
    }

    populateFilters() {
      const graph = this.graph || { nodes: [] };
      const metaTypes = ensureArray(this.meta.node_types);
      const typeLabels = new Map(metaTypes.map((item) => [item.id, item.label]));
      this.populateSelect(this.filters.type, [...new Set(graph.nodes.map((node) => node.type).filter(Boolean))], "全部类型", (value) => typeLabels.get(value) || TYPE_LABELS[value] || value);
      this.populateSelect(this.filters.region, [...new Set(graph.nodes.map((node) => safeText(node.region, "未标注")))], "全部地区");
      this.populateSelect(this.filters.evidence, [...new Set(graph.nodes.map((node) => safeText(node.evidence_grade, "unknown")))], "全部等级", (value) => `等级 ${value}`);
      this.populateSelect(this.filters.review, [...new Set(graph.nodes.map(nodeReview))], "全部状态", (value) => REVIEW_LABELS[value] || value);
    }

    populateSelect(select, values, allLabel, labeler = (value) => value) {
      if (!select) return;
      const current = select.value || "all";
      const options = [new Option(allLabel, "all")];
      values.sort((a, b) => String(a).localeCompare(String(b), "zh-CN")).forEach((value) => options.push(new Option(labeler(value), value)));
      select.replaceChildren(...options);
      select.value = values.includes(current) ? current : "all";
    }

    filterState() {
      return {
        mode: this.mode,
        search: this.search?.value || "",
        type: this.filters.type?.value || "all",
        region: this.filters.region?.value || "all",
        evidence: this.filters.evidence?.value || "all",
        review: this.filters.review?.value || "all",
        limit: this.initialLimit,
        expanded: this.expanded,
      };
    }

    render() {
      if (!this.graph) return;
      const nodes = selectVisibleNodes(this.graph, this.filterState());
      this.renderActiveFilters();
      this.clearGraphLayers();
      if (!nodes.length) {
        const hasAnyNode = this.graph.nodes.length > 0;
        this.showState("empty", hasAnyNode ? "没有可展示的节点" : "暂无证据节点", hasAnyNode ? "请调整搜索词、模式或筛选条件。" : "图谱文件已连接，但目前还没有进入治理目录的关系。");
        this.updateSummary(0, this.graph.nodes.length);
        return;
      }
      this.hideState();
      const nodeIds = new Set(nodes.map((node) => node.id));
      const edges = ensureArray(this.graph.edges).filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));
      this.layout(nodes);
      this.drawEdges(edges, nodes.length);
      this.drawNodes(nodes);
      this.updateSummary(nodes.length, this.graph.nodes.length);
      const degraded = Boolean(this.summary.large_graph) || this.graph.nodes.length > 1000 || this.graph.edges.length > 5000;
      this.canvas.dataset.performance = degraded ? "degraded" : "standard";
      this.canvas.classList.toggle("is-degraded", degraded);
      if (this.performance) this.performance.hidden = !degraded;
      this.applyViewportTransform();
    }

    clearGraphLayers() {
      this.edgeLayer.replaceChildren();
      this.edgeLabelLayer?.replaceChildren();
      this.nodeLayer.replaceChildren();
    }

    renderActiveFilters() {
      if (!this.activeFilters) return;
      this.activeFilters.replaceChildren();
      const entries = [
        ["搜索", this.search?.value, () => { this.search.value = ""; }],
        ["类型", this.filters.type?.value !== "all" ? this.filters.type?.selectedOptions[0]?.textContent : "", () => { this.filters.type.value = "all"; }],
        ["地区", this.filters.region?.value !== "all" ? this.filters.region?.selectedOptions[0]?.textContent : "", () => { this.filters.region.value = "all"; }],
        ["证据", this.filters.evidence?.value !== "all" ? this.filters.evidence?.selectedOptions[0]?.textContent : "", () => { this.filters.evidence.value = "all"; }],
        ["审核", this.filters.review?.value !== "all" ? this.filters.review?.selectedOptions[0]?.textContent : "", () => { this.filters.review.value = "all"; }],
      ];
      entries.filter(([, value]) => value).forEach(([label, value, clear]) => {
        const chip = el("span", "graph-filter-chip");
        chip.append(document.createTextNode(`${label}：${value}`));
        const button = el("button", "", "×");
        button.type = "button";
        button.setAttribute("aria-label", `清除${label}筛选`);
        button.addEventListener("click", () => { clear(); this.render(); }, { once: true });
        chip.append(button);
        this.activeFilters.append(chip);
      });
    }

    layout(nodes) {
      const center = { x: VIEW_WIDTH / 2, y: VIEW_HEIGHT / 2 };
      const typeOrder = [...new Set(nodes.map((node) => node.type))];
      const clusters = new Map(typeOrder.map((type, index) => {
        const angle = (index / Math.max(1, typeOrder.length)) * Math.PI * 2 - Math.PI / 2;
        return [type, { x: center.x + Math.cos(angle) * 265, y: center.y + Math.sin(angle) * 185 }];
      }));
      const groups = new Map();
      nodes.forEach((node) => {
        if (!groups.has(node.type)) groups.set(node.type, []);
        groups.get(node.type).push(node);
      });
      for (const [type, group] of groups) {
        const cluster = clusters.get(type) || center;
        group.forEach((node, index) => {
          if (this.positions.has(node.id)) return;
          const angle = index * 2.399963229728653;
          const radius = 16 + Math.sqrt(index) * 48;
          this.positions.set(node.id, {
            x: clamp(cluster.x + Math.cos(angle) * radius, 70, VIEW_WIDTH - 70),
            y: clamp(cluster.y + Math.sin(angle) * radius, 65, VIEW_HEIGHT - 65),
          });
        });
      }
    }

    degree(nodeId) {
      return ensureArray(this.graph?.edges).reduce((count, edge) => count + Number(edge.source === nodeId || edge.target === nodeId), 0);
    }

    nodeRadius(node) {
      const grade = { A: 4, B: 3, C: 2, D: 1, unknown: 0 }[node.evidence_grade] || 0;
      return clamp(16 + this.degree(node.id) * 1.8 + grade, 17, 29);
    }

    drawEdges(edges, visibleCount) {
      for (const edge of edges) {
        const source = this.positions.get(edge.source);
        const target = this.positions.get(edge.target);
        if (!source || !target) continue;
        const line = svgEl("line", "graph-edge");
        line.dataset.edgeId = safeText(edge.id, "");
        line.dataset.relation = safeText(edge.relation || edge.type, "context");
        line.dataset.status = edge.conflict_status === "conflict" ? "conflicting" : nodeReview(edge) === "verified" ? "verified" : "unverified";
        line.setAttribute("x1", source.x);
        line.setAttribute("y1", source.y);
        line.setAttribute("x2", target.x);
        line.setAttribute("y2", target.y);
        this.edgeLayer.append(line);
        if (this.edgeLabelLayer && visibleCount <= 48 && edge.label) {
          const label = svgEl("text", "graph-edge-label");
          label.setAttribute("x", (source.x + target.x) / 2);
          label.setAttribute("y", (source.y + target.y) / 2 - 5);
          label.setAttribute("text-anchor", "middle");
          label.textContent = safeText(edge.label, "");
          this.edgeLabelLayer.append(label);
        }
      }
    }

    drawNodes(nodes) {
      for (const node of nodes) {
        const position = this.positions.get(node.id);
        if (!position) continue;
        const group = svgEl("g", "graph-node");
        group.dataset.graphNode = "";
        group.dataset.nodeId = node.id;
        group.dataset.nodeType = safeText(node.type, "unknown");
        group.dataset.kind = safeText(node.type, "unknown");
        group.dataset.status = nodeReview(node);
        group.setAttribute("role", "button");
        group.setAttribute("tabindex", "0");
        group.setAttribute("aria-label", `${safeText(TYPE_LABELS[node.type], node.type)}：${safeText(node.label)}`);
        group.setAttribute("aria-selected", String(node.id === this.selectedId));
        group.classList.toggle("is-selected", node.id === this.selectedId);
        group.setAttribute("transform", `translate(${position.x} ${position.y})`);

        const circle = svgEl("circle", "graph-node-shape");
        circle.setAttribute("r", this.nodeRadius(node));
        const label = svgEl("text", "graph-node-label");
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("y", this.nodeRadius(node) + 17);
        label.textContent = this.shortLabel(node.label);
        const secondary = svgEl("text", "graph-node-secondary");
        secondary.setAttribute("text-anchor", "middle");
        secondary.setAttribute("y", this.nodeRadius(node) + 30);
        secondary.textContent = TYPE_LABELS[node.type] || safeText(node.type, "节点");
        group.append(circle, label, secondary);

        let moved = false;
        this.listen(group, "pointerdown", (event) => {
          event.stopPropagation();
          moved = false;
          this.drag = { pointerId: event.pointerId, nodeId: node.id, startX: event.clientX, startY: event.clientY, origin: { ...position }, group };
          group.setPointerCapture?.(event.pointerId);
        });
        this.listen(group, "click", () => {
          if (moved) { moved = false; return; }
          this.selectNode(node.id);
        });
        this.listen(group, "keydown", (event) => {
          if (["Enter", " "].includes(event.key)) {
            event.preventDefault();
            this.selectNode(node.id);
          }
        });
        group.__setMoved = () => { moved = true; };
        this.nodeLayer.append(group);
      }
    }

    shortLabel(value) {
      const text = safeText(value);
      return text.length > 16 ? `${text.slice(0, 15)}…` : text;
    }

    moveNode(event) {
      if (!this.drag || event.pointerId !== this.drag.pointerId) return;
      const dx = (event.clientX - this.drag.startX) / this.transform.scale;
      const dy = (event.clientY - this.drag.startY) / this.transform.scale;
      if (Math.abs(dx) + Math.abs(dy) > 3) this.drag.group.__setMoved?.();
      const position = { x: clamp(this.drag.origin.x + dx, 20, VIEW_WIDTH - 20), y: clamp(this.drag.origin.y + dy, 20, VIEW_HEIGHT - 20) };
      this.positions.set(this.drag.nodeId, position);
      this.drag.group.setAttribute("transform", `translate(${position.x} ${position.y})`);
      this.redrawEdgePositions();
    }

    endNodeDrag(event) {
      if (!this.drag || event.pointerId !== this.drag.pointerId) return;
      this.drag = null;
    }

    redrawEdgePositions() {
      this.edgeLayer.querySelectorAll("[data-edge-id]").forEach((line) => {
        const edge = ensureArray(this.graph?.edges).find((item) => item.id === line.dataset.edgeId);
        const source = edge && this.positions.get(edge.source);
        const target = edge && this.positions.get(edge.target);
        if (!source || !target) return;
        line.setAttribute("x1", source.x);
        line.setAttribute("y1", source.y);
        line.setAttribute("x2", target.x);
        line.setAttribute("y2", target.y);
      });
    }

    selectNode(nodeId) {
      const node = ensureArray(this.graph?.nodes).find((item) => item.id === nodeId);
      if (!node) return;
      this.selectedId = nodeId;
      const depth = clamp(Number(this.depth?.value) || 1, 1, 2);
      neighborhood(this.graph, nodeId, depth).forEach((id) => this.expanded.add(id));
      this.render();
      this.openDetail(node);
    }

    sourceRecords(node) {
      const byId = new Map(ensureArray(this.graph?.sources).map((source) => [source.id, source]));
      const records = ensureArray(node.source_ids).map((id) => byId.get(id)).filter(Boolean);
      if (node.source && typeof node.source === "object") records.unshift({
        id: "embedded",
        label: node.source.title,
        publication: node.source.publisher,
        url: node.source.url,
        accessed_at: node.source.accessed_at,
        source_locator: node.evidence?.locator,
      });
      return records;
    }

    relatedNodes(nodeId) {
      const ids = new Set();
      ensureArray(this.graph?.edges).forEach((edge) => {
        if (edge.source === nodeId) ids.add(edge.target);
        if (edge.target === nodeId) ids.add(edge.source);
      });
      const byId = new Map(ensureArray(this.graph?.nodes).map((node) => [node.id, node]));
      return [...ids].map((id) => byId.get(id)).filter(Boolean);
    }

    openDetail(node) {
      if (!this.drawer || !this.drawerBody) return;
      this.drawerTitle.textContent = safeText(node.label, "节点详情");
      this.drawerMeta.textContent = `${TYPE_LABELS[node.type] || safeText(node.type, "知识节点")}  |  ${safeText(node.id)}`;
      const summary = detailSection("内容说明");
      summary.append(el("p", "", safeText(node.summary, "暂无说明。")));

      const evidence = detailSection("证据与适用边界");
      addDefinitionList(evidence, [
        ["证据等级", safeText(node.evidence_grade || node.evidence?.grade, "未评级")],
        ["原文位置", safeText(node.evidence?.locator || this.sourceRecords(node)[0]?.source_locator, "未记录")],
        ["证据摘录", safeText(node.evidence?.excerpt, "请查看所列原始来源")],
        ["支持范围", safeText(node.evidence?.supported_claim, "以来源及节点说明为边界")],
        ["更新时间", safeText(node.updated_at, "未记录")],
      ]);

      const sourcesSection = detailSection("原文档与资料来源");
      const sourceList = el("ul", "graph-source-list");
      const sources = this.sourceRecords(node);
      if (!sources.length) sourceList.append(el("li", "", "尚未绑定可展示的来源记录"));
      sources.forEach((source) => {
        const item = el("li");
        const title = el("strong", "", safeText(source.label || source.title));
        item.append(title);
        const publication = el("p", "", `${safeText(source.publication || source.publisher, "来源机构未记录")}  |  访问日期：${safeText(source.accessed_at)}`);
        item.append(publication);
        const sourceDocument = safeText(source.source_document, "");
        if (sourceDocument) item.append(el("p", "", `原文档：${sourceDocument}`));
        const locator = safeText(source.source_locator, "");
        if (locator) item.append(el("p", "", `位置：${locator}`));
        const url = safeHttps(source.url);
        if (url) {
          const link = el("a", "", "打开公开来源");
          link.href = url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          item.append(link);
        }
        sourceList.append(item);
      });
      sourcesSection.append(sourceList);

      const governance = detailSection("审核、权利与隐私");
      addDefinitionList(governance, [
        ["审核状态", safeText(node.review?.label, REVIEW_LABELS[nodeReview(node)] || nodeReview(node))],
        ["审核人", safeText(node.review?.reviewer, "未记录")],
        ["审核时间", safeText(node.review?.reviewed_at, "未记录")],
        ["审核意见", safeText(node.review?.note, "未记录")],
        ["权利状态", safeText(node.rights?.label, RIGHTS_LABELS[nodeRights(node)] || nodeRights(node))],
        ["权利持有人", safeText(node.rights?.holder, "未记录")],
        ["许可范围", safeText(node.rights?.scope, "未记录")],
        ["隐私风险", PRIVACY_LABELS[node.privacy_risk] || safeText(node.privacy_risk, "未复核")],
        ["未成年人", node.contains_minors === true ? "涉及，禁止自动公开" : node.contains_minors === false ? "不涉及" : "未记录"],
      ]);
      const projectedIds = Array.isArray(this.meta?.public_preview?.nodes)
        ? new Set(this.meta.public_preview.nodes.map((item) => item.id))
        : null;
      const versionCurrent = !Number.isInteger(node.version)
        || (node.reviewed_version === node.version && node.published_version === node.version);
      const publicReady = projectedIds
        ? projectedIds.has(node.id)
        : ["verified", "approved"].includes(nodeReview(node))
          && ["authorized", "not_applicable"].includes(nodeRights(node))
          && !["medium", "high", "unreviewed"].includes(node.privacy_risk)
          && node.contains_minors !== true
          && !["conflict", "gap"].includes(node.conflict_status)
          && versionCurrent;
      const gate = el("p", "graph-inline-message", publicReady ? "该节点已满足图谱公开治理条件。" : "该节点仍有审核、权利、隐私或证据边界未满足，不得进入公众图谱。");
      gate.dataset.state = publicReady ? "success" : "warning";
      governance.append(gate);

      const relationships = detailSection("关联知识");
      const relationshipList = el("ul", "graph-relationship-list");
      const related = this.relatedNodes(node.id);
      if (!related.length) relationshipList.append(el("li", "", "当前节点暂无已登记关联"));
      related.slice(0, 20).forEach((relatedNode) => {
        const item = el("li");
        const button = el("button", "", `${TYPE_LABELS[relatedNode.type] || relatedNode.type}：${relatedNode.label}`);
        button.type = "button";
        button.addEventListener("click", () => this.selectNode(relatedNode.id), { once: true });
        item.append(button);
        relationshipList.append(item);
      });
      relationships.append(relationshipList);

      this.drawerBody.replaceChildren(summary, evidence, sourcesSection, governance, relationships);
      const editor = this.editorTarget(node);
      if (this.editorLink) {
        this.editorLink.href = editor.href;
        this.editorLink.textContent = editor.label;
        this.editorLink.onclick = (event) => {
          const detail = { nodeId: node.id, target: editor.target, href: editor.href };
          const navigationEvent = typeof CustomEvent === "function"
            ? new CustomEvent("knowledgegraph:navigate-editor", { bubbles: true, cancelable: true, detail })
            : null;
          if (navigationEvent && !this.root.dispatchEvent(navigationEvent)) event.preventDefault();
          if (typeof this.options.onNavigateEditor === "function" && this.options.onNavigateEditor(detail, event) === false) event.preventDefault();
        };
      }
      this.drawer.hidden = false;
      this.drawer.classList.add("is-open");
      this.drawer.setAttribute("aria-hidden", "false");
      if (this.backdrop) this.backdrop.hidden = false;
    }

    editorTarget(node) {
      const directHref = safeText(node.editor?.href, "");
      if (/^(?:\.\/)?workspace\.html#(?:content|materials)$/.test(directHref) || /^(?:content|curation)\.html(?:\?.*)?$/.test(directHref)) {
        return { href: directHref, label: safeText(node.editor?.label, "前往现有编辑器"), target: directHref.includes("content") ? "content" : "materials" };
      }
      const target = node.editor_target === "content" ? "content" : "materials";
      return { href: `workspace.html#${target}`, label: target === "content" ? "前往网站内容编辑器" : "前往真实素材编辑器", target };
    }

    closeDetail() {
      if (!this.drawer) return;
      this.drawer.classList.remove("is-open");
      this.drawer.setAttribute("aria-hidden", "true");
      this.drawer.hidden = true;
      if (this.backdrop) this.backdrop.hidden = true;
      this.selectedId = "";
      this.nodeLayer?.querySelectorAll("[data-graph-node]").forEach((node) => {
        node.classList.remove("is-selected");
        node.setAttribute("aria-selected", "false");
      });
    }

    zoom(multiplier, event = null) {
      const oldScale = this.transform.scale;
      const nextScale = clamp(oldScale * multiplier, 0.45, 2.2);
      if (event && this.canvas) {
        const rect = this.canvas.getBoundingClientRect();
        const px = event.clientX - rect.left;
        const py = event.clientY - rect.top;
        this.transform.x = px - (px - this.transform.x) * (nextScale / oldScale);
        this.transform.y = py - (py - this.transform.y) * (nextScale / oldScale);
      }
      this.transform.scale = nextScale;
      this.applyViewportTransform();
    }

    applyViewportTransform() {
      this.viewport.setAttribute("transform", `translate(${this.transform.x} ${this.transform.y}) scale(${this.transform.scale})`);
      if (this.scaleReadout) this.scaleReadout.textContent = `${Math.round(this.transform.scale * 100)}%`;
    }

    resetView(resetFilters) {
      this.transform = { x: 0, y: 0, scale: 1 };
      this.positions.clear();
      this.expanded.clear();
      if (resetFilters) {
        if (this.search) this.search.value = "";
        Object.values(this.filters).forEach((select) => { if (select) select.value = "all"; });
      }
      this.applyViewportTransform();
      if (this.graph) this.render();
    }

    updateSummary(visible, total) {
      if (!this.summaryNode) return;
      this.summaryNode.replaceChildren();
      const count = el("strong", "", String(visible));
      this.summaryNode.append(count, document.createTextNode(` / ${total} 个节点`));
    }

    destroy() {
      this.abort.abort();
      this.closeDetail();
      delete this.root.__knowledgeGraphController;
    }
  }

  function init(rootOrSelector = "[data-knowledge-graph]", options = {}) {
    if (typeof document === "undefined") return null;
    const root = typeof rootOrSelector === "string" ? document.querySelector(rootOrSelector) : rootOrSelector;
    if (!root) return null;
    if (root.__knowledgeGraphController) return root.__knowledgeGraphController;
    const controller = new KnowledgeGraphController(root, options);
    root.__knowledgeGraphController = controller;
    controller.load();
    return controller;
  }

  global.KnowledgeGraphWorkbench = Object.freeze({
    init,
    __test: Object.freeze({ normalizePayload, safeHttps, neighborhood, selectVisibleNodes }),
  });
})(typeof window !== "undefined" ? window : globalThis);
