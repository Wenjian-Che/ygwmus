const { chromium } = require("C:/Users/20549/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    args: ["--no-sandbox", "--enable-webgl", "--use-angle=swiftshader"]
  });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  const motion = page.locator(".motion-score");
  await motion.scrollIntoViewIfNeeded();
  const box = await motion.boundingBox();
  const pageTop = await page.evaluate(() => document.querySelector(".motion-score").offsetTop);
  const scrollSpan = box.height - 1000;
  const captures = [["support", 0.03], ["shift", 0.31], ["transfer", 0.57], ["recover", 0.86]];
  for (const [name, progress] of captures) {
    await page.evaluate(y => window.scrollTo(0, y), pageTop + scrollSpan * progress);
    await page.waitForTimeout(650);
    await page.screenshot({ path: `web/audit-motion-${name}.png` });
  }
  const summary = await page.evaluate(() => ({
    phase: document.querySelector("[data-motion-score]")?.dataset.motionPhase,
    title: document.querySelector("[data-motion-title]")?.textContent,
    activeSteps: document.querySelectorAll("[data-motion-step].is-active").length,
    sectionHeight: Math.round(document.querySelector(".motion-score")?.getBoundingClientRect().height || 0),
    viewport: [innerWidth, innerHeight]
  }));
  console.log(JSON.stringify({ summary, errors }, null, 2));
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  mobile.on("console", message => { if (message.type() === "error") errors.push(`mobile: ${message.text()}`); });
  mobile.on("pageerror", error => errors.push(`mobile: ${error.message}`));
  await mobile.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
  await mobile.locator(".motion-score").scrollIntoViewIfNeeded();
  await mobile.waitForTimeout(500);
  await mobile.screenshot({ path: "web/audit-motion-mobile.png", fullPage: false });
  await browser.close();
})();
