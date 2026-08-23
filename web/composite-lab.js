(()=>{
  const lab=document.querySelector("[data-composite-lab]");
  if(!lab)return;
  const set=(x,y)=>{lab.style.setProperty("--px",x.toFixed(3));lab.style.setProperty("--py",y.toFixed(3))};
  addEventListener("pointermove",event=>set(event.clientX/innerWidth-.5,event.clientY/innerHeight-.5),{passive:true});
  addEventListener("pointerleave",()=>set(0,0));
})();
