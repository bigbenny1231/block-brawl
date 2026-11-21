// Block Brawl - stages: procedural voxel worlds
import * as THREE from 'three';

// ---------- seeded random + noise
function mulberry(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
let R = mulberry(1337);
function hash2(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { s += a * vnoise(x * f, y * f); f *= 2; a *= 0.5; } return s; }

// ---------- pixel textures
const texCache = {};
function pix(name, fn, size = 16) {
  if (texCache[name]) return texCache[name];
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  R = mulberry(name.length * 977 + name.charCodeAt(0) * 31);
  fn(g, size);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter;
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  texCache[name] = t; return t;
}
function speckle(g, s, base, vars) {
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const v = vars[Math.floor(R() * vars.length)] || base;
    g.fillStyle = R() < 0.55 ? base : v; g.fillRect(x, y, 1, 1);
  }
}
const T = {
  grassTop: () => pix('grassTop', (g, s) => speckle(g, s, '#5fa83a', ['#6cbc44', '#4f9530', '#79c84f', '#58a034'])),
  grassSide: () => pix('grassSide', (g, s) => {
    speckle(g, s, '#866043', ['#6f4e35', '#97704f', '#7a573c', '#5e4330']);
    for (let x = 0; x < s; x++) { const d = 3 + Math.floor(R() * 3); for (let y = 0; y < d; y++) { g.fillStyle = ['#5fa83a', '#6cbc44', '#4f9530'][Math.floor(R() * 3)]; g.fillRect(x, y, 1, 1); } }
  }),
  dirt: () => pix('dirt', (g, s) => speckle(g, s, '#866043', ['#6f4e35', '#97704f', '#7a573c', '#5e4330'])),
  stone: () => pix('stone', (g, s) => { speckle(g, s, '#7f7f83', ['#707075', '#8c8c90', '#68686c', '#929296']); for (let i = 0; i < 6; i++) { g.fillStyle = '#5c5c60'; g.fillRect(Math.floor(R() * s), Math.floor(R() * s), 2, 1); } }),
  snow: () => pix('snow', (g, s) => speckle(g, s, '#eef4fb', ['#ffffff', '#dbe6f2', '#e4edf7'])),
  log: () => pix('log', (g, s) => { for (let x = 0; x < s; x++) for (let y = 0; y < s; y++) { g.fillStyle = (x % 4 === 0 || R() < 0.15) ? '#4a3420' : (R() < 0.5 ? '#6b4b2c' : '#5d4127'); g.fillRect(x, y, 1, 1); } }),
  leaves: () => pix('leaves', (g, s) => speckle(g, s, '#2f7a24', ['#256a1c', '#3b8f2c', '#1d5a16', '#45a034'])),
  planks: () => pix('planks', (g, s) => { speckle(g, s, '#b08a52', ['#a07a45', '#bd9860', '#9c7440']); g.fillStyle = '#6e5230'; for (let y = 3; y < s; y += 4) g.fillRect(0, y, s, 1); for (let y = 0; y < s; y += 4) g.fillRect(((y / 4) % 2) * 8 + 4, y, 1, 3); }),
  netherrack: () => pix('netherrack', (g, s) => speckle(g, s, '#6e2424', ['#5a1a1c', '#7d2b2b', '#4c1416', '#8a3430'])),
  netherBrick: () => pix('netherBrick', (g, s) => {
    speckle(g, s, '#3b1a1f', ['#44202a', '#331418', '#4a2228']);
    g.fillStyle = '#1c0b0e';
    for (let y = 0; y < s; y += 4) { g.fillRect(0, y, s, 1); const off = (y / 4) % 2 ? 4 : 0; for (let x = off; x < s; x += 8) g.fillRect(x, y, 1, 4); }
  }),
  blackstone: () => pix('blackstone', (g, s) => { speckle(g, s, '#2a2630', ['#221f28', '#332e3a', '#1b1820', '#3a3442']); }),
  gold: () => pix('gold', (g, s) => { speckle(g, s, '#f5c542', ['#ffd75e', '#e8b42e', '#fff08a']); g.fillStyle = '#c9921a'; g.fillRect(0, s - 1, s, 1); g.fillRect(s - 1, 0, 1, s); g.fillStyle = '#fff6b0'; g.fillRect(0, 0, s, 1); g.fillRect(0, 0, 1, s); }),
  glowstone: () => pix('glowstone', (g, s) => speckle(g, s, '#e8b04a', ['#ffe08a', '#c8842a', '#fff0b0', '#a86a20'])),
  lava: () => pix('lava', (g, s) => speckle(g, s, '#ff7a14', ['#ffb030', '#e85a0a', '#ffd060', '#d84800'])),
  obsidian: () => pix('obsidian', (g, s) => speckle(g, s, '#15101f', ['#1f1830', '#0c0914', '#2a1f45', '#3a2a60'])),
  crying: () => pix('crying', (g, s) => { speckle(g, s, '#15101f', ['#1f1830', '#2a1f45']); for (let i = 0; i < 10; i++) { g.fillStyle = R() < 0.5 ? '#a040ff' : '#d080ff'; g.fillRect(Math.floor(R() * s), Math.floor(R() * s), 1, 2); } }),
};

