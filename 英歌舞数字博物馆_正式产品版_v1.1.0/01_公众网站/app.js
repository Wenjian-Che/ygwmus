const frontierStyles=document.createElement('link');frontierStyles.rel='stylesheet';frontierStyles.href='frontier.css';document.head.appendChild(frontierStyles);
if(location.pathname.endsWith('/archive.html')){
  const archiveStyles=document.createElement('link');archiveStyles.rel='stylesheet';archiveStyles.href='archive-exhibit.css';document.head.appendChild(archiveStyles);
  const archiveScript=document.createElement('script');archiveScript.src='archive-exhibit.js';archiveScript.defer=true;document.head.appendChild(archiveScript);
}
const publicPath=location.pathname.split('/').pop()||'index.html';
function resolveYinggeApiBase(){
  const local=location.hostname==='127.0.0.1'||location.hostname==='localhost';
  return local?`${location.protocol}//${location.hostname}:8787`:location.origin;
}
const YINGGE_API_BASE=resolveYinggeApiBase();
function createClientId(){
  if(globalThis.crypto?.randomUUID)return globalThis.crypto.randomUUID();
  const bytes=new Uint8Array(16);
  if(globalThis.crypto?.getRandomValues){
    globalThis.crypto.getRandomValues(bytes);
    bytes[6]=(bytes[6]&15)|64;
    bytes[8]=(bytes[8]&63)|128;
    const hex=Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }
  return `yingge-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,12)}`;
}
if(publicPath!=='index.html'){
  const editorialStyles=document.createElement('link');editorialStyles.rel='stylesheet';editorialStyles.href='museum-editorial.css?v=20260831-mobile2';document.head.appendChild(editorialStyles);
}
function normalizeMuseumNavigation(){
  const header=document.querySelector('.site-header');
  if(!header||publicPath==='index.html'||publicPath==='')return;
  const nav=header.querySelector(':scope > nav');
  if(!nav)return;
  header.querySelector(':scope > .button')?.remove();
  const addLink=(parent,href,label,className='')=>{
    const link=document.createElement('a');
    link.href=href;
    link.textContent=label;
    if(/^https:\/\//i.test(href)){link.target='_blank';link.rel='noopener noreferrer'}
    if(className)link.className=className;
    if(publicPath===href){
      link.setAttribute('aria-current','page');
    }
    parent.appendChild(link);
    return link;
  };
  nav.replaceChildren();
  nav.setAttribute('aria-label','数字博物馆导航');
  [
    ['index.html','首页'],
    ['content.html','馆藏总览'],
    ['learn.html','认识英歌'],
    ['spread.html','英歌出海'],
    ['framework-museum.html','专题展馆']
  ].forEach(([href,label])=>addLink(nav,href,label,'museum-primary-link'));
  const details=document.createElement('details');
  details.className='museum-menu';
  const summary=document.createElement('summary');
  summary.textContent='在线展馆';
  const panel=document.createElement('div');
  panel.className='museum-menu-panel glass';
  const exhibits=[
    ['watch.html','01','看英歌'],
    ['characters.html','02','识角色'],
    ['formation.html','03','练阵形'],
    ['sound.html','04','听锣鼓'],
    ['regions.html','05','游地域'],
    ['archive.html','06','查档案']
  ];
  exhibits.forEach(([href,index,label])=>{
    const link=addLink(panel,href,'');
    const number=document.createElement('span');
    number.textContent=index;
    const strong=document.createElement('strong');
    strong.textContent=label;
    link.replaceChildren(number,strong);
    if(publicPath===href){
      details.classList.add('is-current');
      summary.setAttribute('aria-current','page');
    }
  });
  details.append(summary,panel);
  nav.appendChild(details);
}
normalizeMuseumNavigation();
function setupMobileMuseumNavigation(){
  const header=document.querySelector('.site-header');
  if(!header||header.querySelector('#mobileMenuToggle'))return;
  const toggle=document.createElement('button');
  toggle.type='button';
  toggle.id='mobileMenuToggle';
  toggle.className='mobile-menu-toggle button button-glass';
  toggle.setAttribute('aria-expanded','false');
  toggle.setAttribute('aria-controls','mobileMuseumNav');
  toggle.setAttribute('aria-label','打开网站导航');
  toggle.innerHTML='<svg class="mobile-menu-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span class="mobile-menu-label">菜单</span>';
  const panel=document.createElement('div');
  panel.id='mobileMuseumNav';
  panel.className='mobile-nav-panel glass';
  panel.hidden=true;
  const heading=document.createElement('div');
  heading.className='mobile-nav-heading';
  heading.innerHTML='<strong>英歌舞数字博物馆</strong><button type="button" class="mobile-nav-close button button-glass" aria-label="关闭网站导航">关闭</button>';
  const mobileNav=document.createElement('nav');
  mobileNav.className='mobile-nav-links';
  mobileNav.setAttribute('aria-label','主要导航');
  [
    ['index.html','首页'],
    ['https://5.mgd5.com/c/oiru/8vtt/index.html','云游英歌'],
    ['index.html#collections','馆藏档案'],
    ['framework-museum.html','专题展馆']
  ].forEach(([href,label])=>{
    const link=document.createElement('a');
    link.href=href;
    link.textContent=label;
    if(/^https:\/\//i.test(href)){link.target='_blank';link.rel='noopener noreferrer'}
    if((publicPath==='index.html'||publicPath==='')&&href==='index.html')link.setAttribute('aria-current','page');
    mobileNav.appendChild(link);
  });
  const section=document.createElement('div');
  section.className='mobile-nav-section';
  section.innerHTML='<span>在线展馆</span>';
  const exhibitNav=document.createElement('nav');
  exhibitNav.className='mobile-nav-exhibits';
  exhibitNav.setAttribute('aria-label','在线展馆');
  [
    ['watch.html','看英歌'],
    ['characters.html','识角色'],
    ['formation.html','练阵形'],
    ['sound.html','听锣鼓'],
    ['regions.html','游地域'],
    ['archive.html','查档案']
  ].forEach(([href,label],index)=>{
    const link=document.createElement('a');
    link.href=href;
    link.innerHTML=`<span>${String(index+1).padStart(2,'0')}</span><strong>${label}</strong>`;
    if(publicPath===href)link.setAttribute('aria-current','page');
    exhibitNav.appendChild(link);
  });
  const guideButton=document.createElement('button');
  guideButton.type='button';
  guideButton.className='mobile-nav-guide button button-primary';
  guideButton.setAttribute('data-guide-open','');
  guideButton.textContent='问小槌';
  panel.append(heading,mobileNav,section,exhibitNav,guideButton);
  const closeButton=heading.querySelector('.mobile-nav-close');
  const close=()=>{
    panel.hidden=true;
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label',document.documentElement.dataset.locale==='en'?'Open site navigation':'打开网站导航');
    header.classList.remove('menu-open');
    document.body.classList.remove('mobile-nav-open');
    if(panel.contains(document.activeElement))toggle.focus();
  };
  const open=()=>{
    panel.hidden=false;
    toggle.setAttribute('aria-expanded','true');
    toggle.setAttribute('aria-label',document.documentElement.dataset.locale==='en'?'Close site navigation':'关闭网站导航');
    header.classList.add('menu-open');
    document.body.classList.add('mobile-nav-open');
    panel.querySelector('a,button')?.focus();
  };
  toggle.addEventListener('click',()=>panel.hidden?open():close());
  closeButton.addEventListener('click',close);
  panel.addEventListener('click',event=>{
    if(event.target.closest('a,[data-guide-open]'))close();
  });
  document.addEventListener('pointerdown',event=>{
    if(!panel.hidden&&!header.contains(event.target))close();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!panel.hidden)close();
  });
  window.addEventListener('resize',()=>{
    if(window.innerWidth>900&&!panel.hidden)close();
  });
  header.append(toggle,panel);
}
setupMobileMuseumNavigation();
const guideStyles=document.createElement('link');guideStyles.rel='stylesheet';guideStyles.href='guide-agent.css?v=20260911-voice10';document.head.appendChild(guideStyles);
const setPublicText=(selector,value)=>{const node=document.querySelector(selector);if(node)node.textContent=value};
const removePublic=(selector)=>document.querySelector(selector)?.remove();
if(publicPath==='index.html'||publicPath===''){
  removePublic('.experience-h5');
  document.querySelector('.experience-layout')?.classList.add('is-two-exhibits');
  setPublicText('#experiences .section-title h2','从这里开始');
  setPublicText('#experiences .section-title p','先通过现场照片和观看导览建立整体印象，遇到不懂的动作、人物与地方差异，随时问英歌小槌。');
  setPublicText('.experience-main p','从一个现场瞬间学习整体观察顺序，再继续理解动作、声音、队形和角色。');
  setPublicText('.experience-main .button','进入观看导览');
  const homeExperienceImage=document.querySelector('.experience-main>img');if(homeExperienceImage)homeExperienceImage.alt='英歌观看导览概念示意';
  setPublicText('#collections .section-title p','你可以从动作、角色、声音、地域或资料来源入手，继续认识英歌。');
  setPublicText('footer>span','从动作、角色、声音、阵形与地方传统认识英歌');
}
if(publicPath==='content.html'){
  setPublicText('.museum-hero .deck','从动作、角色、声音、阵形、地域和档案中，选择你最想先了解的部分。');
  setPublicText('#coreExhibits .museum-heading h2','两条主要参观路径');
  setPublicText('#coreExhibits .museum-heading p','先用现场照片和结构说明建立整体印象，再通过英歌小槌追问动作、人物与地方差异。');
  setPublicText('#coreExhibits .core-exhibit-primary p','从一个现场瞬间学习观察顺序，再把动作、声音、队形和角色放回具体队伍与来源。');
  document.querySelector('#coreExhibits .core-exhibit-index')?.classList.add('is-two-exhibits');
  const routeList=document.querySelector('.route-list');
  if(routeList&&!routeList.querySelector('a[href="spread.html"]')){
    routeList.insertAdjacentHTML('afterbegin','<a href="spread.html"><strong>英歌出海</strong><p>沿泰国、马来西亚与新加坡三段真实事件，理解英歌怎样进入新的社区。</p><span>进入专题</span></a>');
  }
  setPublicText('#collectionLogic .collection-logic article:first-child p','完整画面、段落、拍摄时间、地点与表演队伍。');
  setPublicText('#collectionLogic .collection-logic article:last-child p','名录、标准、政府资料、队伍材料与田野记录。');
}
if(publicPath==='watch.html'){
  setPublicText('#film .museum-heading h2','从一个现场瞬间开始观察');
  setPublicText('#film .museum-heading p','照片可以帮助辨认人物、姿态和装束，却不能呈现速度、路线和完整变阵。后面的观看方法会把这些观察边界说清楚。');
  setPublicText('.museum-subnav a[href="#film"]','观看入口');
  const filmImage=document.querySelector('#film .media-stage>img');if(filmImage)filmImage.alt='英歌观看结构概念示意';
  removePublic('#film .empty-state');removePublic('#film .exhibit-caption');
}
if(publicPath==='sound.html'){
  removePublic('.museum-subnav a[href="#audio"]');
  removePublic('#audio');
}
if(publicPath==='characters.html')removePublic('.record-prompt');
if(publicPath==='regions.html'){
  setPublicText('#map .museum-heading p','选择地图中的地区，比较英歌在不同社区、队伍与年代中的具体差异。');
  setPublicText('.region-story dl>div:last-child dt','继续观察');
  setPublicText('#regionEvidence','接下来可以查看潮阳、潮南的具体队伍和不同时期。');
  setPublicText('.map-disclaimer','地图用于地区索引。行政边界与地名以国家标准地图服务公布信息为准。');
  setPublicText('#boundary .source-note strong','同一地名，也有时间差异');
}
const ADMIN_CONTENT_API=`${YINGGE_API_BASE}/api/site-content`;
document.querySelector('.museum-menu summary')?.replaceChildren(document.createTextNode('在线展馆'));
if(document.querySelector('#collections .section-title')&&!document.querySelector('.origin-entry'))document.querySelector('#collections .section-title').insertAdjacentHTML('beforeend','<a class="origin-entry" href="learn.html#origin"><span>先看英歌从哪里来</span><small>了解英歌的来历，以及目前能找到的几种解释</small><b aria-hidden="true">↗</b></a>');
const applyManagedContent=(content={})=>{
  const set=(selector,value)=>{const node=document.querySelector(selector);if(node&&typeof value==='string'&&value.trim())node.textContent=value};
  set('.hero-label',content.hero?.eyebrow);set('.hero h1 span:nth-child(1)',content.hero?.titleLine1);set('.hero h1 span:nth-child(2)',content.hero?.titleLine2);set('.hero-body',content.hero?.body);set('.hero-actions .button-primary',content.hero?.primaryCta);set('#experiences .section-title h2',content.experiences?.title);set('#experiences .section-title p',content.experiences?.intro);
  const cards=content.experiences?.cards||{};set('.experience-main h3',cards.video?.title);set('.experience-main p',cards.video?.description);set('.experience-h5 h3',cards.h5?.title);set('.experience-h5 p',cards.h5?.description);set('.experience-guide h3',cards.agent?.title);set('.experience-guide p',cards.agent?.description);
  window.__yinggeLocaleRefresh?.();
};
if(new URLSearchParams(location.search).has('admin-preview'))window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==window.parent||event.data?.type!=='yingge:site-content-preview')return;
  if(event.data.content&&typeof event.data.content==='object')applyManagedContent(event.data.content);
});
try{const cached=JSON.parse(localStorage.getItem('yingge-site-content')||'null');if(cached)applyManagedContent(cached)}catch{}
if(publicPath==='index.html'||publicPath==='')fetch(ADMIN_CONTENT_API).then(response=>response.ok?response.json():null).then(content=>{if(content){applyManagedContent(content);localStorage.setItem('yingge-site-content',JSON.stringify(content))}}).catch(()=>{});

const guideContexts={
  'index.html':{topic:'总览',hint:'看不懂的动作、人物和地方差异，都可以问我。',prompts:[['用一句话说明什么是英歌','什么是英歌？'],['第一次看英歌应该先看什么？','第一次怎么看？'],['英歌为什么持双槌？','为什么持双槌？']]},
  'content.html':{topic:'参观路径',hint:'不知道从哪里开始，我可以按你的兴趣带路。',prompts:[['想快速认识英歌，应该按什么顺序参观？','怎样开始参观？'],['英歌有哪些最值得了解的部分？','核心看点是什么？'],['我对英歌的起源感兴趣，应该去哪里看？','从起源开始']]},
  'learn.html':{topic:'认识英歌',hint:'起源、节奏类型与地方差异，可以继续追问。',prompts:[['英歌的起源有哪些说法？','起源有哪些说法？'],['英歌慢板、中板和快板有什么不同？','三种节奏有什么不同？'],['哪些内容有文献依据，哪些是民间解释？','依据可靠吗？']]},
  'watch.html':{topic:'观看方法',hint:'我可以陪你从整体队形看到一个具体动作。',prompts:[['第一次看英歌表演应该先看什么？','先看什么？'],['怎样看懂队员之间的配合？','怎样看配合？'],['表演中的槌击和锣鼓是什么关系？','声音怎样配合？']]},
  'characters.html':{topic:'角色与装束',hint:'脸谱不是简单的颜色对照表，我会说明判断边界。',prompts:[['英歌中的头槌和二槌分别做什么？','头槌和二槌'],['脸谱颜色能直接判断角色吗？','怎样看脸谱？'],['英歌槌、头饰和服装各有什么作用？','装束有什么作用？']]},
  'formation.html':{topic:'阵形互动',hint:'点击阵形观看后，也可以问我队伍为何这样走。',prompts:[['麦穗花阵是怎样形成的？','麦穗花阵'],['英歌阵形为什么会变化？','阵形为何变化？'],['鼓点怎样指挥队形转换？','怎样听指挥？']]},
  'sound.html':{topic:'锣鼓与节奏',hint:'从鼓点、槌击到吆喝，我可以帮你逐层听懂。',prompts:[['英歌表演中鼓点有什么作用？','鼓点做什么？'],['槌击声和锣鼓怎样配合？','声音怎样配合？'],['快板和慢板听起来有什么区别？','快慢怎样分？']]},
  'regions.html':{topic:'地方流变',hint:'选择地区后，可以继续比较社区、队伍和年代差异。',prompts:[['潮阳英歌和普宁英歌有什么差异？','潮阳与普宁'],['为什么不同队伍的英歌看起来不同？','为何各队不同？'],['谈地方差异时需要注意什么？','怎样避免误解？']]},
  'archive.html':{topic:'档案与证据',hint:'我会区分正式资料、队伍记录与民间叙述。',prompts:[['关于英歌起源，哪些资料更可靠？','怎样判断来源？'],['英歌与梁山英雄的关系有证据吗？','梁山说法可靠吗？'],['怎样引用馆内的英歌资料？','怎样引用资料？']]}
};
const guideContext=guideContexts[publicPath]||guideContexts['index.html'];
const contextualQuestions={
  'content.html':{selector:'#coreExhibits .museum-heading',question:'如果我第一次参观英歌舞数字博物馆，应该按什么顺序看？',label:'问小槌：帮我安排参观顺序'},
  'watch.html':{selector:'#read .museum-heading',question:'看一场英歌时，怎样把身体、双槌、节拍和队形联系起来？',label:'问小槌：怎样看懂四层配合'},
  'characters.html':{selector:'#method .definition',question:'辨认英歌角色时，队伍位置、脸谱、服饰和道具应该按什么顺序看？',label:'问小槌：带我辨认一个角色'},
  'formation.html':{selector:'#evidence>div:first-child',question:'看英歌变阵时，应该怎样观察队员的位置、路线和变化信号？',label:'问小槌：带我读懂一次变阵'},
  'sound.html':{selector:'#layers .museum-heading',question:'英歌中的鼓、锣钹、槌击和吆喝怎样共同组织动作？',label:'问小槌：带我听懂声音层次'},
  'regions.html':{selector:'#compare .definition',question:'比较不同地区的英歌时，为什么要具体到社区、队伍、师承和年代？',label:'问小槌：怎样比较地方版本'},
  'archive.html':{selector:'#levels .museum-heading',question:'判断一条英歌相关说法是否可靠，应该先检查哪些资料和边界？',label:'问小槌：帮我核对一条说法'}
};
const contextualQuestion=contextualQuestions[publicPath];
if(contextualQuestion){
  const host=document.querySelector(contextualQuestion.selector);
  if(host&&!host.querySelector('.context-agent-question')){
    const button=document.createElement('button');
    button.type='button';button.className='context-agent-question';button.dataset.agentQuestion=contextualQuestion.question;button.textContent=contextualQuestion.label;host.appendChild(button);
  }
}
const guidePromptMarkup=guideContext.prompts.map(([question,label])=>`<button type="button" data-agent-question="${question}">${label}</button>`).join('');
if(!document.querySelector('.museum-companion'))document.body.insertAdjacentHTML('beforeend',`<aside class="museum-companion" aria-label="英歌小槌导览"><div class="companion-callout"><strong>小槌陪你看英歌</strong><span>${guideContext.hint}</span><button type="button" aria-label="收起提示">×</button></div><button class="companion-main" type="button" data-guide-open aria-label="打开英歌小槌导览" aria-expanded="false"><span class="companion-sprite" aria-hidden="true"></span><span class="companion-label">问小槌</span></button></aside>`);
if(!document.querySelector('.guide-backdrop'))document.body.insertAdjacentHTML('beforeend','<button class="guide-backdrop" type="button" aria-label="关闭英歌小槌导览"></button>');
if(!document.querySelector('#guidePanel'))document.body.insertAdjacentHTML('beforeend',`<aside class="guide-panel glass" id="guidePanel" aria-hidden="true" data-agent-state="idle"><button class="guide-close" type="button">关闭</button><div class="guide-head"><div><h2>英歌小槌</h2><p><span class="agent-status-dot"></span><span id="agentStatus">正在连接知识库</span></p></div></div><p class="guide-context">正在陪你参观：${guideContext.topic}</p><div class="agent-messages" id="agentMessages" role="log" aria-live="polite"><div class="agent-welcome"><strong>你好，我是英歌小槌。</strong><p>${guideContext.hint} 回答会尽量说明资料来源和适用范围。</p></div></div><div class="guide-prompts">${guidePromptMarkup}</div><form id="agentForm"><label for="question">输入问题</label><div><input id="question" maxlength="500" autocomplete="off" placeholder="问一个与英歌有关的问题"><button type="submit">发送</button></div><p class="agent-note">回答来自项目知识库，涉及地区、队伍和年代时会说明边界。</p></form></aside>`);
const guidePanelSetup=document.querySelector('#guidePanel');
if(guidePanelSetup){
  guidePanelSetup.dataset.agentState='idle';
  const guideHead=guidePanelSetup.querySelector('.guide-head');
  if(guideHead&&!guideHead.querySelector('.guide-avatar-sprite'))guideHead.insertAdjacentHTML('afterbegin','<span class="guide-avatar-sprite" aria-hidden="true"></span>');
  if(!guidePanelSetup.querySelector('.guide-reset'))guidePanelSetup.insertAdjacentHTML('afterbegin','<button class="guide-reset" type="button">清空对话</button>');
  const guidePrompts=guidePanelSetup.querySelector('.guide-prompts');if(guidePrompts)guidePrompts.innerHTML=guidePromptMarkup;
  let guideContextNode=guidePanelSetup.querySelector('.guide-context');if(!guideContextNode){guideContextNode=document.createElement('p');guideContextNode.className='guide-context';guidePanelSetup.querySelector('.agent-messages')?.before(guideContextNode)}guideContextNode.textContent='正在陪你参观：'+guideContext.topic;
  const guideForm=guidePanelSetup.querySelector('#agentForm');
  if(guideForm&&!guideForm.querySelector('.voice-control-row')){
    const voiceControls=document.createElement('div');
    voiceControls.className='voice-control-row';
    voiceControls.setAttribute('aria-label','语音功能');
    voiceControls.innerHTML='<button type="button" data-wake-toggle aria-pressed="false"><img class="voice-control-icon" src="assets/icons/tabler-microphone.svg" alt=""><span data-voice-label>开启语音唤醒</span></button><button type="button" data-voice-input data-voice-target="question" aria-pressed="false"><img class="voice-control-icon" src="assets/icons/tabler-microphone.svg" alt=""><span data-voice-label>语音输入</span></button><button type="button" data-voice-output aria-pressed="false"><img class="voice-control-icon" src="assets/icons/tabler-volume.svg" alt=""><span data-voice-label>小槌朗读：开</span></button><button type="button" data-voice-stop hidden><img class="voice-control-icon" src="assets/icons/tabler-player-stop.svg" alt=""><span data-voice-label>停止朗读</span></button><div class="voice-state-card" data-voice-stage="idle"><span class="voice-state-mark" aria-hidden="true"><i></i></span><span class="voice-state-copy"><strong data-voice-state-label>语音就绪</strong><span data-voice-status aria-live="polite">点击开启唤醒，或直接使用语音输入</span></span><span class="voice-live-indicator" data-voice-activity hidden aria-hidden="true"><i></i><i></i><i></i><i></i></span></div><span class="voice-privacy-note">语音仅用于实时识别，不保存原始录音</span>';
    guideForm.querySelector('.agent-note')?.before(voiceControls);
  }
}

