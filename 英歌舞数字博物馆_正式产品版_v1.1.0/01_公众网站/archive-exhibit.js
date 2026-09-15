(async function(){
  if(!location.pathname.endsWith('/archive.html')||!window.gsap||!window.ScrollTrigger)return;
  const page=document.body;
  page.classList.add('archive-page');
  const main=page.querySelector('main');
  if(!main)return;
  try{
    const response=await fetch('archive-fragment.html',{cache:'no-store'});
    if(!response.ok)throw new Error('archive fragment unavailable');
    const fragment=await response.text();
    if(!fragment.includes('archive-hero'))throw new Error('archive fragment invalid');
    ScrollTrigger.getAll().forEach(trigger=>trigger.kill());
    main.innerHTML=fragment;
    window.dispatchEvent(new CustomEvent('archive:ready'));
  }catch(error){
    console.warn('Archive exhibition fallback:',error);
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const readout=document.querySelector('.claim-status');
  const known=Array.from(document.querySelectorAll('.claim-known i'));
  const steps=Array.from(document.querySelectorAll('.evidence-step'));

  function setClaimStage(index){
    const step=steps[index];
    if(!step||!readout)return;
    steps.forEach((item,itemIndex)=>item.classList.toggle('is-active',itemIndex===index));
    known.forEach((item,itemIndex)=>item.classList.toggle('is-known',itemIndex<=index));
    const title=readout.querySelector('strong');
    const copy=readout.querySelector('p');
    const timeline=gsap.timeline({defaults:{duration:.28,ease:'power2.out'}});
    timeline.to([title,copy],{autoAlpha:0,y:8})
      .add(()=>{title.textContent=step.dataset.status;copy.textContent=step.dataset.summary})
      .to([title,copy],{autoAlpha:1,y:0});
  }

  const strata={
    formal:{title:'确认公共事实',copy:'名录、标准和政府公开资料适合确认项目名称、保护单位、发布日期与制度信息。它们仍不能替代具体队伍的现场做法。'},
    case:{title:'解释具体实践',copy:'队伍档案与连续影像适合解释动作、人物、锣鼓和阵形。使用时必须写明队伍、地区、拍摄时间和场景。'},
    field:{title:'保留现场经验',copy:'访谈与观察能记录传承人的经验和地方称谓。它们需要保留记录者、授权方式、时间与原始材料，不能被包装成无边界的统一答案。'}
  };
  const detail=document.querySelector('.strata-detail');
  document.querySelectorAll('.strata-button').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('.strata-button').forEach(item=>item.setAttribute('aria-selected',String(item===button)));
    const item=strata[button.dataset.strata];
    if(!item||!detail)return;
    gsap.killTweensOf(detail.children);
    gsap.timeline({defaults:{duration:.28,ease:'power2.out'}})
      .to(detail.children,{autoAlpha:0,y:8,stagger:.03})
      .add(()=>{detail.querySelector('strong').textContent=item.title;detail.querySelector('p').textContent=item.copy})
      .to(detail.children,{autoAlpha:1,y:0,stagger:.04});
  }));

  const fields=Array.from(document.querySelectorAll('.boundary-field'));
  const verdict=document.querySelector('.boundary-verdict');
  function updateBoundary(){
    const count=fields.filter(field=>field.getAttribute('aria-pressed')==='true').length;
    const title=verdict?.querySelector('strong');
    const copy=verdict?.querySelector('p');
    if(!title||!copy)return;
    const messages=[
      ['不能确认','只看一句流传说法，没有地区、队伍、年代和原始材料。'],
      ['仍待补证','已经多一个线索，但结论仍缺少明确边界。'],
      ['有条件讨论','现有信息可以形成问题，还不能写成统一规则。'],
      ['接近可核查','还需比较另一份独立材料，并保留不同说法。'],
      ['信息已经补齐','关键信息已经补齐，但还要核对原始材料，才能确认这句话是否可靠。']
    ];
    gsap.killTweensOf([title,copy]);
    gsap.timeline({defaults:{duration:.24,ease:'power2.out'}})
      .to([title,copy],{autoAlpha:0,y:7})
      .add(()=>{title.textContent=messages[count][0];copy.textContent=messages[count][1]})
      .to([title,copy],{autoAlpha:1,y:0});
  }
  fields.forEach(field=>field.addEventListener('click',()=>{
    field.setAttribute('aria-pressed',String(field.getAttribute('aria-pressed')!=='true'));
    updateBoundary();
  }));

  const mm=gsap.matchMedia();
  mm.add('(prefers-reduced-motion:no-preference)',()=>{
    steps.forEach((step,index)=>{
      ScrollTrigger.create({
        trigger:step,
        start:'top 58%',
        end:'bottom 42%',
        onEnter:()=>setClaimStage(index),
        onEnterBack:()=>setClaimStage(index)
      });
    });
    ScrollTrigger.batch('.archive-reveal',{start:'top 84%',once:true,onEnter:elements=>gsap.fromTo(elements,{autoAlpha:0,y:24},{autoAlpha:1,y:0,duration:.72,stagger:.07,ease:'power3.out',overwrite:true})});
    gsap.from('.hero-claim',{autoAlpha:0,x:32,duration:.9,ease:'power3.out',delay:.15});
  });
  document.fonts?.ready.then(()=>ScrollTrigger.refresh());
  window.addEventListener('pagehide',()=>mm.revert(),{once:true});
})();
