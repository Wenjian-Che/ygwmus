import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const playwrightCandidates = [
  process.env.CODEX_PLAYWRIGHT_PATH,
  "playwright",
  path.join(process.env.USERPROFILE || "", ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"),
].filter(Boolean);

let playwright;
for (const candidate of playwrightCandidates) {
  try {
    playwright = require(candidate);
    break;
  } catch {}
}
if (!playwright) throw new Error("Playwright is required for the knowledge graph browser regression");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const webRoot = path.join(root, "web");
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const target = path.resolve(webRoot, relative);
  if (!target.startsWith(`${webRoot}${path.sep}`) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    response.writeHead(404);
    response.end("not found");
    return;
  }
  response.writeHead(200, { "content-type": mimeTypes[path.extname(target).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(target).pipe(response);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const webPort = server.address().port;
const workspaceUrl = `http://127.0.0.1:${webPort}/admin/workspace.html`;

const browserExecutables = [
  process.env.PLAYWRIGHT_BROWSER_EXECUTABLE,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
].filter(Boolean);
const executablePath = browserExecutables.find((candidate) => fs.existsSync(candidate));
const browser = await playwright.chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });

const graphModes = [
  { id: "relations", label: "知识全景" },
  { id: "provenance", label: "来源治理" },
  { id: "governance", label: "冲突与缺口" },
];

const focalNodes = [
  {
    id: "claim-johor",
    type: "claim",
    label: "柔佛古来英歌交流",
    summary: "柔佛古来曾举办一场有明确时间、地点和参与主体的英歌交流活动。",
    source: {
      title: "柔佛州文化交流活动报道",
      publisher: "柔佛文化机构",
      url: "https://example.com/johor-evidence",
      accessed_at: "2026-08-29",
    },
    evidence: {
      locator: "第 4 段",
      excerpt: "2025年2月在柔佛古来举行交流活动",
      supported_claim: "仅支持该次活动的时间、地点与参与主体。",
    },
    review: {
      status: "approved",
      label: "已审核",
      reviewer: "馆员乙",
      reviewed_at: "2026-08-30T08:00:00.000Z",
      note: "不得外推为当地长期传承。",
    },
    rights: {
      status: "authorized",
      label: "已授权",
      holder: "柔佛文化机构",
      scope: "本馆数字展览",
    },
    editor: { label: "前往真实素材编辑器", href: "workspace.html#materials" },
  },
  {
    id: "source-johor",
    type: "source",
    label: "柔佛州文化交流活动报道",
    summary: "支持柔佛古来交流活动节点的来源。",
    source: { title: "柔佛州文化交流活动报道", publisher: "柔佛文化机构", url: "https://example.com/johor-evidence", accessed_at: "2026-08-29" },
    evidence: { locator: "第 4 段", excerpt: "2025年2月在柔佛古来举行交流活动", supported_claim: "活动事实" },
    review: { status: "approved", label: "已审核", reviewer: "馆员乙" },
    rights: { status: "authorized", label: "已授权", holder: "柔佛文化机构", scope: "本馆数字展览" },
    editor: { label: "前往真实素材编辑器", href: "workspace.html#materials" },
  },
  {
    id: "gap-johor-continuity",
    type: "gap",
    label: "柔佛持续传承证据缺口",
    summary: "现有来源不能证明活动之后形成持续传承。",
    source: { title: "尚无来源", publisher: "—", url: "", accessed_at: "" },
    evidence: { locator: "—", excerpt: "尚缺连续年份与当地队伍资料", supported_claim: "不能支持持续传承结论" },
    review: { status: "needs_evidence", label: "待补证", reviewer: "馆员乙" },
    rights: { status: "not_applicable", label: "不适用", holder: "—", scope: "—" },
    editor: { label: "前往真实素材编辑器", href: "workspace.html#materials" },
  },
  {
    id: "media-johor",
    type: "media",
    label: "柔佛活动候选影像",
    summary: "尚未获得公开传播授权的候选影像。",
    source: { title: "合作方候选媒体台账", publisher: "内部资料", url: "", accessed_at: "2026-08-29" },
    evidence: { locator: "候选媒体 08", excerpt: "仅供后台核验", supported_claim: "活动现场候选记录" },
    review: { status: "pending", label: "待审核", reviewer: "—" },
    rights: { status: "pending_authorization", label: "待授权", holder: "待确认", scope: "尚未取得公开传播授权" },
    editor: { label: "前往真实素材编辑器", href: "workspace.html#materials" },
  },
];

const fillerTypes = ["claim", "event", "media", "rights", "gap"];
const fillerNodes = Array.from({ length: 30 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");
  const type = fillerTypes[index % fillerTypes.length];
  return {
    id: `fixture-${number}`,
    type,
    label: `馆藏证据节点 ${number}`,
    summary: "用于验证大型图谱首屏不会一次渲染全部节点。",
    source: { title: `馆藏来源 ${number}`, publisher: "英歌舞数字博物馆", url: `https://example.com/source-${number}`, accessed_at: "2026-08-29" },
    evidence: { locator: `段落 ${number}`, excerpt: `固定证据摘录 ${number}`, supported_claim: `固定主张 ${number}` },
    review: { status: "approved", label: "已审核", reviewer: "馆员甲" },
    rights: { status: "authorized", label: "已授权", holder: "资料提供方", scope: "本馆数字展览" },
    editor: { label: "前往真实素材编辑器", href: "workspace.html#materials" },
  };
});

const knowledgeGraphFixture = {
  schema_version: 1,
  generated_at: "2026-08-30T10:00:00.000Z",
  modes: graphModes,
  first_screen_limit: 24,
  node_types: [
    { id: "all", label: "全部类型" },
    { id: "claim", label: "知识主张" },
    { id: "source", label: "来源" },
    { id: "event", label: "活动" },
    { id: "media", label: "媒体" },
    { id: "rights", label: "权利" },
    { id: "gap", label: "证据缺口" },
  ],
  nodes: [...focalNodes, ...fillerNodes],
  edges: [
    { id: "edge-claim-source", source: "claim-johor", target: "source-johor", type: "supported_by", label: "由来源支持" },
    { id: "edge-claim-gap", source: "claim-johor", target: "gap-johor-continuity", type: "bounded_by", label: "结论边界" },
    { id: "edge-claim-media", source: "claim-johor", target: "media-johor", type: "illustrated_by", label: "候选媒体" },
  ],
};

const emptyGraphFixture = { ...knowledgeGraphFixture, nodes: [], edges: [] };
const curationFixture = {
  catalog: { schema_version: 2, version: 1, page_coverage: [], media_assets: [], exhibits: [] },
  summary: { exhibits: { total: 0, published: 0 }, events: { total: 0 }, rights: { pending_authorization: 0 }, public_media: 0 },
  private_media: { connected: false },
};

function json(route, body, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function installApiMock(page, options = {}) {
  const actor = options.actor || { id: "owner-graph-qa", role: "owner", display_name: "图谱测试管理员" };
  const graphResponse = options.graphResponse || { status: 200, body: knowledgeGraphFixture };
  const calls = [];
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    const method = request.method();
    calls.push({ method, pathname });

    if (method === "GET" && pathname === "/api/admin/auth/status") return json(route, { setup_required: false, authenticated: true, actor });
    if (method === "GET" && pathname === "/api/admin/session") return json(route, { actor });
    if (method === "POST" && pathname === "/api/admin/login") return json(route, { actor });
    if (method === "POST" && pathname === "/api/admin/logout") return json(route, { ok: true });
    if (method === "GET" && pathname === "/api/admin/knowledge-graph") return json(route, graphResponse.body, graphResponse.status);
    if (method === "GET" && pathname === "/api/health") return json(route, { ok: true, knowledge_available: true, chunks: 362, chat_mode: "grounded_model" });
    if (method === "GET" && pathname === "/api/admin/site-content") return json(route, { schema_version: 2, version: 4, published_version: 4, workflow_status: "published", draft: {}, published: {} });
    if (method === "GET" && pathname === "/api/admin/curation") return json(route, curationFixture);
    if (method === "GET" && pathname === "/api/admin/curation/audit") return json(route, { entries: [] });
    if (method === "GET" && pathname === "/api/admin/settings/model") return json(route, { model: "deepseek-v4-flash", thinking: true, api_key_configured: false });
    if (method === "GET" && pathname === "/api/admin/plans") return json(route, { items: [] });
    if (method === "GET" && pathname === "/api/exhibits") return json(route, { schema_version: 2, exhibits: [] });
    if (method === "GET" && pathname === "/api/voice/status") return json(route, { asr: { available: false }, tts: { available: false }, wake: { available: false } });
    return json(route, { code: "NOT_FOUND", message: `${method} ${pathname} is not mocked` }, 404);
  });
  return calls;
}

async function waitFor(predicate, message, timeout = 2500) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new assert.AssertionError({ message });
}

