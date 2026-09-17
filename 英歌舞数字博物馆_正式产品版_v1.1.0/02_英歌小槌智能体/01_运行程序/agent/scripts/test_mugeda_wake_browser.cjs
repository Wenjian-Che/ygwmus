const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('C:/Users/20549/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const webRoot = path.resolve(__dirname, '../../../..', '01_公众网站');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = path.resolve(webRoot, '.' + (pathname === '/' ? '/mugeda-agent-test.html' : pathname));
  if (!file.startsWith(webRoot) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { response.writeHead(404); return response.end(); }
  response.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(response);
});

let browser;
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const modes = [];
  const ttsRequests = [];
  const answerText = '英歌舞是一种流传于潮汕和粤东部分地区的传统舞蹈，表演者手持双槌，在锣鼓和吆喝的节奏中，以步法、身法、槌法和队形行进完成集体表演。快板与慢板不只差在速度，还要比较鼓点密度、停顿方式、槌长、击槌组合、重心转换和具体队伍的自称；不同地区的称谓和做法也可能不同。';
  let wakeChunk = 0, questionChunk = 0;
  await page.addInitScript(() => {
    const stream = { getTracks: () => [{ stop() {} }] };
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => stream } });
    window.__mugedaProcessors = [];
    window.AudioContext = class {
      constructor() { this.sampleRate = 16000; this.state = 'running'; }
      createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
      createScriptProcessor() { const processor = { onaudioprocess: null, connect() {}, disconnect() {} }; window.__mugedaProcessors.push(processor); return processor; }
      close() { return Promise.resolve(); }
      resume() { return Promise.resolve(); }
    };
    window.Audio = class {
      constructor(src) { this.src = src; }
      play() { if (String(this.src).startsWith('blob:') && window.__holdSpeechAudio) { window.__activeSpeechAudio = this; return Promise.resolve(); } queueMicrotask(() => this.onended && this.onended()); return Promise.resolve(); }
      pause() { this.paused = true; }
    };
  });
  await page.route('https://yinggemus.cn/api/**', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname === '/api/health') return route.fulfill({ contentType: 'application/json', body: '{"ok":true}' });
    if (url.pathname === '/api/voice/events') return route.fulfill({ status: 202, contentType: 'application/json', body: '{"accepted":true}' });
    if (url.pathname === '/api/voice/session' && request.method() === 'POST') {
      const mode = JSON.parse(request.postData()).mode; modes.push(mode);
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ session_id: mode === 'wake' ? 'wake-session' : 'question-session', mode, engine: mode === 'wake' ? 'sherpa-onnx-kws-ppinyin' : 'tencent-realtime-asr' }) });
    }
    if (url.pathname.includes('/api/voice/session/wake-session/chunk')) { wakeChunk += 1; return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ awake: wakeChunk >= 1, text: wakeChunk >= 1 ? '小槌小槌' : '' }) }); }
    if (url.pathname.includes('/api/voice/session/question-session/chunk')) { questionChunk += 1; return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ endpoint: questionChunk >= 1, text: '英歌舞是什么' }) }); }
    if (url.pathname.startsWith('/api/voice/session/') && request.method() === 'DELETE') return route.fulfill({ status: 204 });
    if (url.pathname === '/api/voice/synthesize') { ttsRequests.push(JSON.parse(request.postData())); return route.fulfill({ contentType: 'audio/wav', body: Buffer.from('RIFFmock-audio') }); }
    if (url.pathname === '/api/agent/chat') return route.fulfill({ contentType: 'text/event-stream', body: `event: delta\ndata: ${JSON.stringify({ text: answerText })}\n\nevent: citations\ndata: {"items":[]}\n\n` });
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
  await page.goto(`http://127.0.0.1:${port}/mugeda-agent-test.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.MugedaYinggeAgent);
  const host = page.locator('#yingge-mugeda-agent');
  await host.locator('.launcher').click();
  await page.waitForTimeout(260);
  const portraitLayout = await page.evaluate(() => {
    const panel = document.querySelector('#yingge-mugeda-agent').shadowRoot.querySelector('.panel');
    const rect = panel.getBoundingClientRect();
    return { transform: getComputedStyle(panel).transform, layoutWidth: panel.clientWidth, layoutHeight: panel.clientHeight, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
  });
  assert.notEqual(portraitLayout.transform, 'none', '手机竖屏应保持横向英歌小槌界面');
  assert.ok(portraitLayout.layoutWidth > portraitLayout.layoutHeight, '竖屏设备中的英歌小槌内部布局必须保持横向');
  await host.locator('.settings').click();
  await host.locator('[data-setting="wake"]').click();
  await page.waitForFunction(() => window.__mugedaProcessors.length === 1);
  await page.evaluate(() => { const samples = new Float32Array(4096); samples.fill(.001); window.__mugedaProcessors[0].onaudioprocess({ inputBuffer: { getChannelData: () => samples }, outputBuffer: { getChannelData: () => new Float32Array(4096) } }); });
  await page.waitForTimeout(80);
  assert.equal(await page.evaluate(() => window.__mugedaProcessors.length), 1, '低能量环境噪声即使被 KWS 误报，也不得打开提问窗口');
  await page.evaluate(() => { const samples = new Float32Array(4096); samples.fill(.04); window.__mugedaProcessors[0].onaudioprocess({ inputBuffer: { getChannelData: () => samples }, outputBuffer: { getChannelData: () => new Float32Array(4096) } }); });
  await page.waitForFunction(() => window.__mugedaProcessors.length === 2);
  await page.evaluate(() => { const samples = new Float32Array(4096); samples.fill(.04); window.__mugedaProcessors[1].onaudioprocess({ inputBuffer: { getChannelData: () => samples }, outputBuffer: { getChannelData: () => new Float32Array(4096) } }); });
  await page.waitForFunction((expected) => document.querySelector('#yingge-mugeda-agent').shadowRoot.querySelector('.messages').textContent.includes(expected), answerText);
  const result = await page.evaluate(() => {
    const root = document.querySelector('#yingge-mugeda-agent').shadowRoot;
    return { wakeEnabled: root.querySelector('[data-setting="wake"]').getAttribute('aria-checked'), panelOpen: root.querySelector('.panel').classList.contains('open'), text: root.querySelector('.messages').textContent };
  });
  assert.deepEqual(modes, ['wake', 'transcribe', 'wake'], '问题提交后必须立即恢复 KWS，令生成与朗读阶段都可被再次唤醒打断');
  assert.equal(result.wakeEnabled, 'true');
  assert.equal(result.panelOpen, true);
  assert.match(result.text, /英歌舞是什么/);
  await page.waitForFunction(() => window.__mugedaProcessors.length === 3, null, { timeout: 3000 });
  await page.evaluate(() => { window.__holdSpeechAudio = true; });
  await page.evaluate(() => document.querySelector('#yingge-mugeda-agent').shadowRoot.querySelector('.speak').click());
  await page.waitForFunction(() => document.querySelector('#yingge-mugeda-agent').shadowRoot.querySelector('.speak').classList.contains('reading'));
  await page.waitForTimeout(80);
  assert.ok(ttsRequests.length >= 2, '长回答应拆成多个朗读请求，不能等待整段合成后播放');
  assert.ok(ttsRequests.every((item) => Array.from(item.text || '').length <= 108), '每个朗读请求应保持短句，优先降低首句开口延迟');
  await page.waitForTimeout(280);
  await page.evaluate(() => { const samples = new Float32Array(4096); samples.fill(.04); window.__mugedaProcessors[2].onaudioprocess({ inputBuffer: { getChannelData: () => samples }, outputBuffer: { getChannelData: () => new Float32Array(4096) } }); });
  await page.waitForFunction(() => window.__mugedaProcessors.length === 4, null, { timeout: 3000 });
  await page.evaluate(() => { const samples = new Float32Array(4096); samples.fill(.04); window.__mugedaProcessors[3].onaudioprocess({ inputBuffer: { getChannelData: () => samples }, outputBuffer: { getChannelData: () => new Float32Array(4096) } }); });
  await page.waitForFunction(() => document.querySelector('#yingge-mugeda-agent').shadowRoot.querySelectorAll('.message.user').length === 2);
  await page.waitForTimeout(220);
  assert.deepEqual(modes, ['wake', 'transcribe', 'wake', 'transcribe', 'wake'], '完成第二次提问后必须再次回到待机，形成可连续使用的唤醒循环');
  await browser.close();
  await new Promise(resolve => server.close(resolve));
  console.log('mugeda wake browser tests passed');
})().catch(async error => { console.error(error); await browser?.close().catch(() => {}); await new Promise(resolve => server.close(resolve)); process.exit(1); });
