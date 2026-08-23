const { chromium } = require("C:/Users/20549/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

(async () => {
  const browser = await chromium.launch({ headless:true, executablePath:"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", args:["--no-sandbox"] });
  const errors = [];
  const page = await browser.newPage({ viewport:{ width:1440, height:1050 } });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("http://127.0.0.1:8080/", { waitUntil:"networkidle" });
  await page.evaluate(() => localStorage.setItem("yingge-admin-config", JSON.stringify({ apiBase:"http://127.0.0.1:8787", appId:"yingge-h5", model:"deepseek-v4-flash", thinking:false, enabled:true })));
  await page.reload({ waitUntil:"networkidle" });
  await page.click("[data-open-agent]");
  await page.fill("#chat-input", "英歌为什么要敲槌？");
  await page.press("#chat-input", "Enter");
  const feedback = page.locator(".message.assistant .answer-feedback").last();
  await feedback.waitFor({ state:"visible", timeout:60000 });
  const messageId = await feedback.getAttribute("data-message-id");
  await feedback.locator('[data-feedback-rating="down"]').click();
  await feedback.locator('[data-feedback-reason="答非所问"]').click();
  await page.goto("http://127.0.0.1:8080/admin-answer-revisions.html", { waitUntil:"networkidle" });
  await page.waitForFunction((id) => document.querySelector(`[data-id="${id}"]`), messageId, { timeout:10000 });
  const riskBefore = await page.locator(".risk-score b").innerText();
  await page.click("[data-generate]");
  await page.waitForFunction(() => document.querySelector(".answer-box.draft .answer-body")?.textContent.trim().length > 80, null, { timeout:60000 });
  const draftChars = (await page.locator(".answer-box.draft .answer-body").innerText()).length;
  const draftRisk = await page.locator(".answer-box.draft .answer-label span").last().innerText();
  await page.click("[data-open-golden]");
  const goldenOpen = await page.locator("#revision-golden-dialog").evaluate((node) => node.open);
  await page.click("#golden-cancel");
  await page.screenshot({ path:"web/audit-answer-revisions-desktop.png", fullPage:true });

  const mobile = await browser.newPage({ viewport:{ width:390, height:844 } });
  mobile.on("pageerror", (error) => errors.push(error.message));
  mobile.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await mobile.goto("http://127.0.0.1:8080/admin-answer-revisions.html", { waitUntil:"networkidle" });
  await mobile.screenshot({ path:"web/audit-answer-revisions-mobile.png", fullPage:true });

  await page.evaluate(async (id) => { await fetch("http://127.0.0.1:8787/api/admin/feedback/delete", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ message_id:id }) }); }, messageId);
  await page.evaluate(async () => { await fetch("http://127.0.0.1:8787/api/admin/feedback/clusters/run", { method:"POST" }); });
  console.log(JSON.stringify({ message_id_created:Boolean(messageId), risk_before:riskBefore, draft_chars:draftChars, draft_risk:draftRisk, golden_dialog_opened:goldenOpen, errors }, null, 2));
  await browser.close();
})().catch((error) => { console.error(error); process.exitCode = 1; });
