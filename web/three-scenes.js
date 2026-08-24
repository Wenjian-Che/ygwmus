import * as THREE from "./vendor/three.module.js";
import { OrbitControls } from "./vendor/OrbitControls.js";

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(pointer:fine)").matches;
const red = 0xa55d51;
const cyan = 0x789ba8;
const ink = 0x0b1d2a;

function rendererFor(canvas, alpha = true) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    canvas.classList.add("webgl-context-lost");
    canvas.parentElement?.classList.add("is-webgl-fallback");
  }, { once: true });
  return renderer;
}

function startScene(selector, initializer) {
  const canvas = document.querySelector(selector);
  if (!canvas) return;
  try {
    initializer();
  } catch (error) {
    console.error(`[英歌 3D] ${selector} 初始化失败`, error);
    canvas.classList.add("webgl-context-lost");
    canvas.parentElement?.classList.add("is-webgl-fallback");
    const loading = canvas.parentElement?.querySelector(".map-loading");
    if (loading) loading.textContent = "当前设备暂不支持三维地图，正文内容仍可正常浏览";
  }
}

function lazyScene(selector, initializer) {
  const canvas = document.querySelector(selector);
  if (!canvas) return;
  if (!("IntersectionObserver" in window)) {
    startScene(selector, initializer);
    return;
  }
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    startScene(selector, initializer);
  }, { rootMargin: "520px 0px" });
  observer.observe(canvas);
}

function fit(renderer, camera, canvas) {
  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function observeScene(canvas, onFrame, onResize) {
  let active = true;
  let raf = 0;
  const visibility = new IntersectionObserver(([entry]) => { active = entry.isIntersecting; if (active) tick(); }, { rootMargin: "180px" });
  const resize = new ResizeObserver(onResize);
  const tick = () => {
    if (!active || raf) return;
    raf = requestAnimationFrame((time) => { raf = 0; onFrame(time * .001); if (active) tick(); });
  };
  visibility.observe(canvas);
  resize.observe(canvas);
  tick();
  return () => { active = false; cancelAnimationFrame(raf); visibility.disconnect(); resize.disconnect(); };
}

function initHero() {
  const canvas = document.querySelector("#hero-webgl");
  if (!canvas) return;
  const renderer = rendererFor(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 200);
  camera.position.set(0, 0, 44);

  const count = innerWidth < 700 ? 220 : 520;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.pow(Math.random(), .62) * 29;
    positions[i * 3] = Math.cos(angle) * radius + 10;
    positions[i * 3 + 1] = Math.sin(angle) * radius * .58;
    positions[i * 3 + 2] = (Math.random() - .5) * 22;
    seeds[i] = Math.random();
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xc6a66b, size: .115, transparent: true, opacity: .42, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(particles);

  const rings = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(6 + i * 3.2, .035, 6, 180), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xc6a66b : red, transparent: true, opacity: .2, blending: THREE.AdditiveBlending }));
    ring.position.set(9, -1, -4 - i * 1.2);
    ring.rotation.x = .18;
    rings.add(ring);
  }
  scene.add(rings);

  const pulse = new THREE.Mesh(
    new THREE.RingGeometry(2.8, 3.02, 180),
    new THREE.MeshBasicMaterial({ color: 0xc6a66b, transparent: true, opacity: .23, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
  );
  pulse.position.set(9, -1, -1.8);
  scene.add(pulse);

  const streaks = new THREE.Group();
  for (let i = 0; i < 18; i++) {
    const line = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 3 + Math.random() * 8, 5), new THREE.MeshBasicMaterial({ color: i % 3 ? 0x789ba8 : red, transparent: true, opacity: .2 + Math.random() * .28 }));
    line.rotation.z = Math.PI / 2 + (Math.random() - .5) * .3;
    line.position.set(-6 + Math.random() * 34, -13 + Math.random() * 26, -9 + Math.random() * 12);
    streaks.add(line);
  }
  scene.add(streaks);

  const pointer = { x: 0, y: 0 };
  if (finePointer) canvas.parentElement.addEventListener("pointermove", (event) => {
    const box = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - box.left) / box.width - .5) * 2;
    pointer.y = ((event.clientY - box.top) / box.height - .5) * 2;
  }, { passive: true });

  fit(renderer, camera, canvas);
  observeScene(canvas, (time) => {
    if (!reducedMotion) {
      particles.rotation.z = time * .018;
      particles.rotation.y = Math.sin(time * .22) * .08;
      rings.rotation.z = -time * .035;
      const breathe = 1 + Math.sin(time * 1.35) * .12;
      pulse.scale.setScalar(breathe);
      pulse.material.opacity = .16 + (Math.sin(time * 1.35) + 1) * .07;
      streaks.position.x = Math.sin(time * .28) * 1.2;
      camera.position.x += (pointer.x * 1.6 - camera.position.x) * .035;
      camera.position.y += (-pointer.y * .9 - camera.position.y) * .035;
    }
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }, () => fit(renderer, camera, canvas));
}

