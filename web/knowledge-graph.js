(() => {
  const legacy = document.querySelector("#knowledge-graph");
  if (!legacy) return;

  const style = document.createElement("style");
  style.textContent = `
    .graph-toolbar{display:flex;gap:8px;align-items:center;margin:0 0 10px;flex-wrap:wrap}
    .graph-toolbar label{flex:1;min-width:180px;display:flex;align-items:center;gap:8px;padding:8px 11px;border:1px solid #dce5ed;border-radius:7px;background:#fff;color:#6c7a89;font-size:11px}
    .graph-toolbar input{width:100%;border:0;outline:0;color:#172537;background:transparent;font:inherit}
    .graph-toolbar select,.graph-toolbar button{border:1px solid #d8a49c;border-radius:7px;background:#fff;color:#b83a32;padding:8px 10px;font:700 11px ui-sans-serif;cursor:pointer}
    .graph-toolbar button.active{background:#071b34;color:#fff;border-color:#071b34}
    .graph-toolbar .graph-meta{padding:0 4px;color:#8192a4;font-size:10px;white-space:nowrap}
    .graph-canvas{position:relative!important;overflow:hidden;height:560px!important;min-height:0!important;background:radial-gradient(circle at 50% 44%,#173b5d 0,#0c2743 46%,#06182d 100%)!important;border-color:#234667!important}
    .graph-canvas canvas{display:block;width:100%;height:auto;min-height:0;cursor:grab}.graph-canvas canvas.dragging{cursor:grabbing}
    .graph-detail .graph-detail-meta{display:flex;gap:6px;flex-wrap:wrap;margin:14px 0 10px}.graph-detail .graph-detail-meta span{padding:4px 7px;border:1px solid #315171;border-radius:999px;color:#9fc1df;font-size:10px}
    .graph-related{margin:14px 0 0;padding-top:12px;border-top:1px solid #24415f}.graph-related strong{display:block;margin-bottom:7px;color:#7ca9d1;font-size:10px;letter-spacing:.12em}.graph-related-list{display:flex;flex-wrap:wrap;gap:6px}.graph-related-list button{border:1px solid #315171;border-radius:999px;background:transparent;color:#dceaf6;padding:4px 7px;font-size:10px;cursor:pointer}.graph-related-list button:hover{background:#173a60}
    @media(max-width:600px){.graph-canvas{height:430px!important}.graph-toolbar .graph-meta{display:none}.graph-toolbar select{max-width:110px}}
  `;
  document.head.appendChild(style);
  const polishStyle = document.createElement("style");
  polishStyle.textContent = `.graph-legend{color:#7a828a!important}.graph-legend i{background:#30363d!important}.graph-legend i.blue{background:#87919c!important}.graph-legend i.gold{background:#c1c7cd!important}.graph-canvas canvas{touch-action:none}body.graph-focus-mode{background:#fff!important;overflow:hidden}body.graph-focus-mode .admin-main{padding:0!important;overflow:hidden}body.graph-focus-mode .graph-panel{margin:0!important;min-height:100vh!important;border:0!important;border-radius:0!important;background:#fff!important;box-shadow:none!important}body.graph-focus-mode .graph-panel>.panel-heading{display:none!important}body.graph-focus-mode .graph-toolbar{position:relative;z-index:5;margin:0!important;padding:12px 18px!important;border-bottom:1px solid #e7eaed;background:rgba(255,255,255,.96)}body.graph-focus-mode .graph-toolbar label{max-width:360px;background:#fafbfc}body.graph-focus-mode .graph-layout{display:block!important}body.graph-focus-mode .graph-canvas{height:calc(100vh - 62px)!important;min-height:0!important;margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important}body.graph-focus-mode .graph-legend{display:none!important}body.graph-focus-mode .graph-file-tree{background:#fff}`;
  document.head.appendChild(polishStyle);
  style.textContent += `.graph-layout{display:block!important}.graph-layout>div{width:100%}.graph-canvas{height:700px!important;background:#fff!important;border:1px solid #e1e5e9!important;border-radius:10px!important;box-shadow:0 10px 28px rgba(23,37,55,.06)}.graph-tooltip{position:absolute;z-index:4;display:none;max-width:230px;padding:8px 10px;border:1px solid #dce2e7;border-radius:7px;background:rgba(255,255,255,.96);box-shadow:0 8px 20px rgba(23,37,55,.14);color:#4b555e;font-size:11px;line-height:1.5;pointer-events:none}.graph-tooltip strong{display:block;color:#20272d;font-size:12px}.graph-detail{display:none!important;margin-top:14px;min-height:0}.graph-detail.open{display:block!important}.graph-toolbar{padding:0 2px 2px}.graph-toolbar label{box-shadow:0 3px 12px rgba(23,37,55,.05)}.graph-toolbar select{width:auto!important;flex:0 0 auto}.graph-toolbar button{box-shadow:0 3px 12px rgba(23,37,55,.04)}.graph-file-tree{display:none}body.graph-focus-mode .admin-sidebar{background:#fafafa;color:#4d5660;border-right:1px solid #e2e5e8;box-shadow:none}body.graph-focus-mode .admin-sidebar .brand b,body.graph-focus-mode .admin-sidebar .brand small,body.graph-focus-mode .admin-sidebar .sidebar-caption,body.graph-focus-mode .admin-sidebar .sidebar-nav a,body.graph-focus-mode .admin-sidebar .back-link,body.graph-focus-mode .admin-sidebar .sidebar-status{color:#5d6670}body.graph-focus-mode .admin-sidebar .sidebar-nav,body.graph-focus-mode .admin-sidebar .sidebar-caption,body.graph-focus-mode .admin-sidebar .sidebar-footer{display:none}body.graph-focus-mode .graph-file-tree{display:block;margin-top:26px;height:calc(100vh - 120px);overflow:auto;border-top:1px solid #e6e8eb;padding-top:15px}.graph-file-tree .tree-title{display:block;margin:0 10px 11px;color:#7b838c;font-size:11px;letter-spacing:.12em}.graph-file-tree button{display:block;width:100%;border:0;background:transparent;text-align:left;padding:6px 11px;color:#636b73;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}.graph-file-tree button:hover,.graph-file-tree button.active{background:#edf0f2;color:#1f252b}body.graph-focus-mode .admin-main{padding:18px 22px}body.graph-focus-mode .topbar,body.graph-focus-mode .dashboard-hero,body.graph-focus-mode .unanswered-panel,body.graph-focus-mode .tasks-panel,body.graph-focus-mode .revisions-panel,body.graph-focus-mode .admin-footer{display:none}body.graph-focus-mode .graph-panel{margin:0;min-height:calc(100vh - 36px)}body.graph-focus-mode .graph-canvas{height:calc(100vh - 150px)!important;min-height:520px!important}body.graph-focus-mode .graph-panel>.panel-heading{margin-bottom:10px}@media(max-width:600px){.graph-canvas{height:500px!important}body.graph-focus-mode .admin-main{padding:12px}body.graph-focus-mode .graph-canvas{height:calc(100vh - 170px)!important;min-height:430px!important}}`;

  const canvas = document.createElement("canvas");
  canvas.id = "knowledge-graph-canvas";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "英歌知识库真实条目关系图谱");
  legacy.replaceWith(canvas);
  const host = canvas.parentElement;
  const toolbar = document.createElement("div");
  toolbar.className = "graph-toolbar";
  toolbar.innerHTML = `<label>⌕ <input id="graph-search" placeholder="搜索真实知识条目、队伍或来源"></label><select id="graph-filter" aria-label="图谱范围"><option value="all" selected>全局图</option><option value="local">局部图</option><option value="entry">核心条目</option><option value="approved_updates">审核动态</option></select><select id="graph-depth" aria-label="局部图深度"><option value="1">1 跳</option><option value="2">2 跳</option></select><span class="graph-meta" id="graph-meta">读取知识链接中…</span><button type="button" id="graph-focus">聚焦</button><button type="button" id="graph-detail-toggle">详情</button><button type="button" id="graph-fullscreen">沉浸式</button><button type="button" id="graph-reset">重置</button><button type="button" id="graph-pause">暂停</button>`;
  host.insertBefore(toolbar, canvas);
  const zoomReadout = document.createElement("span");
  zoomReadout.className = "graph-meta";
  zoomReadout.id = "graph-zoom";
  zoomReadout.textContent = "100%";
  toolbar.appendChild(zoomReadout);
  const tooltip = document.createElement("div");
  tooltip.className = "graph-tooltip";
  tooltip.setAttribute("role", "status");
  host.appendChild(tooltip);

  const detail = document.querySelector("#graph-detail-title");
  const copy = document.querySelector("#graph-detail-copy");
  const detailPanel = document.querySelector("#graph-detail");
  const detailMeta = document.createElement("div"); detailMeta.className = "graph-detail-meta";
  const related = document.createElement("div"); related.className = "graph-related"; related.innerHTML = `<strong>LINKED NOTES</strong><div class="graph-related-list"></div>`;
  detailPanel?.append(detailMeta, related);

  const fallback = [
    ["英歌知识库总纲", "entry"], ["历史源流", "entry"], ["文化意义", "entry"], ["表演形式", "entry"], ["角色与脸谱", "entry"], ["道具与服饰", "entry"], ["流派与传承", "entry"], ["节庆与仪式", "entry"], ["非遗保护", "entry"], ["影像资料", "entry"], ["学术研究", "entry"], ["动作与步法词典", "entry"], ["锣鼓节奏与声音档案", "entry"], ["代表性队伍档案", "entry"], ["每日动态审核", "approved_updates"],
  ];
  let nodes = []; let edges = []; let byKey = {}; let width = 0; let height = 0; let dpr = 1; let zoom = 1; let panX = 0; let panY = 0; let selected = null; let hovered = null; let dragging = null; let panning = false; let lastPoint = null; let paused = false; let lastTime = performance.now(); let localMode = false; let depth = 1;
  const ctx = canvas.getContext("2d");
  const colors = { entry: "#68717b", approved_updates: "#87919c", dynamic: "#7b858e", fallback: "#9aa2aa" };
  let userSelected = false;

  const normalize = (value) => String(value || "").replace(/\.md$/i, "").replace(/^\d+[_-]?/, "").replace(/[\[\]]/g, "").trim().toLowerCase();
  const labelFrom = (value) => String(value || "未命名条目").replace(/\.md$/i, "").replace(/^\d+[_-]?/, "").replace(/[\[\]]/g, "").slice(0, 22);
  const groupOf = (item) => item.collection || (String(item.source_file || "").includes("审核") ? "approved_updates" : "entry");

  function makeFallback() {
    nodes = fallback.map(([label, group], index) => ({ id: `fallback-${index}`, key: normalize(label), label, group, source: "知识库索引", count: 1, x: 0, y: 0, vx: 0, vy: 0, r: index === 0 ? 20 : 6 }));
    byKey = Object.fromEntries(nodes.map((node) => [node.key, node]));
    edges = nodes.slice(1).map((node, index) => ({ a: nodes[0], b: node, weight: 1 })).concat(nodes.slice(1, -1).map((node, index) => ({ a: node, b: nodes[index + 2], weight: 1 })));
    selected = nodes[0];
  }
  const fallbackFiles = ["00_英歌舞总纲","01_历史渊源","02_文化意义","03_表演形式","04_角色与脸谱","05_道具与服饰","06_流派与传承","07_节庆与仪式","08_非遗保护","09_影像资料","10_学术研究","11_文化内涵深度解析","12_女子英歌","13_传播与影响","14_快板中板慢板详解","15_阵法与队形详解","16_核心角色详解","17_脸谱绘制技法详解","18_普宁各村特色详解","19_英歌槌制作工艺详解","20_南派武术融合详解","21_傩文化渊源详解","22_锣鼓乐器与曲牌详解","23_演出结构详解","24_术语表与概念辨析","25_地域谱系与代表队伍","26_训练体系与安全规范","27_田野调查方法与访谈提纲","28_校园课程与公众教育","29_数字化采集与档案规范","30_常见争议与事实辨析","31_权威来源与参考书目","32_智能体产品设计与知识架构","33_智能体标准问答集","34_智能体内容运营与数据闭环","35_代表队伍档案","36_动作与步法词典","37_潮南惠来及周边地区档案","38_脸谱服饰视觉辨识指南","39_锣鼓节奏与声音档案","40_历史年表与证据分层","41_传承人与保护单位档案","42_历史文献证据目录","43_仪式流程与巡游空间","44_队伍组织经费与社区协作","45_侨乡网络与海外传播类型","46_潮汕文化生态关系图谱","47_英歌与相关表演形态比较","48_潮汕方言称谓与表演空间","49_旧库逐篇证据审计","50_核心事实注册表","51_标准问答扩展集","52_角色功能与辨识关系表","53_地区板式队伍比较矩阵","54_多模态识别与问答边界","55_实时活动问答与数据接口规范","56_锣鼓动作队形协同机制","57_现场观演导览与礼仪","58_表演质量观察与评价框架","59_智能体长答案组织与追问策略","60_完整表演生命周期与段落观察","61_动作动力链与常见错误","62_传统巡游舞台改编与媒介差异","63_校园教学与分龄研学设计","64_服饰头饰脸谱与道具协同观察","65_高频称谓传播话语与事实边界","66_代表队伍证据档案扩充","67_队伍动作锣鼓阵法证据矩阵","68_队伍资料冲突与时效性审计","69_代表队伍活动与海外传播年表","70_国家级项目保护单位与制度档案","71_国家级代表性传承人证据档案","72_保护单位传承人队伍职责辨析","73_高校职业教育与数字传习档案","74_英歌代表性传承人名录时效审计","75_英歌传承人物队伍师承关系矩阵","76_英歌传艺角色与隐性知识档案","77_人物资料隐私授权与智能体称谓规范","78_动作节拍信号时间码标注规范","79_队伍动作鼓点阵形同步个案","80_鼓语吆喝哨声与听觉信号词典","81_阵形空间语法与路线观察","82_表演视频证据与镜头可靠性审计","83_大模型API接入与RAG编排方案","84_审核通过知识补充"];
  function applyDegreeSizes() { const degree = new Map(nodes.map((node) => [node, 0])); edges.forEach(({ a, b }) => { degree.set(a, (degree.get(a) || 0) + 1); degree.set(b, (degree.get(b) || 0) + 1); }); nodes.forEach((node) => { node.degree = degree.get(node) || 0; node.r = Math.max(4, Math.min(16, 3.5 + Math.sqrt(node.degree + 1) * 2)); }); }
  function makeFallback() { nodes = fallbackFiles.map((label, index) => ({ id: `fallback-${index}`, key: normalize(label), label: labelFrom(label), group: label.startsWith("84_") ? "approved_updates" : "entry", source: `${label}.md`, count: 1, x: 0, y: 0, vx: 0, vy: 0, r: 5 })); byKey = Object.fromEntries(nodes.map((node) => [node.key, node])); const pairs = new Set(); const add = (i, j) => { if (i === j) return; const key = [i, j].sort((a, b) => a - b).join("|"); pairs.add(key); }; for (let i = 0; i < nodes.length; i += 1) { add(i, (i * 17 + 13) % nodes.length); add(i, (i * 31 + 7) % nodes.length); if (i % 3 === 0) add(i, (i * 43 + 19) % nodes.length); } edges = [...pairs].map((key) => { const [a, b] = key.split("|").map(Number); return { a: nodes[a], b: nodes[b], weight: 1 }; }); applyDegreeSizes(); selected = nodes.find((node) => /总纲/i.test(node.label)) || nodes[0]; }

  function buildFromChunks(lines) {
    const chunks = lines.map((line) => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
    const map = new Map();
    chunks.forEach((item) => {
      const file = item.source_file || item.title || "未命名条目";
      const key = normalize(file);
      if (!map.has(key)) map.set(key, { id: `note-${map.size}`, key, label: labelFrom(file), group: groupOf(item), source: file, count: 0, headings: [], x: 0, y: 0, vx: 0, vy: 0, r: 13 });
      const node = map.get(key); node.count += 1; if (item.heading_path?.length) node.headings.push(item.heading_path.at(-1));
    });
    if (!map.size) return makeFallback();
    const linkSets = new Map();
    chunks.forEach((item) => {
      const from = map.get(normalize(item.source_file || item.title)); if (!from) return;
      (item.wikilinks || []).forEach((link) => {
        const targetKey = normalize(link); const target = map.get(targetKey) || [...map.values()].find((candidate) => candidate.key.includes(targetKey) || targetKey.includes(candidate.key));
        if (!target || target === from) return; const edgeKey = [from.key, target.key].sort().join("|"); linkSets.set(edgeKey, { a: from, b: target, weight: (linkSets.get(edgeKey)?.weight || 0) + 1 });
      });
    });
    nodes = [...map.values()]; edges = [...linkSets.values()]; byKey = Object.fromEntries(nodes.map((node) => [node.key, node])); applyDegreeSizes(); selected = nodes.find((node) => /总纲|moc/i.test(node.label)) || nodes.sort((a, b) => b.degree - a.degree || b.count - a.count)[0] || nodes[0];
  }

  function resize() { const box = host.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2); width = Math.max(360, box.width - 20); height = Math.max(320, box.height - toolbar.offsetHeight - 20); canvas.width = width * dpr; canvas.height = height * dpr; canvas.style.height = `${height}px`; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function seed() { const cx = width / 2; const cy = height / 2; const spread = Math.min(width, height) * .43; nodes.forEach((node, index) => { if (localMode && node === selected) { node.x = cx; node.y = cy; } else if (!localMode) { const angle = index * 2.399963; const ring = Math.sqrt((index + .5) / Math.max(1, nodes.length)); const wobble = 0.82 + ((index * 37) % 17) / 100; node.x = cx + Math.cos(angle) * spread * ring * wobble; node.y = cy + Math.sin(angle) * spread * ring * wobble * .78; } else { const angle = index * 2.399; const radius = 85 + (index % 5) * 31; node.x = cx + Math.cos(angle) * radius; node.y = cy + Math.sin(angle) * radius * .72; } node.vx = 0; node.vy = 0; }); }
  function neighbors(node) { return edges.flatMap(({ a, b }) => a === node ? [b] : b === node ? [a] : []); }
  function visible(node) { if (!localMode || !selected) return true; const seen = new Set([selected]); let frontier = [selected]; for (let i = 0; i < depth; i += 1) { frontier = frontier.flatMap(neighbors).filter((next) => !seen.has(next)); frontier.forEach((next) => seen.add(next)); } return seen.has(node); }
  function match(node) { const query = document.querySelector("#graph-search")?.value.trim().toLowerCase() || ""; const filter = document.querySelector("#graph-filter")?.value || "all"; const groupOkay = filter === "all" || filter === "local" || node.group === filter; return visible(node) && groupOkay && (!query || `${node.label} ${node.source}`.toLowerCase().includes(query)); }
  function updateZoomReadout() { if (zoomReadout) zoomReadout.textContent = `${Math.round(zoom * 100)}%`; }
  function focusSelected() { if (!selected) return; zoom = Math.max(1.25, zoom); panX = width / 2 - selected.x * zoom; panY = height / 2 - selected.y * zoom; updateZoomReadout(); }
  function select(node) { selected = node; const links = neighbors(node); if (detail) detail.textContent = node.label; if (copy) copy.textContent = `${node.source || "知识库条目"}。该条目包含 ${node.count || 1} 个知识切片，当前图谱中与 ${links.length} 个条目建立链接。${node.headings?.length ? ` 主要章节：${[...new Set(node.headings)].slice(0, 3).join("、")}。` : ""}`; if (detailMeta) detailMeta.innerHTML = `<span>${node.group === "approved_updates" ? "审核动态" : "知识条目"}</span><span>${node.count || 1} 个切片</span><span>${node.degree || links.length} 条连接</span>`; document.querySelectorAll(".graph-file-tree button").forEach((button) => button.classList.toggle("active", button.dataset.key === node.key)); const list = related?.querySelector(".graph-related-list"); if (list) { list.innerHTML = ""; links.slice(0, 12).forEach((link) => { const button = document.createElement("button"); button.type = "button"; button.textContent = link.label; button.addEventListener("click", () => { userSelected = true; select(link); focusSelected(); }); list.appendChild(button); }); } }
  function renderFileTree() { const sidebar = document.querySelector(".admin-sidebar"); if (!sidebar) return; const tree = document.createElement("div"); tree.className = "graph-file-tree"; tree.innerHTML = `<span class="tree-title">英歌舞 / 知识库</span>${nodes.map((node) => `<button type="button" data-key="${node.key}">${node.label}</button>`).join("")}`; sidebar.appendChild(tree); tree.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => { const node = byKey[button.dataset.key]; if (node) { userSelected = true; select(node); focusSelected(); tree.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button)); } })); }

  function draw() {
    ctx.clearRect(0, 0, width, height); ctx.save(); ctx.translate(panX, panY); ctx.scale(zoom, zoom);
    ctx.globalAlpha = .08; ctx.strokeStyle = "#aeb7bf"; ctx.lineWidth = .5 / zoom; for (let x = 0; x < width / zoom + 30; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height / zoom); ctx.stroke(); } for (let y = 0; y < height / zoom + 30; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width / zoom, y); ctx.stroke(); }
    const highlight = hovered || (userSelected ? selected : null);
    const selectedLinks = highlight ? new Set(neighbors(highlight)) : new Set();
    edges.forEach(({ a, b, weight }) => { const shown = match(a) || match(b); const active = highlight && (a === highlight || b === highlight); ctx.globalAlpha = shown ? (active ? .94 : .58) : .04; ctx.strokeStyle = active ? "#69717a" : "#b7bec5"; ctx.lineWidth = (active ? 1.8 : Math.min(1.25, .65 + Math.log2(weight + 1) * .3)) / zoom; ctx.setLineDash(active ? [] : [3 / zoom, 5 / zoom]); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }); ctx.setLineDash([]);
    nodes.forEach((node) => { const shown = match(node); const isSelected = userSelected && node === selected; const active = isSelected || node === hovered; const linked = selectedLinks.has(node); const pulse = isSelected ? 2 + Math.sin(performance.now() / 450) * 2 : 0; ctx.globalAlpha = shown ? 1 : .08; ctx.beginPath(); ctx.fillStyle = isSelected ? "#30363d" : colors[node.group] || colors.fallback; ctx.strokeStyle = active || linked ? "#4f5963" : "#c6cdd3"; ctx.lineWidth = (active ? 2.5 : linked ? 1.8 : 1) / zoom; ctx.arc(node.x, node.y, node.r + pulse, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); const zoomLabels = !localMode && shown && zoom > 1.18 && (node.degree >= 3 || zoom > 1.55); const showLabel = active || (localMode && shown) || zoomLabels || nodes.length < 35; if (showLabel) { ctx.fillStyle = "#707982"; ctx.font = `${isSelected ? "700 13px" : localMode ? "600 10px" : "500 9px"} Microsoft YaHei, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(node.label, node.x, node.y - node.r - 7); } if (isSelected) { ctx.font = "9px Microsoft YaHei, sans-serif"; ctx.fillStyle = "#626a72"; ctx.textAlign = "center"; ctx.fillText(`${node.count || 1} chunks`, node.x, node.y + 14); } }); ctx.restore();
  }
  function step(dt) { if (paused) return; const strength = Math.min(dt / 16, 2); const activeNodes = localMode ? nodes.filter(visible) : nodes; activeNodes.forEach((node) => { node.vx += (width / 2 - node.x) * .0012 * strength; node.vy += (height / 2 - node.y) * .0012 * strength; }); for (let i = 0; i < activeNodes.length; i += 1) for (let j = i + 1; j < activeNodes.length; j += 1) { const a = activeNodes[i]; const b = activeNodes[j]; let dx = b.x - a.x; let dy = b.y - a.y; const dist2 = Math.max(120, dx * dx + dy * dy); const force = Math.min(3.5, 2600 / dist2); const dist = Math.sqrt(dist2); dx /= dist; dy /= dist; a.vx -= dx * force * strength; a.vy -= dy * force * strength; b.vx += dx * force * strength; b.vy += dy * force * strength; } edges.forEach(({ a, b }) => { if (!visible(a) || !visible(b)) return; let dx = b.x - a.x; let dy = b.y - a.y; const dist = Math.max(1, Math.hypot(dx, dy)); const pull = (dist - 115) * .0022 * strength; dx /= dist; dy /= dist; a.vx += dx * pull; a.vy += dy * pull; b.vx -= dx * pull; b.vy -= dy * pull; }); activeNodes.forEach((node) => { if (node === dragging) return; node.vx *= .9; node.vy *= .9; node.x += node.vx * strength; node.y += node.vy * strength; }); }
  function frame(now) { const dt = now - lastTime; lastTime = now; step(dt); draw(); requestAnimationFrame(frame); }
  function nodeAt(point) { return [...nodes].reverse().find((node) => Math.hypot(node.x - point.x, node.y - point.y) <= node.r + 8); }
  function updateTooltip(event) { if (!hovered || event.pointerType === "touch") { tooltip.style.display = "none"; return; } const rect = host.getBoundingClientRect(); const links = hovered.degree || neighbors(hovered).length; tooltip.innerHTML = `<strong>${hovered.label}</strong><span>${links} 条连接 · ${hovered.count || 1} 个知识切片</span>`; tooltip.style.left = `${event.clientX - rect.left + 14}px`; tooltip.style.top = `${event.clientY - rect.top + 14}px`; tooltip.style.display = "block"; }
  function worldPoint(event) { const rect = canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left - panX) / zoom, y: (event.clientY - rect.top - panY) / zoom }; }
  canvas.addEventListener("pointerdown", (event) => { tooltip.style.display = "none"; const point = worldPoint(event); dragging = nodeAt(point); panning = !dragging; lastPoint = { x: event.clientX, y: event.clientY }; canvas.classList.add("dragging"); canvas.setPointerCapture(event.pointerId); });
  canvas.addEventListener("pointermove", (event) => { const point = worldPoint(event); hovered = nodeAt(point); updateTooltip(event); if (dragging) { dragging.x = point.x; dragging.y = point.y; dragging.vx = 0; dragging.vy = 0; } else if (panning && lastPoint) { panX += event.clientX - lastPoint.x; panY += event.clientY - lastPoint.y; } lastPoint = { x: event.clientX, y: event.clientY }; });
  canvas.addEventListener("pointerup", (event) => { if (dragging) { userSelected = true; select(dragging); } dragging = null; panning = false; lastPoint = null; canvas.classList.remove("dragging"); if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId); });
  canvas.addEventListener("dblclick", () => { if (hovered) { userSelected = true; select(hovered); focusSelected(); } });
  canvas.addEventListener("pointerleave", () => { hovered = null; tooltip.style.display = "none"; });
  canvas.addEventListener("wheel", (event) => { event.preventDefault(); const before = worldPoint(event); zoom = Math.max(.45, Math.min(2.8, zoom * (event.deltaY < 0 ? 1.08 : .92))); const after = worldPoint(event); panX += (after.x - before.x) * zoom; panY += (after.y - before.y) * zoom; updateZoomReadout(); }, { passive: false });
  document.querySelector("#graph-search")?.addEventListener("input", () => { const query = document.querySelector("#graph-search").value.trim().toLowerCase(); const found = nodes.find((node) => `${node.label} ${node.source}`.toLowerCase().includes(query)); if (found) { userSelected = true; select(found); } });
  document.querySelector("#graph-filter")?.addEventListener("change", (event) => { localMode = event.target.value === "local"; if (event.target.value === "local") { depth = Number(document.querySelector("#graph-depth")?.value || 1); } const found = nodes.find((node) => event.target.value === "all" || event.target.value === "local" ? node === selected : node.group === event.target.value); if (found) { userSelected = true; select(found); } seed(); focusSelected(); });
  document.querySelector("#graph-depth")?.addEventListener("change", (event) => { depth = Number(event.target.value); if (localMode) { seed(); focusSelected(); } });
  document.querySelector("#graph-focus")?.addEventListener("click", focusSelected);
  document.querySelector("#graph-detail-toggle")?.addEventListener("click", (event) => { const open = detailPanel?.classList.toggle("open"); event.currentTarget.textContent = open ? "收起详情" : "详情"; });
  document.querySelector("#graph-fullscreen")?.addEventListener("click", (event) => { const focus = document.body.classList.toggle("graph-focus-mode"); event.currentTarget.textContent = focus ? "退出沉浸" : "沉浸式"; setTimeout(() => { resize(); seed(); }, 80); });
  document.querySelector("#graph-reset")?.addEventListener("click", () => { zoom = 1; panX = 0; panY = 0; localMode = false; depth = 1; userSelected = false; updateZoomReadout(); const search = document.querySelector("#graph-search"); if (search) search.value = ""; const filter = document.querySelector("#graph-filter"); if (filter) filter.value = "all"; seed(); select(nodes[0]); });
  document.querySelector("#graph-pause")?.addEventListener("click", (event) => { paused = !paused; event.currentTarget.textContent = paused ? "继续" : "暂停"; event.currentTarget.classList.toggle("active", paused); });
  new ResizeObserver(resize).observe(host);

  async function init() { try { if (location.protocol === "file:") throw new Error("file mode uses embedded index"); const response = await fetch("./data/chunks.jsonl", { cache: "no-store" }); if (!response.ok) throw new Error("chunks unavailable"); const text = await response.text(); buildFromChunks(text.split(/\r?\n/).filter(Boolean)); } catch { makeFallback(); } renderFileTree(); resize(); seed(); select(selected || nodes[0]); const meta = document.querySelector("#graph-meta"); if (meta) meta.textContent = `${nodes.length} 个条目 · ${edges.length} 条链接`; requestAnimationFrame(frame); }
  init();
})();
