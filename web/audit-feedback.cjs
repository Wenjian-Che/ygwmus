const { chromium } = require("C:/Users/20549/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", args: ["--no-sandbox"] });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.setItem("yingge-admin-config", JSON.stringify({ apiBase: "http://127.0.0.1:8787", appId: "yingge-h5", model: "deepseek-v4-flash", thinking: false, enabled: true })));
  await page.reload({ waitUntil: "networkidle" });
  await page.click("[data-open-agent]");
  await page.fill("#chat-input", "英歌是不是联合国教科文组织非遗？");
  await page.press("#chat-input", "Enter");
  const feedback = page.locator(".message.assistant .answer-feedback").last();
  await feedback.waitFor({ state: "visible", timeout: 60000 });
  const messageId = await feedback.getAttribute("data-message-id");
  await feedback.locator('[data-feedback-rating="up"]').click();
  await page.waitForTimeout(500);
  const feedbackText = await feedback.innerText();

  await page.goto("http://127.0.0.1:8080/admin-feedback.html", { waitUntil: "networkidle" });
  await page.selectOption("#feedback-filter", "all");
  await page.waitForFunction((id) => document.querySelector(`[data-message-id="${id}"]`), messageId, { timeout: 10000 });
  await page.click("#cluster-run");
  await page.waitForFunction(() => document.querySelectorAll(".cluster-item").length > 0, null, { timeout: 10000 });
  await page.screenshot({ path: "web/audit-feedback-desktop.png", fullPage: true });
  const cardCount = await page.locator(".feedback-item").count();
  const clusterCount = await page.locator(".cluster-item").count();
  const clusterSummary = await page.locator("#cluster-summary").innerText();
  const metrics = await page.locator("#feedback-metrics").innerText();
  await page.evaluate(async (id) => { await fetch("http://127.0.0.1:8787/api/admin/feedback/delete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message_id: id }) }); }, messageId);
  await page.evaluate(async () => { await fetch("http://127.0.0.1:8787/api/admin/feedback/clusters/run", { method: "POST" }); });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobile.on("pageerror", (error) => errors.push(error.message));
  await mobile.goto("http://127.0.0.1:8080/admin-feedback.html", { waitUntil: "networkidle" });
  await mobile.screenshot({ path: "web/audit-feedback-mobile.png", fullPage: true });
  console.log(JSON.stringify({ message_id_created: Boolean(messageId), feedback_text: feedbackText, admin_card_count: cardCount, cluster_count: clusterCount, cluster_summary: clusterSummary, metrics, errors }, null, 2));
  await browser.close();
})().catch((error) => { console.error(error); process.exitCode = 1; });
