const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  let transcribeCalls = 0;
  await page.route('http://127.0.0.1:8787/api/voice/status', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ asr: { available: true }, wake: { available: true }, tts: { available: true } })
  }));
  await page.route('http://127.0.0.1:8787/api/voice/transcribe', async route => {
    transcribeCalls += 1;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text: '英歌是什么', confidence: .98, engine: 'test' }) });
  });
  await page.addInitScript(() => {
    const track = { stop() {} };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: async () => ({ getTracks: () => [track] }) }
    });
    class FakeAudioContext {
      constructor() { this.sampleRate = 48000; this.destination = {}; }
      createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
      createScriptProcessor() {
        const processor = { onaudioprocess: null, disconnect() {} };
        processor.connect = () => {
          setTimeout(() => {
            for (let pass = 0; pass < 4; pass += 1) {
              const samples = new Float32Array(4096).fill(.08);
              processor.onaudioprocess?.({
                inputBuffer: { getChannelData: () => samples },
                outputBuffer: { getChannelData: () => new Float32Array(4096) }
              });
            }
          }, 20);
        };
        return processor;
      }
      close() { return Promise.resolve(); }
    }
    window.AudioContext = FakeAudioContext;
    window.webkitAudioContext = FakeAudioContext;
    window.SpeechRecognition = undefined;
    window.webkitSpeechRecognition = class {
      start() {
        setTimeout(() => this.onstart?.(), 5);
        setTimeout(() => this.onerror?.({ error: 'network' }), 30);
        setTimeout(() => this.onend?.(), 35);
      }
      stop() { this.onend?.(); }
    };
  });
  await page.goto(`http://127.0.0.1:8096/index.html?voice-network-test=${Date.now()}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelector('#guidePanel [data-voice-input]')?.click());
  await page.waitForFunction(() => /本机识别已就绪|本机录音/.test(document.querySelector('#guidePanel [data-voice-status]')?.textContent || ''), null, { timeout: 1200 }).catch(() => {});
  const fallbackStatus = await page.locator('#guidePanel [data-voice-status]').textContent();
  const inputLabel = await page.locator('#guidePanel [data-voice-input] [data-voice-label]').textContent();
  if (/本机识别已就绪|本机录音/.test(fallbackStatus)) {
    await page.waitForTimeout(100);
    await page.evaluate(() => document.querySelector('#guidePanel [data-voice-input]')?.click());
    await page.waitForTimeout(350);
  }
  const result = {
    fallbackStatus,
    finalStatus: await page.locator('#guidePanel [data-voice-status]').textContent(),
    input: await page.locator('#question').inputValue(),
    transcribeCalls
  };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  if (!/本机识别已就绪|本机录音/.test(fallbackStatus) || !/自动结束/.test(inputLabel) || result.input !== '英歌是什么' || transcribeCalls !== 1) process.exitCode = 1;
})();