const createYinggeVoice=()=>{
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  const voiceSecureContext=window.isSecureContext===true;
  const canUseRecognition=voiceSecureContext&&Boolean(Recognition);
  const canRecordLocally=Boolean(voiceSecureContext&&navigator.mediaDevices?.getUserMedia&&AudioContextClass&&window.fetch);
  const isCoarsePointer=window.matchMedia('(pointer: coarse)').matches||navigator.maxTouchPoints>0;
  const canSpeak='speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
  const SPEECH_CHUNK_TARGET=64;
  const voiceApi=`${YINGGE_API_BASE}/api/voice`;
  const WAKE_ACK_URL='assets/voice/xiaochui-wake-response.wav';
  const OUTPUT_KEY='yingge-voice-output-enabled';
  let recognition=null;
  let recognitionTimer=0;
  let localRecordingTimer=0;
  let autoFinishTimer=0;
  let listeningPhase='idle';
  let localRecorder=null;
  let streamingRecorder=null;
  let streamingSessionId='';
  let streamingQueue=Promise.resolve();
  let streamingChunks=[];
  let streamingChunkLength=0;
  let activeButton=null;
  let activeInput=null;
  let initialInput='';
  let recognizedText='';
  let speaking=false;
  let speechRun=0;
  let liveSpeechQueue={phrases:[],source:'',queued:0,done:true,started:false};
  let outputEnabled=sessionStorage.getItem(OUTPUT_KEY)!=='0';
  let voices=canSpeak?window.speechSynthesis.getVoices():[];
  let localCapabilities={asr:false,wake:false,tts:false};
  let currentAudio=null;
  let currentAudioUrl='';
  let wakeState='off';
  let wakeRecorder=null;
  let wakeBrowserRecognition=null;
  let wakeRestartTimer=0;
  let wakeUsesBrowser=false;
  let wakeSessionId='';
  let wakeChunks=[];
  let wakeChunkLength=0;
  let wakeQueue=Promise.resolve();
  let wakeSignalStatusAt=0;
  let wakeQuestionTimer=0;
  let wakeConfirmTimer=0;
  let wakeQuestionCandidate='';
  let wakeAckAudio=null;
  let wakeAckPlaying=false;
  let wakeAckStartedAt=0;
  let wakeAckVoiceFrames=0;
  let wakeAckPrimed=false;
  let wakeFlowToken=0;
  let resumeWakeAfterManual=false;
  let holdReleaseRequested=false;
  let ignoreVoiceClickUntil=0;
  const voiceHoldTimers=new WeakMap();
  const voiceHoldActive=new WeakSet();

  const inferVoicePhase=text=>{
    const value=String(text||'');
    if(/失败|不可用|不支持|未找到|占用|请允许|无法使用|没有响应/.test(value))return'error';
    if(/已关闭/.test(value))return'off';
    if(/正在开启|连接麦克风|组织语气/.test(value))return'starting';
    if(/唤醒词|唤醒监听|待机/.test(value))return'standby';
    if(/回应|已唤醒|我在|继续说|秒内/.test(value))return'awake';
    if(/实时转写|正在听|正在聆听|检测到语音/.test(value))return'listening';
    if(/正在识别|正在确认|听清了/.test(value))return'recognizing';
    if(/正在回答|思考/.test(value))return'thinking';
    if(/朗读|声音播放/.test(value))return'speaking';
    if(/追问|完成/.test(value))return'followup';
    return'idle';
  };
  const voicePhaseLabels={idle:'语音就绪',off:'唤醒已关闭',starting:'正在连接',standby:'等待唤醒',awake:'小槌已回应',listening:'正在聆听',recognizing:'正在识别',thinking:'正在组织回答',speaking:'正在朗读',followup:'等待追问',error:'语音暂不可用'};
  const voiceStatus=(text,phase='')=>{
    const resolved=phase||inferVoicePhase(text);
    document.querySelectorAll('[data-voice-status]').forEach(node=>{
      node.textContent=window.yinggeLocale?.translate(text)||text;
      const card=node.closest('[data-voice-stage]');
      if(!card)return;
      card.dataset.voiceStage=resolved;
      const label=card.querySelector('[data-voice-state-label]');
      if(label)label.textContent=window.yinggeLocale?.translate(voicePhaseLabels[resolved]||voicePhaseLabels.idle)||voicePhaseLabels[resolved]||voicePhaseLabels.idle;
      const activity=card.querySelector('[data-voice-activity]');
      if(activity)activity.hidden=!['starting','awake','listening','recognizing','speaking'].includes(resolved);
    });
  };
  const updateVoiceActivity=active=>document.querySelectorAll('[data-voice-activity]').forEach(node=>{node.hidden=!active});
  const updateWakeControls=()=>{
    document.querySelectorAll('[data-wake-toggle]').forEach(button=>{
      const active=wakeState!=='off';
      button.disabled=!canRecordLocally||(!localCapabilities.wake&&wakeState==='off');
      button.setAttribute('aria-pressed',String(active));
      button.classList.toggle('is-listening',active);
      const label=button.querySelector('[data-voice-label]');
      if(label)label.textContent=!voiceSecureContext?'唤醒需 HTTPS':wakeState==='starting'?'正在开启':wakeState==='awake'?'正在听问题':wakeState==='confirming'?'正在确认':wakeState==='speaking'?'可语音打断':wakeState==='answering'?'回答中':active?'唤醒监听中':'开启语音唤醒';
    });
  };
  const updateOutputControls=()=>{
    document.querySelectorAll('[data-voice-output]').forEach(button=>{
      button.disabled=!(canSpeak||localCapabilities.tts);
      button.setAttribute('aria-pressed',String(outputEnabled));
      button.classList.toggle('is-active',outputEnabled);
      const label=button.querySelector('[data-voice-label]');if(label)label.textContent=(canSpeak||localCapabilities.tts)?'小槌朗读：'+(outputEnabled?'开':'关'):'当前设备不支持朗读';
    });
    document.querySelectorAll('[data-voice-stop]').forEach(button=>{button.hidden=!speaking});
  };
  const resetInputControls=()=>{
    document.querySelectorAll('[data-voice-input]').forEach(button=>{
      const active=button===activeButton&&listeningPhase!=='idle';
      button.setAttribute('aria-pressed',String(active));
      button.classList.toggle('is-listening',active);
      const endingHint=isCoarsePointer&&voiceHoldActive.has(button)?'松开结束':'再次点击结束';
      const activeLabel=listeningPhase==='requesting'?'正在连接麦克风':listeningPhase==='streaming'?`实时转写中 · ${endingHint}`:listeningPhase==='recording'?`正在聆听 · ${endingHint}`:listeningPhase==='processing'?'正在确认文字':`正在听 · ${endingHint}`;
      const idleLabel=isCoarsePointer?'点击或按住说话':'语音输入';
      const label=button.querySelector('[data-voice-label]');if(label)label.textContent=active?activeLabel:!voiceSecureContext?'语音输入需 HTTPS':(canUseRecognition||canRecordLocally)?idleLabel:'浏览器不支持语音输入';
      button.disabled=!(canUseRecognition||canRecordLocally);
    });
    updateVoiceActivity(['requesting','streaming','recording','listening','processing'].includes(listeningPhase));
  };
  const stopSpeaking=({rearm=true,announce=true}={})=>{
    speechRun+=1;
    if(canSpeak)window.speechSynthesis.cancel();
    if(currentAudio){currentAudio.pause();currentAudio=null}
    if(currentAudioUrl){URL.revokeObjectURL(currentAudioUrl);currentAudioUrl=''}
    speaking=false;
    updateOutputControls();
    if(announce)voiceStatus(outputEnabled?'朗读已停止，可以继续提问':'');
    if(rearm){if(['answering','speaking'].includes(wakeState))enterFollowupWindow();else rearmWakeStandby()}
  };
  const stopListening=()=>{
    window.clearTimeout(recognitionTimer);
    window.clearTimeout(localRecordingTimer);
    window.clearTimeout(autoFinishTimer);
    listeningPhase='idle';
    if(streamingRecorder){const current=streamingRecorder;streamingRecorder=null;current.cancel().catch(()=>{})}
    if(streamingSessionId){const session=streamingSessionId;streamingSessionId='';fetch(voiceApi+'/session/'+encodeURIComponent(session),{method:'DELETE',headers:{'x-app-id':'yingge-h5'}}).catch(()=>{})}
    streamingChunks=[];streamingChunkLength=0;
    if(localRecorder){const current=localRecorder;localRecorder=null;current.cancel().catch(()=>{})}
    if(!recognition){resetInputControls();return}
    const current=recognition;
    recognition=null;
    try{current.stop()}catch{}
    resetInputControls();
  };
  const recognitionProblem=code=>({
    'not-allowed':'请允许浏览器使用麦克风',
    'service-not-allowed':'请允许浏览器使用麦克风',
    'no-speech':'没有听清，请再试一次',
    'audio-capture':'未找到可用麦克风',
    'network':'语音识别网络不可用',
    'NotAllowedError':'请允许浏览器使用麦克风',
    'SecurityError':'当前页面无法使用麦克风',
    'NotFoundError':'未找到可用麦克风',
    'NotReadableError':'麦克风正被其他应用占用',
    'NotSupportedError':'当前浏览器不支持麦克风输入',
    'aborted':'语音输入已停止'
  }[code]||'语音输入暂时不可用');
  const encodePcmWave=(samples,sampleRate)=>{
    const buffer=new ArrayBuffer(44+samples.length*2);
    const view=new DataView(buffer);
    const write=(offset,text)=>{for(let index=0;index<text.length;index+=1)view.setUint8(offset+index,text.charCodeAt(index))};
    write(0,'RIFF');view.setUint32(4,36+samples.length*2,true);write(8,'WAVE');write(12,'fmt ');
    view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,sampleRate,true);
    view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);write(36,'data');view.setUint32(40,samples.length*2,true);
    samples.forEach((sample,index)=>{const value=Math.max(-1,Math.min(1,sample));view.setInt16(44+index*2,value<0?value*32768:value*32767,true)});
    return buffer;
  };
  const resamplePcm=(chunks,inputRate,targetRate=16000)=>{
    const length=chunks.reduce((total,chunk)=>total+chunk.length,0);
    const merged=new Float32Array(length);let offset=0;
    chunks.forEach(chunk=>{merged.set(chunk,offset);offset+=chunk.length});
    if(inputRate<=targetRate)return{samples:merged,sampleRate:inputRate};
    const ratio=inputRate/targetRate;
    const output=new Float32Array(Math.floor(merged.length/ratio));
    for(let index=0;index<output.length;index+=1){
      const from=Math.floor(index*ratio),to=Math.min(merged.length,Math.floor((index+1)*ratio));
      let sum=0;for(let cursor=from;cursor<to;cursor+=1)sum+=merged[cursor];
      output[index]=sum/Math.max(1,to-from);
    }
    return{samples:output,sampleRate:targetRate};
  };
  const pcmToInt16=samples=>{
    const buffer=new ArrayBuffer(samples.length*2);
    const view=new DataView(buffer);
    samples.forEach((sample,index)=>{const value=Math.max(-1,Math.min(1,sample));view.setInt16(index*2,value<0?value*32768:value*32767,true)});
    return buffer;
  };
  const closeWakeSession=async()=>{
    const session=wakeSessionId;wakeSessionId='';
    if(session)await fetch(voiceApi+'/session/'+encodeURIComponent(session),{method:'DELETE',headers:{'x-app-id':'yingge-h5'}}).catch(()=>{});
  };
  const createWakeSession=async(mode='wake',expectedToken=null)=>{
    const response=await fetch(voiceApi+'/session',{method:'POST',headers:{'content-type':'application/json','x-app-id':'yingge-h5'},body:JSON.stringify({sample_rate:16000,mode})});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||!payload.session_id)throw new Error(payload.message||'语音服务暂时没有响应');
    if(expectedToken!==null&&expectedToken!==wakeFlowToken){fetch(voiceApi+'/session/'+encodeURIComponent(payload.session_id),{method:'DELETE',headers:{'x-app-id':'yingge-h5'}}).catch(()=>{});return false}
    wakeSessionId=payload.session_id;
    return true;
  };
  const stopWakeStandby=async({quiet=false}={})=>{
    const recorder=wakeRecorder;wakeRecorder=null;
    wakeState='off';wakeChunks=[];wakeChunkLength=0;
    wakeFlowToken+=1;
    window.clearTimeout(wakeRestartTimer);
    window.clearInterval(wakeQuestionTimer);wakeQuestionTimer=0;
    window.clearTimeout(wakeConfirmTimer);wakeConfirmTimer=0;wakeQuestionCandidate='';
    stopWakeAcknowledgement();
    const browserRecognition=wakeBrowserRecognition;wakeBrowserRecognition=null;wakeUsesBrowser=false;
    if(browserRecognition){try{browserRecognition.stop()}catch{}}
    if(recorder)await recorder.close().catch(()=>{});
    await closeWakeSession();
    updateWakeControls();
    if(!quiet)voiceStatus('唤醒待机已关闭');
  };
  const playWakeChime=()=>{
    if(!AudioContextClass)return;
    try{const context=new AudioContextClass(),osc=context.createOscillator(),gain=context.createGain();osc.frequency.setValueAtTime(660,context.currentTime);osc.frequency.exponentialRampToValueAtTime(880,context.currentTime+.12);gain.gain.setValueAtTime(.0001,context.currentTime);gain.gain.exponentialRampToValueAtTime(.12,context.currentTime+.02);gain.gain.exponentialRampToValueAtTime(.0001,context.currentTime+.2);osc.connect(gain);gain.connect(context.destination);osc.start();osc.stop(context.currentTime+.22);osc.onended=()=>context.close()}catch{}
  };
  function stopWakeAcknowledgement({interrupted=false}={}){
    if(wakeAckAudio){wakeAckAudio.pause();try{wakeAckAudio.currentTime=0}catch{}}
    const wasPlaying=wakeAckPlaying;wakeAckPlaying=false;wakeAckVoiceFrames=0;
    if(interrupted&&wasPlaying&&wakeState==='awake')voiceStatus('回应已停止，正在听你的问题','listening');
  }
  const primeWakeAcknowledgement=()=>{
    if(wakeAckPrimed)return;
    wakeAckPrimed=true;
    try{wakeAckAudio=new Audio(WAKE_ACK_URL);wakeAckAudio.preload='auto';wakeAckAudio.load?.()}catch{wakeAckAudio=null}
  };
  const playWakeAcknowledgement=()=>{
    primeWakeAcknowledgement();
    if(!wakeAckAudio){playWakeChime();voiceStatus('小槌已唤醒，请直接说出问题','awake');return}
    stopWakeAcknowledgement();
    wakeAckPlaying=true;wakeAckStartedAt=Date.now();wakeAckVoiceFrames=0;
    wakeAckAudio.onended=()=>{wakeAckPlaying=false;wakeChunks=[];wakeChunkLength=0;if(wakeState==='awake')voiceStatus('回应结束，请开始说出问题','listening')};
    wakeAckAudio.onerror=()=>{wakeAckPlaying=false;playWakeChime();if(wakeState==='awake')voiceStatus('小槌已唤醒，请直接说出问题','awake')};
    voiceStatus('小槌我在，回应结束后请开始说','awake');
    const playback=wakeAckAudio.play();
    playback?.catch(()=>{wakeAckPlaying=false;playWakeChime();if(wakeState==='awake')voiceStatus('小槌已唤醒，请直接说出问题','awake')});
  };
  const beginWakeQuestionWindow=({followup=false}={})=>{
    window.clearInterval(wakeQuestionTimer);let remaining=followup?6:9;
    if(followup)voiceStatus(`可以直接追问，${remaining} 秒后恢复唤醒待机`,'followup');else playWakeAcknowledgement();
    const show=()=>{if(followup)voiceStatus(`可以直接追问，${remaining} 秒后恢复唤醒待机`,'followup');else if(!wakeAckPlaying)voiceStatus(`正在聆听，请在 ${remaining} 秒内说出问题`,'listening')};
    wakeQuestionTimer=window.setInterval(()=>{remaining-=1;if(wakeState!=='awake'){window.clearInterval(wakeQuestionTimer);wakeQuestionTimer=0;return}if(remaining>0){show();return}window.clearInterval(wakeQuestionTimer);wakeQuestionTimer=0;stopWakeAcknowledgement();voiceStatus('没有听到问题，已恢复唤醒待机','standby');if(wakeUsesBrowser){wakeState='standby';updateWakeControls();startBrowserWakeCycle()}else{wakeState='answering';rearmWakeStandby()}},1000);
  };
  const pauseWakeForManual=async()=>{
    if(wakeState==='off')return;
    resumeWakeAfterManual=true;
    await stopWakeStandby({quiet:true});
  };
  const restoreWakeAfterManual=async()=>{
    if(!resumeWakeAfterManual||listeningPhase!=='idle')return;
    resumeWakeAfterManual=false;
    if(wakeState==='off')await startWakeStandby({resuming:true});
  };
  const rearmWakeStandby=async()=>{
    if(wakeState!=='answering')return;
    if(wakeUsesBrowser){
      wakeState='standby';updateWakeControls();voiceStatus('正在聆听唤醒词，请说“小槌小槌”');
      startBrowserWakeCycle();
      return;
    }
    if(!wakeRecorder)return;
    wakeChunks=[];wakeChunkLength=0;
    await closeWakeSession();
    if(wakeState!=='answering'||!wakeRecorder)return;
    try{
      await createWakeSession('wake');
      if(wakeState!=='answering'||!wakeRecorder){await closeWakeSession();return}
      wakeState='standby';updateWakeControls();voiceStatus('正在聆听唤醒词，请说“小槌小槌”');
    }catch(error){
      voiceStatus(error.message||'唤醒识别暂时不可用');
      await stopWakeStandby({quiet:true});
    }
  };
  const enterAwakeConversation=async({followup=false}={})=>{
    const token=++wakeFlowToken;
    stopWakeAcknowledgement();
    wakeState='awake';updateWakeControls();
    document.querySelector('[data-guide-open]')?.click();
    if(wakeUsesBrowser){
      const current=wakeBrowserRecognition;wakeBrowserRecognition=null;
      if(current){try{current.stop()}catch{}}
      if(token!==wakeFlowToken||wakeState!=='awake')return;
      beginWakeQuestionWindow({followup});startBrowserWakeCycle();
      return;
    }
    await closeWakeSession();
    if(token!==wakeFlowToken||wakeState!=='awake')return;
    try{
      await createWakeSession('transcribe',token);
      if(token!==wakeFlowToken||wakeState!=='awake'){await closeWakeSession();return}
      beginWakeQuestionWindow({followup});
    }catch(error){voiceStatus(error.message||'问题识别暂时不可用','error');wakeState='answering';rearmWakeStandby()}
  };
  const enterFollowupWindow=async()=>{
    if(!['answering','speaking'].includes(wakeState))return;
    await enterAwakeConversation({followup:true});
  };
  const armWakeDuringSpeech=async()=>{
    if(wakeState!=='answering')return;
    const token=++wakeFlowToken;
    wakeState='speaking';updateWakeControls();
    if(wakeUsesBrowser){startBrowserWakeCycle();return}
    if(!wakeRecorder)return;
    try{await closeWakeSession();if(token===wakeFlowToken&&wakeState==='speaking'&&wakeRecorder)await createWakeSession('wake',token)}catch{if(token===wakeFlowToken){wakeState='answering';updateWakeControls()}}
  };
  const finishSpokenAnswer=()=>{
    speaking=false;updateOutputControls();
    if(['answering','speaking'].includes(wakeState)){voiceStatus('朗读完成，可以直接追问','followup');enterFollowupWindow();return}
    voiceStatus('朗读完成','followup');
  };
  const submitAwakeQuestion=text=>{
    const clean=String(text||'').replace(/小[槌锤垂]+/g,'').replace(/[，。！？,.!?\s]+/g,' ').trim();
    if(!clean)return false;
    const input=document.querySelector('#question');
    if(!input)return false;
    input.value=clean;input.dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('#agentForm')?.requestSubmit();
    return true;
  };
  const cleanAwakeQuestion=text=>normalizeYinggeTranscript(text)
    .replace(/小[槌锤垂陲捶吹崔]+/g,'')
    .replace(/(?:我在(?:这里)?|(?:您|你)?有什么想问我的吗|请(?:直接)?说出问题|正在回应)/g,'')
    .replace(/[，。！？,.!?\s]+/g,' ')
    .trim();
  const queueConfirmedAwakeQuestion=async text=>{
    const clean=cleanAwakeQuestion(text);
    if(Array.from(clean.replace(/\s/g,'')).length<2){
      wakeQuestionCandidate='';
      voiceStatus('还没有识别到完整问题，请继续说','listening');
      return false;
    }
    const input=document.querySelector('#question');
    if(!input)return false;
    wakeQuestionCandidate=clean;
    input.value=clean;input.dispatchEvent(new Event('input',{bubbles:true}));
    wakeState='confirming';updateWakeControls();
    window.clearInterval(wakeQuestionTimer);wakeQuestionTimer=0;
    window.clearTimeout(wakeConfirmTimer);
    voiceStatus(`识别结果：“${clean}”，正在确认`,'recognizing');
    await closeWakeSession();
    wakeConfirmTimer=window.setTimeout(()=>{
      if(wakeState!=='confirming'||wakeQuestionCandidate!==clean)return;
      wakeConfirmTimer=0;wakeQuestionCandidate='';wakeState='answering';wakeChunks=[];wakeChunkLength=0;updateWakeControls();
      if(submitAwakeQuestion(clean))voiceStatus('问题已确认，正在发送并组织回答','thinking');
      else{wakeState='awake';updateWakeControls();voiceStatus('问题尚未发送，请再说一次','listening')}
    },1100);
    return true;
  };
  const handleWakePayload=async payload=>{
    if(wakeState==='standby'&&payload.awake){
      await enterAwakeConversation();
      return;
    }
    if(wakeState==='speaking'&&payload.awake){
      stopSpeaking({rearm:false,announce:false});
      await enterAwakeConversation();
      return;
    }
    if(wakeState==='awake'&&wakeAckPlaying)return;
    if(wakeState==='awake'&&payload.text){
      const partial=normalizeYinggeTranscript(payload.text).replace(/\s+/g,'').replace(/小[槌锤垂陲捶吹崔]+/g,'').trim();
      if(partial&&wakeAckPlaying)stopWakeAcknowledgement({interrupted:true});
      if(partial&&!payload.endpoint)voiceStatus('正在听：'+partial,'listening');
    }
    if(wakeState==='awake'&&payload.endpoint&&payload.text){
      stopWakeAcknowledgement();
      await queueConfirmedAwakeQuestion(payload.text);
    }
  };
  const sendWakeSamples=(chunks,inputRate)=>{
    const session=wakeSessionId,flowToken=wakeFlowToken;
    if(!session||!['standby','awake','speaking'].includes(wakeState)||(wakeState==='awake'&&wakeAckPlaying))return;
    const pcm=resamplePcm(chunks,inputRate,16000);
    const body=pcmToInt16(pcm.samples);
    wakeQueue=wakeQueue.then(async()=>{
      if(!wakeSessionId||wakeSessionId!==session||wakeFlowToken!==flowToken||!['standby','awake','speaking'].includes(wakeState)||(wakeState==='awake'&&wakeAckPlaying))return;
      const response=await fetch(voiceApi+'/session/'+encodeURIComponent(session)+'/chunk?sample_rate=16000',{method:'POST',headers:{'content-type':'application/octet-stream','x-app-id':'yingge-h5'},body});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(payload.message||'唤醒识别暂时不可用');
      await handleWakePayload(payload);
    }).catch(async error=>{voiceStatus(error.message||'唤醒识别暂时不可用');await stopWakeStandby({quiet:true})});
  };
  const startBrowserWakeCycle=()=>{
    if(!wakeUsesBrowser||!['standby','awake','speaking'].includes(wakeState)||wakeBrowserRecognition)return;
    const current=new Recognition();wakeBrowserRecognition=current;
    current.lang=document.documentElement.dataset.locale==='en'?'en-US':'zh-CN';
    current.continuous=true;current.interimResults=true;current.maxAlternatives=1;
    current.onstart=()=>{if(wakeState==='awake')voiceStatus('正在聆听，请直接说出问题','listening');else if(wakeState==='speaking')voiceStatus('正在朗读，喊“小槌小槌”可以打断','speaking');else voiceStatus('正在聆听唤醒词，请说“小槌小槌”','standby')};
    current.onresult=event=>{
      let transcript='',hasFinal=false;
      for(let index=event.resultIndex||0;index<event.results.length;index+=1){const result=event.results[index];transcript+=result[0]?.transcript||'';if(result.isFinal)hasFinal=true}
      const clean=normalizeYinggeTranscript(transcript).replace(/\s+/g,'');
      if(wakeState==='standby'&&clean)voiceStatus(hasFinal?'正在识别唤醒词':'已检测到语音，正在识别');
      if(wakeState==='standby'&&/小[槌锤垂陲捶吹崔]小[槌锤垂陲捶吹崔]/.test(clean)){
        enterAwakeConversation();
        return;
      }
      if(wakeState==='speaking'&&/小[槌锤垂陲捶吹崔]小[槌锤垂陲捶吹崔]/.test(clean)){
        stopSpeaking({rearm:false,announce:false});enterAwakeConversation();
        return;
      }
      if(wakeState==='awake'&&wakeAckPlaying)return;
      if(wakeState==='awake'&&hasFinal){
        const question=clean.replace(/小[槌锤垂陲捶吹崔]+/g,'').trim();
        if(!question){voiceStatus('我在，请继续说出问题');return}
        stopWakeAcknowledgement();
        queueConfirmedAwakeQuestion(question);
        try{current.stop()}catch{}
      }else if(wakeState==='awake'&&clean){if(wakeAckPlaying)stopWakeAcknowledgement({interrupted:true});voiceStatus('正在听：'+clean,'listening')}
    };
    current.onerror=event=>{
      if(wakeBrowserRecognition!==current)return;
      if(event.error==='no-speech'||event.error==='aborted')return;
      voiceStatus(recognitionProblem(event.error));
      if(event.error==='network'&&canRecordLocally){wakeBrowserRecognition=null;wakeState='off';wakeUsesBrowser=false;startWakeStandby({resuming:true,forceLocal:true});return}
      stopWakeStandby({quiet:true});
    };
    current.onend=()=>{
      if(wakeBrowserRecognition!==current)return;
      wakeBrowserRecognition=null;
      if(['standby','awake','speaking'].includes(wakeState)){window.clearTimeout(wakeRestartTimer);wakeRestartTimer=window.setTimeout(startBrowserWakeCycle,220)}
    };
    try{current.start()}catch{wakeBrowserRecognition=null;wakeRestartTimer=window.setTimeout(startBrowserWakeCycle,500)}
  };
  const startWakeStandby=async({resuming=false,forceLocal=false}={})=>{
    if(wakeState!=='off'){await stopWakeStandby();return}
    if(!resuming)resumeWakeAfterManual=false;
    primeWakeAcknowledgement();
    stopListening();stopSpeaking({rearm:false,announce:false});wakeState='starting';updateWakeControls();voiceStatus('正在开启麦克风','starting');
    if((!canRecordLocally||!localCapabilities.wake)&&canUseRecognition&&!forceLocal){
      wakeUsesBrowser=true;wakeState='standby';updateWakeControls();voiceStatus('正在聆听唤醒词，请说“小槌小槌”','standby');startBrowserWakeCycle();return;
    }
    try{
      wakeUsesBrowser=false;
      const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}});
      await createWakeSession('wake');
      if(wakeState!=='starting'){stream.getTracks().forEach(track=>track.stop());return}
      const context=new AudioContextClass();
      const source=context.createMediaStreamSource(stream);
      const processor=context.createScriptProcessor(4096,1,1);
      let closed=false;
      processor.onaudioprocess=event=>{
        if(!['standby','awake','speaking'].includes(wakeState)){event.outputBuffer?.getChannelData(0).fill(0);return}
        const chunk=new Float32Array(event.inputBuffer.getChannelData(0));wakeChunks.push(chunk);wakeChunkLength+=chunk.length;
        if(wakeState==='awake'&&wakeAckPlaying){wakeChunks=[];wakeChunkLength=0;event.outputBuffer?.getChannelData(0).fill(0);return}
        let energy=0;for(let index=0;index<chunk.length;index+=1)energy+=chunk[index]*chunk[index];
        const level=Math.sqrt(energy/Math.max(1,chunk.length));
        if(level>.012&&Date.now()-wakeSignalStatusAt>700){wakeSignalStatusAt=Date.now();voiceStatus(wakeState==='awake'?'正在聆听你的问题':wakeState==='speaking'?'检测到声音，正在判断是否需要打断':'已检测到语音，正在识别唤醒词',wakeState==='awake'?'listening':wakeState==='speaking'?'speaking':'recognizing')}
        event.outputBuffer?.getChannelData(0).fill(0);
        if(wakeChunkLength>=context.sampleRate*.5){const batch=wakeChunks;wakeChunks=[];wakeChunkLength=0;sendWakeSamples(batch,context.sampleRate)}
      };
      source.connect(processor);processor.connect(context.destination);
      wakeRecorder={async close(){if(closed)return;closed=true;processor.disconnect();source.disconnect();stream.getTracks().forEach(track=>track.stop());await context.close()}};
      wakeState='standby';updateWakeControls();voiceStatus('正在聆听唤醒词，请说“小槌小槌”','standby');
    }catch(error){
      wakeState='off';await closeWakeSession();updateWakeControls();voiceStatus(recognitionProblem(error.name)||error.message);
    }
  };
  const beginPcmRecording=(stream,{onChunk}={})=>{
    const context=new AudioContextClass();
    const source=context.createMediaStreamSource(stream);
    const processor=context.createScriptProcessor(4096,1,1);
    const chunks=[];let closed=false;
    processor.onaudioprocess=event=>{
      const chunk=new Float32Array(event.inputBuffer.getChannelData(0));
      chunks.push(chunk);onChunk?.(chunk,context.sampleRate);
      event.outputBuffer?.getChannelData(0).fill(0);
    };
    source.connect(processor);processor.connect(context.destination);
    const close=async()=>{
      if(closed)return;closed=true;processor.disconnect();source.disconnect();stream.getTracks().forEach(track=>track.stop());await context.close();
    };
    return{
      async finish(){await close();const pcm=resamplePcm(chunks,context.sampleRate);return encodePcmWave(pcm.samples,pcm.sampleRate)},
      async cancel(){await close()}
    };
  };
  const closeStreamingSession=async()=>{
    const session=streamingSessionId;streamingSessionId='';
    if(session)await fetch(voiceApi+'/session/'+encodeURIComponent(session),{method:'DELETE',headers:{'x-app-id':'yingge-h5'}}).catch(()=>{});
  };
  const normalizeYinggeTranscript=text=>String(text||'')
    .replace(/英哥/g,'英歌')
    .replace(/小锤/g,'小槌')
    .replace(/锤法/g,'槌法')
    .replace(/潮男/g,'潮南')
    .replace(/普林/g,'普宁')
    .trim();
  const applyStreamingText=text=>{
    const next=normalizeYinggeTranscript(text);if(!next||!activeInput)return;
    recognizedText=next;
    activeInput.value=[initialInput,recognizedText].filter(Boolean).join(initialInput&&recognizedText?'，':'');
    activeInput.dispatchEvent(new Event('input',{bubbles:true}));
    voiceStatus('实时转写中：'+recognizedText);
  };
  const sendStreamingSamples=(chunks,inputRate,{finish=false}={})=>{
    const session=streamingSessionId;if(!session)return Promise.resolve();
    const pcm=resamplePcm(chunks,inputRate,16000);const body=pcmToInt16(pcm.samples);
    streamingQueue=streamingQueue.catch(()=>{}).then(async()=>{
      if(!streamingSessionId||streamingSessionId!==session)return;
      const suffix=finish?'&finish=1':'';
      const response=await fetch(voiceApi+'/session/'+encodeURIComponent(session)+'/chunk?sample_rate=16000'+suffix,{method:'POST',headers:{'content-type':'application/octet-stream','x-app-id':'yingge-h5'},body});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(payload.message||'实时语音识别暂时不可用');
      applyStreamingText(payload.text);
    });
    return streamingQueue;
  };
  const finishStreamingRecognition=async()=>{
    if(!streamingRecorder)return;
    const current=streamingRecorder;streamingRecorder=null;listeningPhase='processing';resetInputControls();voiceStatus('正在确认转写结果');
    const tail=streamingChunks;streamingChunks=[];streamingChunkLength=0;
    try{
      await current.finish();
      if(tail.length)await sendStreamingSamples(tail,current.sampleRate,{finish:true});
      else if(streamingSessionId)await sendStreamingSamples([new Float32Array(320)],16000,{finish:true});
    }catch(error){voiceStatus(error.message||'实时语音识别暂时不可用')}
    await closeStreamingSession();listeningPhase='idle';resetInputControls();voiceStatus(recognizedText?'已完成转写，请确认后发送':'没有听清，请再试一次');await restoreWakeAfterManual();
  };
  const beginStreamingRecognition=async stream=>{
    const response=await fetch(voiceApi+'/session',{method:'POST',headers:{'content-type':'application/json','x-app-id':'yingge-h5'},body:JSON.stringify({sample_rate:16000,mode:'transcribe'})});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||!payload.session_id)throw new Error(payload.message||'实时语音服务暂时不可用');
    streamingSessionId=payload.session_id;streamingQueue=Promise.resolve();streamingChunks=[];streamingChunkLength=0;
    const context=new AudioContextClass();const source=context.createMediaStreamSource(stream);const processor=context.createScriptProcessor(4096,1,1);let closed=false;
    processor.onaudioprocess=event=>{
      if(listeningPhase!=='streaming')return;
      const chunk=new Float32Array(event.inputBuffer.getChannelData(0));streamingChunks.push(chunk);streamingChunkLength+=chunk.length;
      let energy=0;for(let index=0;index<chunk.length;index+=1)energy+=chunk[index]*chunk[index];
      if(Math.sqrt(energy/Math.max(1,chunk.length))>.01)voiceStatus(recognizedText?'实时转写中：'+recognizedText:'正在聆听并实时识别');
      event.outputBuffer?.getChannelData(0).fill(0);
      if(streamingChunkLength>=context.sampleRate*.55){const batch=streamingChunks;streamingChunks=[];streamingChunkLength=0;sendStreamingSamples(batch,context.sampleRate).catch(async error=>{voiceStatus(error.message||'实时语音识别暂时不可用');await finishStreamingRecognition()})}
    };
    source.connect(processor);processor.connect(context.destination);
    streamingRecorder={sampleRate:context.sampleRate,async finish(){if(closed)return;closed=true;processor.disconnect();source.disconnect();stream.getTracks().forEach(track=>track.stop());await context.close()},async cancel(){if(closed)return;closed=true;processor.disconnect();source.disconnect();stream.getTracks().forEach(track=>track.stop());await context.close()}};
    listeningPhase='streaming';voiceStatus('正在聆听并实时识别');resetInputControls();
  };
  const autoFinishAfterSilence=()=>{
    let heardAt=0,lastVoiceAt=0,queued=false;
    return chunk=>{
      if(listeningPhase!=='recording'||!localRecorder)return;
      let energy=0;for(let index=0;index<chunk.length;index+=1)energy+=chunk[index]*chunk[index];
      const now=Date.now();
      if(Math.sqrt(energy/Math.max(1,chunk.length))>.012){
        if(!heardAt)heardAt=now;
        lastVoiceAt=now;queued=false;window.clearTimeout(autoFinishTimer);
        voiceStatus('正在聆听，说完后自动识别');
      }else if(heardAt&&now-heardAt>350&&now-lastVoiceAt>850&&!queued){
        queued=true;autoFinishTimer=window.setTimeout(()=>{if(listeningPhase==='recording'&&localRecorder)finishLocalRecording()},0);
      }
    };
  };
  const beginLocalFallback=async()=>{
    listeningPhase='requesting';
    voiceStatus('浏览器识别不可用，正在切换本机识别');
    resetInputControls();
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      if(listeningPhase!=='requesting'){stream.getTracks().forEach(track=>track.stop());return}
      localRecorder=beginPcmRecording(stream,{onChunk:autoFinishAfterSilence()});
      listeningPhase='recording';
      voiceStatus('正在聆听，说完后自动识别');
      resetInputControls();
      localRecordingTimer=window.setTimeout(finishLocalRecording,10000);
    }catch(error){
      listeningPhase='idle';
      voiceStatus(recognitionProblem(error.name));
      resetInputControls();
    }
  };
  const finishLocalRecording=async()=>{
    if(!localRecorder)return;
    const current=localRecorder;localRecorder=null;
    window.clearTimeout(localRecordingTimer);
    window.clearTimeout(autoFinishTimer);
    listeningPhase='processing';voiceStatus('正在识别刚才的录音');resetInputControls();
    try{
      const wave=await current.finish();
      if(wave.byteLength<2048)throw new Error('录音太短，请再说一次');
      const response=await fetch(`${YINGGE_API_BASE}/api/voice/transcribe`,{method:'POST',headers:{'content-type':'audio/wav','x-app-id':'yingge-h5'},body:wave});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(payload.message||'语音识别暂时不可用');
      recognizedText=normalizeYinggeTranscript(payload.text);
      if(!recognizedText)throw new Error('没有听清，请靠近麦克风再说一次');
      activeInput.value=[initialInput,recognizedText].filter(Boolean).join(initialInput&&recognizedText?'，':'');
      activeInput.dispatchEvent(new Event('input',{bubbles:true}));
      voiceStatus('已识别，请确认后发送');
    }catch(error){voiceStatus(error.message||'语音识别暂时不可用')}
    finally{listeningPhase='idle';resetInputControls();await restoreWakeAfterManual()}
  };
  const finishListening=async button=>{
    if(button&&button!==activeButton)return;
    if(listeningPhase==='requesting'||listeningPhase==='idle'){
      holdReleaseRequested=true;
      if(listeningPhase==='requesting')voiceStatus('正在结束录音');
      return;
    }
    if(streamingRecorder){await finishStreamingRecognition();return}
    if(localRecorder){await finishLocalRecording();return}
    if(recognition){
      listeningPhase='processing';voiceStatus('正在确认转写结果');resetInputControls();
      try{recognition.stop()}catch{stopListening();await restoreWakeAfterManual()}
      return;
    }
    stopListening();await restoreWakeAfterManual();
  };
  const startListening=async(button,{hold=false}={})=>{
    if(!canUseRecognition&&!canRecordLocally)return;
    if(listeningPhase!=='idle'){
      if(button===activeButton){await finishListening(button);return}
      stopListening();
    }
    stopSpeaking({rearm:false,announce:false});
    activeButton=button;
    activeInput=document.getElementById(button.dataset.voiceTarget||'question');
    if(!activeInput){voiceStatus('没有找到问题输入框');return}
    initialInput=activeInput.value.trim();
    recognizedText='';
    holdReleaseRequested=false;
    await pauseWakeForManual();
    if(hold&&holdReleaseRequested){activeButton=null;await restoreWakeAfterManual();return}
    const preferCloudRecognition=canRecordLocally&&localCapabilities.asr;
    listeningPhase='requesting';
    voiceStatus(preferCloudRecognition?'正在连接腾讯云实时识别':canUseRecognition?'正在启动语音识别':'正在申请麦克风权限','starting');
    resetInputControls();
    try{
      if(preferCloudRecognition||!canUseRecognition){
        if(!navigator.mediaDevices?.getUserMedia)throw Object.assign(new Error('media devices unavailable'),{name:'NotSupportedError'});
        const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
        if(hold&&holdReleaseRequested){stream.getTracks().forEach(track=>track.stop());listeningPhase='idle';resetInputControls();await restoreWakeAfterManual();return}
        if(localCapabilities.asr){await beginStreamingRecognition(stream);if(hold&&holdReleaseRequested)await finishStreamingRecognition();return}
        localRecorder=beginPcmRecording(stream,{onChunk:autoFinishAfterSilence()});
        listeningPhase='recording';voiceStatus('正在聆听');resetInputControls();
        localRecordingTimer=window.setTimeout(finishLocalRecording,10000);
        if(hold&&holdReleaseRequested)await finishLocalRecording();
        return;
      }
    }catch(error){
      if(preferCloudRecognition&&canUseRecognition&&!['NotAllowedError','SecurityError','NotFoundError','NotReadableError'].includes(error.name)){
        listeningPhase='requesting';voiceStatus('云端识别连接失败，正在切换浏览器识别','starting');resetInputControls();
      }else{
      listeningPhase='idle';
      voiceStatus(recognitionProblem(error.name));
      resetInputControls();
      await restoreWakeAfterManual();
      return;
      }
    }
    if(listeningPhase==='idle')return;
    const current=new Recognition();
    recognition=current;
    listeningPhase='listening';
    current.lang=document.documentElement.dataset.locale==='en'?'en-US':'zh-CN';
    current.continuous=true;
    current.interimResults=true;
    current.maxAlternatives=1;
    voiceStatus('请开始说话');
    resetInputControls();
    current.onstart=()=>{voiceStatus('请开始说话');resetInputControls()};
    current.onresult=event=>{
      let transcript='';
      let hasFinal=false;
      for(let index=0;index<event.results.length;index+=1){
        const result=event.results[index];
        transcript+=result[0]?.transcript||'';
        if(result.isFinal)hasFinal=true;
      }
      recognizedText=normalizeYinggeTranscript(transcript);
      window.clearTimeout(recognitionTimer);
      activeInput.value=[initialInput,recognizedText].filter(Boolean).join(initialInput&&recognizedText?'，':'');
      activeInput.dispatchEvent(new Event('input',{bubbles:true}));
      voiceStatus(hasFinal?'已识别，请确认后发送':'正在识别：'+recognizedText);
    };
    current.onerror=event=>{
      window.clearTimeout(recognitionTimer);
      if(event.error==='network'&&canRecordLocally){
        if(recognition===current)recognition=null;
        beginLocalFallback();
        return;
      }
      voiceStatus(recognitionProblem(event.error));
      if(recognition===current)recognition=null;
      listeningPhase='idle';
      resetInputControls();
    };
    current.onend=()=>{
      window.clearTimeout(recognitionTimer);
      if(recognition!==current)return;
      recognition=null;
      listeningPhase='idle';
      resetInputControls();
      if(recognizedText)voiceStatus('已识别，请确认后发送');
      else voiceStatus('没有听清，请再试一次');
      restoreWakeAfterManual();
    };
    try{
      current.start();
      if(hold&&holdReleaseRequested)window.setTimeout(()=>finishListening(button),0);
      recognitionTimer=window.setTimeout(()=>{
        if(recognition!==current||recognizedText)return;
        voiceStatus('语音识别服务没有响应，请使用 Chrome 或 Edge 重试');
        stopListening();
      },8000);
    }catch{recognition=null;listeningPhase='idle';resetInputControls();voiceStatus('语音输入暂时不可用');await restoreWakeAfterManual()}
  };
  const cleanForSpeech=text=>String(text||'')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g,'$1')
    .replace(/https?:\/\/\S+/g,'')
    .replace(/[#*_`>|]/g,'')
    .replace(/^\s*[-+]\s+/gm,'')
    .replace(/\s+/g,' ')
    .trim();
  const selectYouthVoice=()=>{
    const available=window.speechSynthesis.getVoices();
    if(available.length)voices=available;
    const english=document.documentElement.dataset.locale==='en';
    const pool=voices.filter(voice=>english?/^(en)(-|_)/i.test(voice.lang||''):voice.lang?.toLowerCase().startsWith('zh'));
    const preferences=english?[/Natural.*Jenny|Jenny.*Natural/i,/Natural.*Aria|Aria.*Natural/i,/Samantha/i,/Google US English/i,/Microsoft/i]:[/Natural.*云希|云希.*Natural|Yunxi.*Natural|Natural.*Yunxi/i,/Natural.*晓晓|晓晓.*Natural|Xiaoxiao.*Natural|Natural.*Xiaoxiao/i,/Google.*普通话|Google.*中文/i,/Yunxi|云希/i,/Yunxia|云夏/i,/Microsoft/i];
    for(const pattern of preferences){const match=pool.find(voice=>pattern.test(voice.name));if(match)return match}
    return pool[0]||null;
  };
  const speechPhrases=text=>{
    const sentences=text.match(/[^。！？；]+[。！？；]?/g)||[text];
    return sentences.flatMap(sentence=>{
      const clean=sentence.trim();if(!clean)return[];
      if(clean.length<=SPEECH_CHUNK_TARGET)return[clean];
      const parts=clean.match(/[^，、：,]+[，、：,]?/g)||[clean];
      const chunks=[];let chunk='';
      parts.forEach(part=>{
        if((chunk+part).length>SPEECH_CHUNK_TARGET&&chunk){chunks.push(chunk);chunk=part}else chunk+=part;
      });
      if(chunk)chunks.push(chunk);
      return chunks.flatMap(item=>item.length>SPEECH_CHUNK_TARGET+8?(item.match(new RegExp(`.{1,${SPEECH_CHUNK_TARGET}}`,'g'))||[item]):[item]);
    });
  };
  const speakWithBrowser=(clean,run)=>{
    if(!canSpeak)return false;
    const phrases=speechPhrases(clean);if(!phrases.length)return false;
    const voice=selectYouthVoice();if(!voice)return false;
    const play=index=>{
      if(run!==speechRun)return;
      if(index>=phrases.length){finishSpokenAnswer();return}
      const phrase=phrases[index],utterance=new SpeechSynthesisUtterance(phrase);
      utterance.lang=document.documentElement.dataset.locale==='en'?'en-US':'zh-CN';utterance.rate=.98;utterance.pitch=1.02;utterance.volume=1;utterance.voice=voice;
      utterance.onstart=()=>{if(run===speechRun)voiceStatus(`正在朗读 ${index+1}/${phrases.length}，喊“小槌小槌”可以打断`,'speaking')};
      utterance.onend=()=>{if(run===speechRun)window.setTimeout(()=>play(index+1),/[。！？；]$/.test(phrase)?55:20)};
      utterance.onerror=()=>{if(run!==speechRun)return;speaking=false;updateOutputControls();voiceStatus('语音朗读暂时不可用')};
      window.speechSynthesis.speak(utterance);
    };
    play(0);return true;
  };
  const speak=async(text,{queue=null}={})=>{
    if(!outputEnabled){rearmWakeStandby();return}
    const clean=cleanForSpeech(text).slice(0,1200);
    const phrases=queue?.phrases||speechPhrases(clean);if(!phrases.length){rearmWakeStandby();return}
    const run=++speechRun;
    if(canSpeak)window.speechSynthesis.cancel();
    if(currentAudio){currentAudio.pause();currentAudio=null}
    speaking=true;updateOutputControls();voiceStatus('小槌正在组织语气','starting');armWakeDuringSpeech();
    try{
      if(!localCapabilities.tts)throw new Error('local tts unavailable');
      const speechBlobs=[];
      const loadSpeechBlob=index=>{
        if(index>=phrases.length)return Promise.resolve(null);
        if(!speechBlobs[index])speechBlobs[index]=fetch(voiceApi+'/synthesize',{method:'POST',headers:{'content-type':'application/json','x-app-id':'yingge-h5'},body:JSON.stringify({text:phrases[index],speed:1.04})}).then(response=>{if(!response.ok)throw new Error('tts failed');return response.blob()});
        return speechBlobs[index];
      };
      const playLocalPhrase=async index=>{
        if(run!==speechRun)return;
        if(index>=phrases.length){if(queue&&!queue.done){window.setTimeout(()=>playLocalPhrase(index),90);return}finishSpokenAnswer();return}
        const phrase=phrases[index];
        const blob=await loadSpeechBlob(index);if(run!==speechRun)return;
        loadSpeechBlob(index+1).catch(()=>{});
        currentAudioUrl=URL.createObjectURL(blob);currentAudio=new Audio(currentAudioUrl);
        currentAudio.onended=()=>{
          if(run!==speechRun)return;
          URL.revokeObjectURL(currentAudioUrl);currentAudioUrl='';currentAudio=null;
          window.setTimeout(()=>playLocalPhrase(index+1).catch(()=>{
            if(run!==speechRun)return;
            if(speakWithBrowser(phrases.slice(index+1).join(''),run)){voiceStatus('正在使用系统男声朗读');return}
            speaking=false;updateOutputControls();voiceStatus('小槌声音播放失败，请再试一次');rearmWakeStandby();
          }),/[。！？；]$/.test(phrase)?180:90);
        };
        currentAudio.onerror=()=>{if(run!==speechRun)return;stopSpeaking();voiceStatus('小槌声音播放失败，请再试一次');rearmWakeStandby()};
        voiceStatus(`正在朗读 ${index+1}/${phrases.length}，喊“小槌小槌”可以打断`,'speaking');await currentAudio.play();
      };
      await playLocalPhrase(0);
    }catch{
      if(run!==speechRun)return;
      if(speakWithBrowser(clean||phrases.join(''),run)){voiceStatus('正在使用设备自然音色朗读');return}
      speaking=false;updateOutputControls();voiceStatus('本机少年音服务尚未启动');rearmWakeStandby();
    }
  };
  const queueSpeechDelta=(fullText,{done=false}={})=>{
    if(!outputEnabled)return;
    const clean=cleanForSpeech(fullText).slice(0,1200);
    liveSpeechQueue.source=clean;
    const remaining=clean.slice(liveSpeechQueue.queued);
    let take=remaining.length;
    if(!done){take=0;for(const match of remaining.matchAll(/[。！？；\n]/gu))take=(match.index||0)+match[0].length;if(!take&&remaining.length>=SPEECH_CHUNK_TARGET)take=SPEECH_CHUNK_TARGET}
    if(take>0){const ready=remaining.slice(0,take);liveSpeechQueue.queued+=take;liveSpeechQueue.phrases.push(...speechPhrases(ready))}
    liveSpeechQueue.done=done;
    if(liveSpeechQueue.phrases.length&&!liveSpeechQueue.started){liveSpeechQueue.started=true;speak('',{queue:liveSpeechQueue})}
  };
  const bind=()=>{
    document.querySelectorAll('[data-wake-toggle]:not([data-voice-bound])').forEach(button=>{
      button.dataset.voiceBound='true';
      button.addEventListener('click',()=>{primeWakeAcknowledgement();startWakeStandby()});
    });
    document.querySelectorAll('[data-voice-input]:not([data-voice-bound])').forEach(button=>{
      button.dataset.voiceBound='true';
      button.addEventListener('pointerdown',event=>{if(!isCoarsePointer||event.button!==0||event.isPrimary===false)return;const timer=window.setTimeout(()=>{voiceHoldTimers.delete(button);voiceHoldActive.add(button);ignoreVoiceClickUntil=Date.now()+900;try{button.setPointerCapture?.(event.pointerId)}catch{}startListening(button,{hold:true})},320);voiceHoldTimers.set(button,timer)});
      button.addEventListener('pointerup',event=>{if(!isCoarsePointer||event.isPrimary===false)return;const timer=voiceHoldTimers.get(button);if(timer){window.clearTimeout(timer);voiceHoldTimers.delete(button);return}if(voiceHoldActive.has(button)){event.preventDefault();voiceHoldActive.delete(button);finishListening(button)}});
      button.addEventListener('pointercancel',()=>{if(!isCoarsePointer)return;const timer=voiceHoldTimers.get(button);if(timer){window.clearTimeout(timer);voiceHoldTimers.delete(button)}if(voiceHoldActive.has(button)){voiceHoldActive.delete(button);finishListening(button)}});
      button.addEventListener('click',event=>{if(isCoarsePointer&&event.detail>0&&Date.now()<ignoreVoiceClickUntil)return;if(button===activeButton&&listeningPhase!=='idle')finishListening(button);else startListening(button)});
    });
    document.querySelectorAll('[data-voice-output]:not([data-voice-bound])').forEach(button=>{
      button.dataset.voiceBound='true';
      button.addEventListener('click',()=>{
        outputEnabled=!outputEnabled;
        sessionStorage.setItem(OUTPUT_KEY,outputEnabled?'1':'0');
        if(!outputEnabled)stopSpeaking();
        else voiceStatus('小槌会用少年音朗读新回答');
        updateOutputControls();
      });
    });
    document.querySelectorAll('[data-voice-stop]:not([data-voice-bound])').forEach(button=>{
      button.dataset.voiceBound='true';
      button.addEventListener('click',stopSpeaking);
    });
    resetInputControls();
    updateOutputControls();
    updateWakeControls();
  };
  fetch(voiceApi+'/status',{headers:{'x-app-id':'yingge-h5'}}).then(response=>response.ok?response.json():Promise.reject()).then(payload=>{
    localCapabilities={asr:Boolean(payload.asr?.available),wake:Boolean(payload.wake?.available),tts:Boolean(payload.tts?.available)};
    bind();
    if(!voiceSecureContext)voiceStatus('当前是 HTTP 预览地址，语音输入需使用可信 HTTPS 域名');
  }).catch(()=>{localCapabilities={asr:false,wake:false,tts:false};bind()});
  if(canSpeak){
    window.speechSynthesis.addEventListener?.('voiceschanged',()=>{voices=window.speechSynthesis.getVoices()});
  }
  window.addEventListener('yingge:agent-event',event=>{
    if(event.detail?.type==='start'){if(speaking)stopSpeaking({rearm:false,announce:false});if(wakeState==='speaking')wakeState='answering';voiceStatus('小槌正在查找资料并组织回答','thinking');liveSpeechQueue={phrases:[],source:'',queued:0,done:false,started:false};return}
    if(event.detail?.type==='delta'){queueSpeechDelta(event.detail.text);return}
    if(event.detail?.type==='done'){queueSpeechDelta(event.detail.text,{done:true});if(!liveSpeechQueue.started)rearmWakeStandby()}
    if(event.detail?.type==='error'){liveSpeechQueue.done=true;voiceStatus('回答暂时没有完成，请稍后再试','error');if(wakeState==='answering')rearmWakeStandby()}
  });
  window.addEventListener('pagehide',()=>{stopListening();stopWakeStandby({quiet:true});if(canSpeak)window.speechSynthesis.cancel()},{once:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&wakeState!=='off')stopWakeStandby({quiet:true})});
  bind();
  return{refresh:bind,stopListening,stopSpeaking,speak};
};
window.yinggeVoice=createYinggeVoice();
gsap.registerPlugin(ScrollTrigger);
const opening=document.querySelector('#opening'),openingLogo=document.querySelector('.opening-logo'),navLogo=document.querySelector('#navLogo'),guide=document.querySelector('#guidePanel');
if(guide)guide.inert=true;
function revealPage(){document.body.classList.add('page-ready');if(opening)opening.classList.add('is-done')}
const prefersReducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
if(opening&&openingLogo&&navLogo&&!prefersReducedMotion.matches){
  let openingTimers=[];
  const clearOpeningTimers=()=>{openingTimers.forEach(clearTimeout);openingTimers=[]};
  const finishOpening=()=>{clearOpeningTimers();document.body.classList.add('page-ready','logo-docked');opening.classList.add('is-done');opening.classList.remove('is-docking');openingLogo.getAnimations().forEach(a=>{if(a.id==='dock')a.cancel()})};
  const dockOpening=()=>{requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const from=openingLogo.getBoundingClientRect(),to=navLogo.getBoundingClientRect();
    if(!from.width||!from.height||!to.width||!to.height){finishOpening();return}
    const badgeCenterX=.5,badgeCenterY=473/1254,badgeWidth=894/1254;
    const originX=from.left+from.width/2,originY=from.top+from.height/2;
    const sourceBadgeX=from.left+from.width*badgeCenterX,sourceBadgeY=from.top+from.height*badgeCenterY;
    const targetX=to.left+to.width/2,targetY=to.top+to.height/2;
    const scale=Math.min(1,to.width/(from.width*badgeWidth));
    const scaledBadgeX=originX+(sourceBadgeX-originX)*scale,scaledBadgeY=originY+(sourceBadgeY-originY)*scale;
    const dx=targetX-scaledBadgeX,dy=targetY-scaledBadgeY;
    opening.classList.add('is-docking');
    const dock=openingLogo.animate([{transform:'translate3d(0,0,0) scale(1)',filter:'drop-shadow(0 18px 24px rgba(39,48,52,.12))'},{transform:'translate3d('+dx+'px,'+dy+'px,0) scale('+scale+')',filter:'drop-shadow(0 0 0 rgba(39,48,52,0))'}],{duration:720,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'});
    dock.id='dock';dock.onfinish=()=>{document.body.classList.add('logo-docked','page-ready');opening.classList.add('is-done')};
  }))};
  openingTimers.push(setTimeout(dockOpening,1840));
  document.querySelector('#openingSkip')?.addEventListener('click',finishOpening);
}else{document.body.classList.add('page-ready','logo-docked');if(opening)opening.classList.add('is-done')}
const heroFilmMode=document.body.classList.contains('home-film-mode');
const revealHeroCopy=()=>{
  if(!document.querySelector('.hero-copy'))return;
  gsap.timeline({defaults:{ease:'power3.out'}})
    .to('.hero-label',{autoAlpha:1,y:0,duration:.5})
    .to('.hero h1 span',{autoAlpha:1,y:0,stagger:.09,duration:.78},'<.05')
    .to('.hero-body',{autoAlpha:1,y:0,duration:.55},'<.2')
    .to('.hero-actions .button',{autoAlpha:1,y:0,stagger:.08,duration:.45},'<.12');
};
if(heroFilmMode&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  gsap.set('.hero-label',{autoAlpha:0,y:16});
  gsap.set('.hero h1 span',{autoAlpha:0,y:42});
  gsap.set('.hero-body',{autoAlpha:0,y:22});
  gsap.set('.hero-actions .button',{autoAlpha:0,y:16});
  window.addEventListener('yingge:hero-film-complete',revealHeroCopy,{once:true});
}
const mm=gsap.matchMedia();mm.add({desktop:'(min-width:901px)',reduce:'(prefers-reduced-motion:reduce)'},ctx=>{if(ctx.conditions.reduce)return;if(!heroFilmMode){const heroTl=gsap.timeline({delay:opening?3.1:.15,defaults:{ease:'power3.out'}});heroTl.from('.hero-label',{autoAlpha:0,y:16,duration:.5}).from('.hero h1 span',{yPercent:110,stagger:.09,duration:.78},'<.05').from('.hero-body',{autoAlpha:0,y:22,duration:.55},'<.2').from('.hero-actions .button',{autoAlpha:0,y:16,stagger:.08,duration:.45},'<.12');}gsap.to('.hero-image img',{scale:1.1,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});gsap.from('.experience-main',{clipPath:'inset(0 100% 0 0)',duration:1.05,ease:'power3.inOut',scrollTrigger:{trigger:'.experience-layout',start:'top 76%',once:true}});gsap.from('.experience-h5,.experience-guide',{autoAlpha:0,x:45,stagger:.12,duration:.7,ease:'power3.out',scrollTrigger:{trigger:'.experience-layout',start:'top 68%',once:true}});gsap.from('.collection-mosaic>a',{autoAlpha:0,y:36,stagger:{amount:.34,from:'start'},duration:.65,ease:'power3.out',scrollTrigger:{trigger:'.collection-mosaic',start:'top 78%',once:true}});});

