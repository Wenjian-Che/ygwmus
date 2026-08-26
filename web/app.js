const frontierStyles=document.createElement('link');frontierStyles.rel='stylesheet';frontierStyles.href='frontier.css';document.head.appendChild(frontierStyles);
const ADMIN_CONTENT_API='http://127.0.0.1:8787/api/site-content';
const homeLearning=`<section class="learning-section museum-section" id="what-is-yingge"><div class="learning-intro"><p class="section-kicker">先回答一个问题</p><h2>英歌，究竟是什么？</h2><p>英歌是流传于潮汕等地的民间广场舞蹈。国家级非物质文化遗产名录将它归入传统舞蹈。一次表演不是静态图案，而是身体、英歌槌、锣鼓、队形和角色共同完成的集体行动。</p><p class="source-note">事实层参考<a href="https://www.ihchina.cn/project_details/12902.html" target="_blank" rel="noreferrer">中国非物质文化遗产网</a>与<a href="https://www.stpt.edu.cn/yinggewu/ygwlsbjzl/list.htm" target="_blank" rel="noreferrer">汕头市英歌数字艺术馆</a>。不同地区和队伍仍有差异。</p></div><div class="definition-stage"><div class="definition-orbit" aria-hidden="true"></div><div class="definition-core">英歌<small>集体表演</small></div><div class="definition-lenses"><button class="definition-lens is-active" type="button" data-lens="body"><strong>身体</strong><small>跳、转、落</small></button><button class="definition-lens" type="button" data-lens="sound"><strong>声音</strong><small>鼓、锣钹、吆喝</small></button><button class="definition-lens" type="button" data-lens="space"><strong>空间</strong><small>站位与变阵</small></button><button class="definition-lens" type="button" data-lens="role"><strong>角色</strong><small>功能与叙事</small></button></div><div class="definition-readout"><strong id="definitionReadoutTitle">身体</strong><p id="definitionReadoutText">先看重心、步法和槌路，英歌的力量从身体传到队伍。</p></div></div></section><section class="origin-section museum-section" id="origin"><div class="origin-heading"><p class="section-kicker">历史与研究</p><h2>起源不是一个答案</h2><p>关于英歌由来，公开资料保留了多种解释。它更像是在傩仪、戏曲故事、民间习武和地方节庆的长期交汇中形成，而不是由一个瞬间、一个人物或一个地点单独创造。</p></div><div class="origin-timeline"><div class="origin-line" aria-hidden="true"></div><article class="origin-node"><span>可考线索</span><h3>明代中期以后</h3><p>地方志与研究资料提供了英歌在潮汕民间活动中逐渐成形的历史线索，具体年代仍要注明来源。</p></article><article class="origin-node"><span>流传与演变</span><h3>仪式、故事与武艺</h3><p>傩舞说、戏曲说、练武习艺说等假说解释了不同侧面，不能互相替代，也不能写成唯一结论。</p></article><article class="origin-node"><span>当代传承</span><h3>进入名录与校园</h3><p>2006年英歌相关项目进入首批国家级非物质文化遗产代表性项目名录，今天也在校园和跨地区交流中继续变化。</p></article></div><div class="origin-hypotheses"><button class="origin-hypothesis is-active" type="button" data-origin="ritual"><strong>傩舞说</strong><span>强调驱邪逐疫与仪式性动作的延续</span></button><button class="origin-hypothesis" type="button" data-origin="opera"><strong>戏曲说</strong><span>关联《梁山泊攻打大名府》等民间演剧叙事</span></button><button class="origin-hypothesis" type="button" data-origin="martial"><strong>练武习艺说</strong><span>从地方尚武习俗与群体训练解释其力量感</span></button><button class="origin-hypothesis" type="button" data-origin="festival"><strong>节庆演变说</strong><span>关注游神、赛会和社区生活中的持续改造</span></button></div><div class="origin-detail" id="originDetail"><strong>如何理解：</strong>这是一组研究假说，不是已经被单一证据完全证明的起源结论。进入具体地区和队伍档案时，我们会说明采用了哪一种来源。</div></section><section class="performance-section museum-section" id="how-yingge-works"><div class="performance-heading"><p class="section-kicker">观看方法</p><h2>一场英歌，怎样把几十个人变成一个节拍？</h2><p>不要只看挥槌的瞬间。先听共同时间，再看身体如何回应，最后观察队伍怎样改变空间，这样才能从热闹进入结构。</p></div><div class="performance-sequence"><article class="performance-step"><span>听见</span><h3>鼓点建立共同时间</h3><p>鼓、锣钹和吆喝给出速度、重音与段落信号。</p></article><article class="performance-step"><span>看见</span><h3>身体把信号变成动作</h3><p>步法、身法和槌路把节奏传到每一个人。</p></article><article class="performance-step"><span>跟随</span><h3>队形把动作变成空间</h3><p>分行、合拢、穿插和回旋让集体关系可见。</p></article><article class="performance-step"><span>核对</span><h3>档案说明它属于谁</h3><p>地区、队伍、板式和年代决定这次表演的具体含义。</p></article></div></section>`;
/* Keep the home page focused on the three entry experiences. The learning layer belongs to the collection overview. */
if(document.querySelector('#coreExhibits')&&!document.querySelector('#what-is-yingge'))document.querySelector('#coreExhibits').insertAdjacentHTML('beforebegin',homeLearning.replace('2006年英歌相关项目','2006年，潮阳英歌'));
if(document.querySelector('#coreExhibits')&&!document.querySelector('.museum-subnav'))document.querySelector('.museum-hero')?.insertAdjacentHTML('afterend','<nav class="museum-subnav glass" aria-label="馆藏总览分区"><a href="#what-is-yingge">英歌是什么</a><a href="#origin">起源与流变</a><a href="#how-yingge-works">观看方法</a><a href="#coreExhibits">三件核心展项</a><a href="#collectionLogic">馆藏结构</a></nav>');
document.querySelector('#how-yingge-works .performance-heading')?.insertAdjacentHTML('beforeend','<p class="museum-method-note"><strong>本馆方法</strong> 同一件内容同时保留现场感、结构解释与证据边界，让你看得见、听得懂，也知道这句话依据什么。</p>');
document.querySelector('.museum-menu summary')?.replaceChildren(document.createTextNode('在线展馆'));
const applyManagedContent=(content={})=>{
  const set=(selector,value)=>{const node=document.querySelector(selector);if(node&&typeof value==='string'&&value.trim())node.textContent=value};
  set('.hero-label',content.hero?.eyebrow);set('.hero h1 span:nth-child(1)',content.hero?.titleLine1);set('.hero h1 span:nth-child(2)',content.hero?.titleLine2);set('.hero-body',content.hero?.body);set('.hero-actions .button-primary',content.hero?.primaryCta);set('#experiences .section-title h2',content.experiences?.title);set('#experiences .section-title p',content.experiences?.intro);
  const cards=content.experiences?.cards||{};set('.experience-main h3',cards.video?.title);set('.experience-main p',cards.video?.description);set('.experience-h5 h3',cards.h5?.title);set('.experience-h5 p',cards.h5?.description);set('.experience-guide h3',cards.agent?.title);set('.experience-guide p',cards.agent?.description);
};
try{const cached=JSON.parse(localStorage.getItem('yingge-site-content')||'null');if(cached)applyManagedContent(cached)}catch{}
fetch(ADMIN_CONTENT_API).then(response=>response.ok?response.json():null).then(content=>{if(content){applyManagedContent(content);localStorage.setItem('yingge-site-content',JSON.stringify(content))}}).catch(()=>{});
gsap.registerPlugin(ScrollTrigger);
const opening=document.querySelector('#opening'),openingLogo=document.querySelector('.opening-logo'),navLogo=document.querySelector('#navLogo'),guide=document.querySelector('#guidePanel');
function revealPage(){document.body.classList.add('page-ready');if(opening)opening.classList.add('is-done')}
if(opening){
  let openingTimers=[];
  const clearOpeningTimers=()=>{openingTimers.forEach(clearTimeout);openingTimers=[]};
  const finishOpening=()=>{clearOpeningTimers();document.body.classList.add('page-ready','logo-docked');opening.classList.add('is-done');opening.classList.remove('is-docking');openingLogo.getAnimations().forEach(a=>{if(a.id==='dock')a.cancel()})};
  const dockOpening=()=>{requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const from=openingLogo.getBoundingClientRect(),to=navLogo.getBoundingClientRect(),dx=to.left+to.width/2-(from.left+from.width/2),dy=to.top+to.height/2-(from.top+from.height/2),scale=to.width/from.width;
    opening.classList.add('is-docking');
    const dock=openingLogo.animate([{transform:'translate3d(0,0,0) scale(1)',filter:'drop-shadow(0 18px 24px rgba(39,48,52,.14))'},{transform:'translate3d('+dx+'px,'+dy+'px,0) scale('+scale+')',filter:'drop-shadow(0 0 0 rgba(39,48,52,0))'}],{duration:860,easing:'cubic-bezier(.3,.72,.18,1)',fill:'forwards'});
    dock.id='dock';openingTimers.push(setTimeout(()=>document.body.classList.add('logo-docked'),700));dock.onfinish=()=>openingTimers.push(setTimeout(()=>{document.body.classList.add('page-ready');opening.classList.add('is-done')},120));
  }))};
  openingTimers.push(setTimeout(dockOpening,2300));
  document.querySelector('#openingSkip').addEventListener('click',finishOpening);
}else{document.body.classList.add('page-ready')}
const mm=gsap.matchMedia();mm.add({desktop:'(min-width:901px)',reduce:'(prefers-reduced-motion:reduce)'},ctx=>{if(ctx.conditions.reduce)return;const heroTl=gsap.timeline({delay:opening?3.1:.15,defaults:{ease:'power3.out'}});heroTl.from('.hero-label',{autoAlpha:0,y:16,duration:.5}).from('.hero h1 span',{yPercent:110,stagger:.09,duration:.78},'<.05').from('.hero-body',{autoAlpha:0,y:22,duration:.55},'<.2').from('.hero-actions .button',{autoAlpha:0,y:16,stagger:.08,duration:.45},'<.12');gsap.to('.hero-image img',{scale:1.1,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});gsap.from('.experience-main',{clipPath:'inset(0 100% 0 0)',duration:1.05,ease:'power3.inOut',scrollTrigger:{trigger:'.experience-layout',start:'top 76%',once:true}});gsap.from('.experience-h5,.experience-guide',{autoAlpha:0,x:45,stagger:.12,duration:.7,ease:'power3.out',scrollTrigger:{trigger:'.experience-layout',start:'top 68%',once:true}});gsap.from('.collection-mosaic>a',{autoAlpha:0,y:36,stagger:{amount:.34,from:'start'},duration:.65,ease:'power3.out',scrollTrigger:{trigger:'.collection-mosaic',start:'top 78%',once:true}});});

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
  sound:{title:'声音',text:'鼓、锣钹和吆喝给出共同时间，让动作在同一拍点发生。'},
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
  festival:'节庆演变说关注游神、赛会和社区生活中的持续改造，说明英歌会在不同地方和时代不断长出新形式。'
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
document.querySelectorAll('[data-guide-open]').forEach(b=>b.addEventListener('click',()=>{guide.classList.add('is-open');guide.setAttribute('aria-hidden','false');gsap.to(guide,{y:0,autoAlpha:1,duration:.42,ease:'power3.out'})}));if(guide){document.querySelector('.guide-close').addEventListener('click',()=>gsap.to(guide,{y:'110%',autoAlpha:0,duration:.28,ease:'power2.in',onComplete:()=>{guide.classList.remove('is-open');guide.setAttribute('aria-hidden','true')}}));}
if(guide){
  const agentApi='http://127.0.0.1:8787/api/agent';
  const agentForm=document.querySelector('#agentForm');
  const agentInput=document.querySelector('#question');
  const agentMessages=document.querySelector('#agentMessages');
  const agentStatus=document.querySelector('#agentStatus');
  const agentStatusDot=document.querySelector('.agent-status-dot');
  const agentSubmit=agentForm.querySelector('button[type="submit"]');
  const conversationId=sessionStorage.getItem('yingge-conversation-id')||crypto.randomUUID();
  sessionStorage.setItem('yingge-conversation-id',conversationId);
  const history=[];
  const setAgentStatus=(text,state='')=>{agentStatus.textContent=text;agentStatusDot.className='agent-status-dot'+(state?' is-'+state:'')};
  const scrollAgent=()=>{agentMessages.scrollTop=agentMessages.scrollHeight};
  const messageNode=(role,text='')=>{const node=document.createElement('div');node.className='agent-message '+role;const body=document.createElement('p');body.textContent=text;node.appendChild(body);agentMessages.appendChild(node);scrollAgent();return{node,body}};
  const renderCitations=(node,items=[])=>{
    const safe=items.filter(item=>{try{return new URL(item.url).protocol==='https:'}catch{return false}}).slice(0,4);
    if(!safe.length)return;
    const title=document.createElement('div');title.className='agent-source-title';title.textContent='资料来源';node.appendChild(title);
    const list=document.createElement('div');list.className='agent-sources';
    safe.forEach(item=>{const link=document.createElement('a');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=(item.grade?'['+item.grade+'] ':'')+(item.title||'查看来源');list.appendChild(link)});
    node.appendChild(list);
  };
  const appendInline=(element,text)=>{text.split('**').forEach((part,index)=>{if(index%2===1){const strong=document.createElement('strong');strong.textContent=part;element.appendChild(strong)}else element.appendChild(document.createTextNode(part))})};
  const renderAgentAnswer=(body,text)=>{
    body.textContent='';
    text.split(String.fromCharCode(10)).forEach(line=>{
      const clean=line.trim();if(!clean)return;
      if(clean==='---'){body.appendChild(document.createElement('hr'));return}
      if(clean.startsWith('### ')||clean.startsWith('## ')){const offset=clean.startsWith('### ')?4:3;const heading=document.createElement('h4');appendInline(heading,clean.slice(offset));body.appendChild(heading);return}
      if(clean.startsWith('- ')){const item=document.createElement('div');item.className='agent-bullet';appendInline(item,clean.slice(2));body.appendChild(item);return}
      const paragraph=document.createElement('p');appendInline(paragraph,clean);body.appendChild(paragraph);
    });
  };
  async function askAgent(message){
    const clean=message.trim();if(!clean||agentSubmit.disabled)return;
    messageNode('user',clean);history.push({role:'user',content:clean});agentInput.value='';agentSubmit.disabled=true;setAgentStatus('正在查阅英歌知识库');
    const assistant=messageNode('assistant agent-thinking','正在查阅资料…');let answer='';let citations=[];
    try{
      const response=await fetch(agentApi+'/chat',{method:'POST',headers:{'content-type':'application/json','x-app-id':'yingge-h5'},body:JSON.stringify({app_id:'yingge-h5',conversation_id:conversationId,message:clean,history:history.slice(-6),context:{audience:'游客',detail_level:'standard',source_mode:'brief'},client:{locale:'zh-CN'}})});
      if(!response.ok){const problem=await response.json().catch(()=>({}));throw new Error(problem.message||'服务暂时不可用')}
      const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
      while(true){
        const chunk=await reader.read();if(chunk.done)break;buffer+=decoder.decode(chunk.value,{stream:true});
        const frames=buffer.split('\n\n');buffer=frames.pop()||'';
        for(const frame of frames){
          let event='message',data='';frame.split('\n').forEach(line=>{if(line.startsWith('event:'))event=line.slice(6).trim();if(line.startsWith('data:'))data+=line.slice(5).trim()});
          if(!data)continue;const payload=JSON.parse(data);
          if(event==='delta'){if(!answer){assistant.body.textContent='';assistant.node.classList.remove('agent-thinking')}answer+=payload.text||'';assistant.body.textContent=answer;scrollAgent()}
          if(event==='citations')citations=payload.items||[];
          if(event==='done'){renderAgentAnswer(assistant.body,answer);setAgentStatus('知识库已连接','online');}
        }
      }
      if(!answer)assistant.body.textContent='这次没有生成有效回答，请换一种方式提问。';
      renderCitations(assistant.node,citations);history.push({role:'assistant',content:answer});while(history.length>8)history.shift();scrollAgent();
    }catch(error){assistant.node.classList.remove('agent-thinking');assistant.body.textContent='暂时无法连接英歌知识服务。请稍后再试。';setAgentStatus('连接异常','error');}
    finally{agentSubmit.disabled=false;agentInput.focus()}
  }
  fetch('http://127.0.0.1:8787/api/health').then(r=>{if(!r.ok)throw 0;setAgentStatus('知识库已连接','online')}).catch(()=>setAgentStatus('知识服务未启动','error'));
  agentForm.addEventListener('submit',event=>{event.preventDefault();askAgent(agentInput.value)});
  document.querySelectorAll('[data-agent-question]').forEach(button=>button.addEventListener('click',()=>askAgent(button.dataset.agentQuestion)));
}
window.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});window.addEventListener('pagehide',()=>{mm.revert();contentMotion.revert();learningMotion.revert();ScrollTrigger.getAll().forEach(t=>t.kill())},{once:true});