// ---------- instanced voxel batcher
class Blocks {
  constructor() { this.types = new Map(); }
  add(type, x, y, z, sx = 1, sy = 1, sz = 1) {
    if (!this.types.has(type)) this.types.set(type, []);
    this.types.get(type).push([x, y, z, sx, sy, sz]);
  }
  build(group, mats, { shadows = true, cast = false } = {}) {
    const box = new THREE.BoxGeometry(1, 1, 1);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
    for (const [type, list] of this.types) {
      const mat = mats[type]; if (!mat) { console.warn('no mat', type); continue; }
      const im = new THREE.InstancedMesh(box, mat, list.length);
      list.forEach((b, i) => { p.set(b[0], b[1], b[2]); s.set(b[3], b[4], b[5]); m4.compose(p, q, s); im.setMatrixAt(i, m4); });
      im.instanceMatrix.needsUpdate = true;
      im.receiveShadow = shadows; im.castShadow = cast;
      im.computeBoundingSphere();
      group.add(im);
    }
  }
}

function stdMat(tex, o = {}) { return new THREE.MeshStandardMaterial({ map: tex, roughness: o.r ?? 0.92, metalness: o.m ?? 0, color: o.color ?? 0xffffff, envMapIntensity: o.env ?? 0.5 }); }
function lamMat(tex, o = {}) {
  const m = new THREE.MeshLambertMaterial({ map: tex, color: o.color ?? 0xffffff });
  const sc = o.scale ?? 1;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uvScale = { value: sc };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vec4 wp4 = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          wp4 = instanceMatrix * wp4;
        #endif
        wp4 = modelMatrix * wp4; vWP = wp4.xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN; uniform float uvScale;')
      .replace('#include <map_fragment>', `vec3 an = abs(vWN); vec2 wuv = an.y > 0.5 ? vWP.xz : (an.x > 0.5 ? vWP.zy : vWP.xy);
        diffuseColor *= texture2D(map, wuv * uvScale);`);
  };
  return m;
}
function glowMat(tex, k = 2.2) { return new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(k, k, k), toneMapped: false }); }

