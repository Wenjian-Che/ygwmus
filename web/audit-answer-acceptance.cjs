const { chromium } = require("C:/Users/20549/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

(async () => {
  const browser = await chromium.launch({ headless:true, executablePath:"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", args:["--no-sandbox"] });
  const errors = [];
  const page = await browser.newPage({ viewport:{ width:1440, height:1000 } });
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
  await feedback.locator('[data-feedback-reason="不够详细"]').click();

  await page.goto("http://127.0.0.1:8080/admin-answer-revisions.html", { waitUntil:"networkidle" });
  await page.waitForFunction((id) => document.querySelector(`[data-id="${id}"]`), messageId, { timeout:10000 });
  await page.evaluate(() => openGolden(revisionItems[0], { draft_answer:revisionItems[0].original_answer }));
  await page.fill("#golden-answer", `敲槌主要作用是把舞者动作、锣鼓节奏和队伍变化组织进同一时间框架。\n\n${await page.inputValue("#golden-answer")}`);
  await page.fill("#golden-aliases", "英歌敲木槌有什么作用？\n英歌舞者为什么拿槌？");
  await page.fill("#golden-direct", "完全不存在的开头词");
  await page.fill("#golden-must", "完全不存在的事实词");
  await page.click("#golden-validate");
  await page.waitForFunction(() => document.querySelector("#golden-gate-report .gate-score")?.textContent.includes("未通过"), null, { timeout:20000 });
  const rejectedScore = await page.locator("#golden-gate-report .gate-score b").innerText();
  const lockedAfterReject = await page.locator("#golden-submit").isDisabled();

  await page.fill("#golden-direct", "敲槌");
  await page.fill("#golden-must", "敲槌");
  await page.uncheck("#golden-boundary");
  await page.click("#golden-validate");
  await page.waitForFunction(() => !document.querySelector("#golden-validate")?.disabled, null, { timeout:20000 });
  const gateText = await page.locator("#golden-gate-report").innerText();
  if (!gateText.includes("已解除")) throw new Error(`修正后仍未通过：${gateText}`);
  const acceptedScore = await page.locator("#golden-gate-report .gate-score b").innerText();
  const unlockedAfterPass = !(await page.locator("#golden-submit").isDisabled());
  await page.screenshot({ path:"web/audit-answer-acceptance.png", fullPage:true });

  await page.fill("#golden-answer", `${await page.inputValue("#golden-answer")} `);
  const relockedAfterEdit = await page.locator("#golden-submit").isDisabled();
  const bypass = await page.evaluate(async (id) => {
    const response = await fetch("http://127.0.0.1:8787/api/admin/feedback/promote-golden", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ message_id:id, question:"英歌为什么要敲槌？", approved_answer:"直接回答：为了热闹。", aliases:"问法一\n问法二", direct_terms:"为了", must_terms:"节奏", forbidden_terms:"为了热闹", source_files:"missing.md", require_boundary:true }) });
    const data = await response.json(); return { status:response.status, gate_passed:data.gate?.passed, message:data.message };
  }, messageId);
  await page.evaluate(async (id) => { await fetch("http://127.0.0.1:8787/api/admin/feedback/delete", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ message_id:id }) }); }, messageId);
  await page.evaluate(async () => { await fetch("http://127.0.0.1:8787/api/admin/feedback/clusters/run", { method:"POST" }); });
  const unexpectedErrors = errors.filter((message) => !message.includes("400 (Bad Request)"));
  console.log(JSON.stringify({ rejected_score:rejectedScore, locked_after_reject:lockedAfterReject, accepted_score:acceptedScore, unlocked_after_pass:unlockedAfterPass, relocked_after_edit:relockedAfterEdit, server_bypass_block:bypass, errors:unexpectedErrors }, null, 2));
  await browser.close();
})().catch((error) => { console.error(error); process.exitCode = 1; });
