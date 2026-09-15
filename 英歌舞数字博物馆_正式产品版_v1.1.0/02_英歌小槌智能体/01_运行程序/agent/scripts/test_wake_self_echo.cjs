const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const sessions = new Map();
  let serial = 0;
  let transcribeChunksDuringAck = 0;
  let agentCalls = 0;

  await page.route('http://127.0.0.1:8787/api/voice/status', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ asr: { available: true }, wake: { available: true }, tts: { available: true } })
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
    if (mode === 'transcribe') {
      transcribeChunksDuringAck += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ text: '小槌我在，您有什么想问我的吗', awake: false, endpoint: true, final: true })
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ text: '小槌小槌', awake: true, endpoint: true, final: true })
    });
  });
  await page.route(/http:\/\/127\.0\.0\.1:8787\/api\/voice\/session\/session-\d+$/, route => route.fulfill({ status: 204, body: '' }));
  await page.route('http://127.0.0.1:8787/api/agent/chat', route => {
    agentCalls += 1;
    return route.fulfill({ status: 200, contentType: 'text/event-stream', body: 'event: done\ndata: {}\n\n' });
  });

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) }
    });
    class FakeAudioContext {
      constructor() { this.sampleRate = 16000; this.destination = {}; }
      createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
      createScriptProcessor() {
        const node = { connect() {}, disconnect() {}, onaudioprocess: null };
        window.__wakeProcessor = node;
        return node;
      }
      close() { return Promise.resolve(); }
    }
    class FakeAudio {
      play() {
        window.__wakeAckPlayingForTest = true;
        setTimeout(() => {
          window.__wakeAckPlayingForTest = false;
          this.onended?.();
        }, 1000);
        return Promise.resolve();
      }
      pause() { if (window.__wakeAckPlayingForTest) window.__wakeAckPausedForTest = true; }
      load() {}
    }
    window.AudioContext = FakeAudioContext;
    window.webkitAudioContext = FakeAudioContext;
    window.Audio = FakeAudio;
    window.speechSynthesis = { getVoices: () => [], cancel() {}, speak() {}, addEventListener() {} };
    window.SpeechSynthesisUtterance = class {};
  });

  const emitAudio = async (count, level = .08) => page.evaluate(({ count, level }) => {
    for (let pass = 0; pass < count; pass += 1) {
      const samples = new Float32Array(4096).fill(level);
      window.__wakeProcessor.onaudioprocess({
        inputBuffer: { getChannelData: () => samples },
        outputBuffer: { getChannelData: () => new Float32Array(4096) }
      });
    }
  }, { count, level });

  await page.goto(`http://127.0.0.1:8096/index.html?wake-self-echo=${Date.now()}#ask-xiaochui`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelector('[data-wake-toggle]')?.click());
  await page.waitForFunction(() => window.__wakeProcessor?.onaudioprocess, null, { timeout: 1500 });
  await emitAudio(2);
  await page.waitForFunction(() => window.__wakeAckPlayingForTest === true, null, { timeout: 2000 });
  await page.waitForTimeout(350);
  await emitAudio(4);
  await page.waitForTimeout(250);

  const result = {
    transcribeChunksDuringAck,
    agentCalls,
    wakeAckPaused: await page.evaluate(() => Boolean(window.__wakeAckPausedForTest)),
    status: await page.locator('[data-voice-status]').first().textContent()
  };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  if (transcribeChunksDuringAck !== 0 || agentCalls !== 0 || result.wakeAckPaused) process.exitCode = 1;
})();
