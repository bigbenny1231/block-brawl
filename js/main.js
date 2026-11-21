// Block Brawl - main: renderer, screens, match flow, camera, HUD
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CHARS, CHAR_ORDER, BASE_YAW } from './characters.js';
import { STAGES, STAGE_ORDER, buildStage, BlockTextures } from './stages.js';
import { FX } from './fx.js';
import { Fighter, PCOLORS, DT } from './fighter.js';
import { AI } from './ai.js';
import { Input } from './input.js';
import { Sound } from './audio.js';

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
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance', stencil: false });
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const QLIST = ['low', 'medium', 'high'];
const QSET = {
  low: { pr: 1, shadow: 0, bloom: false, msaa: 0 },
  medium: { pr: 1.5, shadow: 1024, bloom: true, msaa: 0 },
  high: { pr: 2, shadow: 2048, bloom: true, msaa: 4 },
};
let quality = QLIST.includes(params.get('q')) ? params.get('q') : (isMobile ? 'medium' : 'high');
const autoQ = !params.has('q');

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
  const pr = Math.min(devicePixelRatio || 1, q.pr);
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
  showStuff.rimA = rimA;
  showFx = new FX(show);
  show.fog = new THREE.Fog('#0a0612', 12, 40);
}
let showPuppet = null, showMode = 'select';
function setShowPuppet(charId, victory) {
  if (showPuppet) { show.remove(showPuppet.rig.root); disposeRig(showPuppet.rig); }
  const stub = { hitstopT: 0, fighters: [], sfx() {} };
  const p = new Fighter(stub, 0, charId, false, 'normal');
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
    const headSize = id === 'malgore' ? 1.0 : id === 'gogo' ? 0.75 : 0.6;
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
    const bt = BlockTextures;
    this.blockGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    this.blockMats = [bt.grassSide(), bt.grassSide(), bt.grassTop(), bt.dirt(), bt.grassSide(), bt.grassSide()].map(t => new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }));
    this.pillarMat = new THREE.MeshStandardMaterial({ map: bt.stone(), roughness: 0.9, transparent: true });
    this.pool = { block: [], banana: [], pillar: [], arrow: [], fireball: [], web: [], bomb: [], spring: [] };
    this.webMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 5), new THREE.MeshBasicMaterial({ color: '#f4f4ff' })); this.webMesh.visible = false; world.add(this.webMesh); this.webT = 0;
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
    if (this.stage) world.remove(this.stage.group);
    const st = this.stage = this.getStage(cfg.stage);
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
      f.stocks = this.attract ? 99 : (cfg.stocks || 3);
      world.add(f.rig.root);
      return f;
    });
    this.ais = this.fighters.map(f => (f.cpu ? new AI(f, f.level) : null));
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
    this.fx.koBlast(bx, by, dx, dy, f.color);
    f.stocks--; f.falls++;
    if (f.lastHitter && this.frame - f.lastHitT < 600) f.lastHitter.kos++;
    f.state = 'dead'; f.stateT = 0; f.respawnT = 90; f.rig.root.visible = false; f.vx = f.vy = f.kbx = f.kby = 0;
    sound.sfx('ko'); this.shake(1.6); flash(0.5);
    if (!this.attract) {
      updateHud(true);
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
      if (live) inp = f.cpu ? this.ais[i].think(this) : pin;
      if (this.phase === 'gameset' && f === this.winner) inp = EMPTY;
      f.update(inp);
    });
    if (this.webT > 0 && --this.webT === 0) this.webMesh.visible = false;
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
          if (p.x > pl.x0 && p.x < pl.x1 && p.y - p.r <= pl.top && p.y - p.r - p.vy * DT >= pl.top - 0.05) { p.y = pl.top + p.r; p.vy = p.bounce; break; }
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
    } else if (this.phase === 'gameset') {
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
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2600); }
function showScreen(id) {
  for (const s of ['loading', 'title', 'select', 'hud', 'results', 'pause']) $('#' + s).classList.toggle('show', s === id || (id === 'pause' && s === 'hud'));
  $('#touch').classList.toggle('show', (id === 'hud') && (isTouch || params.has('touch')));
  document.body.classList.toggle('touchui', isTouch || params.has('touch'));
}
const pctColor = p => { const k = clamp(p / 160, 0, 1); const c = new THREE.Color().setHSL(lerp(0.16, 0.0, k), lerp(0.0, 1, Math.min(1, p / 40)), lerp(1.0, 0.45, k)); return '#' + c.getHexString(); };
let hudEls = [];
function buildHud(fs) {
  const box = $('#cards'); box.innerHTML = ''; hudEls = [];
  fs.forEach(f => {
    const d = document.createElement('div'); d.className = 'pc'; d.style.setProperty('--pc', f.color);
    d.innerHTML = `<div class="pt"><img src="${portraits[f.id]}"></div><div class="tag">${f.cpu ? 'CPU' : 'P1'}</div><div class="st"></div><div class="rt"><div class="pct">0<small>%</small></div><div class="nm">${CHARS[f.id].name}</div></div>`;
    box.appendChild(d);
    hudEls.push({ d, pct: d.querySelector('.pct'), st: d.querySelector('.st'), last: -1, lastS: -1 });
  });
  updateHud(true);
}
function updateHud(force) {
  if (!game || game.attract) return;
  game.fighters.forEach((f, i) => {
    const e = hudEls[i]; if (!e) return;
    const p = Math.floor(f.pct);
    if (p !== e.last || force) {
      if (p > e.last && e.last >= 0) { e.pct.classList.remove('pop'); void e.pct.offsetWidth; e.pct.classList.add('pop'); }
      e.last = p; e.pct.innerHTML = (f.state === 'dead' && f.stocks <= 0 ? '—' : p) + '<small>%</small>'; e.pct.style.color = pctColor(p);
    }
    if (f.stocks !== e.lastS || force) {
      e.lastS = f.stocks; e.st.innerHTML = Array.from({ length: game.cfg.stocks || 3 }, (_, k) => `<i class="${k < f.stocks ? '' : 'gone'}"></i>`).join('');
      e.d.classList.toggle('out', f.stocks <= 0);
    }
  });
}

