// Block Brawl v2 - three new stages: Sunny Loop Zone, Mushroom Castle, Neon Rooftops
import * as THREE from '../lib/three.module.min.js';
import { STAGES, STAGE_ORDER, Blocks, stdMat, lamMat, glowMat, skyDome, islandMainBody, speckle, mulberry, hash2, fbm, pix } from './stages.js';

let R = mulberry(5);
const P = {
  check: () => pix('check', (g, s) => { for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const a = ((x >> 3) + (y >> 3)) % 2; const v = Math.random() < 0.3 ? 12 : 0; g.fillStyle = a ? `rgb(${200 - v},${112 - v},${42})` : `rgb(${138 - v},${69 - v},${24})`; g.fillRect(x, y, 1, 1); } }),
  hillTop: () => pix('hillTop', (g, s) => speckle(g, s, '#3fcf3a', ['#52e04a', '#2fb52c', '#5ee854', '#36c232'])),
  hillSide: () => pix('hillSide', (g, s) => {
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const a = ((x >> 3) + (y >> 3)) % 2; g.fillStyle = a ? '#c8702a' : '#8a4518'; g.fillRect(x, y, 1, 1); }
    for (let x = 0; x < s; x++) { const d = 4 + ((x % 4) < 2 ? 1 : 0) + (x % 8 === 3 ? 1 : 0); for (let y = 0; y < d; y++) { g.fillStyle = y === d - 1 ? '#1f8a1c' : (Math.random() < 0.5 ? '#3fcf3a' : '#52e04a'); g.fillRect(x, y, 1, 1); } }
  }),
  brick: () => pix('brick', (g, s) => { speckle(g, s, '#c0602a', ['#b05424', '#cc6c34', '#a84c20']); g.fillStyle = '#3a1a08'; for (let y = 0; y < s; y += 4) { g.fillRect(0, y, s, 1); const o = (y / 4) % 2 ? 4 : 0; for (let x = o; x < s; x += 8) g.fillRect(x, y, 1, 4); } g.fillStyle = '#f0a070'; for (let y = 1; y < s; y += 4) for (let x = ((y >> 2) % 2 ? 5 : 1); x < s; x += 8) g.fillRect(x, y, 2, 1); }),
  floor: () => pix('floor', (g, s) => { speckle(g, s, '#d87a34', ['#c86c2a', '#e48a44']); g.fillStyle = '#5a2a0c'; g.fillRect(0, s - 1, s, 1); g.fillRect(s - 1, 0, 1, s); g.fillRect(0, 7, s, 1); g.fillRect(7, 0, 1, s); g.fillStyle = '#ffc890'; g.fillRect(0, 0, s, 1); g.fillRect(0, 8, s, 1); }),
  qblock: () => pix('qblock', (g, s) => {
    g.fillStyle = '#f8b020'; g.fillRect(0, 0, s, s); g.fillStyle = '#c86a00'; g.fillRect(0, s - 1, s, 1); g.fillRect(s - 1, 0, 1, s); g.fillStyle = '#ffe080'; g.fillRect(0, 0, s, 1); g.fillRect(0, 0, 1, s);
    g.fillStyle = '#5a2a00'; [[1, 1], [14, 1], [1, 14], [14, 14]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
    const q = ['..XXXX..', '.XX..XX.', '.XX..XX.', '....XX..', '...XX...', '...XX...', '........', '...XX...']; q.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'X') { g.fillStyle = '#7a3a00'; g.fillRect(x + 5, y + 4, 1, 1); g.fillStyle = '#fff4d0'; g.fillRect(x + 4, y + 3, 1, 1); } }));
  }),
  castle: () => pix('castle', (g, s) => { speckle(g, s, '#9a9aa6', ['#8a8a96', '#a8a8b4', '#7c7c88']); g.fillStyle = '#4a4a56'; for (let y = 0; y < s; y += 4) { g.fillRect(0, y, s, 1); const o = (y / 4) % 2 ? 4 : 0; for (let x = o; x < s; x += 8) g.fillRect(x, y, 1, 4); } }),
  roof: () => pix('roof', (g, s) => speckle(g, s, '#7a7c86', ['#6c6e78', '#868892', '#5e606a', '#8e909a'])),
  facade: () => pix('facade', (g, s) => { g.fillStyle = '#1a1c2a'; g.fillRect(0, 0, s, s); for (let y = 1; y < s; y += 4) for (let x = 1; x < s; x += 4) { g.fillStyle = '#0c0d16'; g.fillRect(x, y, 2, 2); } }, 16),
  facadeGlow: () => pix('facadeGlow', (g, s) => { g.fillStyle = '#000'; g.fillRect(0, 0, s, s); for (let y = 1; y < s; y += 4) for (let x = 1; x < s; x += 4) { if (Math.random() < 0.35) { g.fillStyle = ['#ffd890', '#fff0c0', '#90e0ff', '#ffb070'][Math.floor(Math.random() * 4)]; g.fillRect(x, y, 2, 2); } } }, 16),
  city: () => pix('city', (g, s) => { g.fillStyle = '#0d0f1c'; g.fillRect(0, 0, s, s); for (let y = 2; y < s; y += 4) for (let x = 1; x < s; x += 3) { if (Math.random() < 0.45) { g.fillStyle = ['#ffe0a0', '#fff4d0', '#a0e8ff', '#ffb080', '#ff90d0'][Math.floor(Math.random() * 5)]; g.fillRect(x, y, 2, 2); } } }, 32),
  metal: () => pix('metal', (g, s) => { speckle(g, s, '#8a929c', ['#7a828c', '#9aa2ac', '#6c747e']); g.fillStyle = '#4a5058'; g.fillRect(0, s - 1, s, 1); g.fillRect(0, 0, 1, s); }),
  hazard: () => pix('hazard', (g, s) => { for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { g.fillStyle = ((x + y) >> 2) % 2 ? '#ffcc00' : '#1a1a1a'; g.fillRect(x, y, 1, 1); } }),
  water: () => pix('seaW', (g, s) => speckle(g, s, '#1a7ad8', ['#2a8ae8', '#3aa0f0', '#1468c0', '#8ad0ff'])),
};
function rnd(a, b) { return a + R() * (b - a); }
function cloudsInstanced(group, color, n, yMin, yMax, zMin, zMax, round) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 32; const g = c.getContext('2d');
  g.fillStyle = '#fff';
  if (round) { for (const [x, y, r] of [[18, 20, 10], [32, 14, 13], [46, 20, 10], [26, 22, 9], [40, 22, 9]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } }
  else for (let i = 0; i < 9; i++) { const cx = 8 + R() * 48, cy = 12 + R() * 10, rw = 6 + R() * 12, rh = 3 + R() * 5; g.fillRect(Math.floor(cx - rw / 2), Math.floor(cy - rh / 2), Math.floor(rw), Math.floor(rh)); }
  const t = new THREE.CanvasTexture(c); t.magFilter = round ? THREE.LinearFilter : THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 0.5), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, color, fog: true }), n);
  const list = []; for (let i = 0; i < n; i++) list.push({ x: rnd(-170, 170), y: rnd(yMin, yMax), z: rnd(zMin, zMax), s: rnd(22, 50) });
  list.sort((a, b) => a.z - b.z);
  const m4 = new THREE.Matrix4();
  const place = () => { list.forEach((c, i) => { m4.makeScale(c.s, c.s, 1).setPosition(c.x, c.y, c.z); im.setMatrixAt(i, m4); }); im.instanceMatrix.needsUpdate = true; };
  place(); im.frustumCulled = false; im.renderOrder = -5; group.add(im);
  return dt => { for (const c of list) { c.x += dt * 1.6; if (c.x > 170) c.x = -170; } place(); };
}
function baseLayout(plats) {
  const main = { x0: -8, x1: 8, y: 0, top: 0, bottom: -5, soft: false, main: true };
  return { main, plats: [main, ...plats], blast: { x: 22, top: 16, bottom: -10 }, spawns: [[-5, 0.01], [5, 0.01], [-1.8, 0.01], [1.8, 0.01]] };
}
function warnSprite(color = '#ff3030') {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.fillStyle = color; g.beginPath(); g.moveTo(32, 4); g.lineTo(60, 58); g.lineTo(4, 58); g.closePath(); g.fill();
  g.lineWidth = 4; g.strokeStyle = '#000'; g.stroke(); g.fillStyle = '#000'; g.font = 'bold 34px Arial'; g.textAlign = 'center'; g.fillText('!', 32, 52);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true, toneMapped: false }));
  s.scale.setScalar(1.3); s.renderOrder = 25; s.visible = false; return s;
}
const sm = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });

// ============================================================== SUNNY LOOP ZONE
function buildLoop(scene) {
  R = mulberry(77);
  const group = new THREE.Group();
  const L = baseLayout([
    { x0: -6.6, x1: -2.8, y: 3.0, soft: true, bob: { base: 3.0, a: 0.55, sp: 0.9, ph: 0 } },
    { x0: 2.8, x1: 6.6, y: 3.0, soft: true, bob: { base: 3.0, a: 0.55, sp: 0.9, ph: Math.PI } },
    { x0: -2.0, x1: 2.0, y: 5.9, soft: true }]);
  const mats = {
    grass: [stdMat(P.hillSide()), stdMat(P.hillSide()), stdMat(P.hillTop(), { r: 0.8 }), stdMat(P.check()), stdMat(P.hillSide()), stdMat(P.hillSide())],
    check: stdMat(P.check()), stem: sm('#2a9a2a'), petal: sm('#ffd020', { roughness: 0.5 }), center: sm('#7a3a10'), trunk: sm('#a8682a'), leaf: sm('#2fbf3a', { roughness: 0.7 }), ring: sm('#ffd830', { metalness: 0.9, roughness: 0.2, emissive: '#604000' }),
  };
  const B = new Blocks();
  islandMainBody(B, 'grass', 'check', 'check', 'check', 9);
  // sunflowers + palm on back edge
  for (const fx of [-5.4, -1.2, 3.6]) { B.add('stem', fx, 0.6, -2.1, 0.12, 1.2, 0.12); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; B.add('petal', fx + Math.cos(a) * 0.28, 1.35 + Math.sin(a) * 0.28, -2.1, 0.2, 0.2, 0.06); } B.add('center', fx, 1.35, -2.05, 0.3, 0.3, 0.08); }
  B.build(group, mats, { shadows: true, cast: true });
  // palm tree
  const palm = new THREE.Group();
  for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.42 - i * 0.02, 0.62, 0.42 - i * 0.02), i % 2 ? mats.trunk : sm('#8a5220')); s.position.set(i * i * 0.012, 0.31 + i * 0.6, 0); s.rotation.z = -i * 0.03; s.castShadow = true; palm.add(s); }
  for (let i = 0; i < 6; i++) { const lf = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 0.5), mats.leaf); const a = i / 6 * Math.PI * 2; lf.position.set(0.55 + Math.cos(a) * 0.8, 4.3, Math.sin(a) * 0.8); lf.rotation.set(0, -a, -0.45); lf.castShadow = true; palm.add(lf); }
  palm.position.set(6.7, 0, -2.6); group.add(palm);
  const palm2 = palm.clone(); palm2.position.set(-7.4, 0, -3.2); palm2.scale.setScalar(0.8); palm2.rotation.y = 2; group.add(palm2);
  // bobbing platforms (grass chunks)
  const platMeshes = [];
  for (const p of L.plats.slice(1, 3)) {
    const PB = new Blocks(); const w = p.x1 - p.x0;
    for (let x = -w / 2 + 0.5; x <= w / 2 - 0.5 + 0.01; x++) for (let z = -1; z <= 1; z++) { PB.add('grass', x, -0.5, z); if (Math.abs(x) < w / 2 - 1) PB.add('check', x, -1.5, z, 1, 1, 1); }
    const pg = new THREE.Group(); PB.build(pg, mats, { shadows: true, cast: true }); pg.position.set((p.x0 + p.x1) / 2, p.y, 0); group.add(pg); platMeshes.push([p, pg]);
  }
  const TP = new Blocks(); const tp = L.plats[3];
  for (let x = tp.x0 + 0.5; x <= tp.x1 - 0.5 + 0.01; x++) for (let z = -1; z <= 1; z++) TP.add('grass', x, tp.y - 0.5, z);
  TP.build(group, mats, { shadows: true, cast: true });
  // spinning rings floating above top platform
  const ringGeo = new THREE.TorusGeometry(0.22, 0.05, 6, 16); const rings = [];
  for (let i = 0; i < 5; i++) { const r = new THREE.Mesh(ringGeo, mats.ring); r.position.set(-1.6 + i * 0.8, 7.3, -1.2); group.add(r); rings.push(r); }
  // ---- far: ocean, checker cliffs, giant loop
  const far = { grass: lamMat(P.hillTop()), check: lamMat(P.check(), { scale: 0.25 }), leaf: new THREE.MeshLambertMaterial({ color: '#2fbf3a' }), trunk: new THREE.MeshLambertMaterial({ color: '#a8682a' }) };
  const FT = new Blocks();
  for (let i = 0; i < 34; i++) {
    const x = rnd(-220, 220), z = rnd(-75, -220), w = rnd(6, 16), h = rnd(6, 26) * (1 + (-z - 75) / 160);
    if (Math.abs(x) < 40 && z > -110) continue;
    FT.add('check', x, -14 + h / 2, z, w, h, w); FT.add('grass', x, -14 + h + 0.6, z, w + 0.4, 1.2, w + 0.4);
    if (R() < 0.5) { FT.add('trunk', x, -14 + h + 3, z, 0.7, 5, 0.7); FT.add('leaf', x, -14 + h + 5.6, z, 5, 0.7, 5); }
  }
  const farG = new THREE.Group(); FT.build(farG, far, { shadows: false }); group.add(farG);
  const loopTex = P.check().clone(); loopTex.repeat.set(24, 2); loopTex.needsUpdate = true;
  const loop = new THREE.Mesh(new THREE.TorusGeometry(12, 2.2, 8, 40), new THREE.MeshLambertMaterial({ map: loopTex }));
  loop.position.set(-38, 4, -80); loop.rotation.y = 0.35; group.add(loop);
  const loopTop = new THREE.Mesh(new THREE.TorusGeometry(12, 2.25, 8, 40, Math.PI), new THREE.MeshLambertMaterial({ color: '#3fcf3a' })); loopTop.scale.set(1, 1, 0.2); loopTop.position.copy(loop.position); loopTop.rotation.y = 0.35; group.add(loopTop);
  const loopBase = new THREE.Mesh(new THREE.BoxGeometry(34, 12, 8), far.check); loopBase.position.set(-38, -14, -80); loopBase.rotation.y = 0.35; group.add(loopBase);
  const wtex = P.water().clone(); wtex.repeat.set(80, 50); wtex.needsUpdate = true;
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(600, 400), new THREE.MeshBasicMaterial({ map: wtex, color: new THREE.Color(0.95, 1.05, 1.2) }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -14; group.add(sea);
  const updClouds = cloudsInstanced(group, new THREE.Color('#ffffff'), 22, 14, 40, -90, -230, true);
  const sky = skyDome('#1650e0', '#a8e4ff', '#2a70d0', new THREE.Vector3(0.4, 0.5, -1), '#fff4c0', 0.9994, '#58a8ff'); group.add(sky);
  const hemi = new THREE.HemisphereLight('#bfe0ff', '#5a8a3a', 1.1);
  const key = new THREE.DirectionalLight('#fff6e0', 3.0); key.position.set(-8, 18, 12);
  const rim = new THREE.DirectionalLight('#9ad0ff', 1.5); rim.position.set(10, 8, -14);
  group.add(hemi, key, rim, key.target);
  scene.fog = new THREE.Fog('#a8e4ff', 60, 260);
  // hazard: rolling spike wheel
  const wheel = new THREE.Group();
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 14), sm('#5a5a66', { metalness: 0.8, roughness: 0.3 })); hub.rotation.x = Math.PI / 2; wheel.add(hub);
  const spikeM = sm('#e8e8f0', { metalness: 0.9, roughness: 0.2 });
  for (let i = 0; i < 10; i++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.4, 5), spikeM); const a = i / 10 * Math.PI * 2; sp.position.set(Math.cos(a) * 0.68, Math.sin(a) * 0.68, 0); sp.rotation.z = a - Math.PI / 2; wheel.add(sp); }
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.52, 10), sm('#ff3030', { emissive: '#600000' })); stripe.rotation.x = Math.PI / 2; wheel.add(stripe);
  wheel.traverse(o => { if (o.isMesh) o.castShadow = true; });
  wheel.visible = false; group.add(wheel);
  const warn = warnSprite(); group.add(warn);
  const H = { t: 10, state: 'idle', x: 0, dir: 1 };
  return {
    id: 'loop', name: 'SUNNY LOOP ZONE', group, ...L, key, bgColor: '#a8e4ff', envIntensity: 0.55, ambientFx: 'motes', exposure: 1.0,
    reset() { H.t = 10; H.state = 'idle'; wheel.visible = false; warn.visible = false; },
    update(t, dt) {
      for (const [p, pg] of platMeshes) { const ny = p.bob.base + Math.sin(t * p.bob.sp + p.bob.ph) * p.bob.a; p.dy = ny - p.y; p.y = ny; pg.position.y = ny; }
      rings.forEach((r, i) => { r.rotation.y = t * 3 + i * 0.4; r.position.y = 7.3 + Math.sin(t * 2 + i) * 0.1; });
      updClouds(dt); wtex.offset.x += dt * 0.02;
      if (H.state === 'roll') { wheel.position.x = H.x; wheel.rotation.z -= H.dir * dt * 13; }
    },
    hazardStep(game, t) {
      const dt = 1 / 60; H.t -= dt;
      if (H.state === 'idle' && H.t <= 0) { H.state = 'warn'; H.t = 1.4; H.dir = Math.random() < 0.5 ? 1 : -1; warn.position.set(-H.dir * 7.2, 1.6, 1); warn.visible = true; game.sfx('count'); }
      else if (H.state === 'warn') { warn.visible = (H.t * 6 % 1) < 0.6; if (H.t <= 0) { H.state = 'roll'; warn.visible = false; H.x = -H.dir * 11; wheel.position.set(H.x, 0.75, 0); wheel.visible = true; game.sfx('rush'); } }
      else if (H.state === 'roll') {
        H.x += H.dir * 10 * dt;
        if (game.frame % 3 === 0 && Math.abs(H.x) < 8) game.fx.dust(H.x, 0, 2);
        for (const f of game.fighters) if (Math.abs(f.x - H.x) < 0.75 + f.w * 0.5 && f.y < 1.5 && f.y + f.h > 0.1) game.hazardHit(f, { dmg: 13, kb: 8, g: 1.15, a: 55, r: 0.8 }, H.x, 0.75, H.dir);
        if (Math.abs(H.x) > 12) { H.state = 'idle'; H.t = 11 + Math.random() * 5; wheel.visible = false; }
      }
    },
  };
}

