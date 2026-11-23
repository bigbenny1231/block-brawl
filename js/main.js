// Block Brawl - main: renderer, screens, match flow, camera, HUD
import * as THREE from '../lib/three.module.min.js';
import { EffectComposer } from '../lib/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../lib/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../lib/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../lib/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from '../lib/addons/environments/RoomEnvironment.js';
import { CHARS, CHAR_ORDER, BASE_YAW, PALETTES, HATS } from './characters.js';
import { STAGES, STAGE_ORDER, buildStage, BlockTextures } from './stages.js';
import { FX } from './fx.js';
import { Fighter, PCOLORS, DT } from './fighter.js';
import { AI } from './ai.js';
import { Input } from './input.js';
import { Sound } from './audio.js';
import { Items } from './items.js';
import './stages2.js';
import { Profile, KO_FX, POSES, TITLES, LEVEL_REWARDS, SHOP, rewardName, xpForLevel, fxpForLevel, titleName } from './profile.js';

const $ = s => document.querySelector(s);
const params = new URLSearchParams(location.search);
const isTouch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const isMobile = isTouch || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const setLoad = (p, t) => { $('#loadfill').style.width = (p * 100) + '%'; if (t) $('#loadtxt').textContent = t; };
const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));

// ------------------------------------------------------------------ renderer
const canvas = $('#gl');
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: isMobile ? 'default' : 'high-performance', stencil: false });
} catch (e) {
  window.__bbFail && window.__bbFail('3D graphics unavailable', "Your browser couldn't start WebGL 2 graphics. Close other tabs/apps and reload, or update your browser / iOS.", e && e.message);
  throw e;
}
canvas.addEventListener('webglcontextlost', ev => {
  ev.preventDefault();
  try { window.__bbLS && window.__bbLS.set('bb-booting', 'lost'); } catch (_) {}
  window.__bbReady = false;
  window.__bbFail && window.__bbFail('Graphics reset', 'Your device ran out of graphics memory. Tap Low graphics to keep playing.');
}, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = isMobile ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
const QLIST = ['low', 'medium', 'high'];
const QSET = {
  low: { pr: 1, shadow: 0, bloom: false, msaa: 0 },
  medium: { pr: 1.5, shadow: isMobile ? 512 : 1024, bloom: true, msaa: 0 },
  high: { pr: 2, shadow: isMobile ? 1024 : 2048, bloom: true, msaa: isMobile ? 0 : 4 },
};
let quality = QLIST.includes(params.get('q')) ? params.get('q') : (window.__bbSafe ? 'low' : (isMobile ? 'medium' : 'high'));
let autoQ = !params.has('q');

const world = new THREE.Scene();
const show = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, 0.5, 1200);
const showCam = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 200);
const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
world.environment = envTex; show.environment = envTex;

let composer, renderPass, bloomPass;
function buildComposer() {
  const q = QSET[quality];
  const pr = Math.min(devicePixelRatio || 1, q.pr, 2);
  renderer.setPixelRatio(pr);
  renderer.setSize(innerWidth, innerHeight, false);
  if (composer) { composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); }
  composer = null;
  if (q.bloom) {
    const rt = new THREE.WebGLRenderTarget(innerWidth * pr, innerHeight * pr, { type: THREE.HalfFloatType, samples: q.msaa });
    composer = new EffectComposer(renderer, rt);
    composer.setPixelRatio(pr); composer.setSize(innerWidth, innerHeight);
    renderPass = new RenderPass(world, camera);
    bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.5, 0.92);
    composer.addPass(renderPass); composer.addPass(bloomPass); composer.addPass(new OutputPass());
  }
  renderer.shadowMap.enabled = q.shadow > 0;
  world.traverse(o => { if (o.isDirectionalLight && o.castShadow) setShadow(o); });
  show.traverse(o => { if (o.isDirectionalLight && o.castShadow) setShadow(o); });
  const fxs = (innerHeight * pr / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  game && game.fx.setScale(fxs); showFx && showFx.setScale(fxs);
  $('#pGfx') && ($('#pGfx').textContent = 'GRAPHICS: ' + quality.toUpperCase());
}
function setShadow(light) {
  const q = QSET[quality];
  if (light.shadow.map) { light.shadow.map.dispose(); light.shadow.map = null; }
  light.shadow.mapSize.set(Math.max(q.shadow, 256), Math.max(q.shadow, 256));
}
function onResize() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  showCam.aspect = innerWidth / innerHeight; showCam.updateProjectionMatrix();
  buildComposer();
  layoutShowCam();
}

