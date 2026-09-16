(function () {
  'use strict';
  if (window.MugedaYinggeAgent) return;

  var script = document.currentScript;
  var config = Object.assign({
    apiBase: 'https://yinggemus.cn',
    appId: 'yingge-h5',
    title: '英歌小槌',
    scene: 'general',
    autoOpen: false
  }, window.YINGGE_MUGEDA_AGENT_CONFIG || {});
  if (script) {
    config.scene = script.dataset.scene || config.scene;
    config.autoOpen = script.dataset.autoOpen === 'true' || config.autoOpen;
  }

  var scenes = {
    general: ['英歌舞是什么？', '英歌舞为什么要持双槌？', '英歌脸谱有什么特点？'],
    face: ['英歌脸谱为什么有不同颜色和图案？', '能只靠脸谱颜色判断角色吗？', '脸谱与人物形象有什么关系？'],
    costume: ['英歌舞服装有什么特点？', '英歌舞常见道具有哪些？', '不同队伍的服饰为什么不同？'],
    formation: ['英歌舞常见阵法有哪些？', '英歌阵法为什么会变化？', '阵法与节奏有什么关系？'],
    history: ['英歌舞是怎样形成和传承的？', '英歌舞有哪些起源说法？', '英歌舞为什么能延续至今？']
  };

  function ready(fn) {
    if (document.body) fn();
    else document.addEventListener('DOMContentLoaded', fn, { once: true });
  }

  ready(function () {
    var host = document.createElement('div');
    host.id = 'yingge-mugeda-agent';
    host.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483000;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;';
    (document.documentElement || document.body).appendChild(host);
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    root.innerHTML = '<style>' +
      ':host,*{box-sizing:border-box}button,input{font:inherit}.launcher{width:54px;height:72px;border:0;border-radius:0;padding:0;background:transparent;filter:drop-shadow(0 7px 8px rgba(8,24,17,.28));cursor:pointer;transition:.2s transform;touch-action:none}.launcher:hover{transform:translateY(-2px)}.launcher.listening{animation:pulse .8s ease-in-out infinite}.launcher img{width:100%;height:100%;object-fit:contain}.panel{position:absolute;right:0;bottom:78px;width:min(340px,calc(100vw - 24px));height:min(510px,calc(100vh - 105px));display:none;grid-template-rows:auto auto 1fr auto auto;background:#f8faf8;color:#1d2c25;border:1px solid rgba(62,91,76,.24);border-radius:18px;overflow:hidden;box-shadow:0 18px 56px rgba(6,24,15,.28)}.panel.open{display:grid;animation:enter .24s ease-out}@keyframes enter{from{opacity:0;transform:translateY(12px) scale(.98)}}@keyframes pulse{50%{transform:scale(1.08);filter:drop-shadow(0 0 10px #f15a4d)}}.head{display:flex;align-items:center;gap:9px;padding:11px 13px;background:#263b31;color:white}.avatar{width:31px;height:43px;object-fit:contain}.head-copy{min-width:0;flex:1}.head strong{display:block;font-size:15px}.status{font-size:11px;color:#cde6d8;margin-top:2px}.close{border:0;color:white;background:rgba(255,255,255,.12);border-radius:9px;width:31px;height:31px;cursor:pointer}.scene{padding:7px 12px;background:#edf4ef;color:#5a6e63;font-size:11px}.messages{overflow:auto;padding:12px;scroll-behavior:smooth}.message{max-width:90%;padding:9px 11px;margin:0 0 9px;border-radius:13px;line-height:1.58;font-size:13px;white-space:pre-wrap}.user{margin-left:auto;background:#263b31;color:white;border-bottom-right-radius:4px}.assistant{background:white;border:1px solid #dce6df;border-bottom-left-radius:4px}.thinking{color:#597065}.thinking:after{content:"";display:inline-block;width:18px;height:4px;margin-left:8px;border-radius:9px;background:linear-gradient(90deg,#2e9567 35%,#cbd9d1 35%);background-size:12px 4px;animation:load .7s linear infinite}@keyframes load{to{background-position:12px 0}}.sources{margin-top:8px;padding-top:7px;border-top:1px solid #e3ebe6;font-size:11px}.sources a{display:block;color:#247653;text-decoration:none;margin-top:4px}.prompts{display:flex;gap:6px;overflow:auto;padding:0 10px 8px}.prompt{flex:none;border:1px solid #cddad2;background:white;color:#344b3f;border-radius:999px;padding:6px 9px;font-size:11px;cursor:pointer}.form{display:grid;grid-template-columns:auto 1fr auto;gap:6px;padding:9px;border-top:1px solid #dbe5de;background:white}.form input{min-width:0;border:1px solid #bdcdc3;border-radius:11px;padding:9px 10px;outline:none}.form input:focus{border-color:#2e9567}.send,.mic,.speak{border:0;border-radius:11px;background:#263b31;color:white;padding:0 11px;cursor:pointer}.mic{background:#edf3ef;color:#263b31;padding:0 9px}.mic.active{background:#d93d32;color:white}.privacy{grid-column:1/-1;color:#718078;font-size:9px}.error{color:#ff8177}.welcome{font-size:12px;color:#496056;margin-bottom:10px}.toolbar{display:flex;gap:7px;margin-top:7px}.speak{font-size:10px;padding:5px 7px;background:#edf3ef;color:#345044}@media(max-width:520px){.panel{position:fixed;inset:auto 8px 82px auto;width:min(320px,calc(100vw - 16px));height:min(480px,calc(100vh - 100px));border-radius:16px}.launcher{width:48px;height:66px}.form input{font-size:16px}.message{font-size:13px}}@media(prefers-reduced-motion:reduce){*{animation:none!important;scroll-behavior:auto!important}}' +
      '</style><button class="launcher" aria-label="点击打开，左右拖动停靠" aria-expanded="false"><img src="https://yinggemus.cn/assets/ygw-xiaochui.png" alt="英歌小槌"></button>' +
      '<section class="panel" role="dialog" aria-label="英歌小槌" aria-hidden="true"><header class="head"><img class="avatar" src="https://yinggemus.cn/assets/ygw-xiaochui.png" alt=""><div class="head-copy"><strong>' + escapeHtml(config.title) + '</strong><div class="status" role="status" aria-live="polite">正在连接知识库</div></div><button class="close" aria-label="关闭">×</button></header><div class="scene">点击“语音输入”开始识别，再次点击结束</div><main class="messages" role="log" aria-live="polite"><div class="welcome">你好呀，我是英歌小槌。英歌文化、日常常识，或你今天想聊的事，都可以问我。</div></main><div class="prompts"></div><form class="form"><button class="mic" type="button" aria-label="点击开始语音输入" aria-pressed="false" title="点击开始语音输入"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6"/></svg><span>语音输入</span></button><input maxlength="500" placeholder="问问英歌小槌……" aria-label="输入问题"><button class="send" type="submit">发送</button><div class="privacy">语音仅用于实时识别，不保存原始录音</div></form></section>';
    root.innerHTML += '<style>' +
      '.panel{bottom:10px;width:min(590px,calc(100vw - 82px));height:min(510px,calc(100vh - 38px));grid-template-rows:auto auto 1fr auto auto;border-radius:21px;background:#fffdf8;color:#203128}' +
      '.launcher{width:58px;height:90px;position:relative;z-index:3;transition:opacity .18s ease,filter .2s;user-select:none;-webkit-user-select:none}.launcher.dragging{transition:none;cursor:grabbing}.launcher.panel-open{opacity:0;visibility:hidden;pointer-events:none;transform:none}:host(.dock-left) .panel{left:0;right:auto}' +
      '.head{min-height:49px;padding:10px 16px;background:#f6efe1;color:#203128;border-bottom:1px solid #e3dac8}.avatar{display:none}.head-copy{display:flex;align-items:center;gap:10px}.head strong{font-size:16px}.status{margin:0;color:#33805b}.close{margin-left:auto;color:#203128;background:transparent;border:1px solid #cad5cd}' +
      '.scene{padding:7px 16px;background:#eef4ef;color:#74533a;border-bottom:1px solid #dce5de}.messages{padding:13px 16px;overflow-x:hidden}.welcome{padding:10px 12px;background:#f2f6f2;border-radius:12px}.message{max-width:100%;margin-bottom:9px}.message.user{max-width:72%;padding:8px 12px}.message.assistant{display:grid;grid-template-columns:minmax(0,1fr) 132px;column-gap:13px;padding:12px 13px;line-height:1.65;white-space:normal}.message.assistant .answer-copy{min-width:0}.answer-copy h3,.answer-copy h4{margin:0 0 6px;color:#183c2b;line-height:1.35}.answer-copy h3{font-size:15px}.answer-copy h4{font-size:13px}.answer-copy p{margin:0 0 7px;color:#35483f}.answer-copy ul{margin:3px 0 8px;padding-left:18px}.answer-copy li{margin:3px 0;color:#35483f}.answer-copy li::marker{color:#df4938}.answer-copy strong{color:#b93629;font-weight:700}.answer-boundary{margin:9px 0 0;padding:8px 9px;border-left:3px solid #d79b3e;border-radius:7px;background:#fff7e9;color:#6f5227;font-size:11px}.message.assistant .sources{grid-column:2;grid-row:1/4;margin:0;padding:0 0 0 11px;border-top:0;border-left:1px solid #dce5df;color:#5b6d63}.sources:before{content:"依据";display:block;margin-bottom:5px;color:#183c2b;font-weight:700}.sources a{padding:6px 7px;border-radius:8px;background:#f1f6f2;color:#247653;line-height:1.35}.message.assistant .toolbar{grid-column:1}.message.assistant.thinking{display:block}.message.assistant.error-message{display:block;border-color:#efc7c1;background:#fff8f6;color:#a8342a}.prompts{padding:0 14px 7px}.form{grid-template-columns:auto minmax(0,1fr) auto;padding:9px 14px}.form input{font-size:12px}.mic{background:#df4938;color:white;min-width:40px}.mic.active{animation:micPulse 1s ease-in-out infinite}.mic.active:after{content:" 聆听中"}@keyframes micPulse{50%{box-shadow:0 0 0 6px rgba(223,73,56,.16)}}.privacy{position:absolute;left:18px;bottom:2px;opacity:0;pointer-events:none}' +
      '@media(max-width:620px) and (orientation:landscape){.panel{width:min(590px,calc(100vw - 82px));height:calc(100vh - 38px)}.message.assistant{display:block}}' +
      '@media(orientation:portrait){.launcher:not(.panel-open){transform:rotate(90deg)}.panel,.panel.open{position:fixed;left:50%;top:50%;right:auto;bottom:auto;width:min(520px,calc(100vh - 64px));height:min(340px,calc(100vw - 48px));transform:translate(-50%,-50%) rotate(90deg) scale(var(--panel-scale,1));animation:none}:host(.dock-left) .panel{left:50%;right:auto}.message.assistant{display:block}.messages{padding:12px}.form input{font-size:16px}}' +
      '.message.assistant{display:block;padding:14px 15px;line-height:1.72}.answer-copy h3{font-size:16px}.answer-copy p{margin-bottom:9px}.answer-copy ol{margin:4px 0 10px;padding-left:21px}.message.assistant .sources{display:block;margin:11px 0 0;padding:0;border:1px solid #dce7df;border-radius:10px;background:#f6faf7;overflow:hidden}.sources:before{display:none}.sources summary{padding:9px 11px;color:#183c2b;font-weight:700;cursor:pointer;list-style:none}.sources summary::-webkit-details-marker{display:none}.sources summary:after{content:"＋";float:right}.sources[open] summary:after{content:"－"}.source-list{padding:0 10px 9px}.sources a{display:flex;gap:6px;padding:7px 8px;border:1px solid #e2ebe5;background:white}.sources a:before{content:"↗"}.message.assistant .toolbar{display:flex;margin-top:10px}.speak.reading{background:#df4938;color:white}.speak[disabled]{opacity:.62;cursor:wait}.mic{display:flex;align-items:center;justify-content:center;gap:5px;min-width:82px;min-height:44px;padding:0 10px;touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}.mic svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}.mic.active:after{display:none}.mic.active span{font-weight:700;font-variant-numeric:tabular-nums}' +
      '.messages{min-height:0;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y}.messages.touch-scrolling{scroll-behavior:auto}.status{display:inline-flex!important;align-items:center;gap:6px;min-height:22px;padding:3px 8px;border-radius:999px;background:rgba(46,149,103,.12);transition:background .2s,color .2s,transform .2s}.status:before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor;opacity:.8}.status.voice-live{color:#b93629;background:#fff0ec}.status.voice-live:before{animation:voiceDot .9s ease-in-out infinite}.status.processing{color:#8a5a13;background:#fff5df}.status.processing:before{animation:voiceSpin .8s linear infinite;border:2px solid currentColor;border-right-color:transparent;background:transparent}.status.success{animation:statusArrive .28s ease-out}.status.error{color:#b52f27;background:#fff0ee}@keyframes voiceDot{50%{transform:scale(1.8);opacity:.28}}@keyframes voiceSpin{to{transform:rotate(360deg)}}@keyframes statusArrive{from{transform:translateY(-3px);opacity:.45}}' +
      '.answer-copy{animation:answerReveal .3s ease-out}.answer-copy>p:first-child{margin:0 0 11px;padding:10px 11px;border-left:3px solid #2e9567;border-radius:8px;background:linear-gradient(135deg,#f0f7f2,#f8fbf9);color:#203d30;font-weight:600}.answer-copy>p:not(:first-child){padding-left:1px}.answer-copy h3,.answer-copy h4{display:flex;align-items:center;gap:7px;margin-top:12px}.answer-copy h3:before,.answer-copy h4:before{content:"";width:5px;height:16px;border-radius:9px;background:#df4938}.answer-copy ul,.answer-copy ol{padding:8px 10px 8px 27px;border-radius:9px;background:#faf7f0}.toolbar:before{content:"回答完成";align-self:center;margin-right:auto;color:#54806a;font-size:10px}.work-state{padding:12px 13px!important;background:linear-gradient(135deg,#f7fbf8,#fff)!important}.work-title{display:flex;align-items:center;gap:8px;color:#244a38;font-weight:700}.work-spinner{width:15px;height:15px;border:2px solid #c8ded1;border-top-color:#2e9567;border-radius:50%;animation:voiceSpin .8s linear infinite}.work-steps{display:grid;gap:6px;margin-top:10px}.work-step{display:flex;align-items:center;gap:8px;color:#88968f;font-size:11px;transition:.25s color,.25s transform}.work-step:before{content:"";width:6px;height:6px;border-radius:50%;background:#d4ddd7}.work-step.active{color:#276f4e;transform:translateX(3px)}.work-step.active:before{background:#2e9567;box-shadow:0 0 0 4px rgba(46,149,103,.13);animation:voiceDot .9s ease-in-out infinite}.work-step.done{color:#5a7466}.work-step.done:before{background:#2e9567}.streaming-copy{position:relative}.streaming-copy:after{content:"";display:inline-block;width:2px;height:1em;margin-left:3px;vertical-align:-2px;background:#2e9567;animation:caretBlink .75s steps(1) infinite}@keyframes caretBlink{50%{opacity:0}}@keyframes answerReveal{from{opacity:.25;transform:translateY(5px)}}' +
      '</style>';

    var panel = root.querySelector('.panel');
    var launcher = root.querySelector('.launcher');
    var close = root.querySelector('.close');
    var status = root.querySelector('.status');
    var messages = root.querySelector('.messages');
    var form = root.querySelector('.form');
    var input = root.querySelector('input');
    var send = root.querySelector('.send');
    var mic = root.querySelector('.mic');
    var micLabel = mic.querySelector('span');
    var prompts = root.querySelector('.prompts');
    var conversationId = sessionStorage.getItem('yingge-mugeda-conversation') || ('mugeda-' + Date.now() + '-' + Math.random().toString(36).slice(2));
    var history = [];
    sessionStorage.setItem('yingge-mugeda-conversation', conversationId);
    function dock(side, animate) {
      side = side === 'left' ? 'left' : 'right';
      host.classList.toggle('dock-left', side === 'left');
      host.style.left = side === 'left' ? '16px' : 'auto'; host.style.right = side === 'right' ? '16px' : 'auto';
      launcher.classList.toggle('dragging', !animate);
      try { localStorage.setItem('yingge-mugeda-dock', side); } catch (_) {}
      if (!animate) requestAnimationFrame(function () { launcher.classList.remove('dragging'); });
    }
    try { dock(localStorage.getItem('yingge-mugeda-dock') || 'right', true); } catch (_) { dock('right', true); }

    function escapeHtml(text) {
      return String(text || '').replace(/[&<>"']/g, function (ch) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]; });
    }
    function setStatus(text, bad) {
      var phase = bad
        ? ' error'
        : (/正在识别|正在连接语音|正在聆听/.test(text)
          ? ' voice-live'
          : (/正在确认|正在结束|正在识别刚才|恢复中|正在思考|正在组织/.test(text)
            ? ' processing'
            : (/完成|已连接|请确认/.test(text) ? ' success' : '')));
      status.textContent = text;
      status.className = 'status' + phase;
    }
    var suspendedMedia = [];
    function suspendPageAudio() {
      suspendedMedia = [];
      [window.backgroundMusic, window.globalSecondAudio, window.globalThirdAudio, window.globalFourthAudio].forEach(function (media) {
        if (media && typeof media.pause === 'function' && media.paused === false) { suspendedMedia.push(media); try { media.pause(); } catch (_) {} }
      });
    }
    function resumePageAudio() {
      var mediaList = suspendedMedia.slice(); suspendedMedia = [];
      mediaList.forEach(function (media) { try { var promise = media.play(); if (promise && promise.catch) promise.catch(function () {}); } catch (_) {} });
    }
    function syncVisualViewport() { var viewport = window.visualViewport; host.style.setProperty('--vv-height', (viewport ? viewport.height : window.innerHeight) + 'px'); host.style.setProperty('--vv-top', (viewport ? viewport.offsetTop : 0) + 'px'); }
    syncVisualViewport(); window.addEventListener('resize', syncVisualViewport); if (window.visualViewport) { window.visualViewport.addEventListener('resize', syncVisualViewport); window.visualViewport.addEventListener('scroll', syncVisualViewport); }
    function fitPanelToViewport() {
      if (!panel.classList.contains('open') || window.innerHeight <= window.innerWidth) { panel.style.removeProperty('--panel-scale'); panel.style.left = ''; panel.style.top = ''; return; }
      var viewport = window.visualViewport, vw = viewport ? viewport.width : document.documentElement.clientWidth, vh = viewport ? viewport.height : document.documentElement.clientHeight, ox = viewport ? viewport.offsetLeft : 0, oy = viewport ? viewport.offsetTop : 0;
      panel.style.setProperty('--panel-scale', '1'); panel.style.left = '50%'; panel.style.top = '50%';
      requestAnimationFrame(function () {
        var rect = panel.getBoundingClientRect(), scale = Math.min(1, (vw - 24) / Math.max(1, rect.width), (vh - 24) / Math.max(1, rect.height)); panel.style.setProperty('--panel-scale', scale.toFixed(3));
        requestAnimationFrame(function () { var next = panel.getBoundingClientRect(), dx = ox + vw / 2 - (next.left + next.width / 2), dy = oy + vh / 2 - (next.top + next.height / 2); panel.style.left = 'calc(50% + ' + dx.toFixed(1) + 'px)'; panel.style.top = 'calc(50% + ' + dy.toFixed(1) + 'px)'; });
      });
    }
    function open() { panel.classList.add('open'); launcher.classList.add('panel-open'); panel.setAttribute('aria-hidden', 'false'); launcher.setAttribute('aria-expanded', 'true'); syncVisualViewport(); fitPanelToViewport(); if (window.matchMedia('(pointer:fine)').matches) setTimeout(function () { input.focus(); }, 80); }
    function shut() { panel.classList.remove('open'); launcher.classList.remove('panel-open'); panel.setAttribute('aria-hidden', 'true'); launcher.setAttribute('aria-expanded', 'false'); }
    function addMessage(role, text) { var node = document.createElement('div'); node.className = 'message ' + role; node.textContent = text || ''; messages.appendChild(node); messages.scrollTop = messages.scrollHeight; return node; }
    function renderSources(node, items) {
      var safe = (items || []).filter(function (item) { try { return new URL(item.url).protocol === 'https:'; } catch (_) { return false; } }).slice(0, 3);
      if (!safe.length) return;
      var box = document.createElement('details'); box.className = 'sources'; var summary = document.createElement('summary'); summary.textContent = '查看回答依据（' + safe.length + '）'; box.appendChild(summary); var list = document.createElement('div'); list.className = 'source-list';
      safe.forEach(function (item) { var a = document.createElement('a'); a.href = item.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = item.title || '查看来源'; list.appendChild(a); }); box.appendChild(list);
      node.appendChild(box);
    }
    function appendInlineText(node, text) {
      var parts = String(text || '').split(/(\*\*[^*]+\*\*)/g);
      parts.forEach(function (part) {
        if (/^\*\*[^*]+\*\*$/.test(part)) { var strong = document.createElement('strong'); strong.textContent = part.slice(2, -2); node.appendChild(strong); }
        else node.appendChild(document.createTextNode(part));
      });
    }
    function renderAnswer(node, text) {
      node.textContent = '';
      var copy = document.createElement('div'); copy.className = 'answer-copy'; node.appendChild(copy);
      var list = null, listType = '', boundary = null;
      String(text || '').replace(/\s*\[证据\d+\]/g, '').split(/\r?\n/).forEach(function (raw) {
        var line = raw.trim(); if (!line) { list = null; return; }
        if (/^#{2,4}\s*适用边界/.test(line) || /^适用边界[：:]/.test(line)) { boundary = document.createElement('div'); boundary.className = 'answer-boundary'; boundary.textContent = line.replace(/^#{2,4}\s*/, ''); copy.appendChild(boundary); list = null; return; }
        if (boundary) { boundary.appendChild(document.createElement('br')); appendInlineText(boundary, line.replace(/^[-*]\s*/, '')); return; }
        var heading = line.match(/^(#{2,4})\s+(.+)$/);
        if (heading) { var h = document.createElement(heading[1].length === 2 ? 'h3' : 'h4'); appendInlineText(h, heading[2]); copy.appendChild(h); list = null; return; }
        var bullet = line.match(/^[-*•]\s+(.+)$/), ordered = line.match(/^\d+[.、]\s*(.+)$/);
        if (bullet || ordered) { var nextType = ordered ? 'ol' : 'ul'; if (!list || listType !== nextType) { list = document.createElement(nextType); listType = nextType; copy.appendChild(list); } var li = document.createElement('li'); appendInlineText(li, (bullet || ordered)[1]); list.appendChild(li); return; }
        var p = document.createElement('p'); appendInlineText(p, line); copy.appendChild(p); list = null; listType = '';
      });
    }
    function createWorkState(node) {
      node.classList.add('work-state');
      node.textContent = '';
      var title = document.createElement('div'); title.className = 'work-title';
      var spinner = document.createElement('span'); spinner.className = 'work-spinner'; title.appendChild(spinner);
      var label = document.createElement('span'); label.textContent = '正在理解你的问题'; title.appendChild(label); node.appendChild(title);
      var list = document.createElement('div'); list.className = 'work-steps'; node.appendChild(list);
      var names = ['识别问题意图', '检索相关资料', '核对来源与适用范围', '组织回答'];
      var steps = names.map(function (name, index) { var item = document.createElement('div'); item.className = 'work-step' + (index === 0 ? ' active' : ''); item.textContent = name; list.appendChild(item); return item; });
      var current = 0, startedAt = Date.now(), stopped = false;
      var timer = window.setInterval(function () { if (current < steps.length - 1) { steps[current].className = 'work-step done'; current += 1; steps[current].className = 'work-step active'; label.textContent = names[current]; } }, 300);
      return async function (immediate) {
        if (stopped) return;
        stopped = true;
        if (!immediate) { var remaining = 1200 - (Date.now() - startedAt); if (remaining > 0) await new Promise(function (resolve) { window.setTimeout(resolve, remaining); }); }
        window.clearInterval(timer); steps.forEach(function (step) { step.className = 'work-step done'; }); node.classList.remove('work-state');
      };
    }
    var activeSpeech = null, activeSpeechUrl = '';
    function stopSpeech(button) { if (activeSpeech) { activeSpeech.pause(); activeSpeech = null; } if (activeSpeechUrl) { URL.revokeObjectURL(activeSpeechUrl); activeSpeechUrl = ''; } if (button) { button.disabled = false; button.classList.remove('reading'); button.textContent = '朗读回答'; } resumePageAudio(); }
    function addSpeak(node, text) {
      if (!window.fetch || !window.Audio || !text) return;
      var clean = String(text).replace(/\s*\[证据\d+\]/g, '').replace(/#{1,6}\s*/g, '').slice(0, 1200);
      var bar = document.createElement('div'); bar.className = 'toolbar'; var button = document.createElement('button'); button.type = 'button'; button.className = 'speak'; button.textContent = '朗读回答';
      button.onclick = async function () { if (button.classList.contains('reading')) { stopSpeech(button); setStatus('朗读已停止'); return; } stopSpeech(); suspendPageAudio(); button.disabled = true; button.textContent = '正在生成声音…'; setStatus('小槌正在组织语气'); try { var response = await fetch(config.apiBase.replace(/\/$/, '') + '/api/voice/synthesize', { method: 'POST', headers: { 'content-type': 'application/json', 'x-app-id': config.appId }, body: JSON.stringify({ text: clean, speed: 1.04 }) }); if (!response.ok) throw new Error('朗读服务暂时不可用'); var blob = await response.blob(); activeSpeechUrl = URL.createObjectURL(blob); activeSpeech = new Audio(activeSpeechUrl); button.disabled = false; button.classList.add('reading'); button.textContent = '停止朗读'; activeSpeech.onended = function () { stopSpeech(button); setStatus('知识库已连接'); }; activeSpeech.onerror = function () { stopSpeech(button); setStatus('朗读播放失败，请再试一次', true); }; setStatus('小槌正在朗读'); await activeSpeech.play(); } catch (error) { stopSpeech(button); setStatus(error.message || '朗读服务暂时不可用', true); } };
      bar.appendChild(button); node.appendChild(bar);
    }
    async function ask(question) {
      question = String(question || '').trim();
      if (!question || send.disabled) return;
      open(); addMessage('user', question); input.value = ''; send.disabled = true; setStatus('正在理解问题');
      var answerNode = addMessage('assistant thinking', ''); var stopWorkState = createWorkState(answerNode); var answer = ''; var citations = [], streamRenderAt = 0;
      try {
        var response = await fetch(config.apiBase.replace(/\/$/, '') + '/api/agent/chat', { method: 'POST', headers: { 'content-type': 'application/json', 'x-app-id': config.appId }, body: JSON.stringify({ app_id: config.appId, conversation_id: conversationId, message: question, history: history.slice(-6), context: { audience: '木疙瘩数字展览观众', detail_level: 'standard', source_mode: 'brief', page: 'mugeda', topic: config.scene }, client: { locale: 'zh-CN' } }) });
        if (!response.ok) { var problem = await response.json().catch(function () { return {}; }); throw new Error(problem.message || '服务暂时不可用'); }
        await stopWorkState(); answerNode.classList.remove('thinking'); answerNode.classList.add('streaming-copy'); answerNode.textContent = ''; setStatus('正在组织回答');
        var reader = response.body.getReader(); var decoder = new TextDecoder(); var buffer = '';
        while (true) {
          var part = await reader.read(); if (part.done) break; buffer += decoder.decode(part.value, { stream: true }); var frames = buffer.split('\n\n'); buffer = frames.pop() || '';
          frames.forEach(function (frame) { var event = 'message', data = ''; frame.split('\n').forEach(function (line) { if (line.indexOf('event:') === 0) event = line.slice(6).trim(); if (line.indexOf('data:') === 0) data += line.slice(5).trim(); }); if (!data) return; var payload = JSON.parse(data); if (event === 'delta') { answer += payload.text || ''; var now = Date.now(); if (now - streamRenderAt > 110) { renderAnswer(answerNode, answer); answerNode.classList.add('streaming-copy'); streamRenderAt = now; } messages.scrollTop = messages.scrollHeight; } if (event === 'citations') citations = payload.items || []; });
        }
        answerNode.classList.remove('streaming-copy'); if (answer) renderAnswer(answerNode, answer); else answerNode.textContent = '这次没有生成有效回答，请换一种方式提问。';
        renderSources(answerNode, citations); addSpeak(answerNode, answer); history.push({ role: 'user', content: question }, { role: 'assistant', content: answer }); history = history.slice(-8); setStatus('回答完成');
      } catch (error) { stopWorkState(true); answerNode.classList.remove('thinking', 'work-state', 'streaming-copy'); answerNode.classList.add('error-message'); answerNode.textContent = '暂时无法连接英歌知识服务，请稍后再试。'; setStatus('连接暂时中断，请稍后重试', true); }
      finally { send.disabled = false; if (window.matchMedia('(pointer:fine)').matches) input.focus(); }
    }

    (scenes[config.scene] || scenes.general).forEach(function (question) { var button = document.createElement('button'); button.type = 'button'; button.className = 'prompt'; button.textContent = question; button.onclick = function () { ask(question); }; prompts.appendChild(button); });
    var dragActive = false, pointerStartX = 0, pointerStartY = 0, dragBaseLeft = 0, dragLastX = 0, gesturePointerId = null, gestureKind = '', ignoreMicUntil = 0;
    launcher.onclick = function (event) { event.preventDefault(); if (event.detail === 0) panel.classList.contains('open') ? shut() : open(); };
    close.onclick = shut;
    form.onsubmit = function (event) { event.preventDefault(); ask(input.value); };
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape') shut(); });
    window.addEventListener('resize', fitPanelToViewport); window.addEventListener('orientationchange', function () { setTimeout(function () { syncVisualViewport(); fitPanelToViewport(); }, 120); });

    function normalizeVoiceText(text) { return String(text || '').replace(/应歌舞|鹰歌舞|莺歌舞|英哥舞|秧歌舞/g, '英歌舞').replace(/英哥/g, '英歌').replace(/小锤/g, '小槌').replace(/锤法/g, '槌法').replace(/潮男/g, '潮南').replace(/普林/g, '普宁').trim(); }
    function encodeVoiceWave(chunks, inputRate) {
      var length = chunks.reduce(function (sum, chunk) { return sum + chunk.length; }, 0), merged = new Float32Array(length), offset = 0;
      chunks.forEach(function (chunk) { merged.set(chunk, offset); offset += chunk.length; });
      var targetRate = 16000, ratio = inputRate / targetRate, samples = merged;
      if (inputRate > targetRate) { samples = new Float32Array(Math.floor(merged.length / ratio)); for (var i = 0; i < samples.length; i++) { var from = Math.floor(i * ratio), to = Math.min(merged.length, Math.floor((i + 1) * ratio)), sum = 0; for (var j = from; j < to; j++) sum += merged[j]; samples[i] = sum / Math.max(1, to - from); } }
      else targetRate = inputRate;
      var buffer = new ArrayBuffer(44 + samples.length * 2), view = new DataView(buffer);
      function write(at, value) { for (var k = 0; k < value.length; k++) view.setUint8(at + k, value.charCodeAt(k)); }
      write(0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); write(8, 'WAVE'); write(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, targetRate, true); view.setUint32(28, targetRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); write(36, 'data'); view.setUint32(40, samples.length * 2, true);
      for (var n = 0; n < samples.length; n++) { var value = Math.max(-1, Math.min(1, samples[n])); view.setInt16(44 + n * 2, value < 0 ? value * 32768 : value * 32767, true); }
      return buffer;
    }
    function resampleVoicePcm(chunks, inputRate) {
      var length = chunks.reduce(function (sum, chunk) { return sum + chunk.length; }, 0), merged = new Float32Array(length), offset = 0;
      chunks.forEach(function (chunk) { merged.set(chunk, offset); offset += chunk.length; });
      if (inputRate <= 16000) return merged;
      var ratio = inputRate / 16000, output = new Float32Array(Math.floor(merged.length / ratio));
      for (var i = 0; i < output.length; i++) { var from = Math.floor(i * ratio), to = Math.min(merged.length, Math.floor((i + 1) * ratio)), sum = 0; for (var j = from; j < to; j++) sum += merged[j]; output[i] = sum / Math.max(1, to - from); }
      return output;
    }
    function pcmVoiceBody(samples) { var body = new ArrayBuffer(samples.length * 2), view = new DataView(body); for (var i = 0; i < samples.length; i++) { var value = Math.max(-1, Math.min(1, samples[i])); view.setInt16(i * 2, value < 0 ? value * 32768 : value * 32767, true); } return body; }
    var Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var canCloudVoice = Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (window.AudioContext || window.webkitAudioContext));
    var startVoice = null, stopVoice = null;
    if ((!Recognition && !canCloudVoice) || !window.isSecureContext) { mic.hidden = true; }
    else {
      var recognition = null, cloudRecorder = null, cloudSessionId = '', cloudQueue = Promise.resolve(), cloudText = '', voiceStartedAt = 0, voiceTimer = 0, voiceStopping = false, voiceSessionActive = false, voiceClickReadyAt = 0, voiceRestartTimer = 0, voiceTextBase = '', voiceStartToken = 0;
      function voiceTime() { var elapsed = Math.max(0, Math.floor((Date.now() - voiceStartedAt) / 1000)); return String(Math.floor(elapsed / 60)).padStart(2, '0') + ':' + String(elapsed % 60).padStart(2, '0'); }
      function clearVoiceTimer() { window.clearInterval(voiceTimer); voiceTimer = 0; }
      function updateVoiceState() { var elapsed = voiceTime(); micLabel.textContent = '结束 ' + elapsed; setStatus('正在识别 · ' + elapsed); }
      function finishVoiceSession(message, bad) { window.clearTimeout(voiceRestartTimer); clearVoiceTimer(); recognition = null; voiceStopping = false; voiceSessionActive = false; mic.classList.remove('active'); mic.setAttribute('aria-pressed', 'false'); mic.setAttribute('aria-label', '点击开始语音输入'); mic.title = '点击开始语音输入'; micLabel.textContent = '语音输入'; launcher.classList.remove('listening'); resumePageAudio(); setStatus(message, bad); }
      function submitRecognizedVoice() { var question = input.value.trim(); if (!question || question === voiceTextBase || Array.from(question.replace(/\s/g, '')).length < 2) { finishVoiceSession('没有听清完整问题，请再说一次', true); return; } finishVoiceSession('识别完成，正在发送'); ask(question); }
      function launchRecognition() {
        if (!voiceSessionActive || voiceStopping) return;
        if (!Recognition) { finishVoiceSession('当前浏览器无法使用语音识别', true); return; }
        var current = new Recognition(); recognition = current; current.lang = 'zh-CN'; current.interimResults = true; current.continuous = true;
        current.onresult = function (event) { var text = ''; for (var i = 0; i < event.results.length; i++) text += event.results[i][0].transcript; input.value = (voiceTextBase + ' ' + normalizeVoiceText(text)).trim(); };
        current.onerror = function (event) { if (!voiceStopping && event && (event.error === 'not-allowed' || event.error === 'service-not-allowed')) { voiceSessionActive = false; finishVoiceSession('请允许麦克风权限后再试', true); } };
        current.onend = function () {
          if (recognition !== current) return;
          recognition = null;
          if (voiceSessionActive && !voiceStopping) { voiceTextBase = input.value.trim(); setStatus('识别连接恢复中 · ' + voiceTime()); voiceRestartTimer = window.setTimeout(launchRecognition, 160); return; }
          submitRecognizedVoice();
        };
        try { current.start(); } catch (_) { recognition = null; if (voiceSessionActive && !voiceStopping) voiceRestartTimer = window.setTimeout(launchRecognition, 300); }
      }
      function closeCloudSession() { var session = cloudSessionId; cloudSessionId = ''; if (!session) return Promise.resolve(); return fetch(config.apiBase.replace(/\/$/, '') + '/api/voice/session/' + encodeURIComponent(session), { method: 'DELETE', headers: { 'x-app-id': config.appId } }).catch(function () {}); }
      function sendCloudChunks(chunks, inputRate, finish) {
        var session = cloudSessionId; if (!session) return Promise.reject(new Error('实时语音会话已经结束'));
        var body = pcmVoiceBody(resampleVoicePcm(chunks, inputRate));
        cloudQueue = cloudQueue.catch(function () {}).then(function () { return fetch(config.apiBase.replace(/\/$/, '') + '/api/voice/session/' + encodeURIComponent(session) + '/chunk?sample_rate=16000' + (finish ? '&finish=1' : ''), { method: 'POST', headers: { 'content-type': 'application/octet-stream', 'x-app-id': config.appId }, body: body }); }).then(function (response) { return response.json().catch(function () { return {}; }).then(function (payload) { if (!response.ok) throw new Error(payload.message || '实时语音识别暂时不可用'); if (payload.text) { cloudText = normalizeVoiceText(payload.text); input.value = (voiceTextBase + ' ' + cloudText).trim(); } return payload; }); });
        return cloudQueue;
      }
      function beginCloudRecording(stream) {
        var AudioContextClass = window.AudioContext || window.webkitAudioContext, context = new AudioContextClass(), source = context.createMediaStreamSource(stream), processor = context.createScriptProcessor(4096, 1, 1), chunks = [], chunkLength = 0, closed = false;
        if (context.state === 'suspended') context.resume().catch(function () {});
        processor.onaudioprocess = function (event) { var chunk = new Float32Array(event.inputBuffer.getChannelData(0)); chunks.push(chunk); chunkLength += chunk.length; if (event.outputBuffer) event.outputBuffer.getChannelData(0).fill(0); if (chunkLength >= context.sampleRate * .3) { var batch = chunks; chunks = []; chunkLength = 0; sendCloudChunks(batch, context.sampleRate, false).catch(function (error) { finishVoiceSession(error.message || '实时语音识别暂时不可用', true); }); } };
        source.connect(processor); processor.connect(context.destination);
        return { finish: function () { if (closed) return Promise.resolve({ chunks: [], inputRate: context.sampleRate }); closed = true; processor.disconnect(); source.disconnect(); stream.getTracks().forEach(function (track) { track.stop(); }); var tail = chunks; return context.close().catch(function () {}).then(function () { return { chunks: tail, inputRate: context.sampleRate }; }); }, cancel: function () { if (closed) return; closed = true; processor.disconnect(); source.disconnect(); stream.getTracks().forEach(function (track) { track.stop(); }); context.close().catch(function () {}); closeCloudSession(); } };
      }
      startVoice = function () {
        if (voiceSessionActive) return;
        open(); suspendPageAudio(); voiceStopping = false; voiceSessionActive = true; voiceTextBase = input.value.trim(); voiceStartedAt = Date.now(); voiceClickReadyAt = Date.now() + 850; mic.classList.add('active'); mic.setAttribute('aria-pressed', 'true'); mic.setAttribute('aria-label', '点击结束语音输入'); mic.title = '点击结束语音输入'; setStatus('正在连接语音识别'); updateVoiceState(); voiceTimer = window.setInterval(updateVoiceState, 250);
        var token = ++voiceStartToken;
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (window.AudioContext || window.webkitAudioContext)) Promise.all([navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } }), fetch(config.apiBase.replace(/\/$/, '') + '/api/voice/session', { method: 'POST', headers: { 'content-type': 'application/json', 'x-app-id': config.appId }, body: JSON.stringify({ sample_rate: 16000, mode: 'transcribe' }) }).then(function (response) { return response.json().catch(function () { return {}; }).then(function (payload) { if (!response.ok || !payload.session_id) throw new Error(payload.message || '实时语音服务暂时不可用'); return payload.session_id; }); })]).then(function (values) { var stream = values[0], sessionId = values[1]; if (!voiceSessionActive || token !== voiceStartToken) { stream.getTracks().forEach(function (track) { track.stop(); }); fetch(config.apiBase.replace(/\/$/, '') + '/api/voice/session/' + encodeURIComponent(sessionId), { method: 'DELETE', headers: { 'x-app-id': config.appId } }).catch(function () {}); return; } cloudSessionId = sessionId; cloudQueue = Promise.resolve(); cloudText = ''; cloudRecorder = beginCloudRecording(stream); updateVoiceState(); }).catch(function () { closeCloudSession(); if (voiceSessionActive && token === voiceStartToken) launchRecognition(); });
        else launchRecognition();
      };
      stopVoice = function () {
        if (!voiceSessionActive || voiceStopping) return;
        voiceStopping = true; voiceSessionActive = false; voiceStartToken += 1; window.clearTimeout(voiceRestartTimer); clearVoiceTimer(); setStatus('正在识别刚才的录音');
        if (cloudRecorder) { var recorder = cloudRecorder; cloudRecorder = null; recorder.finish().then(function (tail) { return sendCloudChunks(tail.chunks.length ? tail.chunks : [new Float32Array(320)], tail.inputRate, true); }).then(function (payload) { var text = normalizeVoiceText(payload.text || cloudText); if (!text) throw new Error('未识别到内容，请再试一次'); input.value = (voiceTextBase + ' ' + text).trim(); return closeCloudSession().then(submitRecognizedVoice); }).catch(function (error) { closeCloudSession(); finishVoiceSession(error.message || '语音识别暂时不可用', true); }); return; }
        if (recognition) recognition.stop(); else submitRecognizedVoice();
      };
      mic.onclick = function () { if (voiceSessionActive) { if (Date.now() >= voiceClickReadyAt) stopVoice(); } else startVoice(); };
      window.addEventListener('pagehide', stopVoice);
      document.addEventListener('visibilitychange', function () { if (document.hidden) stopVoice(); });
    }

    var messageTouchX = 0, messageTouchY = 0, messageScrollTop = 0;
    messages.addEventListener('touchstart', function (event) {
      if (event.touches.length !== 1) return;
      messages.classList.add('touch-scrolling'); messageTouchX = event.touches[0].clientX; messageTouchY = event.touches[0].clientY; messageScrollTop = messages.scrollTop;
    }, { passive: true });
    messages.addEventListener('touchmove', function (event) {
      if (event.touches.length !== 1 || messages.scrollHeight <= messages.clientHeight) return;
      var dx = event.touches[0].clientX - messageTouchX, dy = event.touches[0].clientY - messageTouchY;
      var delta = Math.abs(dy) >= Math.abs(dx) ? -dy : dx;
      var next = Math.max(0, Math.min(messages.scrollHeight - messages.clientHeight, messageScrollTop + delta));
      if (next !== messages.scrollTop) { messages.scrollTop = next; if (event.cancelable) event.preventDefault(); event.stopPropagation(); }
    }, { passive: false });
    messages.addEventListener('touchend', function () { messages.classList.remove('touch-scrolling'); }, { passive: true });
    messages.addEventListener('touchcancel', function () { messages.classList.remove('touch-scrolling'); }, { passive: true });
    function beginLauncherGesture(x, y, kind, pointerId) {
      dragActive = false; pointerStartX = x; pointerStartY = y; dragLastX = x; gestureKind = kind; gesturePointerId = pointerId;
      var box = launcher.getBoundingClientRect(); dragBaseLeft = box.left; host.style.left = dragBaseLeft + 'px'; host.style.right = 'auto'; host.style.transform = 'translate3d(0,0,0)';
    }
    function moveLauncherGesture(x, y) {
      dragLastX = x;
      var distance = Math.hypot(x - pointerStartX, y - pointerStartY);
      if (distance < 12 && !dragActive) return;
      if (!dragActive) { dragActive = true; launcher.classList.add('dragging'); panel.classList.remove('open'); launcher.classList.remove('panel-open'); panel.setAttribute('aria-hidden', 'true'); launcher.setAttribute('aria-expanded', 'false'); }
      var targetLeft = Math.max(8, Math.min(window.innerWidth - launcher.offsetWidth - 8, x - launcher.offsetWidth / 2));
      host.style.transform = 'translate3d(' + (targetLeft - dragBaseLeft) + 'px,0,0)';
    }
    function endLauncherGesture(x, y, cancelled) {
      var endX = typeof x === 'number' ? x : dragLastX;
      var endY = typeof y === 'number' ? y : pointerStartY;
      var moved = Math.hypot(endX - pointerStartX, endY - pointerStartY) >= 12;
      if (dragActive || moved) { dragActive = false; launcher.classList.remove('dragging'); host.style.transform = ''; dock(endX < window.innerWidth / 2 ? 'left' : 'right', true); }
      else if (!cancelled) {
        ignoreMicUntil = Date.now() + 650;
        window.setTimeout(function () { panel.classList.contains('open') ? shut() : open(); }, 120);
      }
      gesturePointerId = null; gestureKind = '';
    }
    launcher.addEventListener('touchstart', function (event) { if (event.touches.length !== 1) return; event.preventDefault(); var touch = event.touches[0]; beginLauncherGesture(touch.clientX, touch.clientY, 'touch', touch.identifier); }, { passive: false });
    launcher.addEventListener('touchmove', function (event) { if (gestureKind !== 'touch' || !event.touches.length) return; event.preventDefault(); var touch = event.touches[0]; moveLauncherGesture(touch.clientX, touch.clientY); }, { passive: false });
    function finishTouchGesture(event, cancelled) {
      if (gestureKind !== 'touch') return;
      if (event.cancelable) event.preventDefault();
      var touch = event.changedTouches && event.changedTouches[0];
      endLauncherGesture(touch && touch.clientX, touch && touch.clientY, cancelled);
    }
    window.addEventListener('touchend', function (event) { finishTouchGesture(event, false); }, { passive: false, capture: true });
    window.addEventListener('touchcancel', function (event) { finishTouchGesture(event, true); }, { passive: false, capture: true });
    window.addEventListener('blur', function () { if (gestureKind === 'touch') endLauncherGesture(dragLastX, pointerStartY, true); });
    launcher.addEventListener('pointerdown', function (event) { if (event.pointerType !== 'mouse' || event.button !== 0) return; event.preventDefault(); beginLauncherGesture(event.clientX, event.clientY, 'mouse', event.pointerId); try { launcher.setPointerCapture(event.pointerId); } catch (_) {} });
    launcher.addEventListener('pointermove', function (event) { if (gestureKind !== 'mouse' || event.pointerId !== gesturePointerId) return; event.preventDefault(); moveLauncherGesture(event.clientX, event.clientY); });
    launcher.addEventListener('pointerup', function (event) { if (gestureKind !== 'mouse' || event.pointerId !== gesturePointerId) return; event.preventDefault(); endLauncherGesture(event.clientX, event.clientY, false); try { launcher.releasePointerCapture(event.pointerId); } catch (_) {} });
    launcher.addEventListener('pointercancel', function (event) { if (gestureKind === 'mouse') endLauncherGesture(event.clientX, event.clientY, true); });
    fetch(config.apiBase.replace(/\/$/, '') + '/api/health').then(function (response) { if (!response.ok) throw new Error(); return response.json(); }).then(function () { setStatus('知识库已连接'); }).catch(function () { setStatus('知识服务暂时不可用', true); });

    window.MugedaYinggeAgent = { open: open, close: shut, ask: ask, setScene: function (scene) { config.scene = scene; }, version: '20260912-24' };
    window.YinggeAgentWidget = window.MugedaYinggeAgent;
    if (config.autoOpen) open();
    window.dispatchEvent(new CustomEvent('yingge-agent-ready'));
  });
})();