// ============================================================== MUSHROOM CASTLE
function buildCastle(scene) {
  R = mulberry(31);
  const group = new THREE.Group();
  const L = baseLayout([
    { x0: -6.6, x1: -3.0, y: 3.0, soft: true },
    { x0: 3.0, x1: 6.6, y: 3.0, soft: true },
    { x0: -2.0, x1: 2.0, y: 5.6, soft: true, qblocks: true }]);
  const mats = {
    floor: [stdMat(P.brick()), stdMat(P.brick()), stdMat(P.floor(), { r: 0.75 }), stdMat(P.brick()), stdMat(P.brick()), stdMat(P.brick())],
    brick: stdMat(P.brick(), { r: 0.8 }), stone: stdMat(P.castle()), q: stdMat(P.qblock(), { r: 0.4, env: 1 }),
  };
  const B = new Blocks();
  islandMainBody(B, 'floor', 'brick', 'brick', 'stone', 8);
  B.build(group, mats, { shadows: true, cast: true });
  const PL = new Blocks();
  for (const p of L.plats.slice(1, 3)) for (let x = p.x0 + 0.5; x <= p.x1 - 0.5 + 0.01; x++) PL.add('brick', x, p.y - 0.5, 0, 1, 1, 1.4);
  PL.build(group, mats, { shadows: true, cast: true });
  // question blocks (individual meshes so they can bump)
  const qGeo = new THREE.BoxGeometry(1, 1, 1.4); const qBlocks = [];
  const tp = L.plats[3];
  for (let x = tp.x0 + 0.5; x <= tp.x1 - 0.5 + 0.01; x++) { const m = new THREE.Mesh(qGeo, mats.q); m.position.set(x, tp.y - 0.5, 0); m.castShadow = m.receiveShadow = true; group.add(m); qBlocks.push({ m, x, cd: 0, bump: 0 }); }
  // pipes
  const pipeM = sm('#2ec040', { roughness: 0.3, metalness: 0.1 }), pipeD = sm('#1a8a28', { roughness: 0.35 });
  const pipe = (x, z, h, s = 1) => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.55 * s, 0.55 * s, h, 16), pipeM); b.position.y = h / 2; const t = new THREE.Mesh(new THREE.CylinderGeometry(0.7 * s, 0.7 * s, 0.5 * s, 16), pipeM); t.position.y = h + 0.25 * s; const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * s, 0.5 * s, 0.02, 16), new THREE.MeshBasicMaterial({ color: '#031a06' })); hole.position.y = h + 0.51 * s; const hl = new THREE.Mesh(new THREE.BoxGeometry(0.12 * s, h, 0.12 * s), pipeD); hl.position.set(-0.3 * s, h / 2, 0.42 * s); g.add(b, t, hole, hl); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.position.set(x, 0, z); return g; };
  group.add(pipe(-7.0, -2.4, 1.3), pipe(6.9, -2.5, 2.0));
  // decor mushrooms
  for (const [x, z, s, c] of [[-4.4, -2.4, 0.6, '#e82838'], [2.4, -2.5, 0.45, '#2a9a3a']]) { const cap = new THREE.Mesh(new THREE.SphereGeometry(s, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), sm(c)); cap.position.set(x, s * 0.9, z); const st = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.4, s * 0.5, s * 0.9, 10), sm('#f4e8d0')); st.position.set(x, s * 0.45, z); group.add(cap, st); }
  // fire bars on outer platform ends
  const fireM = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 1.3, 0.3), toneMapped: false });
  const bars = [];
  for (const [px, dir] of [[-6.4, 1], [6.4, -1]]) {
    const g = new THREE.Group(); g.position.set(px, 2.6, 0.2);
    const balls = []; for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), fireM); b.position.x = i * 0.42; g.add(b); balls.push(b); }
    const pivot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mats.stone); g.add(pivot);
    group.add(g); bars.push({ g, dir, ang: dir > 0 ? 0 : Math.PI });
  }
  // ---- far: castle + hills
  const far = { stone: lamMat(P.castle(), { scale: 0.35 }), roof: new THREE.MeshLambertMaterial({ color: '#c83030' }), door: new THREE.MeshBasicMaterial({ color: '#100808' }), hill: new THREE.MeshLambertMaterial({ color: '#3cb84a' }), hill2: new THREE.MeshLambertMaterial({ color: '#2a9a3a' }), win: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.8, 0.9), toneMapped: false }) };
  const FT = new Blocks();
  const cx = 10, cz = -120;
  FT.add('stone', cx, -2, cz, 36, 26, 14);
  for (let x = -18; x <= 18; x += 3) FT.add('stone', cx + x, 12, cz + 6, 1.6, 2, 2);
  for (const [tx, th, tw] of [[-18, 34, 7], [18, 34, 7], [0, 46, 9], [-9, 28, 5], [9, 28, 5]]) {
    FT.add('stone', cx + tx, -15 + th / 2, cz + 2, tw, th, tw);
    for (let k = -1; k <= 1; k++) FT.add('stone', cx + tx + k * tw * 0.36, -15 + th + 1, cz + 2 + tw / 2 - 0.5, tw * 0.22, 2, 1);
    FT.add('win', cx + tx, -15 + th * 0.75, cz + 2 + tw / 2 + 0.05, 1.2, 2.2, 0.1);
  }
  FT.add('door', cx, -9, cz + 7.05, 6, 9, 0.1);
  const farG = new THREE.Group(); FT.build(farG, far, { shadows: false }); group.add(farG);
  for (const [tx, th, tw] of [[-18, 34, 7], [18, 34, 7], [0, 46, 9], [-9, 28, 5], [9, 28, 5]]) { const cone = new THREE.Mesh(new THREE.ConeGeometry(tw * 0.75, tw * 1.3, 8), far.roof); cone.position.set(cx + tx, -15 + th + 2 + tw * 0.65, cz + 2); group.add(cone); }
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.4), new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide })); flag.position.set(cx + 2.2, 46 - 15 + 2 + 9 * 1.3 + 2, cz + 2); group.add(flag);
  for (let i = 0; i < 16; i++) { const r = rnd(10, 30); const h = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), R() < 0.5 ? far.hill : far.hill2); h.position.set(rnd(-190, 190), -16, rnd(-40, -150)); h.scale.y = rnd(0.6, 1.3); if (Math.abs(h.position.x - cx) < 30 && h.position.z < cz) continue; group.add(h); }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 400), new THREE.MeshLambertMaterial({ color: '#4ac850' })); ground.rotation.x = -Math.PI / 2; ground.position.y = -16; group.add(ground);
  for (const [x, z, h] of [[-30, -40, 6], [34, -46, 9], [-60, -80, 12], [70, -90, 8]]) { const p = pipe(x, z, h, 3); p.position.y = -16; group.add(p); }
  const updClouds = cloudsInstanced(group, new THREE.Color('#ffffff'), 18, 18, 40, -80, -220, true);
  const sky = skyDome('#3c78f0', '#9ccaff', '#4a8ae0', new THREE.Vector3(-0.3, 0.6, -1), '#fffbe0', 0.9995, '#6ca4ff'); group.add(sky);
  const hemi = new THREE.HemisphereLight('#cfe4ff', '#6a5a3a', 1.1);
  const key = new THREE.DirectionalLight('#fff4e0', 2.9); key.position.set(-7, 17, 12);
  const rim = new THREE.DirectionalLight('#ffd0a0', 1.4); rim.position.set(10, 6, -16);
  group.add(hemi, key, rim, key.target);
  scene.fog = new THREE.Fog('#a8d0ff', 60, 250);
  const coins = [];
  return {
    id: 'castle', name: 'MUSHROOM CASTLE', group, ...L, key, bgColor: '#9ccaff', envIntensity: 0.5, ambientFx: null, exposure: 1.0,
    reset() { for (const q of qBlocks) { q.cd = 0; q.bump = 0; } for (const c of coins) group.remove(c.m); coins.length = 0; },
    update(t, dt) {
      updClouds(dt); flag.rotation.y = Math.sin(t * 2) * 0.25;
      for (const q of qBlocks) { if (q.bump > 0) q.bump -= dt * 5; q.m.position.y = tp.y - 0.5 + Math.max(0, Math.sin(Math.max(0, q.bump) * Math.PI)) * 0.3; q.m.material = mats.q; }
      for (let i = coins.length - 1; i >= 0; i--) { const c = coins[i]; c.t += dt; c.m.position.y += (6 - c.t * 14) * dt; c.m.rotation.y += dt * 14; if (c.t > 0.7) { group.remove(c.m); coins.splice(i, 1); } }
    },
    tick(game) {
      for (const f of game.fighters) {
        if (f.state === 'dead' || f.vy <= 2) continue;
        const head = f.y + f.h, prevHead = head - f.vy / 60;
        const by = tp.y - 1;
        if (prevHead <= by && head > by - 0.05 && f.x > tp.x0 && f.x < tp.x1) {
          const q = qBlocks.reduce((a, b) => Math.abs(b.x - f.x) < Math.abs(a.x - f.x) ? b : a);
          if (q.bump <= 0) {
            q.bump = 1; game.sfx('coin');
            const cm = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.06, 14), sm('#ffd020', { metalness: 0.9, roughness: 0.2, emissive: '#806000' })); cm.rotation.x = Math.PI / 2; cm.position.set(q.x, tp.y + 0.3, 0); group.add(cm); coins.push({ m: cm, t: 0 });
            if (game.frame > q.cd) { q.cd = game.frame + 60 * 9; if (game.items && game.items.cfg.freq !== 'off' && Math.random() < 0.35) game.items.spawn(game.items.randomType(), q.x, tp.y + 0.4, (Math.random() - 0.5) * 3, 7); }
            f.vy = Math.min(f.vy, 1);
          }
        }
      }
    },
    hazardStep(game, t) {
      for (const b of bars) {
        b.ang += b.dir * 1.15 / 60; b.g.rotation.z = b.ang;
        const ca = Math.cos(b.ang), sa = Math.sin(b.ang);
        if (game.frame % 2 === 0) game.fx.fire(b.g.position.x + ca * 1.7, b.g.position.y + sa * 1.7, 0.3, 1, 0.5);
        for (const f of game.fighters) for (let i = 1; i < 5; i++) {
          const x = b.g.position.x + ca * i * 0.42, y = b.g.position.y + sa * i * 0.42;
          const cx = Math.max(f.x - f.w / 2, Math.min(x, f.x + f.w / 2)), cy = Math.max(f.y, Math.min(y, f.y + f.h));
          if ((x - cx) ** 2 + (y - cy) ** 2 < 0.09) { game.hazardHit(f, { dmg: 9, kb: 6.5, g: 0.85, a: 70, r: 0.3 }, x, y, Math.sign(f.x - b.g.position.x) || 1); break; }
        }
      }
    },
  };
}