function initImpact() {
  const canvas = document.querySelector("#impact-webgl");
  if (!canvas) return;
  const renderer = rendererFor(canvas);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(ink, .045);
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
  camera.position.set(0, 0, 28);
  scene.add(new THREE.AmbientLight(0xd5cab6, 1.2));
  const key = new THREE.PointLight(0xffffff, 75, 50); key.position.set(-8, 10, 16); scene.add(key);
  const rim = new THREE.PointLight(red, 90, 40); rim.position.set(10, -5, 8); scene.add(rim);

  const wood = new THREE.MeshStandardMaterial({ color: 0x70422f, roughness: .48, metalness: .05 });
  const cap = new THREE.MeshStandardMaterial({ color: 0xeee7d8, roughness: .65 });
  const makeStick = () => {
    const group = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.58, .72, 11.5, 18), wood);
    const end = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 1.7, 18), cap); end.position.y = 6.3;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(.63, .63, .24, 18), new THREE.MeshStandardMaterial({ color: 0xc6a66b, metalness: .65, roughness: .25 })); band.position.y = 5.34;
    shaft.castShadow = true; group.add(shaft, end, band); return group;
  };
  const left = makeStick(), right = makeStick();
  left.position.set(-5, -2.5, 0); right.position.set(5, -2.5, 0);
  left.rotation.z = -.75; right.rotation.z = .75;
  scene.add(left, right);

  const wave = new THREE.Mesh(new THREE.TorusGeometry(1, .055, 8, 160), new THREE.MeshBasicMaterial({ color: cyan, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }));
  wave.position.z = 1.4; scene.add(wave);
  const pCount = 180, pGeo = new THREE.BufferGeometry(), pPos = new Float32Array(pCount * 3), velocity = [];
  for (let i = 0; i < pCount; i++) velocity.push(new THREE.Vector3());
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  const sparks = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xeee7d8, size: .095, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(sparks);
  let energy = 0, burst = 0;
  const strike = () => {
    energy = 1; burst = 1; wave.scale.setScalar(.25); wave.material.opacity = .8; sparks.material.opacity = .95;
    for (let i = 0; i < pCount; i++) {
      const angle = Math.random() * Math.PI * 2, speed = 2 + Math.random() * 9;
      pPos[i * 3] = pPos[i * 3 + 1] = pPos[i * 3 + 2] = 0;
      velocity[i].set(Math.cos(angle) * speed, Math.sin(angle) * speed, (Math.random() - .5) * 4);
    }
    pGeo.attributes.position.needsUpdate = true;
  };
  document.querySelector("[data-impact-trigger]")?.addEventListener("click", strike);
  canvas.addEventListener("pointerdown", strike);
  if (window.ScrollTrigger && !reducedMotion) ScrollTrigger.create({ trigger: ".impact-story", start: "top 55%", onEnter: strike, onEnterBack: strike });

  fit(renderer, camera, canvas);
  observeScene(canvas, (time) => {
    energy *= .91; burst *= .96;
    const strikeAngle = .75 + energy * .32;
    left.rotation.z += (-strikeAngle - left.rotation.z) * .18;
    right.rotation.z += (strikeAngle - right.rotation.z) * .18;
    left.rotation.y = Math.sin(time * .8) * .06; right.rotation.y = -left.rotation.y;
    wave.scale.multiplyScalar(1.045); wave.material.opacity *= .94;
    const dt = .016;
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] += velocity[i].x * dt; pPos[i * 3 + 1] += velocity[i].y * dt; pPos[i * 3 + 2] += velocity[i].z * dt;
      velocity[i].multiplyScalar(.985);
    }
    pGeo.attributes.position.needsUpdate = true; sparks.material.opacity = burst;
    renderer.render(scene, camera);
  }, () => fit(renderer, camera, canvas));
}

