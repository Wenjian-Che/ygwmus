import * as THREE from './vendor/three.module.js';

const canvas=document.querySelector('#formationCanvas');
if(canvas){
  const motionReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.outputColorSpace=THREE.SRGBColorSpace;

  const scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x243229,.022);
  const camera=new THREE.PerspectiveCamera(38,1,.1,120);
  camera.position.set(0,19,29);
  camera.lookAt(0,0,0);

  scene.add(new THREE.HemisphereLight(0xf6f1e8,0x243229,2.35));
  const keyLight=new THREE.DirectionalLight(0xde7622,3.4);
  keyLight.position.set(7,15,8);
  scene.add(keyLight);

  const count=innerWidth<700?48:72;
  function createPlayerTexture(){
    const textureCanvas=document.createElement('canvas');
    textureCanvas.width=512;textureCanvas.height=512;
    const ctx=textureCanvas.getContext('2d');
    ctx.clearRect(0,0,512,512);
    ctx.lineJoin='round';ctx.lineCap='round';
    ctx.strokeStyle='#26352b';ctx.lineWidth=10;
    ctx.fillStyle='rgba(242,241,234,.12)';ctx.beginPath();ctx.arc(256,258,150,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#de7622';ctx.lineWidth=7;ctx.beginPath();ctx.arc(256,258,145,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#f2e8dc';ctx.strokeStyle='#26352b';ctx.lineWidth=8;ctx.beginPath();ctx.arc(256,172,53,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#de7622';ctx.strokeStyle='#26352b';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(200,130);ctx.quadraticCurveTo(256,66,312,130);ctx.lineTo(292,153);ctx.lineTo(256,122);ctx.lineTo(220,153);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#f0b36f';ctx.strokeStyle='#26352b';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(256,64);ctx.lineTo(239,99);ctx.lineTo(273,99);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#26352b';ctx.beginPath();ctx.arc(236,174,8,0,Math.PI*2);ctx.arc(276,174,8,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#26352b';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(231,196);ctx.lineTo(242,208);ctx.moveTo(281,196);ctx.lineTo(270,208);ctx.stroke();
    ctx.fillStyle='#f04a3a';ctx.strokeStyle='#26352b';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(184,236);ctx.quadraticCurveTo(256,207,328,236);ctx.lineTo(309,362);ctx.quadraticCurveTo(256,388,203,362);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#de7622';ctx.strokeStyle='#26352b';ctx.lineWidth=5;ctx.fillRect(204,260,104,18);ctx.strokeRect(204,260,104,18);ctx.fillRect(217,340,78,15);ctx.strokeRect(217,340,78,15);
    ctx.strokeStyle='#f04a3a';ctx.lineWidth=28;ctx.beginPath();ctx.moveTo(198,253);ctx.lineTo(147,312);ctx.moveTo(314,253);ctx.lineTo(365,312);ctx.stroke();
    ctx.strokeStyle='#f2e8dc';ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(225,370);ctx.lineTo(210,434);ctx.moveTo(287,370);ctx.lineTo(302,434);ctx.stroke();
    ctx.fillStyle='#26352b';ctx.beginPath();ctx.ellipse(207,445,30,12,0,0,Math.PI*2);ctx.ellipse(305,445,30,12,0,0,Math.PI*2);ctx.fill();
    const texture=new THREE.CanvasTexture(textureCanvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;return texture;
  }
  const playerMaterial=new THREE.SpriteMaterial({map:createPlayerTexture(),transparent:true,alphaTest:.02,depthTest:true,depthWrite:false,opacity:.98,sizeAttenuation:true});
  const players=Array.from({length:count},()=>{const sprite=new THREE.Sprite(playerMaterial);sprite.center.set(.5,.08);sprite.renderOrder=2;return sprite});
  const stickGeometry=new THREE.BoxGeometry(.045,.045,.72);
  const stickMaterial=new THREE.MeshStandardMaterial({color:0xf4efe5,roughness:.25,metalness:.16,emissive:0xde7622,emissiveIntensity:.16});
  const leftSticks=new THREE.InstancedMesh(stickGeometry,stickMaterial,count);
  const rightSticks=new THREE.InstancedMesh(stickGeometry,stickMaterial,count);
  leftSticks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  rightSticks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const group=new THREE.Group();
  players.forEach(player=>group.add(player));
  group.add(leftSticks,rightSticks);
  scene.add(group);

  const trailArray=new Float32Array((count-1)*6);
  const trailGeometry=new THREE.BufferGeometry();
  trailGeometry.setAttribute('position',new THREE.BufferAttribute(trailArray,3));
  const trails=new THREE.LineSegments(trailGeometry,new THREE.LineBasicMaterial({color:0xd8e0d5,transparent:true,opacity:.11,depthWrite:false}));
  group.add(trails);

  const floor=new THREE.GridHelper(38,24,0x70806b,0x3f503b);
  floor.position.y=-.7;
  floor.material.transparent=true;
  floor.material.opacity=.48;
  scene.add(floor);

  const facts={
    double:['双列队形','两列平行、左右对称向前行进，是巡游中最基础的队形。'],
    square:['方形阵','两列为一组、两组并列，组织成四列矩形方阵。'],
    dragon:['双龙出海','两组对称队列从中间分开，分别向左右展开，形成双龙出海的曲线。'],
    spiral:['田螺阵','单列队伍沿螺旋路线由外向内或由内向外盘旋成圆。'],
    wheat:['麦穗花阵','两股队列沿同一圆环反向穿行，内外交替换位，形成连续编织状环阵。'],
    seas:['四海升平','全队均分为四组，在十字方位形成四个对称转动的圆圈。'],
    bagua:['八卦阵','队列衔接为内外圆，内圈以 S 形队列组织，整体形成八卦意象。']
  };

  function targetsFor(mode,phase=0){
    const result=[];
    for(let i=0;i<count;i++){
      if(mode==='double'){
        const row=Math.floor(i/2),rows=Math.ceil(count/2),u=row/Math.max(1,rows-1);
        result.push(new THREE.Vector3(i%2?2.6:-2.6,0,-12+u*24+Math.sin(phase*.9+row*.34)*.07));
      }else if(mode==='square'){
        const lane=i%4,rows=Math.ceil(count/4),row=Math.floor(i/4),u=row/Math.max(1,rows-1);
        result.push(new THREE.Vector3((lane-1.5)*2.05,0,-11.5+u*23+Math.sin(phase*.85+row*.3+lane*.25)*.06));
      }else if(mode==='dragon'){
        const lane=i%4,rows=Math.ceil(count/4),row=Math.floor(i/4),u=row/Math.max(1,rows-1),side=lane<2?-1:1,inner=lane%2?.55:-.55;
        const open=Math.sin(u*Math.PI)*5.7+u*4.2;
        result.push(new THREE.Vector3(side*(1.8+open)+inner,0,-11.5+u*23+Math.sin(u*Math.PI*2+phase*.65)*1.4));
      }else if(mode==='spiral'){
        const u=i/Math.max(1,count-1),angle=u*Math.PI*5.2+phase*.22,radius=.6+u*10.6;
        result.push(new THREE.Vector3(Math.cos(angle)*radius,0,Math.sin(angle)*radius));
      }else if(mode==='wheat'){
        const strand=i%2,index=Math.floor(i/2),size=Math.ceil(count/2),direction=strand===0?1:-1;
        const angle=index/size*Math.PI*2+strand*Math.PI/size+direction*phase*.2;
        const weave=Math.sin(angle*9+strand*Math.PI)*.72;
        const radius=9.15+weave;
        result.push(new THREE.Vector3(Math.cos(angle)*radius,0,Math.sin(angle)*radius));
      }else if(mode==='seas'){
        const size=Math.ceil(count/4),g=Math.min(3,Math.floor(i/size)),j=i-g*size,centers=[[-5.8,-5.8],[5.8,-5.8],[-5.8,5.8],[5.8,5.8]],center=centers[g];
        const angle=j/Math.max(1,size)*Math.PI*2+phase*(g%2?-.22:.22);
        result.push(new THREE.Vector3(center[0]+Math.cos(angle)*3.5,0,center[1]+Math.sin(angle)*3.5));
      }else{
        const outer=Math.round(count*.43),inner=Math.round(count*.31);
        if(i<outer){const angle=i/outer*Math.PI*2+phase*.14;result.push(new THREE.Vector3(Math.cos(angle)*10.8,0,Math.sin(angle)*10.8))}
        else if(i<outer+inner){const angle=-(i-outer)/inner*Math.PI*2-phase*.18;result.push(new THREE.Vector3(Math.cos(angle)*7.2,0,Math.sin(angle)*7.2))}
        else{const total=count-outer-inner,u=(i-outer-inner)/Math.max(1,total-1),v=u*2-1;result.push(new THREE.Vector3(Math.sin(v*Math.PI+phase*.18)*4.3,0,v*6.4))}
      }
    }
    return result;
  }

  let active='double';
  let current=targetsFor(active,0);
  let starts=current.map(v=>v.clone());
  const transition={progress:1};
  const stickDummy=new THREE.Object3D();
  const phaseClock=new THREE.Clock();
  const modes=Object.keys(facts);
  let auto=true;
  let autoIndex=0;
  let running=true;

  function updateCopy(mode){
    window.__yinggeSetLocalizedText?.(document.querySelector('#formationName'),facts[mode][0]);
    window.__yinggeSetLocalizedText?.(document.querySelector('#formationDescription'),facts[mode][1]);
    document.querySelectorAll('[data-formation]').forEach(button=>button.classList.toggle('active',button.dataset.formation===mode));
  }

  function selectFormation(mode,manual=false){
    if(!facts[mode]||mode===active&&transition.progress<1)return;
    starts=current.map(v=>v.clone());
    active=mode;
    autoIndex=modes.indexOf(mode);
    transition.progress=0;
    const status=document.querySelector('#formationMotionStatus');
    const selected=document.querySelector('[data-formation="'+mode+'"]');
    status.textContent=window.yinggeLocale?.translate('变阵中')||'变阵中';
    window.gsap.to(transition,{progress:1,duration:motionReduced?0:1.08,ease:'power3.inOut',overwrite:true,onComplete:()=>{status.textContent=window.yinggeLocale?.translate('行进中')||'行进中'}});
    window.gsap.fromTo(selected,{scale:.94},{scale:1,duration:.48,ease:'back.out(2)',overwrite:true});
    window.gsap.fromTo(playerMaterial,{opacity:.68},{opacity:.98,duration:.9,ease:'power2.out',overwrite:true});
    const cameraZ=camera.position.z;
    window.gsap.timeline({defaults:{ease:'power2.inOut'}}).to(camera.position,{z:cameraZ-.65,duration:.34}).to(camera.position,{z:cameraZ,duration:.58});
    updateCopy(mode);
    if(manual)setAuto(false);
  }

  function setAuto(next){
    auto=next;
    const button=document.querySelector('#formationAuto');
    button.classList.toggle('active',auto);
    button.setAttribute('aria-pressed',String(auto));
    button.textContent=window.yinggeLocale?.translate(auto?'自动巡演':'自动巡演已暂停')||(auto?'自动巡演':'自动巡演已暂停');
  }

  document.querySelectorAll('[data-formation]').forEach(button=>button.addEventListener('click',()=>selectFormation(button.dataset.formation,true)));
  document.querySelector('#formationAuto').addEventListener('click',()=>setAuto(!auto));
  setInterval(()=>{if(auto&&running){autoIndex=(autoIndex+1)%modes.length;selectFormation(modes[autoIndex])}},6500);

  let targetRotX=0,targetRotY=0,dragging=false,lastX=0,lastY=0;
  const rotateX=window.gsap.quickTo(group.rotation,'x',{duration:.45,ease:'power3.out'});
  const rotateY=window.gsap.quickTo(group.rotation,'y',{duration:.45,ease:'power3.out'});
  const zoom=window.gsap.quickTo(camera.position,'z',{duration:.35,ease:'power2.out'});
  canvas.addEventListener('pointerdown',event=>{dragging=true;lastX=event.clientX;lastY=event.clientY;canvas.setPointerCapture(event.pointerId)});
  canvas.addEventListener('pointermove',event=>{if(!dragging)return;targetRotY+=(event.clientX-lastX)*.006;targetRotX=THREE.MathUtils.clamp(targetRotX+(event.clientY-lastY)*.004,-.28,.35);rotateY(targetRotY);rotateX(targetRotX);lastX=event.clientX;lastY=event.clientY});
  canvas.addEventListener('pointerup',()=>{dragging=false});
  canvas.addEventListener('pointercancel',()=>{dragging=false});
  canvas.addEventListener('wheel',event=>{if(!event.ctrlKey)return;event.preventDefault();zoom(THREE.MathUtils.clamp(camera.position.z+event.deltaY*.008,20,38))},{passive:false});

  function resize(){
    const width=canvas.clientWidth,height=canvas.clientHeight;
    renderer.setSize(width,height,false);
    camera.aspect=width/Math.max(1,height);
    camera.updateProjectionMatrix();
  }

  new IntersectionObserver(entries=>{running=entries[0].isIntersecting},{threshold:.02}).observe(canvas);
  addEventListener('resize',resize,{passive:true});
  resize();
  updateCopy(active);

  function render(){
    requestAnimationFrame(render);
    if(!running)return;
    const phase=motionReduced?0:phaseClock.getElapsedTime();
    const targets=targetsFor(active,phase);
    for(let i=0;i<count;i++){
      if(transition.progress<1)current[i].lerpVectors(starts[i],targets[i],transition.progress);
      else current[i].lerp(targets[i],motionReduced?1:.16);
      const step=motionReduced?0:Math.abs(Math.sin(phase*4.2+i*.48))*.18;
      const player=players[i];
      const playerScale=i%12===0?1.12:1;
      player.position.set(current[i].x,.1+step,current[i].z);
      const breathing=playerScale*(.98+Math.sin(phase*1.6+i*.22)*.02);
      player.scale.set(playerScale,breathing,playerScale);

      const swing=motionReduced?0:Math.sin(phase*5.4+i*.62)*.72;
      stickDummy.position.set(current[i].x-.19,.12+step,current[i].z);
      stickDummy.rotation.set(.42,swing,.18);
      stickDummy.scale.setScalar(i%12===0?1.18:1);
      stickDummy.updateMatrix();
      leftSticks.setMatrixAt(i,stickDummy.matrix);
      stickDummy.position.x=current[i].x+.19;
      stickDummy.rotation.set(.42,-swing,-.18);
      stickDummy.updateMatrix();
      rightSticks.setMatrixAt(i,stickDummy.matrix);
      if(i<count-1){
        const offset=i*6,next=current[i+1];
        trailArray[offset]=current[i].x;trailArray[offset+1]=.02;trailArray[offset+2]=current[i].z;
        trailArray[offset+3]=next.x;trailArray[offset+4]=.02;trailArray[offset+5]=next.z;
      }
    }
    leftSticks.instanceMatrix.needsUpdate=true;
    rightSticks.instanceMatrix.needsUpdate=true;
    trailGeometry.attributes.position.needsUpdate=true;
    if(!motionReduced){
      floor.position.z=(phase*1.1)%1.58;
      if(auto&&!dragging)group.rotation.y+=.00045;
    }
    renderer.render(scene,camera);
  }
  render();
}