const contentMotion=gsap.matchMedia();
contentMotion.add('(prefers-reduced-motion:no-preference)',()=>{
  gsap.utils.toArray('.museum-section').forEach(section=>{
    const items=section.querySelectorAll('.museum-heading,.museum-lead,.reading-copy,.focus-row,.signal,.route-list a,.fact-sequence article,.chapter-list article,.evidence-levels article,.record-example');
    if(!items.length)return;
    gsap.from(items,{autoAlpha:0,y:26,stagger:.055,duration:.64,ease:'power3.out',scrollTrigger:{trigger:section,start:'top 78%',once:true}});
  });
});
const lensCopy={
  body:{title:'身体',text:'先看重心、步法和槌路，英歌的力量从身体传到队伍。'},
  sound:{title:'声音',text:'鼓、锣钹和吆喝定下共同节拍，让大家在同一拍点动作。'},
  space:{title:'空间',text:'站位、间距和路线把一群人的关系变成可以观察的图形。'},
  role:{title:'角色',text:'人物功能、脸谱和器物要回到具体队伍与场景里辨认。'}
};
document.querySelectorAll('.definition-lens').forEach(button=>button.addEventListener('click',()=>{
  const item=lensCopy[button.dataset.lens];
  if(!item)return;
  document.querySelectorAll('.definition-lens').forEach(node=>{const active=node===button;node.classList.toggle('is-active',active);node.setAttribute('aria-pressed',String(active))});
  const title=document.querySelector('#definitionReadoutTitle'),text=document.querySelector('#definitionReadoutText');
  if(title)title.textContent=item.title;
  if(text)text.textContent=item.text;
  const orbit=document.querySelector('.definition-orbit');
  if(orbit&&window.gsap&&!matchMedia('(prefers-reduced-motion: reduce)').matches)gsap.to(orbit,{rotation:-20+(Object.keys(lensCopy).indexOf(button.dataset.lens)*90),duration:.72,ease:'power3.out'});
}));
document.querySelectorAll('.definition-lens').forEach(button=>button.setAttribute('aria-pressed',String(button.classList.contains('is-active'))));
const originCopy={
  ritual:'傩舞说关注驱邪逐疫与仪式性动作的延续。它能解释部分动作和仪式语境，但不能单独证明英歌只有这一条来源。',
  opera:'戏曲说把英歌与《梁山泊攻打大名府》等民间演剧叙事联系起来，强调故事、角色和表演程式之间的关系。',
  martial:'练武习艺说从地方尚武、集体训练和身体技艺解释英歌的力量感，提醒我们关注日常训练而不只看舞台。',
  festival:'巡游、赛会和社区生活能够说明英歌今天在什么场合被使用、学习和重新组织。这是理解当代实践的语境，不单独构成一条起源证明。'
};
document.querySelectorAll('.origin-hypothesis').forEach(button=>button.addEventListener('click',()=>{
  const detail=document.querySelector('#originDetail'),copy=originCopy[button.dataset.origin];
  document.querySelectorAll('.origin-hypothesis').forEach(node=>{const active=node===button;node.classList.toggle('is-active',active);node.setAttribute('aria-pressed',String(active))});
  if(detail&&copy)detail.innerHTML='<strong>如何理解：</strong>'+copy;
}));
document.querySelectorAll('.origin-hypothesis').forEach(button=>button.setAttribute('aria-pressed',String(button.classList.contains('is-active'))));
const learningMotion=gsap.matchMedia();
learningMotion.add('(prefers-reduced-motion: no-preference)',()=>{
  const reveal=(targets,trigger,start='top 78%')=>{if(!document.querySelector(targets))return;gsap.from(targets,{autoAlpha:0,y:28,stagger:.08,duration:.7,ease:'power3.out',scrollTrigger:{trigger,start,once:true}})};
  reveal('.learning-intro > *','.learning-section','top 76%');
  reveal('.definition-stage','.definition-stage','top 82%');
  reveal('.origin-heading > *','.origin-section','top 78%');
  reveal('.origin-node','.origin-timeline','top 74%');
  reveal('.origin-hypothesis,.origin-detail','.origin-hypotheses','top 82%');
  reveal('.performance-heading > *','.performance-section','top 78%');
  reveal('.performance-step','.performance-sequence','top 82%');
  if(document.querySelector('.origin-line'))gsap.to('.origin-line',{scaleX:1,duration:1.2,ease:'power2.out',scrollTrigger:{trigger:'.origin-timeline',start:'top 74%',once:true}});
});
const transitionRoot=document.createElement('div');
transitionRoot.className='page-transition';
transitionRoot.setAttribute('aria-hidden','true');
transitionRoot.innerHTML='<svg viewBox="0 0 1440 1000" preserveAspectRatio="none"><path class="transition-back" d="M0 1120 C260 1040 430 1160 690 1070 C930 990 1160 1130 1440 1030 L1440 1120 L0 1120 Z"/><path class="transition-front" d="M0 1080 C230 960 450 1130 700 1010 C950 900 1190 1080 1440 960 L1440 1120 L0 1120 Z"/></svg><div class="transition-word">英歌舞数字博物馆</div>';
document.body.appendChild(transitionRoot);
const transitionFront=transitionRoot.querySelector('.transition-front');
const transitionBack=transitionRoot.querySelector('.transition-back');
const transitionWord=transitionRoot.querySelector('.transition-word');
const pathHiddenFront='M0 1080 C230 960 450 1130 700 1010 C950 900 1190 1080 1440 960 L1440 1120 L0 1120 Z';
const pathHiddenBack='M0 1120 C260 1040 430 1160 690 1070 C930 990 1160 1130 1440 1030 L1440 1120 L0 1120 Z';
const pathCoverFront='M0 -120 C230 -30 450 -150 700 -55 C950 35 1190 -100 1440 0 L1440 1120 L0 1120 Z';
const pathCoverBack='M0 -70 C260 30 430 -100 690 0 C930 90 1160 -40 1440 55 L1440 1120 L0 1120 Z';
function leaveForPage(url){
  transitionRoot.classList.add('is-active');
  gsap.timeline({defaults:{ease:'power3.inOut'},onComplete:()=>location.href=url})
    .to(transitionBack,{attr:{d:pathCoverBack},duration:.72},0)
    .to(transitionFront,{attr:{d:pathCoverFront},duration:.82},.06)
    .fromTo(transitionWord,{autoAlpha:0,y:18},{autoAlpha:1,y:0,duration:.34,ease:'power3.out'},.46);
}
document.querySelectorAll('a[href*=".html"]').forEach(link=>link.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target==='_blank'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const target=new URL(link.href,location.href);
  if(target.origin!==location.origin||target.href===location.href)return;
  event.preventDefault();
  sessionStorage.setItem('yingge-page-transition','1');
  leaveForPage(target.href);
}));
if(sessionStorage.getItem('yingge-page-transition')==='1'){
  sessionStorage.removeItem('yingge-page-transition');
  transitionRoot.classList.add('is-active');
  gsap.set([transitionFront,transitionBack],{attr:{d:pathCoverFront}});
  gsap.set(transitionBack,{attr:{d:pathCoverBack}});
  gsap.set(transitionWord,{autoAlpha:1});
  gsap.timeline({defaults:{ease:'power3.inOut'},onComplete:()=>transitionRoot.classList.remove('is-active')})
    .to(transitionWord,{autoAlpha:0,y:-14,duration:.25,ease:'power2.in'},.08)
    .to(transitionFront,{attr:{d:pathHiddenFront},duration:.82},.18)
    .to(transitionBack,{attr:{d:pathHiddenBack},duration:.72},.26);
}
window.addEventListener('pageshow',event=>{if(event.persisted){transitionRoot.classList.remove('is-active');gsap.set([transitionFront,transitionBack],{attr:{d:pathHiddenFront}})}});
const museumMenus=gsap.utils.toArray('.museum-menu');
document.addEventListener('pointerdown',event=>{museumMenus.forEach(menu=>{if(menu.open&&!menu.contains(event.target))menu.removeAttribute('open')})});
document.addEventListener('keydown',event=>{if(event.key==='Escape')museumMenus.forEach(menu=>menu.removeAttribute('open'))});document.querySelectorAll('.magnetic').forEach(el=>{const x=gsap.quickTo(el,'x',{duration:.35,ease:'power3'}),y=gsap.quickTo(el,'y',{duration:.35,ease:'power3'});el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();x((e.clientX-r.left-r.width/2)*.12);y((e.clientY-r.top-r.height/2)*.12)});el.addEventListener('pointerleave',()=>{x(0);y(0)})});
const guideOpeners=Array.from(document.querySelectorAll('[data-guide-open]'));
let guideReturnFocus=null;
let guideViewportFrame=0;
const keepGuideFocusVisible=()=>{if(!guide?.classList.contains('is-open'))return;cancelAnimationFrame(guideViewportFrame);guideViewportFrame=requestAnimationFrame(()=>{const target=guide.contains(document.activeElement)?document.activeElement:guide.querySelector('#question');target?.scrollIntoView?.({block:'nearest',inline:'nearest'})})};
const openGuide=event=>{if(!guide)return;guideReturnFocus=event?.currentTarget?.focus?event.currentTarget:document.activeElement;guide.inert=false;document.body.classList.add('guide-open');guide.classList.add('is-open');guide.setAttribute('aria-hidden','false');guideOpeners.forEach(button=>button.setAttribute('aria-expanded','true'));gsap.killTweensOf(guide);gsap.to(guide,{x:0,autoAlpha:1,duration:.46,ease:'power3.out',onComplete:()=>{guide.querySelector('#question')?.focus({preventScroll:true});keepGuideFocusVisible()}})};
const closeGuide=()=>{if(!guide)return;document.body.classList.remove('guide-open');guideOpeners.forEach(button=>button.setAttribute('aria-expanded','false'));gsap.killTweensOf(guide);gsap.to(guide,{x:'110%',autoAlpha:0,duration:.32,ease:'power2.in',onComplete:()=>{guide.classList.remove('is-open');guide.setAttribute('aria-hidden','true');guide.inert=true;guideReturnFocus?.focus?.({preventScroll:true})}})};
guideOpeners.forEach(button=>button.addEventListener('click',openGuide));
document.querySelector('.guide-close')?.addEventListener('click',closeGuide);
document.querySelector('.guide-backdrop')?.addEventListener('click',closeGuide);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&guide?.classList.contains('is-open'))closeGuide()});
window.addEventListener('resize',keepGuideFocusVisible);
window.visualViewport?.addEventListener('resize',keepGuideFocusVisible);
const companion=document.querySelector('.museum-companion');
if(sessionStorage.getItem('yingge-companion-hint-dismissed')==='1')companion?.classList.add('is-quiet');
companion?.querySelector('.companion-callout button')?.addEventListener('click',()=>{companion.classList.add('is-quiet');sessionStorage.setItem('yingge-companion-hint-dismissed','1')});
if(guide&&new URLSearchParams(location.search).get('guide')==='1')setTimeout(openGuide,opening?3250:80);
if(guide){
  const agentApi=`${YINGGE_API_BASE}/api/agent`;
  const agentForm=document.querySelector('#agentForm');
  const agentInput=document.querySelector('#question');
  const agentMessages=document.querySelector('#agentMessages');
  const agentStatus=document.querySelector('#agentStatus');
  const agentStatusDot=document.querySelector('.agent-status-dot');
  const agentSubmit=agentForm.querySelector('button[type="submit"]');
  let conversationId=sessionStorage.getItem('yingge-conversation-id')||createClientId();
  sessionStorage.setItem('yingge-conversation-id',conversationId);
  const HISTORY_KEY='yingge-public-chat-history';
  let history=[];try{const stored=JSON.parse(sessionStorage.getItem(HISTORY_KEY)||'[]');if(Array.isArray(stored))history=stored.slice(-8)}catch{}
  const saveHistory=()=>sessionStorage.setItem(HISTORY_KEY,JSON.stringify(history.slice(-8)));
  const dispatchAgentEvent=(type,detail={})=>window.dispatchEvent(new CustomEvent('yingge:agent-event',{detail:{type,...detail}}));
  let agentMotionTimer=0;
  const setAgentMotion=(state='idle',hold=0)=>{window.clearTimeout(agentMotionTimer);guide.dataset.agentState=state;if(hold>0)agentMotionTimer=window.setTimeout(()=>{guide.dataset.agentState='idle'},hold)};
  const setAgentStatus=(text,state='')=>{agentStatus.textContent=window.yinggeLocale?.translate(text)||text;agentStatusDot.className='agent-status-dot'+(state?' is-'+state:'')};
  const scrollAgent=()=>{agentMessages.scrollTop=agentMessages.scrollHeight};
  const messageNode=(role,text='')=>{const node=document.createElement('div');node.className='agent-message '+role;const body=document.createElement('p');body.textContent=text;node.appendChild(body);agentMessages.appendChild(node);scrollAgent();return{node,body}};
  const publicAnswerText=(text)=>String(text||'').replace(/\s*\[证据\d+\]/gu,'').trim();
  const speechAnswerText=(text)=>publicAnswerText(text).replace(/\s*#{2,3}\s*(?:适用边界|资料来源)[\s\S]*$/u,'').trim();
  const prefersReducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clearThinkingState=(assistant)=>{assistant.thinkingTimeline?.kill();assistant.thinkingTimeline=null;assistant.body.querySelector('.agent-thinking-state')?.remove()};
  const setThinkingState=(assistant)=>{
    assistant.body.textContent='';
    const state=document.createElement('div');state.className='agent-thinking-state';state.setAttribute('role','status');state.setAttribute('aria-live','polite');
    const label=document.createElement('strong');label.textContent='小槌正在整理这条讲解';state.appendChild(label);
    const steps=document.createElement('div');steps.className='agent-thinking-steps';
    ['检索馆内资料','核对适用范围','组织讲解内容'].forEach((text,index)=>{const step=document.createElement('div');step.className='agent-thinking-step';step.dataset.step=String(index+1);step.textContent=text;steps.appendChild(step)});
    state.appendChild(steps);assistant.body.appendChild(state);
    if(window.gsap&&!prefersReducedMotion){const stepNodes=steps.querySelectorAll('.agent-thinking-step');window.gsap.set(stepNodes,{autoAlpha:.48,x:0});assistant.thinkingTimeline=window.gsap.timeline({repeat:-1,defaults:{duration:.38,ease:'power2.out'}}).to(stepNodes,{autoAlpha:1,x:4,stagger:.14}).to(stepNodes,{autoAlpha:.48,x:0,stagger:{each:.14,from:'end'},delay:.32})}
  };
  const beginAnswerTyping=(assistant,getTarget)=>{
    if(prefersReducedMotion)return{complete:async()=>{assistant.body.textContent=publicAnswerText(getTarget())},cancel:()=>{}};
    assistant.body.textContent='';assistant.node.classList.add('is-typing');
    const cursor=document.createElement('span');cursor.className='agent-typing-cursor';assistant.body.appendChild(cursor);
    let shown=0,completeRequested=false,frame=0,resolveComplete;const completed=new Promise(resolve=>{resolveComplete=resolve});
    const tick=()=>{const target=publicAnswerText(getTarget());const remaining=target.length-shown;shown+=Math.min(Math.max(1,Math.ceil(target.length/78)),Math.max(0,remaining));cursor.textContent=target.slice(0,shown);scrollAgent();if(completeRequested&&shown>=target.length){assistant.node.classList.remove('is-typing');resolveComplete();return}frame=window.requestAnimationFrame(tick)};
    frame=window.requestAnimationFrame(tick);
    return{complete:async()=>{completeRequested=true;return completed},cancel:()=>{window.cancelAnimationFrame(frame);assistant.node.classList.remove('is-typing');resolveComplete?.()}};
  };
  const renderCitations=(node,items=[])=>{
    const safe=items.filter(item=>{try{return new URL(item.url).protocol==='https:'}catch{return false}}).slice(0,4);
    if(!safe.length)return;
    const fold=document.createElement('details');fold.className='agent-citation-fold';
    const title=document.createElement('summary');title.className='agent-source-title';title.textContent='资料来源 · '+safe.length;fold.appendChild(title);
    const list=document.createElement('div');list.className='agent-sources';
    safe.forEach(item=>{const link=document.createElement('a');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=(item.grade?'['+item.grade+'] ':'')+(item.title||'查看来源');list.appendChild(link)});
    fold.appendChild(list);node.appendChild(fold);
  };
  const appendInline=(element,text)=>{text.split('**').forEach((part,index)=>{if(index%2===1){const strong=document.createElement('strong');strong.textContent=part;element.appendChild(strong)}else element.appendChild(document.createTextNode(part))})};
  const renderAgentAnswer=(body,text)=>{
    text=publicAnswerText(text);
    body.textContent='';
    let target=body;
    text.split(String.fromCharCode(10)).forEach(line=>{
      const clean=line.trim();if(!clean)return;
      if(clean==='---'){target.appendChild(document.createElement('hr'));return}
      if(clean.startsWith('### ')||clean.startsWith('## ')){const offset=clean.startsWith('### ')?4:3;const label=clean.slice(offset);if(label==='适用边界'){const fold=document.createElement('details');fold.className='agent-answer-boundary';const summary=document.createElement('summary');summary.textContent='适用边界';fold.appendChild(summary);const copy=document.createElement('div');copy.className='agent-answer-boundary-copy';fold.appendChild(copy);body.appendChild(fold);target=copy;return}const heading=document.createElement('h4');appendInline(heading,label);body.appendChild(heading);target=body;return}
      if(clean.startsWith('- ')){const item=document.createElement('div');item.className='agent-bullet';appendInline(item,clean.slice(2));target.appendChild(item);return}
      const paragraph=document.createElement('p');appendInline(paragraph,clean);target.appendChild(paragraph);
    });
  };
  history.forEach(item=>{const restored=messageNode(item.role,item.content);if(item.role==='assistant')renderAgentAnswer(restored.body,item.content)});
  document.querySelector('.guide-reset')?.addEventListener('click',()=>{history=[];saveHistory();conversationId=createClientId();sessionStorage.setItem('yingge-conversation-id',conversationId);agentMessages.querySelectorAll('.agent-message').forEach(node=>node.remove());setAgentStatus('知识库已连接','online');setAgentMotion('idle');agentInput.focus()});
  async function askAgent(message){
    const clean=message.trim();if(!clean||agentSubmit.disabled)return;
    messageNode('user',clean);history.push({role:'user',content:clean});saveHistory();agentInput.value='';agentSubmit.disabled=true;setAgentStatus('正在查阅英歌知识库');setAgentMotion('thinking');dispatchAgentEvent('user',{text:clean});dispatchAgentEvent('start');
    const assistant=messageNode('assistant agent-thinking');setThinkingState(assistant);let answer='';let citations=[];let typing=null;
    try{
      const response=await fetch(agentApi+'/chat',{method:'POST',headers:{'content-type':'application/json','x-app-id':'yingge-h5'},body:JSON.stringify({app_id:'yingge-h5',conversation_id:conversationId,message:clean,history:history.slice(-6),context:{audience:document.documentElement.dataset.locale==='en'?'visitor':'游客',detail_level:'standard',source_mode:'brief',page:publicPath,topic:guideContext.topic},client:{locale:document.documentElement.dataset.locale==='en'?'en-US':'zh-CN'}})});
      if(!response.ok){const problem=await response.json().catch(()=>({}));throw new Error(problem.message||'服务暂时不可用')}
      const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
      while(true){
        const chunk=await reader.read();if(chunk.done)break;buffer+=decoder.decode(chunk.value,{stream:true});
        const frames=buffer.split('\n\n');buffer=frames.pop()||'';
        for(const frame of frames){
          let event='message',data='';frame.split('\n').forEach(line=>{if(line.startsWith('event:'))event=line.slice(6).trim();if(line.startsWith('data:'))data+=line.slice(5).trim()});
          if(!data)continue;const payload=JSON.parse(data);
          if(event==='delta'){if(!answer){clearThinkingState(assistant);assistant.body.textContent='';assistant.node.classList.remove('agent-thinking');typing=beginAnswerTyping(assistant,()=>answer)}answer+=payload.text||'';dispatchAgentEvent('delta',{text:publicAnswerText(answer)});scrollAgent()}
          if(event==='citations')citations=payload.items||[];
          if(event==='done'){await typing?.complete();renderAgentAnswer(assistant.body,answer);setAgentStatus('知识库已连接','online');setAgentMotion('answering',1500);dispatchAgentEvent('done',{text:speechAnswerText(answer),citations})}
        }
      }
      if(!answer)assistant.body.textContent='这次没有生成有效回答，请换一种方式提问。';
      renderCitations(assistant.node,citations);history.push({role:'assistant',content:answer});while(history.length>8)history.shift();saveHistory();scrollAgent();
    }catch(error){clearThinkingState(assistant);typing?.cancel();assistant.node.classList.remove('agent-thinking');assistant.body.textContent='暂时无法连接英歌知识服务。请稍后再试。';setAgentStatus('连接异常','error');setAgentMotion('idle');dispatchAgentEvent('error',{text:'暂时无法连接英歌知识服务。请稍后再试。'})}
    finally{agentSubmit.disabled=false;if(guide.dataset.agentState==='thinking')setAgentMotion('idle');if(guide.classList.contains('is-open'))agentInput.focus()}
  }
  window.yinggeGuide={open:openGuide,close:closeGuide,ask:askAgent};
  fetch(`${YINGGE_API_BASE}/api/health`).then(r=>{if(!r.ok)throw 0;return r.json()}).then(status=>{if(status.knowledge_available===false||Number(status.chunks||1)<1)throw 0;setAgentStatus('知识库已连接','online')}).catch(()=>setAgentStatus('知识服务未启动','error'));
  agentForm.addEventListener('submit',event=>{event.preventDefault();askAgent(agentInput.value)});
  document.querySelectorAll('[data-agent-question]').forEach(button=>button.addEventListener('click',()=>{const insideGuide=guide.contains(button);if(!insideGuide)openGuide();setTimeout(()=>askAgent(button.dataset.agentQuestion),insideGuide?0:220)}));
}
const approvedThailandVisual={
  src:'assets/curation/thailand-2024-performance-close.jpg',
  source:'https://th.china-embassy.gov.cn/sgxw/202405/t20240502_11292436.html',
  label:'中国驻泰国使馆报道'
};
const addVisualCredit=(host)=>{
  if(!host||host.querySelector('.image-credit'))return;
  const credit=document.createElement('p');credit.className='image-credit';credit.append('现场图片来源：');
  const link=document.createElement('a');link.href=approvedThailandVisual.source;link.target='_blank';link.rel='noopener noreferrer';link.textContent=approvedThailandVisual.label;
  credit.appendChild(link);host.appendChild(credit);
};
if(publicPath==='watch.html'){
  const stage=document.querySelector('#film .media-stage');
  const image=stage?.querySelector('img');
  if(image){image.src=approvedThailandVisual.src;image.alt='2024 年曼谷共同表演现场的两位英歌舞者';addVisualCredit(stage)}
}
if(publicPath==='characters.html'){
  const split=document.querySelector('#face .editorial-split');
  const image=split?.querySelector(':scope > img');
  if(image){image.src=approvedThailandVisual.src;image.alt='2024 年曼谷共同表演现场的英歌舞者近景'}
  const paragraphs=split?.querySelectorAll('.reading-copy > p')||[];
  for(const paragraph of paragraphs)if(paragraph.textContent.includes('英歌小槌是博物馆概念 IP'))paragraph.textContent='这是一张现场观察图，不用于确认其中舞者的具体人物身份，也不能把画面中的脸谱当成所有队伍的统一样本。';
  addVisualCredit(split?.querySelector('.reading-copy'));
}
window.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});window.addEventListener('pagehide',()=>{mm.revert();contentMotion.revert();learningMotion.revert();ScrollTrigger.getAll().forEach(t=>t.kill())},{once:true});
if(document.querySelector('.hero')){const homeStory=document.createElement('script');homeStory.src='home-story.js?v=20260911-voice10';document.body.appendChild(homeStory)}
if(document.body.classList.contains('museum-page')||['formation.html','archive.html','content.html'].includes(publicPath)){
  const loadDepth=()=>{if(document.querySelector('[data-depth-layer]'))return;document.querySelector('script[data-depth-loader]')?.remove();const depthScript=document.createElement('script');depthScript.dataset.depthLoader='true';depthScript.src='exhibit-depth.js?v=20260901-en2';document.body.appendChild(depthScript)};
  if(publicPath==='archive.html'){window.addEventListener('archive:ready',loadDepth,{once:true});setTimeout(loadDepth,1200)}else loadDepth();
}