const formationFacts = {
  "double-columns": { name: "双列队形", description: "两列平行、左右对称向前行进，是巡游中最基础的队形。" },
  square: { name: "方形阵", description: "两列为一组、两组并列，组织成四列矩形方阵。" },
  "twin-dragon": { name: "双龙出海", description: "两组对称队列从中间分开，分别向左右展开，形成双龙出海的曲线。" },
  conch: { name: "田螺阵", description: "单列队伍沿螺旋路线由外向内或由内向外盘旋成圆。" },
  "wheat-ear": { name: "麦穗花阵", description: "大队围成大圆行进，小队在内圈反向穿行，形成大小圆交错。" },
  "four-seas": { name: "四海升平", description: "全队均分为四组，在十字方位形成四个对称转动的圆圈。" },
  bagua: { name: "八卦阵", description: "队列衔接为内外圆，内圈以 S 形队列组织，整体形成八卦意象。" }
};

function formationTargets(count, mode, phase = 0) {
  const result = [];
  for (let i = 0; i < count; i++) {
    if (mode === "double-columns") {
      const row = Math.floor(i / 2), rows = Math.ceil(count / 2), u = row / Math.max(1, rows - 1);
      result.push(new THREE.Vector3(i % 2 ? 3.15 : -3.15, 0, -14 + u * 28));
    } else if (mode === "square") {
      const lane = i % 4, rows = Math.ceil(count / 4), u = Math.floor(i / 4) / Math.max(1, rows - 1);
      result.push(new THREE.Vector3((lane - 1.5) * 3.2, 0, -13 + u * 26));
    } else if (mode === "twin-dragon") {
      const lane = i % 4, rows = Math.ceil(count / 4), u = Math.floor(i / 4) / Math.max(1, rows - 1);
      const side = lane < 2 ? -1 : 1, innerLane = lane % 2 ? .72 : -.72;
      const open = Math.sin(u * Math.PI) * 7.2 + u * 5.3;
      result.push(new THREE.Vector3(side * (2.2 + open) + innerLane, 0, -13 + u * 26 + Math.sin(u * Math.PI * 2) * 1.8));
    } else if (mode === "conch") {
      const u = i / Math.max(1, count - 1), angle = u * Math.PI * 5.2 + phase * .12, radius = .7 + u * 12.8;
      result.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    } else if (mode === "wheat-ear") {
      const outerCount = Math.round(count * 2 / 3);
      if (i < outerCount) {
        const angle = i / outerCount * Math.PI * 2 + phase * .13;
        result.push(new THREE.Vector3(Math.cos(angle) * 11.6, 0, Math.sin(angle) * 11.6));
      } else {
        const innerCount = count - outerCount, angle = -(i - outerCount) / innerCount * Math.PI * 2 - phase * .19;
        result.push(new THREE.Vector3(Math.cos(angle) * 5.1, 0, Math.sin(angle) * 5.1));
      }
    } else if (mode === "four-seas") {
      const groupSize = Math.floor(count / 4), group = Math.min(3, Math.floor(i / groupSize)), j = i - group * groupSize;
      const centers = [[-6.4,-6.4],[6.4,-6.4],[-6.4,6.4],[6.4,6.4]], center = centers[group];
      const angle = j / Math.max(1, groupSize) * Math.PI * 2 + phase * (group % 2 ? -.14 : .14);
      result.push(new THREE.Vector3(center[0] + Math.cos(angle) * 4.1, 0, center[1] + Math.sin(angle) * 4.1));
    } else {
      const outerCount = Math.round(count * .43), innerCount = Math.round(count * .31);
      if (i < outerCount) {
        const angle = i / outerCount * Math.PI * 2 + phase * .08;
        result.push(new THREE.Vector3(Math.cos(angle) * 12.8, 0, Math.sin(angle) * 12.8));
      } else if (i < outerCount + innerCount) {
        const angle = -(i - outerCount) / innerCount * Math.PI * 2 - phase * .11;
        result.push(new THREE.Vector3(Math.cos(angle) * 8.7, 0, Math.sin(angle) * 8.7));
      } else {
        const sCount = count - outerCount - innerCount, u = (i - outerCount - innerCount) / Math.max(1, sCount - 1), v = u * 2 - 1;
        result.push(new THREE.Vector3(Math.sin(v * Math.PI) * 5.1, 0, v * 7.5));
      }
    }
  }
  return result;
}

