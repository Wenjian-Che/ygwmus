const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const requests = [];
  const answer = '英歌是一种群体舞蹈。表演者手持英歌槌，随锣鼓节奏行进。阵形变化体现队伍配合。';

  await page.route('http://127.0.0.1:8787/api/voice/status', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ asr: { available: true }, wake: { available: true }, tts: { available: true } })
  }));
  await page.route('http://127.0.0.1:8787/api/voice/synthesize', async route => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: 'audio/wav', body: Buffer.from('RIFF0000WAVE') });
  });
  await page.addInitScript(() => {
    class FakeAudio {
      play() { setTimeout(() => this.onended?.(), 5); return Promise.resolve(); }
      pause() {}
    }
    window.Audio = FakeAudio;
    window.speechSynthesis = { getVoices: () => [], cancel() {}, speak() {}, addEventListener() {} };
    window.SpeechSynthesisUtterance = class {};
  });

  await page.goto(`http://127.0.0.1:8096/index.html?tts-rhythm=${Date.now()}#ask-xiaochui`, { waitUntil: 'networkidle' });
  await page.evaluate(text => window.dispatchEvent(new CustomEvent('yingge:agent-event', { detail: { type: 'done', text } })), answer);
  await page.waitForTimeout(700);

  const result = {
    calls: requests.length,
    texts: requests.map(item => item.text),
    speeds: requests.map(item => item.speed),
    reconstructed: requests.map(item => item.text).join('')
  };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  if (result.calls !== 3 || result.reconstructed !== answer || result.texts.some(text => text.length > 30) || result.speeds.some(speed => speed !== 1.04)) process.exitCode = 1;
})();
