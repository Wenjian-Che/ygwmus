const svg=document.querySelector('#regionMap');
const atlas=document.querySelector('#regionAtlas');
if(svg&&atlas){
  const viewport=document.querySelector('#regionMapViewport');
  const ui={type:document.querySelector('#regionType'),name:document.querySelector('#regionName'),summary:document.querySelector('#regionSummary'),focus:document.querySelector('#regionFocus'),evidence:document.querySelector('#regionEvidence')};
  const stories={
    '汕头市':{name:'汕头',type:'主要分布',summary:'潮阳、潮南等地都有英歌表演。即使在同一座城市，不同社区和队伍也各有特点。',focus:'潮阳、潮南的社区队伍与地方版本',evidence:'接下来可以查看潮阳、潮南的具体队伍和不同时期。'},
    '揭阳市':{name:'揭阳',type:'主要分布',summary:'普宁、惠来等地构成重要的英歌实践区域，具体特点要结合社区、队伍和年代理解。',focus:'普宁、惠来的队形、板式与传承网络',evidence:'可从普宁、惠来继续比较队形、板式与师承。'},
    '潮州市':{name:'潮州',type:'相关分布',summary:'可见相关地方实践与交流线索，具体特点需结合社区、队伍和年代理解。',focus:'地方交流、演出场景与历史线索',evidence:'可结合社区、交流活动与历史线索继续辨认。'}
  };
  const NS='http://www.w3.org/2000/svg';
  let view={x:620,y:475,w:120,h:78},selected='汕头市',dragging=false,moved=false,last={x:0,y:0},pinch=new Map(),pinchDistance=0,cityPaths=[],localView={...view};
  const merc=lat=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));const minM=merc(18),maxM=merc(54);
  const project=([lon,lat])=>[(lon-73)/(135-73)*1000,(maxM-merc(lat))/(maxM-minM)*650];
  const pathRing=ring=>ring.map((point,i)=>{const [x,y]=project(point);return `${i?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)}`}).join(' ')+' Z';
  const pathGeometry=geometry=>{const polys=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;return polys.map(poly=>poly.map(pathRing).join(' ')).join(' ')};
  const make=(name,attrs={})=>{const el=document.createElementNS(NS,name);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));return el};
  function setView(next,animate=true){const target={...next};const apply=()=>svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`);if(animate&&window.gsap){gsap.to(view,{...target,duration:1.05,ease:'power3.inOut',overwrite:true,onUpdate:apply})}else{Object.assign(view,target);apply()}}
  function boundsFor(feature,pad=22){const pts=[];const polys=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;polys.forEach(poly=>poly.forEach(ring=>ring.forEach(p=>pts.push(project(p)))));const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);let w=Math.max(maxX-minX+pad*2,92),h=Math.max(maxY-minY+pad*2,72);const ratio=1000/650;if(w/h>ratio)h=w/ratio;else w=h*ratio;return{x:(minX+maxX-w)/2,y:(minY+maxY-h)/2,w,h}}
  function boundsForAll(features,pad=18){const pts=[];features.forEach(feature=>{const polys=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;polys.forEach(poly=>poly.forEach(ring=>ring.forEach(point=>pts.push(project(point)))))});const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);let w=maxX-minX+pad*2,h=maxY-minY+pad*2;const ratio=1000/650;if(w/h>ratio)h=w/ratio;else w=h*ratio;return{x:(minX+maxX-w)/2,y:(minY+maxY-h)/2,w,h}}
  function updateSelection(key,locate=false){const story=stories[key];if(!story)return;selected=key;cityPaths.forEach(path=>path.classList.toggle('is-selected',path.dataset.region===key));document.querySelectorAll('.region-switcher button').forEach(b=>b.classList.toggle('is-active',b.dataset.region===key));ui.type.textContent=story.type;ui.name.textContent=story.name;ui.summary.textContent=story.summary;ui.focus.textContent=story.focus;ui.evidence.textContent=story.evidence;window.__yinggeLocaleRefresh?.();atlas.classList.remove('story-flash');requestAnimationFrame(()=>atlas.classList.add('story-flash'));if(locate){const path=cityPaths.find(p=>p.dataset.region===key);if(path)setView(boundsFor(path.__feature),innerWidth>=700)}}
  fetch('./assets/guangdong-cities.geojson').then(r=>r.json()).then(cities=>{
    const localFeatures=cities.features.filter(f=>stories[f.properties.name]);
    const regions=make('g',{class:'yingge-regions'});localFeatures.forEach(feature=>{const path=make('path',{d:pathGeometry(feature.geometry),class:'yingge-region','data-region':feature.properties.name,'fill-rule':'evenodd','vector-effect':'non-scaling-stroke',tabindex:'0',role:'button','aria-label':`查看${stories[feature.properties.name].name}英歌资料`});path.__feature=feature;path.addEventListener('click',()=>updateSelection(feature.properties.name,false));path.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();updateSelection(feature.properties.name,true)}});regions.appendChild(path);cityPaths.push(path)});viewport.appendChild(regions);localView=boundsForAll(localFeatures);Object.assign(view,localView);setView(localView,false);updateSelection(selected,false);atlas.classList.add('map-ready')
  }).catch(()=>atlas.classList.add('map-data-limited'));
  const zoomAt=(factor,cx=.5,cy=.5)=>{const nw=Math.min(localView.w*2.2,Math.max(32,view.w*factor)),nh=nw/(1000/650),x=view.x+(view.w-nw)*cx,y=view.y+(view.h-nh)*cy;setView({x,y,w:nw,h:nh},false)};
  document.querySelector('#globeZoomIn').addEventListener('click',e=>{e.stopPropagation();zoomAt(.78)});document.querySelector('#globeZoomOut').addEventListener('click',e=>{e.stopPropagation();zoomAt(1.28)});
  svg.addEventListener('wheel',e=>{e.preventDefault();const r=svg.getBoundingClientRect();zoomAt(e.deltaY>0?1.13:.87,(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height)},{passive:false});
  svg.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;pinch.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pinch.size===2){const a=[...pinch.values()];pinchDistance=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);dragging=false;return}dragging=true;moved=false;last={x:e.clientX,y:e.clientY};svg.setPointerCapture(e.pointerId)});
  svg.addEventListener('pointermove',e=>{if(pinch.has(e.pointerId))pinch.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pinch.size===2){const a=[...pinch.values()],next=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinchDistance)zoomAt(pinchDistance/next);pinchDistance=next;return}if(!dragging)return;const r=svg.getBoundingClientRect(),dx=(e.clientX-last.x)/r.width*view.w,dy=(e.clientY-last.y)/r.height*view.h;if(Math.abs(dx)+Math.abs(dy)>.5)moved=true;view.x-=dx;view.y-=dy;last={x:e.clientX,y:e.clientY};setView(view,false)});
  const end=e=>{pinch.delete(e.pointerId);pinchDistance=0;dragging=false};svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
  document.querySelectorAll('.region-switcher button').forEach(button=>button.addEventListener('click',()=>updateSelection(button.dataset.region,true)));
  window.__yinggeLocaleRefresh?.();
}