function initFormation() {
  const canvas = document.querySelector("#formation-webgl");
  if (!canvas) return;
  const renderer = rendererFor(canvas);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(ink, .025);
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 120);
  camera.position.set(0, 32, 39); camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 1.65));
  const light = new THREE.PointLight(cyan, 150, 90); light.position.set(0, 22, 8); scene.add(light);
  const count = innerWidth < 700 ? 72 : 108;
  const geometry = new THREE.CylinderGeometry(.31, .31, .16, 24);
  const material = new THREE.MeshStandardMaterial({ color: 0xa55d51, roughness: .34, metalness: .36, emissive: 0x381c1a, emissiveIntensity: .95 });
  const nodes = new THREE.InstancedMesh(geometry, material, count);
  nodes.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(nodes);
  const ringGeometry = new THREE.TorusGeometry(.38, .045, 8, 28);
  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xd5cab6, transparent: true, opacity: .8 });
  const rings = new THREE.InstancedMesh(ringGeometry, ringMaterial, count);
  rings.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(rings);
  const trailPositions = new Float32Array((count - 1) * 6);
  const trailGeometry = new THREE.BufferGeometry();
  trailGeometry.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
  const trails = new THREE.LineSegments(trailGeometry, new THREE.LineBasicMaterial({ color: 0x789ba8, transparent: true, opacity: .1, depthWrite: false }));
  scene.add(trails);
  let activeMode = "double-columns";
  const current = formationTargets(count, activeMode); let targets = formationTargets(count, activeMode);
  const dummy = new THREE.Object3D();
  const floor = new THREE.GridHelper(44, 22, 0x2e5872, 0x17384c); floor.position.y = -.32;
  floor.material.transparent = true; floor.material.opacity = .42; scene.add(floor);
  const select = (mode) => {
    activeMode = mode;
    targets = formationTargets(count, mode);
    document.querySelectorAll("[data-formation]").forEach(button => button.classList.toggle("active", button.dataset.formation === mode));
    const fact = formationFacts[mode];
    const name = document.querySelector("#formation-name"), description = document.querySelector("#formation-description");
    if (fact && name && description) { name.textContent = fact.name; description.textContent = fact.description; }
  };
  document.querySelectorAll("[data-formation]").forEach(button => button.addEventListener("click", () => select(button.dataset.formation)));
  const pointer = { x: 0, y: 0 };
  if (finePointer) canvas.addEventListener("pointermove", event => { const box = canvas.getBoundingClientRect(); pointer.x = ((event.clientX - box.left) / box.width - .5) * 2; pointer.y = ((event.clientY - box.top) / box.height - .5) * 2; }, { passive: true });
  fit(renderer, camera, canvas);
  observeScene(canvas, (time) => {
    if (!reducedMotion && ["conch", "wheat-ear", "four-seas", "bagua"].includes(activeMode)) targets = formationTargets(count, activeMode, time);
    for (let i = 0; i < count; i++) {
      current[i].lerp(targets[i], reducedMotion ? 1 : .055);
      dummy.position.copy(current[i]); dummy.position.y = .03 + Math.sin(time * 2.1 + i * .45) * .035;
      dummy.rotation.set(0, time * .12 + i, 0); dummy.scale.setScalar(i % 12 === 0 ? 1.42 : 1); dummy.updateMatrix(); nodes.setMatrixAt(i, dummy.matrix);
      dummy.position.y = .2; dummy.rotation.set(Math.PI / 2, 0, 0); dummy.scale.setScalar(i % 12 === 0 ? 1.42 : 1); dummy.updateMatrix(); rings.setMatrixAt(i, dummy.matrix);
      if (i < count - 1) {
        const offset = i * 6, next = current[i + 1];
        trailPositions[offset] = current[i].x; trailPositions[offset + 1] = .08; trailPositions[offset + 2] = current[i].z;
        trailPositions[offset + 3] = next.x; trailPositions[offset + 4] = .08; trailPositions[offset + 5] = next.z;
      }
    }
    nodes.instanceMatrix.needsUpdate = true;
    rings.instanceMatrix.needsUpdate = true;
    trailGeometry.attributes.position.needsUpdate = true;
    if (!reducedMotion) { camera.position.x += (pointer.x * 3.2 - camera.position.x) * .025; camera.position.y += (24 - pointer.y * 2 - camera.position.y) * .025; }
    camera.lookAt(0, 0, 0); renderer.render(scene, camera);
  }, () => fit(renderer, camera, canvas));
}