// ---------- sky dome
function skyDome(top, mid, bottom, sunDir, sunColor, sunSize = 0.9995, high = null) {
  const geo = new THREE.SphereGeometry(400, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
    uniforms: { high: { value: new THREE.Color(high || mid) }, top: { value: new THREE.Color(top) }, mid: { value: new THREE.Color(mid) }, bot: { value: new THREE.Color(bottom) }, sunDir: { value: sunDir.clone().normalize() }, sunCol: { value: new THREE.Color(sunColor) }, sunSize: { value: sunSize } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position.z = gl_Position.w; }`,
    fragmentShader: `uniform vec3 top, mid, high, bot, sunCol, sunDir; uniform float sunSize; varying vec3 vDir;
      void main(){ float h = vDir.y; vec3 c;
        if (h > 0.0) { c = mix(mid, high, smoothstep(0.0, 0.14, h)); c = mix(c, top, smoothstep(0.1, 0.5, h)); }
        else c = mix(mid, bot, clamp(-h*3.0,0.0,1.0));
        float d = dot(normalize(vDir), sunDir); c += sunCol * (pow(max(d,0.0), 60.0)*0.6 + pow(max(d,0.0), 6.0)*0.25);
        c += sunCol * smoothstep(sunSize, sunSize+0.0008, d) * 3.0; gl_FragColor = vec4(c,1.0); }`,
  });
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = -10; return m;
}

// ---------- shared stage layout (Battlefield-like)
function layout(extra = {}) {
  const main = { x0: -8, x1: 8, y: 0, top: 0, bottom: -5, soft: false, main: true };
  return {
    main,
    plats: [main,
      { x0: -6.6, x1: -2.6, y: 3.0, soft: true },
      { x0: 2.6, x1: 6.6, y: 3.0, soft: true },
      { x0: -2.0, x1: 2.0, y: 5.8, soft: true, ...extra.top }],
    blast: { x: 22, top: 16, bottom: -10 },
    spawns: [[-5, 0.01], [5, 0.01], [-1.8, 0.01], [1.8, 0.01]],
  };
}

function islandMainBody(B, topType, sideType, fillType, deepType, depthRows = 9) {
  for (let x = -7.5; x <= 7.5; x++) for (let z = -2; z <= 2; z++) {
    B.add(topType, x, -0.5, z);
    B.add(sideType, x, -1.5, z);
  }
  // tapered body
  for (let row = 2; row < depthRows; row++) {
    const shrink = Math.floor((row - 1) * 0.9 + (row > 4 ? row - 4 : 0) * 0.4);
    for (let x = -7.5 + shrink; x <= 7.5 - shrink; x++) for (let z = -2; z <= 2; z++) {
      if (Math.abs(z) === 2 && row > 5 && hash2(x * 3, row) < 0.6) continue;
      const jag = hash2(Math.floor(x * 7), row * 13) < 0.18 && row > 3;
      if (jag && (x === -7.5 + shrink || x === 7.5 - shrink)) continue;
      B.add(row > 4 ? deepType : fillType, x, -0.5 - row, z);
    }
  }
}

// ---------------------------------------------------------------- OVERWORLD PEAKS
function buildOverworld(scene) {
  R = mulberry(42);
  const group = new THREE.Group();
  const L = layout();
  const mats = {
    grass: [stdMat(T.grassSide()), stdMat(T.grassSide()), stdMat(T.grassTop()), stdMat(T.dirt()), stdMat(T.grassSide()), stdMat(T.grassSide())],
    dirt: stdMat(T.dirt()), stone: stdMat(T.stone()), planks: stdMat(T.planks(), { r: 0.8 }), log: stdMat(T.log()), leaves: stdMat(T.leaves(), { r: 0.85 }),
    gold: stdMat(T.gold(), { r: 0.3, m: 0.8, env: 1 }),
    stem: new THREE.MeshStandardMaterial({ color: '#3a8a2a' }), flowerR: new THREE.MeshStandardMaterial({ color: '#ff3a3a', roughness: 0.6 }), flowerY: new THREE.MeshStandardMaterial({ color: '#ffd23a', roughness: 0.6 }),
  };
  const B = new Blocks();
  islandMainBody(B, 'grass', 'dirt', 'dirt', 'stone', 10);
  // ore specks in stone
  for (let i = 0; i < 6; i++) B.add('gold', -3.5 + i * 1.5 - (i % 2), -6.5 - (i % 3), 2.02, 0.5, 0.5, 0.05);
  // bushes, flowers and a crate stack along the back edge
  B.add('leaves', -6.5, 0.4, -2, 1, 0.8, 1); B.add('leaves', -5.6, 0.3, -2.1, 0.8, 0.6, 0.8);
  B.add('leaves', 3.2, 0.35, -2.2, 0.9, 0.7, 0.9);
  for (const [fx, col] of [[-4.2, 'flowerR'], [-1.3, 'flowerY'], [1.8, 'flowerR'], [5.1, 'flowerY'], [-3.1, 'flowerY']]) { B.add('stem', fx, 0.2, -2.1, 0.08, 0.4, 0.08); B.add(col, fx, 0.45, -2.1, 0.22, 0.18, 0.22); }
  const BG = new Blocks();
  // soft platforms: plank slabs
  const PL = new Blocks();
  for (const p of L.plats.slice(1)) for (let x = p.x0 + 0.5; x <= p.x1 - 0.5 + 0.01; x++) for (let z = -1; z <= 1; z++) PL.add('planks', x, p.y - 0.25, z, 1, 0.5, 1);
  B.build(group, mats, { shadows: true, cast: true });
  const platGroup = new THREE.Group(); PL.build(platGroup, mats, { shadows: true, cast: true }); group.add(platGroup);

  // ---- distant terrain (lambert, cheap)
  const far = { grass: lamMat(T.grassTop()), stone: lamMat(T.stone()), snow: lamMat(T.snow()), dirt: lamMat(T.dirt()), leaves: lamMat(T.leaves()), log: lamMat(T.log()) };
  const FT = new Blocks();
  for (let z = -60; z >= -230; z -= (z > -110 ? 4 : 6)) {
    const step = z > -110 ? 4 : 6;
    for (let x = -220; x <= 220; x += step) {
      const d = -z;
      const n = fbm(x * 0.016 + 10, z * 0.02 + 5);
      const ridge = Math.max(0, (d - 90) / 120);
      const peaks = fbm(x * 0.02 + 3, z * 0.025);
      const h = Math.min(-14, -64 + n * 14 + ridge * 40 * (0.3 + peaks * peaks * 1.6));
      const base = -80; const hh = h - base;
      if (hh < 1) continue;
      const top = h > -24 ? 'snow' : h > -40 ? 'stone' : 'grass';
      FT.add(h > -30 ? 'stone' : 'dirt', x, base + hh / 2 - step / 2, z, step, hh, step);
      FT.add(top, x, h, z, step, step * 0.5 + 0.01, step);
      if (h > -24) FT.add('snow', x, h - step * 0.6, z, step + 0.05, step * 0.6, step + 0.05);
      if (top === 'grass' && hash2(x, z) < 0.1) { FT.add('log', x, h + 2, z, 1, 3, 1); FT.add('leaves', x, h + 4.5, z, 4, 3, 4); }
    }
  }
  // floating background islands
  const islands = [[-30, 3, -42, 4], [28, -5, -48, 5], [-8, 13, -72, 3], [46, 10, -84, 6], [-56, -6, -66, 6], [12, -12, -38, 3], [-80, 16, -110, 7], [90, -2, -120, 8]];
  for (const [ix, iy, iz, r] of islands) {
    for (let x = -r; x <= r; x++) for (let z = -2; z <= 2; z++) {
      FT.add('grass', ix + x, iy, iz + z);
      const dep = Math.floor((r - Math.abs(x)) * 0.9) + 1;
      for (let y = 1; y <= dep; y++) FT.add(y > 2 ? 'stone' : 'dirt', ix + x, iy - y, iz + z);
    }
    FT.add('log', ix, iy + 1.5, iz, 1, 2, 1); FT.add('leaves', ix, iy + 3.5, iz, 3, 2, 3);
  }
  const farG = new THREE.Group(); FT.build(farG, far, { shadows: false }); group.add(farG);

  // waterfall from island
  const wtex = pix('water', (g, s) => speckle(g, s, '#4aa0ff', ['#7fc0ff', '#3a80e0', '#a0d8ff']));
  const wt = wtex.clone(); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(1, 8); wt.needsUpdate = true;
  const wf = new THREE.Mesh(new THREE.PlaneGeometry(2, 40), new THREE.MeshBasicMaterial({ map: wt, color: new THREE.Color(1.2, 1.3, 1.5), transparent: true, opacity: 0.85, toneMapped: false }));
  wf.position.set(26, -26, -43.4); group.add(wf);

  // clouds: pixel-art cloud cards in one instanced draw
  const ctex = pix('cloud', (g, w) => {
    g.clearRect(0, 0, 64, 32);
    for (let i = 0; i < 9; i++) { const cx = 8 + R() * 48, cy = 12 + R() * 10, rw = 6 + R() * 12, rh = 3 + R() * 5; g.fillStyle = '#ffffff'; g.fillRect(Math.floor(cx - rw / 2), Math.floor(cy - rh / 2), Math.floor(rw), Math.floor(rh)); }
    const id = g.getImageData(0, 0, 64, 32); for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) { const k = (y * 64 + x) * 4; if (id.data[k + 3] > 0) { const below = y < 31 && id.data[k + 64 * 4 + 3] === 0; const sh = below ? 0.78 : 1; id.data[k] = 255 * sh; id.data[k + 1] = 240 * sh; id.data[k + 2] = 235 * sh; id.data[k + 3] = 235; } }
    g.putImageData(id, 0, 0);
  }, 64);
  ctex.wrapS = ctex.wrapT = THREE.ClampToEdgeWrapping;
  const cmat = new THREE.MeshBasicMaterial({ map: ctex, transparent: true, depthWrite: false, color: new THREE.Color('#ffd8c8'), fog: true });
  const cloudIM = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 0.5), cmat, 22);
  const cloudList = [];
  const cm4 = new THREE.Matrix4();
  for (let i = 0; i < 22; i++) cloudList.push({ x: (R() - 0.5) * 300, y: 14 + R() * 30, z: -90 - R() * 140, s: 30 + R() * 40 });
  cloudList.sort((a, b) => a.z - b.z);
  const placeClouds = () => { cloudList.forEach((c, i) => { cm4.makeScale(c.s, c.s, 1).setPosition(c.x, c.y, c.z); cloudIM.setMatrixAt(i, cm4); }); cloudIM.instanceMatrix.needsUpdate = true; };
  placeClouds(); cloudIM.frustumCulled = false; cloudIM.renderOrder = -5;
  group.add(cloudIM);
  const sunDir = new THREE.Vector3(-0.55, 0.12, -1);
  const sky = skyDome('#2a3f8f', '#ff9a5a', '#5a3a6a', sunDir, '#ffd0a0', 0.9992);
  group.add(sky);

  // lights
  const hemi = new THREE.HemisphereLight('#a8c4ff', '#6a4a3a', 0.9);
  const key = new THREE.DirectionalLight('#ffe0bc', 2.6); key.position.set(-9, 16, 12);
  const rim = new THREE.DirectionalLight('#ff8a5a', 2.0); rim.position.set(-10, 6, -18);
  group.add(hemi, key, rim, key.target);
  scene.fog = new THREE.Fog('#e8a07a', 50, 230);
  return {
    id: 'overworld', name: 'OVERWORLD PEAKS', group, ...L, key, platGroup, bgColor: '#e8a07a', envIntensity: 0.45,
    ambientFx: 'motes', exposure: 1.05,
    update(t, dt) {
      for (const c of cloudList) { c.x += dt * 1.5; if (c.x > 170) c.x = -170; } placeClouds();
      wt.offset.y += dt * 1.5;
    },
  };
}

// ---------------------------------------------------------------- NETHER CITADEL
function lavaSea() {
  const mat = new THREE.ShaderMaterial({
    fog: false, toneMapped: false,
    uniforms: { t: { value: 0 } },
    vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv = position.xy; vec4 mv = modelViewMatrix*vec4(position,1.0); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float t; varying vec2 vUv; varying float vD;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      void main(){ vec2 p = vUv*0.12; float a = n(p + vec2(t*0.05, t*0.03)); float b = n(p*2.3 - vec2(t*0.08, -t*0.04) + a); float v = a*0.6 + b*0.4;
        vec3 c = mix(vec3(0.5,0.05,0.0), vec3(2.4,0.7,0.08), smoothstep(0.35,0.75,v)); c += vec3(2.2,1.4,0.4)*smoothstep(0.72,0.9,v);
        float fogf = clamp((vD-30.0)/220.0, 0.0, 1.0); c = mix(c, vec3(0.35,0.06,0.04), fogf*0.8);
        gl_FragColor = vec4(c,1.0); }`,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(600, 400, 1, 1), mat);
  m.rotation.x = -Math.PI / 2; m.position.y = -18;
  return m;
}

