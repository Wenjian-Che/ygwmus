const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/20549/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const baseUrl = process.env.AGENT_UI_BASE_URL || 'http://127.0.0.1:8096';
const answer = '英歌是流传于潮汕及粤东部分地区的传统舞蹈，舞者手持双槌，在锣鼓和吆喝中把步法、槌法、人物扮演与队形行进结合起来。 [证据1]\n\n### 适用边界\n不同地区、队伍、师承与年代的具体做法会有差异。';
const citations = [
  { grade: 'A', title: '国家级非遗之甲子英歌', url: 'https://example.com/a' },
  { grade: 'A', title: '英歌（普宁英歌、潮阳英歌）', url: 'https://example.com/b' },
];

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
    await page.route('**/api/agent/chat', route => route.fulfill({
      status: 200,
      contentType: 'text/event-stream; charset=utf-8',
      body: `event: delta\ndata: ${JSON.stringify({ text: answer })}\n\nevent: citations\ndata: ${JSON.stringify({ items: citations })}\n\nevent: done\ndata: ${JSON.stringify({})}\n\n`,
    }));
    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(window.yinggeGuide));
    await page.evaluate(() => window.yinggeGuide.open());
    await page.evaluate(() => {
      window.__spokenAgentAnswer = '';
      window.addEventListener('yingge:agent-event', event => { if (event.detail?.type === 'done') window.__spokenAgentAnswer = event.detail.text; });
      window.__agentPromise = window.yinggeGuide.ask('用一句话说明什么是英歌');
    });

    const typingReply = page.locator('.agent-message.assistant').last();
    await typingReply.locator('.agent-typing-cursor').waitFor({ state: 'visible', timeout: 1500 });
    assert.equal(await typingReply.evaluate(node => node.classList.contains('is-typing')), true, '回答应先以打字机方式出现');
    assert.doesNotMatch(await typingReply.textContent(), /\[证据\d+\]/, '正文不应暴露内部证据编号');
    await page.evaluate(() => window.__agentPromise);

    const reply = page.locator('.agent-message.assistant').last();
    const boundary = reply.locator('details.agent-answer-boundary');
    const sourceFold = reply.locator('details.agent-citation-fold');
    assert.equal(await boundary.count(), 1, '适用边界应折叠显示');
    assert.equal(await boundary.evaluate(node => node.open), false, '适用边界不应默认展开');
    assert.equal(await sourceFold.count(), 1, '资料来源应折叠显示');
    assert.equal(await sourceFold.evaluate(node => node.open), false, '资料来源不应默认展开');
    assert.match((await sourceFold.locator('summary').textContent()).trim(), /资料来源 · 2/, '折叠标题应显示来源数量');
    assert.equal(await sourceFold.locator('a').count(), 2, '展开内容仍应保留可访问的来源链接');
    assert.match(await reply.textContent(), /英歌是流传于潮汕及粤东部分地区的传统舞蹈/, '直接答案应保持可读');
    assert.doesNotMatch(await reply.textContent(), /\[证据\d+\]/, '完成后的正文也不应暴露内部证据编号');
    assert.doesNotMatch(await page.evaluate(() => window.__spokenAgentAnswer), /适用边界|资料来源/, '自动朗读不应包含折叠的边界或来源内容');
    console.log('agent answer presentation ok');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
