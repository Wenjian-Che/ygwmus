import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const candidates = [process.env.CODEX_PLAYWRIGHT_PATH, "playwright", path.join(process.env.USERPROFILE || "", ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright")].filter(Boolean);
let playwright;
for (const candidate of candidates) { try { playwright = require(candidate); break; } catch {} }
if (!playwright) throw new Error("Playwright is required for the admin operations browser regression");

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "01_公众网站");
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2", ".mp4": "video/mp4", ".json": "application/json" };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const target = path.resolve(webRoot, relative);
  if (!target.startsWith(`${webRoot}${path.sep}`) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) { response.writeHead(404); return response.end("not found"); }
  response.writeHead(200, { "content-type": mime[path.extname(target).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(target).pipe(response);
});
await new Promise((resolve) => server.listen(8099, "127.0.0.1", resolve));

const initialContent = {
  hero: { eyebrow: "国家级非物质文化遗产 英歌", titleLine1: "看见英歌，", titleLine2: "也看懂英歌。", body: "影像、互动与知识档案，共同解释动作、阵法、人物和地方传承。", primaryCta: "进入数字展馆" },
  experiences: { title: "从这里开始", intro: "先看现场，再带着问题继续参观。", cards: { video: { title: "看英歌", description: "从现场照片进入整体观察。" }, h5: { title: "互动特展", description: "专题展馆" }, agent: { title: "问小槌", description: "围绕当前展品继续追问。" } } },
};

const browserExecutables = [process.env.PLAYWRIGHT_BROWSER_EXECUTABLE, "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"].filter(Boolean);
const executablePath = browserExecutables.find((candidate) => fs.existsSync(candidate));
const browser = await playwright.chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });

async function mockApi(page, role = "author") {
  let state = { schema_version: 2, version: 1, published_version: 1, workflow_status: role === "publisher" ? "draft" : "published", draft: structuredClone(initialContent), published: structuredClone(initialContent), draft_editor: role === "publisher" ? { id: "author-a", role: "author" } : null };
  const calls = [];
  await page.route("http://127.0.0.1:8787/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    calls.push(`${request.method()} ${url.pathname}`);
    const json = (payload, status = 200) => route.fulfill({
      status,
      contentType: "application/json",
      headers: {
        "access-control-allow-origin": request.headers().origin || "http://127.0.0.1:8099",
        "access-control-allow-credentials": "true",
      },
      body: JSON.stringify(payload),
    });
    if (url.pathname === "/api/admin/session") return json({ actor: { id: `${role}-qa`, role } });
    if (url.pathname === "/api/admin/site-content" && request.method() === "GET") return json(state);
    if (url.pathname === "/api/admin/site-content/preview") return json({ version: state.version, content: JSON.parse(request.postData() || "{}").content });
    if (url.pathname === "/api/admin/site-content/draft") { const body = JSON.parse(request.postData() || "{}"); state = { ...state, version: state.version + 1, workflow_status: "draft", draft: body.content, draft_editor: { id: "author-qa", role: "author" } }; return json(state); }
    if (url.pathname === "/api/admin/site-content/publish") { state = { ...state, version: state.version + 1, published_version: state.version + 1, workflow_status: "published", published: state.draft }; return json(state); }
    if (url.pathname === "/api/admin/diagnostics/run") return json({ mode: "safe_offline", status: "degraded", overall: { serving_now: true, knowledge_rebuild_ready: false }, checks: [
      { id: "runtime_service", layer: "service", status: "pass", blocking: true, summary: "运行时已加载", metrics: { chunks: 362 }, remediation: "" },
      { id: "knowledge_source", layer: "knowledge", status: "warning", blocking: false, summary: "知识源缺失，当前索引仍可服务", metrics: {}, remediation: "恢复受治理知识源" },
      { id: "retrieval_probe", layer: "retrieval", status: "pass", blocking: true, summary: "固定问题命中", metrics: { hits: 6 }, remediation: "" },
    ], live_probe: { requested: false, status: "skipped", billable: false } });
    if (url.pathname === "/api/site-content") return json({ version: state.published_version, ...state.published });
    if (url.pathname === "/api/health") return json({ ok: true, chunks: 362, knowledge_available: true });
    if (url.pathname === "/api/voice/status") return json({ asr: { available: false }, tts: { available: false }, wake: { available: false } });
    return json({ code: "NOT_FOUND" }, 404);
  });
  return calls;
}

