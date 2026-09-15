const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/20549/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const baseUrl = process.env.AGENT_UI_BASE_URL || 'http://127.0.0.1:8096';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await page.route('**/api/agent/chat', async route => {
      await new Promise(resolve => setTimeout(resolve, 350));
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream; charset=utf-8',
        body: 'event: delta\ndata: {"text":"英歌是流传于潮汕及粤东部分地区的传统舞蹈。 [证据1]"}\n\nevent: done\ndata: {}\n\n',
      });
    });
    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(window.yinggeGuide));
    await page.evaluate(() => window.yinggeGuide.open());
    await page.evaluate(() => { window.__agentPromise = window.yinggeGuide.ask('英歌是什么'); });
    const thinking = page.locator('.agent-thinking-state');
    await thinking.waitFor({ state: 'visible', timeout: 1500 });
    assert.equal(await page.locator('#guidePanel').getAttribute('data-agent-state'), 'thinking', '提问时小槌应进入思考态');
    assert.equal(await thinking.locator('.agent-thinking-step').count(), 3, '思考态应呈现检索、核对、组织三个阶段');
    assert.match(await thinking.textContent(), /检索馆内资料/, '思考态应说明正在做什么');
    await page.evaluate(() => window.__agentPromise);
    assert.equal(await thinking.count(), 0, '回答开始后应清理思考态');
    console.log('agent thinking presentation ok');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