// ------------------------------------------------------------------ select screen
const sel = { char: 'blockjack', rivals: Math.min(2, 3), level: 'normal', stage: 'overworld' };
try { Object.assign(sel, JSON.parse(localStorage.getItem('bb.sel') || '{}')); } catch (_) {}
if (STAGES[params.get('stage')]) sel.stage = params.get('stage');
if (CHARS[params.get('char')]) sel.char = params.get('char');
if (+params.get('rivals')) sel.rivals = clamp(+params.get('rivals'), 1, 3);
function buildSelect() {
  const r = $('#roster'); r.innerHTML = '';
  CHAR_ORDER.forEach(id => {
    const c = CHARS[id];
    const d = document.createElement('button'); d.className = 'card'; d.dataset.id = id; d.style.setProperty('--cc', c.color);
    d.innerHTML = `<img src="${portraits[id]}" alt=""><div class="nm">${c.name}</div>`;
    d.addEventListener('click', () => { if (sel.char !== id) { sel.char = id; sound.sfx('select'); refreshSelect(true); } });
    r.appendChild(d);
  });
  const seg = (el, key) => el.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { sel[key] = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v; sound.sfx('move'); refreshSelect(); }));
  seg($('#optRivals'), 'rivals'); seg($('#optLevel'), 'level');
  $('#stPrev').onclick = () => { cycleStage(-1); }; $('#stNext').onclick = () => { cycleStage(1); };
  $('#fightBtn').onclick = () => startFight();
  $('#selBack').onclick = () => { sound.sfx('back'); goTitle(); };
}
function cycleStage(d) { const i = STAGE_ORDER.indexOf(sel.stage); sel.stage = STAGE_ORDER[(i + d + STAGE_ORDER.length) % STAGE_ORDER.length]; sound.sfx('move'); refreshSelect(); }
function refreshSelect(changed) {
  const c = CHARS[sel.char];
  document.querySelectorAll('.card').forEach(d => d.classList.toggle('on', d.dataset.id === sel.char));
  document.querySelectorAll('#optRivals button').forEach(b => b.classList.toggle('on', +b.dataset.v === sel.rivals));
  document.querySelectorAll('#optLevel button').forEach(b => b.classList.toggle('on', b.dataset.v === sel.level));
  $('#stName').textContent = STAGES[sel.stage].name;
  $('#selInfo').style.setProperty('--cc', c.color);
  $('#ciTitle').textContent = c.title.toUpperCase(); $('#ciName').textContent = c.name;
  $('#ciStats').innerHTML = Object.entries(c.stats).map(([k, v]) => `<span>${k.toUpperCase()}</span><div class="bar"><i style="width:${v * 20}%"></i></div>`).join('');
  $('#ciMoves').innerHTML = `${c.desc}<br>${c.nSpecial}<b>B</b><br>${c.upSpecial}<b>↑B</b>`;
  if (changed || !showPuppet || showPuppet.id !== sel.char) { setShowPuppet(sel.char, false); showPuppet.demoT = 0; }
  try { localStorage.setItem('bb.sel', JSON.stringify(sel)); } catch (_) {}
}