async function openKnowledgeGraph(page, calls) {
  await page.goto(`${workspaceUrl}#materials`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#authGate")?.hidden === true);
  await page.locator('[data-workspace-panel="materials"]').waitFor({ state: "visible" });

  const graphSwitch = page.locator('button, [role="tab"]', { hasText: /^证据图谱$/ });
  assert.equal(await graphSwitch.count(), 1, "真实素材区必须提供唯一的“证据图谱”视图切换入口");
  await graphSwitch.click();
  assert.equal(new URL(page.url()).pathname, "/admin/workspace.html", "证据图谱必须留在统一工作台内");
  await waitFor(() => calls.some((call) => call.method === "GET" && call.pathname === "/api/admin/knowledge-graph"), "切换图谱后没有读取 /api/admin/knowledge-graph");

  const graph = page.locator("[data-knowledge-graph]");
  await graph.waitFor({ state: "visible" });
  return graph;
}

const failures = [];
async function scenario(name, options, run) {
  const context = await browser.newContext({ viewport: options.viewport || { width: 1366, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(4000);
  const calls = await installApiMock(page, options);
  try {
    await run({ page, calls });
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push({ name, message: error?.message || String(error) });
    console.error(`FAIL ${name}: ${error?.message || error}`);
  } finally {
    await context.close();
  }
}

try {
  await scenario("真实素材区在同页切换证据图谱并提供三种模式", {}, async ({ page, calls }) => {
    const graph = await openKnowledgeGraph(page, calls);
    const modes = graph.locator("[data-mode]");
    assert.deepEqual(await modes.evaluateAll((items) => items.map((item) => ({ id: item.dataset.mode, label: item.textContent.trim() }))), graphModes, "图谱模式必须是知识全景、来源治理、冲突与缺口");
    for (const mode of graphModes) {
      const button = graph.locator(`[data-mode="${mode.id}"]`);
      await button.click();
      assert.equal(await button.getAttribute("aria-pressed"), "true", `${mode.label} 没有成为当前模式`);
      assert.equal(await graph.locator('[data-mode][aria-pressed="true"]').count(), 1, "图谱同时只能激活一种模式");
    }
  });

  await scenario("图谱限制首屏节点并支持搜索与类型筛选", {}, async ({ page, calls }) => {
    const graph = await openKnowledgeGraph(page, calls);
    const nodes = graph.locator("[data-graph-node]");
    await nodes.first().waitFor({ state: "visible" });
    const firstScreenCount = await nodes.count();
    assert.ok(firstScreenCount > 0 && firstScreenCount <= 24, `首屏必须显示 1–24 个节点，实际为 ${firstScreenCount}`);
    assert.equal(knowledgeGraphFixture.nodes.length > 24, true, "测试数据必须超过首屏上限，避免上限断言失效");
    const inaccessibleNodes = await nodes.evaluateAll((items) => items.filter((item) => !item.matches("button, a, [role='button'], [tabindex]")).length);
    assert.equal(inaccessibleNodes, 0, "每个首屏节点都必须可用键盘操作");

    const search = graph.getByLabel(/搜索.*图谱|图谱.*搜索/);
    await search.fill("柔佛");
    await page.waitForFunction(() => [...document.querySelectorAll("[data-knowledge-graph] [data-graph-node]")].every((node) => node.textContent.includes("柔佛")));
    assert.equal(await nodes.count(), 4, "搜索“柔佛”应只保留四个相关节点");

    await search.fill("");
    const typeFilter = graph.getByLabel(/类型筛选|节点类型/);
    await typeFilter.selectOption("source");
    await page.waitForFunction(() => [...document.querySelectorAll("[data-knowledge-graph] [data-graph-node]")].every((node) => node.dataset.nodeType === "source"));
    assert.equal(await nodes.count(), 1, "来源类型筛选应只保留来源节点");
    assert.match(await nodes.first().textContent(), /柔佛州文化交流活动报道/);
  });

  await scenario("节点详情完整呈现治理证据且只跳转现有编辑器", {}, async ({ page, calls }) => {
    const graph = await openKnowledgeGraph(page, calls);
    await graph.locator('[data-graph-node][data-node-id="claim-johor"]').click();
    const detail = graph.locator("[data-graph-detail]");
    await detail.waitFor({ state: "visible" });
    const detailText = await detail.innerText();
    for (const expected of [
      "柔佛州文化交流活动报道",
      "2025年2月在柔佛古来举行交流活动",
      "已审核",
      "馆员乙",
      "已授权",
      "本馆数字展览",
    ]) assert.match(detailText, new RegExp(expected), `节点详情缺少：${expected}`);

    const editorLink = detail.getByRole("link", { name: /前往.*编辑器|在.*编辑器.*打开/ });
    assert.equal(await editorLink.count(), 1, "节点详情必须只提供一个前往现有编辑器的链接");
    assert.match(await editorLink.getAttribute("href"), /(?:workspace\.html#(?:content|materials)|content\.html|curation\.html)/, "编辑入口必须指向现有内容或真实素材编辑器");
    assert.equal(await detail.getByRole("button", { name: /编辑|保存|审核|发布|授权/ }).count(), 0, "证据图谱不得伪装成可编辑、审核或发布的工作台");
  });

  await scenario("无图谱权限时显示明确拒绝态", {
    actor: { id: "viewer-graph-qa", role: "viewer", display_name: "只读访客" },
    graphResponse: { status: 403, body: { code: "ADMIN_FORBIDDEN", message: "当前账号无权查看证据图谱" } },
  }, async ({ page, calls }) => {
    const graph = await openKnowledgeGraph(page, calls);
    const alert = graph.getByRole("alert");
    await alert.waitFor({ state: "visible" });
    assert.match(await alert.textContent(), /无权|权限/);
    assert.equal(await graph.locator("[data-graph-node]").count(), 0, "无权限时不得泄露任何图谱节点");
  });

  await scenario("无节点时显示可理解的空态", {
    graphResponse: { status: 200, body: emptyGraphFixture },
  }, async ({ page, calls }) => {
    const graph = await openKnowledgeGraph(page, calls);
    const emptyState = graph.getByText(/暂无.*证据|还没有.*关系|没有可展示.*节点/).first();
    await emptyState.waitFor({ state: "visible" });
    assert.equal(await graph.locator("[data-graph-node]").count(), 0);
  });

  await scenario("服务错误时显示错误态而非空白画布", {
    graphResponse: { status: 500, body: { code: "KNOWLEDGE_GRAPH_UNAVAILABLE", message: "证据图谱暂时不可用" } },
  }, async ({ page, calls }) => {
    const graph = await openKnowledgeGraph(page, calls);
    const alert = graph.getByRole("alert");
    await alert.waitFor({ state: "visible" });
    assert.match(await alert.textContent(), /证据图谱暂时不可用|读取失败|加载失败/);
  });

  await scenario("390px 下图谱与节点详情均无页面级横向溢出", {
    viewport: { width: 390, height: 844 },
  }, async ({ page, calls }) => {
    const graph = await openKnowledgeGraph(page, calls);
    await graph.locator("[data-graph-node]").first().click();
    await graph.locator("[data-graph-detail]").waitFor({ state: "visible" });
    const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
    assert.ok(overflow <= 2, `390px 图谱页面存在 ${overflow}px 横向溢出`);
  });
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

if (failures.length) {
  const details = failures.map((failure, index) => `${index + 1}. ${failure.name}: ${failure.message}`).join("\n");
  throw new assert.AssertionError({ message: `knowledge graph browser regression failed (${failures.length})\n${details}` });
}

console.log("knowledge graph browser regression passed");
