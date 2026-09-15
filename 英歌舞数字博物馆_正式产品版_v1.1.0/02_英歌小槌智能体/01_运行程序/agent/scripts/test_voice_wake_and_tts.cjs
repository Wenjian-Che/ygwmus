const { chromium } = require('playwright');

const json = value => JSON.stringify(value);
const wav = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x24, 0, 0, 0, 0x57, 0x41, 0x56, 0x45,
  0x66, 0x6d, 0x74, 0x20, 0x10, 0, 0, 0, 1, 0, 1, 0,
  0x80, 0x3e, 0, 0, 0, 0x7d, 0, 0, 2, 0, 0x10, 0,
  0x64, 0x61, 0x74, 0x61, 0, 0, 0, 0
]);

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  let chunkCalls = 0;
  let synthesisCalls = 0;

  await page.route('http://127.0.0.1:8787/api/voice/status', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: json({ asr: { available: true }, wake: { available: true, phrase: '小槌小槌', mode: 'foreground-opt-in' }, tts: { available: true, speakers: 174 } })
  }));
  await page.route('http://127.0.0.1:8787/api/voice/session', route => route.fulfill({
    status: 201,
    contentType: 'application/json',
    body: json({ session_id: `wake-${Date.now()}`, sample_rate: 16000, wake_phrase: '小槌小槌' })
  }));
  await page.route(/http:\/\/127\.0\.0\.1:8787\/api\/voice\/session\/[^/]+\/chunk.*/, route => {
    chunkCalls += 1;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: json({ text: '小槌小槌', awake: true, endpoint: false, final: false })
    });
  });
  await page.route(/http:\/\/127\.0\.0\.1:8787\/api\/voice\/session\/[^/]+$/, route => route.fulfill({ status: 204, body: '' }));
  await page.route('http://127.0.0.1:8787/api/voice/synthesize', async route => {
    synthesisCalls += 1;
    await route.fulfill({ status: 200, contentType: 'audio/wav', body: wav });
  });

  await page.addInitScript(() => {
    const track = { stop() {} };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: async () => ({ getTracks: () => [track] }) }
    });
    class FakeAudioContext {
      constructor() { this.sampleRate = 16000; this.destination = {}; }
      createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
      createScriptProcessor() {
        const processor = { onaudioprocess: null, connect() {}, disconnect() {} };
        window.__wakeProcessor = processor;
        return processor;
      }
      close() { return Promise.resolve(); }
    }
    class FakeAudio {
      constructor(src) { this.src = src; this.onended = null; this.onerror = null; }
      play() { window.__localVoicePlayed = true; setTimeout(() => this.onended?.(), 10); return Promise.resolve(); }
      pause() { window.__localVoicePaused = true; }
    }
    window.AudioContext = FakeAudioContext;
    window.webkitAudioContext = FakeAudioContext;
    window.Audio = FakeAudio;
    window.speechSynthesis = {
      getVoices: () => [{ name: 'Only Female Voice', lang: 'zh-CN' }],
      cancel() {},
      speak() { window.__browserSpeechUsed = true; },
      addEventListener() {}
    };
    window.SpeechSynthesisUtterance = class {};
  });

  await page.goto(`http://127.0.0.1:8096/index.html?voice-wake-test=${Date.now()}#ask-xiaochui`, { waitUntil: 'networkidle' });
  const defaultOutput = await page.locator('#guidePanel [data-voice-output]').getAttribute('aria-pressed');
  const wakeButton = page.locator('#guidePanel [data-wake-toggle]');
  const wakeCount = await wakeButton.count();
  if (wakeCount) {
    await page.evaluate(() => document.querySelector('#guidePanel [data-wake-toggle]')?.click());
    await page.waitForFunction(() => window.__wakeProcessor?.onaudioprocess, null, { timeout: 1500 });
    await page.evaluate(() => {
      for (let pass = 0; pass < 4; pass += 1) {
        const samples = new Float32Array(4096).fill(.08);
        window.__wakeProcessor.onaudioprocess({
          inputBuffer: { getChannelData: () => samples },
          outputBuffer: { getChannelData: () => new Float32Array(4096) }
        });
      }
    });
    await page.waitForFunction(() => ['awake','listening'].includes(document.querySelector('#guidePanel [data-voice-stage]')?.dataset.voiceStage || ''), null, { timeout: 2500 });
  }

  await page.evaluate(() => window.dispatchEvent(new CustomEvent('yingge:agent-event', { detail: { type: 'done', text: '你好，我是小槌。' } })));
  await page.waitForTimeout(250);

  const result = {
    wakeButton: wakeCount === 1,
    defaultOutput,
    wakePressed: wakeCount ? await wakeButton.getAttribute('aria-pressed') : null,
    status: await page.locator('#guidePanel [data-voice-status]').textContent(),
    stage: await page.locator('#guidePanel [data-voice-stage]').getAttribute('data-voice-stage'),
    chunkCalls,
    synthesisCalls,
    localVoicePlayed: await page.evaluate(() => Boolean(window.__localVoicePlayed)),
    browserSpeechUsed: await page.evaluate(() => Boolean(window.__browserSpeechUsed))
  };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  if (!result.wakeButton || result.defaultOutput !== 'true' || result.wakePressed !== 'true' || !['awake','listening','speaking','followup'].includes(result.stage) || chunkCalls < 1 || synthesisCalls !== 1 || !result.localVoicePlayed || result.browserSpeechUsed) process.exitCode = 1;
})();
