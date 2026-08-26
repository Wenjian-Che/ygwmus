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
window.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});window.addEventListener('pagehide',()=>{mm.revert();ScrollTrigger.getAll().forEach(t=>t.kill())},{once:true});