function initCollection() {
  const canvas = document.querySelector("#collection-webgl");
  if (!canvas) return;
  const renderer = rendererFor(canvas, true);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
  camera.position.set(0, 0, 32);
  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const warm = new THREE.PointLight(0xc6a66b, 90, 80);
  warm.position.set(-8, 8, 18);
  scene.add(warm);
  const redLight = new THREE.PointLight(0xa55d51, 120, 80);
  redLight.position.set(10, -5, 13);
  scene.add(redLight);

  const group = new THREE.Group();
  scene.add(group);
  const beadMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x743b37,
    metalness: .35,
    roughness: .2,
    clearcoat: 1,
    clearcoatRoughness: .12,
    transparent: true,
    opacity: .86
  });
  const silverMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xd5cab6,
    metalness: .86,
    roughness: .2,
    transparent: true,
    opacity: .66
  });
  const goldMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xc6a66b,
    metalness: .78,
    roughness: .26,
    transparent: true,
    opacity: .72
  });

  const pieces = [];
  for (let i = 0; i < 11; i++) {
    const bead = new THREE.Mesh(new THREE.SphereGeometry(.34 + (i % 3) * .13, 24, 24), i % 4 === 0 ? goldMaterial : beadMaterial);
    const angle = i * 2.17;
    bead.position.set(Math.cos(angle) * (8 + i * .78), Math.sin(angle * .78) * (5 + i * .24), -1 - (i % 4) * 2.2);
    bead.userData = { phase: i * .71, baseY: bead.position.y };
    group.add(bead);
    pieces.push(bead);
  }
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1 + i * .23, .045 + i * .008, 10, 72), silverMaterial);
    ring.position.set(-12 + i * 6.2, (i % 2 ? -1 : 1) * (4.2 + i * .35), -4 - i * 1.5);
    ring.rotation.set(.35 + i * .08, .5 - i * .13, i * .4);
    ring.userData = { phase: i * 1.1, baseY: ring.position.y };
    group.add(ring);
    pieces.push(ring);
  }

  const pointer = { x: 0, y: 0 };
  const stage = canvas.closest(".collection-stage");
  if (finePointer && stage) stage.addEventListener("pointermove", event => {
    const rect = stage.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width - .5;
    pointer.y = (event.clientY - rect.top) / rect.height - .5;
  }, { passive: true });

  fit(renderer, camera, canvas);
  observeScene(canvas, time => {
    pieces.forEach((piece, index) => {
      piece.position.y = piece.userData.baseY + Math.sin(time * .45 + piece.userData.phase) * .45;
      piece.rotation.x += reducedMotion ? 0 : .0015 + index * .00002;
      piece.rotation.y += reducedMotion ? 0 : .0022;
    });
    group.rotation.y += ((pointer.x * .14) - group.rotation.y) * .025;
    group.rotation.x += ((pointer.y * .09) - group.rotation.x) * .025;
    renderer.render(scene, camera);
  }, () => fit(renderer, camera, canvas));
}

function project(lng, lat) {
  return new THREE.Vector2((lng - 104) * 1.18, (lat - 35) * 1.42);
}

function ringsFromGeometry(geometry) {
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  return [];
}

function shapeFromPolygon(polygon) {
  if (!polygon?.[0]?.length) return null;
  const makePath = (ring, PathType) => {
    const path = new PathType();
    ring.forEach(([lng, lat], index) => { const p = project(lng, lat); index ? path.lineTo(p.x, p.y) : path.moveTo(p.x, p.y); });
    return path;
  };
  const shape = makePath(polygon[0], THREE.Shape);
  polygon.slice(1).forEach(ring => shape.holes.push(makePath(ring, THREE.Path)));
  return shape;
}

