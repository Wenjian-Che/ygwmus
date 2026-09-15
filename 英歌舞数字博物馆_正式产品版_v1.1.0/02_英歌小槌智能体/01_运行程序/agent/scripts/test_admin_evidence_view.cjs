const { chromium } = require("C:/Users/20549/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const { DatabaseSync } = require("node:sqlite");

const messageId = "wp04-browser-evidence";
const db = new DatabaseSync("backend/yingge.sqlite");
db.prepare("DELETE FROM chat_interactions WHERE message_id = ?").run(messageId);
db.prepare("DELETE FROM evidence_audits WHERE message_id = ?").run(messageId);
db.prepare("INSERT INTO chat_interactions (message_id, app_id, question, answer, intent, quality, citation_count, citation_files, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
  .run(messageId, "yingge-h5", "英歌为什么要敲槌？", "槌击可以承担动作与节奏之间的时间标记。", "movement", "limited", 1, JSON.stringify(["56_锣鼓动作队形协同机制.md"]), "needs_review", new Date().toISOString());

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", args: ["--no-sandbox"] });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error" && !message.text().includes("Failed to load resource")) errors.push(message.text()); });
  await page.goto("http://127.0.0.1:8080/admin-answer-revisions.html", { waitUntil: "networkidle" });
  await page.waitForSelector(`[data-id="${messageId}"]`, { timeout: 10000 });
  await page.click(`[data-id="${messageId}"]`);
  await page.click("[data-audit]");
  await page.waitForSelector(".evidence-audit .audit-row", { timeout: 10000 });
  const desktopRows = await page.locator(".evidence-audit .audit-row").count();
  const directText = await page.locator(".evidence-audit").innerText();
  await page.screenshot({ path: "web/audit-evidence-view-desktop.png", fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobile.on("pageerror", (error) => errors.push(error.message));
  mobile.on("console", (message) => { if (message.type() === "error" && !message.text().includes("Failed to load resource")) errors.push(message.text()); });
  await mobile.goto("http://127.0.0.1:8080/admin-answer-revisions.html", { waitUntil: "networkidle" });
  await mobile.waitForSelector(`[data-id="${messageId}"]`, { timeout: 10000 });
  await mobile.click(`[data-id="${messageId}"]`);
  await mobile.waitForSelector(".evidence-audit", { timeout: 10000 });
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await mobile.screenshot({ path: "web/audit-evidence-view-mobile.png", fullPage: true });
  console.log(JSON.stringify({ status: errors.length || !desktopRows || !directText.includes("直接支持") || overflow > 1 ? "fail" : "pass", desktop_rows: desktopRows, direct_support_visible: directText.includes("直接支持"), mobile_overflow_px: overflow, errors }, null, 2));
  await browser.close();
})().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => {
    db.prepare("DELETE FROM chat_interactions WHERE message_id = ?").run(messageId);
    db.prepare("DELETE FROM evidence_audits WHERE message_id = ?").run(messageId);
    db.close();
  });
