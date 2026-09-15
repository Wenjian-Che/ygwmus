const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const sessions = new Map();
  let serial = 0;
  let agentCalls = 0;

  await page.route('http://127.0.0.1:8787/api/voice/status', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ asr: { available: true }, wake: { available: true }, tts: { available: false } })
  }));
  await page.route('http://127.0.0.1:8787/api/voice/session', async route => {
    const mode = route.request().postDataJSON()?.mode || 'transcribe';
    const id = `session-${++serial}`;
    sessions.set(id, mode);
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ session_id: id, mode }) });
  });
  await page.route(/http:\/\/127\.0\.0\.1:8787\/api\/voice\/session\/session-\d+\/chunk.*/, async route => {
    const id = route.request().url().match(/session-\d+/)?.[0];
    const mode = sessions.get(id);
    const payload = mode === 'wake'
      ? { text: '小槌小槌', awake: true, endpoint: true, final: true }
      : { text: '英歌舞的脸谱有什么区别', awake: false, endpoint: true, final: true };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
  });
  await page.route(/http:\/\/127\.0\.0\.1:8787\/api\/voice\/session\/session-\d+$/, route => route.fulfill({ status: 204, body: '' }));
  await page.route('http://127.0.0.1:8787/api/agent/chat', route => {
    agentCalls += 1;
    return route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: 'event: delta\ndata: {"text":"脸谱需要结合人物、队伍和地区理解。"}\n\nevent: done\ndata: {}\n\n'
    });
  });

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) } });
    class FakeAudioContext {
      constructor() { this.sampleRate = 16000; this.destination = {}; }
      createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
      createScriptProcessor() { const node = { connect() {}, disconnect() {}, onaudioprocess: null }; window.__wakeProcessor = node; return node; }
      close() { return Promise.resolve(); }
    }
    class FakeAudio { play() { setTimeout(() => this.onended?.(), 20); return Promise.resolve(); } pause() {} load() {} }
    window.AudioContext = FakeAudioContext; window.webkitAudioContext = FakeAudioContext; window.Audio = FakeAudio;
    window.speechSynthesis = { getVoices: () => [], cancel() {}, speak() {}, addEventListener() {} };
    window.SpeechSynthesisUtterance = class {};
  });

  const emitAudio = async count => page.evaluate(count => {
    for (let pass = 0; pass < count; pass += 1) {
      const samples = new Float32Array(4096).fill(.08);
      window.__wakeProcessor.onaudioprocess({
        inputBuffer: { getChannelData: () => samples },
        outputBuffer: { getChannelData: () => new Float32Array(4096) }
      });
    }
  }, count);

  await page.goto(`http://127.0.0.1:8096/index.html?wake-confirm=${Date.now()}#ask-xiaochui`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelector('[data-wake-toggle]')?.click());
  await page.waitForFunction(() => window.__wakeProcessor?.onaudioprocess, null, { timeout: 1500 });
  await emitAudio(2);
  await page.waitForTimeout(120);
  await emitAudio(2);
  await page.waitForTimeout(180);

  const beforeConfirmation = {
    agentCalls,
    input: await page.locator('#question').inputValue(),
    status: await page.locator('[data-voice-status]').first().textContent()
  };
  await page.waitForTimeout(1300);
  const afterConfirmation = { agentCalls };
  console.log(JSON.stringify({ beforeConfirmation, afterConfirmation }, null, 2));
  await browser.close();

  if (beforeConfirmation.agentCalls !== 0 || !/英歌舞的脸谱/.test(beforeConfirmation.input) || !/确认/.test(beforeConfirmation.status) || afterConfirmation.agentCalls !== 1) process.exitCode = 1;
})();