async function initMap() {
  const canvas = document.querySelector("#china-map-webgl");
  if (!canvas) return;
  const loading = document.querySelector("#map-loading"), tooltip = document.querySelector("#map-tooltip");
  try {
    const data = await fetch("./data/china-provinces.geojson").then(response => { if (!response.ok) throw new Error("地图数据加载失败"); return response.json(); });
    const renderer = rendererFor(canvas, false);
    renderer.setClearColor(0x09151e, 1);
    const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x09151e, .0045);
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 500); camera.position.set(0, -32, 132);
    scene.add(new THREE.HemisphereLight(0xd5cab6, 0x0b1d2a, 2.35));
    const key = new THREE.DirectionalLight(0xffffff, 4.4); key.position.set(-30, -10, 80); scene.add(key);
    const redLight = new THREE.PointLight(red, 150, 150); redLight.position.set(35, -20, 45); scene.add(redLight);
    const group = new THREE.Group(); group.rotation.x = -.48; group.rotation.z = reducedMotion ? 0 : -.035; group.position.y = 4; group.scale.setScalar(reducedMotion ? 1 : .9); scene.add(group);
    const meshes = [];
    data.features.forEach(feature => {
      const name = feature.properties?.name || "未命名区域";
      const isGuangdong = name.includes("广东");
      ringsFromGeometry(feature.geometry).forEach(polygon => {
        const shape = shapeFromPolygon(polygon); if (!shape) return;
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: isGuangdong ? 2.4 : .72, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: .08, bevelThickness: .1 });
        const material = new THREE.MeshStandardMaterial({ color: isGuangdong ? 0xa55d51 : 0x1f3b54, roughness: .52, metalness: .42, emissive: isGuangdong ? 0x381c1a : 0x07131b, emissiveIntensity: isGuangdong ? .9 : .48 });
        const mesh = new THREE.Mesh(geometry, material); mesh.userData = { name, baseColor: material.color.getHex(), isGuangdong }; group.add(mesh); meshes.push(mesh);
        const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 22), new THREE.LineBasicMaterial({ color: isGuangdong ? 0xc6a66b : 0x789ba8, transparent: true, opacity: isGuangdong ? .9 : .55 })); group.add(edge);
      });
    });

    const markerData = [
      ["普宁",116.17,23.30,red],["潮阳",116.60,23.27,red],["潮南",116.43,23.25,red],["甲子",116.07,22.86,red],["惠来",116.30,23.03,cyan]
    ];
    markerData.forEach(([name,lng,lat,color],index) => {
      const p = project(lng,lat), marker = new THREE.Group(); marker.position.set(p.x,p.y,3.1);
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(.09,.18,3.4,10),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.78})); beam.rotation.x=Math.PI/2; beam.position.z=1.5;
      const halo = new THREE.Mesh(new THREE.RingGeometry(.25,.43,30),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.85}));
      marker.add(beam,halo); marker.userData={name,index}; group.add(marker);
    });

    const controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.dampingFactor = .06; controls.enablePan = false; controls.minDistance = 64; controls.maxDistance = 175; controls.minPolarAngle = .7; controls.maxPolarAngle = 1.6; controls.target.set(0,1,0); controls.autoRotate = !reducedMotion; controls.autoRotateSpeed = .18;
    const raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2(9,9); let hovered = null;
    canvas.addEventListener("pointermove", event => {
      const rect = canvas.getBoundingClientRect(); mouse.set(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);
      tooltip.style.left = `${event.clientX-rect.left+14}px`; tooltip.style.top = `${event.clientY-rect.top+14}px`;
    },{passive:true});
    canvas.addEventListener("pointerleave",()=>{mouse.set(9,9);tooltip.hidden=true});
    canvas.addEventListener("pointerdown",()=>{controls.autoRotate=false},{passive:true});

    const views = { china: { p:[0,-32,132],t:[0,1,0] }, guangdong:{ p:[16,-22,66],t:[15,-17,0] } };
    document.querySelectorAll("[data-map-view]").forEach(button=>button.addEventListener("click",()=>{
      const view=views[button.dataset.mapView]; controls.autoRotate=false; document.querySelectorAll("[data-map-view]").forEach(x=>x.classList.toggle("active",x===button));
      if(window.gsap&&!reducedMotion){gsap.to(camera.position,{x:view.p[0],y:view.p[1],z:view.p[2],duration:1.45,ease:"power3.inOut"});gsap.to(controls.target,{x:view.t[0],y:view.t[1],z:view.t[2],duration:1.45,ease:"power3.inOut"})}else{camera.position.set(...view.p);controls.target.set(...view.t)}
    }));

    fit(renderer,camera,canvas); loading?.classList.add("is-ready");
    if(window.gsap&&window.ScrollTrigger&&!reducedMotion){gsap.registerPlugin(ScrollTrigger);gsap.to(group.scale,{x:1,y:1,z:1,duration:1.6,ease:"expo.out",scrollTrigger:{trigger:".region-map-3d",start:"top 82%"}});gsap.to(group.rotation,{z:0,duration:1.8,ease:"power3.out",scrollTrigger:{trigger:".region-map-3d",start:"top 82%"}})}
    observeScene(canvas,time=>{
      controls.update(); raycaster.setFromCamera(mouse,camera); const hit=raycaster.intersectObjects(meshes,false)[0]?.object||null;
      if(hit!==hovered){if(hovered) hovered.material.color.setHex(hovered.userData.baseColor); hovered=hit;if(hovered){hovered.material.color.offsetHSL(0,.06,.12);tooltip.hidden=false;tooltip.innerHTML=`<b>${hovered.userData.name}</b><small>${hovered.userData.isGuangdong?"英歌国家级项目重点区域":"拖拽旋转，点击聚焦广东"}</small>`}else tooltip.hidden=true}
      group.children.forEach(child=>{if(child.userData?.index!==undefined){const s=1+Math.sin(time*2.4+child.userData.index)*.14;child.children[1].scale.setScalar(s)}});
      renderer.render(scene,camera);
    },()=>fit(renderer,camera,canvas));
  } catch (error) {
    if (loading) loading.textContent = `地图暂时无法载入：${error.message}`;
  }
}

