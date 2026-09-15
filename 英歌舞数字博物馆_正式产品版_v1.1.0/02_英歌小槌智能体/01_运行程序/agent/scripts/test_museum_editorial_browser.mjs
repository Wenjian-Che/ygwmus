import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const candidates = [
  process.env.CODEX_PLAYWRIGHT_PATH,
  'playwright',
  path.join(process.env.USERPROFILE || '', '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
].filter(Boolean);
let playwright;
for (const candidate of candidates) {
  try {
    playwright = candidate === 'playwright' ? require(candidate) : require(candidate);
    break;
  } catch {}
}
if (!playwright) throw new Error('Playwright is required for the editorial browser regression');

const base = process.env.MUSEUM_BASE_URL || 'http://127.0.0.1:8096';
const baseOrigin = new URL(base).origin;
const pages = ['archive.html','content.html','learn.html','watch.html','characters.html','formation.html','sound.html','regions.html','spread.html','framework-museum.html'];
const browserExecutables = [
  process.env.PLAYWRIGHT_BROWSER_EXECUTABLE,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
].filter(Boolean);
const executablePath = browserExecutables.find(candidate => fs.existsSync(candidate));
const browser = await playwright.chromium.launch({
  headless:true,
  ...(executablePath ? {executablePath} : {})
});

try {
  const homeContext = await browser.newContext({viewport:{width:1745,height:900},deviceScaleFactor:1});
  const homePage = await homeContext.newPage();
  await homePage.goto(`${base}/index.html?header-isolation-qa=1`,{waitUntil:'domcontentloaded'});
  await homePage.waitForTimeout(250);
  const homeEditorialLoaded = await homePage.evaluate(() => [...document.styleSheets]
    .some(sheet => String(sheet.href || '').includes('museum-editorial.css')));
  assert.equal(homeEditorialLoaded,false,'homepage must not load the secondary-page editorial stylesheet');
  await homeContext.close();

  for (const viewport of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]) {
    const context = await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1});
    for (const pageName of pages) {
      const page = await context.newPage();
      const errors=[];
      const networkErrors=[];
      page.on('pageerror',error=>errors.push(error.message));
      page.on('requestfailed',request=>{
        try {
          if(new URL(request.url()).origin===baseOrigin) networkErrors.push(`${request.method()} ${request.url()} ${request.failure()?.errorText||'failed'}`);
        } catch {}
      });
      page.on('response',response=>{
        try {
          if(new URL(response.url()).origin===baseOrigin&&response.status()>=400) networkErrors.push(`${response.status()} ${response.url()}`);
        } catch {}
      });
      await page.goto(`${base}/${pageName}?editorial-qa=1`,{waitUntil:'networkidle'});
      await page.waitForTimeout(250);
      const result = await page.evaluate(async ({pageName,viewportName}) => {
        const header=document.querySelector('.site-header,.spread-nav,.museum-shell-nav');
        const summary=header?.querySelector('.museum-menu>summary');
        const primary=[...header?.querySelectorAll('.museum-primary-link')||[]];
        const reading=document.querySelector('.museum-heading h2,.definition h2,.museum-lead,.spread-thesis');
        const note=document.querySelector('.source-note');
        await document.fonts.load('400 18px "Yingge Source Han Serif"');
        const rect=header?.getBoundingClientRect();
        return {
          pageName,
          viewportName,
          overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
          header:rect?{top:rect.top,left:rect.left,right:rect.right,width:rect.width,height:rect.height}:null,
          labels:[...header?.querySelectorAll('a,summary')||[]].map(node=>node.textContent.trim()),
          summaryVisible:summary?getComputedStyle(summary).display!=='none':false,
          visiblePrimary:primary.filter(node=>getComputedStyle(node).display!=='none').length,
          readingFont:reading?getComputedStyle(reading).fontFamily:'',
          noteSize:note?parseFloat(getComputedStyle(note).fontSize):null,
          fontReady:document.fonts.check('400 18px "Yingge Source Han Serif"')
        };
      },{pageName,viewportName:viewport.name});
      assert.ok(result.header, `${pageName} has no museum header`);
      assert.ok(result.header.width <= 1281, `${pageName} header exceeds the 1280px measure`);
      assert.ok(result.header.left >= 7, `${pageName} header touches the viewport edge`);
      assert.ok(result.header.right <= viewport.width - 7, `${pageName} header overflows the viewport`);
      assert.ok(result.overflow <= 2, `${pageName} has ${result.overflow}px horizontal overflow at ${viewport.name}`);
      assert.ok(result.labels.includes('首页') && result.labels.includes('馆藏总览') && result.labels.includes('认识英歌') && result.labels.includes('在线展馆'), `${pageName} navigation is incomplete`);
      assert.ok(!result.labels.includes('返回门厅'), `${pageName} retains a duplicate home action`);
      assert.ok(result.summaryVisible, `${pageName} exhibit menu is not visible`);
      if (viewport.name==='mobile') assert.equal(result.visiblePrimary,0,`${pageName} mobile header should collapse direct links`);
      if (!['framework-museum.html'].includes(pageName) && result.readingFont) {
        assert.match(result.readingFont,/Yingge Source Han Serif/,`${pageName} does not use the editorial font`);
        assert.ok(result.fontReady,`${pageName} editorial font did not finish loading`);
      }
      if (result.noteSize!==null) assert.ok(result.noteSize>=14,`${pageName} source note is ${result.noteSize}px at ${viewport.name}, smaller than 14px`);
      assert.deepEqual(errors,[],`${pageName} page errors: ${errors.join('; ')}`);
      assert.deepEqual(networkErrors,[],`${pageName} local resource failures: ${networkErrors.join('; ')}`);
      if (pageName==='archive.html') {
        const shot=path.join(os.tmpdir(),`yingge-archive-${viewport.name}.png`);
        await page.screenshot({path:shot,fullPage:true});
        assert.ok(fs.statSync(shot).size>10_000);
      }
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
}

console.log('museum editorial browser regression passed on desktop and mobile');