try {
  for (const viewport of [{ name: "desktop", width: 1440, height: 960 }, { name: "mobile", width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
    await context.addInitScript(() => sessionStorage.setItem("yingge-admin-token", "author-secret"));
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const calls = await mockApi(page, "author");
    await page.goto("http://127.0.0.1:8099/admin/content.html?embedded=1", { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.querySelector("#actorState")?.textContent.includes("内容编辑"));
    await page.waitForFunction(() => document.querySelector("#saveState")?.textContent.includes("已读取当前公众版本"));
    await page.frameLocator("#previewFrame").locator(".guide-reset").waitFor({ state: "attached", timeout: 10_000 });
    assert.equal(await page.locator("#saveDraft").isDisabled(), true, "未修改时不应允许保存空操作");
    await page.locator('[name="hero.titleLine1"]').fill("从一声锣鼓，");
    assert.equal(await page.locator("#saveDraft").isEnabled(), true);
    const previewTitle = page.frameLocator("#previewFrame").locator(".hero h1 span").first();
    await assert.doesNotReject(() => previewTitle.waitFor({ state: "attached", timeout: 5000 }));
    await page.waitForFunction((expectedTitle) => {
      const preview = document.querySelector("#previewFrame");
      return preview?.contentDocument?.querySelector(".hero h1 span")?.textContent?.trim() === expectedTitle;
    }, "从一声锣鼓，");
    assert.equal((await previewTitle.textContent()).trim(), "从一声锣鼓，", "输入应通过 postMessage 即时更新预览");
    await page.locator("#saveDraft").click();
    await page.waitForFunction(() => document.querySelector("#saveState")?.textContent.includes("草稿已保存"));
    assert.ok(calls.includes("PUT /api/admin/site-content/draft"));
    await page.locator('[data-inspector="diagnostics"]').click();
    await page.locator("#runDiagnostics").click();
    await page.waitForFunction(() => document.querySelector("#diagnosticSummary strong")?.textContent.includes("维护缺口"));
    assert.ok(calls.includes("POST /api/admin/diagnostics/run"));
    assert.match(await page.locator("#diagnosticSummary").textContent(), /现在可以回答/);
    assert.match(await page.locator("#diagnosticChecks").textContent(), /知识源与重建/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 2, `${viewport.name} 后台存在 ${overflow}px 横向溢出`);
    assert.deepEqual(pageErrors, [], `${viewport.name} page errors: ${pageErrors.join("; ")}`);
    if (viewport.name === "desktop") {
      const screenshot = path.join(os.tmpdir(), "yingge-admin-operations.png");
      await page.screenshot({ path: screenshot, fullPage: true });
      assert.ok(fs.statSync(screenshot).size > 20_000);
    }
    await context.close();
  }

  const publisherContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await publisherContext.addInitScript(() => sessionStorage.setItem("yingge-admin-token", "publisher-secret"));
  const publisherPage = await publisherContext.newPage();
  await mockApi(publisherPage, "publisher");
  await publisherPage.goto("http://127.0.0.1:8099/admin/content.html?embedded=1", { waitUntil: "networkidle" });
  await publisherPage.waitForFunction(() => document.querySelector("#actorState")?.textContent.includes("内容发布"));
  assert.equal(await publisherPage.locator('[name="hero.titleLine1"]').isDisabled(), true, "发布者应复核而不是改写作者草稿");
  assert.equal(await publisherPage.locator("#publishContent").isEnabled(), true);
  await publisherContext.close();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

console.log("admin visual editor and diagnostics browser regression passed");