function initOfficialMap() {
  const canvas = document.querySelector("#official-map-webgl");
  if (!canvas) return;
  const stage = canvas.closest(".official-map-stage");
  const loading = document.querySelector("#official-map-loading");
  const renderer = rendererFor(canvas, true);
  renderer.setClearColor(0x09151e, 0);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x09151e, .012);
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 180);
  camera.position.set(0, 0, 78);
  scene.add(new THREE.HemisphereLight(0xeee7d8, 0x0b1d2a, 2.2));
  const key = new THREE.DirectionalLight(0xeee7d8, 4.8); key.position.set(-18, 26, 42); scene.add(key);
  const rim = new THREE.PointLight(0xa55d51, 120, 95); rim.position.set(28, -20, 30); scene.add(rim);

  const mapGroup = new THREE.Group();
  // Keep the official sheet north-up. OrbitControls is constrained below so
  // users can add a little depth without flipping the map upside down.
  mapGroup.rotation.set(0, 0, 0);
  scene.add(mapGroup);
  const width = 43, height = width * 8073 / 6849;
  const sideMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2320, roughness: .32, metalness: .48 });
  const backMaterial = new THREE.MeshStandardMaterial({ color: 0x0b1d2a, roughness: .42, metalness: .36 });
  let pulseRing = null;
  let markerAnchor = null;
  let mapAnnotation = null;

  const placeMapAnnotation = () => {
    if (!markerAnchor || !mapAnnotation) return;
    const point = markerAnchor.clone();
    mapGroup.localToWorld(point);
    point.project(camera);
    const x = (point.x * .5 + .5) * canvas.clientWidth;
    const y = (-point.y * .5 + .5) * canvas.clientHeight;
    const visible = point.z > -1 && point.z < 1 && x > -40 && x < canvas.clientWidth + 40 && y > -40 && y < canvas.clientHeight + 40;
    mapAnnotation.hidden = !visible;
    if (!visible) return;
    mapAnnotation.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    mapAnnotation.dataset.edge = x > canvas.clientWidth - 190 ? "left" : "right";
  };

  const attachOfficialTexture = async (image) => {
    // Keep the HTMLImageElement as the source. ImageBitmap uploads ignore
    // Texture.flipY in several browsers, which vertically mirrors this
    // official sheet (moving its legend from bottom-left to top-left).
    // Downsample the high-resolution official sheet only to the GPU limit.
    // This keeps Guangdong labels readable while avoiding oversized textures.
    const maxTextureSize = Math.min(renderer.capabilities.maxTextureSize || 4096, 4096);
    const scale = Math.min(1, maxTextureSize / Math.max(image.naturalWidth, image.naturalHeight));
    const source = document.createElement("canvas");
    source.width = Math.max(1, Math.round(image.naturalWidth * scale));
    source.height = Math.max(1, Math.round(image.naturalHeight * scale));
    source.getContext("2d").drawImage(image, 0, 0, source.width, source.height);
    const texture = new THREE.CanvasTexture(source);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = true;
    texture.needsUpdate = true;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const mapMaterial = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, 1.15),
      [sideMaterial, sideMaterial, sideMaterial, sideMaterial, mapMaterial, backMaterial]
    );
    board.castShadow = true; board.receiveShadow = true; mapGroup.add(board);

    const frame = new THREE.LineSegments(new THREE.EdgesGeometry(board.geometry), new THREE.LineBasicMaterial({ color: 0xc6a66b, transparent: true, opacity: .5 }));
    mapGroup.add(frame);
    // Calibrated to the hollow city marker beside 汕头 on GS(2023)2762.
    // Keep this as normalized sheet coordinates so the pin follows every zoom.
    const u = .746, v = .579, markerX = (u - .5) * width, markerY = (.5 - v) * height;
    markerAnchor = new THREE.Vector3(markerX, markerY, 1.2);
    const beacon = new THREE.Group(); beacon.position.copy(markerAnchor); mapGroup.add(beacon);
    pulseRing = new THREE.Mesh(new THREE.RingGeometry(.16, .22, 48), new THREE.MeshBasicMaterial({ color: 0xa55d51, side: THREE.DoubleSide, transparent: true, opacity: .58, depthWrite: false }));
    beacon.add(pulseRing);
    mapAnnotation = document.createElement("div");
    mapAnnotation.className = "map-annotation";
    mapAnnotation.setAttribute("role", "note");
    mapAnnotation.setAttribute("aria-label", "汕头，潮汕英歌重点区域");
    mapAnnotation.innerHTML = '<span class="map-annotation-reticle"></span><span class="map-annotation-leader"></span><span class="map-annotation-label"><b>汕头 · 潮汕英歌</b><small>官方图城市点校准</small></span>';
    canvas.parentElement?.append(mapAnnotation);
    placeMapAnnotation();
    stage?.classList.add("is-webgl-ready");
    loading?.classList.add("is-ready");
  };
  const officialImage = new Image();
  officialImage.onload = () => attachOfficialTexture(officialImage).catch(() => {
    if (loading) { loading.textContent = "三维纹理未载入，已保留官方标准地图原图"; loading.classList.add("is-error"); }
  });
  officialImage.onerror = () => {
    if (loading) { loading.textContent = "三维渲染未载入，已保留官方标准地图原图"; loading.classList.add("is-error"); }
  };
  officialImage.src = "./assets/china-standard-map-gs2023-2762.jpeg";

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = .055; controls.enablePan = true; controls.screenSpacePanning = true;
  controls.minDistance = 20; controls.maxDistance = 160;
  controls.minPolarAngle = Math.PI / 2 - .62; controls.maxPolarAngle = Math.PI / 2 + .62;
  controls.minAzimuthAngle = -.7; controls.maxAzimuthAngle = .7;
  controls.autoRotate = false;
  canvas.addEventListener("pointerdown", () => { controls.autoRotate = false; }, { passive: true });
  canvas.addEventListener("dblclick", () => {
    controls.target.set(0, 0, 0); camera.position.set(0, 0, 78); controls.autoRotate = false;
  });
  const views = { china: { p: [0, 0, 78], t: [0, 0, 0] }, guangdong: { p: [10.6, -4.0, 35], t: [10.6, -4.0, 0] } };
  document.querySelectorAll("[data-official-map-view]").forEach((button) => button.addEventListener("click", () => {
    const view = views[button.dataset.officialMapView]; if (!view) return; controls.autoRotate = false;
    if (window.gsap && !reducedMotion) {
      gsap.to(camera.position, { x: view.p[0], y: view.p[1], z: view.p[2], duration: 1.35, ease: "power3.inOut" });
      gsap.to(controls.target, { x: view.t[0], y: view.t[1], z: view.t[2], duration: 1.35, ease: "power3.inOut" });
    } else { camera.position.set(...view.p); controls.target.set(...view.t); }
  }));

  fit(renderer, camera, canvas);
  observeScene(canvas, (time) => {
    controls.update();
    if (pulseRing) {
      const cycle = (time * .72) % 1;
      pulseRing.scale.setScalar(.82 + cycle * 1.8);
      pulseRing.material.opacity = (1 - cycle) * .72;
    }
    placeMapAnnotation();
    renderer.render(scene, camera);
  }, () => fit(renderer, camera, canvas));
}

startScene("#hero-webgl", initHero);
lazyScene("#impact-webgl", initImpact);
lazyScene("#formation-webgl", initFormation);
lazyScene("#collection-webgl", initCollection);
lazyScene("#china-map-webgl", initMap);
lazyScene("#official-map-webgl", initOfficialMap);
