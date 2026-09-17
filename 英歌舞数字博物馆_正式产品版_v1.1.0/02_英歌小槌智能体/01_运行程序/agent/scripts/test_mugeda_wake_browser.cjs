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

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const modes = [];
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
    window.Audio = class { play() { queueMicrotask(() => this.onended && this.onended()); return Promise.resolve(); } pause() {} };
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
    if (url.pathname === '/api/agent/chat') return route.fulfill({ contentType: 'text/event-stream', body: 'event: delta\ndata: {"text":"英歌舞是一种广东潮汕地区的民间舞蹈。"}\n\nevent: citations\ndata: {"items":[]}\n\n' });
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
  await page.goto(`http://127.0.0.1:${port}/mugeda-agent-test.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.MugedaYinggeAgent);
  const host = page.locator('#yingge-mugeda-agent');
  await host.locator('.launcher').click();
  await host.locator('.settings').click();
  await host.locator('[data-setting="wake"]').click();
  await page.waitForFunction(() => window.__mugedaProcessors.length === 1);
  await page.evaluate(() => { const samples = new Float32Array(4096); samples.fill(.04); window.__mugedaProcessors[0].onaudioprocess({ inputBuffer: { getChannelData: () => samples }, outputBuffer: { getChannelData: () => new Float32Array(4096) } }); });
  await page.waitForFunction(() => window.__mugedaProcessors.length === 2);
  await page.evaluate(() => { const samples = new Float32Array(4096); samples.fill(.04); window.__mugedaProcessors[1].onaudioprocess({ inputBuffer: { getChannelData: () => samples }, outputBuffer: { getChannelData: () => new Float32Array(4096) } }); });
  await page.waitForFunction(() => document.querySelector('#yingge-mugeda-agent').shadowRoot.querySelector('.messages').textContent.includes('英歌舞是一种广东潮汕地区的民间舞蹈。'));
  const result = await page.evaluate(() => {
    const root = document.querySelector('#yingge-mugeda-agent').shadowRoot;
    return { wakeEnabled: root.querySelector('[data-setting="wake"]').getAttribute('aria-checked'), panelOpen: root.querySelector('.panel').classList.contains('open'), text: root.querySelector('.messages').textContent };
  });
  assert.deepEqual(modes, ['wake', 'transcribe'], '唤醒后必须由本地 KWS 切换到问题转写会话');
  assert.equal(result.wakeEnabled, 'true');
  assert.equal(result.panelOpen, true);
  assert.match(result.text, /英歌舞是什么/);
  await browser.close();
  await new Promise(resolve => server.close(resolve));
  console.log('mugeda wake browser tests passed');
})().catch(async error => { console.error(error); await new Promise(resolve => server.close(resolve)); process.exit(1); });
