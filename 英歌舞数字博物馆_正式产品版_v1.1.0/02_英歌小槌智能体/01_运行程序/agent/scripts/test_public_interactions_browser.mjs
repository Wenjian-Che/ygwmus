import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const base = process.env.PUBLIC_SITE_URL || "http://127.0.0.1:8097";
const executablePath = process.env.BROWSER_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const browser = await chromium.launch({ headless: true, executablePath });
const page = await browser.newPage({ viewport: { width: 1280, height: 820 }, reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", error => errors.push(error.message));

try {
  await page.goto(`${base}/index.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.locator('[data-definition="clubs"]').evaluate(node => node.click());
  assert.equal(await page.locator(".definition-readout-label").textContent(), "双槌", `首页交互错误：${errors.join(" | ")}`);
  assert.match(await page.locator("#homeDefinitionReadout span").textContent(), /双槌不仅制造声音/);
  await page.locator('[data-definition="space"]').click({ force: true });
  assert.equal(await page.locator(".definition-readout-label").textContent(), "阵形");
  assert.match(await page.locator("#homeDefinitionReadout span").textContent(), /站位、间距和行进路线/);

  await page.goto(`${base}/learn.html`, { waitUntil: "networkidle" });
  await page.locator('[data-tree="place"]').click({ force: true });
  assert.equal(await page.locator("#treeReadoutTitle").textContent(), "地方传承");
  assert.match(await page.locator("#treeReadoutText").textContent(), /社区中依靠师承、训练和节庆实践延续/);
  assert.match(await page.locator("#treeAgentQuestion").getAttribute("data-agent-question"), /村落、队伍和年代/);
  await page.locator('[data-tree="evidence"]').click({ force: true });
  assert.equal(await page.locator("#treeReadoutTitle").textContent(), "证据来源");
  assert.match(await page.locator("#treeReadoutText").textContent(), /不同证据回答不同问题/);

  await page.locator('[data-tempo="fast"]').click({ force: true });
  assert.equal(await page.locator("#tempoGlyph").textContent(), "快");
  assert.match(await page.locator("#tempoTitle").textContent(), /短槌更灵便/);
  await page.locator('[data-case="helong"]').click({ force: true });
  assert.match(await page.locator("#caseTitle").textContent(), /河陇的快板/);
  assert.match(await page.locator("#caseAgentQuestion").getAttribute("data-agent-question"), /河陇英歌/);
  await page.locator('[data-origin="opera"]').click({ force: true });
  assert.match(await page.locator("#originDetail").textContent(), /戏曲说.*梁山泊攻打大名府/);

  await page.goto(`${base}/regions.html`, { waitUntil: "networkidle" });
  await page.locator('.region-switcher [data-region="揭阳市"]').click({ force: true });
  assert.equal(await page.locator("#regionName").textContent(), "揭阳");
  assert.match(await page.locator("#regionSummary").textContent(), /普宁、惠来/);
  assert.equal(await page.locator('.region-switcher [data-region="揭阳市"]').getAttribute("aria-pressed"), "true");

  await page.goto(`${base}/formation.html`, { waitUntil: "networkidle" });
  await page.locator('[data-formation="square"]').click({ force: true });
  assert.equal(await page.locator("#formationName").textContent(), "方形阵");
  assert.match(await page.locator("#formationDescription").textContent(), /四列矩形方阵/);

  await page.goto(`${base}/index.html`, { waitUntil: "networkidle" });
  await page.evaluate(() => { localStorage.setItem("yingge-locale", "en"); location.reload(); });
  await page.waitForLoadState("networkidle");
  await page.locator('[data-definition="clubs"]').evaluate(node => node.click());
  assert.equal(await page.locator(".definition-readout-label").textContent(), "Paired sticks");
  assert.match(await page.locator("#homeDefinitionReadout span").textContent(), /make sound while revealing direction/);

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", isMobile: true, hasTouch: true });
  await mobile.goto(`${base}/index.html`, { waitUntil: "networkidle" });
  await mobile.locator('#what-is-yingge').scrollIntoViewIfNeeded();
  await mobile.waitForFunction(() => document.querySelector('.museum-companion')?.classList.contains('is-home-definition-visible'));
  await mobile.locator('[data-definition="role"]').click({ force: true });
  assert.equal(await mobile.locator(".definition-readout-label").textContent(), "角色");
  for (const button of await mobile.locator(".definition-point").all()) {
    const box = await button.boundingBox();
    assert.ok(box && box.x >= 0 && box.x + box.width <= 390, "手机端导览入口不得超出视口");
  }
  await mobile.close();

  assert.deepEqual(errors, [], `浏览过程中出现脚本错误：${errors.join(" | ")}`);
  console.log("public interaction browser tests passed");
} finally {
  await browser.close();
}