function buildNether(scene) {
  R = mulberry(7);
  const group = new THREE.Group();
  const L = layout({ top: { move: { ax: 3.6, sp: 0.55, x0c: -2.0, x1c: 2.0 } } });
  const mats = {
    nbrick: stdMat(T.netherBrick(), { r: 0.85 }), netherrack: stdMat(T.netherrack()), blackstone: stdMat(T.blackstone(), { r: 0.7 }),
    gold: stdMat(T.gold(), { r: 0.28, m: 0.85, env: 1.2 }), obsidian: stdMat(T.obsidian(), { r: 0.25, m: 0.3, env: 1.2 }),
    glow: glowMat(T.glowstone(), 2.4), lava: glowMat(T.lava(), 2.2), crying: glowMat(T.crying(), 1.6),
  };
  const B = new Blocks();
  islandMainBody(B, 'nbrick', 'nbrick', 'nbrick', 'netherrack', 6);
  // trim + crenellations behind
  for (let x = -7.5; x <= 7.5; x++) { if (Math.abs(x) > 6) B.add('gold', x, -0.5, 2.02, 1, 1, 0.06); }
  for (let x = -7.5; x <= 7.5; x += 2) B.add('nbrick', x, 0.5, -2);
  B.add('gold', -7.5, 1.5, -2); B.add('gold', 7.5, 1.5, -2);
  // braziers
  B.add('blackstone', -7.5, 0.5, -2); B.add('blackstone', 7.5, 0.5, -2);
  // support pillars to lava
  for (const px of [-4.5, 0, 4.5]) for (let y = -6.5; y > -19; y--) { B.add('nbrick', px - 0.5, y, 0); B.add('nbrick', px + 0.5, y, 0); }
  // lava drips on front
  B.add('lava', -2.5, -2.5, 2.02, 1, 2, 0.08); B.add('lava', 3.5, -3.0, 2.02, 1, 3, 0.08);
  B.build(group, mats, { shadows: true, cast: true });
  // platforms
  const platGroup = new THREE.Group();
  const PL = new Blocks();
  for (const p of L.plats.slice(1, 3)) {
    for (let x = p.x0 + 0.5; x <= p.x1 - 0.5 + 0.01; x++) for (let z = -1; z <= 1; z++) PL.add('blackstone', x, p.y - 0.25, z, 1, 0.5, 1);
    PL.add('gold', p.x0 + 0.5, p.y - 0.5 - 0.25, 0, 1, 0.5, 3.01); PL.add('gold', p.x1 - 0.5, p.y - 0.5 - 0.25, 0, 1, 0.5, 3.01);
  }
  PL.build(platGroup, mats, { shadows: true, cast: true }); group.add(platGroup);
  // moving platform
  const mover = new THREE.Group();
  const MP = new Blocks();
  for (let x = -1.5; x <= 1.5; x++) for (let z = -1; z <= 1; z++) MP.add(Math.abs(x) > 1 ? 'crying' : 'obsidian', x, -0.25, z, 1, 0.5, 1);
  MP.add('crying', 0, -0.75, 0, 1, 0.5, 1);
  MP.build(mover, mats, { shadows: true, cast: true }); mover.position.set(0, L.plats[3].y, 0); group.add(mover);

  // background structures
  const far = { netherrack: lamMat(T.netherrack()), nbrick: lamMat(T.netherBrick()), glow: glowMat(T.glowstone(), 2.0), lava: glowMat(T.lava(), 2.4), blackstone: lamMat(T.blackstone()) };
  const FT = new Blocks();
  // cliffs/pillars
  for (let i = 0; i < 46; i++) {
    const x = (R() - 0.5) * 300, z = -55 - R() * 120, w = 4 + R() * 9, h = 20 + R() * 50;
    FT.add('netherrack', x, -18 + h / 2, z, w, h, w);
    if (R() < 0.5) FT.add('glow', x + (R() - 0.5) * w, -18 + h * (0.4 + R() * 0.5), z + w / 2, 1.5, 1.5, 1.5);
  }
  // hanging ceiling stalactites
  for (let i = 0; i < 40; i++) {
    const x = (R() - 0.5) * 300, z = -50 - R() * 120, w = 3 + R() * 7, h = 8 + R() * 25;
    FT.add('netherrack', x, 45 - h / 2, z, w, h, w);
    if (R() < 0.6) FT.add('glow', x, 45 - h - 0.8, z, 2, 2, 2);
  }
  FT.add('netherrack', 0, 55, -90, 500, 10, 260);
  // fortress bridge in background
  for (let x = -120; x <= 120; x += 2) { FT.add('nbrick', x, -2, -48, 2, 2, 4); if (x % 6 === 0) FT.add('nbrick', x, 0, -49.5, 2, 2, 1); }
  for (let x = -108; x <= 108; x += 24) { FT.add('nbrick', x, -11, -48, 4, 18, 4); FT.add('glow', x, -1, -45.9, 1, 1, 0.2); }
  // lavafalls
  const lavafalls = [];
  const ltex = T.lava().clone(); ltex.wrapS = ltex.wrapT = THREE.RepeatWrapping; ltex.repeat.set(1, 10); ltex.needsUpdate = true;
  const lfMat = new THREE.MeshBasicMaterial({ map: ltex, color: new THREE.Color(2.3, 2.3, 2.3), toneMapped: false });
  for (const [x, z, w] of [[-44, -70, 4], [34, -62, 3], [80, -105, 6], [-90, -110, 7]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 70), lfMat); m.position.set(x, 12, z); group.add(m); lavafalls.push(m);
  }
  const farG = new THREE.Group(); FT.build(farG, far, { shadows: false }); group.add(farG);
  const sea = lavaSea(); group.add(sea);
  const sky = skyDome('#12030a', '#4a0e10', '#7a1a08', new THREE.Vector3(0, -1, 0), '#000000', 2.0); group.add(sky);
  // lights
  const hemi = new THREE.HemisphereLight('#8a3a5a', '#ff5a1a', 0.75);
  const key = new THREE.DirectionalLight('#ffc490', 2.2); key.position.set(-8, 16, 11);
  const under = new THREE.DirectionalLight('#ff5a10', 1.8); under.position.set(2, -10, 6);
  const rim = new THREE.DirectionalLight('#b060ff', 2.2); rim.position.set(10, 8, -14);
  group.add(hemi, key, under, rim, key.target);
  scene.fog = new THREE.Fog('#3a0c0c', 30, 170);
  const top = L.plats[3];
  return {
    id: 'nether', name: 'NETHER CITADEL', group, ...L, key, platGroup, bgColor: '#3a0c0c', envIntensity: 0.35, ambientFx: 'embers', exposure: 1.1,
    braziers: [[-7.5, 1.0, -2], [7.5, 1.0, -2]],
    update(t, dt) {
      sea.material.uniforms.t.value = t;
      ltex.offset.y -= dt * 0.9;
      const nx = Math.sin(t * top.move.sp) * top.move.ax;
      top.dx = nx - (top.cx ?? 0); top.cx = nx;
      top.x0 = top.move.x0c + nx; top.x1 = top.move.x1c + nx;
      mover.position.x = nx;
    },
  };
}

export const STAGES = { overworld: { name: 'OVERWORLD PEAKS', build: buildOverworld, sub: 'Sky island at sunset' }, nether: { name: 'NETHER CITADEL', build: buildNether, sub: 'Fortress above a lava sea' } };
export const STAGE_ORDER = ['overworld', 'nether'];
export function buildStage(scene, id) { return STAGES[id].build(scene); }
export { T as BlockTextures, pix };