/* public museum language switcher: translations are kept beside the UI so the
   static bundle works offline and the same locale can be sent to the guide API. */
(function setupYinggeLocale(){
  const storageKey='yingge-locale';
  const requested=new URLSearchParams(location.search).get('lang');
  const stored=(()=>{try{return localStorage.getItem(storageKey)}catch{return null}})();
  let locale=requested==='en'||requested==='zh'?requested:(stored==='en'||stored==='zh'?stored:'zh');
  const pageFile=publicPath||'index.html';
  const pageTitles={
    'index.html':['英歌舞数字博物馆','Yingge Dance Digital Museum'],
    'content.html':['馆藏总览｜英歌舞数字博物馆','Collections | Yingge Dance Digital Museum'],
    'learn.html':['认识英歌｜英歌舞数字博物馆','Learn Yingge | Yingge Dance Digital Museum'],
    'watch.html':['看英歌｜英歌舞数字博物馆','Watch Yingge | Yingge Dance Digital Museum'],
    'characters.html':['识角色｜英歌舞数字博物馆','Roles & Objects | Yingge Dance Digital Museum'],
    'formation.html':['阵法与队形｜英歌舞数字博物馆','Formations | Yingge Dance Digital Museum'],
    'sound.html':['听锣鼓｜英歌舞数字博物馆','Sound & Drums | Yingge Dance Digital Museum'],
    'regions.html':['游地域｜英歌舞数字博物馆','Regions & Troupes | Yingge Dance Digital Museum'],
    'archive.html':['查档案｜英歌舞数字博物馆','Archives & Evidence | Yingge Dance Digital Museum'],
    'spread.html':['英歌出海｜英歌舞数字博物馆','Yingge Abroad | Yingge Dance Digital Museum'],
    'framework-museum.html':['专题展馆｜英歌舞数字博物馆','Themed Gallery | Yingge Dance Digital Museum']
  };
  const copy={
    '英歌舞数字博物馆':'Yingge Dance Digital Museum','英歌小槌':'Yingge Xiaochui','问小槌':'Ask Xiaochui','开始提问':'Ask a question','菜单':'Menu','关闭':'Close','打开网站导航':'Open site navigation','关闭网站导航':'Close site navigation','跳过开场':'Skip intro','首页':'Home','馆藏总览':'Collections','认识英歌':'Learn Yingge','英歌出海':'Yingge abroad','专题展馆':'Themed gallery','在线展馆':'Online exhibits','二级展馆':'Online exhibits','数字展览':'Digital exhibits','云游英歌':'Yingge Journey','馆藏档案':'Collection archive','返回门厅':'Back to lobby','看英歌':'Watch Yingge','识角色':'Meet the roles','练阵形':'Practice formations','听锣鼓':'Hear the drums','游地域':'Explore regions','查档案':'Browse archives','阵法与队形':'Formations & positions','角色与器物':'Roles & objects','声音与影像':'Sound & moving images','地域与队伍':'Regions & troupes','文献研究':'Documentary research','正式依据':'Formal sources','队伍个案':'Troupe case','田野资料':'Field materials','影像证据':'Performance footage',
    '国家级非物质文化遗产 英歌':'National intangible cultural heritage · Yingge','看见英歌，':'See Yingge,','也看懂英歌。':'Understand Yingge.','通过影像、阵形演示和智能导览，看懂英歌的动作、人物与地方传统。':'Use footage, formation demos, and the guide to understand Yingge movements, roles, and local traditions.','进入数字展馆':'Enter the digital museum','查看阵形演示':'View formation demo','从这里开始':'Start here','先从一场表演建立整体印象，遇到不懂的动作、人物与地方差异，随时问英歌小槌。':'Begin with one performance to build an overall impression. Ask Xiaochui whenever a movement, role, or local difference is unclear.','先看一场完整表演，再留意动作、队形、人物和各地特色。':'Watch one complete performance, then notice movements, formations, roles, and local traits.','有不明白的地方就问小槌。它会结合馆内资料回答，也会说明信息来自哪里、适用于哪些地区和队伍。':'Ask Xiaochui when something is unclear. Answers use museum materials and state their sources, regions, and troupes.','从你感兴趣的问题继续看':'Keep exploring from your questions','你可以从动作、角色、声音、地域或资料来源入手，继续认识英歌。':'Explore Yingge through movements, roles, sound, regions, or sources.','观察七种基础队形，以及队员怎样站位和移动':'Observe seven basic formations and how performers position and move.','角色功能、脸谱边界、英歌槌与服饰':'Role functions, facial-pattern boundaries, Yingge sticks, and costumes.','理解鼓、锣钹、槌击与吆喝如何协同':'See how drums, gongs, cymbals, stick strikes, and calls work together.','从具体地区、社区和队伍理解地方差异':'Understand local differences through places, communities, and troupes.','查看资料类型、适用范围与证据边界':'Review source types, scope, and evidence boundaries.','每一个结论，都能回到来源。':'Every conclusion should lead back to a source.','名录和标准帮助我们核对基本事实；队伍资料、影像和口述记录，则让具体的表演传统变得清楚。':'Lists and standards help check basic facts; troupe records, footage, and oral histories clarify living performance traditions.','查看证据说明':'See the evidence','先看英歌从哪里来':'Start with Yingge’s origins','了解英歌的来历，以及目前能找到的几种解释':'Learn about Yingge’s origins and the explanations currently documented.','进入影像展厅':'Enter the film gallery','从动作、角色、声音、阵形与地方传统认识英歌':'Learn Yingge through movements, roles, sound, formations, and local traditions.',
    '从一个问题，进入一座展厅。':'Enter a gallery through a single question.','两条主要参观路径':'Two ways to explore','先用现场照片和结构说明建立整体印象，再通过英歌小槌追问动作、人物与地方差异。':'Build an overall impression with field images and structure notes, then ask Xiaochui about movements, roles, and local differences.','两条主要参观路径':'Two ways to explore','馆藏不是物件清单':'A collection is more than an object list','按你的问题参观':'Explore by your question','表演记录':'Performance records','动作记录':'Movement records','人物记录':'Role records','空间记录':'Spatial records','证据记录':'Evidence records','第一次认识英歌':'First steps with Yingge','理解表演为什么整齐':'Why the performance is coordinated','核对一个具体说法':'Check a specific claim','观看导览':'Viewing guide','声音结构':'Sound structure','地方版本':'Local versions',
    '动作、声音与队形，同时发生。':'Movements, sound, and formations happen together.','从一个现场瞬间开始观察':'Start with one moment in the field','看动作，不只看敲槌':'Watch movement, not only stick strikes','一场表演如何展开':'How a performance unfolds','建立秩序':'Establish order','展开主体':'Develop the core','改变空间':'Change the space','收住节奏':'Settle the rhythm','重心如何移动':'How the centre of gravity shifts','力量如何传到手腕':'How force reaches the wrist','动作何时发生':'When a movement happens','队员怎样彼此配合':'How performers coordinate','专题视频 · 纪实寻迹':'Featured film · documentary trail','寻迹四百年·小槌传英歌':'Tracing Four Centuries · Xiaochui and Yingge','跟随英歌小槌，沿着历史、人物与地方队伍的线索，理解英歌如何在四百年间不断传承与变化。':'Follow Yingge Xiaochui through stories of history, performers, and local troupes to see how Yingge has been carried forward and changed over four centuries.','抱歉，当前浏览器无法播放这段专题视频。':'Sorry, this browser cannot play the featured film.','媒体说明：':'Media note:',
    '脸谱要和角色、服饰、队伍一起看。':'Read facial patterns with roles, costumes, and troupes.','先问“他在队伍中做什么”':'First ask: what does this person do in the troupe?','同一个称呼，不一定指同一个人物':'The same name does not always mean the same role','头槌':'Head striker','二槌':'Second striker','时迁':'Shi Qian','群舞':'Ensemble performers','脸谱提供什么信息':'What facial patterns tell us','先看线条和结构，再看颜色':'Read lines and structure before colour','器物与服饰也在讲角色':'Objects and costumes also speak about roles','一次角色辨认怎么完成':'How to identify a role','他站在哪里':'Where does the performer stand?','他正在做什么':'What is the performer doing?','他使用什么':'What is the performer using?','队伍怎样称呼':'What does the troupe call the role?','能确认到哪一步':'How far can we confirm?',
    '队伍如何在空间中运动？':'How does a troupe move through space?','队形是某一时刻队员之间的空间关系，变阵则是队伍从一种关系转入另一种关系的过程。这里以潮阳地方标准列出的七种基础队形为例，观察位置、路线、分合与转向；其他地区和队伍可能采用不同名称与组织方法。':'A formation is the spatial relationship between performers at a given moment; a change of formation is the move from one relationship to another. We use the seven basic formations listed in the Chaoyang local standard to observe positions, routes, joining, separation, and turns. Other regions and troupes may use different names and structures.','双列出海':'Twin-column crossing','方形阵':'Square formation','双龙出海':'Twin dragons crossing the sea','田螺阵':'Spiral formation','麦穗花阵':'Wheat-ear flower formation','四海升平':'Peace across the four seas','八卦阵':'Eight-trigrams formation',
    '声音帮助队伍感知共同节拍。':'Sound helps a troupe sense a shared beat.','锣鼓不是背景音乐':'Drums and gongs are not background music','声音怎样参与现场协作':'How sound coordinates the field','同一段表演，可以听四次':'Listen to the same performance four ways','鼓点进入':'The drumbeat enters','锣、钹与镲叠加':'Gongs and cymbals layer in','槌击与吆喝':'Stick strikes and calls','队形转换':'Formation changes','先听整体':'Listen to the whole','再追鼓点':'Follow the beat','再听身体':'Listen to the body','最后看空间':'Finally, watch the space',
    '同叫英歌，为何各有不同？':'Why do Yingge traditions differ?','不要只按城市贴标签':'Do not label by city alone','先从国家级项目分清地域入口':'Start with the national project entries','地域地图':'Regional map','返回全国视角':'Return to national view','汕头':'Shantou','揭阳':'Jieyang','潮州':'Chaozhou','汕尾':'Shanwei','同一地名，也有时间差异':'The same place name can span different periods',
    '一个结论，必须说明依据与边界。':'Every conclusion needs sources and scope.','不同资料回答不同问题':'Different sources answer different questions','名录、标准与政府资料':'Lists, standards, and government sources','队伍资料与表演影像':'Troupe records and performance footage','访谈、观察与口述':'Interviews, observation, and oral history','一条可用档案包含什么':'What a usable archive contains','当前核心依据':'Current core sources','国家级非遗名录':'National intangible heritage list','潮阳英歌地方标准':'Chaoyang Yingge local standard','政府公开资料':'Public government sources','项目审核知识库':'Project-reviewed knowledge base','一条说法怎样进入博物馆':'How a claim enters the museum','提出问题':'Ask the question','限定范围':'Define the scope','比较来源':'Compare sources','记录冲突':'Record conflicts','发布结论':'Publish the conclusion','英歌小槌使用同一套证据':'Yingge Xiaochui uses the same evidence standard',
    '英歌出海':'Yingge abroad','三次交流，三种传播方式':'Three exchanges, three ways of travelling','怎样阅读这条时间线':'How to read this timeline','关闭来源详情':'Close source details','学习整体观察顺序':'Learn the order of observation','听懂共同节拍':'Hear the shared beat','比较不同地区':'Compare regions',
    '正在连接知识库':'Connecting to the knowledge base','知识库已连接':'Knowledge base connected','知识服务未启动':'Knowledge service is not running','连接异常':'Connection problem','正在查阅英歌知识库':'Checking the Yingge knowledge base','小槌正在整理这条讲解':'Xiaochui is organising this explanation','检索馆内资料':'Search museum sources','核对适用范围':'Check the scope','组织讲解内容':'Build the explanation','暂时无法连接英歌知识服务。请稍后再试。':'The Yingge knowledge service is temporarily unavailable. Please try again.','这次没有生成有效回答，请换一种方式提问。':'No usable answer was generated. Please try another question.','适用边界':'Scope and limits','资料来源':'Sources','资料来源 · ':'Sources · ','输入问题':'Ask a question','问一个与英歌有关的问题':'Ask a question about Yingge','发送':'Send','清空对话':'Clear conversation','回答来自项目知识库，涉及地区、队伍和年代时会说明边界。':'Answers come from the project knowledge base and state boundaries for regions, troupes, and periods.','你好，我是英歌小槌。':'Hello, I’m Yingge Xiaochui.','回答会尽量说明资料来源和适用范围。':'I will note the sources and scope whenever possible.','我会依据馆内资料回答，并标明来源与适用范围。':'I answer from museum materials and note sources and scope.','小槌陪你看英歌':'Xiaochui explores Yingge with you','收起提示':'Dismiss tip','正在陪你参观：':'Exploring with you: ','语音功能':'Voice features','唤醒待机':'Wake standby','语音输入':'Voice input','小槌朗读：关':'Xiaochui voice: off','停止朗读':'Stop speaking','朗读完成':'Reading complete','朗读已停止，新回答仍会自动朗读':'Reading stopped; new answers will still be read aloud','当前设备不支持朗读':'This device does not support reading aloud','语音输入需 HTTPS':'Voice input requires HTTPS','浏览器不支持语音输入':'This browser does not support voice input','当前页面无法使用麦克风':'This page cannot use the microphone','请允许浏览器使用麦克风':'Please allow microphone access','没有听清，请再试一次':'I did not catch that. Please try again','语音识别网络不可用':'Speech recognition network unavailable','未找到可用麦克风':'No microphone found','麦克风正被其他应用占用':'The microphone is being used by another app','语音输入暂时不可用':'Voice input is temporarily unavailable'
  };
  /* Page copy kept here so the English mode covers the editorial reading, not
     only the navigation chrome. Proper names and source titles stay in their
     original form when they identify a cited record. */
  Object.assign(copy,{
    '跳至主要内容':'Skip to main content',
    '先通过现场照片和观看导览建立整体印象，遇到不懂的动作、人物与地方差异，随时问英歌小槌。':'Start with field photographs and the viewing guide. Ask Xiaochui whenever a movement, role, or local difference is unclear.',
    '从一个现场瞬间学习整体观察顺序，再继续理解动作、声音、队形和角色。':'Learn an order for reading one moment in the field, then continue with movement, sound, formations, and roles.',
    '进入观看导览':'Enter the viewing guide',
    '从动作、角色、声音、阵形、地域和档案中，选择你最想先了解的部分。':'Choose where to begin: movement, roles, sound, formations, regions, or archives.',
    '动作、角色、声音、空间和地方传统':'Movement, roles, sound, space, and local traditions',
    '先学会看整体':'Learn to read the whole scene first',
    '从一个现场瞬间学习观察顺序，再把动作、声音、队形和角色放回具体队伍与来源。':'Learn an order of observation from one field moment, then place movement, sound, formations, and roles back with a specific troupe and source.',
    '进入观看导览':'Enter the viewing guide',
    '智能导览':'Intelligent guide',
    '带着问题继续参观':'Keep exploring with a question',
    '它会根据馆内资料回答，也会告诉你这条信息适用于哪些地区、队伍和年代。':'It answers from museum materials and tells you which regions, troupes, and periods the information applies to.',
    '进入智能导览':'Enter the intelligent guide',
    '完整画面、段落、拍摄时间、地点与表演队伍。':'Complete frames, segments, shooting date, location, and performing troupe.',
    '动作名称、身体方向、节奏位置、持槌方式和适用队伍。':'Movement names, body direction, beat position, stick technique, and applicable troupes.',
    '角色功能、脸谱结构、服饰器物、师承说法与地方差异。':'Role functions, facial-pattern structure, costumes and objects, lineage accounts, and local differences.',
    '队形名称、人数、站位、行进路径、变阵信号与演出场景。':'Formation names, headcount, positions, routes, transition signals, and performance settings.',
    '名录、标准、政府资料、队伍材料与田野记录。':'Lists, standards, government records, troupe materials, and field notes.',
    '从观看导览建立观察顺序，再看角色、声音和阵形如何同时发生。':'Use the viewing guide to establish an order of observation, then see how roles, sound, and formations happen together.',
    '先看队伍怎样行进和变阵，再听锣鼓如何提示动作、角色如何彼此配合。':'Watch how the troupe travels and changes formation, then listen for how percussion cues movement and roles coordinate.',
    '先看资料来自哪里，再判断这条说法适用于哪个地区和哪支队伍。':'Check where a source comes from before deciding which region and troupe a claim applies to.',
    '按主题进入馆藏':'Enter the collection by theme',
    '不知道从哪里开始，我可以按你的兴趣带路。':'Not sure where to start? I can guide you by interest.',
    '先弄清楚，什么是英歌。':'First, clarify what Yingge is.',
    '它是舞蹈，也是锣鼓中的集体行动。身体、双槌、队形和社区生活，共同组成一场英歌。':'It is a dance and a collective action shaped by percussion. Bodies, paired sticks, formations, and community life make up an Yingge performance.',
    '英歌是什么':'What is Yingge?',
    '怎样看一场':'How to watch a performance',
    '板式差异':'Board-style differences',
    '起源与证据':'Origins and evidence',
    '地方差异':'Local differences',
    '继续参观':'Continue exploring',
    '把个人组织成队伍':'How individuals become a troupe',
    '声音':'Sound',
    '身体':'Body',
    '空间':'Space',
    '语境':'Context',
    '01 先听节拍':'01 Listen to the beat first',
    '锣鼓定下共同节拍':'Percussion sets a shared beat',
    '鼓、锣钹、槌击与吆喝给出速度、重音和段落信号。声音不是背景，它让队员知道什么时候落步、对槌、转向和变阵。':'Drums, gongs, cymbals, stick strikes, and calls signal speed, accents, and sections. Sound is not background: it tells performers when to step, strike, turn, and change formation.',
    '不同板式与队伍的节奏组织并不完全相同。':'Rhythmic organisation differs across board styles and troupes.',
    '02 再看身体':'02 Watch the body next',
    '身体把节拍变成力量':'The body turns beats into force',
    '重心下沉、步伐移动、上身转动与双槌路线彼此连动。力量感来自全身协调，木槌只是动作传到手上的末端。':'A lowered centre of gravity, footwork, torso rotation, and paired-stick paths move together. The sense of force comes from whole-body coordination; the sticks are only the final link.',
    '慢板、中板、快板的速度差异，也会改变动作的气质。':'The different speeds of slow, medium, and fast boards also change the quality of movement.',
    '03 跟住队形':'03 Follow the formation',
    '队形让集体动作有了方向':'Formations give collective movement a direction',
    '队员通过分行、合拢、穿插、回旋与换位，让每个人的动作汇成清楚的队形。阵形名称只是入口，真正需要看的是站位和路线。':'Performers use lines, joining, threading, circling, and position changes to turn individual actions into a clear formation. The name is only an entry point; watch positions and routes.',
    '同名阵形在不同队伍中可能采用不同人数与行进方法。':'A formation with the same name may use different numbers and routes in different troupes.',
    '04 回到出处':'04 Return to the source',
    '看它来自哪里':'See where it comes from',
    '人物、脸谱、服饰、锣鼓、板式和演出场景，都要回到具体社区、师承与年代。看懂一场表演，也要知道并不是所有英歌都完全一样。':'Roles, facial patterns, costumes, percussion, board styles, and performance settings must be read against a specific community, lineage, and period. Understanding a performance also means knowing that Yingge is not the same everywhere.',
    '这是本馆的观察顺序，不是每支队伍固定的节目单。':'This is the museum’s viewing order, not a fixed programme for every troupe.',
    '板式观察':'Rhythm-style observation',
    '潮阳英歌常按节奏板式分为慢板、中板和快板。这里用同一组视觉节拍比较三者，帮助你建立第一印象。这一分类来自潮阳资料，不代表所有地区和队伍。':'Chaoyang Yingge is often described through slow, medium, and fast board styles. This visual comparison offers a first impression; the classification comes from Chaoyang sources and does not represent every region or troupe.',
    '资料入口':'Source entry points',
    '多种起源观点的公开报道':'Public reports of several origin accounts',
    '同叫英歌，各有版本。':'The name is shared, but the versions differ.',
    '英歌在不同社区持续传承，也因此形成不同版本。比较时不能只看城市名称，还要看到具体村落、队伍、师承、板式和年代。':'Yingge continues in different communities and therefore develops different versions. Comparisons must look beyond city names to villages, troupes, lineages, board styles, and periods.',
    '问小槌：地方版本怎样比较？':'Ask Xiaochui: how should local versions be compared?',
    '潮阳文光 · 慢板个案':'Chaoyang Wenguang · slow-board case',
    '岭东的“慢”，不是动作少。':'Lingdong’s slow board does not mean fewer movements.',
    '查看队伍资料':'View troupe records',
    '继续问小槌':'Keep asking Xiaochui',
    '社区与师承':'Community and lineage',
    '谁在教，哪支队伍在演':'Who teaches, and which troupe performs',
    '板式与锣鼓':'Board styles and percussion',
    '速度、重音与段落怎样组织':'How speed, accents, and sections are organised',
    '角色与脸谱':'Roles and facial patterns',
    '怎样结合位置、服饰和道具辨认人物':'How to identify a role through position, costume, and objects',
    '队形与场景':'Formations and settings',
    '人数、路线与巡游空间如何变化':'How headcount, routes, and procession space change',
    '进入地区互动地图':'Enter the regional map',
    '现在，带着问题继续看。':'Now continue with a question.',
    '从定义进入现场，从现场回到具体队伍':'From definition to field, from field to a specific troupe',
    '起源、节奏类型与地方差异，可以继续追问。':'Keep asking about origins, rhythm types, and local differences.',
    '照片可以帮助辨认人物、姿态和装束，却不能呈现速度、路线和完整变阵。后面的观看方法会把这些观察边界说清楚。':'Photographs can help identify roles, postures, and dress, but they cannot show speed, routes, or a complete formation change. The viewing method below makes those limits clear.',
    '时间线':'Timeline',
    '声音何时改变':'When does the sound change?',
    '听鼓点的循环、重音与停顿，记录变阵前是否出现新的声音信号。':'Listen for beat cycles, accents, and pauses; note whether a new sound signal appears before a formation change.',
    '身体线':'Body line',
    '力量从哪里发出':'Where does the force begin?',
    '从脚下重心看到躯干转动，再看力量怎样进入手腕和双槌。':'Start at the centre of gravity under the feet, follow the torso rotation, then see how force reaches the wrists and paired sticks.',
    '空间线':'Spatial line',
    '人与人怎样重新排列':'How do people rearrange?',
    '观察朝向、间距和路线，不只在队形完成后才认一个名称。':'Watch orientation, spacing, and routes rather than waiting for a finished formation name.',
    '传统队伍曾不只有前棚':'Traditional troupes once included more than the front section',
    '为什么不提供一套万能动作名称':'Why there is no universal movement vocabulary',
    '同名动作可能因队伍、板式和师承而不同。理解一个动作时，需要把具体画面、表演队伍和资料来源放在一起看。':'A movement with the same name may differ by troupe, board style, and lineage. Read the specific image, troupe, and source together.',
    '本页重点：看懂一场表演':'This page: learn to read a performance',
    '我可以陪你从整体队形看到一个具体动作。':'I can guide you from the whole formation to one specific movement.',
    '颜色只能提供线索，不能单独决定人物身份。':'Colour offers a clue; it cannot determine identity on its own.',
    '辨认方法':'Identification method',
    '角色功能':'Role function',
    '脸谱观察':'Facial-pattern observation',
    '器物服饰':'Objects and costumes',
    '辨认流程':'Identification steps',
    '脸谱不是颜色密码。':'Facial patterns are not a colour code.',
    '戏面脸谱':'Theatrical facial patterns',
    '鬼面脸谱':'Ghost facial patterns',
    '英歌槌':'Yingge sticks',
    '特殊道具':'Special props',
    '头饰':'Headwear',
    '服装':'Costumes',
    '队列位置':'Position in the line',
    '动作功能':'Movement function',
    '视觉线索':'Visual clues',
    '队伍资料':'Troupe records',
    '证据结论':'Evidence conclusion',
    '本页重点：角色如何被辨认':'This page: how roles are identified',
    '脸谱不是简单的颜色对照表，我会说明判断边界。':'Facial patterns are not a simple colour chart; I will explain the limits of identification.',
    '选择基础队形':'Choose a basic formation',
    '自动巡演':'Auto tour',
    '双列队形':'Twin-column formation',
    '行进中':'In motion',
    '两列平行、左右对称向前行进，是巡游中最基础的队形。':'Two parallel, symmetrical lines moving forward form one of the most basic procession formations.',
    '如何读懂一次变阵':'How to read a formation change',
    '记住阵名只是第一步。真正值得观察的是队员从哪里进入，怎样保持距离，在什么信号后分组、转向或穿插，又如何让新的空间关系稳定下来。':'Remembering the name is only the first step. Watch where performers enter, how they keep distance, which signal triggers grouping, turning, or threading, and how the new spatial relationship settles.',
    '看位置':'Watch positions',
    '看路线':'Watch routes',
    '看信号':'Watch signals',
    '看边界':'Watch the boundary',
    '这里采用潮阳地方标准中的名称。其他地区和队伍可能有不同叫法、人数和演练方式。':'This page uses names from the Chaoyang local standard. Other regions and troupes may use different names, numbers, and rehearsal methods.',
    '阵法与队形互动展厅':'Interactive formations gallery',
    '点击阵形观看后，也可以问我队伍为何这样走。':'After selecting a formation, ask why the troupe moves that way.',
    '鼓点、锣、钹、镲、槌击和吆喝都是现场协作的一部分。它们可能提示速度、重音和段落变化，具体对应方式要回到队伍和表演片段中核对。':'Drums, gongs, cymbals, stick strikes, and calls all participate in field coordination. They may signal speed, accents, and section changes; verify their exact roles against a troupe and performance segment.',
    '声音层次':'Sound layers',
    '动作协同':'Movement coordination',
    '聆听方法':'Listening method',
    '个案边界':'Case-study limits',
    '锣鼓声不只是烘托气氛，它还可能参与队伍协作。鼓、锣、钹、镲、槌击和吆喝各有作用，也会随着队伍、段落和现场发生变化。':'Percussion does more than create atmosphere: it may coordinate the troupe. Drums, gongs, cymbals, stick strikes, and calls each have roles that change with the troupe, section, and setting.',
    '鼓':'Drums',
    '定下速度和段落，也常在变阵前给出提示。':'They set speed and sections, and often cue a formation change.',
    '锣、钹、镲':'Gongs and cymbals',
    '突出重音和层次，让段落更清楚，也让现场更有气势。':'They mark accents and layers, clarifying sections and intensifying the field.',
    '槌击':'Stick strikes',
    '舞者手中的双槌互相敲击，让动作本身也成为节奏。':'The paired sticks strike together so that movement itself becomes rhythm.',
    '吆喝':'Calls',
    '有人领喊，有人回应，既能提振气势，也可能提示下一步动作。':'One performer leads and others respond, raising energy and sometimes cueing the next movement.',
    '鼓点':'Beat',
    '发出速度与变化信号':'Signals speed and change',
    '落步、转身、击槌':'Steps, turns, and stick strikes',
    '转向、分合、穿插':'Turns, joining, separation, and threading',
    '锣钹、吆喝与观众感受':'Gongs, calls, and audience experience',
    '慢板、中板、快板不能只用 BPM 理解':'Slow, medium, and fast boards cannot be reduced to BPM',
    '不暂停画面，感受速度、声音强弱和段落变化。':'Do not pause the image; feel changes in speed, loudness, and sections.',
    '关注：何时变快、何时停顿':'Focus: when does it speed up or pause?',
    '关注：循环、重音、变化':'Focus: cycles, accents, and change',
    '关注：动作与声响是否同步':'Focus: are movement and sound synchronised?',
    '关注：信号出现在哪一拍':'Focus: on which beat does the signal appear?',
    '为什么不提供一套统一鼓谱':'Why there is no single universal drum score',
    '本页重点：声音如何组织动作':'This page: how sound organises movement',
    '从鼓点、槌击到吆喝，我可以帮你逐层听懂。':'From beats and stick strikes to calls, I can help you listen layer by layer.',
    '社区传统、师承、板式、角色、锣鼓和演出场合不同，英歌也会呈现出不同样貌。':'Yingge looks different when community traditions, lineages, board styles, roles, percussion, and settings differ.',
    '比较方法':'Comparison method',
    '核心区域':'Core regions',
    '地图位置':'Map position',
    '地域边界':'Regional boundaries',
    '比较各地英歌时，不能只写城市名称，还要看到具体社区、队伍、师承、板式和年代。即使在同一座城市，不同村落的队伍也可能很不一样。':'When comparing local Yingge, do not stop at city names. Include the community, troupe, lineage, board style, and period; even villages in one city may differ greatly.',
    '问小槌：怎样比较地方版本':'Ask Xiaochui: how should local versions be compared?',
    '同在潮阳，也不是一个版本':'Even Chaoyang has more than one version',
    '拖动平移，滚轮或双指缩放，点击高亮区域':'Drag to pan, scroll or pinch to zoom, and click a highlighted region.',
    '主要分布':'Main distribution',
    '观察重点':'What to observe',
    '潮阳、潮南的社区队伍与地方版本':'Community troupes and local versions in Chaoyang and Chaonan',
    '接下来可以查看潮阳、潮南的具体队伍和不同时期。':'Next, view specific troupes and periods in Chaoyang and Chaonan.',
    '查看地区说明':'View regional notes',
    '地图用于地区索引。行政边界与地名以国家标准地图服务公布信息为准。':'The map is a regional index. Administrative boundaries and place names follow the national standard map service.',
    '本页重点：地方版本为何不同':'This page: why local versions differ',
    '选择地区后，可以继续比较社区、队伍和年代差异。':'Select a region to compare communities, troupes, and periods.',
    '查档案':'Browse archives',
    '一句话，怎样成为可靠知识？':'How does one sentence become reliable knowledge?',
    '先找来源，再看地区和年代，最后判断这句话能说明到什么程度。':'Find the source first, then the region and period, and finally decide how far the sentence can support a conclusion.',
    '追一条主张':'Trace a claim',
    '资料各自能说明什么':'What each source can show',
    '检查结论边界':'Check the conclusion’s limits',
    '试着核对':'Try to verify it',
    '查看实例':'View an example',
    '一句说法，还不算档案':'A claim is not yet an archive',
    '正在核查':'Checking',
    '先别急着相信':'Do not believe it too quickly',
    '先问：谁发布？':'First ask: who published it?',
    '再问：说的是哪里？':'Then ask: where does it apply?',
    '还要问：是哪一年？':'Also ask: which year?',
    '最后问：能否核对？':'Finally ask: can it be cross-checked?',
    '不同资料，各有用处':'Different sources serve different purposes',
    '正式依据':'Formal sources',
    '个案证据':'Case evidence',
    '田野材料':'Field materials',
    '确认公共事实':'Confirm public facts',
    '结论的边界，比结论本身更重要':'The limits of a conclusion matter more than the conclusion itself',
    '不能确认':'Cannot confirm',
    '过度概括':'Over-generalised',
    '怎样改成可以核对的表述':'How to rewrite it so it can be checked',
    '对象':'Object',
    '证据':'Evidence',
    '边界':'Boundary',
    '资料怎样进入博物馆':'How materials enter the museum',
    '把说法改成问题':'Turn a claim into a question',
    '保留来源原貌':'Preserve the source as published',
    '标出冲突与空缺':'Mark conflicts and gaps',
    '说明适用范围':'State the scope',
    '一条已经核实的档案':'A verified archive record',
    '下面用一个例子，展示一条结论怎样被核实。它只能确认公共事实，不能代替具体队伍的表演记录。':'The example below shows how a conclusion is verified. It confirms a public fact only; it cannot replace a specific troupe’s performance record.',
    '主张':'Claim',
    '活动时间、地点与队伍依据中国驻泰国大使馆和外交部页面；两张现场影像已按项目授权记录完成权利与隐私复核，仅用于呈现活动现场。':'Event dates, locations, and troupes follow pages from the Chinese Embassy in Thailand and the Ministry of Foreign Affairs. The two field images were reviewed for rights and privacy under the project authorisation record and are used only to show the event setting.',
    '中华人民共和国驻泰王国大使馆':'Embassy of the People’s Republic of China in the Kingdom of Thailand',
    '中华人民共和国外交部转载':'Reposted by the Ministry of Foreign Affairs of the People’s Republic of China',
    '合作材料使用了“首支英歌队”的表述。本展当前只采用政府页面可核验的队伍成立事实，不采用“首支”结论。':'Collaboration materials use the phrase “first Yingge troupe”. This feature uses only the verifiable founding fact on government pages and does not adopt the “first” claim.',
    '现有官方页面支持成立仪式事实，不足以支持‘首支英歌队’等更强结论；现场影像已按项目授权记录完成权利与隐私复核，仅用于呈现成立仪式场景。':'The available official pages support the founding-ceremony fact, but not the stronger claim of a “first Yingge troupe”. Field images were reviewed under the project authorisation record and are used only to show the ceremony setting.',
    '人数、行程与场次依据现有主流媒体页面。':'Headcount, itinerary, and number of performances follow the available mainstream media pages.',
    '南方日报、南方+':'Nanfang Daily and Nanfang+ ',

    // Dynamic exhibit layers and interactive labs are injected after the
    // initial page scan. Keep their complete sentences here so a locale
    // refresh can translate them as soon as the layer appears.
    '快慢不是速度标签，而是三种身体时间。':'Slow, medium, and fast are three kinds of embodied time, not speed labels.',
    '地方标准把传统潮阳英歌按节奏划分为慢板、中板和快板。差别不仅在鼓点快慢，也会进入槌的长度、动作组合、身体幅度与队伍气质。':'The local standard groups traditional Chaoyang Yingge by slow, medium, and fast board styles. The difference is not only the beat speed; it also appears in stick length, movement combinations, bodily range, and the troupe’s character.',
    '选择节奏板式':'Choose a board style', '慢板':'Slow board',
    '沉稳蓄势':'Steady and gathering force', '动作在停顿中积蓄力量':'Movement gathers force in the pauses',
    '慢板鼓点悠缓，击槌常以三下或四下构成一组。观看时可以留意动作怎样在较长的时间里完成下沉、转身和收势。':'Slow-board beats are spacious, with three or four strikes often forming a phrase. Watch how sinking, turning, and settling unfold over a longer span.',
    '节奏感':'Rhythmic feel', '悠缓、厚重':'Spacious and weighty', '观察点':'What to watch', '蓄势与收势':'Gathering and settling',
    '舒展饱满':'Open and full', '动作幅度在稳定节拍中展开':'Movement opens out over a steady beat',
    '中板节奏介于快板与慢板之间，击槌组合更为多样。它的重点不只是中等速度，而是稳定、圆活和充分展开的身体幅度。':'Medium-board rhythm sits between slow and fast, with more varied strike combinations. Its point is not an average speed but stable, fluid, fully opened movement.',
    '适中、连贯':'Moderate and continuous', '幅度与圆活':'Range and flow',
    '威猛欢跃':'Fierce and buoyant', '紧凑鼓点推动动作与阵势':'Tight beats drive movement and formations',
    '快板鼓点紧凑，舞蹈节奏急速，短槌更利于灵活运转。观看时要同时追踪手上槌路和脚下路线，避免只看速度。':'Fast-board beats are compact and the dance moves quickly; shorter sticks support agile turns. Track the stick path and foot route together instead of watching speed alone.',
    '紧凑、热烈':'Compact and intense', '槌路与阵势':'Stick paths and formations',
    '传统不是静止的样本。':'Tradition is not a frozen sample.',
    '同在潮阳，不同社区也会形成不同的槌法、人物设定和传承方式。比较具体队伍，比概括一个地区更接近真实。':'Even within Chaoyang, communities develop different stick techniques, role settings, and ways of passing tradition on. Comparing specific troupes is closer to reality than generalising about a region.',
    '河陇英歌：一支队伍怎样形成自己的动作语汇':'Helong Yingge: how a troupe forms its own movement vocabulary',
    '公开队伍资料记录了竖槌、快板、手指旋槌，以及双箭穿云、双龙戏水等常用阵形。这里展示的是河陇队的具体实践，不能替代其他队伍。':'Public troupe records describe upright sticks, fast-board rhythm, finger spins, and formations such as Twin Arrows through the Clouds and Twin Dragons Playing in Water. This is the Helong troupe’s practice, not a substitute for other troupes.',
    '龙港女子英歌：传承也包含当代选择':'Longgang women’s Yingge: transmission also includes contemporary choices',
    '2024 年重新组建的龙港女子英歌队以中学生为主体，并以花木兰为人物设定。它说明活态传承既保留基本步伐和槌法，也会回应新的参与者与社区表达。':'Re-formed in 2024, the Longgang women’s troupe is made up mainly of middle-school students and uses Hua Mulan as its character setting. Living transmission keeps basic steps and stick work while responding to new participants and community expression.',
    '角色先是一种队伍职责。':'A role begins as a troupe responsibility.',
    '潮阳地方标准把队长、教练、指挥、引舞、领舞、舞队和乐队分开记录。人物故事提供叙事，现场职责则决定队伍怎样运行。':'The Chaoyang local standard records the captain, coach, conductor, guide dancer, lead dancer, dance team, and band separately. Stories provide narrative; field responsibilities determine how the troupe runs.',
    '引舞':'Guide dancer', '头槌与二槌':'Head and second strikers', '舞队与乐队':'Dance team and band',
    '用鼓点把握行进速度、节奏和套路变化。部分队伍由宋江或林冲的扮演者承担。':'Uses beats to control procession speed, rhythm, and routine changes. In some troupes, the role is played by the performer portraying Song Jiang or Lin Chong.',
    '在前方开路、打场并协助指挥，较常见的是耍蛇的时迁。':'Opens the route, clears the space, and assists the conductor; Shi Qian, the snake dancer, is common in this role.',
    '位于队伍前部，接收号令并带领舞队。潮阳标准记录的常见对应人物包括秦明、关胜和李逵，但不是所有队伍都相同。':'At the front, receiving cues and leading the dance team. The Chaoyang standard lists Qin Ming, Guan Sheng, and Li Kui as common correspondences, but troupes differ.',
    '舞队完成动作和队形，乐队建立共同时间。英歌的主体不是单个英雄，而是职责之间的协同。':'The dance team completes movements and formations while the band establishes shared time. Yingge is not one hero but coordination among responsibilities.',
    '七种基础队形，呈现七种空间组织方式。':'Seven basic formations show seven ways of organising space.',
    '2025 年地方标准列出的七种基础队形适用于传统潮阳英歌的传承与演练。这里把阵名还原为可以观察的空间语法，不能直接泛化到所有地区。':'The seven basic formations listed in the 2025 local standard apply to the transmission and rehearsal of traditional Chaoyang Yingge. Here the names are translated into observable spatial grammar; they cannot be generalised to every region.',
    '双列':'Twin columns', '平行前进':'Parallel advance', '方形':'Square', '两组并列':'Two groups side by side', '双龙出海':'Twin dragons crossing the sea', '中部分裂':'Split at the centre', '田螺':'Spiral', '单列卷成螺旋':'One line coiling into a spiral', '麦穗花':'Wheat-ear flower', '内外反向穿行':'Inner and outer lines cross in opposite directions', '四海升平':'Peace across the four seas', '四圈十字对称':'Four rings in cross symmetry', '八卦':'Eight trigrams', '内外圆与 S 形':'Inner and outer circles with an S-curve',
    '阵形不是静态图案':'A formation is not a static pattern',
    '同一个图形必须放进行进过程里看。队员从哪里进入，怎样保持间距，在哪个信号上改变方向，决定了阵形是否成立。':'Read a shape within the procession. Where performers enter, how they keep spacing, and which signal changes direction determine whether the formation holds.',
    '标准不是全国统一规则':'The standard is not a nationwide rule',
    '该标准明确适用于传统潮阳英歌。其他地区、村落与队伍可有不同名称、人数、路线和演练方法。':'The standard explicitly applies to traditional Chaoyang Yingge. Other regions, villages, and troupes may use different names, numbers, routes, and rehearsal methods.',
    '声音是现场协作的一部分。':'Sound is part of field coordination.',
    '潮阳地方标准记录了指挥通过鼓点把握速度、节奏、队形和套路变化。锣、钹、槌击与吆喝可能强化共同节拍；具体信号如何对应动作，仍要结合具体队伍和带时间码的片段核对。':'The Chaoyang standard records the conductor using beats to manage speed, rhythm, formations, and routine changes. Gongs, cymbals, stick strikes, and calls may reinforce a shared beat; match each signal to movement using a specific troupe and time-coded clip.',
    '身体':'Body', '队形':'Formation', '现场':'Field', '慢板、中板、快板不能只用 BPM 理解':'Slow, medium, and fast boards cannot be understood through BPM alone',
    '地方标准同时记录了鼓点循环、击槌组合和动作气质。慢板强调沉稳蓄势，中板更舒展饱满，快板则鼓点紧凑、动作急速。它们是身体、器物和集体协作共同形成的板式。':'The local standard records beat cycles, strike combinations, and movement quality together. Slow boards gather force, medium boards open out, and fast boards tighten the beats and quicken movement. Board style is made by bodies, objects, and collective coordination.',
    '先分清名录、流传地和队伍案例。':'First separate registers, circulation areas, and troupe cases.',
    '地图上的高亮不能只表达“哪里有英歌”。它至少要区分国家级项目申报地区、公开资料中的流传范围，以及本馆已经核对到具体队伍的地点。':'A highlighted map cannot simply mean “where Yingge exists”. It should distinguish national-list application areas, circulation ranges in public sources, and places where this museum has verified a specific troupe.',
    '国家名录':'National register', '扩展项目':'Extended project', '具体队伍':'Specific troupe',
    '2006 年第一批国家级非遗名录把英歌列为传统舞蹈，申报地区为广东省揭阳市、汕头市，对应普宁英歌和潮阳英歌。':'The first national intangible-heritage list in 2006 classified Yingge as traditional dance, with applications from Jieyang and Shantou in Guangdong, corresponding to Puning and Chaoyang Yingge.',
    '甲子英歌于 2011 年列入第三批国家级非物质文化遗产扩展项目，申报地区为广东省陆丰市。项目关系不能等同于整个行政区域采用同一种传统。':'Jiazi Yingge entered the third national intangible-heritage extension list in 2011, with Lufeng, Guangdong as the application area. A project relationship does not mean an entire administrative area shares one tradition.',
    '同一地区内部也有快慢板、槌法、人物和传承方式的差异。真正的比较应继续下沉到社区、队伍和年代。':'A single region can contain differences in board style, stick technique, roles, and transmission. Comparisons should move down to communities, troupes, and periods.',
    '一条看似正确的话，也可能说得太满。':'A seemingly correct sentence can still overstate the evidence.',
    '档案工作的核心不是收集更多链接，而是把一句话拆成对象、时间、地点、来源和适用范围，再决定它能否公开展示。':'The core of archival work is not collecting more links. Break a sentence into object, time, place, source, and scope before deciding whether it can be shown publicly.',
    '英歌队的每位舞者都扮演一名梁山好汉。':'Every Yingge dancer portrays a Liangshan hero.',
    '水浒英雄是英歌重要的人物叙事资源。潮阳地方标准同时注明，采用戏面脸谱的队伍通常只有前几位表演者具有较明确的人物身份，其余表演者多不确定。具体队伍也可能建立自己的完整脸谱谱系。':'Water Margin heroes are an important narrative resource in Yingge. The Chaoyang standard also notes that troupes using theatrical facial patterns usually give clear identities only to the first few performers; the rest are often not specified. A specific troupe may build its own complete facial-pattern genealogy.',
    '采用戏面脸谱的潮阳英歌队伍':'Chaoyang Yingge troupes using theatrical facial patterns', '地方标准与具体队伍资料':'Local standards and specific troupe records', '不能推成所有英歌、所有队员':'This cannot be extended to every Yingge troupe or performer',
    '从整体、结构与来源三层建立理解。':'Build understanding through the whole scene, structure, and sources.',
    '先保留现场感，再拆开动作、声音和空间，最后回到地区、队伍和来源。三层观察彼此补充，能减少只看热闹或只背知识条目的误解。':'Keep the field impression first, then separate movement, sound, and space, and finally return to region, troupe, and source. The three layers complement one another and prevent both spectacle-only and fact-list-only readings.',
    '先看现场':'First, watch the field', '不暂停，不急着认人物，先感受队伍怎样进入同一节拍。':'Do not pause or rush to identify roles; first feel how the troupe enters a shared beat.',
    '再拆结构':'Then, unpack the structure', '分别追踪身体、双槌、声音、角色和路线。':'Track bodies, paired sticks, sound, roles, and routes separately.',
    '最后核对':'Finally, verify', '确认这次表演属于哪里、哪支队伍、哪个年代，资料来自何处。':'Confirm where this performance belongs, which troupe and period it represents, and where the material came from.',
    '画面里同时有三条线。':'Three lines run through the image at once.',
    '看懂英歌，不是把视频切成动作名称。你需要同时追踪时间、身体和空间，并在三条线交会时判断一次变化为什么发生。':'Understanding Yingge is not about chopping a video into movement names. Track time, body, and space together, then ask why a change happens where the three lines meet.',
    '传统队伍由前棚、中棚和后棚组成。前棚是英歌主体，中棚多见地方戏曲、民间小戏、小曲或杂技，后棚多为武术表演。今天常见的潮阳英歌多指前棚，因此观看当代影像时，不宜把一段前棚画面当成传统队伍全部结构。':'Traditional troupes consisted of front, middle, and rear sections. The front was the Yingge core; the middle often featured local opera, folk theatre, songs, or acrobatics; the rear was commonly martial-arts performance. Today “Chaoyang Yingge” often means the front section, so a front-section clip should not be treated as the whole traditional structure.',
    '声音何时改变':'When does the sound change?', '身体线':'Body line', '空间线':'Spatial line', '人与人怎样重新排列':'How do people rearrange?',
    '角色不是先有一个固定名字':'A role does not begin with a fixed name',
    '不同队伍会用不同称呼与谱系组织人物。先观察位置、职责和动作，再核对脸谱、服饰与队伍资料。':'Different troupes organise people through different names and genealogies. Observe position, duty, and movement first, then check facial patterns, costumes, and troupe records.',
    '角色系统':'Role system', '脸谱边界':'Facial-pattern limits', '器物与服饰':'Objects and costumes',
    '阵法不是图案，而是协作过程。':'A formation is a coordination process, not a picture.',
    '变化发生在位置、路线、节拍和指挥之间。':'Change happens between position, route, beat, and direction.',
    '信号系统':'Signal system', '变化信号':'Change signal', '共同节拍':'Shared beat',
    '先听整体，再追鼓点，最后对齐动作与空间。':'Listen to the whole first, follow the beat next, then align movement with space.'
    ,'展开队形面板':'Expand formation panel','收起队形面板':'Collapse formation panel','自动巡演':'Auto tour','自动巡演已暂停':'Auto tour paused','变阵中':'Changing formation','行进中':'In motion','返回全国视角':'Return to national view','聚焦潮汕地区':'Focus on Chaoshan',
    '2006 年，潮阳英歌和普宁英歌列入第一批国家级非物质文化遗产名录，类别为传统舞蹈。这里介绍的是共同的观看方法。具体动作、角色和队形，仍要回到地区与队伍中辨认。':'In 2006, Chaoyang and Puning Yingge entered the first national intangible-heritage list as traditional dance. This section introduces shared ways of watching; specific movements, roles, and formations must still be identified by region and troupe.',
    '2006 年，普宁英歌与潮阳英歌进入第一批国家级非物质文化遗产名录，项目编号为 Ⅲ—8，类别为传统舞蹈。甲子英歌于 2011 年作为第三批扩展项目进入国家级名录体系。名录可以确认项目身份、批次和申报地区，不能单独证明某一种起源解释。':'In 2006, Puning and Chaoyang Yingge entered the first national intangible-heritage list under project III-8 as traditional dance. Jiazi Yingge entered the national register as a third-batch extension project in 2011. A register confirms project identity, batch, and application area; it cannot by itself prove an origin account.',
    '本动画把队员抽象为位置点，只演示空间关系，不复刻任何一支队伍的完整套路、固定人数、槌路、鼓点或口令。拖动可旋转视角，按住 Ctrl 滚轮缩放；点击阵形可暂停巡演。':'This animation abstracts performers as position points. It demonstrates spatial relationships only; it does not reproduce any troupe’s full routine, fixed headcount, stick paths, beats, or calls. Drag to rotate, hold Ctrl while scrolling to zoom, and click a formation to pause the tour.',
    '河陇英歌以竖槌、快板和手指旋槌见长；2024 年重新组建的龙港女子英歌队则以中学生为主体，并采用花木兰人物设定。地区名称只是入口，队伍实践才是内容。':'Helong Yingge is known for upright sticks, fast-board rhythm, and finger spins; the Longgang women’s troupe, re-formed in 2024 with middle-school students, uses Hua Mulan as its character setting. A place name is only an entry point; troupe practice is the content.',
    '2025 年潮阳地方标准的编制说明记载，传统队伍由前棚、中棚和后棚组成。前棚是英歌主体，中棚多见地方戏曲、民间小戏、小曲或杂技，后棚多为武术表演。今天常见的潮阳英歌多指前棚，因此观看当代影像时，不宜把一段前棚画面当成传统队伍全部结构。':'The 2025 drafting note for the Chaoyang local standard records traditional troupes as front, middle, and rear sections. The front is the Yingge core; the middle often features local opera, folk theatre, songs, or acrobatics; the rear is commonly martial-arts performance. Today “Chaoyang Yingge” often means the front section, so a front-section clip should not be treated as the whole traditional structure.',
    '2006年，第一批国家级非物质文化遗产名录公布':'2006: the first national intangible-heritage list was published',
    '潮阳英歌于2006年列入第一批国家级非物质文化遗产名录。':'Chaoyang Yingge entered the first national intangible-heritage list in 2006.',
    '查看具体队伍的 108 脸谱案例':'View a specific troupe’s 108 facial-pattern cases',
    '一行45人应邀赴新加坡，在五天行程中进行了四场交流表演。':'A delegation of 45 was invited to Singapore and gave four exchange performances over five days.',
    '资料档案':'Source archive',
    '“潮阳英歌在2006年列入第一批国家级非遗名录。”':'“Chaoyang Yingge entered the first national intangible-heritage list in 2006.”',
    '潮阳城南忠精英歌队、新加坡潮阳会馆':'Chaoyang Chengnan Zhongyi Yingge Troupe; Singapore Chaoyang Association'
  });
  Object.assign(copy, {
    '通过影像、阵形互动和智能导览，看懂英歌的动作、人物与地方传统。':'Use footage, interactive formation exploration, and the guide to understand Yingge movements, roles, and local traditions.',
    '探索阵形互动':'Explore formations',
    '本动画把队员抽象为位置点，只呈现空间关系，不复刻任何一支队伍的完整套路、固定人数、槌路、鼓点或口令。拖动可旋转视角，按住 Ctrl 滚轮缩放；点击阵形可暂停巡演。':'This animation abstracts performers as position points. It presents spatial relationships only; it does not reproduce any troupe’s full routine, fixed headcount, stick paths, beats, or calls. Drag to rotate, hold Ctrl while scrolling to zoom, and click a formation to pause the tour.',
    '英歌队形空间关系三维互动示意':'Interactive 3D study of Yingge formation relationships',
    '跳过视频':'Skip video','开始认识英歌':'Meet Yingge','英歌是什么？':'What is Yingge?',
    '英歌是流传于潮汕及粤东部分地区的传统舞蹈。表演者手持双槌，在锣鼓和吆喝的节奏中，以步法、身法、槌法、人物扮演和队形行进，共同完成一场充满力量的集体表演。各地、各支队伍的表演又各有特点。':'Yingge is a traditional dance from Chaoshan and parts of eastern Guangdong. Performers carry paired sticks and combine footwork, body technique, stick work, role-play, and formations to create a powerful collective performance. Every region and troupe has its own character.',
    '它常见于春节、元宵、巡游与地方社区活动。普宁、潮阳、甲子等地区和不同队伍，在节奏、动作、脸谱与阵形上并不完全相同。':'It is commonly seen at the Spring Festival, Lantern Festival, processions, and community events. Puning, Chaoyang, Jiazi, and other regions and troupes differ in rhythm, movement, facial patterns, and formations.',
    '接着看一场英歌怎样展开':'See how a performance unfolds',
    '步法、身法与重心':'Footwork, body technique, and centre of gravity','对击与槌路':'Strikes and stick paths','共同节拍与信号':'Shared beats and signals','人物、脸谱与器物':'Roles, facial patterns, and objects','站位、路线与变阵':'Positions, routes, and changes',
    '先看重心、步法和槌路，力量从一个人的身体传到整支队伍。':'Start with centre of gravity, footwork, and stick paths; force travels from one body to the whole troupe.',
    '你可以直接问英歌是什么、怎样看阵形、如何辨认人物，也可以追问某个说法依据什么资料。':'Ask what Yingge is, how to read a formation, or how to identify a role; you can also ask which sources support a claim.',
    '第一次怎么看英歌？':'How should I watch Yingge for the first time?','为什么要持双槌？':'Why carry paired sticks?','怎样辨认人物？':'How do I identify a role?',
    '展开完整对话':'Open the full conversation','你好，我是英歌小槌。你可以从一个具体问题开始，我会尽量说明资料来源和适用范围。':'Hello, I’m Yingge Xiaochui. Start with one specific question and I will note the sources and scope whenever possible.','想先了解什么？':'What would you like to learn first?','提问':'Ask',
    '小槌朗读：开':'Xiaochui voice: on','看不懂的动作、人物和地方差异，都可以问我。':'Ask me about movements, roles, and local differences that are unclear.','识角色与器物':'Meet roles and objects',
    '英歌是什么、从哪里来，又该怎样观看。':'What Yingge is, where it comes from, and how to watch it.','进入':'Enter','沿三次已核验事件，观察不同主体怎样展开跨境交流。':'Follow three verified events to see how different groups build cross-border exchange.','一场表演如何展开，动作如何与声音、队形同时发生。':'How a performance unfolds, with movement, sound, and formation happening together.','结合队伍中的位置、脸谱、服饰和道具，一步步辨认角色。':'Identify roles step by step through position, facial patterns, costumes, and objects.','七种基础队形如何组织站位、方向和行进路线。':'How seven basic formations organise positions, directions, and routes.','鼓、锣钹、槌击和吆喝如何组织群体动作。':'How drums, gongs, cymbals, stick strikes, and calls organise group movement.','同样叫英歌，不同地区、社区和队伍为何会有不同版本。':'Why regions, communities, and troupes called Yingge can still have different versions.','一条说法有什么依据，又适用于哪些地区和队伍。':'What supports a claim, and which regions and troupes it applies to.','问小槌：帮我安排参观顺序':'Ask Xiaochui: plan my visit',
    '数字馆藏把一次表演拆成可以相互核对的五类记录，每条记录都能回到具体来源。':'The digital collection breaks a performance into five records that can be cross-checked, each returning to a specific source.','不必按固定顺序参观。你可以从最关心的问题开始。':'There is no fixed order. Begin with the question that interests you most.',
    '定义':'Definition','英歌，是在锣鼓里行进的集体舞蹈。':'Yingge is a collective dance that moves within percussion.','英歌流传于潮汕及粤东部分地区。表演者手持双槌，在锣鼓、槌击和吆喝定下的节拍中，让步法、身法、人物扮演与队形行进同时发生。':'Yingge is practised in Chaoshan and parts of eastern Guangdong. Performers carry paired sticks and let footwork, body technique, role-play, and formations happen within a beat set by drums, strikes, and calls.','它常见于春节、元宵、巡游和地方社区活动。一次英歌既是身体表演，也是队伍协作、地方记忆与公共生活。':'It is common at festivals, processions, and community events. A performance is both embodied practice and troupe coordination, local memory, and public life.',
    '生长的土壤':'The ground where it grows','社区生活':'Community life','节庆、巡游、师承与共同参与':'Festivals, processions, lineage, and participation','一场英歌':'One Yingge performance','不是单个动作，而是多种关系同时发生':'Not one movement, but many relationships happening together','身体技艺':'Embodied technique','重心、步法、身法与槌路':'Centre of gravity, footwork, body technique, and stick paths','声音指挥':'Sound as direction','鼓点、锣钹、槌击与吆喝':'Beats, gongs, cymbals, stick strikes, and calls','空间组织':'Spatial organisation','站位、路线、间距与变阵':'Positions, routes, spacing, and changes','人物装束':'Roles and dress','角色、脸谱、服饰与器物':'Roles, facial patterns, costumes, and objects','地方传承':'Local transmission','社区、队伍、师承与年代':'Community, troupe, lineage, and period','证据来源':'Evidence sources','名录、标准、影像与口述':'Registers, standards, footage, and oral history',
    '把这个问题问小槌':'Ask Xiaochui this question','看一场英歌，先抓住四条线索。':'When watching Yingge, start with four clues.','第一次观看，不必急着记动作名称。先听锣鼓怎样分出轻重和快慢，再看身体如何回应；队伍开始移动时，跟住站位与路线，最后再辨认人物和地方版本。':'On a first viewing, do not rush to memorise movement names. Hear how percussion separates weight and speed, watch the body respond, follow positions and routes as the troupe moves, and identify roles and local versions last.','问小槌：鼓点怎样指挥队伍？':'Ask Xiaochui: how do beats direct the troupe?','慢':'Slow','沉稳，舒展':'Steady and open','稳健，圆活':'Stable and fluid','紧密，灵便':'Tight and agile','节拍之间留有停顿和延展':'Pauses and extension remain between beats','慢中见势，动作有时间展开。':'Slow board reveals force as movement takes time to open.','潮阳英歌公开项目资料记载，慢板所用舞槌通常较长，基本舞法可由三下槌或四下槌组成一组动作。观看时可以留意重心怎样稳定下来，以及一次槌路如何完整走完。':'Public Chaoyang Yingge records note that slow-board sticks are usually longer and that a basic phrase may contain three or four strikes. Watch how the centre settles and a full stick path completes.','先看':'Watch first','停顿、重心与完整槌路':'Pauses, centre of gravity, and complete stick paths','资料范围':'Source scope','潮阳英歌板式分类':'Chaoyang Yingge board-style classification','问小槌：板式差异只在速度吗？':'Ask Xiaochui: are board styles only about speed?',
    '历史与研究':'History and research','谈起源，要先分清证据的分量。':'When discussing origins, first weigh the evidence.','国家名录能确认项目身份与公布时间，项目页面记录了地方叙述，传说和研究观点则提供解释线索。它们各自回答不同问题，不能合成一条没有争议的起源故事。':'National registers confirm project identity and publication dates; project pages record local narratives, while legends and research offer interpretive clues. They answer different questions and cannot be merged into one uncontested origin story.','问小槌：起源说法有什么依据？':'Ask Xiaochui: what supports the origin accounts?','名录可以确认':'The register can confirm','项目资料这样记载':'This is how the project record describes it','国家级非遗项目页面将英歌描述为融合舞蹈、南拳套路和戏曲演技的民间广场舞蹈，并记录了尚武习俗、《水浒传》搬演、傩文化和大鼓子秧歌等不同解释。':'The national project page describes Yingge as a folk square dance combining dance, Southern martial-arts routines, and operatic technique. It records several explanations, including martial custom, Water Margin performance, nuo culture, and drum yangge.','具体结论仍需核对':'Specific conclusions still require checking','这些解释也许分别说明了动作、角色、仪式或传播过程，却不能简单拼成一条唯一的起源线。年代、地名、文献出处和具体队伍口述仍需逐条核对。':'These explanations may illuminate movement, roles, ritual, or transmission, but cannot simply be assembled into one origin line. Dates, place names, citations, and troupe oral accounts still require item-by-item checking.','三条起源线索，加一条当代实践语境':'Three origin clues plus a contemporary practice context','傩文化线索':'Nuo-culture clue','关注仪式语境和驱邪逐疫观念':'Focus on ritual context and ideas of warding off harm','戏曲叙事线索':'Operatic narrative clue','关注梁山故事、人物和表演程式':'Focus on Liangshan stories, roles, and performance conventions','尚武习俗线索':'Martial-custom clue','关注身体技艺和群体训练':'Focus on embodied technique and group training','当代实践语境':'Contemporary practice context','关注巡游、赛会与社区如何持续使用英歌':'Focus on how processions, festivals, and communities keep using Yingge','如何理解：':'How to understand:',
    '岭东英歌队':'Lingdong Yingge Troupe','慢板与醉槌':'Slow board and “Drunken Stick”','河陇英歌队':'Helong Yingge Troupe','快板与旋槌':'Fast board and spinning sticks','龙港女子英歌队':'Longgang women’s Yingge troupe','当代重组与新编':'Contemporary re-formation and new composition','岭东英歌以慢板“醉槌”见长。公开队伍资料描述其步伐沉稳，动作在刚劲与舒展之间转换。这个个案说明，板式差异会落到步法、力道和整组动作的呼吸上。':'Lingdong Yingge is known for the slow-board “Drunken Stick”. Public troupe records describe steady steps and movement shifting between force and openness. The case shows how board-style differences reach footwork, force, and the breathing of a whole phrase.',
    '先从现场照片辨认人物、姿态与装束，再用结构说明理解一场表演中身体、声音和空间怎样彼此配合。':'Start with field photographs to identify roles, posture, and dress, then use the structural notes to see how body, sound, and space work together.','观看入口':'Viewing entry','观看方法':'How to watch','表演结构':'Performance structure','说明边界':'Limits of interpretation','依次观察身体、声音和队员之间的配合，就更容易看懂英歌为什么有力量。':'Following the body, sound, and coordination between performers makes Yingge’s sense of force easier to understand.','问小槌：怎样看懂四层配合':'Ask Xiaochui: how do I read the four layers?','观察下沉、提腿、横移、进退与转身。':'Watch sinking, raised legs, lateral steps, advances, retreats, and turns.','双槌':'Paired sticks','舞槌、旋槌和击槌依赖全身协调。':'Dance sticks, spinning sticks, and strikes rely on whole-body coordination.','节拍':'Beat','鼓点、槌击与吆喝共同建立时间。':'Drums, stick strikes, and calls establish shared time.','每个人的朝向、间距和路线，共同决定整支队伍怎样移动。':'Each performer’s orientation, spacing, and route shape the troupe’s movement.','集合、起鼓、群舞、穿插和收势是一种观察顺序，不是所有队伍共用的节目单。不同队伍会按自己的锣鼓、角色和演出场合组织段落。':'Gathering, starting the drums, ensemble dance, threading, and settling are an order for observation, not a universal programme. Each troupe organises sections through its own percussion, roles, and setting.','集合与起鼓':'Gathering and starting the drums','队伍确认位置后，由鼓点、指挥与队员配合建立速度；具体起势因队伍而异。':'Once positions are set, beats, direction, and performers establish speed; the opening differs by troupe.','双槌群舞':'Paired-stick ensemble','步法、身法和槌法开始跟上锣鼓。':'Footwork, body technique, and stick work begin to follow the percussion.','队形变化':'Formation change','分行、合拢、穿插和回旋的具体方式因队伍而异。':'The exact ways of splitting, joining, threading, and circling differ by troupe.','收势与退出':'Settling and exit','锣鼓、动作和队伍朝向共同完成结束段落，具体收势方式因队伍而异。':'Percussion, movement, and orientation complete the closing section; the exact ending differs by troupe.','继续核对':'Continue checking','查看地方标准的编制说明':'View the local standard’s drafting note','查看潮阳英歌国家级项目页':'View the national Chaoyang Yingge project page',
    '这些称呼在公开资料中很常见，但究竟对应谁，还要看具体队伍自己的说法。':'These names are common in public sources, but the person they identify depends on the troupe’s own account.','通常位于前排或关键位置，负责带领队伍。不同队伍可能对应不同人物。':'Usually at the front or in a key position, leading the troupe. Different troupes may associate the role with different figures.','可能承担领舞或配合任务，不能只凭称呼认定他是哪位人物。':'May lead or support the dance; a name alone cannot establish which figure it represents.','常在队伍中灵活穿行、引路或进行角色表演。不同队伍给他的道具和任务可能不同。':'Often moves through the troupe, guides the route, or performs a role. Props and duties vary by troupe.','持双槌完成动作和队形。有些队伍会说明具体人物，有些则更强调群舞整体。':'Uses paired sticks to complete movements and formations. Some troupes name a specific figure; others emphasise the ensemble.','理解英歌槌、令旗、蛇形道具和头饰时，要把使用者、队伍、板式、年代和演出场合放在一起看。本节图片是概念示意，不作为具体队伍的器物档案。':'Read Yingge sticks, command flags, snake props, and headwear together with their user, troupe, board style, period, and setting. The images here are conceptual, not object records for a specific troupe.','脸谱提供醒目的视觉线索，却不能单独确认人物身份或性格。辨认时还要结合头冠、服装、道具，以及表演者在队伍中的位置与职责。':'Facial patterns offer strong visual clues but cannot alone confirm a person’s identity or character. Also consider headwear, costume, props, and the performer’s position and duty.','在有足够清晰的近景时，可以先看眉、眼、额、鼻、腮的线条组织，再看主色与辅色如何分区。最后仍要结合头饰、服装纹样、队伍职责和队伍自己的资料核实。':'With a clear close-up, read the lines around the brows, eyes, forehead, nose, and cheeks, then the division of main and secondary colours. Finally verify against headwear, costume patterns, troupe duties, and the troupe’s own records.','这是一张现场观察图，不用于确认其中舞者的具体人物身份，也不能把画面中的脸谱当成所有队伍的统一样本。':'This is a field-observation image. It does not identify the dancer shown, nor does it represent one facial-pattern system for every troupe.','常见误区':'Common pitfall','把红、黑、白直接对应固定人物，会忽略村落师承、绘脸者、颜料和当代创新造成的差异。':'Mapping red, black, and white directly to fixed figures overlooks differences created by village lineages, face painters, pigments, and contemporary innovation.',
    '声音、动作和队形可能协同变化，但不是每次声响都对应固定动作。具体对应仍需按队伍、片段和时间码核对，才能判断一次变化由什么信号触发。':'Sound, movement, and formation may change together, but not every sound maps to a fixed movement. Check the troupe, clip, and timecode before deciding which signal triggered a change.','建立速度':'Establish speed','鼓点可能帮助队员感知共同速度，具体进入方式因队伍和段落而异。':'Beats may help performers sense a shared speed; how they enter varies by troupe and section.','强化重音':'Reinforce accents','这些声部可能强化重拍与段落层次，仍需结合现场录音辨认。':'These parts may reinforce downbeats and section layers; field recordings are still needed to identify them.','群体回应':'Group response','槌击、脚步与吆喝可能在重拍处形成群体回应。':'Stick strikes, footsteps, and calls may form a group response on the downbeat.','空间改变':'Change space','只有把声响与变阵前后的画面对齐，才能判断队员是否据此改变方向、间距或路线。':'Only by aligning sound with frames before and after a formation change can we tell whether performers changed direction, spacing, or route in response.','第一遍先感受整体，之后再分别听鼓点、槌击和变阵信号，声音的层次就会慢慢清楚。':'Feel the whole performance first, then listen separately for beats, strikes, and change signals; the layers will become clearer.','只关注鼓点怎样循环、重音落在哪里、节奏何时改变，观察整支队伍怎样跟上同一个节拍。':'Focus on beat cycles, accents, and rhythm changes, and watch how the whole troupe follows one pulse.','把槌击、脚步和吆喝与具体动作对齐，判断声音由谁产生。':'Align strikes, footsteps, and calls with a movement to see who produces the sound.','在变阵前后寻找声音信号，比较方向、间距和路线的改变。':'Look for sound signals before and after a formation change and compare direction, spacing, and route.','不同地区、队伍和场合使用的乐器、节奏、速度和口令并不一样。一支队伍的鼓谱，不能代表所有英歌。本页目前是聆听导览，尚未提供可播放的完整声音档案，因此不把文字说明当成具体鼓谱。':'Instruments, rhythms, speeds, and calls vary by region, troupe, and setting. One troupe’s drum score cannot represent all Yingge. This page is a listening guide, not a playable archive, so its notes are not a specific drum score.',
    '名录能够确认项目名称、申报地区、批次与保护单位，却不能代表一座城市里的所有队伍都采用同一套做法。真正比较地方差异时，还要继续下沉到社区、队伍与年代。':'Registers can confirm a project name, application area, batch, and safeguarding body; they do not mean every troupe in a city uses the same practice. Compare local differences through communities, troupes, and periods.','英歌（普宁英歌）':'Yingge (Puning Yingge)','查看国家级项目页':'View the national project page','英歌（潮阳英歌）':'Yingge (Chaoyang Yingge)','英歌（甲子英歌）':'Yingge (Jiazi Yingge)','选择地图中的地区，比较英歌在不同社区、队伍与年代中的具体差异。':'Select a region on the map to compare Yingge across communities, troupes, and periods.','潮阳、潮南等地都有英歌表演。即使在同一座城市，不同社区和队伍也各有特点。':'Yingge is performed in Chaoyang, Chaonan, and elsewhere. Even within one city, communities and troupes have distinct traits.','继续观察':'Keep observing','“潮阳”在不同历史时期的范围并不完全相同。队伍迁移和跨村授艺也会改变动作与锣鼓。了解一支队伍时，时间和地点要放在一起看。':'“Chaoyang” did not cover exactly the same area in every period. Troupe movement and teaching across villages also change movement and percussion. Read time and place together when studying a troupe.',
    '知识服务正在准备':'Knowledge service is preparing','正在查阅馆内资料':'Checking museum materials','正在查阅资料…':'Checking materials…','连接异常，请稍后再试':'Connection problem; please try again','查看资料来源':'View source','查看地方标准的脸谱说明':'View the local standard’s facial-pattern notes',
    '锣鼓':'Percussion','角色':'Roles','阵形':'Formations','中板':'Medium board','快板':'Fast board',
    '英歌的力量先来自重心下沉和全身协调。脚下的移动、腰胯的转动、上身的开合与双槌路线共同完成一个动作，并不是只靠手臂挥槌。':'Yingge’s force begins with a lowered centre of gravity and whole-body coordination. Footwork, hip rotation, torso opening, and paired-stick paths complete a movement together; it is not just an arm swing.',
    '中国非物质文化遗产网“潮阳英歌”项目页':'China Intangible Cultural Heritage Network — Chaoyang Yingge project page','潮阳英歌项目页':'Chaoyang Yingge project page','普宁英歌项目页':'Puning Yingge project page',
    '许多英歌队借用梁山英雄，但人数、角色、脸谱、道具和领舞设置因队伍而异。辨认角色时，应先看队列位置与功能，再核对脸谱、服饰、道具和队伍资料。':'Many Yingge troupes draw on Liangshan heroes, but headcount, roles, facial patterns, props, and lead-dancer arrangements vary. Identify a role by position and function first, then check facial patterns, costume, props, and troupe records.',
    '问小槌：带我辨认一个角色':'Ask Xiaochui: help me identify a role','指挥':'Conductor','查看地方标准中的队伍结构与职责':'View troupe structure and duties in the local standard',
    '地方标准把潮阳英歌脸谱分为戏面脸谱和鬼面脸谱，并明确提醒：采用戏面脸谱时，通常只有队伍前几位扮演者具有较明确、为人熟悉的英雄身份，其余表演者多不确定具体身份。':'The local standard divides Chaoyang Yingge facial patterns into theatrical and ghost types. It notes that, even with theatrical patterns, only the first few performers usually have clear, familiar hero identities; the rest often cannot be identified with certainty.',
    '借鉴戏剧妆容，以人物特征组织眉、眼、鼻、嘴和脸纹。不同流派与队伍会形成不同图谱。':'Borrowing theatrical make-up, these patterns organise brows, eyes, nose, mouth, and facial lines around character traits. Schools and troupes develop different designs.','多以黑白为主，和戏面系统不是同一套辨认逻辑。理解时仍要回到队伍资料和演出语境。':'Usually centred on black and white, this system follows a different logic from theatrical patterns. Return to troupe records and performance context.','中国驻泰国使馆报道':'Report from the Chinese Embassy in Thailand',
    '通常成对使用，挥动时会画出清晰轨迹，也会形成整齐的声响。不同队伍使用的长度和重量可能不同。':'Usually used in pairs, they draw clear paths and produce a coordinated sound. Length and weight vary by troupe.','令旗、蛇形道具、小铃鼓和兵器只在部分角色或队伍中出现。':'Command flags, snake props, small frame drums, and weapons appear only with some roles or troupes.','头冠、头巾、雉尾和绒球共同影响远距离辨识。':'Crowns, headscarves, pheasant feathers, and tassels shape recognition at a distance.','襟型、袖型、纹样、腰带、护具、绑腿和鞋履，共同构成角色的整体外观。':'Collars, sleeves, patterns, belts, guards, leg wraps, and footwear form the role’s overall appearance.',
    '先看角色在现场做什么，再用脸谱、服饰、道具和队伍资料逐步核对。如果资料不够，就不要急着给出确定答案。':'Watch what a role does in the field, then check facial patterns, costume, props, and troupe records step by step. If the evidence is thin, do not force a definitive answer.','记录前排、中心、边缘、穿行位置，以及是否承担领队或转换任务。':'Record whether the performer is at the front, centre, edge, or moving through the line, and whether they lead or trigger a change.','观察领舞、配合、引路、群舞、指挥或角色表演等实际功能。':'Observe the actual function: leading, supporting, guiding, ensemble work, conducting, or character performance.','核对双槌、令旗、特殊道具、头饰、服装结构和脸谱分区。':'Check paired sticks, flags, special props, headwear, costume structure, and facial-pattern zones.','以具体队伍自己的角色表、口述记录和公开说明为准。':'Use the specific troupe’s role list, oral record, and public explanation as the authority.','最后说明：身份已经确认、可能对应某人，还是目前只能判断他的功能。':'Finally state whether the identity is confirmed, a possible match, or only a functional reading.',
    '查看七种基础队形原始图示与文字定义':'View the original diagrams and definitions of the seven basic formations','问小槌：带我读懂一次变阵':'Ask Xiaochui: help me read a formation change','观察纵横间距、内外圈层和各组之间的对称关系。':'Observe horizontal and vertical spacing, inner and outer layers, and symmetry between groups.','观察队伍在分行、合拢、穿插和回旋时采用的移动路径。':'Observe the routes used as the troupe splits, joins, threads, and circles.','把转向或分合发生的时刻与鼓点、指挥和相邻队员的动作放在一起看。':'Read the moment of a turn, split, or join alongside beats, direction, and neighbouring movements.',
    '问小槌：带我听懂声音层次':'Ask Xiaochui: help me hear the sound layers','查看乐器、指挥职责与板式分类':'View instruments, conductor duties, and board-style categories','河陇队资料':'Helong troupe records','龙港女子队资料':'Longgang women’s troupe records','第一批国家级非遗名录':'First national intangible-heritage list',
    '这句话可以被确认，但不是因为它听起来熟悉。它需要一条完整证据链。':'This sentence can be confirmed, but not because it sounds familiar. It needs a complete chain of evidence.','可靠知识必须回答四件事：谁发布、说的是哪里、记录于何时、能否被另一份材料核对。':'Reliable knowledge must answer four questions: who published it, where it applies, when it was recorded, and whether another source can cross-check it.','现在只有一句话，还不知道它来自哪里。':'For now there is only a sentence; its origin is unknown.','先找最接近原始发布的可靠来源，转载页面只作为线索。':'Find the reliable source closest to the original publication; reposts are clues only.','本条材料':'This record','中国非物质文化遗产网，国家级非物质文化遗产代表性项目名录':'China Intangible Cultural Heritage Network, Representative National Intangible Cultural Heritage Projects','核查状态：来源已标明':'Verification status: source identified','不同地区和队伍的英歌并不完全一样。项目名称、申报地区和具体队伍需要分开来看。':'Yingge differs across regions and troupes. Project name, application area, and specific troupe must be kept separate.','适用范围':'Scope','广东省汕头市潮阳区，潮阳英歌项目':'Chaoyang District, Shantou, Guangdong — Chaoyang Yingge project','核查状态：地区已限定':'Verification status: region limited','同一地区的称呼、队伍和表演方式会随时间变化。有了日期，才能知道材料说明的是哪个时期。':'Names, troupes, and practices in one region change over time. A date tells us which period the material describes.','时间字段':'Time field','核查状态：年代已限定':'Verification status: period limited','再把项目详情与国务院公布的名录相互核对。两份材料能够对应，这条结论就不只依赖一个网页的转述。':'Cross-check the project detail against the list published by the State Council. When the two records match, the conclusion does not rely on one webpage’s retelling.','交叉核对':'Cross-check','项目详情页与第一批国家级非物质文化遗产名录':'Project detail page and the first national intangible-heritage list','核查状态：可确认':'Verification status: confirmed','正式资料适合确认公共事实，队伍材料解释具体做法，田野记录保留现场经验。关键不是给资料排高低，而是用对资料。':'Formal sources confirm public facts, troupe materials explain practice, and field records preserve lived experience. The point is not to rank sources but to use the right one.','名录、标准、政府公开资料':'Registers, standards, and public government sources','队伍档案与连续影像':'Troupe archives and continuous footage','访谈、观察与口述记录':'Interviews, observation, and oral records','名录、标准和政府公开资料适合确认项目名称、保护单位、发布日期与制度信息。它们仍不能替代具体队伍的现场做法。':'Registers, standards, and public records can confirm project names, safeguarding bodies, publication dates, and institutional facts. They cannot replace a specific troupe’s field practice.','把缺少的地区、队伍、年代和来源补上，再看看这句话能不能成立。':'Add the missing region, troupe, period, and source, then see whether the sentence still holds.','“英歌脸谱颜色能直接对应固定人物。”':'“Yingge facial-pattern colours directly identify fixed characters.”','这句话说得太绝对了。脸谱颜色只是线索，还要结合线条结构、头饰、服装、道具、队列位置和具体队伍资料。':'This is too absolute. Colour is only a clue; also consider line structure, headwear, costume, props, position, and troupe records.','地区':'Region','潮阳、普宁、惠来或其他地方':'Chaoyang, Puning, Huilai, or another place','队伍':'Troupe','具体村社或传承队伍':'Specific village or transmission troupe','年代':'Period','材料记录和使用的时间':'When the material was recorded and used','原始材料':'Original material','连续影像、访谈或队伍档案':'Continuous footage, interviews, or troupe archives','只看一句流传说法，没有地区、队伍、年代和原始材料。':'A circulating sentence with no region, troupe, period, or original material.','审核不是把所有分歧抹平，而是让观众知道我们确认了什么，还有什么不能确认。':'Review does not erase disagreement; it shows visitors what is confirmed and what is not.','从“英歌脸谱都代表谁”改为“某支队伍在某个年代如何称呼这个角色”。问题越具体，越容易找到对应的证据。':'Change “Who do Yingge facial patterns all represent?” to “How did one troupe name this role in a given period?” The more specific the question, the easier it is to find matching evidence.','记录标题、发布主体、日期、链接、视频时间码和授权方式，不只保存一段脱离上下文的摘录。':'Record the title, publisher, date, link, video timecode, and rights basis—not a context-free excerpt.','不同材料不一致时分别呈现。资料不足就标记待核实，不补出一个看似完整的答案。':'Show conflicting materials separately. Mark insufficient evidence for review instead of filling the gap with a neat answer.','在结论旁说明适用的地区、队伍和年代，让观众可以回到原始材料继续判断。':'State the applicable region, troupe, and period beside each conclusion so visitors can return to the original material.','项目类别':'Project category','传统舞蹈':'Traditional dance','来源一':'Source 1','来源二':'Source 2','文化和旅游部公布的第一批国家级非物质文化遗产名录':'First national intangible-heritage list published by the Ministry of Culture and Tourism','审核状态':'Review status','可以确认入选名录一事，但不能据此直接说明某支队伍的角色、动作或队形。':'Entry on the list can be confirmed, but it cannot directly establish a specific troupe’s roles, movements, or formations.','带着证据，继续认识英歌':'Keep learning Yingge with evidence','去地域展厅，看看各地英歌有哪些不同':'Visit the regional gallery to compare local Yingge','进入游地域 →':'Explore regions →','向英歌小槌追问来源':'Ask Xiaochui about sources','打开智能导览 →':'Open the intelligent guide →','本页重点：结论如何被核查':'This page: how conclusions are checked','我会区分正式资料、队伍记录与民间叙述。':'I distinguish formal sources, troupe records, and folk accounts.'
  });
  const pageGuides={
    'index.html':{topic:'Overview',hint:'Ask me whenever a movement, role, or local difference is unclear.'},'content.html':{topic:'Visitor paths',hint:'If you are not sure where to start, I can guide you by interest.'},'learn.html':{topic:'Learn Yingge',hint:'Keep asking about origins, rhythms, and local differences.'},'watch.html':{topic:'How to watch',hint:'I can guide you from the whole formation to one movement.'},'characters.html':{topic:'Roles & costumes',hint:'Facial patterns are not a simple colour chart; I will explain the limits.'},'formation.html':{topic:'Formation demo',hint:'After viewing a formation, ask why the troupe moves that way.'},'sound.html':{topic:'Drums & rhythm',hint:'I can help you hear the layers from beat to stick strike and call.'},'regions.html':{topic:'Local variations',hint:'Choose a region, then compare communities, troupes, and periods.'},'archive.html':{topic:'Archives & evidence',hint:'I distinguish formal sources, troupe records, and oral accounts.'}
  };
  const guidePrompts={
    'index.html':[['What is Yingge in one sentence?','What is Yingge?'],['What should I watch first?','Where should I start?'],['Why do performers carry two sticks?','Why two sticks?']],
    'content.html':[['What order should I follow for a quick introduction?','How should I explore?'],['What are the key things to learn?','What are the key points?'],['Where can I start with Yingge origins?','Start with origins']],
    'learn.html':[['What accounts of Yingge origins exist?','What are the origin accounts?'],['How do slow, medium, and fast boards differ?','How do the rhythms differ?'],['Which points have documentary support?','How strong is the evidence?']],
    'watch.html':[['What should I watch first in a Yingge performance?','What should I watch first?'],['How can I read coordination between performers?','How do I read coordination?'],['How do stick strikes relate to the drums?','How does sound coordinate?']],
    'characters.html':[['What do the head striker and second striker do?','Head and second striker'],['Can colour alone identify a role?','How do I read facial patterns?'],['What do sticks, headwear, and costumes do?','What do costumes do?']],
    'formation.html':[['How does the wheat-ear formation take shape?','Wheat-ear formation'],['Why do Yingge formations change?','Why do formations change?'],['How do drumbeats guide a transition?','How is the change signalled?']],
    'sound.html':[['What do the drumbeats do in a performance?','What does the beat do?'],['How do stick strikes work with the drums?','How does sound coordinate?'],['How do fast and slow boards sound different?','How do fast and slow differ?']],
    'regions.html':[['How do Chaoyang and Puning Yingge differ?','Chaoyang and Puning'],['Why do troupes look different?','Why is each troupe different?'],['What should I watch for when comparing regions?','How do I avoid confusion?']],
    'archive.html':[['Which sources are more reliable for Yingge origins?','How do I judge a source?'],['Is the Liangshan-heroes account supported by evidence?','Is the Liangshan account reliable?'],['How should I cite museum materials?','How do I cite a source?']]
  };
  const navByHref={
    'index.html':'Home','content.html':'Collections','learn.html':'Learn Yingge','spread.html':'Yingge abroad','framework-museum.html':'Themed gallery',
    'https://5.mgd5.com/c/oiru/8vtt/index.html':'Yingge Journey','index.html#experiences':'Digital exhibits','index.html#collections':'Collection archive','watch.html':'Watch Yingge','characters.html':'Meet the roles','formation.html':'Practice formations','sound.html':'Hear the drums','regions.html':'Explore regions','archive.html':'Browse archives'
  };
  const exhibitByHref={formation:'Formations & positions',characters:'Roles & objects',watch:'Sound & moving images',regions:'Regions & troupes',archive:'Documentary research'};
  const mobileExhibitByHref={formation:'Practice formations',characters:'Meet the roles',watch:'Watch Yingge',sound:'Hear the drums',regions:'Explore regions',archive:'Browse archives'};
  const localizeNode=(node,en,zh)=>{
    if(!node)return;
    if(!node.dataset.localeZh)node.dataset.localeZh=zh??node.textContent.trim();
    node.textContent=locale==='en'?en:node.dataset.localeZh;
  };
  const localizeAttr=(node,attr,en)=>{
    if(!node)return;
    const key='locale'+attr.replace(/[^a-z0-9]/gi,'_');
    if(!node.dataset[key])node.dataset[key]=node.getAttribute(attr)||'';
    if(locale==='en')node.setAttribute(attr,en);else node.setAttribute(attr,node.dataset[key]);
  };
  const localizeExactLeaves=()=>{
    document.querySelectorAll('body *:not(script):not(style)').forEach(node=>{
      if(node.children.length) return;
      const zh=node.dataset.localeZh||node.textContent.trim();
      const en=copy[zh];
      if(!en)return;
      if(!node.dataset.localeZh)node.dataset.localeZh=zh;
      node.textContent=locale==='en'?en:node.dataset.localeZh;
    });
    window.addEventListener('offline',()=>voiceStatus('网络连接已中断，将优先尝试本地语音服务'));
    window.addEventListener('online',()=>voiceStatus(wakeState==='off'?'网络已恢复':'网络已恢复，语音监听继续'));
  };
  pageGuides['formation.html'].topic='Formation exploration';
  Object.assign(copy,{
    '影像提供：':'Footage provided by:',
    '项目组，记录小槌传英歌的现场片段。':'the project team, capturing Xiaochui’s field trail through Yingge.',
    '页面先呈现核心信息，你也可以继续了解关联队伍、人物、地点、视频时间码和审核记录。':'The page starts with the essentials; you can also explore related troupes, people, places, video timecodes, and review notes.',
    '还要限定问题、比较来源、记录分歧，并把结论边界写清楚。':'Define the question, compare sources, record disagreements, and state the limits of each conclusion.'
  });
  const localizeAttributes=()=>{
    const fallback={
      '博物馆开场':'Museum opening','英歌舞数字博物馆馆徽动画':'Yingge Dance Digital Museum crest animation',
      '数字博物馆导航':'Digital museum navigation','主要导航':'Main navigation','在线展馆':'Online exhibits',
      '英歌小槌导览':'Yingge Xiaochui guide','打开英歌小槌导览':'Open Yingge Xiaochui guide','关闭英歌小槌导览':'Close Yingge Xiaochui guide',
      '关闭来源详情':'Close source details','英歌观看导览概念示意':'Concept image for the Yingge viewing guide','英歌观看结构概念示意':'Concept image for reading a Yingge performance',
      '英歌队形空间关系三维抽象演示':'Abstract 3D demonstration of Yingge formation relationships','收起提示':'Dismiss tip','语音功能':'Voice features',
      '英歌舞首页开场视频':'Yingge Dance Museum opening film','英歌数字展陈画面':'Digital Yingge exhibition scene','英歌舞数字展陈画面':'Digital Yingge exhibition scene','英歌由身体、双槌、锣鼓、角色和阵形共同构成':'Yingge is formed by bodies, paired sticks, drums, roles, and formations',
      '英歌槌、锣鼓、头饰与阵形构成的导览画面':'Guide scene with Yingge sticks, drums, headwear, and formations','推荐问题':'Suggested questions','与英歌小槌对话':'Chat with Yingge Xiaochui','例如：英歌为什么要持双槌？':'For example: Why do performers carry two sticks?',
      '动作与阵法数字档案':'Digital archive of movements and formations','角色、脸谱与器物档案':'Archive of roles, facial patterns, and objects','锣鼓声音知识展厅':'Sound and drum knowledge gallery','认识英歌内容导航':'Learn Yingge contents navigation','英歌知识关系树':'Yingge knowledge graph','切换潮阳英歌板式':'Switch Chaoyang Yingge board style','选择起源线索':'Choose an origin thread','切换英歌队伍个案':'Switch troupe case study',
      '用于说明慢板观察方法的概念示意，不是岭东队现场档案':'Concept image for observing slow-board movement; not a Lingdong troupe field archive','英歌锣鼓与双槌节奏视觉':'Visual of Yingge drums and paired-stick rhythm','英歌地区资料索引概念示意':'Concept image for the Yingge regional index','本页内容':'On this page','2024 年曼谷共同表演现场的两位英歌舞者':'Two Yingge performers at a joint Bangkok performance in 2024','声音、身体与空间三条观察线的概念示意，不是现场表演记录':'Concept image of three observation lines—sound, body, and space; not a field performance record','2024 年曼谷共同表演现场的英歌舞者近景':'Close view of Yingge performers at a joint Bangkok performance in 2024','英歌槌、头饰与服装概念示意':'Concept image of Yingge sticks, headwear, and costumes','七种基础队形的空间关系':'Spatial relationships of seven basic formations','英歌相关地区中国交互地图':'Interactive map of China regions related to Yingge','查看汕头英歌资料':'View Shantou Yingge records','查看汕尾英歌资料':'View Shanwei Yingge records','查看潮州英歌资料':'View Chaozhou Yingge records','查看揭阳英歌资料':'View Jieyang Yingge records','缩小地球':'Zoom out the globe','放大地球':'Zoom in the globe','选择英歌相关地区':'Choose a Yingge-related region'
    };
    const attrNames=['aria-label','title','alt','placeholder'];
    document.querySelectorAll('body *:not(script):not(style)').forEach(node=>{
      attrNames.forEach(attr=>{
        const key='locale'+attr.replace(/[^a-z0-9]/gi,'_');
        const zh=node.dataset[key]||node.getAttribute(attr)||'';
        const en=copy[zh]||fallback[zh];
        if(!en)return;
        if(!node.dataset[key])node.dataset[key]=zh;
        node.setAttribute(attr,locale==='en'?en:node.dataset[key]);
      });
    });
  };
  const refreshChrome=()=>{
    const header=document.querySelector('.site-header');
    if(!header)return;
    const brand=header.querySelector('.brand strong');
    if(brand){if(!brand.dataset.localeZhHtml)brand.dataset.localeZhHtml=brand.innerHTML;brand.innerHTML=locale==='en'?'Yingge Dance Digital Museum':brand.dataset.localeZhHtml;brand.setAttribute('aria-label',locale==='en'?'Yingge Dance Digital Museum':'英歌舞数字博物馆')}
    header.querySelectorAll('nav a').forEach(link=>{const href=link.getAttribute('href')||'';let label=navByHref[href];if(!label&&href.endsWith('.html'))label=navByHref[href.split('/').pop()];if(label&&!link.querySelector('strong'))localizeNode(link,label,link.dataset.localeZh||link.textContent.trim())});
    header.querySelectorAll('.museum-menu summary').forEach(node=>localizeNode(node,'Online exhibits','在线展馆'));
    header.querySelectorAll('.museum-menu-panel a').forEach(link=>{const key=(link.getAttribute('href')||'').split('.')[0];const label=exhibitByHref[key];const strong=link.querySelector('strong');if(label&&strong)localizeNode(strong,label,strong.dataset.localeZh||strong.textContent.trim())});
    const mobile=document.querySelector('#mobileMuseumNav');
    if(mobile){localizeNode(mobile.querySelector('.mobile-nav-heading strong'),'Yingge Dance Digital Museum','英歌舞数字博物馆');localizeNode(mobile.querySelector('.mobile-nav-section span'),'Online exhibits','在线展馆');mobile.querySelectorAll('.mobile-nav-links a').forEach(link=>{const label=navByHref[link.getAttribute('href')||''];if(label)localizeNode(link,label,link.dataset.localeZh||link.textContent.trim())});mobile.querySelectorAll('.mobile-nav-exhibits a').forEach(link=>{const key=(link.getAttribute('href')||'').split('.')[0];const label=mobileExhibitByHref[key];const strong=link.querySelector('strong');if(label&&strong)localizeNode(strong,label,strong.dataset.localeZh||strong.textContent.trim())});localizeNode(mobile.querySelector('.mobile-nav-guide'),'Ask Xiaochui','问小槌');localizeNode(mobile.querySelector('.mobile-nav-close'),'Close','关闭')}
    const menuToggle=document.querySelector('#mobileMenuToggle');if(menuToggle){const expanded=menuToggle.getAttribute('aria-expanded')==='true';localizeNode(menuToggle.querySelector('.mobile-menu-label'),'Menu','菜单');localizeAttr(menuToggle,'aria-label',locale==='en'?(expanded?'Close site navigation':'Open site navigation'):(expanded?'关闭网站导航':'打开网站导航'))}
  };
  const refreshGuide=()=>{
    const data=pageGuides[pageFile]||pageGuides['index.html'];
    const guide=document.querySelector('#guidePanel');
    if(!guide)return;
    localizeNode(guide.querySelector('.guide-close'),'Close','关闭');localizeNode(guide.querySelector('.guide-head h2'),'Yingge Xiaochui','英歌小槌');
    const context=guide.querySelector('.guide-context');if(context)localizeNode(context,'Exploring with you: '+data.topic,'正在陪你参观：'+(guideContext?.topic||'总览'));
    const welcome=guide.querySelector('.agent-welcome');if(welcome){localizeNode(welcome.querySelector('strong'),'Hello, I’m Yingge Xiaochui.','你好，我是英歌小槌。');localizeNode(welcome.querySelector('p'),data.hint+' I will note sources and scope whenever possible.','我会依据馆内资料回答，并标明来源与适用范围。')}
    const prompts=guidePrompts[pageFile]||guidePrompts['index.html'];guide.querySelectorAll('.guide-prompts button').forEach((button,index)=>{const pair=prompts[index];if(!pair)return;const zh=button.dataset.localeZh||button.textContent.trim();if(!button.dataset.localeZh)button.dataset.localeZh=zh;button.dataset.agentQuestion=locale==='en'?pair[0]:button.dataset.agentQuestion||zh;button.textContent=locale==='en'?pair[1]:button.dataset.localeZh});
    localizeNode(guide.querySelector('#agentForm label'),'Ask a question','输入问题');localizeAttr(guide.querySelector('#question'),'placeholder','Ask a question about Yingge');localizeNode(guide.querySelector('#agentForm button[type="submit"]'),'Send','发送');localizeNode(guide.querySelector('.agent-note'),'Answers come from the project knowledge base and state boundaries for regions, troupes, and periods.','回答来自项目知识库，涉及地区、队伍和年代时会说明边界。');localizeNode(guide.querySelector('.guide-reset'),'Clear conversation','清空对话');
    guide.querySelectorAll('[data-voice-label]').forEach(node=>{const zh=node.dataset.localeZh||node.textContent.trim();if(!node.dataset.localeZh)node.dataset.localeZh=zh;const en=copy[zh];if(en)node.textContent=locale==='en'?en:node.dataset.localeZh});
    guide.querySelectorAll('.agent-thinking-state strong,.agent-thinking-step').forEach(node=>{const zh=node.dataset.localeZh||node.textContent.trim();if(!node.dataset.localeZh)node.dataset.localeZh=zh;const en=copy[zh];if(en)node.textContent=locale==='en'?en:node.dataset.localeZh});
  };
  const apply=next=>{
    locale=next==='en'?'en':'zh';
    try{localStorage.setItem(storageKey,locale)}catch{}
    document.documentElement.lang=locale==='en'?'en':'zh-CN';document.documentElement.dataset.locale=locale;
    const title=pageTitles[pageFile]||pageTitles['index.html'];document.title=title[locale==='en'?1:0];
    localizeExactLeaves();
    localizeAttributes();
    refreshChrome();
    refreshGuide();
    document.querySelectorAll('.locale-toggle,.mobile-nav-locale').forEach(button=>{button.textContent=locale==='en'?'中文':'EN';button.setAttribute('aria-label',locale==='en'?'切换到中文':'Switch to English');button.setAttribute('title',locale==='en'?'切换到中文':'Switch to English')});
    document.querySelectorAll('[data-locale-en]').forEach(node=>{const en=node.dataset.localeEn;localizeNode(node,en,node.dataset.localeZh||node.textContent.trim())});
  };
  const addToggle=()=>{
    const header=document.querySelector('.site-header');if(!header)return;
    if(!header.querySelector('.locale-toggle')){const button=document.createElement('button');button.type='button';button.className='locale-toggle button button-glass';button.addEventListener('click',()=>apply(locale==='en'?'zh':'en'));header.appendChild(button)}
    const panel=document.querySelector('#mobileMuseumNav');if(panel&&!panel.querySelector('.mobile-nav-locale')){const button=document.createElement('button');button.type='button';button.className='mobile-nav-locale button button-glass';button.addEventListener('click',()=>apply(locale==='en'?'zh':'en'));panel.appendChild(button)}
  };
  window.yinggeLocale={get locale(){return locale},get isEnglish(){return locale==='en'},translate:text=>locale==='en'?(copy[String(text)]||String(text)):String(text),copy};
  window.__yinggeLocaleRefresh=()=>{addToggle();apply(locale)};
  addToggle();apply(locale);
})();

// Public-site ICP filing displayed consistently across museum pages.
(()=>{
  if(document.querySelector('.site-icp-footer'))return;
  const footer=document.createElement('footer');
  footer.className='site-icp-footer';
  footer.setAttribute('aria-label','网站备案信息');
  footer.innerHTML='<span>© 2026 英歌舞数字博物馆</span><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">粤ICP备2026130280号-2</a>';
  const style=document.createElement('style');
  style.textContent='.site-icp-footer{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px 18px;min-height:56px;padding:15px 20px;background:#0f1713;color:rgba(255,255,255,.68);font-size:12px;line-height:1.6;text-align:center;border-top:1px solid rgba(255,255,255,.1)}.site-icp-footer a{color:rgba(255,255,255,.82);text-decoration:none}.site-icp-footer a:hover,.site-icp-footer a:focus{color:#fff;text-decoration:underline}@media(max-width:560px){.site-icp-footer{min-height:66px;gap:2px 12px;padding:13px 16px}.site-icp-footer span,.site-icp-footer a{width:100%}}';
  document.head.appendChild(style);
  document.body.appendChild(footer);
})();
