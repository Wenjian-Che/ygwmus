const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const sessions = new Map();
  const createdModes = [];
  let serial = 0;

  await page.route('http://127.0.0.1:8787/api/voice/status', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ asr: { available: true }, wake: { available: true }, tts: { available: true } })
  }));
  await page.route('http://127.0.0.1:8787/api/voice/session', async route => {
    const mode = route.request().postDataJSON()?.mode || 'transcribe';
    const id = `session-${++serial}`;sessions.set(id, mode);createdModes.push(mode);
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ session_id: id, mode }) });
  });
  await page.route(/http:\/\/127\.0\.0\.1:8787\/api\/voice\/session\/session-\d+\/chunk.*/, async route => {
    const id = route.request().url().match(/session-\d+/)?.[0], mode = sessions.get(id);
    const payload = mode === 'wake'
      ? { text: '小槌小槌', awake: true, endpoint: true, final: true }
      : { text: '英歌是什么', awake: false, endpoint: true, final: true };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
  });
  await page.route(/http:\/\/127\.0\.0\.1:8787\/api\/voice\/session\/session-\d+$/, route => route.fulfill({ status: 204, body: '' }));
  await page.route('http://127.0.0.1:8787/api/agent/chat', route => route.fulfill({
    status: 200, contentType: 'text/event-stream',
    body: 'event: delta\ndata: {"text":"英歌是流传于潮汕地区的民间舞蹈。"}\n\nevent: done\ndata: {}\n\n'
  }));
  await page.route('http://127.0.0.1:8787/api/voice/synthesize', route => route.fulfill({
    status: 200, contentType: 'audio/wav', body: Buffer.from('RIFF0000WAVE')
  }));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) } });
    class FakeAudioContext {
      constructor() { this.sampleRate = 16000;this.destination = {}; }
      createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
      createScriptProcessor() { const node = { connect() {}, disconnect() {}, onaudioprocess: null };window.__processor = node;return node; }
      close() { return Promise.resolve(); }
    }
    class FakeAudio {
      play() { setTimeout(() => this.onended?.(), 15);return Promise.resolve(); }
      pause() {}
    }
    window.AudioContext = FakeAudioContext;window.webkitAudioContext = FakeAudioContext;window.Audio = FakeAudio;
    window.speechSynthesis = { getVoices: () => [], cancel() {}, speak() {}, addEventListener() {} };
    window.SpeechSynthesisUtterance = class {};
  });

  await page.goto(`http://127.0.0.1:8096/index.html?persistent-wake=${Date.now()}#ask-xiaochui`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelector('[data-wake-toggle]')?.click());
  await page.waitForFunction(() => window.__processor?.onaudioprocess, null, { timeout: 1500 });
  await page.evaluate(() => {
    for (let pass = 0; pass < 2; pass += 1) {
      const samples = new Float32Array(4096).fill(.08);
      window.__processor.onaudioprocess({ inputBuffer: { getChannelData: () => samples }, outputBuffer: { getChannelData: () => new Float32Array(4096) } });
    }
  });
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    for (let pass = 0; pass < 2; pass += 1) {
      const samples = new Float32Array(4096).fill(.08);
      window.__processor.onaudioprocess({ inputBuffer: { getChannelData: () => samples }, outputBuffer: { getChannelData: () => new Float32Array(4096) } });
    }
  });
  await page.waitForTimeout(2800);
  const button = page.locator('[data-wake-toggle]');
  const result = {
    createdModes,
    pressedAfterAnswer: await button.getAttribute('aria-pressed'),
    labelAfterAnswer: await button.textContent(),
    statusAfterAnswer: await page.locator('[data-voice-status]').first().textContent()
  };
  await button.click();
  await page.waitForTimeout(60);
  result.pressedAfterManualStop = await button.getAttribute('aria-pressed');
  result.statusAfterManualStop = await page.locator('[data-voice-status]').first().textContent();
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  if (result.pressedAfterAnswer !== 'true' || createdModes.slice(0,3).join(',') !== 'wake,transcribe,wake' || !/追问|朗读|唤醒/.test(result.statusAfterAnswer) || result.pressedAfterManualStop !== 'false' || !/已关闭/.test(result.statusAfterManualStop)) process.exitCode = 1;
})();
