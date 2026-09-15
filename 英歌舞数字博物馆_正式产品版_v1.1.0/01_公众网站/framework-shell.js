(()=>{
  const stage=document.getElementById('frameworkStage');
  const nav=document.getElementById('museumShellNav');
  const panel=document.getElementById('frameworkAgentPanel');
  const openButton=document.querySelector('[data-framework-agent-open]');
  const closeButton=panel.querySelector('.framework-agent-close');
  const messages=document.getElementById('frameworkAgentMessages');
  const prompts=document.getElementById('frameworkAgentPrompts');
  const sectionName=document.getElementById('frameworkSectionName');
  const status=document.getElementById('frameworkAgentStatus');
  const form=document.getElementById('frameworkAgentForm');
  const input=document.getElementById('frameworkAgentInput');
  const submit=form.querySelector('button[type="submit"]');
  const api=(location.hostname==='127.0.0.1'||location.hostname==='localhost')?'http://127.0.0.1:8787/api/agent':'/api/agent';
  const conversationId=crypto.randomUUID();
  const history=[];
  let currentSection='showcase';
  let lastScroll=0;
  const tr=value=>window.yinggeLocaleShell?.translate(value)||value;

  const sections={
    showcase:{selector:'.sectionShowcase',label:'视觉导入',summary:'以环形图像和视觉运动建立英歌专题的第一印象。',questions:['这一幕想表达什么？','这些视觉元素与英歌有什么关系？']},
    intro:{selector:'.sectionIntro',label:'三种探索方式',summary:'通过英歌小槌、线下 DIY 与线上数字博物馆三个入口介绍项目的体验方式。',questions:['英歌小槌在这里做什么？','线下体验怎样帮助理解英歌？']},
    gallery:{selector:'.section03ScrollTrack',label:'数字展项',summary:'展示趣玩非遗、好汉览谱、英歌观韵和数字寻古四类数字内容。',questions:['四类数字展项分别讲什么？','好汉览谱能怎样认识英歌人物？']},
    feature:{selector:'.sectionFeature',label:'轻量化 H5',summary:'展示以轻量化 H5 降低访问门槛、连接移动端传播的项目方案。',questions:['H5 怎样帮助传播英歌？','打开木疙瘩体验前要看什么？']},
    videos:{selector:'.sectionVideos',label:'合作实践',summary:'以合作案例轮播呈现展览、论坛、文化交流及项目实践。',questions:['这些合作案例与英歌有什么关系？','中泰英歌交流发生了什么？']}
  };

  const setOpen=(open)=>{panel.classList.toggle('is-open',open);panel.setAttribute('aria-hidden',String(!open));openButton.setAttribute('aria-expanded',String(open));if(open)setTimeout(()=>input.focus(),180)};
  openButton.addEventListener('click',()=>setOpen(!panel.classList.contains('is-open')));
  closeButton.addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')setOpen(false)});

  const renderPrompts=()=>{prompts.replaceChildren();sections[currentSection].questions.forEach(question=>{const button=document.createElement('button');button.type='button';button.textContent=tr(question);button.addEventListener('click',()=>ask(question));prompts.appendChild(button)})};
  const selectSection=(key)=>{if(!sections[key]||key===currentSection)return;currentSection=key;sectionName.textContent=tr(sections[key].label);renderPrompts()};
  renderPrompts();
  window.__frameworkShellRefresh=()=>{sectionName.textContent=tr(sections[currentSection].label);renderPrompts()};

  stage.addEventListener('load',()=>{
    try{
      const doc=stage.contentDocument;
      const win=stage.contentWindow;
      const observer=new win.IntersectionObserver(entries=>{const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(visible?.target?.dataset.shellSection)selectSection(visible.target.dataset.shellSection)},{root:null,threshold:[.18,.4,.65]});
      Object.entries(sections).forEach(([key,item])=>{const node=doc.querySelector(item.selector);if(node){node.dataset.shellSection=key;observer.observe(node)}});
      win.addEventListener('scroll',()=>{const next=win.scrollY;nav.classList.toggle('is-hidden',next>lastScroll&&next>120&&!panel.classList.contains('is-open'));lastScroll=next},{passive:true});
    }catch(_error){status.textContent='专题展馆导览'}
  });

  const addMessage=(role,text)=>{const node=document.createElement('div');node.className=`framework-message is-${role}`;const copy=document.createElement('p');copy.textContent=text;node.appendChild(copy);messages.appendChild(node);messages.scrollTop=messages.scrollHeight;return{node,copy}};
  const addSources=(node,items)=>{const safe=(items||[]).filter(item=>{try{return new URL(item.url).protocol==='https:'}catch{return false}});if(!safe.length)return;const details=document.createElement('details');details.className='framework-sources';const summary=document.createElement('summary');summary.textContent=`资料来源（${safe.length}）`;details.appendChild(summary);safe.forEach(item=>{const link=document.createElement('a');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=item.title||'查看来源';details.appendChild(link)});node.appendChild(details)};

  async function ask(question){
    const clean=question.trim();if(!clean||submit.disabled)return;
    setOpen(true);addMessage('user',clean);input.value='';submit.disabled=true;status.textContent='正在查阅馆内资料';
    const thinking=addMessage('assistant','');thinking.node.classList.add('is-thinking');const thinkingLabel=document.createElement('span');thinkingLabel.className='thinking-dots';thinkingLabel.textContent='小槌正在理解这一幕';thinking.copy.appendChild(thinkingLabel);
    let answer='',citations=[];
    try{
      const pageContext=sections[currentSection];
      const response=await fetch(`${api}/chat`,{method:'POST',headers:{'content-type':'application/json','x-app-id':'yingge-h5'},body:JSON.stringify({app_id:'yingge-h5',conversation_id:conversationId,message:clean,history:history.slice(-6),context:{audience:'专题展馆访客',detail_level:'standard',source_mode:'brief',page:'/framework-museum.html',topic:`${pageContext.label}。页面可见内容：${pageContext.summary}`},client:{locale:'zh-CN'}})});
      if(!response.ok)throw new Error('service unavailable');
      const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
      thinking.copy.textContent='';thinking.node.classList.remove('is-thinking');
      while(true){const chunk=await reader.read();if(chunk.done)break;buffer+=decoder.decode(chunk.value,{stream:true});const frames=buffer.split('\n\n');buffer=frames.pop()||'';for(const frame of frames){let event='message',data='';frame.split('\n').forEach(line=>{if(line.startsWith('event:'))event=line.slice(6).trim();if(line.startsWith('data:'))data+=line.slice(5).trim()});if(!data)continue;const payload=JSON.parse(data);if(event==='delta'){answer+=payload.text||'';thinking.copy.textContent=answer;messages.scrollTop=messages.scrollHeight}if(event==='citations')citations=payload.items||[]}}
      if(!answer)thinking.copy.textContent=tr('这次没有生成有效回答，请换一种问法。');else{history.push({role:'user',content:clean},{role:'assistant',content:answer});while(history.length>8)history.shift()}
      addSources(thinking.node,citations);status.textContent=tr('专题展馆导览');
    }catch(_error){thinking.copy.textContent=tr('暂时无法连接英歌知识服务，请稍后再试。');status.textContent=tr('连接异常')}finally{submit.disabled=false;input.focus()}
  }
  form.addEventListener('submit',event=>{event.preventDefault();ask(input.value)});
})();
