const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/20549/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const baseUrl = process.env.AGENT_UI_BASE_URL || 'http://127.0.0.1:8096';
const answer = '脸谱颜色只能作为线索，不能脱离具体队伍、年代和角色职责直接认定人物。 [证据1]\n\n### 适用边界\n具体对应关系以队伍谱样或公开说明为准。';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await page.route('**/api/health', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
    await page.route('**/api/agent/chat', route => route.fulfill({
      status: 200, contentType: 'text/event-stream; charset=utf-8',
      body: `event: delta\ndata: ${JSON.stringify({ text: answer })}\n\nevent: citations\ndata: ${JSON.stringify({ items: [{ grade: 'A', title: '甲子英歌公开资料', url: 'https://example.com/source' }] })}\n\nevent: done\ndata: {}\n\n`,
    }));
    await page.goto(`${baseUrl}/mugeda-agent-test.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(window.MugedaYinggeAgent));
    await page.evaluate(() => window.MugedaYinggeAgent.open());
    await page.evaluate(() => window.__ask = window.MugedaYinggeAgent.ask('脸谱颜色能直接认角色吗？'));
    await page.evaluate(() => window.__ask);
    const result = await page.evaluate(() => {
      const root = document.querySelector('#yingge-mugeda-agent').shadowRoot;
      const reply = root.querySelector('.message.assistant:last-of-type');
      const sources = reply.querySelector('details.sources');
      const mic = root.querySelector('.mic');
      const messages = root.querySelector('.messages');
      return {
        hasSources: Boolean(sources), sourcesOpen: sources?.open,
        sourceCount: sources?.querySelectorAll('a').length,
        micLabel: mic?.getAttribute('aria-label'), micPressed: mic?.getAttribute('aria-pressed'),
        overflowY: getComputedStyle(messages).overflowY,
        inputFontSize: getComputedStyle(root.querySelector('input')).fontSize,
        answerText: reply?.textContent || '',
      };
    });
    assert.equal(result.hasSources, true);
    assert.equal(result.sourcesOpen, false);
    assert.equal(result.sourceCount, 1);
    assert.match(result.micLabel, /点击开始/);
    assert.equal(result.micPressed, 'false');
    assert.equal(result.overflowY, 'auto');
    assert.ok(parseFloat(result.inputFontSize) >= 16, '微信/iOS 输入框应至少 16px，避免聚焦缩放');
    assert.match(result.answerText, /脸谱颜色只能作为线索/);
    assert.doesNotMatch(result.answerText, /\[证据\d+\]/);
    console.log('mugeda public component ok');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