// ------------------------------------------------------------------ flow
let mode = 'loading';
function goTitle() {
  mode = 'title'; showScreen('title');
  const ids = [...CHAR_ORDER].sort(() => Math.random() - 0.5).slice(0, 4);
  game.startMatch({ stage: Math.random() < 0.5 ? 'overworld' : 'nether', attract: true, players: ids.map(id => ({ char: id, cpu: true, level: 'hard' })) });
  sound.music('menu');
}
function goSelect() {
  mode = 'select'; showMode = 'select'; showScreen('select'); refreshSelect(true); sound.music('menu');
}
function startFight(cfg) {
  if (!navigator.userActivation || navigator.userActivation.hasBeenActive) sound.init();
  if (!cfg) {
    const others = CHAR_ORDER.filter(id => id !== sel.char).sort(() => Math.random() - 0.5);
    cfg = { stage: sel.stage, stocks: 3, players: [{ char: sel.char, cpu: false }, ...others.slice(0, sel.rivals).map(id => ({ char: id, cpu: true, level: sel.level }))] };
  }
  sound.sfx('select');
  mode = 'fight'; showScreen('hud');
  game.startMatch(cfg); input.clear();
  sound.music(null);
  perf.acc = 0; perf.n = 0; perf.grace = 2;
}
function showResults() {
  mode = 'results'; showMode = 'results';
  const w = game.winner;
  setShowPuppet(w.id, true);
  $('#results').style.setProperty('--wc', w.color);
  $('#resName').textContent = CHARS[w.id].name;
  $('#resSub').textContent = (w.cpu ? 'CPU' : 'PLAYER 1') + ' WINS';
  const rows = [...game.fighters].sort((a, b) => (b === w) - (a === w) || b.stocks - a.stocks || b.kos - a.kos);
  $('#resTable').innerHTML = `<tr><th></th><th>KOS</th><th>FALLS</th><th>DMG DEALT</th></tr>` + rows.map(f => `<tr style="--pc:${f.color}"><td>${f.cpu ? 'CPU' : 'P1'} · ${CHARS[f.id].name}</td><td>${f.kos}</td><td>${f.falls}</td><td>${Math.round(f.dealt)}%</td></tr>`).join('');
  showScreen('results'); layoutShowCam();
  for (let i = 0; i < 4; i++) setTimeout(() => showFx.burst((Math.random() - 0.5) * 3, 3 + Math.random() * 2, 0, ['#ffd040', '#ff4a6a', '#40c0ff', '#a0ff60'][i], 50, 8, 1.6, 0.25, { grav: 0.6, drag: 1.2 }), i * 250);
  sound.sfx('cheer'); sound.music('menu');
}
function pause(on) {
  if (mode !== 'fight') return;
  game.paused = on; showScreen(on ? 'pause' : 'hud');
  if (on) sound.music(null); else if (game.phase === 'fight') sound.music('battle');
}
$('#pauseBtn').addEventListener('click', () => pause(true));
$('#pResume').onclick = () => pause(false);
$('#pRestart').onclick = () => { game.paused = false; startFight(game.cfg); };
$('#pQuit').onclick = () => { game.paused = false; goSelect(); };
$('#pGfx').onclick = () => { quality = QLIST[(QLIST.indexOf(quality) + 2) % 3]; buildComposer(); };
$('#pSnd').onclick = () => { sound.setMuted(!sound.muted); $('#pSnd').textContent = 'SOUND: ' + (sound.muted ? 'OFF' : 'ON'); };
$('#rAgain').onclick = () => startFight(game.cfg);
$('#rSelect').onclick = () => goSelect();
$('#rTitle').onclick = () => goTitle();
function requestFS() {
  const el = document.documentElement;
  try { const p = (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el, { navigationUI: 'hide' }); if (p && p.catch) p.catch(() => {}); } catch (_) {}
  try { screen.orientation?.lock?.('landscape').catch(() => {}); } catch (_) {}
}
$('#title').addEventListener('pointerdown', () => { if (mode !== 'title') return; sound.init(); sound.sfx('select'); if (isTouch) requestFS(); goSelect(); });
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (mode === 'title' && (k === 'enter' || k === ' ' || k === 'j')) { sound.init(); sound.sfx('select'); goSelect(); }
  else if (mode === 'select') {
    if (k === 'enter') startFight();
    if (k === 'arrowright' || k === 'arrowleft' || k === 'a' || k === 'd') { const i = CHAR_ORDER.indexOf(sel.char); sel.char = CHAR_ORDER[(i + (k === 'arrowright' || k === 'd' ? 1 : CHAR_ORDER.length - 1)) % CHAR_ORDER.length]; sound.sfx('select'); refreshSelect(true); }
    if (k === 'escape') goTitle();
  } else if (mode === 'fight' && (k === 'escape' || k === 'p')) pause(!game.paused);
  else if (mode === 'results' && k === 'enter') startFight(game.cfg);
});
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'fight' && !game.paused) pause(true); });