// ============================================================== NEON ROOFTOPS
function neonSignTex(text, col) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
  g.font = 'italic 900 46px "Arial Black", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = col; g.shadowBlur = 14; g.fillStyle = col; g.fillText(text, 128, 34); g.shadowBlur = 0; g.fillStyle = '#ffffff'; g.globalAlpha = 0.85; g.fillText(text, 128, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function buildRooftops(scene) {
  R = mulberry(909);
  const group = new THREE.Group();
  const L = baseLayout([
    { x0: -6.8, x1: -3.4, y: 2.2, soft: true, elev: { lo: 1.6, hi: 5.6, sp: 0.55 } },
    { x0: 3.0, x1: 6.8, y: 3.0, soft: true },
    { x0: -1.8, x1: 1.8, y: 6.0, soft: true, move: { ax: 3.2, sp: 0.42, x0c: -1.8, x1c: 1.8 } }]);
  const facM = new THREE.MeshStandardMaterial({ map: P.facade(), emissiveMap: P.facadeGlow(), emissive: new THREE.Color(1.6, 1.6, 1.6), roughness: 0.8 });
  const mats = {
    roof: [stdMat(P.metal()), stdMat(P.metal()), stdMat(P.roof(), { r: 0.85 }), stdMat(P.roof()), stdMat(P.metal()), stdMat(P.metal())],
    fac: facM, metal: stdMat(P.metal(), { r: 0.4, m: 0.7, env: 1 }), haz: stdMat(P.hazard(), { r: 0.6 }), dark: sm('#22242e', { metalness: 0.5, roughness: 0.5 }),
  };
  const B = new Blocks();
  for (let x = -7.5; x <= 7.5; x++) for (let z = -2; z <= 2; z++) B.add('roof', x, -0.5, z);
  for (let x = -7.5; x <= 7.5; x++) B.add('haz', x, -0.08, 2.05, 1, 0.16, 0.12);
  // rooftop props
  B.add('metal', -5.8, 0.5, -2.1, 1.6, 1.0, 0.9); B.add('dark', -5.8, 0.75, -1.62, 1.0, 0.5, 0.05);
  B.add('metal', 4.4, 0.4, -2.2, 1.2, 0.8, 0.8);
  B.build(group, mats, { shadows: true, cast: true });
  { const fm = P.facade().clone(), fg = P.facadeGlow().clone(); for (const t of [fm, fg]) { t.repeat.set(4, 5.5); t.needsUpdate = true; }
    const facade = new THREE.Mesh(new THREE.BoxGeometry(16, 22, 5), new THREE.MeshStandardMaterial({ map: fm, emissiveMap: fg, emissive: new THREE.Color(0.7, 0.7, 0.7), roughness: 0.8 }));
    facade.position.set(0, -12, 0); facade.receiveShadow = true; group.add(facade); }
  // water tower + antenna
  const wt = new THREE.Group();
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.8, 14), sm('#6a4a34', { roughness: 0.9 })); tank.position.y = 2.9;
  const capM = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.7, 14), sm('#3a2a20')); capM.position.y = 4.15; wt.add(tank, capM);
  for (const [lx, lz] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.0, 0.12), mats.dark); leg.position.set(lx, 1.0, lz); wt.add(leg); }
  wt.position.set(-2.2, 0, -3.4); wt.traverse(o => { if (o.isMesh) o.castShadow = true; }); group.add(wt);
  const ant = new THREE.Mesh(new THREE.BoxGeometry(0.1, 5, 0.1), mats.dark); ant.position.set(6.6, 2.5, -2.4); group.add(ant);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.3, 0.3), toneMapped: false })); beacon.position.set(6.6, 5.05, -2.4); group.add(beacon);
  // neon sign on rooftop back
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.3), new THREE.MeshBasicMaterial({ map: neonSignTex('BRAWL', '#ff3ac8'), transparent: true, toneMapped: false, color: new THREE.Color(1.8, 1.8, 1.8), depthWrite: false }));
  sign.position.set(2.0, 2.4, -2.9); group.add(sign);
  const signFrame = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.1, 0.1), mats.dark); signFrame.position.set(2.0, 1.65, -2.95); group.add(signFrame);
  for (const lx of [0, 4]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.7, 0.1), mats.dark); p.position.set(lx, 0.85, -2.95); group.add(p); }
  // platforms: elevator gondola (left), catwalk (right), drone (top)
  const elev = L.plats[1], cat = L.plats[2], drone = L.plats[3];
  const gond = new THREE.Group();
  { const GB = new Blocks(); for (let x = -1.5; x <= 1.5; x++) GB.add('metal', x, -0.15, 0, 1, 0.3, 1.6); GB.add('haz', 0, -0.36, 0.81, 3.4, 0.14, 0.04); GB.add('dark', -1.7, 0.4, 0, 0.08, 0.8, 1.6); GB.add('dark', 1.7, 0.4, 0, 0.08, 0.8, 1.6); GB.add('dark', 0, 0.8, -0.8, 3.4, 0.08, 0.08); GB.build(gond, mats, { shadows: true, cast: true }); }
  const cableM = new THREE.MeshBasicMaterial({ color: '#202430' });
  const cables = [-1.6, 1.6].map(cx2 => { const c = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1, 0.04), cableM); group.add(c); return [cx2, c]; });
  gond.position.set((elev.x0 + elev.x1) / 2, elev.y, 0); group.add(gond);
  { const CB = new Blocks(); for (let x = cat.x0 + 0.5; x <= cat.x1 - 0.5 + 0.01; x++) CB.add('metal', x, cat.y - 0.12, 0, 1, 0.24, 1.6); CB.add('dark', cat.x1 - 0.1, cat.y - 1.6, -0.6, 0.12, 3.0, 0.12); CB.add('dark', cat.x0 + 0.3, cat.y - 1.6, -0.6, 0.12, 3.0, 0.12); CB.build(group, mats, { shadows: true, cast: true }); }
  const droneG = new THREE.Group();
  { const DB = new Blocks(); for (let x = -1.5; x <= 1.5; x++) DB.add('dark', x, -0.15, 0, 1, 0.3, 1.6); DB.add('metal', 0, -0.5, 0, 1.6, 0.4, 1.0); DB.build(droneG, mats, { shadows: true, cast: true }); }
  const lightBar = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 2.5, 3.2), toneMapped: false })); lightBar.position.set(0, -0.3, 0.82); droneG.add(lightBar);
  const props = []; for (const px of [-1.7, 1.7]) { const pr = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.03, 0.12), mats.dark); pr.position.set(px, 0.15, 0); droneG.add(pr); props.push(pr); }
  droneG.position.set(0, drone.y, 0); group.add(droneG);
  // ---- skyline
  const cityTex = P.city(); const cityMat = new THREE.MeshBasicMaterial({ map: cityTex, color: new THREE.Color(0.8, 0.8, 0.95) });
  const bGeo = new THREE.BoxGeometry(1, 1, 1);
  const N = 90, bIM = new THREE.InstancedMesh(bGeo, cityMat, N); const m4 = new THREE.Matrix4();
  // per-instance UV scaling via onBeforeCompile (world UV)
  cityMat.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP2; varying vec3 vN2;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vec4 w2 = modelMatrix * instanceMatrix * vec4(transformed,1.0); vWP2 = w2.xyz; vN2 = normal;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP2; varying vec3 vN2;').replace('#include <map_fragment>', 'vec2 cuv = abs(vN2.x) > 0.5 ? vWP2.zy : vWP2.xy; vec4 tc = texture2D(map, cuv / 8.0); if (vN2.y > 0.5) tc = vec4(0.03,0.035,0.06,1.0); diffuseColor *= tc;');
  };
  const neon = []; const neonCols = ['#ff3ac8', '#3af0ff', '#ffe03a', '#8a5cff', '#ff6a3a'];
  for (let i = 0; i < N; i++) {
    const far2 = i > 40, x = rnd(-160, 160), z = far2 ? rnd(-120, -200) : rnd(-55, -115), w = rnd(7, 16), d = rnd(7, 14), h = (far2 ? rnd(40, 110) : rnd(18, 60));
    m4.makeScale(w, h, d).setPosition(x, -30 + h / 2, z); bIM.setMatrixAt(i, m4);
    if (!far2 && R() < 0.45) neon.push([x + rnd(-w / 3, w / 3), -30 + h * rnd(0.55, 0.9), z + d / 2 + 0.2, rnd(3, 7), rnd(0.5, 1.2), neonCols[Math.floor(R() * neonCols.length)]]);
    if (far2 && R() < 0.3) neon.push([x, -30 + h + 1.5, z, 0.5, 0.5, '#ff2020']);
  }
  bIM.frustumCulled = false; group.add(bIM);
  const NB = new Blocks(); const nm = {};
  neon.forEach(([x, y, z, w, h, c], i) => { if (!nm[c]) nm[c] = new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(2.4), toneMapped: false }); NB.add(c, x, y, z, w, h, 0.2); });
  NB.build(group, nm, { shadows: false });
  // street glow + moon + stars
  const glowPlane = new THREE.Mesh(new THREE.PlaneGeometry(700, 50), new THREE.MeshBasicMaterial({ color: '#ff5a9a', transparent: true, opacity: 0.22, depthWrite: false, fog: false })); glowPlane.position.set(0, -20, -200); group.add(glowPlane);
  const moonC = document.createElement('canvas'); moonC.width = moonC.height = 128; { const g = moonC.getContext('2d'); const gr = g.createRadialGradient(64, 64, 20, 64, 64, 64); gr.addColorStop(0, 'rgba(255,250,230,1)'); gr.addColorStop(0.42, 'rgba(255,245,220,1)'); gr.addColorStop(0.46, 'rgba(180,200,255,.35)'); gr.addColorStop(1, 'rgba(120,140,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(moonC), fog: false, toneMapped: false, color: new THREE.Color(1.4, 1.4, 1.4), depthWrite: false })); moon.scale.setScalar(40); moon.position.set(60, 70, -300); group.add(moon);
  const starG = new THREE.BufferGeometry(); const sp = []; for (let i = 0; i < 500; i++) { const v = new THREE.Vector3(rnd(-1, 1), rnd(0.08, 1), -rnd(0.3, 1)).normalize().multiplyScalar(350); sp.push(v.x, v.y, v.z); }
  starG.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  group.add(new THREE.Points(starG, new THREE.PointsMaterial({ color: '#dfe8ff', size: 1.4, sizeAttenuation: false, fog: false })));
  // flying cars
  const cars = []; const carM = [new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.6, 1.6), toneMapped: false }), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 0.4, 0.4), toneMapped: false })];
  for (let i = 0; i < 14; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 0.3), carM[i % 2]); c.position.set(rnd(-150, 150), rnd(4, 30), rnd(-40, -120)); c.userData.v = (i % 2 ? -1 : 1) * rnd(8, 20); group.add(c); cars.push(c); }
  const sky = skyDome('#04040e', '#2a1648', '#140a24', new THREE.Vector3(0, -1, 0), '#000000', 2.0, '#100a2a'); group.add(sky);
  const hemi = new THREE.HemisphereLight('#5a6aff', '#ff3a8a', 0.75);
  const key = new THREE.DirectionalLight('#c8d4ff', 2.0); key.position.set(-8, 16, 12);
  const pink = new THREE.DirectionalLight('#ff3ac8', 2.6); pink.position.set(12, 4, -10);
  const cyan = new THREE.DirectionalLight('#3af0ff', 1.8); cyan.position.set(-12, 3, -8);
  const fill = new THREE.PointLight('#ff5ad0', 12, 9, 1.6); fill.position.set(2, 2.6, -2.2);
  group.add(hemi, key, pink, cyan, fill, key.target);
  scene.fog = new THREE.Fog('#160c2a', 40, 220);
  // hazard: electric zap column
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 4.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 0.3, 0.3), transparent: true, opacity: 0.5, toneMapped: false, depthWrite: false }));
  strip.rotation.x = -Math.PI / 2; strip.position.y = 0.02; strip.visible = false; group.add(strip);
  const bolt = new THREE.Group();
  const boltM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 2.6, 4), toneMapped: false, transparent: true, opacity: 0.95, depthWrite: false });
  for (let i = 0; i < 8; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.2, 0.22), boltM); s.position.set(((i * 7919) % 5 - 2) * 0.12, i * 2 + 1, 0); s.rotation.z = (i % 2 ? 1 : -1) * 0.25; bolt.add(s); }
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 16, 10, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 1.2, 2.6), transparent: true, opacity: 0.35, toneMapped: false, depthWrite: false, side: THREE.DoubleSide })); core.position.y = 8; bolt.add(core);
  bolt.visible = false; group.add(bolt);
  const Z = { t: 9, state: 'idle', x: 0 };
  return {
    id: 'rooftops', name: 'NEON ROOFTOPS', group, ...L, key, bgColor: '#160c2a', envIntensity: 0.35, ambientFx: 'neon', exposure: 1.15,
    reset() { Z.t = 9; Z.state = 'idle'; strip.visible = bolt.visible = false; drone.cx = 0; },
    update(t, dt) {
      const k = (Math.sin(t * elev.elev.sp) + 1) / 2, ny = elev.elev.lo + (elev.elev.hi - elev.elev.lo) * k;
      elev.dy = ny - elev.y; elev.y = ny; gond.position.y = ny;
      for (const [cx2, c] of cables) { const top = 16, bot = ny + 0.8; c.position.set(gond.position.x + cx2, (top + bot) / 2, -0.8); c.scale.y = top - bot; }
      const nx = Math.sin(t * drone.move.sp) * drone.move.ax; drone.dx = nx - (drone.cx ?? 0); drone.cx = nx; drone.x0 = drone.move.x0c + nx; drone.x1 = drone.move.x1c + nx;
      droneG.position.set(nx, drone.y + Math.sin(t * 3) * 0.02, 0); for (const p of props) p.rotation.y = t * 40;
      beacon.visible = (t % 1.5) < 0.2;
      sign.material.opacity = (Math.sin(t * 23) > 0.96 || (t % 7) < 0.15) ? 0.35 : 1;
      for (const c of cars) { c.position.x += c.userData.v * dt; if (c.position.x > 160) c.position.x = -160; if (c.position.x < -160) c.position.x = 160; }
    },
    hazardStep(game, t) {
      const dt = 1 / 60; Z.t -= dt;
      if (Z.state === 'idle' && Z.t <= 0) {
        const live = game.fighters.filter(f => f.state !== 'dead' && f.grounded && f.plat && f.plat.main);
        Z.x = live.length ? live[Math.floor(Math.random() * live.length)].x : (Math.random() - 0.5) * 12; Z.x = Math.max(-7, Math.min(7, Z.x));
        Z.state = 'warn'; Z.t = 1.3; strip.position.x = Z.x; strip.visible = true; game.sfx('fuse');
      } else if (Z.state === 'warn') {
        strip.material.opacity = 0.25 + 0.45 * ((Z.t * 8 % 1) < 0.5 ? 1 : 0);
        if (game.frame % 6 === 0) game.fx.spawn(Z.x + (Math.random() - 0.5) * 1.6, 0.1, 0.3, 0, 3, 0, 0.6, 1.4, 3, 0.3, 0.25, 0, 0, -1);
        if (Z.t <= 0) { Z.state = 'zap'; Z.t = 0.28; strip.visible = false; bolt.visible = true; bolt.position.x = Z.x; game.sfx('zap'); game.shake(0.8); game.fx.burst(Z.x, 0.3, 0.3, '#80c8ff', 40, 12, 0.5, 0.4); game.fx.ring(Z.x, 0.1, 0, 3, 0.35, '#80c8ff', true); }
      } else if (Z.state === 'zap') {
        bolt.children.forEach((s, i) => { s.position.x = (Math.random() - 0.5) * 0.4; s.rotation.z = (Math.random() - 0.5) * 0.7; });
        for (const f of game.fighters) if (Math.abs(f.x - Z.x) < 0.8 + f.w * 0.5 && f.y < 4.5) game.hazardHit(f, { dmg: 15, kb: 9, g: 1.15, a: 80, r: 1 }, Z.x, f.y + 0.5, Math.sign(f.x - Z.x) || 1);
        if (Z.t <= 0) { Z.state = 'idle'; Z.t = 9 + Math.random() * 5; bolt.visible = false; }
      }
    },
  };
}

STAGES.loop = { name: 'SUNNY LOOP ZONE', build: buildLoop, sub: 'Checkered cliffs by the sea', hazard: 'Rolling spike wheel' };
STAGES.castle = { name: 'MUSHROOM CASTLE', build: buildCastle, sub: 'Brick fort with ? blocks', hazard: 'Rotating fire bars' };
STAGES.rooftops = { name: 'NEON ROOFTOPS', build: buildRooftops, sub: 'Night city skyline', hazard: 'Electric sign zaps' };
STAGES.overworld.hazard = 'None'; STAGES.nether.hazard = 'Moving platform';
STAGE_ORDER.push('loop', 'castle', 'rooftops');
