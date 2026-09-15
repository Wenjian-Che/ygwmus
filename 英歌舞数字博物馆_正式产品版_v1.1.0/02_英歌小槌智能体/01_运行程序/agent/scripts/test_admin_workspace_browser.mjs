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
if (!playwright) throw new Error("Playwright is required for the admin workspace browser regression");

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

const siteContent = {
  schema_version: 2,
  version: 4,
  published_version: 4,
  workflow_status: "published",
  draft: {
    hero: { eyebrow: "国家级非物质文化遗产 英歌", titleLine1: "看见英歌，", titleLine2: "也看懂英歌。", body: "从馆内资料认识英歌。", primaryCta: "进入数字展馆" },
    experiences: {
      title: "从这里开始",
      intro: "先看现场，再继续追问。",
      cards: {
        video: { title: "看英歌", description: "观看导览。" },
        h5: { title: "互动特展", description: "互动学习。" },
        agent: { title: "问小槌", description: "依据馆内资料回答。" },
      },
    },
  },
};
siteContent.published = structuredClone(siteContent.draft);

const curationPayload = {
  catalog: { schema_version: 2, version: 1, page_coverage: [], media_assets: [], exhibits: [] },
  summary: { exhibits: { total: 0, published: 0 }, events: { total: 0 }, rights: { pending_authorization: 0 }, public_media: 0 },
  private_media: { connected: false },
};

function createApiState({ authenticated = false, modelSettingsDelayMs = 0 } = {}) {
  return {
    authenticated,
    setupRequired: !authenticated,
    actor: authenticated ? { id: "owner-qa", role: "owner", display_name: "测试管理员" } : null,
    settings: { model: "deepseek-v4-flash", thinking: true, api_key_configured: false },
    modelSettingsDelayMs,
    plans: [{ id: "plan-existing", title: "潮汕英歌特展方案", mode: "展览策划", request: "策划一场特展", answer: "先明确目标观众，再核对资料来源。", citations: [], status: "draft", created_at: "2026-08-30T08:00:00.000Z" }],
    calls: [],
  };
}

function requestBody(request) {
  const raw = request.postData();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return raw; }
}

async function installApiMock(page, state) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    const method = request.method();
    const body = requestBody(request);
    state.calls.push({ method, pathname, body });
    const json = (payload, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(payload) });

    if (method === "GET" && pathname === "/api/admin/auth/status") {
      return json({ setup_required: state.setupRequired, authenticated: state.authenticated, actor: state.actor });
    }
    if (method === "POST" && pathname === "/api/admin/auth/setup") {
      state.authenticated = true;
      state.setupRequired = false;
      state.actor = { id: "owner-qa", role: "owner", display_name: body?.display_name || "测试管理员" };
      return json({ actor: state.actor }, 201);
    }
    if (method === "POST" && pathname === "/api/admin/login") {
      state.authenticated = true;
      state.actor = { id: "owner-qa", role: "owner", display_name: "测试管理员" };
      return json({ actor: state.actor });
    }
    if (method === "POST" && pathname === "/api/admin/logout") {
      state.authenticated = false;
      state.actor = null;
      return json({ ok: true });
    }
    if (method === "GET" && pathname === "/api/admin/session") {
      return state.authenticated ? json({ actor: state.actor }) : json({ code: "ADMIN_AUTH_REQUIRED", message: "请登录管理工作台" }, 401);
    }
    if (method === "GET" && pathname === "/api/health") {
      return json({ ok: true, knowledge_available: true, chunks: 362, chat_mode: "grounded_model" });
    }
    if (pathname === "/api/admin/settings/model" && method === "GET") {
      if (state.modelSettingsDelayMs) await new Promise((resolve) => setTimeout(resolve, state.modelSettingsDelayMs));
      return json(state.settings);
    }
    if (pathname === "/api/admin/settings/model" && method === "PUT") {
      state.settings = { model: body?.model || state.settings.model, thinking: Boolean(body?.thinking), api_key_configured: Boolean(body?.api_key) || state.settings.api_key_configured };
      return json(state.settings);
    }
    if (pathname === "/api/admin/settings/model/test" && method === "POST") return json({ ok: true, status: "connected", model: state.settings.model });
    if (pathname === "/api/admin/site-content" && method === "GET") return json(siteContent);
    if (pathname === "/api/site-content" && method === "GET") return json({ version: siteContent.published_version, ...siteContent.published });
    if (pathname === "/api/admin/curation" && method === "GET") return json(curationPayload);
    if (pathname === "/api/admin/curation/audit" && method === "GET") return json({ entries: [] });
    if (pathname === "/api/exhibits" && method === "GET") return json({ schema_version: 2, exhibits: [] });
    if (pathname === "/api/admin/plans" && method === "GET") return json({ items: state.plans });
    if (pathname === "/api/admin/plans" && method === "POST") {
      const item = { id: `plan-${state.plans.length + 1}`, title: body?.title || "新方案", mode: body?.mode || "项目策划", request: body?.request || "", answer: body?.answer || "", citations: body?.citations || [], status: "draft", created_at: "2026-08-30T09:00:00.000Z" };
      state.plans.unshift(item);
      return json(item, 201);
    }
    if (pathname === "/api/admin/test" && method === "POST") {
      return json({ answer: "建议先明确目标受众，再逐项核对事实、来源与权利状态。", citations: [{ title: "馆内资料", url: "https://example.com/evidence" }] });
    }
    if (pathname === "/api/admin/diagnostics/run" && method === "POST") {
      return json({ status: "healthy", overall: { serving_now: true, knowledge_rebuild_ready: true }, checks: [] });
    }
    if (pathname === "/api/voice/status" && method === "GET") return json({ asr: { available: false }, tts: { available: false }, wake: { available: false } });
    return json({ code: "NOT_FOUND", message: `${method} ${pathname} is not mocked` }, 404);
  });
}

