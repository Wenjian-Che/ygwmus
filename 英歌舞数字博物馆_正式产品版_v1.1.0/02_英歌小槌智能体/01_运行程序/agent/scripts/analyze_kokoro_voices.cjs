const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  const page = await browser.newPage();
  await page.goto('https://k2-fsa.github.io/sherpa/onnx/tts/all/Chinese-English/kokoro-multi-lang-v1_1.html', { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(async () => {
    const context = new AudioContext();
    const median = values => { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.floor(sorted.length / 2)] || 0; };
    const names = ['009','010','011','012','013','014','015','016','020','025','029','030','031','033','034','035','037','041','045','050','052','053','054','055','056','057','058','061','062','063','064','065','066','068','069','080','081','082','089','091','095','096','097','098','100'];
    const rows = [];
    for (let offset = 0; offset < names.length; offset += 1) {
      const sid = 58 + offset, name = `zm_${names[offset]}`;
      const response = await fetch(`/sherpa/onnx/tts/all/kokoro/v1.1-zh/mp3/${sid}-${name}.mp3`);
      const audio = await context.decodeAudioData(await response.arrayBuffer());
      const samples = audio.getChannelData(0), rate = audio.sampleRate, pitches = [];
      const frame = Math.floor(rate * .04), step = Math.floor(rate * .08);
      for (let start = 0; start + frame < samples.length; start += step) {
        let energy = 0; for (let i = 0; i < frame; i += 1) energy += samples[start + i] ** 2;
        if (Math.sqrt(energy / frame) < .025) continue;
        let bestLag = 0, best = 0;
        for (let lag = Math.floor(rate / 240); lag <= Math.floor(rate / 75); lag += 1) {
          let sum = 0, left = 0, right = 0;
          for (let i = 0; i < frame - lag; i += 1) { const a = samples[start + i], b = samples[start + i + lag]; sum += a * b; left += a * a; right += b * b; }
          const score = sum / Math.sqrt(left * right || 1);
          if (score > best) { best = score; bestLag = lag; }
        }
        if (best > .55 && bestLag) pitches.push(rate / bestLag);
      }
      rows.push({ sid, name, f0: Math.round(median(pitches)), voicedFrames: pitches.length });
    }
    await context.close();
    return rows.sort((a, b) => b.f0 - a.f0);
  });
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
