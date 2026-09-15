const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let chromium;
try { ({chromium}=require('playwright')); }
catch { ({chromium}=require('C:/Users/20549/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }

(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'});
  const errors = [];
  try {
    for (const viewport of [{width:1440,height:900,name:'desktop'},{width:390,height:844,name:'mobile'}]) {
      const page = await browser.newPage({viewport:{width:viewport.width,height:viewport.height}, reducedMotion:'reduce'});
      page.on('console', message => { if (message.type() === 'error') errors.push(`${viewport.name}: ${message.text()}`); });
      await page.goto('http://127.0.0.1:8097/spread.html', {waitUntil:'networkidle'});
      assert.equal(await page.locator('.event-entry').count(), 3, `${viewport.name} 未渲染三项事件`);
      assert.equal(await page.locator('.event-media.media-awaiting').count(),3,`${viewport.name} 待授权图片没有全部降级为安全占位`);
      assert.equal(await page.locator('.event-media img').count(),0,`${viewport.name} 公开了尚未授权的真实图片`);
      assert.ok(await page.locator('.source-card').count() >= 3, `${viewport.name} 没有直接显示文字来源卡`);
      assert.equal(await page.locator('.event-story').count(),1,`${viewport.name} 泰国事件没有形成重点叙事`);
      const width = await page.evaluate(() => ({scroll:document.documentElement.scrollWidth, client:document.documentElement.clientWidth}));
      assert.ok(width.scroll <= width.client + 1, `${viewport.name} 存在横向溢出：${width.scroll}/${width.client}`);
      await page.locator('[data-source]').first().click();
      assert.equal(await page.locator('#sourceDialog').evaluate(node => node.open), true, `${viewport.name} 来源抽屉未打开`);
      assert.ok(await page.locator('.dialog-sources a').count() >= 1, `${viewport.name} 来源抽屉没有可点击来源`);
      if (process.env.CURATION_QA_OUTPUT) {
        fs.mkdirSync(process.env.CURATION_QA_OUTPUT, {recursive:true});
        await page.screenshot({path:path.join(process.env.CURATION_QA_OUTPUT, `spread-${viewport.name}.png`), fullPage:true});
      }
      await page.close();
    }

    const catalog = await browser.newPage({viewport:{width:1440,height:900}, reducedMotion:'reduce'});
    catalog.on('console', message => { if (message.type() === 'error') errors.push(`catalog: ${message.text()}`); });
    await catalog.goto('http://127.0.0.1:8097/content.html', {waitUntil:'networkidle'});
    assert.equal(await catalog.locator('a[href="spread.html"]').count(), 1, '馆藏总览没有显示英歌出海入口');
    await catalog.close();

    const admin = await browser.newPage({viewport:{width:1440,height:900}});
    await admin.addInitScript(() => { window.CURATION_API='http://127.0.0.1:8789'; sessionStorage.setItem('yingge-admin-token','publisher-secret'); });
    admin.on('console', message => { if (message.type() === 'error') errors.push(`admin: ${message.text()}`); });
    await admin.goto('http://127.0.0.1:8097/admin/curation.html', {waitUntil:'networkidle'});
    await admin.waitForSelector('.event-card');
    assert.equal(await admin.locator('.event-card').count(), 3, '后台没有显示三项活动');
    assert.match((await admin.locator('#connectionState').textContent()).trim(), /^已连接/, '后台未连接策展服务');
    assert.equal(await admin.locator('.chapter-card').count(), 1, '后台没有显示首个章节');
    assert.equal(await admin.locator('.media-card').count(), 3, '后台没有显示三项候选媒体');
    assert.equal(await admin.locator('.private-media-preview').count(),3,'后台没有为三项候选媒体建立安全预览位');
    assert.equal(await admin.locator('[data-private-status]').filter({hasText:'私有候选库未连接'}).count(),3,'私有根未配置时没有自然提示');
    assert.equal(await admin.locator('.media-review-flow').count(),3,'后台没有显示四阶段授权审阅流程');
    assert.equal(await admin.locator('.review-dossier').count(),3,'后台没有把来源材料、活动和授权放入同一审阅档案');
    assert.equal(await admin.locator('.media-review-flow li').count(),12,'后台四阶段流程不完整');
    assert.equal(await admin.locator('.media-review-flow li[data-state="current"]').count(),3,'三项待授权媒体没有明确当前阶段');
    assert.equal(await admin.locator('.authorization-checklist').count(),3,'后台没有显示逐项授权核验清单');
    assert.equal(await admin.locator('img[src^="file:"]').count(),0,'后台 DOM 泄漏了本地文件 URL');
    await admin.locator('#loadPreview').click();
    await admin.waitForSelector('#previewContent:not([hidden])');
    assert.equal(await admin.locator('#confirmPublish').isEnabled(), true, '确认发布按钮未在预览后启用');
    const rejectedOperation = await admin.request.post('http://127.0.0.1:8789/api/admin/curation/operations', {headers:{Authorization:'Bearer publisher-secret'},data:{operation:'update_event',id:'x',input:{expected_version:1},unexpected:true}});
    assert.equal(rejectedOperation.status(), 400, '操作 API 未拒绝未知顶层字段');
    const width = await admin.evaluate(() => ({scroll:document.documentElement.scrollWidth, client:document.documentElement.clientWidth}));
    assert.ok(width.scroll <= width.client + 1, `后台存在横向溢出：${width.scroll}/${width.client}`);
    if (process.env.CURATION_QA_OUTPUT) await admin.screenshot({path:path.join(process.env.CURATION_QA_OUTPUT, 'curation-admin.png'), fullPage:true});
    await admin.close();

    const marker = '<img src=x onerror="window.__curationXss=1">';
    const hostilePayload = {
      catalog:{page_coverage:[{page:'spread.html',label:'测试',content_status:marker,note:'测试'}],exhibits:[{events:[{
        id:'hostile-event',event_title:marker,date:'2026-08-29',location:'测试地点',people_or_team:'测试队伍',caption:marker,
        workflow_status:'pending_review',rights_status:marker,privacy_risk:'medium',media_asset_id:'asset',media_dimensions:'1x1',media_sha256:'abc',source_paragraph:'1',public_media:false,
        sources:[{label:marker,url:'https://example.com',source_type:marker}],
      }]}]},
      summary:{events:{total:1},exhibits:{published:0},rights:{pending_authorization:0},public_media:0},
    };
    const hostileAdmin = await browser.newPage({viewport:{width:900,height:700}});
    await hostileAdmin.addInitScript(payload => {
      const nativeFetch = window.fetch.bind(window);
      window.fetch = (url, options) => {
        const value=String(url);
        if(value.includes('/api/admin/session')) return Promise.resolve(new Response(JSON.stringify({actor:{id:'test-author',role:'author'}}),{status:200,headers:{'content-type':'application/json'}}));
        if(value.includes('/api/admin/curation/audit')) return Promise.resolve(new Response(JSON.stringify({entries:[]}),{status:200,headers:{'content-type':'application/json'}}));
        if(value.includes('/api/admin/curation')) return Promise.resolve(new Response(JSON.stringify(payload), {status:200,headers:{'content-type':'application/json'}}));
        return nativeFetch(url, options);
      };
    }, hostilePayload);
    await hostileAdmin.goto('http://127.0.0.1:8097/admin/curation.html', {waitUntil:'networkidle'});
    await hostileAdmin.waitForSelector('.event-card');
    assert.equal(await hostileAdmin.locator('img[src="x"]').count(), 0, '后台把策展字符串当作 HTML 执行');
    assert.equal(await hostileAdmin.evaluate(() => window.__curationXss || 0), 0, '后台触发了策展字段中的 onerror');
    await hostileAdmin.close();

    const hostilePublic = await browser.newPage({viewport:{width:900,height:700}, reducedMotion:'reduce'});
    await hostilePublic.addInitScript(({marker}) => {
      const payload={exhibits:[{id:'yingge-across-borders',title:'测试',summary:'测试',boundary_note:marker,events:[{id:'hostile-public',event_title:marker,date:'2026-08-29',location:marker,people_or_team:marker,caption:marker,rights_status:'pending_authorization',public_media:true,media_url:'file:///D:/private/candidate.png',sources:[{label:marker,url:'https://example.com',source_type:marker}]}]}]};
      window.fetch = () => Promise.resolve(new Response(JSON.stringify(payload), {status:200,headers:{'content-type':'application/json'}}));
    }, {marker});
    await hostilePublic.goto('http://127.0.0.1:8097/spread.html', {waitUntil:'networkidle'});
    await hostilePublic.waitForSelector('.event-entry');
    await hostilePublic.locator('[data-source]').click();
    assert.equal(await hostilePublic.locator('img[src="x"]').count(), 0, '公众专题把策展字符串当作 HTML 执行');
    assert.equal(await hostilePublic.locator('img[src^="file:"]').count(),0,'公众专题接受了私有文件 URL');
    assert.equal(await hostilePublic.locator('.media-awaiting').count(),1,'非法图片 URL 没有降级为安全占位');
    assert.equal(await hostilePublic.evaluate(() => window.__curationXss || 0), 0, '公众专题触发了策展字段中的 onerror');
    await hostilePublic.close();
    assert.deepEqual(errors, [], `浏览器控制台错误：${errors.join(' | ')}`);
    console.log('curation browser ok: desktop, mobile, admin');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