async function waitFor(predicate, message, timeout = 2500) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new assert.AssertionError({ message });
}

const failures = [];
async function scenario(name, options, run) {
  const context = await browser.newContext({ viewport: options.viewport || { width: 1366, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(4000);
  const state = createApiState({ authenticated: options.authenticated, modelSettingsDelayMs: options.modelSettingsDelayMs });
  await installApiMock(page, state);
  try {
    await run({ page, state });
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push({ name, message: error?.message || String(error) });
    console.error(`FAIL ${name}: ${error?.message || error}`);
  } finally {
    await context.close();
  }
}

try {
  await scenario("首次设置后进入工作台", { authenticated: false }, async ({ page, state }) => {
    await page.goto(workspaceUrl, { waitUntil: "domcontentloaded" });
    await page.locator("#authGate").waitFor({ state: "visible" });
    assert.equal(await page.locator("#authGate").isVisible(), true, "首次使用必须显示设置门禁");
    assert.equal(await page.locator("#setupSection").isVisible(), true, "首次使用必须显示管理员创建表单");
    assert.equal(await page.locator("#loginSection").isVisible(), false, "首次使用不应误显示普通登录表单");

    await page.locator("#setupDisplayName").fill("测试管理员");
    await page.locator("#setupUsername").fill("museum-admin");
    await page.locator("#setupPassword").fill("Museum-pass-2026");
    await page.locator("#setupPasswordConfirm").fill("Museum-pass-2026");
    await page.locator("#setupForm button[type='submit']").click();
    await waitFor(() => state.calls.some((call) => call.method === "POST" && call.pathname === "/api/admin/auth/setup"), "首次设置没有提交到 /api/admin/auth/setup");

    const setupCall = state.calls.find((call) => call.method === "POST" && call.pathname === "/api/admin/auth/setup");
    assert.deepEqual(setupCall.body, { display_name: "测试管理员", username: "museum-admin", password: "Museum-pass-2026" });
    await page.waitForFunction(() => document.querySelector("#authGate")?.hidden === true);
    assert.match(await page.locator("#workspaceActor").textContent(), /测试管理员/);
  });

  await scenario("五项导航始终留在单页工作台", { authenticated: true }, async ({ page }) => {
    await page.goto(workspaceUrl, { waitUntil: "domcontentloaded" });
    const nav = page.locator("[data-admin-nav] a");
    assert.deepEqual(await nav.allTextContents(), ["总览", "网站内容", "真实素材", "智能助手", "设置"], "工作台必须只有五个一级区域");
    const hrefs = await nav.evaluateAll((links) => links.map((link) => link.getAttribute("href") || ""));
    assert.ok(hrefs.every((href) => /^(?:workspace\.html)?#(?:overview|content|materials|assistant|settings)$/.test(href)), `一级导航不得跳到独立后台页面：${hrefs.join(", ")}`);

    const panels = ["overview", "content", "materials", "assistant", "settings"];
    for (let index = 0; index < panels.length; index += 1) {
      await nav.nth(index).click();
      await page.waitForTimeout(30);
      assert.equal(new URL(page.url()).pathname, "/admin/workspace.html", `点击 ${panels[index]} 后离开了单页工作台`);
      assert.equal(await page.locator(`.workspace-panel[data-workspace-panel="${panels[index]}"]`).isVisible(), true, `${panels[index]} 面板没有显示`);
      assert.equal(await page.locator(".workspace-panel.is-active").count(), 1, "同一时间只能显示一个一级工作区");
    }
  });

  await scenario("模型设置保存后清空密钥且不回显", { authenticated: true, modelSettingsDelayMs: 140 }, async ({ page, state }) => {
    const apiKey = "sk-browser-regression-only";
    await page.goto(`${workspaceUrl}#settings`, { waitUntil: "domcontentloaded" });
    await waitFor(() => state.calls.some((call) => call.method === "GET" && call.pathname === "/api/admin/settings/model"), "模型设置初始化请求没有开始");
    await page.locator("#deepseekApiKey").fill(apiKey);
    await page.locator("#deepseekModel").selectOption("deepseek-v4-pro");
    await page.waitForTimeout(180);
    assert.equal(await page.locator("#deepseekApiKey").inputValue(), apiKey, "后台设置初始化不应清空管理员正在输入的 API Key");
    await page.locator("#modelSettingsForm button[type='submit']").click();
    await waitFor(() => state.calls.some((call) => call.method === "PUT" && call.pathname === "/api/admin/settings/model"), "模型设置没有通过 PUT /api/admin/settings/model 保存");

    const saveCall = state.calls.find((call) => call.method === "PUT" && call.pathname === "/api/admin/settings/model");
    assert.equal(saveCall.body.api_key, apiKey, "保存请求没有包含用户本次输入的密钥");
    await page.waitForFunction(() => document.querySelector("#deepseekApiKey")?.value === "");
    assert.equal(await page.locator("#deepseekApiKey").inputValue(), "", "保存成功后必须清空 API Key 输入框");
    assert.doesNotMatch(await page.locator("body").innerText(), new RegExp(apiKey), "页面不得回显 API Key");
    assert.doesNotMatch(page.url(), new RegExp(apiKey), "API Key 不得进入地址栏");
    assert.match(await page.locator("#modelSettingsResult").textContent(), /已保存|保存成功|已配置/);
  });

  await scenario("助手与方案历史在同一工作区协作", { authenticated: true }, async ({ page, state }) => {
    await page.goto(`${workspaceUrl}#assistant`, { waitUntil: "domcontentloaded" });
    assert.equal(new URL(page.url()).pathname, "/admin/workspace.html");
    assert.equal(await page.locator("#workspaceAssistantForm").isVisible(), true, "助手表单没有显示在工作台中");
    assert.equal(await page.locator("#planHistory").isVisible(), true, "方案历史没有与助手同页显示");
    await page.waitForFunction(() => document.querySelector("#planHistory")?.textContent.includes("潮汕英歌特展方案"));

    await page.locator("#workspaceAssistantInput").fill("请给出一份展览策划提纲");
    await page.locator("#workspaceAssistantForm button[type='submit']").click();
    await waitFor(() => state.calls.some((call) => call.method === "POST" && call.pathname === "/api/admin/test"), "助手没有调用 /api/admin/test");
    await page.waitForFunction(() => document.querySelector("#workspaceChatStream")?.textContent.includes("建议先明确目标受众"));
    assert.equal(new URL(page.url()).pathname, "/admin/workspace.html", "提交助手问题后不应跳到独立助手页");
    assert.equal(await page.locator("#planHistory").isVisible(), true, "回答完成后方案历史必须仍在同页可见");
  });

  await scenario("手机端所有一级工作区无横向溢出", { authenticated: true, viewport: { width: 390, height: 844 } }, async ({ page }) => {
    await page.goto(workspaceUrl, { waitUntil: "domcontentloaded" });
    const labels = ["总览", "网站内容", "真实素材", "智能助手", "设置"];
    for (const label of labels) {
      const toggle = page.locator("[data-admin-menu-toggle]");
      if (await toggle.isVisible() && await toggle.getAttribute("aria-expanded") !== "true") await toggle.click();
      await page.locator("[data-admin-nav] a", { hasText: label }).click();
      await page.waitForTimeout(30);
      const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
      assert.ok(overflow <= 2, `${label} 手机端存在 ${overflow}px 横向溢出`);
      assert.equal(new URL(page.url()).pathname, "/admin/workspace.html", `${label} 手机端跳出了工作台`);
    }
  });
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

if (failures.length) {
  const details = failures.map((failure, index) => `${index + 1}. ${failure.name}: ${failure.message}`).join("\n");
  throw new assert.AssertionError({ message: `admin workspace browser regression failed (${failures.length})\n${details}` });
}

console.log("admin workspace browser regression passed");
