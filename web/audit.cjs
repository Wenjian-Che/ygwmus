const { chromium } = require("C:/Users/20549/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    args: ["--no-sandbox", "--enable-webgl", "--use-angle=swiftshader"]
  });
  const errors = [];
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  desktop.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  desktop.on("pageerror", (error) => errors.push(error.message));
  await desktop.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await desktop.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 45));
    }
    window.scrollTo(0, 0);
  });
  await desktop.screenshot({ path: "web/desktop-preview.png", fullPage: true });
  await desktop.click("[data-open-agent]");
  await desktop.fill("#chat-input", "英歌一定要108个人吗？");
  await desktop.press("#chat-input", "Enter");
  await desktop.waitForTimeout(1200);
  const answer = await desktop.locator(".message.assistant").last().innerText();
  await desktop.fill("#chat-input", "英歌锣鼓如何指挥动作和队形？");
  await desktop.press("#chat-input", "Enter");
  await desktop.waitForTimeout(1200);
  const detailedAnswer = await desktop.locator(".message.assistant").last().innerText();
  await desktop.fill("#chat-input", "舞台剧里的英歌和传统巡游有什么区别？");
  await desktop.press("#chat-input", "Enter");
  await desktop.waitForTimeout(1200);
  const adaptationAnswer = await desktop.locator(".message.assistant").last().innerText();
  const adaptationSources = await desktop.locator(".message.assistant").last().locator(".sources strong").allTextContents();
  await desktop.fill("#chat-input", "西门女子英歌队到底成立于1952年还是2011年？");
  await desktop.press("#chat-input", "Enter");
  await desktop.waitForTimeout(1200);
  const ximenConflictAnswer = await desktop.locator(".message.assistant").last().innerText();
  const ximenConflictSources = await desktop.locator(".message.assistant").last().locator(".sources strong").allTextContents();
  await desktop.fill("#chat-input", "甲子英歌动作变化前八拍吆喝是谁领喊、谁回应？");
  await desktop.press("#chat-input", "Enter");
  await desktop.waitForTimeout(1200);
  const eightBeatAnswer = await desktop.locator(".message.assistant").last().innerText();
  const eightBeatSources = await desktop.locator(".message.assistant").last().locator(".sources strong").allTextContents();
  await desktop.fill("#chat-input", "如何给英歌视频做动作、鼓点和队形的时间码标注？");
  await desktop.press("#chat-input", "Enter");
  await desktop.waitForTimeout(1200);
  const timecodeAnswer = await desktop.locator(".message.assistant").last().innerText();
  const timecodeSources = await desktop.locator(".message.assistant").last().locator(".sources strong").allTextContents();
  await desktop.fill("#chat-input", "剪辑变速又替换配乐的英歌视频能分析鼓点吗？");
  await desktop.press("#chat-input", "Enter");
  await desktop.waitForTimeout(1200);
  const videoEvidenceAnswer = await desktop.locator(".message.assistant").last().innerText();
  const videoEvidenceSources = await desktop.locator(".message.assistant").last().locator(".sources strong").allTextContents();
  await desktop.fill("#chat-input", "后溪英歌队是什么板式，有哪些阵法？");
  await desktop.press("#chat-input", "Enter");
  await desktop.waitForTimeout(1200);
  const houxiAnswer = await desktop.locator(".message.assistant").last().innerText();
  const houxiSources = await desktop.locator(".message.assistant").last().locator(".sources strong").allTextContents();
  await desktop.fill("#chat-input", "英歌有哪些国家级代表性传承人？");
  await desktop.press("#chat-input", "Enter");
  await desktop.waitForTimeout(1200);
  const inheritorAnswer = await desktop.locator(".message.assistant").last().innerText();
  const inheritorSources = await desktop.locator(".message.assistant").last().locator(".sources strong").allTextContents();
  await desktop.fill("#chat-input", "林忠诚是第几批国家级传承人，他的编号是多少？");
  await desktop.press("#chat-input", "Enter");
  await desktop.waitForTimeout(1200);
  const linZhongchengAnswer = await desktop.locator(".message.assistant").last().innerText();
  const linZhongchengSources = await desktop.locator(".message.assistant").last().locator(".sources strong").allTextContents();
  await desktop.fill("#chat-input", "洪飞鹰是国家级还是省级英歌传承人？");
  await desktop.press("#chat-input", "Enter");
  await desktop.waitForTimeout(1200);
  const hongFeiyingAnswer = await desktop.locator(".message.assistant").last().innerText();
  const hongFeiyingSources = await desktop.locator(".message.assistant").last().locator(".sources strong").allTextContents();
  await desktop.fill("#chat-input", "林炳光跟谁学习甲子英歌，什么时候开始授徒？");
  await desktop.press("#chat-input", "Enter");
  await desktop.waitForTimeout(1200);
  const lineageAnswer = await desktop.locator(".message.assistant").last().innerText();
  const lineageSources = await desktop.locator(".message.assistant").last().locator(".sources strong").allTextContents();
  await desktop.fill("#chat-input", "英歌队的司鼓和绘脸师是不是自动算非遗传承人？");
  await desktop.press("#chat-input", "Enter");
  await desktop.waitForTimeout(1200);
  const transmissionRoleAnswer = await desktop.locator(".message.assistant").last().innerText();
  const transmissionRoleSources = await desktop.locator(".message.assistant").last().locator(".sources strong").allTextContents();
  await desktop.fill("#chat-input", "潮阳、普宁和甲子英歌的保护单位分别是谁？");
  await desktop.press("#chat-input", "Enter");
  await desktop.waitForTimeout(1200);
  const protectionUnitAnswer = await desktop.locator(".message.assistant").last().innerText();
  const protectionUnitSources = await desktop.locator(".message.assistant").last().locator(".sources strong").allTextContents();
  await desktop.fill("#chat-input", "高校设计的108张英歌脸谱是所有村的传统版本吗？");
  await desktop.press("#chat-input", "Enter");
  await desktop.waitForTimeout(1200);
  const digitalHeritageAnswer = await desktop.locator(".message.assistant").last().innerText();
  const digitalHeritageSources = await desktop.locator(".message.assistant").last().locator(".sources strong").allTextContents();
  await desktop.screenshot({ path: "web/agent-preview.png" });
  await desktop.click("[data-close-agent]");
  await desktop.locator("#beat-toggle").click();
  await desktop.waitForTimeout(180);
  const activeBeatCount = await desktop.locator(".beat-grid button.active").count();
  await desktop.locator("#beat-toggle").click();
  await desktop.locator("#pet-main").click();
  await desktop.waitForTimeout(320);
  const petState = await desktop.locator("#desktop-pet").evaluate((pet) => ({
    menuOpen: pet.classList.contains("menu-open"),
    talking: pet.classList.contains("talking"),
    action: pet.dataset.state,
    bubbleVisible: getComputedStyle(pet.querySelector(".pet-bubble")).visibility,
    spriteAnimation: getComputedStyle(pet.querySelector(".pet-sprite")).animationName,
  }));
  await desktop.locator('[data-pet-action="drum"]').click();
  await desktop.waitForTimeout(100);
  const petDrumReaction = await desktop.locator("#drum").evaluate((drum) => drum.classList.contains("hit"));
  const petDrumState = await desktop.locator("#desktop-pet").getAttribute("data-state");
  await desktop.locator('[data-pet-action="pose"]').click();
  await desktop.waitForTimeout(80);
  const petPoseState = await desktop.locator("#desktop-pet").getAttribute("data-state");
  const motionRuntime = await desktop.evaluate(() => ({
    gsap: Boolean(window.gsap),
    scrollTrigger: Boolean(window.ScrollTrigger),
    triggerCount: window.ScrollTrigger?.getAll?.().length || 0,
  }));
  await desktop.locator(".myth-list summary").first().click();
  const detailsOpen = await desktop.locator(".myth-list details").first().getAttribute("open");
  await desktop.locator(".watch-track li").first().focus();
  await desktop.keyboard.press("Enter");
  const contentQueryOpenedAgent = await desktop.locator(".agent-panel").evaluate((el) => el.classList.contains("open"));
  await desktop.click("[data-close-agent]");

  const tablet = await browser.newPage({ viewport: { width: 820, height: 1180 } });
  await tablet.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await tablet.screenshot({ path: "web/tablet-preview.png", fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await mobile.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
    window.scrollTo(0, 0);
  });
  await mobile.screenshot({ path: "web/mobile-preview.png", fullPage: true });

  const reducedContext = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  const reduced = await reducedContext.newPage();
  await reduced.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  const reducedDuration = await reduced.locator(".mascot-stage img").evaluate((el) => getComputedStyle(el).animationDuration);

  const failure = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await failure.route("**/data/chunks.jsonl", (route) => route.abort());
  await failure.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  const failureStatus = await failure.locator("#knowledge-status").textContent();

  const admin = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const adminErrors = [];
  admin.on("console", (message) => { if (message.type() === "error") adminErrors.push(message.text()); });
  admin.on("pageerror", (error) => adminErrors.push(error.message));
  await admin.goto("http://127.0.0.1:8080/admin-provider.html", { waitUntil: "networkidle" });
  await admin.waitForTimeout(500);
  const adminStatus = await admin.locator("#health-pill").innerText();
  const adminVersion = await admin.locator("#version-text").innerText();
  await admin.locator("#save-btn").click();
  const adminSaved = await admin.locator("#test-output").innerText();

  const viewportChecks = {};
  for (const [name, page] of [["desktop", desktop], ["tablet", tablet], ["mobile", mobile]]) {
    viewportChecks[name] = await page.evaluate(() => ({
      viewport: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      brokenImages: [...document.images].filter((img) => img.complete && !img.naturalWidth).length,
    }));
  }
  const report = {
    title: await desktop.title(),
    answer,
    detailedAnswer,
    detailedAnswerLength: detailedAnswer.length,
    adaptationAnswer,
    adaptationSources,
    ximenConflictAnswer,
    ximenConflictSources,
    eightBeatAnswer,
    eightBeatSources,
    timecodeAnswer,
    timecodeSources,
    videoEvidenceAnswer,
    videoEvidenceSources,
    houxiAnswer,
    houxiSources,
    inheritorAnswer,
    inheritorSources,
    linZhongchengAnswer,
    linZhongchengSources,
    hongFeiyingAnswer,
    hongFeiyingSources,
    lineageAnswer,
    lineageSources,
    transmissionRoleAnswer,
    transmissionRoleSources,
    protectionUnitAnswer,
    protectionUnitSources,
    digitalHeritageAnswer,
    digitalHeritageSources,
    motionRuntime,
    activeBeatCount,
    petState,
    petDrumReaction,
    petDrumState,
    petPoseState,
    errors,
    viewportChecks,
    reducedMotionDuration: reducedDuration,
    failureStatus,
    adminStatus,
    adminVersion,
    adminSaved,
    adminErrors,
    detailsOpen: detailsOpen !== null,
    contentQueryOpenedAgent,
    desktopHeight: await desktop.evaluate(() => document.documentElement.scrollHeight),
    mobileHeight: await mobile.evaluate(() => document.documentElement.scrollHeight),
  };
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})();
