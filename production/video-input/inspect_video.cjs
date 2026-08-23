const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const inputName = process.argv[2] || 'yingge-character-action-v1.mp4';
  const input = path.resolve(__dirname, 'output', inputName);
  const inspectionName = path.parse(inputName).name;
  const outDir = path.resolve(__dirname, 'output', 'inspection', inspectionName);
  fs.mkdirSync(outDir, { recursive: true });
  const videoData = fs.readFileSync(input).toString('base64');

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.setContent(`<!doctype html><style>*{box-sizing:border-box}html,body{margin:0;background:#111;width:100%;height:100%;overflow:hidden}video{width:100%;height:100%;object-fit:contain}</style><video id="v" muted preload="auto" src="data:video/mp4;base64,${videoData}"></video>`);
  const meta = await page.evaluate(async () => {
    const v = document.querySelector('#v');
    await new Promise((resolve, reject) => {
      if (v.readyState >= 1) return resolve();
      v.onloadedmetadata = resolve;
      v.onerror = () => reject(new Error(`video metadata failed: ${v.error?.code || 'unknown'}`));
    });
    return { duration: v.duration, width: v.videoWidth, height: v.videoHeight };
  });
  const times = [0, meta.duration * 0.25, meta.duration * 0.5, meta.duration * 0.75, Math.max(0, meta.duration - 0.04)];
  for (let i = 0; i < times.length; i++) {
    await page.evaluate(async (time) => {
      const v = document.querySelector('#v');
      await new Promise((resolve) => {
        v.onseeked = resolve;
        v.currentTime = time;
      });
    }, times[i]);
    await page.screenshot({ path: path.join(outDir, `${String(i + 1).padStart(2, '0')}-${times[i].toFixed(2)}s.png`) });
  }
  fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify({ ...meta, times }, null, 2));
  console.log(JSON.stringify({ ...meta, times, outDir }, null, 2));
  await browser.close();
})();
