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
    close.insertAdjacentHTML('beforebegin', '<button class="settings" type="button" aria-label="语音设置" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M5.99 5.99l1.42 1.42M16.59 16.59l1.42 1.42M18.01 5.99l-1.42 1.42M7.41 16.59l-1.42 1.42"/><circle cx="12" cy="12" r="3.5"/></svg></button>');
    var settings = root.querySelector('.settings');
    var settingsSheet = document.createElement('aside');
    settingsSheet.className = 'mugeda-settings';
    settingsSheet.setAttribute('aria-hidden', 'true');
    settingsSheet.innerHTML = '<header class="mugeda-settings-head"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M5.99 5.99l1.42 1.42M16.59 16.59l1.42 1.42M18.01 5.99l-1.42 1.42M7.41 16.59l-1.42 1.42"/><circle cx="12" cy="12" r="3.5"/></svg><strong>语音设置</strong><button class="settings-close" type="button" aria-label="关闭设置"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><div class="mugeda-setting-list"><button class="mugeda-setting-row" data-setting="wake" type="button" role="switch" aria-checked="false"><span class="mugeda-setting-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6"/></svg></span><span><strong>页面唤醒</strong><small>页面保持打开时，喊“小槌小槌”即可提问</small></span><i class="mugeda-toggle" aria-hidden="true"></i></button><button class="mugeda-setting-row" data-setting="speech" type="button" role="switch" aria-checked="false"><span class="mugeda-setting-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4zM15.5 9.5a4 4 0 0 1 0 5M18 7a7.5 7.5 0 0 1 0 10"/></svg></span><span><strong>自动朗读</strong><small>回答完成后朗读；喊“小槌小槌”可以打断</small></span><i class="mugeda-toggle" aria-hidden="true"></i></button><div class="mugeda-setting-row is-note"><span class="mugeda-setting-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg></span><span><strong>点按说话</strong><small>使用输入框左侧麦克风，点击开始、再次点击结束</small></span></div></div><p class="mugeda-settings-note"><strong>使用边界：</strong>离开页面、锁屏或微信进入后台后，网页会自动停止监听。</p>';
    panel.appendChild(settingsSheet);
    var settingsClose = settingsSheet.querySelector('.settings-close');
    var wakeSetting = settingsSheet.querySelector('[data-setting="wake"]');
    var speechSetting = settingsSheet.querySelector('[data-setting="speech"]');
    var mugedaVoiceStyle = document.createElement('style');
    mugedaVoiceStyle.textContent = '.head{min-height:50px;padding:9px 12px}.head-copy{gap:7px}.head strong{font-size:15px}.settings,.close{width:34px;height:34px;border:1px solid #cad5cd;border-radius:10px;background:transparent;color:#345446;display:grid;place-items:center;cursor:pointer}.settings{margin-left:auto}.settings svg,.close svg,.mugeda-settings svg{width:18px;height:18px;stroke:currentColor;stroke-width:1.8;fill:none;stroke-linecap:round;stroke-linejoin:round}.settings[aria-expanded="true"]{border-color:#9ecbb1;background:#eaf5ed;color:#26734d}.form{grid-template-columns:42px minmax(0,1fr) 52px;gap:7px;min-height:62px;padding:8px 10px}.form .mic{display:grid;place-items:center;min-width:42px;min-height:44px;padding:0;border:1px solid #cbd9cf;background:#eff5f0;color:#286c4a}.form .mic span,.form .privacy{display:none}.form .send{min-width:52px;padding:0;font-size:13px}.form input{min-height:44px;padding:0 11px;font-size:16px}.mugeda-settings{position:absolute;z-index:8;inset:0;display:grid;grid-template-rows:auto 1fr auto;padding:13px;background:#f8faf6;color:#203128;opacity:0;pointer-events:none;transform:translateX(18px);transition:opacity .22s ease,transform .22s ease}.panel.settings-open .mugeda-settings{opacity:1;pointer-events:auto;transform:none}.mugeda-settings-head{display:flex;align-items:center;gap:9px;min-height:38px;padding-bottom:11px;border-bottom:1px solid #dce5de}.mugeda-settings-head>svg{color:#2b6e4b}.mugeda-settings-head strong{flex:1;font-size:16px}.settings-close{width:34px;height:34px;border:1px solid #d1ddd4;border-radius:10px;background:#fff;color:#52685a;display:grid;place-items:center}.mugeda-setting-list{padding:7px 0}.mugeda-setting-row{width:100%;display:grid;grid-template-columns:30px minmax(0,1fr) 42px;gap:9px;align-items:center;padding:13px 1px;border:0;border-bottom:1px solid #e0e7e1;background:transparent;text-align:left;color:#203128}.mugeda-setting-row strong,.mugeda-setting-row small{display:block}.mugeda-setting-row strong{font-size:13px}.mugeda-setting-row small{margin-top:3px;color:#718176;font-size:10px;line-height:1.4}.mugeda-setting-icon{width:30px;height:30px;border-radius:9px;background:#e9f3eb;color:#28704c;display:grid;place-items:center}.mugeda-setting-icon svg{width:17px;height:17px}.mugeda-toggle{position:relative;width:40px;height:23px;border-radius:999px;background:#bcc9c0}.mugeda-toggle:after{content:"";position:absolute;top:3px;left:3px;width:17px;height:17px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(13,42,28,.2);transition:transform .2s}.mugeda-setting-row[aria-checked="true"] .mugeda-toggle{background:#2e9567}.mugeda-setting-row[aria-checked="true"] .mugeda-toggle:after{transform:translateX(17px)}.mugeda-setting-row.is-note{cursor:default}.mugeda-settings-note{margin:0;padding:11px 1px 2px;color:#6f7e73;font-size:10px;line-height:1.55}.mugeda-settings-note strong{color:#355144}@media(orientation:portrait){.panel,.panel.open{position:fixed;left:50%;top:50%;right:auto;bottom:auto;width:min(520px,calc(100vh - 64px));height:min(340px,calc(100vw - 48px));transform:translate(-50%,-50%) rotate(90deg) scale(var(--panel-scale,1));animation:none}:host(.dock-left) .panel{left:50%;right:auto}.launcher:not(.panel-open){transform:rotate(90deg)}}';
    root.appendChild(mugedaVoiceStyle);
    var mugedaOrientationStyle = document.createElement('style');
    mugedaOrientationStyle.textContent = ':host(.force-landscape-agent) .panel,:host(.force-landscape-agent) .panel.open{position:fixed;left:50%;top:50%;right:auto;bottom:auto;width:var(--forced-panel-width,520px);height:var(--forced-panel-height,340px);transform:translate(-50%,-50%) rotate(90deg) scale(var(--panel-scale,1));animation:none}:host(.force-landscape-agent).dock-left .panel{left:50%;right:auto}:host(.force-landscape-agent) .launcher:not(.panel-open){transform:rotate(90deg)}';
    root.appendChild(mugedaOrientationStyle);
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
    function syncMugedaOrientation() {
      var orientationType = window.screen && window.screen.orientation && window.screen.orientation.type || '';
      var physicalPortrait = /^portrait/.test(orientationType) || (!orientationType && window.screen && Number(window.screen.height) > Number(window.screen.width));
      var forced = physicalPortrait && window.innerWidth > window.innerHeight;
      host.classList.toggle('force-landscape-agent', forced);
      if (forced) {
        var screenWidth = Math.max(1, Number(window.screen.width) || window.innerHeight), screenHeight = Math.max(1, Number(window.screen.height) || window.innerWidth);
        host.style.setProperty('--forced-panel-width', Math.min(520, Math.max(screenWidth, screenHeight) - 64) + 'px');
        host.style.setProperty('--forced-panel-height', Math.min(340, Math.min(screenWidth, screenHeight) - 48) + 'px');
      } else {
        host.style.removeProperty('--forced-panel-width'); host.style.removeProperty('--forced-panel-height');
      }
      return forced;
    }
    function syncVisualViewport() { syncMugedaOrientation(); var viewport = window.visualViewport; host.style.setProperty('--vv-height', (viewport ? viewport.height : window.innerHeight) + 'px'); host.style.setProperty('--vv-top', (viewport ? viewport.offsetTop : 0) + 'px'); }
    syncVisualViewport(); window.addEventListener('resize', syncVisualViewport); if (window.visualViewport) { window.visualViewport.addEventListener('resize', syncVisualViewport); window.visualViewport.addEventListener('scroll', syncVisualViewport); }
    function fitPanelToViewport() {
      if (!panel.classList.contains('open') || (window.innerHeight <= window.innerWidth && !host.classList.contains('force-landscape-agent'))) { panel.style.removeProperty('--panel-scale'); panel.style.left = ''; panel.style.top = ''; return; }
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
    var activeSpeech = null, activeSpeechUrl = '', activeSpeechButton = null, activeSpeechRun = 0, activeSpeechAbortController = null, activeSpeechCompletion = null;
    function stopSpeech(button) { var currentButton = button || activeSpeechButton; activeSpeechRun += 1; if (activeSpeechAbortController) { try { activeSpeechAbortController.abort(); } catch (_) {} activeSpeechAbortController = null; } if (activeSpeechCompletion) { activeSpeechCompletion(); activeSpeechCompletion = null; } if (activeSpeech) { activeSpeech.pause(); activeSpeech = null; } if (activeSpeechUrl) { URL.revokeObjectURL(activeSpeechUrl); activeSpeechUrl = ''; } if (currentButton) { currentButton.disabled = false; currentButton.classList.remove('reading'); currentButton.textContent = '朗读回答'; } activeSpeechButton = null; resumePageAudio(); }
    function splitMugedaSpeechText(text, limit) {
      var normalized = String(text || '').replace(/\s*\[证据\d+\]/g, '').replace(/#{1,6}\s*/g, '').replace(/https?:\/\/\S+/g, '').trim().slice(0, 1200);
      var maximum = Math.max(48, Number(limit) || 108), sentences = normalized.match(/[^。！？!?；;\n]+[。！？!?；;]?/g) || [normalized], parts = [], current = '';
      function flush() { if (current.trim()) parts.push(current.trim()); current = ''; }
      sentences.forEach(function (sentence) { if (sentence.length > maximum) { flush(); for (var offset = 0; offset < sentence.length; offset += maximum) parts.push(sentence.slice(offset, offset + maximum).trim()); } else if ((current + sentence).length > maximum) { flush(); current = sentence; } else current += sentence; });
      flush(); return parts.filter(Boolean).slice(0, 6);
    }
    function mugedaSpeechError(message, code) { var error = new Error(message); error.code = code; return error; }
    function fetchMugedaSpeechPart(text, controller, attempt) {
      attempt = Number(attempt) || 0;
      return fetch(config.apiBase.replace(/\/$/, '') + '/api/voice/synthesize', { method: 'POST', headers: { 'content-type': 'application/json', 'x-app-id': config.appId }, body: JSON.stringify({ text: text, speed: 1.04 }), signal: controller && controller.signal }).then(function (response) {
        if (response.ok) return response.blob();
        if (response.status >= 500 && attempt < 1) return new Promise(function (resolve) { window.setTimeout(resolve, 140); }).then(function () { return fetchMugedaSpeechPart(text, controller, attempt + 1); });
        throw mugedaSpeechError('朗读合成失败，请稍后再试', 'MUGEDA_TTS_SYNTHESIS_FAILED');
      }).catch(function (error) {
        if (error && (error.name === 'AbortError' || error.code)) throw error;
        if (attempt < 1) return new Promise(function (resolve) { window.setTimeout(resolve, 140); }).then(function () { return fetchMugedaSpeechPart(text, controller, attempt + 1); });
        throw mugedaSpeechError('朗读合成失败，请稍后再试', 'MUGEDA_TTS_SYNTHESIS_FAILED');
      });
    }
    function waitForMugedaSpeechEnd(audio) { return new Promise(function (resolve, reject) { var settled = false; function done() { if (settled) return; settled = true; if (activeSpeechCompletion === done) activeSpeechCompletion = null; resolve(); } activeSpeechCompletion = done; audio.onended = done; audio.onerror = function () { if (settled) return; settled = true; if (activeSpeechCompletion === done) activeSpeechCompletion = null; reject(mugedaSpeechError('朗读播放失败，请再试一次', 'MUGEDA_TTS_PLAYBACK_FAILED')); }; }); }
    function releaseMugedaSpeechAudio(audio, url) { if (activeSpeech === audio) activeSpeech = null; if (activeSpeechUrl === url) { URL.revokeObjectURL(url); activeSpeechUrl = ''; } }
    async function playMugedaSpeechParts(parts, button) {
      var run = ++activeSpeechRun, controller = typeof AbortController === 'function' ? new AbortController() : null, next = fetchMugedaSpeechPart(parts[0], controller);
      activeSpeechAbortController = controller;
      for (var index = 0; index < parts.length; index += 1) {
        var blob;
        try { blob = await next; } catch (error) { if (run !== activeSpeechRun || error && error.name === 'AbortError') return; throw error; }
        if (run !== activeSpeechRun) return;
        if (index + 1 < parts.length) next = fetchMugedaSpeechPart(parts[index + 1], controller);
        await armMugedaWakeDuringSpeech();
        if (run !== activeSpeechRun) return;
        var url = URL.createObjectURL(blob), audio = new Audio(url), ended = waitForMugedaSpeechEnd(audio);
        activeSpeechUrl = url; activeSpeech = audio; activeSpeechButton = button; button.disabled = false; button.classList.add('reading'); button.textContent = '停止朗读 · ' + (index + 1) + '/' + parts.length; setStatus('小槌正在朗读 ' + (index + 1) + '/' + parts.length);
        try { await audio.play(); } catch (error) { releaseMugedaSpeechAudio(audio, url); if (error && error.name === 'NotAllowedError') throw mugedaSpeechError('浏览器阻止朗读，请点击“朗读回答”再试', 'MUGEDA_TTS_PLAYBACK_BLOCKED'); throw mugedaSpeechError('朗读播放失败，请再试一次', 'MUGEDA_TTS_PLAYBACK_FAILED'); }
        try { await ended; } finally { releaseMugedaSpeechAudio(audio, url); }
        if (run !== activeSpeechRun) return;
      }
      if (run === activeSpeechRun) { stopSpeech(button); setStatus('知识库已连接'); }
    }
    function addSpeak(node, text) {
      if (!window.fetch || !window.Audio || !text) return;
      var parts = splitMugedaSpeechText(text);
      if (!parts.length) return;
      var bar = document.createElement('div'); bar.className = 'toolbar'; var button = document.createElement('button'); button.type = 'button'; button.className = 'speak'; button.textContent = '朗读回答';
      button.onclick = async function () { if (button.classList.contains('reading')) { stopSpeech(button); setStatus('朗读已停止'); return; } stopSpeech(); suspendPageAudio(); button.disabled = true; button.textContent = '正在准备朗读…'; activeSpeechButton = button; setStatus('小槌正在组织语气'); try { await playMugedaSpeechParts(parts, button); } catch (error) { if (activeSpeechButton !== button && !button.classList.contains('reading')) return; stopSpeech(button); setStatus(error && error.code === 'MUGEDA_TTS_PLAYBACK_BLOCKED' ? '浏览器阻止朗读，请点击“朗读回答”再试' : (error && error.code === 'MUGEDA_TTS_SYNTHESIS_FAILED' ? '朗读合成失败，请稍后再试' : '朗读播放失败，请再试一次'), true); } };
      bar.appendChild(button); node.appendChild(bar);
      if (mugedaAutoSpeechEnabled) window.setTimeout(function () { if (!button.disabled) button.click(); }, 80);
    }
    var activeAnswerAbortController = null, activeAnswerRun = 0;
    function cancelMugedaAnswerForWake() { var hadActiveAnswer = Boolean(activeAnswerAbortController) || send.disabled; activeAnswerRun += 1; if (activeAnswerAbortController) { try { activeAnswerAbortController.abort(); } catch (_) {} activeAnswerAbortController = null; } if (hadActiveAnswer) send.disabled = false; return hadActiveAnswer; }
    async function ask(question, options) {
      options = options || {};
      question = String(question || '').trim();
      if (!question || (send.disabled && !options.replaceActive)) return;
      if (activeAnswerAbortController) { try { activeAnswerAbortController.abort(); } catch (_) {} }
      var answerRun = ++activeAnswerRun, answerAbortController = typeof AbortController === 'function' ? new AbortController() : null;
      activeAnswerAbortController = answerAbortController;
      open(); addMessage('user', question); input.value = ''; send.disabled = true; setStatus('正在理解问题');
      var answerNode = addMessage('assistant thinking', ''); var stopWorkState = createWorkState(answerNode); var answer = ''; var citations = [], streamRenderAt = 0;
      try {
        var response = await fetch(config.apiBase.replace(/\/$/, '') + '/api/agent/chat', { method: 'POST', headers: { 'content-type': 'application/json', 'x-app-id': config.appId }, body: JSON.stringify({ app_id: config.appId, conversation_id: conversationId, message: question, history: history.slice(-6), context: { audience: '木疙瘩数字展览观众', detail_level: 'standard', source_mode: 'brief', page: 'mugeda', topic: config.scene }, client: { locale: 'zh-CN' } }), signal: answerAbortController && answerAbortController.signal });
        if (answerRun !== activeAnswerRun) return;
        if (!response.ok) { var problem = await response.json().catch(function () { return {}; }); throw new Error(problem.message || '服务暂时不可用'); }
        await stopWorkState(); answerNode.classList.remove('thinking'); answerNode.classList.add('streaming-copy'); answerNode.textContent = ''; setStatus('正在组织回答');
        var reader = response.body.getReader(); var decoder = new TextDecoder(); var buffer = '';
        while (true) {
          if (answerRun !== activeAnswerRun) return;
          var part = await reader.read(); if (answerRun !== activeAnswerRun) return; if (part.done) break; buffer += decoder.decode(part.value, { stream: true }); var frames = buffer.split('\n\n'); buffer = frames.pop() || '';
          frames.forEach(function (frame) { var event = 'message', data = ''; frame.split('\n').forEach(function (line) { if (line.indexOf('event:') === 0) event = line.slice(6).trim(); if (line.indexOf('data:') === 0) data += line.slice(5).trim(); }); if (!data) return; var payload = JSON.parse(data); if (event === 'delta') { answer += payload.text || ''; var now = Date.now(); if (now - streamRenderAt > 110) { renderAnswer(answerNode, answer); answerNode.classList.add('streaming-copy'); streamRenderAt = now; } messages.scrollTop = messages.scrollHeight; } if (event === 'citations') citations = payload.items || []; });
        }
        answerNode.classList.remove('streaming-copy'); if (answer) renderAnswer(answerNode, answer); else answerNode.textContent = '这次没有生成有效回答，请换一种方式提问。';
        renderSources(answerNode, citations); addSpeak(answerNode, answer); history.push({ role: 'user', content: question }, { role: 'assistant', content: answer }); history = history.slice(-8); setStatus('回答完成');
      } catch (error) { if (error && error.name === 'AbortError') { stopWorkState(true); answerNode.remove(); if (!mugedaWakeTransitioning) setStatus('已准备倾听新的问题'); return; } stopWorkState(true); answerNode.classList.remove('thinking', 'work-state', 'streaming-copy'); answerNode.classList.add('error-message'); answerNode.textContent = '暂时无法连接英歌知识服务，请稍后再试。'; setStatus('连接暂时中断，请稍后重试', true); }
      finally { if (activeAnswerAbortController === answerAbortController) activeAnswerAbortController = null; if (answerRun === activeAnswerRun) { send.disabled = false; resumeMugedaWakeIfEnabled(); if (window.matchMedia('(pointer:fine)').matches) input.focus(); } }
    }

    (scenes[config.scene] || scenes.general).forEach(function (question) { var button = document.createElement('button'); button.type = 'button'; button.className = 'prompt'; button.textContent = question; button.onclick = function () { ask(question); }; prompts.appendChild(button); });
    var dragActive = false, pointerStartX = 0, pointerStartY = 0, dragBaseLeft = 0, dragLastX = 0, gesturePointerId = null, gestureKind = '', ignoreMicUntil = 0;
    launcher.onclick = function (event) { event.preventDefault(); if (event.detail === 0) panel.classList.contains('open') ? shut() : open(); };
    close.onclick = shut;
    form.onsubmit = function (event) { event.preventDefault(); ask(input.value); };
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape') shut(); });
    window.addEventListener('resize', fitPanelToViewport); window.addEventListener('orientationchange', function () { setTimeout(function () { syncVisualViewport(); fitPanelToViewport(); }, 120); });

    function normalizeVoiceText(text) { return String(text || '').replace(/应歌舞|鹰歌舞|莺歌舞|英哥舞|秧歌舞/g, '英歌舞').replace(/英哥/g, '英歌').replace(/小锤/g, '小槌').replace(/锤法/g, '槌法').replace(/中快[班版办]/g, '中快板').replace(/([快慢中])[班版办](?=(?:英歌|板式|鼓点|节奏|槌法|步法|队形|的|和|与|、|,|，|。|！|？|\?|有|是|怎么|什么|属于|区别|$))/g, '$1板').replace(/潮男/g, '潮南').replace(/普林/g, '普宁').trim(); }
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
    var MUGEDA_WAKE_STORAGE_KEY = 'yingge-mugeda-wake-enabled';
    var MUGEDA_AUTO_SPEECH_STORAGE_KEY = 'yingge-mugeda-auto-speech-enabled';
    var mugedaWakeEnabled = false, mugedaWakeArmedThisVisit = false, mugedaAutoSpeechEnabled = false, mugedaAudioOutputPrimed = false;
    try { mugedaWakeEnabled = localStorage.getItem(MUGEDA_WAKE_STORAGE_KEY) === '1'; mugedaAutoSpeechEnabled = localStorage.getItem(MUGEDA_AUTO_SPEECH_STORAGE_KEY) === '1'; } catch (_) {}
    function primeMugedaAudioOutput() { if (mugedaAudioOutputPrimed || !window.Audio) return; try { var primer = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA='); primer.volume = 0; var playback = primer.play(); if (playback && playback.then) playback.then(function () { primer.pause(); mugedaAudioOutputPrimed = true; }).catch(function () {}); } catch (_) {} }
    function setMugedaSettingsOpen(opened) { panel.classList.toggle('settings-open', Boolean(opened)); settings.setAttribute('aria-expanded', String(Boolean(opened))); settingsSheet.setAttribute('aria-hidden', String(!opened)); }
    function refreshMugedaSettings() { var active = mugedaWakeEnabled && mugedaWakeArmedThisVisit; wakeSetting.setAttribute('aria-checked', String(active)); speechSetting.setAttribute('aria-checked', String(mugedaAutoSpeechEnabled)); wakeSetting.querySelector('small').textContent = mugedaWakeEnabled && !mugedaWakeArmedThisVisit ? '已记住偏好，点击恢复本页监听' : '页面保持打开时，喊“小槌小槌”即可提问'; wakeSetting.disabled = !canCloudVoice || !window.isSecureContext; }
    settings.onclick = function () { setMugedaSettingsOpen(!panel.classList.contains('settings-open')); };
    settingsClose.onclick = function () { setMugedaSettingsOpen(false); };
    wakeSetting.onclick = function () { primeMugedaAudioOutput(); if (!canCloudVoice || !window.isSecureContext) { setStatus('当前页面无法开启语音唤醒', true); return; } if (mugedaWakeEnabled && !mugedaWakeArmedThisVisit) mugedaWakeArmedThisVisit = true; else { mugedaWakeEnabled = !mugedaWakeEnabled; mugedaWakeArmedThisVisit = mugedaWakeEnabled; try { localStorage.setItem(MUGEDA_WAKE_STORAGE_KEY, mugedaWakeEnabled ? '1' : '0'); } catch (_) {} } refreshMugedaSettings(); if (mugedaWakeEnabled && mugedaWakeArmedThisVisit) startMugedaWakeStandby(); else stopMugedaWakeStandby({ quiet: false }); };
    speechSetting.onclick = function () { primeMugedaAudioOutput(); mugedaAutoSpeechEnabled = !mugedaAutoSpeechEnabled; try { localStorage.setItem(MUGEDA_AUTO_SPEECH_STORAGE_KEY, mugedaAutoSpeechEnabled ? '1' : '0'); } catch (_) {} refreshMugedaSettings(); };
    refreshMugedaSettings();
    if ((!Recognition && !canCloudVoice) || !window.isSecureContext) { mic.hidden = true; }
    else {
      var recognition = null, cloudRecorder = null, cloudSessionId = '', cloudQueue = Promise.resolve(), cloudText = '', voiceStartedAt = 0, voiceTimer = 0, voiceStopping = false, voiceSessionActive = false, voiceClickReadyAt = 0, voiceRestartTimer = 0, voiceTextBase = '', voiceStartToken = 0;
      function voiceTime() { var elapsed = Math.max(0, Math.floor((Date.now() - voiceStartedAt) / 1000)); return String(Math.floor(elapsed / 60)).padStart(2, '0') + ':' + String(elapsed % 60).padStart(2, '0'); }
      function clearVoiceTimer() { window.clearInterval(voiceTimer); voiceTimer = 0; }
      function updateVoiceState() { var elapsed = voiceTime(); micLabel.textContent = '结束 ' + elapsed; setStatus('正在识别 · ' + elapsed); }
      function finishVoiceSession(message, bad) { window.clearTimeout(voiceRestartTimer); clearVoiceTimer(); recognition = null; voiceStopping = false; voiceSessionActive = false; mic.classList.remove('active'); mic.setAttribute('aria-pressed', 'false'); mic.setAttribute('aria-label', '点击开始语音输入'); mic.title = '点击开始语音输入'; micLabel.textContent = '语音输入'; launcher.classList.remove('listening'); resumePageAudio(); setStatus(message, bad); resumeMugedaWakeIfEnabled(); }
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
        stopMugedaWakeStandby({ quiet: true }); open(); suspendPageAudio(); voiceStopping = false; voiceSessionActive = true; voiceTextBase = input.value.trim(); voiceStartedAt = Date.now(); voiceClickReadyAt = Date.now() + 850; mic.classList.add('active'); mic.setAttribute('aria-pressed', 'true'); mic.setAttribute('aria-label', '点击结束语音输入'); mic.title = '点击结束语音输入'; setStatus('正在连接语音识别'); updateVoiceState(); voiceTimer = window.setInterval(updateVoiceState, 250);
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
      mic.onclick = function () { primeMugedaAudioOutput(); if (voiceSessionActive) { if (Date.now() >= voiceClickReadyAt) stopVoice(); } else startVoice(); };
      window.addEventListener('pagehide', stopVoice);
      document.addEventListener('visibilitychange', function () { if (document.hidden) { stopVoice(); stopMugedaWakeStandby({ quiet: true }); } });
    }

    var MUGEDA_WAKE_COOLDOWN_MS = 1800, MUGEDA_WAKE_ECHO_GUARD_MS = 260;
    var MUGEDA_WAKE_REQUEST = { mode: 'wake' };
    var mugedaWakeSessionId = '', mugedaWakeRecorder = null, mugedaWakeQueue = Promise.resolve(), mugedaWakeStarting = false, mugedaWakeLastTriggerAt = 0, mugedaWakeAck = null, mugedaWakeStartPromise = null, mugedaWakeGeneration = 0, mugedaWakeTransitioning = false, mugedaWakeNoiseFloor = .004, mugedaWakeLastVoiceAt = 0, mugedaWakeVoiceFrames = 0, mugedaWakeEchoGuardUntil = 0;
    var mugedaWakeQuestionSessionId = '', mugedaWakeQuestionRecorder = null, mugedaWakeQuestionQueue = Promise.resolve(), mugedaWakeQuestionText = '', mugedaWakeQuestionTimer = 0, mugedaWakeQuestionActive = false, mugedaWakeQuestionFinishing = false, mugedaWakeToken = 0;
    function mugedaVoiceUrl(path) { return config.apiBase.replace(/\/$/, '') + path; }
    function reportMugedaVoiceEvent(event, extra) { var body = { event: event, engine: extra && extra.engine || 'mugeda-local-kws', device_class: window.matchMedia && window.matchMedia('(pointer:coarse)').matches ? 'mobile' : 'desktop' }; if (extra && Number.isFinite(extra.latency_ms)) body.latency_ms = Math.max(0, Math.round(extra.latency_ms)); fetch(mugedaVoiceUrl('/api/voice/events'), { method: 'POST', headers: { 'content-type': 'application/json', 'x-app-id': config.appId }, body: JSON.stringify(body), keepalive: true }).catch(function () {}); }
    function createMugedaVoiceSession(mode) { return fetch(mugedaVoiceUrl('/api/voice/session'), { method: 'POST', headers: { 'content-type': 'application/json', 'x-app-id': config.appId }, body: JSON.stringify({ sample_rate: 16000, mode: mode }) }).then(function (response) { return response.json().catch(function () { return {}; }).then(function (payload) { if (!response.ok || !payload.session_id) throw new Error(payload.message || '语音服务暂时不可用'); return payload; }); }); }
    function deleteMugedaVoiceSession(session) { if (!session) return; fetch(mugedaVoiceUrl('/api/voice/session/' + encodeURIComponent(session)), { method: 'DELETE', headers: { 'x-app-id': config.appId } }).catch(function () {}); }
    function acquireMugedaVoiceResources(mode) {
      var microphone = Promise.resolve().then(function () { return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } }); }).then(function (stream) { return { ok: true, value: stream }; }, function (error) { return { ok: false, error: error }; });
      var voiceSession = Promise.resolve().then(function () { return createMugedaVoiceSession(mode); }).then(function (payload) { return { ok: true, value: payload }; }, function (error) { return { ok: false, error: error }; });
      return Promise.all([microphone, voiceSession]).then(function (results) {
        var stream = results[0].ok ? results[0].value : null, payload = results[1].ok ? results[1].value : null;
        if (!results[0].ok || !results[1].ok) { if (stream) stream.getTracks().forEach(function (track) { track.stop(); }); if (payload && payload.session_id) deleteMugedaVoiceSession(payload.session_id); throw (results[0].error || results[1].error || new Error('语音服务暂时不可用')); }
        return [stream, payload];
      });
    }
    function prewarmMugedaWakeQuestion() {
      return acquireMugedaVoiceResources('transcribe').then(function (values) { return { values: values, error: null }; }, function (error) { return { values: null, error: error }; });
    }
    function releaseMugedaVoiceResources(result) {
      var values = result && result.values;
      if (!values) return;
      var stream = values[0], payload = values[1];
      if (stream) stream.getTracks().forEach(function (track) { track.stop(); });
      if (payload && payload.session_id) deleteMugedaVoiceSession(payload.session_id);
    }
    function mugedaWakeLevel(chunks) { var energy = 0, count = 0; (chunks || []).forEach(function (chunk) { for (var index = 0; index < chunk.length; index += 1) { energy += chunk[index] * chunk[index]; count += 1; } }); return Math.sqrt(energy / Math.max(1, count)); }
    function postMugedaVoiceChunk(session, chunks, inputRate, finish) {
      var body = pcmVoiceBody(resampleVoicePcm(chunks, inputRate));
      var url = mugedaVoiceUrl('/api/voice/session/' + encodeURIComponent(session) + '/chunk?sample_rate=16000' + (finish ? '&finish=1' : ''));
      return fetch(url, { method: 'POST', headers: { 'content-type': 'application/octet-stream', 'x-app-id': config.appId }, body: body }).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (payload) {
          if (!response.ok) throw new Error(payload.message || '实时语音识别暂时不可用');
          return payload;
        });
      });
    }
    function beginMugedaPcmRecorder(stream, onBatch) { var AudioContextClass = window.AudioContext || window.webkitAudioContext, context = new AudioContextClass(), source = context.createMediaStreamSource(stream), processor = context.createScriptProcessor(4096, 1, 1), chunks = [], chunkLength = 0, closed = false; if (context.state === 'suspended') context.resume().catch(function () {}); processor.onaudioprocess = function (event) { var chunk = new Float32Array(event.inputBuffer.getChannelData(0)); chunks.push(chunk); chunkLength += chunk.length; if (event.outputBuffer) event.outputBuffer.getChannelData(0).fill(0); if (chunkLength >= context.sampleRate * .25) { var batch = chunks; chunks = []; chunkLength = 0; onBatch(batch, context.sampleRate); } }; source.connect(processor); processor.connect(context.destination); return { finish: function () { if (closed) return Promise.resolve({ chunks: [], inputRate: context.sampleRate }); closed = true; processor.disconnect(); source.disconnect(); stream.getTracks().forEach(function (track) { track.stop(); }); var tail = chunks; return context.close().catch(function () {}).then(function () { return { chunks: tail, inputRate: context.sampleRate }; }); }, cancel: function () { if (closed) return; closed = true; processor.disconnect(); source.disconnect(); stream.getTracks().forEach(function (track) { track.stop(); }); context.close().catch(function () {}); } }; }
    function stopMugedaWakeStandby(options) { options = options || {}; var recorder = mugedaWakeRecorder, session = mugedaWakeSessionId; mugedaWakeGeneration += 1; mugedaWakeRecorder = null; mugedaWakeSessionId = ''; mugedaWakeStarting = false; mugedaWakeStartPromise = null; mugedaWakeQueue = Promise.resolve(); if (recorder) recorder.cancel(); deleteMugedaVoiceSession(session); launcher.classList.remove('listening'); if (!options.quiet && !mugedaWakeQuestionActive) setStatus('页面唤醒已关闭'); }
    function enqueueMugedaWakeChunk(chunks, inputRate) {
      var session = mugedaWakeSessionId, level = mugedaWakeLevel(chunks), now = Date.now();
      if (!session) return;
      if (level < Math.max(.007, mugedaWakeNoiseFloor * 1.45)) mugedaWakeNoiseFloor = mugedaWakeNoiseFloor * .96 + level * .04;
      var likelyVoice = level >= Math.max(.011, mugedaWakeNoiseFloor * 2.35);
      if (likelyVoice) { if (now - mugedaWakeLastVoiceAt > 650) mugedaWakeVoiceFrames = 0; mugedaWakeLastVoiceAt = now; mugedaWakeVoiceFrames += 1; }
      else if (now - mugedaWakeLastVoiceAt > 320) mugedaWakeVoiceFrames = 0;
      mugedaWakeQueue = mugedaWakeQueue.catch(function () {}).then(function () { if (session !== mugedaWakeSessionId) return null; return postMugedaVoiceChunk(session, chunks, inputRate, false); }).then(function (payload) {
        if (!payload || !payload.awake) return;
        if (now < mugedaWakeEchoGuardUntil || (!likelyVoice && now - mugedaWakeLastVoiceAt > 260)) return;
        if (mugedaWakeVoiceFrames < 2) return;
        if (Date.now() - mugedaWakeLastTriggerAt < MUGEDA_WAKE_COOLDOWN_MS) { reportMugedaVoiceEvent('wake_duplicate_suppressed'); return; }
        mugedaWakeVoiceFrames = 0; mugedaWakeLastTriggerAt = Date.now(); handleMugedaWakeDetected(payload);
      }).catch(function (error) { stopMugedaWakeStandby({ quiet: true }); setStatus(error.message || '页面唤醒暂时不可用', true); reportMugedaVoiceEvent('voice_error'); });
    }
    function startMugedaWakeStandby() {
      if (mugedaWakeRecorder) return Promise.resolve(true);
      if (!mugedaWakeEnabled || !mugedaWakeArmedThisVisit || document.hidden || !canCloudVoice || mugedaWakeQuestionActive || mugedaWakeTransitioning) return Promise.resolve(false);
      if (mugedaWakeStarting) return mugedaWakeStartPromise || Promise.resolve(false);
      var generation = ++mugedaWakeGeneration;
      mugedaWakeLastTriggerAt = 0; mugedaWakeNoiseFloor = .004; mugedaWakeLastVoiceAt = 0; mugedaWakeVoiceFrames = 0; mugedaWakeStarting = true; setStatus('正在开启页面唤醒');
      mugedaWakeStartPromise = acquireMugedaVoiceResources(MUGEDA_WAKE_REQUEST.mode).then(function (values) {
        var stream = values[0], payload = values[1];
        if (generation !== mugedaWakeGeneration || !mugedaWakeEnabled || !mugedaWakeArmedThisVisit || document.hidden || mugedaWakeTransitioning) { stream.getTracks().forEach(function (track) { track.stop(); }); deleteMugedaVoiceSession(payload.session_id); return false; }
        mugedaWakeSessionId = payload.session_id; mugedaWakeQueue = Promise.resolve(); mugedaWakeRecorder = beginMugedaPcmRecorder(stream, enqueueMugedaWakeChunk); launcher.classList.add('listening'); setStatus('正在等待“小槌小槌”'); reportMugedaVoiceEvent('wake_started', { engine: payload.engine || 'mugeda-local-kws' }); return true;
      }).catch(function (error) {
        if (generation === mugedaWakeGeneration) { setStatus(error.message || '页面唤醒暂时不可用，可使用点按说话', true); reportMugedaVoiceEvent('voice_error'); }
        return false;
      }).finally(function () { if (generation === mugedaWakeGeneration) { mugedaWakeStarting = false; mugedaWakeStartPromise = null; } });
      return mugedaWakeStartPromise;
    }
    function armMugedaWakeDuringSpeech() { if (!mugedaWakeEnabled || !mugedaWakeArmedThisVisit || document.hidden) return Promise.resolve(false); mugedaWakeEchoGuardUntil = Math.max(mugedaWakeEchoGuardUntil, Date.now() + MUGEDA_WAKE_ECHO_GUARD_MS); return startMugedaWakeStandby().catch(function () { return false; }); }
    function playMugedaWakeAcknowledgement() { if (mugedaWakeAck) { try { mugedaWakeAck.pause(); } catch (_) {} } return new Promise(function (resolve) { var finished = false, done = function () { if (finished) return; finished = true; mugedaWakeEchoGuardUntil = Date.now() + MUGEDA_WAKE_ECHO_GUARD_MS; window.clearTimeout(timer); resolve(); }; mugedaWakeAck = new Audio(mugedaVoiceUrl('/assets/voice/xiaochui-wake-response.wav?v=1.2.2')); mugedaWakeAck.onended = done; mugedaWakeAck.onerror = done; var timer = window.setTimeout(done, 1800), playback = mugedaWakeAck.play(); if (playback && playback.catch) playback.catch(function () { reportMugedaVoiceEvent('voice_error'); done(); }); }); }
    function handleMugedaWakeDetected(payload) { mugedaWakeTransitioning = true; stopMugedaWakeStandby({ quiet: true }); stopSpeech(); cancelMugedaAnswerForWake(); suspendPageAudio(); open(); setStatus('小槌我在'); reportMugedaVoiceEvent('wake_detected', { engine: payload.engine || 'mugeda-local-kws' }); var questionResources = prewarmMugedaWakeQuestion(); playMugedaWakeAcknowledgement().then(function () { mugedaWakeTransitioning = false; startMugedaWakeQuestion(questionResources); }); }
    function stopMugedaWakeQuestion(options) { options = options || {}; var recorder = mugedaWakeQuestionRecorder, session = mugedaWakeQuestionSessionId; window.clearTimeout(mugedaWakeQuestionTimer); mugedaWakeQuestionTimer = 0; mugedaWakeQuestionActive = false; mugedaWakeQuestionFinishing = false; mugedaWakeQuestionRecorder = null; mugedaWakeQuestionSessionId = ''; mugedaWakeQuestionQueue = Promise.resolve(); if (recorder) recorder.cancel(); deleteMugedaVoiceSession(session); if (!options.quiet) setStatus('没有听到完整问题，已恢复待机'); if (options.rearm !== false) resumeMugedaWakeIfEnabled(); }
    function enqueueMugedaWakeQuestionChunk(chunks, inputRate, finish) { var session = mugedaWakeQuestionSessionId; if (!session) return Promise.resolve(null); mugedaWakeQuestionQueue = mugedaWakeQuestionQueue.catch(function () {}).then(function () { if (session !== mugedaWakeQuestionSessionId) return null; return postMugedaVoiceChunk(session, chunks, inputRate, Boolean(finish)); }).then(function (payload) { if (!payload) return null; if (payload.text) mugedaWakeQuestionText = normalizeVoiceText(payload.text); if (!finish && payload.endpoint && mugedaWakeQuestionText) completeMugedaWakeQuestion(); return payload; }); return mugedaWakeQuestionQueue; }
    function completeMugedaWakeQuestion() { if (!mugedaWakeQuestionActive || mugedaWakeQuestionFinishing) return; mugedaWakeQuestionFinishing = true; window.clearTimeout(mugedaWakeQuestionTimer); mugedaWakeQuestionTimer = 0; var recorder = mugedaWakeQuestionRecorder; mugedaWakeQuestionRecorder = null; if (!recorder) { stopMugedaWakeQuestion({ quiet: true }); return; } setStatus('正在确认你的问题'); recorder.finish().then(function (tail) { return enqueueMugedaWakeQuestionChunk(tail.chunks.length ? tail.chunks : [new Float32Array(320)], tail.inputRate, true); }).then(function (payload) { var text = normalizeVoiceText((payload && payload.text) || mugedaWakeQuestionText); var session = mugedaWakeQuestionSessionId; mugedaWakeQuestionSessionId = ''; deleteMugedaVoiceSession(session); mugedaWakeQuestionActive = false; mugedaWakeQuestionFinishing = false; if (Array.from(text.replace(/\s/g, '')).length < 2) { setStatus('没有听清完整问题，请再说一次', true); resumeMugedaWakeIfEnabled(); return; } input.value = text; reportMugedaVoiceEvent('question_submitted'); setStatus('问题已发送，正在组织回答'); ask(text, { replaceActive: true }); resumeMugedaWakeIfEnabled(); }).catch(function (error) { mugedaWakeQuestionFinishing = false; stopMugedaWakeQuestion({ quiet: true }); setStatus(error.message || '语音识别暂时不可用', true); resumeMugedaWakeIfEnabled(); }); }
    function startMugedaWakeQuestion(prewarmed) { if (!canCloudVoice || document.hidden) { mugedaWakeTransitioning = false; if (prewarmed) prewarmed.then(releaseMugedaVoiceResources); resumeMugedaWakeIfEnabled(); return; } stopMugedaWakeQuestion({ quiet: true, rearm: false }); mugedaWakeQuestionActive = true; mugedaWakeQuestionText = ''; setStatus('正在听你的问题'); var token = ++mugedaWakeToken; mugedaWakeQuestionTimer = window.setTimeout(function () { if (token !== mugedaWakeToken || !mugedaWakeQuestionActive) return; reportMugedaVoiceEvent('wake_timeout'); stopMugedaWakeQuestion({ quiet: false }); }, 9000); (prewarmed || prewarmMugedaWakeQuestion()).then(function (result) { if (result.error) throw result.error; var values = result.values, stream = values[0], payload = values[1]; if (token !== mugedaWakeToken || !mugedaWakeQuestionActive) { releaseMugedaVoiceResources(result); return; } mugedaWakeQuestionSessionId = payload.session_id; mugedaWakeQuestionQueue = Promise.resolve(); mugedaWakeQuestionRecorder = beginMugedaPcmRecorder(stream, function (chunks, inputRate) { enqueueMugedaWakeQuestionChunk(chunks, inputRate, false).catch(function (error) { stopMugedaWakeQuestion({ quiet: true }); setStatus(error.message || '语音识别暂时不可用', true); }); }); }).catch(function (error) { if (token !== mugedaWakeToken) return; stopMugedaWakeQuestion({ quiet: true }); setStatus(error.message || '语音识别暂时不可用', true); }); }
    function resumeMugedaWakeIfEnabled() { if (!mugedaWakeEnabled || !mugedaWakeArmedThisVisit || document.hidden || mugedaWakeRecorder || mugedaWakeQuestionActive || mugedaWakeStarting || mugedaWakeTransitioning) return; window.setTimeout(startMugedaWakeStandby, 160); }
    window.addEventListener('pagehide', function () { stopMugedaWakeQuestion({ quiet: true, rearm: false }); stopMugedaWakeStandby({ quiet: true }); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) { stopMugedaWakeQuestion({ quiet: true, rearm: false }); stopMugedaWakeStandby({ quiet: true }); } });

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

    window.MugedaYinggeAgent = { open: open, close: shut, ask: ask, setScene: function (scene) { config.scene = scene; }, version: '1.5.3' };
    window.YinggeAgentWidget = window.MugedaYinggeAgent;
    if (config.autoOpen) open();
    window.dispatchEvent(new CustomEvent('yingge-agent-ready'));
  });
})();
