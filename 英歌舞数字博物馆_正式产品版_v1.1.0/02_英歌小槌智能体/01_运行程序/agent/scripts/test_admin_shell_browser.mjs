import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const candidates = [process.env.CODEX_PLAYWRIGHT_PATH, "playwright", path.join(process.env.USERPROFILE || "", ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright")].filter(Boolean);
let playwright;
for (const candidate of candidates) { try { playwright = require(candidate); break; } catch {} }
if (!playwright) throw new Error("Playwright is required for the unified admin shell regression");

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "01_公众网站");
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2", ".json": "application/json" };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const target = path.resolve(webRoot, relative);
  if (!target.startsWith(`${webRoot}${path.sep}`) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) { response.writeHead(404); return response.end("not found"); }
  response.writeHead(200, { "content-type": mime[path.extname(target).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(target).pipe(response);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;

const browserExecutables = [process.env.PLAYWRIGHT_BROWSER_EXECUTABLE, "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"].filter(Boolean);
const executablePath = browserExecutables.find((candidate) => fs.existsSync(candidate));
const browser = await playwright.chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });

const navLabels = ["总览", "网站内容", "真实素材", "智能助手", "知识反馈", "设置"];
const pages = [
  { key: "overview", file: "index.html", selector: "#metricGrid" },
  { key: "content", file: "content.html", selector: "#contentForm" },
  { key: "curation", file: "curation.html#audit", selector: "#chapterList" },
  { key: "assistant", file: "assistant.html", selector: "#assistantForm" },
  { key: "plans", file: "plans.html", selector: "#planList" },
];

async function mockApi(page) {
  await page.route("http://127.0.0.1:8787/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const json = (payload, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(payload) });
    if (pathname === "/api/health") return json({ ok: true, chat_mode: "grounded_model", knowledge_available: true });
    if (pathname === "/api/admin/session") return json({ code: "ADMIN_NOT_CONFIGURED", message: "not configured" }, 503);
    if (pathname === "/api/admin/config") return json({ knowledge_version: "qa" });
    if (pathname === "/api/admin/metrics") return json({ summary: {} });
    if (pathname === "/api/admin/feedback") return json({ items: [], metrics: {} });
    if (pathname === "/api/admin/feedback/clusters") return json({ clusters: [] });
    if (pathname === "/api/admin/unanswered") return json({ items: [] });
    if (pathname === "/api/admin/knowledge-tasks") return json({ items: [] });
    if (pathname === "/api/admin/evaluation/readiness") return json({ status: "ready", label: "可服务", checks: [] });
    if (pathname === "/api/admin/evaluation") return json({ recall_at_6: 1 });
    if (pathname === "/api/admin/plans") return json({ items: [] });
    return json({ code: "ADMIN_NOT_CONFIGURED", message: "not configured" }, 503);
  });
}

try {
  const widths = [];
  for (const item of pages) {
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await mockApi(page);
    await page.goto(`http://127.0.0.1:${port}/admin/${item.file}`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-admin-nav] a");

    assert.deepEqual(await page.locator("[data-admin-nav] a").allTextContents(), navLabels, `${item.file} 主导航不一致`);
    assert.equal(await page.locator("[data-admin-nav] [aria-current='page']").count(), 1, `${item.file} 当前栏目必须唯一`);
    assert.equal(await page.locator("[data-admin-nav] [aria-current='page']").getAttribute("data-admin-nav-key"), item.key);
    assert.equal(await page.locator("[data-admin-sidebar]").count(), 1);
    assert.equal(await page.locator(".admin-rail,.content-rail,.assistant-sidebar,.ops-rail,.plans-rail").count(), 0);
    assert.match(await page.locator("[data-admin-brand]").innerText(), /英歌舞数字博物馆\s*运营工作台/);
    assert.equal(await page.locator("[data-admin-identity]").count(), 1);
    assert.equal(await page.locator("[data-admin-status]").count(), 1);
    await page.waitForFunction(() => document.querySelector("[data-admin-status]")?.textContent === "知识服务已连接");
    assert.equal(await page.locator(item.selector).count(), 1, `${item.file} 业务工作区被统一壳破坏`);
    assert.deepEqual(errors, [], `${item.file} page errors: ${errors.join("; ")}`);

    const sidebarBox = await page.locator("[data-admin-sidebar]").boundingBox();
    widths.push(Math.round(sidebarBox.width));
    assert.equal(await page.locator("[data-admin-menu-toggle]").isVisible(), false);

    if (item.key === "curation") {
      assert.equal(await page.locator("[data-admin-section-nav]").evaluate((node) => Boolean(node.closest("[data-admin-main]"))), true);
      assert.equal(await page.locator("[data-admin-section-nav] [aria-current='location']").count(), 1);
      assert.equal(await page.locator("[data-admin-section-nav] [aria-current='location']").getAttribute("href"), "#audit");
    }
    if (item.key === "assistant") {
      assert.equal(await page.locator("#conversationList").evaluate((node) => Boolean(node.closest("[data-admin-main]"))), true);
      assert.equal(await page.locator("#conversationList .conversation").count(), 1, "不得保留不可点击的伪造最近对话");
    }
    if (process.env.ADMIN_SHELL_SCREENSHOTS_DIR) {
      fs.mkdirSync(process.env.ADMIN_SHELL_SCREENSHOTS_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.ADMIN_SHELL_SCREENSHOTS_DIR, `${item.key}.png`), fullPage: false });
    }
    await context.close();
  }
  assert.equal(new Set(widths).size, 1, `桌面侧栏宽度不一致：${widths.join(", ")}`);

  const statusContext = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  const statusPage = await statusContext.newPage();
  await statusPage.route("http://127.0.0.1:8787/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const response = pathname === "/api/health"
      ? { status: 200, body: { ok: true, chat_mode: "grounded_model", knowledge_available: true } }
      : { status: 503, body: { code: "ADMIN_NOT_CONFIGURED", message: "not configured" } };
    await route.fulfill({ status: response.status, contentType: "application/json", body: JSON.stringify(response.body) });
  });
  await statusPage.goto(`http://127.0.0.1:${port}/admin/index.html`, { waitUntil: "networkidle" });
  assert.equal(await statusPage.locator("[data-admin-status]").textContent(), "知识服务已连接", "管理凭据缺失不能被误报成知识服务离线");
  assert.equal(await statusPage.locator("[data-admin-actor]").textContent(), "未连接");
  await statusContext.close();

  const contentFailureContext = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  await contentFailureContext.addInitScript(() => sessionStorage.setItem("yingge-admin-token", "reviewer-token"));
  const contentFailurePage = await contentFailureContext.newPage();
  await contentFailurePage.route("http://127.0.0.1:8787/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const response = pathname === "/api/health"
      ? { status: 200, body: { ok: true, chat_mode: "grounded_model", knowledge_available: true } }
      : pathname === "/api/admin/session"
        ? { status: 200, body: { actor: { id: "reviewer-qa", role: "reviewer" } } }
        : { status: 500, body: { code: "SITE_CONTENT_READ_FAILED", message: "content unavailable" } };
    await route.fulfill({ status: response.status, contentType: "application/json", body: JSON.stringify(response.body) });
  });
  await contentFailurePage.goto(`http://127.0.0.1:${port}/admin/content.html`, { waitUntil: "networkidle" });
  assert.equal(await contentFailurePage.locator("[data-admin-actor]").textContent(), "内容审核 · reviewer-qa", "内容读取失败不能覆盖已认证身份");
  assert.equal(await contentFailurePage.locator("[data-admin-status]").textContent(), "知识服务已连接");
  await contentFailureContext.close();

  for (const item of pages) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await mockApi(page);
    await page.goto(`http://127.0.0.1:${port}/admin/${item.file}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-admin-menu-toggle]");
    assert.equal(await page.locator("[data-admin-mobile-bar]").isVisible(), true);
    assert.equal(await page.locator("[data-admin-menu-toggle]").isVisible(), true);
    assert.equal(await page.locator("[data-admin-drawer]").getAttribute("aria-hidden"), "true");
    assert.equal(await page.locator("[data-admin-drawer]").evaluate((node) => node.inert), true, "关闭的手机菜单不得进入键盘焦点顺序");
    await page.locator("[data-admin-menu-toggle]").click();
    assert.equal(await page.locator("[data-admin-menu-toggle]").getAttribute("aria-expanded"), "true");
    assert.equal(await page.locator("[data-admin-drawer]").getAttribute("aria-hidden"), "false");
    assert.equal(await page.locator("[data-admin-drawer]").evaluate((node) => node.inert), false);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("[data-admin-menu-toggle]").getAttribute("aria-expanded"), "false");
    assert.equal(await page.locator("[data-admin-drawer]").getAttribute("aria-hidden"), "true");
    assert.equal(await page.locator("[data-admin-drawer]").evaluate((node) => node.inert), true);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 2, `${item.file} 手机端存在 ${overflow}px 横向溢出`);
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

console.log("admin unified shell browser regression passed");