// ------------------------------------------------------------------ loop
const perf = { acc: 0, n: 0, grace: 2 };
let last = performance.now(), acc = 0, time = 0;
function loop(now) {
  requestAnimationFrame(loop);
  let dt = Math.min(0.1, (now - last) / 1000); last = now; time += dt;
  if (mode === 'fight' || mode === 'title') {
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
  } else if (mode === 'select' || mode === 'results') {
    if (showPuppet) {
      const p = showPuppet;
      p.anim.t += dt; p.demoT = (p.demoT || 0) + dt;
      if (mode === 'select' && p.state === 'idle' && p.demoT > 0.35 && !p.demoDone) { p.demoDone = true; p.moveKey = 'ftilt'; p.move = p.moves.ftilt; p.state = 'attack'; p.stateT = 0; }
      if (p.state === 'attack') { p.stateT++; if (p.stateT >= p.move.t) { p.state = 'idle'; p.stateT = 0; } }
      p.animate(dt, time);
      showStuff.ped.rotation.y += dt * 0.3;
      p.rig.root.rotation.y = mode === 'select' ? Math.sin(time * 0.6) * 0.35 - 0.1 : -0.25;
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
  setLoad(0.55, 'RAISING THE NETHER…'); await nextFrame();
  game.getStage('nether');
  setLoad(0.75, 'CARVING THE PEAKS…'); await nextFrame();
  game.getStage('overworld');
  buildSelect();
  setLoad(0.9, 'WARMING UP SHADERS…'); await nextFrame();
  // precompile
  game.startMatch({ stage: 'nether', attract: true, players: CHAR_ORDER.slice(0, 4).map(id => ({ char: id, cpu: true, level: 'hard' })) });
  renderer.compile(world, camera);
  render(world, camera);
  setShowPuppet('blockjack', false);
  render(show, showCam);
  setLoad(1, 'READY');
  addEventListener('resize', onResize);
  addEventListener('orientationchange', () => setTimeout(onResize, 300));
  onResize();
  requestAnimationFrame(loop);
  const start = params.get('start');
  if (start === 'select') goSelect();
  else if (start === 'fight') { goSelect(); startFight(); }
  else goTitle();
}
window.__bb = { get game() { return game; }, input, sound, startFight, goSelect, goTitle, showResults, sel, get mode() { return mode; }, get quality() { return quality; }, renderer };
boot().catch(e => { console.error(e); $('#loadtxt').textContent = 'ERROR: ' + e.message; });