// ------------------------------------------------------------------ show scene (select / results)
let showFx;
const showStuff = {};
function buildShowScene() {
  const dome = new THREE.Mesh(new THREE.SphereGeometry(80, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, toneMapped: false, uniforms: { c1: { value: new THREE.Color('#2a0f45') }, c2: { value: new THREE.Color('#05040a') }, cc: { value: new THREE.Color('#ff6a20') }, t: { value: 0 } },
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 c1,c2,cc; uniform float t; varying vec3 vP; void main(){ vec3 d = normalize(vP); float h = d.y*0.5+0.5;
      vec3 c = mix(c1*0.9, c2, smoothstep(0.35, 0.95, h)); float rays = pow(max(0.0, sin(atan(d.x, d.z)*14.0 + t*0.3))*0.5+0.5, 6.0) * smoothstep(0.2,0.6,h) * (1.0-smoothstep(0.6,1.0,h));
      c += cc*rays*0.08; c += cc*0.25*pow(max(0.0,1.0-abs(d.y+0.05)*3.0),3.0); gl_FragColor = vec4(c,1.0); }`,
  }));
  show.add(dome); showStuff.dome = dome;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(60, 48), new THREE.MeshStandardMaterial({ color: '#0d0a16', roughness: 0.3, metalness: 0.7, envMapIntensity: 0.12 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; show.add(floor);
  // pedestal: stacked voxel disc
  const ped = new THREE.Group();
  const pm = new THREE.MeshStandardMaterial({ map: BlockTextures.blackstone(), roughness: 0.6, metalness: 0.3 });
  const gm = new THREE.MeshStandardMaterial({ map: BlockTextures.gold(), roughness: 0.3, metalness: 0.85 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.1, 0.4, 8), pm); base.position.y = 0.2; base.receiveShadow = true; base.castShadow = true;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.95, 0.08, 8), gm); rim.position.y = 0.42;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.04, 6, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 1.4, 0.4), toneMapped: false }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.43;
  ped.add(base, rim, ring); show.add(ped); showStuff.ring = ring; showStuff.ped = ped;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.0, 14, 32, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.25, 0.1), transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  beam.position.y = 7; show.add(beam); showStuff.beam = beam;
  const key = new THREE.DirectionalLight('#fff1e0', 2.2); key.position.set(3, 8, 6); key.castShadow = true;
  key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 6; key.shadow.camera.bottom = -2; key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02;
  const rimA = new THREE.DirectionalLight('#ff6a20', 3.0); rimA.position.set(-5, 4, -5);
  const rimB = new THREE.DirectionalLight('#6a8aff', 1.6); rimB.position.set(5, 3, -4);
  show.add(key, rimA, rimB, new THREE.HemisphereLight('#8a7aff', '#2a1020', 0.35));
  const fill = new THREE.DirectionalLight('#fff4ea', 0); fill.position.set(-2, 3, 8); show.add(fill); showStuff.fill = fill;
  showStuff.rimA = rimA;
  showFx = new FX(show);
  show.fog = new THREE.Fog('#0a0612', 12, 40);
}
let showPuppet = null, showMode = 'select';
function setShowPuppet(charId, victory, cos = {}) {
  if (showPuppet) { show.remove(showPuppet.rig.root); disposeRig(showPuppet.rig); }
  const stub = { hitstopT: 0, fighters: [], sfx() {} };
  const p = new Fighter(stub, 0, charId, false, 'normal', cos);
  p.state = 'idle'; p.grounded = true; p.x = 0; p.y = 0.46; p.invuln = 0; p.victory = !!victory; p.facing = 1;
  p.anim.squash = 0.6;
  p.rig.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  show.add(p.rig.root);
  showPuppet = p;
  const col = new THREE.Color(CHARS[charId].color);
  showStuff.rimA.color.copy(col);
  showStuff.ring.material.color.copy(col).multiplyScalar(3);
  showStuff.beam.material.color.copy(col).multiplyScalar(0.35);
  showStuff.dome.material.uniforms.cc.value.copy(col);
  showFx.burst(0, 1.2, 0, CHARS[charId].color, 40, 6, 0.8, 0.25, { drag: 2 });
  showFx.ring(0, 0.5, 0, 4, 0.5, CHARS[charId].color, true);
  layoutShowCam();
}
function layoutShowCam() {
  if (!showPuppet) return;
  const h = showPuppet.h + 0.46;
  const portrait = innerHeight > innerWidth;
  const dist = h * 2.7 + 3.2;
  showCam.position.set(0.6, h * 0.55 + 0.6, dist);
  showCam.lookAt(0, h * 0.52, 0);
  const w = innerWidth, hh = innerHeight;
  if (showMode === 'select' && !portrait) showCam.setViewOffset(w, hh, w * 0.12, hh * 0.04, w, hh);
  else if (showMode === 'results' && !portrait) showCam.setViewOffset(w, hh, -w * 0.02, 0, w, hh);
  else if (showMode === 'locker' && !portrait) showCam.setViewOffset(w, hh, w * 0.1, hh * 0.02, w, hh);
  else showCam.clearViewOffset();
  showCam.updateProjectionMatrix();
}
function disposeRig(rig) { rig.root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); for (const k in rig.mats) rig.mats[k].dispose(); }

// ------------------------------------------------------------------ portraits
const portraits = {};
function makePortraits() {
  const sc = new THREE.Scene(); sc.environment = envTex;
  const k = new THREE.DirectionalLight('#fff4e8', 3.2); k.position.set(2, 3, 4);
  const r = new THREE.DirectionalLight('#ffb070', 2.5); r.position.set(-3, 2, -3);
  sc.add(k, r, new THREE.HemisphereLight('#9ab0ff', '#402030', 0.9));
  const pc = new THREE.PerspectiveCamera(28, 1, 0.05, 50);
  const S = 192, pr = renderer.getPixelRatio();
  renderer.setScissorTest(true); renderer.setViewport(0, 0, S, S); renderer.setScissor(0, 0, S, S);
  renderer.setClearColor(0x000000, 0);
  const stub = { hitstopT: 0, fighters: [], sfx() {} };
  for (const id of CHAR_ORDER) {
    const p = new Fighter(stub, 0, id, false, 'normal');
    p.state = 'idle'; p.grounded = true; p.facing = 1; p.anim.faceVis = 1;
    p.animate(0.016, 0); sc.add(p.rig.root); p.shieldMesh.visible = false;
    p.rig.root.updateMatrixWorld(true);
    const hp = new THREE.Vector3(); p.rig.head.getWorldPosition(hp);
    const c = CHARS[id];
    const headSize = c.portraitSize ?? ({ malgore: 1.0, gogo: 0.75, gammoth: 0.78, venomaw: 0.7 }[id] || 0.6);
    hp.y += headSize * 0.25;
    const yaw = BASE_YAW - 0.55;
    const d = headSize * 3.4 + 0.4;
    pc.position.set(hp.x + Math.sin(yaw) * d, hp.y + 0.1, hp.z + Math.cos(yaw) * d);
    pc.lookAt(hp.x, hp.y - headSize * 0.32, hp.z);
    renderer.clear();
    renderer.render(sc, pc);
    const cv = document.createElement('canvas'); cv.width = cv.height = S;
    const g = cv.getContext('2d');
    g.drawImage(canvas, 0, canvas.height - S * pr, S * pr, S * pr, 0, 0, S, S);
    portraits[id] = cv.toDataURL('image/png');
    sc.remove(p.rig.root); disposeRig(p.rig);
  }
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, innerWidth, innerHeight);
  renderer.setClearColor(0x000000, 1);
}

const stageThumbs = {};
function makeStageThumbs() {
  const W = 320, H = 160, pr = renderer.getPixelRatio();
  const cam = new THREE.PerspectiveCamera(36, W / H, 0.1, 900);
  cam.position.set(0, 5.2, 27); cam.lookAt(0, 2.2, 0);
  renderer.setScissorTest(true); renderer.setViewport(0, 0, W, H); renderer.setScissor(0, 0, W, H);
  for (const id of STAGE_ORDER) {
    const st = game.getStage(id);
    world.add(st.group); const pf = world.fog; world.fog = st.fog; world.environmentIntensity = st.envIntensity;
    renderer.toneMappingExposure = st.exposure || 1;
    st.update(1, 0.016);
    renderer.clear(); renderer.render(world, cam);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    cv.getContext('2d').drawImage(canvas, 0, canvas.height - H * pr, W * pr, H * pr, 0, 0, W, H);
    stageThumbs[id] = cv.toDataURL('image/jpeg', 0.85);
    world.remove(st.group); world.fog = pf;
  }
  renderer.setScissorTest(false); renderer.setViewport(0, 0, innerWidth, innerHeight);
}

// ------------------------------------------------------------------ game
const sound = new Sound();
const input = new Input();
input.bindTouch($('#touch'));
const EMPTY = { x: 0, y: 0, attackP: false, specialP: false, jumpP: false, jumpH: false, shieldH: false, shieldP: false, xTap: false, downTap: false };

class Game {
  constructor() {
    this.fx = new FX(world); this.fighters = []; this.ais = []; this.projectiles = []; this.decor = [];
    this.stage = null; this.stages = {}; this.frame = 0; this.t = 0; this.hitstopT = 0; this.shakeAmt = 0; this.punch = 0;
    this.phase = 'idle'; this.phaseT = 0; this.attract = false; this.paused = false; this.timeScale = 1;
    this.camPos = new THREE.Vector3(0, 4, 30); this.camLook = new THREE.Vector3(0, 2, 0);
    this.tags = [];
    this.items = new Items(this, world); this.haptics = true;
    const bt = BlockTextures;
    this.blockGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    this.blockMats = [bt.grassSide(), bt.grassSide(), bt.grassTop(), bt.dirt(), bt.grassSide(), bt.grassSide()].map(t => new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }));
    this.pillarMat = new THREE.MeshStandardMaterial({ map: bt.stone(), roughness: 0.9, transparent: true });
    this.pool = { block: [], banana: [], pillar: [], arrow: [], fireball: [], web: [], bomb: [], spring: [], spiritBlade: [], heart: [], soulFire: [], pursuitDrone: [] };
    this.webMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 5), new THREE.MeshBasicMaterial({ color: '#f4f4ff' })); this.webMesh.visible = false; world.add(this.webMesh); this.webT = 0;
    this.tendrils = [];
  }
  // symbiote tendril (Venomaw): one glossy line per owner, drawn from the hand to (ax, ay)
  tendril(f, ax, ay) {
    let t = this.tendrils.find(o => o.owner === f) || this.tendrils.find(o => !o.owner);
    if (t) t.owner = f;
    else {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.075, 1, 6), new THREE.MeshStandardMaterial({ color: '#1c1f33', roughness: 0.2, metalness: 0.6, emissive: '#151a40', emissiveIntensity: 0.6 }));
      mesh.castShadow = true; world.add(mesh); t = { owner: f, mesh, t: 0 }; this.tendrils.push(t);
    }
    const hx = f.x + f.facing * f.w * 0.45, hy = f.y + f.h * 0.62;
    const dx = ax - hx, dy = ay - hy, L = Math.max(0.05, Math.hypot(dx, dy));
    const m = t.mesh; m.visible = true; m.position.set((ax + hx) / 2, (ay + hy) / 2, 0); m.scale.set(1, L, 1); m.rotation.set(0, 0, Math.atan2(dy, dx) - Math.PI / 2);
    t.t = 2;
  }
  sfx(n, k) { sound.sfx(n, k); }
  shake(a) { this.shakeAmt = Math.max(this.shakeAmt, a); }
  hitstop(n) { this.hitstopT = Math.max(this.hitstopT, n); }
  getStage(id) {
    if (!this.stages[id]) { const s = buildStage(world, id); s.fog = world.fog; s.key.castShadow = true; this.stages[id] = s; world.remove(s.group); }
    return this.stages[id];
  }
  startMatch(cfg) {
    this.cfg = cfg; this.attract = !!cfg.attract;
    for (const f of this.fighters) { world.remove(f.rig.root); disposeRig(f.rig); }
    for (const t of this.tags) world.remove(t);
    for (const p of this.projectiles) this.release(p);
    for (const d of this.decor) this.release(d);
    this.projectiles = []; this.decor = []; this.tags = [];
    this.items.clear(); this.items.configure(cfg.attract ? 'low' : (cfg.items || 'off'), cfg.itemList);
    this.hazards = cfg.hazards !== false; this.timeLeft = cfg.time ? cfg.time * 60 : 0; this.webMesh.visible = false; for (const t of this.tendrils) { t.mesh.visible = false; t.t = 0; t.owner = null; }
    if (this.stage && this.stage.reset) this.stage.reset();
    if (this.stage) world.remove(this.stage.group);
    const st = this.stage = this.getStage(cfg.stage);
    if (st.reset) st.reset();
    world.add(st.group); world.fog = st.fog; world.environmentIntensity = st.envIntensity;
    renderer.toneMappingExposure = st.exposure || 1;
    const key = st.key; key.castShadow = true;
    key.shadow.camera.left = -16; key.shadow.camera.right = 16; key.shadow.camera.top = 14; key.shadow.camera.bottom = -10; key.shadow.camera.near = 1; key.shadow.camera.far = 60;
    key.shadow.camera.updateProjectionMatrix(); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03; setShadow(key);
    this.fighters = cfg.players.map((p, i) => {
      const f = new Fighter(this, i, p.char, p.cpu, p.level, p.cos || {});
      if (p.boss) { f.boss = true; f.baseSize = f.size = 1.7; }
      const [sx, sy] = st.spawns[i];
      f.reset(sx, sy + 0.5, sx > 0 ? -1 : 1); f.anim.faceVis = f.facing;
      f.stocks = this.attract || cfg.time || cfg.training ? 99 : (p.cpu && cfg.cpuStocks ? cfg.cpuStocks : (cfg.stocks || 3)); f.maxStocks = f.stocks; f.score = 0; f.itemsTaken = 0; f.maxCombo = 0;
      if (!this.attract) { f.entrance = 16 + i * 12; f.rig.root.visible = false; }
      world.add(f.rig.root);
      return f;
    });
    this.ais = this.fighters.map(f => (f.cpu ? new AI(f, f.level) : null)); this.dummyMode = 'stand';
    document.querySelectorAll('#tpDummy button').forEach(x => x.classList.toggle('on', x.dataset.v === 'stand'));
    if (!this.attract) for (const f of this.fighters) { const t = makeTag(f.cpu ? 'CPU' : 'P1', f.color); world.add(t); this.tags.push(t); }
    this.fx.clear(); this.frame = 0; this.t = 0; this.hitstopT = 0; this.shakeAmt = 0; this.timeScale = 1; this.paused = false;
    this.phase = this.attract ? 'fight' : 'countdown'; this.phaseT = 0;
    this.frameCamera(0, true);
    if (!this.attract) buildHud(this.fighters);
  }
  hitCheck(att, hb, x, y, dir) {
    let any = false;
    for (const t of this.fighters) {
      if (t === att || t.state === 'dead' || att.hitIds.has(t)) continue;
      const bx0 = t.x - t.w * 0.5, bx1 = t.x + t.w * 0.5, by0 = t.y, by1 = t.y + t.h;
      const cx = clamp(x, bx0, bx1), cy = clamp(y, by0, by1);
      if ((x - cx) ** 2 + (y - cy) ** 2 > hb.r * hb.r) continue;
      att.hitIds.add(t);
      const res = t.takeHit(att, hb, dir, x, y);
      if (!res) continue;
      any = true;
      if (res === 'shield') continue;
      this.onHitFx(att, res, (x + cx) / 2, (y + cy) / 2);
    }
    return any;
  }
  onHitFx(att, res, x, y) {
    if (att) { att.maxCombo = Math.max(att.maxCombo || 0, att.combo || 0); att.comboShow = att.combo; clearTimeout(att._ch); }
    if (!this.attract && res.dmg >= 9 && PD().settings.dmgNums) this.items.pop(x, y + 0.6, Math.round(res.dmg) + '%', res.dmg >= 15 ? '#ff5a3a' : '#ffffff');
    if (att && !att.cpu && res.spd > 12) haptic(Math.min(40, 10 + res.spd));
    const hs = Math.min(17, Math.round(3 + res.dmg * 0.45 + (res.spd > 20 ? 5 : 0)));
    this.hitstop(hs);
    const n = res.spd || 1;
    this.fx.hitSpark(x, y, res.dmg + res.spd * 0.25, att ? att.c.fx[0] : '#fff', [res.kx / n, res.ky / n]);
    sound.sfx('hit', clamp((res.spd - 6) / 22, 0.05, 1));
    this.shake(Math.min(1.0, res.spd * 0.028));
    if (res.spd > 20) { this.punch = 1; flash(0.25); }
  }
  ko(f) {
    if (f.state === 'dead') return;
    const b = this.stage.blast;
    const bx = clamp(f.x, -b.x, b.x), by = clamp(f.y, b.bottom, b.top);
    let dx = -bx, dy = 3 - by; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
    const killer = f.lastHitter && this.frame - f.lastHitT < 600 ? f.lastHitter : null;
    this.fx.koBlast(bx, by, dx, dy, f.color, killer && killer.cos && killer.cos.ko || 'classic');
    if (killer && !killer.cpu) haptic(50);
    f.stocks--; f.falls++;
    if (f.lastHitter && this.frame - f.lastHitT < 600) { f.lastHitter.kos++; f.lastHitter.score++; } f.score--;
    if (this.cfg.training || this.cfg.time) f.stocks = 99;
    f.state = 'dead'; f.stateT = 0; f.respawnT = 90; f.rig.root.visible = false; f.vx = f.vy = f.kbx = f.kby = 0;
    sound.sfx('ko'); this.shake(1.6); flash(0.5);
    if (!this.attract) {
      updateHud(true);
      if (this.cfg.time || this.cfg.training) return;
      const alive = this.fighters.filter(o => o.stocks > 0);
      const human = this.fighters.find(o => !o.cpu);
      if (alive.length <= 1) this.gameSet(alive[0] || f);
      else if (human && human.stocks <= 0) this.gameSet([...alive].sort((a, b) => b.stocks - a.stocks || a.pct - b.pct)[0]);
    }
  }
  gameSet(winner) {
    if (this.phase === 'gameset') return;
    this.phase = 'gameset'; this.phaseT = 0; this.winner = winner; this.timeScale = 0.35;
    banner('GAME!', true); sound.sfx('game'); sound.music(null);
  }
  spawnProjectile(owner, type, opts) {
    const own = this.projectiles.filter(p => p.owner === owner && p.type === type).length;
    if (own >= (type === 'bomb' ? 9 : 3)) return;
    let p;
    if (type === 'block') {
      p = this.take('block', () => new THREE.Mesh(this.blockGeo, this.blockMats));
      Object.assign(p, { x: owner.x + owner.facing * 0.7, y: owner.y + owner.h * 0.75, vx: owner.facing * 12.5, vy: 8, grav: 30, life: 100, r: 0.42, spin: -owner.facing * 10,
        hb: { dmg: 8, kb: 6, g: 0.9, a: 40, r: 0.42 }, color: '#7fd06a', breakColor: '#8a6a40' });
    } else if (type === 'banana') {
      p = this.take('banana', makeBanana);
      Object.assign(p, { x: owner.x + owner.facing * 0.9, y: owner.y + owner.h * 0.5, vx: owner.facing * 19, vy: 0.5, grav: 3, life: 55, r: 0.36, spin: -owner.facing * 18,
        hb: { dmg: 6, kb: 5, g: 0.7, a: 30, r: 0.36 }, color: '#ffe060', breakColor: '#ffe060' });
    } else if (type === 'arrow') {
      p = this.take('arrow', makeArrow);
      Object.assign(p, { x: owner.x + owner.facing * 0.8, y: owner.y + owner.h * 0.62, vx: owner.facing * 26, vy: 0.8, grav: 4, life: 50, r: 0.3, spin: 0, aim: true,
        hb: { dmg: 6, kb: 4.5, g: 0.6, a: 25, r: 0.3 }, color: '#e8e0d0', breakColor: '#c8b898' });
    } else if (type === 'fireball') {
      p = this.take('fireball', makeFireball);
      Object.assign(p, { x: owner.x + owner.facing * 0.7, y: owner.y + owner.h * 0.6, vx: owner.facing * 11, vy: -2, grav: 30, bounce: 8.5, life: 95, r: 0.3, spin: -owner.facing * 14,
        hb: { dmg: 5, kb: 4, g: 0.5, a: 35, r: 0.3 }, color: '#ff8020', breakColor: '#ff6010', glowTrail: true });
    } else if (type === 'spiritBlade' || type === 'heart' || type === 'soulFire' || type === 'pursuitDrone') {
      const { speed, rise = 0, dmg, size, y } = opts;
      const [core, aura] = owner.c.fx;
      const radius = size * owner.size;
      p = this.take(type, () => makeEnergyShot(type));
      p.mesh.scale.setScalar(radius);
      p.mesh.children[0].material.color.set(core).multiplyScalar(1.7);
      p.mesh.children[1].material.color.set(aura);
      Object.assign(p, {
        x: owner.x + owner.facing * (owner.w / 2 + radius), y: owner.y + owner.h * y,
        vx: owner.facing * speed, vy: rise, grav: 0, life: 42, r: radius,
        aim: type !== 'heart', spin: 0, glowTrail: true, color: aura, breakColor: core,
        hb: { dmg, kb: 4 + dmg * 0.24, g: 0.55 + dmg * 0.035, a: 39, r: radius },
      });
      opts = null;
    } else if (type === 'web') {
      p = this.take('web', makeWebBall);
      Object.assign(p, { x: owner.x + owner.facing * 0.7, y: owner.y + owner.h * 0.65, vx: owner.facing * 18, vy: 0, grav: 0, life: 40, r: 0.4, spin: 6,
        hb: { dmg: 3, kb: 2, g: 0, a: 20, r: 0.4, web: true }, color: '#ffffff', breakColor: '#ffffff' });
    } else if (type === 'bomb') {
      p = this.take('bomb', makeTNT);
      Object.assign(p, { x: owner.x + owner.facing * 0.7, y: owner.y + owner.h * 0.8, vx: owner.facing * 15 + owner.vx * 0.3, vy: 7, grav: 28, life: 120, r: 0.4, spin: -owner.facing * 8,
        hb: { dmg: 18, kb: 9, g: 1.4, a: 55, r: 0.4 }, color: '#ff4030', breakColor: '#ff8030', explode: 2.6 });
    }
    if (opts) Object.assign(p, opts);
    p.owner = owner; p.type = type; p.mesh.visible = true; p.mesh.rotation.set(0, 0, 0); p.mesh.position.set(p.x, p.y, 0);
    this.projectiles.push(p);
  }
  entranceFx(f) {
    f.rig.root.visible = true; f.anim.squash = 1.6; f.entPop = 1;
    this.fx.burst(f.x, f.y + 1, 0.2, f.color, 50, 9, 0.7, 0.35, { up: 4 }); this.fx.ring(f.x, f.y + 0.1, 0, 3.4, 0.45, f.color, true);
    this.fx.flash(f.x, f.y + 1, 0.4, 3, 0.25, '#ffffff'); this.fx.dust(f.x, f.y, 10); sound.sfx('respawn'); this.shake(0.3);
  }
  hazardHit(t, hb, x, y, dir) {
    if (t.state === 'dead' || t.invuln > 0 || (t.hazardCD || 0) > this.frame) return;
    t.hazardCD = this.frame + 40;
    const res = t.takeHit(null, { ...hb, weak: 0 }, dir, x, y);
    if (res && res !== 'shield') this.onHitFx(null, res, x, y);
  }
  explode(x, y, owner, hb, r, hitOwner, small) {
    for (const t of this.fighters) {
      if (t.state === 'dead' || (t === owner && !hitOwner)) continue;
      const cx = clamp(x, t.x - t.w / 2, t.x + t.w / 2), cy = clamp(y, t.y, t.y + t.h);
      if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
      const dir = Math.sign(t.x - x) || t.facing * -1;
      const res = t.takeHit(t === owner ? null : owner, { ...hb, r }, dir, x, y);
      if (res && res !== 'shield') this.onHitFx(owner, res, cx, cy);
    }
    this.fx.explosion ? this.fx.explosion(x, y, r, small) : this.fx.burst(x, y, 0.4, '#ffb040', 50, 12, 0.7, 0.5);
    sound.sfx(small ? 'heavy' : 'boom'); this.shake(small ? 0.5 : 1.2); if (!small) flash(0.3);
  }
  webLine(f, ax, ay) {
    const hx = f.x + f.facing * 0.3, hy = f.y + f.h * 0.95;
    const dx = ax - hx, dy = ay - hy, L = Math.hypot(dx, dy);
    const m = this.webMesh; m.visible = true; m.position.set((ax + hx) / 2, (ay + hy) / 2, 0); m.scale.set(1, L, 1); m.rotation.set(0, 0, Math.atan2(dy, dx) - Math.PI / 2);
    this.webT = 2;
  }
  spring(x, y) {
    const d = this.take('spring', makeSpring);
    Object.assign(d, { x, y, life: 40, max: 40, delay: 0, spring: true });
    d.mesh.visible = true; d.mesh.position.set(x, y, 0); d.mesh.scale.setScalar(1);
    this.decor.push(d);
  }
  take(type, make) {
    const free = this.pool[type].find(o => !o.mesh.visible);
    if (free) return free;
    const mesh = make(); mesh.castShadow = true; world.add(mesh); const o = { mesh }; this.pool[type].push(o); return o;
  }
  release(o) { o.mesh.visible = false; }
  throwHeld(f, inp) { if (this.items) this.items.throwHeld(f, inp); }
  dropHeld(f) { if (this.items) this.items.dropHeld(f); }
  setHammer(f, on) { if (this.items) this.items.setHammer(f, on); }
  pillarFx(f) {
    for (let i = 0; i < 3; i++) {
      const d = this.take('pillar', () => new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.pillarMat.clone()));
      Object.assign(d, { x: f.x, y: f.y - 0.3 - i * 0.95, life: 50 + i * 4, max: 50 + i * 4, delay: i * 3 });
      d.mesh.visible = true; d.mesh.position.set(d.x, d.y, 0); d.mesh.scale.setScalar(0.01); d.mesh.material.opacity = 1;
      this.decor.push(d);
    }
    this.fx.dust(f.x, f.y, 10, '#c0b0a0', 1.4);
  }
  step() {
    this.frame++;
    if (this.hitstopT > 0) { this.hitstopT--; return; }
    this.t += DT; this.phaseT++;
    this.stage.update(this.t, DT);
    const live = this.phase === 'fight' || this.phase === 'gameset';
    const pin = input.poll();
    this.fighters.forEach((f, i) => {
      let inp = EMPTY;
      if (live) inp = f.cpu ? (this.cfg.training && this.dummyMode !== 'cpu' ? (this.dummyMode === 'jump' && this.frame % 70 === 0 ? { ...EMPTY, jumpP: true, jumpH: true } : EMPTY) : this.ais[i].think(this)) : pin;
      if (f.entrance > 0) { inp = EMPTY; if (--f.entrance === 0) this.entranceFx(f); }
      if (this.phase === 'gameset' && f === this.winner) inp = EMPTY;
      f.update(inp);
    });
    if (this.webT > 0 && --this.webT === 0) this.webMesh.visible = false;
    for (const t of this.tendrils) if (t.t > 0 && --t.t === 0) t.mesh.visible = false;
    if (this.items) this.items.update(live);
    // projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.vy -= p.grav * DT; p.x += p.vx * DT; p.y += p.vy * DT; p.life--;
      p.mesh.position.set(p.x, p.y, 0);
      if (p.aim) p.mesh.rotation.set(0, 0, Math.atan2(p.vy, p.vx)); else { p.mesh.rotation.z += p.spin * DT; p.mesh.rotation.y += p.spin * 0.3 * DT; }
      if (this.frame % 2 === 0) this.fx.trail(p.x, p.y, p.color, p.glowTrail ? 0.5 : 0.35);
      let dead = p.life <= 0;
      if (p.bounce && p.vy < 0) {
        for (const pl of this.stage.plats) {
          if (p.x > pl.x0 && p.x < pl.x1 && p.y - p.r <= pl.y && p.y - p.r - p.vy * DT >= pl.y - 0.05) { p.y = pl.y + p.r; p.vy = p.bounce; break; }
        }
      }
      for (const t of this.fighters) {
        if (dead || t === p.owner || t.state === 'dead') continue;
        const cx = clamp(p.x, t.x - t.w / 2, t.x + t.w / 2), cy = clamp(p.y, t.y, t.y + t.h);
        if ((p.x - cx) ** 2 + (p.y - cy) ** 2 < p.r * p.r) {
          const res = t.takeHit(p.owner, p.hb, Math.sign(p.vx), p.x, p.y);
          if (res) { dead = true; if (res !== 'shield') this.onHitFx(p.owner, res, p.x, p.y); }
        }
      }
      const m = this.stage.main;
      if (!dead && p.x > m.x0 && p.x < m.x1 && p.y < m.top + (p.bounce ? -0.1 : 0.2) && p.y > m.bottom) dead = true;
      if (Math.abs(p.x) > 30 || p.y < -15) dead = true;
      if (dead) {
        if (p.explode) this.explode(p.x, p.y, p.owner, p.hb, p.explode, true);
        else { this.fx.burst(p.x, p.y, 0.2, p.breakColor, 14, 6, 0.5, 0.3, { grav: 2 }); if (p.type === 'block') sound.sfx('break'); }
        this.release(p); this.projectiles.splice(i, 1);
      }
    }
    for (let i = this.decor.length - 1; i >= 0; i--) {
      const d = this.decor[i];
      if (d.delay > 0) { d.delay--; continue; }
      d.life--; const k = d.life / d.max;
      if (d.spring) { const s = d.life > 32 ? 1 + (40 - d.life) * 0.12 : 1.4 - (32 - d.life) * 0.01; d.mesh.scale.set(1, s, 1); if (d.life < 10) d.mesh.scale.multiplyScalar(d.life / 10); if (d.life <= 0) { this.release(d); this.decor.splice(i, 1); } continue; }
      d.mesh.scale.setScalar(Math.min(0.95, (1 - k) * 6) * 0.95); d.mesh.material.opacity = Math.min(1, k * 3);
      if (d.life <= 0) { this.release(d); this.decor.splice(i, 1); }
    }
    // phases
    if (this.phase === 'countdown') {
      const t = this.phaseT;
      if (t === 20) { banner('3'); sound.sfx('count'); }
      if (t === 70) { banner('2'); sound.sfx('count'); }
      if (t === 120) { banner('1'); sound.sfx('count'); }
      if (t === 170) { banner('GO!'); sound.sfx('go'); this.phase = 'fight'; this.phaseT = 0; sound.music('battle'); }
    } else if (this.phase === 'fight' && this.timeLeft > 0 && !this.attract) {
      this.timeLeft--;
      if (this.timeLeft === 0) {
        const rank = [...this.fighters].sort((a, b) => b.score - a.score || a.pct - b.pct);
        this.gameSet(rank[0]); banner('TIME!', true);
      } else if (this.timeLeft <= 600 && this.timeLeft % 60 === 0) sound.sfx('tick');
    }
    if (this.stage.tick && (this.phase === 'fight' || this.attract)) this.stage.tick(this);
    if (this.phase === 'fight' && this.hazards && this.stage.hazardStep) this.stage.hazardStep(this, this.t);
    if (this.phase === 'gameset') {
      if (this.phaseT > 75) this.timeScale = lerp(this.timeScale, 1, 0.05);
      if (this.phaseT === 150) showResults();
    }
  }
  frameCamera(dt, snap) {
    const b = this.stage.blast;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const f of this.fighters) {
      if (f.state === 'dead') continue;
      const fx = clamp(f.x, -b.x + 4, b.x - 4), fy = clamp(f.y, b.bottom + 3, b.top - 3);
      x0 = Math.min(x0, fx - 2); x1 = Math.max(x1, fx + 2); y0 = Math.min(y0, fy - 1.4); y1 = Math.max(y1, fy + f.h + 1.6);
    }
    if (x0 > x1) { x0 = -8; x1 = 8; y0 = -2; y1 = 6; }
    x0 = Math.min(x0, -3.5); x1 = Math.max(x1, 3.5); y0 = Math.min(y0, -1.8); y1 = Math.max(y1, 3.5);
    if (this.attract) { x0 = Math.min(x0, -9); x1 = Math.max(x1, 9); y1 = Math.max(y1, 7); }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = x1 - x0, h = y1 - y0;
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    let dist = Math.max(h / 2 / t, w / 2 / (t * camera.aspect)) * 1.04;
    dist = clamp(dist * (this.attract ? 1.35 : 1), 15.5, 50) * (1 - 0.07 * this.punch);
    const tx = cx * 0.9, ty = cy + 0.1;
    const px = tx + (this.attract ? Math.sin(this.t * 0.15) * 6 : 0), py = ty + dist * 0.17 + (this.attract ? 1.5 : 0), pz = dist;
    const k = snap ? 1 : 1 - Math.exp(-dt * 3.2);
    this.camPos.x = lerp(this.camPos.x, px, k); this.camPos.y = lerp(this.camPos.y, py, k); this.camPos.z = lerp(this.camPos.z, pz, k);
    this.camLook.x = lerp(this.camLook.x, tx, k); this.camLook.y = lerp(this.camLook.y, ty, k);
    this.punch = Math.max(0, this.punch - dt * 3);
    const s = this.shakeAmt; this.shakeAmt *= Math.exp(-dt * 7);
    camera.position.set(this.camPos.x + (Math.random() - 0.5) * s * 0.6, this.camPos.y + (Math.random() - 0.5) * s * 0.6, this.camPos.z);
    camera.lookAt(this.camLook.x, this.camLook.y, 0);
    camera.rotation.z += (Math.random() - 0.5) * s * 0.012;
  }
  ambient(dt) {
    const st = this.stage, fx = this.fx;
    const cx = this.camLook.x;
    if (st.ambientFx === 'embers') {
      if (Math.random() < dt * 30) fx.spawn(cx + (Math.random() - 0.5) * 50, -12 + Math.random() * 6, -6 + Math.random() * 10, (Math.random() - 0.5) * 1, 2 + Math.random() * 3, 0, 2.6, 0.9, 0.2, 5 + Math.random() * 3, 0.12 + Math.random() * 0.12, -0.15, 0.05, -0.3);
      if (st.braziers) for (const [x, y, z] of st.braziers) if (Math.random() < dt * 40) fx.fire(x, y, z, 1, 1.1);
    } else if (st.ambientFx === 'motes') {
      if (Math.random() < dt * 14) fx.spawn(cx + (Math.random() - 0.5) * 44, -6 + Math.random() * 18, -8 + Math.random() * 12, 0.4 + Math.random() * 0.4, (Math.random() - 0.5) * 0.4, 0, 1.4, 1.1, 0.7, 6, 0.08 + Math.random() * 0.08, 0, 0, 0);
    }
  }
}
function makeBanana() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.085, 8, 14, Math.PI * 0.75), new THREE.MeshStandardMaterial({ color: '#ffd820', roughness: 0.5, emissive: '#6a5000' }));
  body.rotation.z = Math.PI * 0.62;
  const tip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.07), new THREE.MeshStandardMaterial({ color: '#4a3010' }));
  tip.position.set(0.26 * Math.cos(Math.PI * 0.62), 0.26 * Math.sin(Math.PI * 0.62), 0);
  g.add(body, tip);
  g.castShadow = true; body.castShadow = true;
  return g;
}
function stdM(color, extra = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra }); }
function makeArrow() {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.05), stdM('#d8c8a8'));
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), stdM('#c0c8d0', { metalness: 0.8, roughness: 0.3 })); tip.rotation.z = -Math.PI / 2; tip.position.x = 0.52;
  const fl = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.02), stdM('#f0f0f0')); fl.position.x = -0.4;
  g.add(shaft, tip, fl); return g;
}
function makeFireball() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 1.2, 0.25) })));
  const o = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 1), new THREE.MeshBasicMaterial({ color: '#ff5010', transparent: true, opacity: 0.45, depthWrite: false })); g.add(o);
  return g;
}
function makeEnergyShot(type) {
  const group = new THREE.Group();
  const core = new THREE.MeshBasicMaterial({ toneMapped: false });
  const aura = new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, opacity: 0.48, depthWrite: false });
  if (type === 'pursuitDrone') {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 6).scale(1.05, 0.78, 0.55), core);
    eye.position.set(0.34, 0.04, 0.91);
    const lens = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.063, 6, 12), aura);
    lens.position.copy(eye.position);
    const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8).scale(1.18, 0.84, 0.93), stdM('#f0f0ed', { metalness: 0.36 }));
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.16, 12).scale(1.14, 1, 0.96), stdM('#272832'));
    const mount = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.42, 0.16), stdM('#363644'));
    mount.position.set(0.23, 0.04, 0.83);
    group.add(eye, lens, hull, belt, mount);
    return group;
  }
  let geometry;
  if (type === 'heart') {
    const heart = new THREE.Shape();
    heart.moveTo(0, 0.44);
    heart.lineTo(0.43, 0.79); heart.lineTo(0.85, 0.72); heart.lineTo(1, 0.24);
    heart.lineTo(0.69, -0.18); heart.lineTo(0, -0.87);
    heart.lineTo(-0.69, -0.18); heart.lineTo(-1, 0.24); heart.lineTo(-0.85, 0.72); heart.lineTo(-0.43, 0.79);
    heart.closePath();
    geometry = new THREE.ExtrudeGeometry(heart, { depth: 0.30, bevelEnabled: false }).translate(0, 0, -0.15);
  } else if (type === 'soulFire') {
    geometry = new THREE.IcosahedronGeometry(1, 1).scale(1.2, 0.84, 0.84);
  } else {
    geometry = new THREE.OctahedronGeometry(1).scale(1.6, 0.38, 0.42);
  }
  const shell = new THREE.Mesh(geometry, aura);
  shell.scale.setScalar(1.21);
  group.add(new THREE.Mesh(geometry, core), shell);
  return group;
}
function makeWebBall() {
  const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: '#f8f8ff' });
  for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.05), m); b.rotation.z = i * Math.PI / 4; g.add(b); }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 4, 12), m); g.add(ring);
  return g;
}
function makeTNT() {
  const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
  x.fillStyle = '#c8281e'; x.fillRect(0, 0, 32, 32); x.fillStyle = '#e8e0d0'; x.fillRect(0, 11, 32, 10); x.fillStyle = '#202020'; x.font = 'bold 10px Arial'; x.textAlign = 'center'; x.fillText('TNT', 16, 20);
  x.fillStyle = '#8a1810'; for (let i = 0; i < 32; i += 8) { x.fillRect(i, 0, 2, 11); x.fillRect(i, 21, 2, 11); }
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.62), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }));
  const g = new THREE.Group(); g.add(m); return g;
}
function makeSpring() {
  const g = new THREE.Group();
  const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.35, 10, 1, true), stdM('#c0c4cc', { metalness: 0.9, roughness: 0.25, side: THREE.DoubleSide })); coil.position.y = 0.2;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 12), stdM('#ff3030')); top.position.y = 0.42;
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.5), stdM('#ffd020')); base.position.y = 0.04;
  g.add(coil, top, base); return g;
}
function makeTag(text, color) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 80; const g = c.getContext('2d');
  g.fillStyle = color; g.strokeStyle = '#000'; g.lineWidth = 6;
  g.font = 'italic 900 40px "Arial Black", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.strokeText(text, 64, 30); g.fillText(text, 64, 30);
  g.beginPath(); g.moveTo(48, 54); g.lineTo(80, 54); g.lineTo(64, 74); g.closePath(); g.stroke(); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true, toneMapped: false }));
  s.renderOrder = 20; s.center.set(0.5, 0);
  return s;
}

let game = null;

// ------------------------------------------------------------------ UI helpers
let flashA = 0;
function flash(a) { flashA = Math.max(flashA, a); }
function banner(text, hold) {
  const b = $('#banner'); b.textContent = text; b.className = ''; void b.offsetWidth; b.className = hold ? 'hold' : 'go';
}
function toast(msg) { const t = $('#toast'); t.classList.remove('menu'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2600); }
const pctColor = p => { const k = clamp(p / 160, 0, 1); const c = new THREE.Color().setHSL(lerp(0.16, 0.0, k), lerp(0.0, 1, Math.min(1, p / 40)), lerp(1.0, 0.45, k)); return '#' + c.getHexString(); };
let hudEls = [];
function buildHud(fs) {
  const box = $('#cards'); box.innerHTML = ''; hudEls = [];
  fs.forEach(f => {
    const d = document.createElement('div'); d.className = 'pc'; d.style.setProperty('--pc', f.color);
    d.innerHTML = `<div class="pt"><img src="${portraits[f.id]}"></div><div class="tag">${f.cpu ? (f.boss ? 'BOSS' : 'CPU') : 'P1'}</div><div class="st"></div><div class="rt"><div class="pct">0<small>%</small></div><div class="nm">${CHARS[f.id].name}</div></div>`;
    box.appendChild(d);
    hudEls.push({ d, pct: d.querySelector('.pct'), st: d.querySelector('.st'), last: -1, lastS: -1 });
  });
  updateHud(true);
}
function updateHud(force) {
  if (!game || game.attract) return;
  if (game.cfg.time) { const tl = Math.ceil(game.timeLeft / 60), el = $('#timer'); const txt = Math.floor(tl / 60) + ':' + String(tl % 60).padStart(2, '0'); if (el.textContent !== txt) { el.textContent = txt; el.classList.toggle('low', tl <= 10); } }
  const h = game.fighters.find(f => !f.cpu);
  if (h) { const c = h.comboShow || 0, el = $('#combo'); if (c !== el._c) { el._c = c; el.classList.toggle('on', c >= 2); if (c >= 2) el.innerHTML = `<b>${c}</b><span>HIT COMBO</span>`; } }
  game.fighters.forEach((f, i) => {
    const e = hudEls[i]; if (!e) return;
    const p = Math.floor(f.pct);
    if (p !== e.last || force) {
      if (p > e.last && e.last >= 0) { e.pct.classList.remove('pop'); void e.pct.offsetWidth; e.pct.classList.add('pop'); }
      e.last = p; e.pct.innerHTML = (f.state === 'dead' && f.stocks <= 0 ? '—' : p) + '<small>%</small>'; e.pct.style.color = pctColor(p);
    }
    if (f.stocks !== e.lastS || force || (game.cfg.time && f.score !== e.lastSc)) {
      e.lastS = f.stocks; e.lastSc = f.score;
      if (game.cfg.time || game.cfg.training) e.st.innerHTML = game.cfg.training ? '' : `<b style="font-size:11px;font-style:italic">${f.score > 0 ? '+' : ''}${f.score}</b>`;
      else e.st.innerHTML = Array.from({ length: f.maxStocks || game.cfg.stocks || 3 }, (_, k) => `<i class="${k < f.stocks ? '' : 'gone'}"></i>`).join('');
      e.d.classList.toggle('out', f.stocks <= 0);
    }
  });
}

// ------------------------------------------------------------------ profile + settings
const profile = new Profile();
const PD = () => profile.d;
const sel = { char: PD().last.char || 'blockjack', stage: PD().last.stage || 'overworld', mode: 'vs' };
if (STAGES[params.get('stage')]) sel.stage = params.get('stage');
if (CHARS[params.get('char')]) sel.char = params.get('char');
if (!profile.isUnlocked(sel.char)) sel.char = 'blockjack';
if (+params.get('rivals')) PD().rules.nRivals = clamp(+params.get('rivals'), 1, 3);
const LEVELS = ['easy', 'normal', 'hard'];
function applySettings() {
  const s = PD().settings;
  sound.setMuted(!s.sound); sound.setMusic(s.music);
  input.haptics = s.haptics; game && (game.haptics = s.haptics);
  if (!params.has('q')) {
    const want = s.quality === 'auto' ? (window.__bbSafe ? 'low' : (isMobile ? 'medium' : 'high')) : s.quality;
    autoQ = s.quality === 'auto';
    if (want !== quality) { quality = want; buildComposer(); }
  }
  layoutTouch();
}
function layoutTouch() {
  const s = PD().settings, k = s.tsize || 1, L = !!s.lefty, op = s.topac ?? 0.85;
  const H = innerHeight, small = H < 340 ? 0.86 : 1, K = k * small;
  const side = L ? 'left' : 'right', other = L ? 'right' : 'left';
  const inset = 'max(14px, env(safe-area-inset-' + side + '))';
  const place = (id, size, off, bottom) => { const el = $(id); el.style.width = el.style.height = (size * K) + 'px'; el.style[side] = `calc(${inset} + ${off * K}px)`; el.style[other] = 'auto'; el.style.bottom = (bottom * K) + 'px'; el.style.opacity = op; };
  place('#bA', 84, 96, 22); place('#bB', 70, 118, 122); place('#bJ', 76, 10, 70); place('#bS', 58, 22, 166); place('#bG', 50, 196, 30);
  const z = $('#joyzone'); z.style[other] = '0'; z.style[side] = 'auto';
  const jb = $('#joybase'); jb.style.transform = `scale(${K})`; jb.style.opacity = ''; jb.style.top = ''; jb.style.left = L ? `calc(100% - max(30px, env(safe-area-inset-right)) - 160px)` : '';
  $('#touch').style.setProperty('--topac', op);
}

// ------------------------------------------------------------------ UI helpers (press feedback, haptics, transitions)
function haptic(ms = 10) { if (PD().settings.haptics && navigator.vibrate) try { navigator.vibrate(ms); } catch (_) {} }
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('button, .tile, .card, .stg, .opt-c, .lk-f, .sp');
  if (!b) return;
  b.classList.add('pressed'); haptic(8);
  const up = () => { b.classList.remove('pressed'); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
}, true);
const SCREENS = ['loading', 'title', 'menu', 'select', 'setup', 'ladder', 'locker', 'shop', 'quests', 'stats', 'settings', 'hud', 'results', 'pause'];
let clickGuard = 0, swallowClick = false;
document.addEventListener('pointerdown', () => { swallowClick = false; }, true);
document.addEventListener('click', e => { if ((swallowClick || performance.now() < clickGuard) && !e.target.closest('#touch')) { swallowClick = false; e.stopPropagation(); e.preventDefault(); } }, true);
let curScreen = null;
function showScreen(id) {
  if (id !== curScreen) { clickGuard = performance.now() + 380; swallowClick = true; curScreen = id; }
  for (const s of SCREENS) { const el = $('#' + s); if (el) el.classList.toggle('show', s === id || (id === 'pause' && s === 'hud')); }
  $('#touch').classList.toggle('show', (id === 'hud') && (isTouch || params.has('touch')));
  document.body.classList.toggle('touchui', isTouch || params.has('touch'));
  refreshCoins();
}
function refreshCoins(bump) { document.querySelectorAll('.coinv').forEach(e => { e.textContent = PD().coins.toLocaleString(); if (bump) { e.parentElement.classList.remove('bump'); void e.parentElement.offsetWidth; e.parentElement.classList.add('bump'); } }); }
document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => { sound.sfx('back'); goBack(); }));
const lockSvg = '<svg viewBox="0 0 24 24"><path d="M7 10V7a5 5 0 0 1 10 0v3h1.5v11h-13V10zm2.2 0h5.6V7a2.8 2.8 0 0 0-5.6 0z"/></svg>';
const SWATCH = { default: 'linear-gradient(135deg,#ff6a3a,#3a8aff)', shadow: '#2a2830', gold: 'linear-gradient(135deg,#fff0a0,#d89a10)', frost: 'linear-gradient(135deg,#e0f4ff,#6ab0e0)', crimson: '#c01a2a', neon: 'linear-gradient(135deg,#3af0ff,#ff3ac8)', greenbro: '#2ab040', darkhog: 'linear-gradient(135deg,#1a1a24,#c01a1a)', symbiote: '#0c0c14', charged: 'linear-gradient(135deg,#40e0ff,#c0fff0)', wither: '#1a1a1a', netherite: '#3a3240', toxic: 'linear-gradient(135deg,#0c1a0c,#5aff3a)', stonehide: 'linear-gradient(135deg,#c8ccd4,#6a7080)' };
const HAT_IC = { none: '∅', crown: '♛', tophat: '🎩', party: '▲', halo: '◯', horns: 'ᗑ', shades: '▬▬', phones: '∩', propeller: '✢' };
const KO_IC = { classic: '➤', fireworks: '✺', lightning: 'ϟ', confetti: '❖', voidburst: '◉', pixels: '▦' };
const POSE_IC = { default: '★', cheer: '\\o/', dance: '♪', flex: 'ᕦᕤ', wave: 'o/', spin: '↻' };

// ------------------------------------------------------------------ main menu
function refreshMenu() {
  const d = PD();
  $('#plAv').src = portraits[sel.char] || portraits.blockjack;
  $('#plLv').textContent = 'LV ' + d.lvl; $('#plTitle').textContent = titleName(d.title);
  $('#plXp').style.width = (100 * d.xp / xpForLevel(d.lvl)) + '%';
  $('#plXpTxt').textContent = `${d.xp} / ${xpForLevel(d.lvl)} XP`;
  const qn = d.daily.quests.filter(q => q.done && !q.claimed).length;
  $('#qBadge').textContent = qn; $('#qBadge').classList.toggle('on', qn > 0);
  const art = (sel, ids) => { const el = document.querySelector(sel + ' .t-art'); el.innerHTML = ids.map(i => `<img src="${portraits[i]}" alt="">`).join(''); };
  art('.t-vs', [sel.char, 'malgore']); art('.t-classic', ['ironclad']); art('.t-train', ['bolt']);
  refreshCoins();
}
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => {
  sound.sfx('select'); const g = b.dataset.go;
  if (g === 'vs' || g === 'classic' || g === 'training') { sel.mode = g; goSelect(); }
  else if (g === 'locker') goLocker(); else if (g === 'shop') goShop(); else if (g === 'quests') goQuests(); else if (g === 'stats') goStats();
}));
$('#mSettings').onclick = () => { sound.sfx('select'); goSettings(); };

// ------------------------------------------------------------------ fighter select
function buildSelect() {
  const r = $('#roster'); r.innerHTML = '';
  CHAR_ORDER.forEach((id, i) => {
    const c = CHARS[id];
    const d = document.createElement('button'); d.className = 'card'; d.dataset.id = id; d.style.setProperty('--cc', c.color); d.style.animationDelay = (i * 0.025) + 's';
    r.appendChild(d);
    d.addEventListener('click', () => {
      if (!profile.isUnlocked(id)) { sound.sfx('back'); toastSel(CHARS[id].name + ' · ' + profile.unlockHint(id) + ' OR BUY IN SHOP'); return; }
      if (sel.char !== id) { sel.char = id; sound.sfx('select'); refreshSelect(true); }
    });
  });
  $('#selNext').onclick = () => { sound.sfx('select'); if (sel.mode === 'classic') startClassic(); else goSetup(); };
  $('#selLocker').onclick = () => { sound.sfx('select'); lockerChar = sel.char; goLocker(true); };
}
function toastSel(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on', 'menu'); t.style.zIndex = 50; clearTimeout(toastSel.h); toastSel.h = setTimeout(() => t.classList.remove('on'), 2400); document.body.appendChild(t); }
function refreshSelect(changed) {
  const c = CHARS[sel.char];
  document.querySelectorAll('.card').forEach(d => {
    const id = d.dataset.id, un = profile.isUnlocked(id), f = profile.fighter(id);
    d.classList.toggle('on', id === sel.char); d.classList.toggle('locked', !un);
    d.innerHTML = `<img src="${portraits[id]}" alt="">${un ? `<div class="lvb">LV${f.lvl}</div>` : `<div class="lock">${lockSvg}${profile.unlockHint(id).replace('REACH ', '')}</div>`}<div class="nm">${un ? CHARS[id].name : '???'}</div>`;
  });
  $('#selMode').textContent = { vs: 'SMASH', classic: 'CLASSIC LADDER', training: 'TRAINING' }[sel.mode];
  $('#selNext span').textContent = sel.mode === 'classic' ? 'START' : 'NEXT';
  $('#selInfo').style.setProperty('--cc', c.color);
  const f = profile.fighter(sel.char);
  $('#ciTitle').textContent = c.title.toUpperCase(); $('#ciName').textContent = c.name;
  $('#ciLv').innerHTML = `MASTERY<b>LV ${f.lvl}</b> · ${f.wins} WINS · ${f.kos} KOS`;
  $('#ciStats').innerHTML = Object.entries(c.stats).map(([k, v]) => `<span>${k.toUpperCase()}</span><div class="bar"><i style="width:${v * 20}%"></i></div>`).join('');
  $('#ciMoves').innerHTML = `${c.desc}<br>${c.nSpecial}<b>B</b> ${c.upSpecial}<b>↑B</b>` + (c.dSpecial ? ` ${c.dSpecial}<b>↓B</b>` : '') + (c.inspired ? `<div class="ci-insp">Tribute to ${c.inspired}</div>` : '');
  if (changed || !showPuppet || showPuppet.id !== sel.char) { setShowPuppet(sel.char, false, profile.cos(sel.char)); showPuppet.demoT = 0; }
}

// ------------------------------------------------------------------ stage + rules setup
function goSetup() {
  mode = 'setup'; showScreen('setup'); ensureAttract();
  const row = $('#stageRow'); row.innerHTML = '';
  STAGE_ORDER.forEach((id, i) => {
    const st = STAGES[id]; const d = document.createElement('button'); d.className = 'stg'; d.dataset.id = id; d.style.animationDelay = (i * 0.04) + 's';
    d.innerHTML = `<img src="${stageThumbs[id]}" alt=""><div class="sn">${st.name}<small>${st.hazard && st.hazard !== 'None' ? '⚠ ' + st.hazard : st.sub}</small></div>`;
    d.onclick = () => { sel.stage = id; sound.sfx('move'); refreshSetup(); };
    row.appendChild(d);
  });
  const R = PD().rules;
  document.querySelectorAll('#rules .seg').forEach(seg => {
    const k = seg.dataset.rule;
    seg.querySelectorAll('button').forEach(b => { if (!b.querySelector('span')) b.innerHTML = `<span>${b.textContent}</span>`; b.onclick = () => { let v = b.dataset.v; if (v === 'true' || v === 'false') v = v === 'true'; else if (!isNaN(+v)) v = +v; R[k] = v; sound.sfx('move'); refreshSetup(); }; });
  });
  $('#setupFight').onclick = () => startFight();
  refreshSetup();
}
function refreshSetup() {
  const R = PD().rules; const training = sel.mode === 'training';
  document.querySelectorAll('.stg').forEach(d => d.classList.toggle('on', d.dataset.id === sel.stage));
  document.querySelectorAll('#rules .seg').forEach(seg => { const k = seg.dataset.rule; seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', String(R[k]) === b.dataset.v)); });
  document.querySelectorAll('#rules [data-show]').forEach(r => r.classList.toggle('hide', r.dataset.show !== R.mode));
  document.querySelectorAll('#rules .rule').forEach(r => { const k = r.querySelector('.seg')?.dataset.rule; if (training && ['mode', 'stocks', 'time', 'level'].includes(k)) r.classList.add('hide'); });
  // CPU slots
  const box = $('#cpuSlots'); box.innerHTML = '';
  const n = training ? 1 : 3;
  for (let i = 0; i < n; i++) {
    const on = training || i < R.nRivals, ch = R.rivals[i];
    const d = document.createElement('div'); d.className = 'slot' + (on ? '' : ' off'); d.style.setProperty('--pc', PCOLORS[i + 1]);
    d.innerHTML = `<div class="sp"><span class="tag">${training ? 'DUMMY' : 'CPU ' + (i + 1)}</span>${on && ch ? `<img src="${portraits[ch]}">` : `<div class="q">${on ? '?' : '+'}</div>`}</div><div class="sl">${on ? (ch ? CHARS[ch].name : 'RANDOM') : 'OFF'}</div>` + (training ? '' : `<button class="tg">${on ? 'REMOVE' : 'ADD'}</button>`);
    d.querySelector('.sp').onclick = () => {
      if (!on) { R.nRivals = i + 1; } else { const pool = [null, ...CHAR_ORDER.filter(id => profile.isUnlocked(id))]; R.rivals[i] = pool[(pool.indexOf(ch ?? null) + 1) % pool.length]; }
      sound.sfx('move'); refreshSetup();
    };
    const tg = d.querySelector('.tg'); if (tg) tg.onclick = () => { R.nRivals = on ? Math.max(1, i) : i + 1; sound.sfx('move'); refreshSetup(); };
    box.appendChild(d);
  }
  profile.save();
}

// ------------------------------------------------------------------ classic ladder
let classic = null;
function startClassic() {
  const pool = CHAR_ORDER.filter(id => id !== sel.char && id !== 'malgore').sort(() => Math.random() - 0.5);
  const stages = [...STAGE_ORDER].sort(() => Math.random() - 0.5);
  classic = { char: sel.char, step: 0, rungs: [
    { opps: [pool[0]], level: 'easy', stage: stages[0] },
    { opps: [pool[1]], level: 'normal', stage: stages[1] },
    { opps: [pool[2], pool[3]], level: 'normal', stage: stages[2] },
    { opps: [sel.char], level: 'hard', stage: stages[3], mirror: true },
    { opps: [pool[4], pool[5], pool[6]], level: 'normal', stage: stages[4] },
    { opps: ['malgore'], level: 'hard', stage: 'nether', boss: true },
  ], kos: 0 };
  goLadder();
}
function goLadder() {
  mode = 'ladder'; showScreen('ladder'); ensureAttract();
  const tr = $('#ladderTrack'); tr.innerHTML = '';
  classic.rungs.forEach((r, i) => {
    const d = document.createElement('div'); d.className = 'rung' + (i < classic.step ? ' done' : '') + (i === classic.step ? ' cur' : '') + (r.boss ? ' boss' : '');
    d.innerHTML = `<img src="${portraits[r.opps[0]]}">${r.opps.length > 1 ? `<span class="multi">×${r.opps.length}</span>` : ''}<div class="rn">${r.boss ? 'GIANT ' + CHARS.malgore.name : r.mirror ? 'DARK MIRROR' : 'ROUND ' + (i + 1)}</div>`;
    tr.appendChild(d);
  });
  const r = classic.rungs[classic.step];
  $('#ladderInfo').innerHTML = `<div class="li-a">${r.boss ? 'FINAL BOSS: GIANT ' + CHARS.malgore.name : 'ROUND ' + (classic.step + 1) + ' · VS ' + r.opps.map(o => CHARS[o].name).join(' + ')}</div><div class="li-b">${STAGES[r.stage].name} · CPU ${r.level.toUpperCase()} · ${r.boss ? '3 STOCKS VS 2' : '2 STOCKS'}</div>`;
  $('#ladderGo').onclick = () => startClassicFight();
  $('#ladderQuit').onclick = () => { sound.sfx('back'); classic = null; goMenu(); };
}
function startClassicFight() {
  const r = classic.rungs[classic.step];
  const players = [{ char: classic.char, cpu: false, cos: profile.cos(classic.char) }];
  r.opps.forEach((o, i) => players.push({ char: o, cpu: true, level: r.level, boss: !!r.boss, cos: r.mirror ? { skin: 'shadow', hat: 'horns' } : r.boss ? { skin: 'default', hat: 'crown' } : {} }));
  startFight({ stage: r.stage, stocks: r.boss ? 3 : 2, cpuStocks: r.boss ? 2 : 2, items: 'low', hazards: true, players, classic: true, boss: !!r.boss });
}

// ------------------------------------------------------------------ locker
let lockerChar = null, lockerTab = 'skin', lockerFrom = 'menu';
function goLocker(fromSelect) {
  lockerFrom = fromSelect ? 'select' : 'menu';
  if (!lockerChar || !profile.isUnlocked(lockerChar)) lockerChar = sel.char;
  mode = 'locker'; showMode = 'locker'; showScreen('locker');
  const fl = $('#lkFighters'); fl.innerHTML = '';
  CHAR_ORDER.forEach(id => {
    const d = document.createElement('button'); d.className = 'lk-f' + (profile.isUnlocked(id) ? '' : ' locked'); d.dataset.id = id;
    d.innerHTML = `<img src="${portraits[id]}">`;
    d.onclick = () => { if (!profile.isUnlocked(id)) { sound.sfx('back'); return; } lockerChar = id; sound.sfx('select'); refreshLocker(true); };
    fl.appendChild(d);
  });
  document.querySelectorAll('#lkTabs button').forEach(b => b.onclick = () => { lockerTab = b.dataset.t; sound.sfx('move'); refreshLocker(); });
  refreshLocker(true);
}
function optionsFor(tab, id) {
  if (tab === 'skin') return Object.entries(PALETTES).filter(([k, p]) => !p.only || p.only === id).map(([k, p]) => ({ id: k, name: p.name, sw: SWATCH[k] }));
  if (tab === 'hat') return Object.entries(HATS).map(([k, h]) => ({ id: k, name: h.name, ic: HAT_IC[k] }));
  if (tab === 'pose') return Object.entries(POSES).map(([k, p]) => ({ id: k, name: p.name, ic: POSE_IC[k] }));
  if (tab === 'ko') return Object.entries(KO_FX).map(([k, p]) => ({ id: k, name: p.name, ic: KO_IC[k] }));
  if (tab === 'title') return [...new Set([...Object.keys(TITLES), ...PD().own.title])].map(k => ({ id: k, name: titleName(k), ic: '❝❞' }));
}
function howToGet(t, id) {
  for (const [lv, rs] of Object.entries(LEVEL_REWARDS)) for (const r of rs) if (r.t === t && r.id === id) return 'LV ' + lv;
  const sh = SHOP.find(s => s.t === t && s.id === id); if (sh) return sh.price + '¢';
  if (t === 'skin' && PALETTES[id]?.only) return 'MASTERY 3';
  if (t === 'skin' && id === 'neon') return 'SHOP';
  return 'SPECIAL';
}
function refreshLocker(rebuild) {
  const id = lockerChar, cos = profile.cos(id), d = PD();
  document.querySelectorAll('.lk-f').forEach(e => e.classList.toggle('on', e.dataset.id === id));
  document.querySelectorAll('#lkTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === lockerTab));
  const cur = { skin: cos.skin, hat: cos.hat, pose: d.pose, ko: d.ko, title: d.title }[lockerTab];
  const g = $('#lkGrid'); g.innerHTML = '';
  for (const o of optionsFor(lockerTab, id)) {
    const owned = profile.owns(lockerTab, o.id);
    const e = document.createElement('button'); e.className = 'opt-c' + (o.id === cur ? ' eq' : '') + (owned ? '' : ' lk');
    e.innerHTML = (o.sw ? `<div class="sw" style="background:${o.sw}"></div>` : `<div class="ic">${o.ic}</div>`) + `<div class="on">${o.name}</div>` + (owned ? '' : `<div class="req">${howToGet(lockerTab, o.id)}</div>`);
    e.onclick = () => {
      if (!owned) { sound.sfx('back'); $('#lkHint').textContent = `${o.name}: unlock at ${howToGet(lockerTab, o.id)}${SHOP.find(s => s.t === lockerTab && s.id === o.id) ? ' (Shop)' : ''}`; return; }
      profile.equip(id, lockerTab, o.id); sound.sfx('select'); haptic(15);
      $('#lkHint').textContent = 'EQUIPPED ' + o.name;
      refreshLocker(lockerTab === 'skin' || lockerTab === 'hat' || lockerTab === 'pose');
      if (lockerTab === 'ko') showFx.burst(0, 1.6, 0, CHARS[id].color, 30, 6, 0.8, 0.3);
    };
    g.appendChild(e);
  }
  $('#lkName').innerHTML = `<small>${titleName(d.title)}</small>${CHARS[id].name}`;
  if (rebuild) { setShowPuppet(id, lockerTab === 'pose', profile.cos(id)); }
}

// ------------------------------------------------------------------ shop
let shopTab = 'all';
function goShop() {
  mode = 'shop'; showScreen('shop'); ensureAttract();
  document.querySelectorAll('#shopTabs button').forEach(b => b.onclick = () => { shopTab = b.dataset.t; sound.sfx('move'); refreshShop(); });
  refreshShop();
}
function refreshShop() {
  document.querySelectorAll('#shopTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === shopTab));
  const g = $('#shopGrid'); g.innerHTML = '';
  const list = SHOP.filter(s => shopTab === 'all' || s.t === shopTab).sort((a, b) => profile.owns(a.t, a.id) - profile.owns(b.t, b.id) || a.price - b.price);
  list.forEach((it, i) => {
    const owned = profile.owns(it.t, it.id), afford = PD().coins >= it.price;
    const e = document.createElement('div'); e.className = 'sh-c' + (owned ? ' owned' : ''); e.style.animationDelay = (i * 0.02) + 's';
    let pv = '';
    if (it.t === 'char') pv = `<img src="${portraits[it.id]}">`;
    else if (it.t === 'skin') pv = `<div class="sw" style="background:${SWATCH[it.id]}"></div>`;
    else pv = `<div class="ic">${{ hat: HAT_IC, ko: KO_IC, pose: POSE_IC, title: {} }[it.t][it.id] || '❝❞'}</div>`;
    const nm = rewardName(it).split(': ')[1];
    e.innerHTML = `<div class="pv">${pv}</div><div class="ty">${{ char: 'FIGHTER', skin: 'SKIN', hat: 'HAT', ko: 'KO EFFECT', pose: 'VICTORY POSE', title: 'TITLE' }[it.t]}</div><div class="nm">${nm}</div><button class="buy${owned || afford ? '' : ' no'}">${owned ? 'OWNED' : `<i></i>${it.price}`}</button>`;
    e.querySelector('.buy').onclick = () => {
      if (owned) return;
      if (!afford) { sound.sfx('back'); toastSel('NOT ENOUGH COINS · WIN MATCHES & CLEAR CHALLENGES'); return; }
      if (profile.buy(it)) { sound.sfx('buy'); haptic(30); refreshCoins(true); toastSel('UNLOCKED ' + nm + '!'); refreshShop(); if (it.t === 'char') buildSelect(); }
    };
    g.appendChild(e);
  });
}

// ------------------------------------------------------------------ quests
function goQuests() {
  mode = 'quests'; showScreen('quests'); ensureAttract(); profile.ensureDaily();
  const names = q => q.id === 'stage' ? STAGES[q.arg].name : CHARS[q.arg].name;
  const l = $('#qList'); l.innerHTML = '';
  PD().daily.quests.forEach((q, i) => {
    const e = document.createElement('div'); e.className = 'q-c' + (q.done ? ' done' : ''); e.style.animationDelay = (i * 0.06) + 's';
    e.innerHTML = `<div class="qi">${q.done ? '✓' : '★'}</div><div class="qt"><div class="qn">${profile.questText(q, names)}</div><div class="qb"><i style="width:${100 * q.prog / q.n}%"></i></div><div class="qp">${q.prog} / ${q.n}</div></div>` + (q.done && !q.claimed ? `<button class="claim">CLAIM ${q.reward}</button>` : `<div class="qr">${q.claimed ? 'CLAIMED' : '+' + q.reward}</div>`);
    const c = e.querySelector('.claim'); if (c) c.onclick = () => { const n = profile.claim(q); sound.sfx('buy'); haptic(30); refreshCoins(true); toastSel('+' + n + ' COINS'); goQuests(); };
    l.appendChild(e);
  });
  const lv = PD().lvl; let h = `<h4>LEVEL ROAD</h4>`;
  for (const [L, rs] of Object.entries(LEVEL_REWARDS)) h += `<div class="lv-r${+L <= lv ? ' got' : ''}${+L === lv + 1 ? ' next' : ''}"><b>LV ${L}</b><span>${rs.map(rewardName).join('<br>')}</span></div>`;
  h += `<h4 style="margin-top:10px">FIGHTER MASTERY</h4><div class="lv-r"><b>LV 2</b><span>40 coins</span></div><div class="lv-r"><b>LV 3</b><span>Signature skin (where available)</span></div><div class="lv-r"><b>LV 5</b><span>"&lt;FIGHTER&gt; MAIN" title</span></div><div class="lv-r"><b>LV 7</b><span>120 coins</span></div><div class="lv-r"><b>LV 10</b><span>NEON skin</span></div>`;
  $('#qLevels').innerHTML = h;
}

// ------------------------------------------------------------------ stats
function goStats() {
  mode = 'stats'; showScreen('stats'); ensureAttract();
  const s = PD().stats, mins = Math.round(s.time / 60);
  const T = [['MATCHES', s.games], ['WINS', s.wins], ['WIN RATE', s.games ? Math.round(100 * s.wins / s.games) + '%' : '—'], ['KOS', s.kos], ['FALLS', s.falls], ['DAMAGE', s.dmg + '%'], ['POWER-UPS', s.items], ['BEST COMBO', s.bestCombo], ['CLASSIC CLEARS', s.classic], ['PLAY TIME', mins + 'm']];
  $('#stTotals').innerHTML = T.map(([k, v]) => `<div class="st-t"><b>${v}</b><span>${k}</span></div>`).join('');
  $('#stTable').innerHTML = `<tr><th>FIGHTER</th><th>MASTERY</th><th>GAMES</th><th>WINS</th><th>KOS</th></tr>` + CHAR_ORDER.map(id => { const f = profile.fighter(id); const un = profile.isUnlocked(id); return `<tr><td><img src="${portraits[id]}">${un ? CHARS[id].name : '???'}</td><td>${f.lvl}<span class="mbar"><i style="width:${f.lvl >= 10 ? 100 : 100 * f.xp / fxpForLevel(f.lvl)}%"></i></span></td><td>${f.games}</td><td>${f.wins}</td><td>${f.kos}</td></tr>`; }).join('');
}

// ------------------------------------------------------------------ settings
function goSettings() {
  mode = 'settings'; showScreen('settings'); ensureAttract();
  const S = PD().settings;
  document.querySelectorAll('#setGrid .seg').forEach(seg => {
    const k = seg.dataset.set;
    seg.querySelectorAll('button').forEach(b => {
      if (!b.querySelector('span')) b.innerHTML = `<span>${b.textContent}</span>`;
      b.classList.toggle('on', String(S[k]) === b.dataset.v);
      b.onclick = () => { let v = b.dataset.v; if (v === 'true' || v === 'false') v = v === 'true'; else if (!isNaN(+v)) v = +v; S[k] = v; profile.save(); applySettings(); sound.sfx('move'); goSettings(); };
    });
  });
  $('#setReset').onclick = () => { if (!$('#setReset').dataset.arm) { $('#setReset').dataset.arm = 1; $('#setReset').textContent = 'TAP AGAIN TO CONFIRM'; return; } profile.reset(); delete $('#setReset').dataset.arm; $('#setReset').textContent = 'RESET PROGRESS'; sel.char = 'blockjack'; buildSelect(); applySettings(); toastSel('PROGRESS RESET'); goSettings(); };
}

// ------------------------------------------------------------------ flow
let mode = 'loading';
let lastScreen = 'menu';
function ensureAttract() {
  if (game.attract && game.fighters.length) return;
  const ids = [...CHAR_ORDER].sort(() => Math.random() - 0.5).slice(0, 4);
  game.startMatch({ stage: STAGE_ORDER[Math.floor(Math.random() * STAGE_ORDER.length)], attract: true, players: ids.map(id => ({ char: id, cpu: true, level: 'hard' })) });
  sound.music('menu');
}
function goTitle() { mode = 'title'; showScreen('title'); game.attract = false; ensureAttract(); }
function goMenu() { mode = 'menu'; showScreen('menu'); ensureAttract(); refreshMenu(); sound.music('menu'); }
function goSelect() { mode = 'select'; showMode = 'select'; showScreen('select'); refreshSelect(true); sound.music('menu'); }
function goBack() {
  if (mode === 'select') goMenu();
  else if (mode === 'setup') goSelect();
  else if (mode === 'ladder') { classic = null; goMenu(); }
  else if (mode === 'locker' && lockerFrom === 'select') goSelect();
  else goMenu();
}
function startFight(cfg) {
  if (!navigator.userActivation || navigator.userActivation.hasBeenActive) sound.init();
  const R = PD().rules;
  if (!cfg) {
    const training = sel.mode === 'training';
    const owned = CHAR_ORDER.filter(id => id !== sel.char);
    const randomPool = owned.sort(() => Math.random() - 0.5);
    const n = training ? 1 : R.nRivals;
    const rivals = []; for (let i = 0; i < n; i++) { let c = R.rivals[i]; if (!c) c = randomPool.find(x => !rivals.includes(x)) || 'bristle'; rivals.push(c); }
    cfg = { stage: sel.stage, stocks: R.stocks, time: !training && R.mode === 'time' ? R.time * 60 : 0, items: training ? 'off' : R.items, hazards: R.hazards, training,
      players: [{ char: sel.char, cpu: false, cos: profile.cos(sel.char) }, ...rivals.map(id => ({ char: id, cpu: true, level: training ? 'easy' : R.level, cos: Math.random() < 0.35 ? { skin: ['shadow', 'gold', 'frost', 'crimson', 'neon'][Math.floor(Math.random() * 5)], hat: Object.keys(HATS)[Math.floor(Math.random() * 9)] } : {} }))] };
    PD().last.stage = sel.stage; profile.save();
  }
  sound.sfx('go');
  mode = 'fight'; showScreen('hud');
  game.startMatch(cfg); input.clear();
  $('#trainPanel').classList.toggle('on', !!cfg.training);
  $('#timer').classList.toggle('on', !!cfg.time);
  sound.music(null);
  perf.acc = 0; perf.n = 0; perf.grace = 2;
}
let lastResult = null;
function showResults() {
  mode = 'results'; showMode = 'results';
  const w = game.winner, human = game.fighters.find(f => !f.cpu), cfg = game.cfg;
  setShowPuppet(w.id, true, w.cos || {});
  $('#results').style.setProperty('--wc', w.color);
  const won = human && w === human;
  $('#resWin').textContent = cfg.classic ? (won ? (cfg.boss ? 'CHAMPION!' : 'VICTORY') : 'DEFEATED') : 'WINNER';
  $('#resName').textContent = CHARS[w.id].name;
  $('#resSub').textContent = (w.cpu ? 'CPU' : 'PLAYER 1') + ' WINS' + (cfg.time ? ' · TIME' : '');
  const rows = [...game.fighters].sort((a, b) => (b === w) - (a === w) || b.score - a.score || b.stocks - a.stocks || b.kos - a.kos);
  $('#resTable').innerHTML = `<tr><th></th><th>KOS</th><th>FALLS</th><th>DMG</th></tr>` + rows.map(f => `<tr style="--pc:${f.color}"><td>${f.cpu ? 'CPU' : 'P1'} · ${CHARS[f.id].name}</td><td>${f.kos}</td><td>${f.falls}</td><td>${Math.round(f.dealt)}%</td></tr>`).join('');
  // progression
  let clear = false;
  if (cfg.classic && classic && won) { classic.step++; if (classic.step >= classic.rungs.length) clear = true; }
  const res = human ? profile.applyMatch({ char: human.id, won, kos: human.kos, falls: human.falls, dmg: human.dealt, items: human.itemsTaken || 0, stage: cfg.stage, classic: !!cfg.classic, classicClear: clear, boss: !!cfg.boss && won, combo: human.maxCombo || 0, secs: Math.round(game.t), training: cfg.training }) : null;
  lastResult = res;
  showScreen('results'); layoutShowCam();
  animateProgress(res, human);
  // buttons
  if (cfg.classic) {
    $('#rAgain span').textContent = clear ? 'FINISH' : won ? 'CONTINUE' : 'RETRY';
    $('#rSelect').textContent = 'GIVE UP'; $('#rTitle').textContent = 'MENU';
  } else { $('#rAgain span').textContent = 'REMATCH'; $('#rSelect').textContent = 'FIGHTERS'; $('#rTitle').textContent = 'MENU'; }
  if (clear) { classic = null; }
  for (let i = 0; i < 4; i++) setTimeout(() => showFx.burst((Math.random() - 0.5) * 3, 3 + Math.random() * 2, 0, ['#ffd040', '#ff4a6a', '#40c0ff', '#a0ff60'][i], 50, 8, 1.6, 0.25, { grav: 0.6, drag: 1.2 }), i * 250);
  sound.sfx('cheer'); sound.music('menu');
}
function animateProgress(res, human) {
  const pg = $('#prog'); pg.style.display = res ? '' : 'none'; if (!res) return;
  const d = PD(), f = profile.fighter(human.id);
  $('#pgFName').textContent = CHARS[human.id].name;
  $('#pgUnlocks').innerHTML = '';
  let lv = res.before.lvl, xp = res.before.xp, flv = res.fBefore.lvl, fxp = res.fBefore.xp;
  const setBars = () => { $('#pgLv').textContent = 'LV ' + lv; $('#pgBar').style.width = (100 * xp / xpForLevel(lv)) + '%'; $('#pgFLv').textContent = 'LV ' + flv; $('#pgFBar').style.width = (flv >= 10 ? 100 : 100 * fxp / fxpForLevel(flv)) + '%'; };
  $('#pgBar').style.transition = 'none'; $('#pgFBar').style.transition = 'none'; setBars(); void pg.offsetWidth;
  $('#pgBar').style.transition = ''; $('#pgFBar').style.transition = '';
  $('#pgXp').textContent = '+0 XP'; $('#pgCoins').textContent = '+0';
  let shownXp = 0, shownC = 0, remaining = res.xp, fRemaining = res.xp, luQueue = [...res.levelUps];
  const chips = [];
  for (const l of res.levelUps) chips.push(...l.rewards.map(r => rewardName(r)));
  for (const l of res.fLevelUps) chips.push(...l.rewards.map(r => CHARS[human.id].name + ' ' + rewardName(r)));
  const quests = res.quests.map(q => 'CHALLENGE DONE: +' + q.reward + ' (claim in Challenges)');
  const tick = () => {
    if (mode !== 'results') return;
    const stepX = Math.max(1, Math.ceil(res.xp / 40));
    if (remaining > 0) {
      const a = Math.min(stepX, remaining); remaining -= a; shownXp += a; xp += a;
      if (xp >= xpForLevel(lv)) { xp -= xpForLevel(lv); lv++; $('#pgLv').classList.remove('up'); void pg.offsetWidth; $('#pgLv').classList.add('up'); const L = luQueue.shift(); levelUpPop(lv, L ? L.rewards : []); }
    }
    if (fRemaining > 0) {
      const a = Math.min(stepX, fRemaining); fRemaining -= a; if (flv < 10) { fxp += a; if (fxp >= fxpForLevel(flv)) { fxp -= fxpForLevel(flv); flv++; sound.sfx('levelup'); } }
    }
    if (shownC < res.coins) { shownC = Math.min(res.coins, shownC + Math.max(1, Math.ceil(res.coins / 30))); }
    $('#pgXp').textContent = '+' + shownXp + ' XP'; $('#pgCoins').innerHTML = '+' + shownC + ' ¢';
    setBars(); if (remaining % 3 === 0) sound.sfx('tick');
    if (remaining > 0 || fRemaining > 0 || shownC < res.coins) setTimeout(tick, 45);
    else { refreshCoins(true); const u = $('#pgUnlocks'); chips.forEach((c, i) => { const s = document.createElement('span'); s.textContent = c; s.style.animationDelay = (i * 0.08) + 's'; u.appendChild(s); }); quests.forEach(c => { const s = document.createElement('span'); s.className = 'q'; s.textContent = c; u.appendChild(s); }); if (res.levelUps.some(l => l.rewards.some(r => r.t === 'char'))) buildSelect(); }
  };
  setTimeout(tick, 900);
}
function levelUpPop(lv, rewards) {
  sound.sfx('levelup'); haptic(40);
  $('#luLv').textContent = lv; $('#luRew').innerHTML = rewards.length ? rewards.map(rewardName).join('<br>') : 'Keep brawling!';
  const el = $('#levelup'); el.classList.add('on'); clearTimeout(levelUpPop.h); levelUpPop.h = setTimeout(() => el.classList.remove('on'), 1900);
  for (let i = 0; i < 3; i++) setTimeout(() => showFx.burst((Math.random() - 0.5) * 3, 2.5, 0, '#ffd040', 40, 9, 1.2, 0.3, { grav: 0.5 }), i * 150);
}
function pause(on) {
  if (mode !== 'fight') return;
  game.paused = on; showScreen(on ? 'pause' : 'hud');
  if (on) sound.music(null); else if (game.phase === 'fight') sound.music('battle');
}
$('#pauseBtn').addEventListener('click', () => pause(true));
$('#pResume').onclick = () => pause(false);
$('#pRestart').onclick = () => { game.paused = false; startFight(game.cfg); };
$('#pQuit').onclick = () => { game.paused = false; if (game.cfg.classic) { classic = null; goMenu(); } else goSelect(); };
$('#pGfx').onclick = () => { const order = ['auto', 'low', 'medium', 'high']; const S = PD().settings; S.quality = order[(order.indexOf(S.quality) + 1) % 4]; profile.save(); applySettings(); $('#pGfx').textContent = 'GRAPHICS: ' + S.quality.toUpperCase(); };
$('#pSnd').onclick = () => { const S = PD().settings; S.sound = !S.sound; profile.save(); applySettings(); $('#pSnd').textContent = 'SOUND: ' + (S.sound ? 'ON' : 'OFF'); };
$('#rAgain').onclick = () => { if (game.cfg.classic) { if (classic) goLadder(); else goMenu(); } else startFight(game.cfg); };
$('#rSelect').onclick = () => { if (game.cfg.classic) { classic = null; goMenu(); } else goSelect(); };
$('#rTitle').onclick = () => { classic = null; goMenu(); };
document.querySelectorAll('#tpDummy button').forEach(b => b.onclick = () => { game.dummyMode = b.dataset.v; document.querySelectorAll('#tpDummy button').forEach(x => x.classList.toggle('on', x === b)); });
$('#tpItem').onclick = () => { const h = game.fighters[0]; game.items.spawn(game.items.randomType(), clamp(h.x + h.facing * 2, -7, 7), h.y + 5); sound.sfx('item'); };
$('#tpReset').onclick = () => { for (const f of game.fighters) f.pct = 0; updateHud(true); };
function requestFS() {
  const el = document.documentElement;
  try { const p = (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el, { navigationUI: 'hide' }); if (p && p.catch) p.catch(() => {}); } catch (_) {}
  try { screen.orientation?.lock?.('landscape').catch(() => {}); } catch (_) {}
}
$('#title').addEventListener('pointerdown', () => { if (mode !== 'title') return; sound.init(); applySettings(); sound.sfx('select'); if (isTouch) requestFS(); goMenu(); });
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (mode === 'title' && (k === 'enter' || k === ' ' || k === 'j')) { sound.init(); applySettings(); sound.sfx('select'); goMenu(); }
  else if (mode === 'select') {
    if (k === 'enter') $('#selNext').click();
    if (k === 'arrowright' || k === 'arrowleft') { const un = CHAR_ORDER.filter(id => profile.isUnlocked(id)); const i = un.indexOf(sel.char); sel.char = un[(i + (k === 'arrowright' ? 1 : un.length - 1)) % un.length]; sound.sfx('select'); refreshSelect(true); }
    if (k === 'escape') goBack();
  } else if (mode === 'setup' && k === 'enter') startFight();
  else if (mode === 'fight' && (k === 'escape' || k === 'p')) pause(!game.paused);
  else if (mode === 'results' && k === 'enter') $('#rAgain').click();
  else if (k === 'escape' && !['fight', 'title', 'loading'].includes(mode)) goBack();
});
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'fight' && !game.paused) pause(true); });

// ------------------------------------------------------------------ loop
const perf = { acc: 0, n: 0, grace: 2 };
const WORLD_MODES = new Set(['title', 'menu', 'setup', 'ladder', 'shop', 'quests', 'stats', 'settings']);
let last = performance.now(), acc = 0, time = 0;
function loop(now) {
  requestAnimationFrame(loop);
  let dt = Math.min(0.1, (now - last) / 1000); last = now; time += dt;
  if (mode === 'fight' || WORLD_MODES.has(mode)) {
    if (!game.paused) {
      acc += dt * game.timeScale; let n = 0;
      while (acc >= DT && n < 5) { game.step(); acc -= DT; n++; }
      if (n === 5) acc = 0;
    }
    const sdt = game.paused ? 0 : dt * game.timeScale;
    game.frameCamera(dt, false);
    for (const f of game.fighters) f.animate(sdt, time);
    game.tags.forEach((t, i) => { const f = game.fighters[i]; t.visible = f.state !== 'dead' && game.phase !== 'gameset'; const s = camera.position.z * 0.05; t.scale.set(s, s * 0.625, 1); t.position.set(f.x, f.y + f.h + 0.35, 0.5); });
    if (!game.paused) { game.fx.update(sdt); game.ambient(sdt); }
    updateHud(false);
    render(world, camera);
    if (mode === 'fight' && !game.paused && autoQ) {
      if (perf.grace > 0) perf.grace -= dt; else {
        perf.acc += dt; perf.n++;
        if (perf.acc > 3) { const avg = perf.acc / perf.n; if (avg > 1 / 42 && quality !== 'low') { quality = QLIST[QLIST.indexOf(quality) - 1]; buildComposer(); toast('GRAPHICS SET TO ' + quality.toUpperCase() + ' FOR SMOOTHER PLAY'); perf.grace = 2; } perf.acc = 0; perf.n = 0; }
      }
    }
  } else if (mode === 'select' || mode === 'results' || mode === 'locker') {
    if (showPuppet) {
      const p = showPuppet;
      p.anim.t += dt; p.demoT = (p.demoT || 0) + dt;
      if (mode === 'select' && p.state === 'idle' && p.demoT > 0.35 && !p.demoDone && !p.victory) { p.demoDone = true; p.moveKey = 'ftilt'; p.move = p.moves.ftilt; p.state = 'attack'; p.stateT = 0; }
      if (p.state === 'attack') { p.stateT++; if (p.stateT >= p.move.t) { p.state = 'idle'; p.stateT = 0; } }
      p.animate(dt, time);
      showStuff.ped.rotation.y += dt * 0.3;
      showStuff.beam.material.opacity = mode === 'locker' ? 0.07 : 0.25; showStuff.fill.intensity = mode === 'locker' ? 1.8 : 0;
      p.rig.root.rotation.y = mode === 'select' ? Math.sin(time * 0.6) * 0.35 - 0.1 : mode === 'locker' ? Math.sin(time * 0.5) * 0.35 - 0.95 : -0.25;
      if (Math.random() < dt * 20) showFx.spawn((Math.random() - 0.5) * 4, 0.4, (Math.random() - 0.5) * 4, 0, 1 + Math.random() * 2, 0, ...new THREE.Color(CHARS[p.id].color).multiplyScalar(2).toArray(), 2, 0.08 + Math.random() * 0.1, 0, 0, 0);
    }
    showStuff.dome.material.uniforms.t.value = time;
    showFx.update(dt);
    render(show, showCam);
  }
  if (flashA > 0) { $('#flash').style.opacity = flashA.toFixed(2); flashA = Math.max(0, flashA - dt * 2.5); if (flashA === 0) $('#flash').style.opacity = 0; }
}
function render(scene, cam) {
  if (composer) { renderPass.scene = scene; renderPass.camera = cam; composer.render(); }
  else renderer.render(scene, cam);
}

// ------------------------------------------------------------------ boot
async function boot() {
  setLoad(0.1, 'FORGING THE ARENA…'); await nextFrame();
  buildComposer();
  buildShowScene();
  game = new Game();
  buildComposer();
  setLoad(0.3, 'SUMMONING FIGHTERS…'); await nextFrame();
  makePortraits();
  const msgs = { overworld: 'CARVING THE PEAKS…', nether: 'RAISING THE NETHER…', loop: 'LOOPING THE LOOP…', castle: 'STACKING ? BLOCKS…', rooftops: 'WIRING THE NEON…' };
  for (let i = 0; i < STAGE_ORDER.length; i++) { const id = STAGE_ORDER[i]; setLoad(0.4 + 0.45 * i / STAGE_ORDER.length, msgs[id] || 'BUILDING…'); await nextFrame(); game.getStage(id); }
  makeStageThumbs();
  buildSelect();
  setLoad(0.9, 'WARMING UP SHADERS…'); await nextFrame();
  // precompile
  game.startMatch({ stage: 'nether', attract: true, players: CHAR_ORDER.slice(0, 4).map(id => ({ char: id, cpu: true, level: 'hard' })) });
  renderer.compile(world, camera);
  render(world, camera);
  setShowPuppet('blockjack', false);
  render(show, showCam);
  setLoad(1, 'READY');
  window.__bbReady = true;
  setTimeout(() => { if (window.__bbReady && window.__bbLS) window.__bbLS.del('bb-booting'); }, 8000);
  addEventListener('resize', onResize);
  addEventListener('orientationchange', () => setTimeout(onResize, 300));
  onResize();
  requestAnimationFrame(loop);
  applySettings();
  const start = params.get('start');
  if (start === 'menu') goMenu();
  else if (start === 'select') { sel.mode = params.get('mode') || 'vs'; goSelect(); }
  else if (start === 'fight') { sel.mode = 'vs'; startFight(); }
  else goTitle();
}
window.__bb = { stageThumbs, profile, goMenu, goSetup, goLocker, goShop, goQuests, goStats, goSettings, startClassic, goLadder, get classic() { return classic; }, get game() { return game; }, input, sound, startFight, goSelect, goTitle, showResults, sel, get mode() { return mode; }, get quality() { return quality; }, renderer };
boot().catch(e => { console.error(e); $('#loadtxt').textContent = 'ERROR: ' + e.message; window.__bbFail && window.__bbFail('Something went wrong', 'The game hit an error while loading. Try reloading, or tap Low graphics.', (e && (e.stack || e.message)) || String(e)); });
