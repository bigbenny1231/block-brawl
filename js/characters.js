// Block Brawl - procedural voxel character models (original homage designs)
import * as THREE from '../lib/three.module.min.js';
import { DEMON_HUNTER_IDS, makeDemonHunters } from './demon-hunters.js';
import { WORKSHOP_IDS, makeWorkshopFighters } from './workshop-fighters.js';
import { SHELL_IDS, SHELL_PALETTES, makeShellFighters } from './shell-kings.js';

const _c = new THREE.Color();
export const BASE_YAW = Math.PI / 2 - 0.52;

let CUR_XF = null;
function paint(geo, color, jitter = 0.05, glow = 1) {
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  _c.set(color);
  if (CUR_XF) CUR_XF(_c, String(color).toLowerCase(), glow > 1);
  const j = 1 + (Math.random() * 2 - 1) * jitter;
  for (let i = 0; i < n; i++) {
    arr[i * 3] = _c.r * j * glow; arr[i * 3 + 1] = _c.g * j * glow; arr[i * 3 + 2] = _c.b * j * glow;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

export function mergeGeos(geos) {
  const ng = geos.map(g => (g.index ? g.toNonIndexed() : g));
  let total = 0; ng.forEach(g => (total += g.attributes.position.count));
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3);
  let o = 0;
  for (const g of ng) {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    col.set(g.attributes.color.array, o * 3);
    o += c;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere();
  return out;
}

class P {
  constructor() { this.m = []; this.k = []; this.g = []; }
  _push(g, kind) { (kind === 'metal' ? this.k : kind === 'glow' ? this.g : this.m).push(g); return this; }
  box(w, h, d, x, y, z, col, o = {}) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (o.rx) g.rotateX(o.rx); if (o.ry) g.rotateY(o.ry); if (o.rz) g.rotateZ(o.rz);
    g.translate(x, y, z);
    paint(g, col, o.j ?? 0.05, o.glow || 1);
    return this._push(g, o.kind);
  }
  geo(g, x, y, z, col, o = {}) {
    if (o.rx) g.rotateX(o.rx); if (o.ry) g.rotateY(o.ry); if (o.rz) g.rotateZ(o.rz);
    g.translate(x, y, z);
    paint(g, col, o.j ?? 0.03, o.glow || 1);
    return this._push(g, o.kind);
  }
  mesh(mats) {
    const grp = new THREE.Group();
    for (const [arr, mat, glow] of [[this.m, mats.matte, 0], [this.k, mats.metal, 0], [this.g, mats.glow, 1]]) {
      if (!arr.length) continue;
      const me = new THREE.Mesh(mergeGeos(arr), mat);
      me.castShadow = !glow; me.receiveShadow = !glow;
      grp.add(me);
    }
    return grp;
  }
}

function makeMats() {
  return {
    matte: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0.04 }),
    metal: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.26, metalness: 0.9 }),
    glow: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
  };
}

// Assemble a rig. All coordinates in world units with feet at y=0.
function assemble(def, mats) {
  const root = new THREE.Group();
  const spin = new THREE.Group(); spin.position.y = def.h / 2; root.add(spin);
  const inner = new THREE.Group(); inner.position.y = -def.h / 2; spin.add(inner);
  const face = new THREE.Group(); face.rotation.y = BASE_YAW; inner.add(face);
  const hips = new THREE.Group(); hips.position.y = def.hipY; face.add(hips);
  const torso = def.torso.mesh(mats); hips.add(torso);
  const head = new THREE.Group(); head.position.y = def.neckY - def.hipY; hips.add(head);
  head.add(def.head.mesh(mats));
  const armR = new THREE.Group(); armR.position.set(-def.shX, def.shY - def.hipY, 0); hips.add(armR);
  armR.add(def.armR.mesh(mats));
  const armL = new THREE.Group(); armL.position.set(def.shX, def.shY - def.hipY, 0); hips.add(armL);
  armL.add(def.armL.mesh(mats));
  const weapon = new THREE.Group(); weapon.position.y = def.handY; armR.add(weapon);
  if (def.weapon) weapon.add(def.weapon.mesh(mats));
  const legR = new THREE.Group(); legR.position.set(-def.legX, def.hipY, 0); face.add(legR);
  legR.add(def.legR.mesh(mats));
  const legL = new THREE.Group(); legL.position.set(def.legX, def.hipY, 0); face.add(legL);
  legL.add(def.legL.mesh(mats));
  let cape = null;
  if (def.cape) { cape = new THREE.Group(); cape.position.set(0, def.capeY - def.hipY, def.capeZ); hips.add(cape); cape.add(def.cape.mesh(mats)); }
  return { root, spin, inner, face, hips, torso, head, armR, armL, weapon, legR, legL, cape, mats, h: def.h };
}

// ---------------------------------------------------------------- Blockjack
function buildBlockjack(mats) {
  const skin = '#c8936a', shirt = '#17a5a0', shirtD = '#118580', pants = '#2c4ca6', hair = '#3a2414';
  const legR = new P(), legL = new P();
  for (const L of [legR, legL]) {
    L.box(0.25, 0.75, 0.25, 0, -0.375, 0, pants);
    L.box(0.26, 0.13, 0.27, 0, -0.69, 0.005, '#55555e');
  }
  const torso = new P()
    .box(0.5, 0.75, 0.25, 0, 0.375, 0, shirt)
    .box(0.5, 0.12, 0.255, 0, 0.62, 0, shirtD)
    .box(0.52, 0.08, 0.27, 0, 0.05, 0, '#5a3a1e')
    .box(0.1, 0.08, 0.28, 0.0, 0.05, 0.002, '#d4b040', { kind: 'metal' })
    .box(0.2, 0.06, 0.26, 0, 0.72, 0.0, skin)
    .box(0.12, 0.2, 0.08, 0.17, 0.12, -0.16, '#6b4422'); // tool pouch
  const head = new P()
    .box(0.5, 0.5, 0.5, 0, 0.25, 0, skin)
    .box(0.52, 0.12, 0.52, 0, 0.45, 0, hair)
    .box(0.52, 0.32, 0.06, 0, 0.3, -0.24, hair)
    .box(0.06, 0.16, 0.44, 0.24, 0.36, -0.02, hair).box(0.06, 0.16, 0.44, -0.24, 0.36, -0.02, hair)
    .box(0.125, 0.0625, 0.02, 0.125, 0.22, 0.255, '#ffffff').box(0.125, 0.0625, 0.02, -0.125, 0.22, 0.255, '#ffffff')
    .box(0.0625, 0.0625, 0.025, 0.094, 0.22, 0.258, '#3d33b8').box(0.0625, 0.0625, 0.025, -0.094, 0.22, 0.258, '#3d33b8')
    .box(0.125, 0.07, 0.03, 0, 0.15, 0.255, '#9a6446')
    .box(0.26, 0.0625, 0.02, 0, 0.08, 0.255, '#5a3820')
    .box(0.5, 0.06, 0.02, 0, 0.035, 0.252, '#7a5034')
    // miner helmet
    .box(0.56, 0.15, 0.56, 0, 0.53, 0, '#f2b10e', { j: 0.02 })
    .box(0.62, 0.04, 0.64, 0, 0.45, 0.02, '#d99a08')
    .box(0.15, 0.13, 0.07, 0, 0.52, 0.3, '#cfcfd4', { kind: 'metal' })
    .box(0.11, 0.09, 0.02, 0, 0.52, 0.338, '#fff2b0', { kind: 'glow', glow: 3 });
  const mkArm = (P_) => P_.box(0.25, 0.3, 0.25, 0, 0.0, 0, shirt).box(0.255, 0.04, 0.255, 0, -0.13, 0, shirtD).box(0.25, 0.46, 0.25, 0, -0.38, 0, skin);
  const armR = mkArm(new P()), armL = mkArm(new P());
  const weapon = new P()
    .box(0.07, 0.07, 1.0, 0, 0, 0.32, '#7a5230')
    .box(0.09, 0.09, 0.1, 0, 0, 0.0, '#5a3a20')
    .box(0.1, 0.66, 0.12, 0, 0, 0.8, '#47e6d6', { kind: 'metal', j: 0.02 })
    .box(0.09, 0.16, 0.1, 0, 0.36, 0.74, '#7ffff0', { kind: 'metal' })
    .box(0.09, 0.16, 0.1, 0, -0.36, 0.74, '#7ffff0', { kind: 'metal' })
    .box(0.03, 0.5, 0.03, 0.05, 0, 0.86, '#b8fff8', { kind: 'glow', glow: 1.6 });
  return assemble({ h: 2.05, hipY: 0.75, neckY: 1.5, shY: 1.375, shX: 0.375, handY: -0.58, legX: 0.125, torso, head, armR, armL, legR, legL, weapon }, mats);
}

// ---------------------------------------------------------------- Bristle
function buildBristle(mats) {
  const skin = '#e3a096', skinD = '#c9827a', gold = '#f5c13a', leather = '#6e4527';
  const legR = new P(), legL = new P();
  for (const L of [legR, legL]) {
    L.box(0.27, 0.78, 0.28, 0, -0.39, 0, leather);
    L.box(0.3, 0.26, 0.31, 0, -0.66, 0.01, gold, { kind: 'metal' });
  }
  const torso = new P()
    .box(0.58, 0.8, 0.3, 0, 0.4, 0, leather)
    .box(0.62, 0.46, 0.35, 0, 0.53, 0, gold, { kind: 'metal' })
    .box(0.2, 0.2, 0.36, 0, 0.5, 0.005, '#ffe9a0', { kind: 'metal' })
    .box(0.6, 0.09, 0.33, 0, 0.18, 0, '#3a2414')
    .box(0.12, 0.1, 0.34, 0, 0.18, 0.003, gold, { kind: 'metal' })
    .box(0.6, 0.14, 0.32, 0, 0.82, 0, skinD);
  const head = new P()
    .box(0.64, 0.54, 0.52, 0, 0.27, 0, skin)
    .box(0.3, 0.22, 0.12, 0, 0.15, 0.31, '#f2b6aa')
    .box(0.06, 0.07, 0.02, 0.07, 0.15, 0.372, '#6d3a36').box(0.06, 0.07, 0.02, -0.07, 0.15, 0.372, '#6d3a36')
    .box(0.06, 0.13, 0.06, 0.2, 0.08, 0.27, '#f6ecd2').box(0.06, 0.13, 0.06, -0.2, 0.08, 0.27, '#f6ecd2')
    .box(0.12, 0.07, 0.02, 0.16, 0.33, 0.265, '#ffffff').box(0.12, 0.07, 0.02, -0.16, 0.33, 0.265, '#ffffff')
    .box(0.05, 0.07, 0.025, 0.13, 0.33, 0.27, '#2a1a12').box(0.05, 0.07, 0.025, -0.13, 0.33, 0.27, '#2a1a12')
    .box(0.16, 0.04, 0.03, 0.16, 0.39, 0.265, '#7a3a30', { rz: -0.15 }).box(0.16, 0.04, 0.03, -0.16, 0.39, 0.265, '#7a3a30', { rz: 0.15 })
    .box(0.09, 0.26, 0.2, 0.36, 0.3, 0, skinD, { rz: 0.45 }).box(0.09, 0.26, 0.2, -0.36, 0.3, 0, skinD, { rz: -0.45 })
    .box(0.66, 0.09, 0.54, 0, 0.5, 0, gold, { kind: 'metal' })
    .box(0.1, 0.16, 0.1, 0, 0.6, 0.2, gold, { kind: 'metal' })
    .box(0.05, 0.08, 0.05, 0.42, 0.18, 0, gold, { kind: 'metal' });
  const mkArm = (A) => A.box(0.24, 0.76, 0.26, 0, -0.26, 0, skin).box(0.28, 0.24, 0.3, 0, -0.48, 0, gold, { kind: 'metal' }).box(0.3, 0.18, 0.32, 0, 0.04, 0, gold, { kind: 'metal' });
  const armR = mkArm(new P()), armL = mkArm(new P());
  const weapon = new P()
    .box(0.07, 0.07, 0.28, 0, 0, 0.04, '#4a2a14')
    .box(0.34, 0.07, 0.09, 0, 0, 0.2, gold, { kind: 'metal' })
    .box(0.045, 0.17, 0.95, 0, 0, 0.7, '#ffd75a', { kind: 'metal', j: 0.01 })
    .box(0.045, 0.1, 0.12, 0, 0, 1.22, '#ffe58a', { kind: 'metal' })
    .box(0.02, 0.04, 0.85, 0.025, 0, 0.7, '#fff3c0', { kind: 'glow', glow: 1.4 });
  return assemble({ h: 2.12, hipY: 0.78, neckY: 1.58, shY: 1.45, shX: 0.41, handY: -0.6, legX: 0.15, torso, head, armR, armL, legR, legL, weapon }, mats);
}

// ---------------------------------------------------------------- Voidwalker
function buildVoidwalker(mats) {
  const blk = '#17121d', blk2 = '#221a2c', eye = '#d665ff';
  const legR = new P(), legL = new P();
  for (const L of [legR, legL]) L.box(0.15, 1.5, 0.15, 0, -0.75, 0, blk).box(0.152, 0.04, 0.152, 0, -0.9, 0, blk2);
  const torso = new P()
    .box(0.46, 0.8, 0.24, 0, 0.4, 0, blk)
    .box(0.3, 0.3, 0.245, 0, 0.5, 0, blk2)
    .box(0.03, 0.22, 0.02, 0.1, 0.42, 0.125, '#a040ff', { kind: 'glow', glow: 1.6 })
    .box(0.03, 0.16, 0.02, -0.08, 0.55, 0.125, '#a040ff', { kind: 'glow', glow: 1.6 });
  const head = new P()
    .box(0.48, 0.42, 0.48, 0, 0.21, 0, blk)
    .box(0.48, 0.06, 0.4, 0, -0.02, 0.04, blk2)
    .box(0.17, 0.055, 0.02, 0.12, 0.2, 0.245, eye, { kind: 'glow', glow: 4 })
    .box(0.17, 0.055, 0.02, -0.12, 0.2, 0.245, eye, { kind: 'glow', glow: 4 })
    .box(0.06, 0.055, 0.025, 0.09, 0.2, 0.25, '#ffffff', { kind: 'glow', glow: 3 })
    .box(0.06, 0.055, 0.025, -0.09, 0.2, 0.25, '#ffffff', { kind: 'glow', glow: 3 });
  const mkArm = (A) => A.box(0.13, 1.45, 0.13, 0, -0.68, 0, blk).box(0.135, 0.05, 0.135, 0, -0.7, 0, blk2);
  const armR = mkArm(new P()), armL = mkArm(new P());
  const weapon = new P()
    .geo(new THREE.OctahedronGeometry(0.17, 0), 0, -0.05, 0.12, '#c070ff', { kind: 'glow', glow: 2.6 });
  return assemble({ h: 2.95, hipY: 1.5, neckY: 2.3, shY: 2.22, shX: 0.3, handY: -1.38, legX: 0.11, torso, head, armR, armL, legR, legL, weapon }, mats);
}

// ---------------------------------------------------------------- Gogo
function buildGogo(mats) {
  const yel = '#ffd61f', denim = '#2e5fb3', blk = '#18181a';
  const legR = new P(), legL = new P();
  for (const L of [legR, legL]) {
    L.geo(new THREE.CylinderGeometry(0.1, 0.1, 0.24, 10), 0, -0.1, 0, denim);
    L.box(0.19, 0.1, 0.27, 0, -0.26, 0.04, blk);
  }
  const hipY = 0.3; // body built relative to hips
  const torso = new P()
    .geo(new THREE.CapsuleGeometry(0.4, 0.42, 8, 18), 0, 0.82 - hipY, 0, yel, { j: 0.01 })
    .geo(new THREE.CylinderGeometry(0.413, 0.413, 0.22, 18, 1, true), 0, 0.71 - hipY, 0, denim, { j: 0.01 })
    .geo(new THREE.SphereGeometry(0.413, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 0, 0.61 - hipY, 0, denim, { j: 0.01 })
    .box(0.34, 0.26, 0.06, 0, 0.9 - hipY, 0.37, denim)
    .box(0.1, 0.1, 0.02, 0, 0.88 - hipY, 0.405, '#141414')
    .box(0.06, 0.06, 0.025, 0, 0.88 - hipY, 0.41, '#7fd0ff', { kind: 'glow', glow: 1.5 })
    .box(0.05, 0.34, 0.03, 0.15, 1.05 - hipY, 0.32, denim, { rx: -0.35 })
    .box(0.05, 0.34, 0.03, -0.15, 1.05 - hipY, 0.32, denim, { rx: -0.35 })
    .box(0.06, 0.06, 0.04, 0.15, 0.98 - hipY, 0.39, '#c0c0c8', { kind: 'metal' })
    .box(0.06, 0.06, 0.04, -0.15, 0.98 - hipY, 0.39, '#c0c0c8', { kind: 'metal' });
  const head = new P(); // head group at y=1.0 world: goggles + hair
  const hy = 1.0;
  head
    .geo(new THREE.TorusGeometry(0.405, 0.045, 6, 24), 0, 1.1 - hy, 0, blk, { rx: Math.PI / 2 })
    .geo(new THREE.TorusGeometry(0.19, 0.06, 10, 20), 0, 1.1 - hy, 0.37, '#c9ccd4', { kind: 'metal' })
    .geo(new THREE.SphereGeometry(0.18, 16, 12), 0, 1.1 - hy, 0.33, '#ffffff', { j: 0 })
    .geo(new THREE.CylinderGeometry(0.085, 0.085, 0.02, 16), 0, 1.1 - hy, 0.5, '#6b3d1c', { rx: Math.PI / 2, j: 0 })
    .geo(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12), 0, 1.1 - hy, 0.512, '#0a0a0a', { rx: Math.PI / 2, j: 0 })
    .geo(new THREE.SphereGeometry(0.02, 6, 6), 0.03, 1.13 - hy, 0.52, '#ffffff', { kind: 'glow', glow: 2 })
    .box(0.18, 0.035, 0.03, 0, 0.86 - hy, 0.385, '#3a1a10', { rx: 0.3 })
    .box(0.05, 0.03, 0.03, 0.1, 0.875 - hy, 0.37, '#3a1a10', { rz: 0.5 })
    .box(0.05, 0.03, 0.03, -0.1, 0.875 - hy, 0.37, '#3a1a10', { rz: -0.5 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    head.geo(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 4), Math.cos(a) * 0.08, 1.47 - hy, Math.sin(a) * 0.08, blk, { rz: Math.cos(a) * 0.5, rx: Math.sin(a) * 0.5 });
  }
  const mkArm = (A) => A.geo(new THREE.CylinderGeometry(0.06, 0.06, 0.36, 8), 0, -0.18, 0, yel).geo(new THREE.SphereGeometry(0.1, 10, 8), 0, -0.4, 0, blk);
  const armR = mkArm(new P()), armL = mkArm(new P());
  const weapon = new P()
    .geo(new THREE.CylinderGeometry(0.075, 0.09, 0.46, 12), 0, 0, 0.18, '#8a8f99', { kind: 'metal', rx: Math.PI / 2 })
    .geo(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12), 0, 0, 0.42, '#ffd61f', { rx: Math.PI / 2 })
    .geo(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12), 0, 0, 0.465, '#ffe88a', { kind: 'glow', glow: 2.5, rx: Math.PI / 2 })
    .box(0.06, 0.16, 0.08, 0, -0.1, 0.05, '#55585f');
  return assemble({ h: 1.5, hipY, neckY: hy, shY: 0.86, shX: 0.43, handY: -0.4, legX: 0.16, torso, head, armR, armL, legR, legL, weapon }, mats);
}

// ---------------------------------------------------------------- Malgore
function buildMalgore(mats) {
  const hide = '#9a625e', hideD = '#7a4a46', armor = '#2b2631', gold = '#e8b52e', lava = '#ff5a10', fur = '#3e2c22';
  const legR = new P(), legL = new P();
  for (const L of [legR, legL]) {
    L.box(0.42, 1.0, 0.44, 0, -0.5, 0, '#3b2a24');
    L.box(0.47, 0.5, 0.49, 0, -0.74, 0, armor, { kind: 'metal' });
    L.box(0.49, 0.08, 0.51, 0, -0.5, 0, gold, { kind: 'metal' });
    L.box(0.2, 0.18, 0.08, 0, -0.42, 0.25, gold, { kind: 'metal' });
  }
  const torso = new P()
    .box(1.02, 0.98, 0.62, 0, 0.49, 0, armor, { kind: 'metal' })
    .box(1.06, 0.09, 0.66, 0, 0.08, 0, gold, { kind: 'metal' })
    .box(1.06, 0.07, 0.66, 0, 0.92, 0, gold, { kind: 'metal' })
    .box(0.26, 0.26, 0.05, 0, 0.58, 0.32, gold, { kind: 'metal', rz: Math.PI / 4 })
    .box(0.15, 0.15, 0.06, 0, 0.58, 0.33, lava, { kind: 'glow', glow: 3.2, rz: Math.PI / 4 })
    .box(0.45, 0.28, 0.66, 0.66, 0.9, 0, gold, { kind: 'metal' }).box(0.45, 0.28, 0.66, -0.66, 0.9, 0, gold, { kind: 'metal' })
    .box(0.1, 0.26, 0.1, 0.72, 1.12, 0.12, '#d8d0c0', { rz: -0.3 }).box(0.1, 0.26, 0.1, 0.72, 1.12, -0.14, '#d8d0c0', { rz: -0.3 })
    .box(0.1, 0.26, 0.1, -0.72, 1.12, 0.12, '#d8d0c0', { rz: 0.3 }).box(0.1, 0.26, 0.1, -0.72, 1.12, -0.14, '#d8d0c0', { rz: 0.3 })
    .box(1.16, 0.24, 0.78, 0, 1.0, -0.06, fur, { j: 0.15 })
    .box(0.5, 0.36, 0.64, 0, 0.0, 0.0, '#3b2a24');
  const cape = new P().box(1.0, 1.55, 0.07, 0, -0.75, 0, '#7d1020', { j: 0.02 }).box(1.0, 0.12, 0.08, 0, -1.48, 0, '#a8182c').box(0.9, 0.06, 0.08, 0, -1.3, 0.001, gold, { kind: 'metal' });
  const head = new P()
    .box(0.86, 0.72, 0.72, 0, 0.36, 0, hide)
    .box(0.42, 0.3, 0.16, 0, 0.2, 0.43, '#b27a72')
    .box(0.08, 0.09, 0.02, 0.1, 0.2, 0.515, '#4a2420').box(0.08, 0.09, 0.02, -0.1, 0.2, 0.515, '#4a2420')
    .box(0.09, 0.26, 0.09, 0.27, 0.2, 0.38, '#efe2c0', { rz: -0.22 }).box(0.09, 0.26, 0.09, -0.27, 0.2, 0.38, '#efe2c0', { rz: 0.22 })
    .box(0.15, 0.08, 0.02, 0.21, 0.47, 0.365, '#ff8a2a', { kind: 'glow', glow: 4 }).box(0.15, 0.08, 0.02, -0.21, 0.47, 0.365, '#ff8a2a', { kind: 'glow', glow: 4 })
    .box(0.74, 0.09, 0.07, 0, 0.55, 0.36, '#4a2622')
    .box(0.04, 0.32, 0.02, 0.3, 0.42, 0.366, '#5a2626', { rz: 0.2 })
    .box(0.13, 0.34, 0.26, 0.5, 0.44, 0, hideD, { rz: 0.55 }).box(0.13, 0.34, 0.26, -0.5, 0.44, 0, hideD, { rz: -0.55 })
    .box(0.92, 0.15, 0.78, 0, 0.75, 0, gold, { kind: 'metal' });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, x = Math.cos(a) * 0.4, z = Math.sin(a) * 0.34;
    head.box(0.12, i % 2 ? 0.2 : 0.3, 0.12, x, i % 2 ? 0.9 : 0.95, z, gold, { kind: 'metal' });
  }
  head.box(0.1, 0.1, 0.04, 0, 0.76, 0.395, '#ff2030', { kind: 'glow', glow: 2.6 })
    .box(0.08, 0.08, 0.04, 0.26, 0.76, 0.395, '#30c0ff', { kind: 'glow', glow: 2.2 })
    .box(0.08, 0.08, 0.04, -0.26, 0.76, 0.395, '#30c0ff', { kind: 'glow', glow: 2.2 });
  const mkArm = (A) => A.box(0.4, 1.0, 0.42, 0, -0.42, 0, hide).box(0.45, 0.4, 0.47, 0, -0.78, 0, armor, { kind: 'metal' }).box(0.47, 0.07, 0.49, 0, -0.6, 0, gold, { kind: 'metal' });
  const armR = mkArm(new P()), armL = mkArm(new P());
  const weapon = new P()
    .box(0.11, 0.11, 1.7, 0, 0, 0.48, '#3a2618')
    .box(0.13, 0.13, 0.1, 0, 0, -0.32, gold, { kind: 'metal' })
    .box(0.46, 0.8, 0.46, 0, 0, 1.3, armor, { kind: 'metal' })
    .box(0.5, 0.08, 0.5, 0, 0.26, 1.3, gold, { kind: 'metal' }).box(0.5, 0.08, 0.5, 0, -0.26, 1.3, gold, { kind: 'metal' })
    .box(0.48, 0.04, 0.3, 0, 0.08, 1.3, lava, { kind: 'glow', glow: 3 }).box(0.48, 0.3, 0.04, 0, -0.06, 1.3, lava, { kind: 'glow', glow: 3 })
    .box(0.2, 0.2, 0.2, 0, 0.5, 1.3, gold, { kind: 'metal' }).box(0.2, 0.2, 0.2, 0, -0.5, 1.3, gold, { kind: 'metal' });
  return assemble({ h: 2.78, hipY: 1.0, neckY: 1.98, shY: 1.82, shX: 0.68, handY: -0.92, legX: 0.24, torso, head, armR, armL, legR, legL, weapon, cape, capeY: 1.95, capeZ: -0.36 }, mats);
}

export const CHARS = {
  blockjack: {
    id: 'blockjack', name: 'BLOCKJACK', title: 'The Wandering Miner', build: buildBlockjack,
    color: '#17c5bd', w: 0.62, h: 2.05, weight: 1.0, run: 8.6, air: 6.6, jump: 17, dj: 15.5, grav: 1.0, fall: 16, jumps: 1,
    reach: 1.0, power: 1.0, stats: { power: 3, speed: 3, weight: 3, jump: 3 },
    nSpecial: 'BLOCK TOSS', upSpecial: 'PILLAR JUMP', desc: 'All-rounder. Tosses blocks and builds his way back to the stage.',
    fx: ['#7ffff0', '#47e6d6'],
  },
  bristle: {
    id: 'bristle', name: 'BRISTLE', title: 'Gilded Hog Brute', build: buildBristle,
    color: '#f5c13a', w: 0.72, h: 2.12, weight: 1.15, run: 8.2, air: 6.1, jump: 16, dj: 14.5, grav: 1.05, fall: 17, jumps: 1,
    reach: 1.08, power: 1.12, stats: { power: 4, speed: 3, weight: 4, jump: 2 },
    nSpecial: 'HOG RUSH', upSpecial: 'GOLD CYCLONE', desc: 'Bruiser in golden armor. Charges through foes with a brutal shoulder rush.',
    fx: ['#ffe27a', '#f5c13a'],
  },
  voidwalker: {
    id: 'voidwalker', name: 'VOIDWALKER', title: 'Stalker of the End', build: buildVoidwalker,
    color: '#b05cff', w: 0.55, h: 2.95, weight: 0.92, run: 8.4, air: 7.2, jump: 17.5, dj: 16, grav: 0.88, fall: 14.5, jumps: 1,
    reach: 1.35, power: 0.96, stats: { power: 3, speed: 4, weight: 2, jump: 4 },
    nSpecial: 'VOID BLINK', upSpecial: 'VOID RIFT', desc: 'Long reach and teleport tricks. Blinks behind foes in a burst of void energy.',
    fx: ['#e08bff', '#8a2be2'],
  },
  gogo: {
    id: 'gogo', name: 'GOGO', title: 'Gadget Goblin', build: buildGogo,
    color: '#ffd61f', w: 0.85, h: 1.5, weight: 0.76, run: 10.6, air: 7.9, jump: 17.5, dj: 15.5, grav: 0.95, fall: 15, jumps: 2,
    reach: 0.8, power: 0.86, stats: { power: 2, speed: 5, weight: 1, jump: 5 },
    nSpecial: 'BANANA BLASTER', upSpecial: 'JET GADGET', desc: 'Tiny, fast and chaotic. Triple jump and a banana-firing blaster.',
    fx: ['#fff27a', '#ffd61f'],
  },
  malgore: {
    id: 'malgore', name: 'MALGORE', title: 'Lord of the Horde', build: buildMalgore,
    color: '#ff5a10', w: 1.15, h: 2.78, weight: 1.45, run: 6.7, air: 5.3, jump: 15.2, dj: 13.5, grav: 1.1, fall: 18, jumps: 1,
    reach: 1.32, power: 1.32, stats: { power: 5, speed: 1, weight: 5, jump: 1 },
    nSpecial: 'INFERNO SLAM', upSpecial: 'FLAME GEYSER', desc: 'Crowned warlord of the horde. Slow, colossal, and his ground-pound shakes the world.',
    fx: ['#ffb040', '#ff4a10'],
  },
};
export const CHAR_ORDER = ['blockjack', 'bristle', 'voidwalker', 'gogo', 'malgore'];



// ---------------------------------------------------------------- v2 helpers
// fill the surface of a box with voxel cells of mixed palette colours (creeper/golem textures)
function voxFill(P_, w, h, d, x, y, z, pal, cell = 0.125, kind) {
  const nx = Math.max(1, Math.round(w / cell)), ny = Math.max(1, Math.round(h / cell)), nz = Math.max(1, Math.round(d / cell));
  const cx = w / nx, cy = h / ny, cz = d / nz;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) {
    if (i > 0 && i < nx - 1 && j > 0 && j < ny - 1 && k > 0 && k < nz - 1) continue;
    P_.box(cx, cy, cz, x - w / 2 + cx * (i + 0.5), y - h / 2 + cy * (j + 0.5), z - d / 2 + cz * (k + 0.5), pal[Math.floor(Math.random() * pal.length)], { j: 0.02, kind });
  }
  return P_;
}

// ---------------------------------------------------------------- Fizz (exploding green mob)
function buildFizz(mats) {
  const pal = ['#4fae3c', '#3d9a2e', '#62c24a', '#2f7d24', '#7fd067', '#9ad98a'];
  const legR = new P(), legL = new P();
  for (const L of [legR, legL]) { voxFill(L, 0.25, 0.42, 0.25, 0, -0.21, 0.2, pal); voxFill(L, 0.25, 0.42, 0.25, 0, -0.21, -0.2, pal); L.box(0.27, 0.06, 0.27, 0, -0.4, 0.2, '#25621c').box(0.27, 0.06, 0.27, 0, -0.4, -0.2, '#25621c'); }
  const torso = voxFill(new P(), 0.5, 0.78, 0.3, 0, 0.39, 0, pal);
  const head = voxFill(new P(), 0.56, 0.56, 0.56, 0, 0.28, 0, pal)
    .box(0.13, 0.13, 0.02, 0.12, 0.34, 0.285, '#101010').box(0.13, 0.13, 0.02, -0.12, 0.34, 0.285, '#101010')
    .box(0.12, 0.17, 0.02, 0, 0.2, 0.285, '#101010').box(0.06, 0.13, 0.02, 0.09, 0.1, 0.285, '#101010').box(0.06, 0.13, 0.02, -0.09, 0.1, 0.285, '#101010')
    .box(0.04, 0.04, 0.025, 0.1, 0.36, 0.29, '#ffffff', { kind: 'glow', glow: 1.5 }).box(0.04, 0.04, 0.025, -0.14, 0.36, 0.29, '#ffffff', { kind: 'glow', glow: 1.5 });
  const armR = new P(), armL = new P();
  return assemble({ h: 1.82, hipY: 0.42, neckY: 1.2, shY: 1.0, shX: 0.2, handY: -0.2, legX: 0.13, torso, head, armR, armL, legR, legL }, mats);
}

// ---------------------------------------------------------------- Rattle (skeleton archer)
function buildRattle(mats) {
  const bone = '#dcdcd2', boneD = '#a8a89e', dark = '#2a2a2a';
  const legR = new P(), legL = new P();
  for (const L of [legR, legL]) L.box(0.12, 0.8, 0.12, 0, -0.4, 0, bone).box(0.15, 0.06, 0.15, 0, -0.4, 0, boneD).box(0.16, 0.06, 0.22, 0, -0.78, 0.03, boneD);
  const torso = new P().box(0.1, 0.78, 0.1, 0, 0.39, -0.05, boneD).box(0.5, 0.1, 0.1, 0, 0.05, -0.02, bone);
  for (let i = 0; i < 4; i++) torso.box(0.46 - i * 0.04, 0.05, 0.22, 0, 0.36 + i * 0.11, 0, bone);
  torso.box(0.5, 0.08, 0.24, 0, 0.76, 0, bone);
  const head = new P().box(0.46, 0.46, 0.46, 0, 0.23, 0, bone)
    .box(0.12, 0.1, 0.02, 0.11, 0.25, 0.235, dark).box(0.12, 0.1, 0.02, -0.11, 0.25, 0.235, dark)
    .box(0.06, 0.06, 0.02, 0, 0.15, 0.235, dark).box(0.3, 0.035, 0.02, 0, 0.07, 0.235, dark)
    .box(0.04, 0.04, 0.025, 0.11, 0.25, 0.24, '#7fdcff', { kind: 'glow', glow: 2.5 }).box(0.04, 0.04, 0.025, -0.11, 0.25, 0.24, '#7fdcff', { kind: 'glow', glow: 2.5 });
  const mkArm = A => A.box(0.11, 0.8, 0.11, 0, -0.33, 0, bone).box(0.13, 0.05, 0.13, 0, -0.33, 0, boneD);
  const armR = mkArm(new P()), armL = mkArm(new P());
  const weapon = new P().box(0.06, 0.06, 0.5, 0, 0.32, 0.1, '#6b4a2a', { rx: -0.6 }).box(0.06, 0.06, 0.5, 0, -0.32, 0.1, '#6b4a2a', { rx: 0.6 }).box(0.07, 0.18, 0.07, 0, 0, 0.0, '#4a3018')
    .box(0.015, 0.92, 0.015, 0, 0, -0.06, '#f0f0f0', { kind: 'glow', glow: 1.2 });
  return assemble({ h: 2.05, hipY: 0.82, neckY: 1.62, shY: 1.52, shX: 0.32, handY: -0.68, legX: 0.12, torso, head, armR, armL, legR, legL, weapon }, mats);
}

// ---------------------------------------------------------------- Ironclad (iron golem heavy)
function buildIronclad(mats) {
  const iron = ['#cfcac0', '#bdb8ad', '#d8d4cb', '#aaa498'], vine = '#4a8a2e';
  const legR = new P(), legL = new P();
  for (const L of [legR, legL]) { voxFill(L, 0.4, 0.85, 0.4, 0, -0.42, 0, iron, 0.2); L.box(0.12, 0.3, 0.02, 0.08, -0.3, 0.205, vine); }
  const torso = voxFill(new P(), 1.15, 0.95, 0.62, 0, 0.5, 0, iron, 0.2).box(0.2, 0.5, 0.02, -0.3, 0.55, 0.315, vine).box(0.14, 0.3, 0.02, 0.35, 0.35, 0.315, vine)
    .box(0.7, 0.3, 0.4, 0, 0.0, 0, '#9a948a').box(0.12, 0.12, 0.02, 0.36, 0.7, 0.315, '#e03030');
  const head = voxFill(new P(), 0.5, 0.55, 0.5, 0, 0.27, 0.05, iron, 0.125)
    .box(0.12, 0.28, 0.12, 0, 0.12, 0.36, '#b08a70').box(0.36, 0.06, 0.04, 0, 0.36, 0.31, '#7a746a')
    .box(0.08, 0.06, 0.02, 0.1, 0.3, 0.31, '#ff3a2a', { kind: 'glow', glow: 3 }).box(0.08, 0.06, 0.02, -0.1, 0.3, 0.31, '#ff3a2a', { kind: 'glow', glow: 3 });
  const mkArm = A => { voxFill(A, 0.36, 1.55, 0.36, 0, -0.68, 0, iron, 0.2); return A.box(0.1, 0.5, 0.02, 0.05, -0.4, 0.185, vine); };
  const armR = mkArm(new P()), armL = mkArm(new P());
  armL.box(0.05, 0.05, 0.05, 0, -1.5, 0.2, '#e03030').box(0.12, 0.12, 0.04, 0, -1.48, 0.22, '#e83a3a');
  return assemble({ h: 2.95, hipY: 0.85, neckY: 1.85, shY: 1.72, shX: 0.76, handY: -1.45, legX: 0.3, torso, head, armR, armL, legR, legL }, mats);
}

// ---------------------------------------------------------------- Bolt (speedy blue hedgehog)
function buildBolt(mats) {
  const blue = '#1e5fe0', tan = '#f2c894', white = '#ffffff', red = '#e02a2a';
  const legR = new P(), legL = new P();
  for (const L of [legR, legL]) L.geo(new THREE.CylinderGeometry(0.06, 0.06, 0.42, 8), 0, -0.2, 0, blue).box(0.2, 0.15, 0.4, 0, -0.42, 0.08, red).box(0.21, 0.05, 0.41, 0, -0.38, 0.08, white).box(0.2, 0.05, 0.4, 0, -0.5, 0.08, '#f0f0f0');
  const torso = new P().geo(new THREE.SphereGeometry(0.3, 14, 10), 0, 0.28, 0, blue, { j: 0.01 }).geo(new THREE.SphereGeometry(0.22, 12, 8), 0, 0.26, 0.12, tan, { j: 0.01 });
  const head = new P().geo(new THREE.SphereGeometry(0.36, 16, 12), 0, 0.3, 0, blue, { j: 0.01 })
    .geo(new THREE.SphereGeometry(0.18, 12, 8), 0, 0.18, 0.24, tan, { j: 0.01 })
    .geo(new THREE.SphereGeometry(0.05, 8, 6), 0, 0.22, 0.42, '#111111')
    .geo(new THREE.SphereGeometry(0.13, 10, 8), 0.09, 0.36, 0.25, white, { j: 0 }).geo(new THREE.SphereGeometry(0.13, 10, 8), -0.09, 0.36, 0.25, white, { j: 0 })
    .geo(new THREE.SphereGeometry(0.055, 8, 6), 0.11, 0.36, 0.36, '#2ab84a', { j: 0 }).geo(new THREE.SphereGeometry(0.055, 8, 6), -0.07, 0.36, 0.36, '#2ab84a', { j: 0 })
    .box(0.22, 0.03, 0.03, 0, 0.1, 0.37, '#5a2a1a', { rz: 0.15 });
  for (const [y, rx, len] of [[0.5, -0.9, 0.55], [0.32, -1.3, 0.6], [0.14, -1.7, 0.5], [0.42, -1.1, 0.5]]) for (const sx of [-0.12, 0.12]) head.geo(new THREE.ConeGeometry(0.11, len, 6), sx, y, -0.28, blue, { rx, j: 0.02 });
  head.geo(new THREE.ConeGeometry(0.09, 0.22, 4), 0.2, 0.62, -0.05, blue, { rz: -0.4 }).geo(new THREE.ConeGeometry(0.09, 0.22, 4), -0.2, 0.62, -0.05, blue, { rz: 0.4 });
  const mkArm = A => A.geo(new THREE.CylinderGeometry(0.05, 0.05, 0.36, 8), 0, -0.18, 0, tan).geo(new THREE.SphereGeometry(0.1, 10, 8), 0, -0.4, 0, white);
  const armR = mkArm(new P()), armL = mkArm(new P());
  return assemble({ h: 1.6, hipY: 0.5, neckY: 0.95, shY: 0.92, shX: 0.3, handY: -0.4, legX: 0.13, torso, head, armR, armL, legR, legL }, mats);
}

// ---------------------------------------------------------------- Pipper (mustached plumber)
function buildPipper(mats) {
  const red = '#e0262a', blue = '#2848c8', skin = '#f2b88a', brown = '#5a3218', white = '#ffffff';
  const legR = new P(), legL = new P();
  for (const L of [legR, legL]) L.box(0.22, 0.5, 0.24, 0, -0.25, 0, blue).box(0.25, 0.14, 0.34, 0, -0.5, 0.05, brown);
  const torso = new P().geo(new THREE.CapsuleGeometry(0.3, 0.25, 6, 14), 0, 0.38, 0, red, { j: 0.01 })
    .geo(new THREE.CylinderGeometry(0.315, 0.3, 0.38, 14), 0, 0.2, 0, blue, { j: 0.01 })
    .box(0.26, 0.2, 0.05, 0, 0.42, 0.28, blue).box(0.06, 0.32, 0.04, 0.14, 0.52, 0.24, blue, { rx: -0.25 }).box(0.06, 0.32, 0.04, -0.14, 0.52, 0.24, blue, { rx: -0.25 })
    .geo(new THREE.SphereGeometry(0.04, 8, 6), 0.13, 0.4, 0.31, '#ffd23a', { kind: 'metal' }).geo(new THREE.SphereGeometry(0.04, 8, 6), -0.13, 0.4, 0.31, '#ffd23a', { kind: 'metal' });
  const head = new P().geo(new THREE.SphereGeometry(0.3, 16, 12), 0, 0.28, 0, skin, { j: 0.01 })
    .geo(new THREE.SphereGeometry(0.11, 10, 8), 0, 0.24, 0.3, '#f0a070', { j: 0 })
    .box(0.34, 0.08, 0.1, 0, 0.14, 0.27, '#1a1008').box(0.1, 0.06, 0.08, 0.17, 0.12, 0.24, '#1a1008', { rz: 0.4 }).box(0.1, 0.06, 0.08, -0.17, 0.12, 0.24, '#1a1008', { rz: -0.4 })
    .box(0.06, 0.1, 0.02, 0.08, 0.36, 0.28, white).box(0.06, 0.1, 0.02, -0.08, 0.36, 0.28, white).box(0.035, 0.07, 0.025, 0.08, 0.35, 0.285, '#2040a0').box(0.035, 0.07, 0.025, -0.08, 0.35, 0.285, '#2040a0')
    .geo(new THREE.SphereGeometry(0.31, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0, 0.33, -0.01, red, { j: 0.01 })
    .geo(new THREE.CylinderGeometry(0.22, 0.24, 0.04, 16), 0, 0.33, 0.24, red, { rx: 0.15 })
    .geo(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 16), 0, 0.48, 0.25, white, { rx: Math.PI / 2 - 0.6 })
    .box(0.36, 0.1, 0.2, 0, 0.3, -0.18, brown);
  const mkArm = A => A.geo(new THREE.CylinderGeometry(0.08, 0.08, 0.36, 8), 0, -0.16, 0, red).geo(new THREE.SphereGeometry(0.11, 10, 8), 0, -0.38, 0, white);
  const armR = mkArm(new P()), armL = mkArm(new P());
  return assemble({ h: 1.72, hipY: 0.55, neckY: 1.2, shY: 1.08, shX: 0.36, handY: -0.38, legX: 0.14, torso, head, armR, armL, legR, legL }, mats);
}

// ---------------------------------------------------------------- Webline (web-slinging masked hero)
function buildWebline(mats) {
  const red = '#d8202a', blue = '#2040b0', web = '#3a0a0e';
  const legR = new P(), legL = new P();
  for (const L of [legR, legL]) { L.box(0.2, 0.9, 0.22, 0, -0.45, 0, blue).box(0.21, 0.32, 0.23, 0, -0.76, 0, red); for (let i = 0; i < 4; i++) L.box(0.212, 0.012, 0.232, 0, -0.65 - i * 0.07, 0, web); }
  const torso = new P().box(0.48, 0.72, 0.26, 0, 0.38, 0, red).box(0.2, 0.72, 0.265, 0.2, 0.36, 0, blue).box(0.2, 0.72, 0.265, -0.2, 0.36, 0, blue).box(0.3, 0.3, 0.27, 0, 0.55, 0, red)
    .box(0.06, 0.16, 0.02, 0, 0.5, 0.14, '#0a0a0a').box(0.22, 0.03, 0.02, 0, 0.53, 0.141, '#0a0a0a', { rz: 0.5 }).box(0.22, 0.03, 0.02, 0, 0.53, 0.141, '#0a0a0a', { rz: -0.5 }).box(0.22, 0.03, 0.02, 0, 0.46, 0.141, '#0a0a0a', { rz: 0.3 }).box(0.22, 0.03, 0.02, 0, 0.46, 0.141, '#0a0a0a', { rz: -0.3 });
  for (let i = 0; i < 4; i++) torso.box(0.31, 0.012, 0.275, 0, 0.45 + i * 0.07, 0, web);
  const head = new P().geo(new THREE.SphereGeometry(0.24, 16, 12), 0, 0.25, 0, red, { j: 0.01 });
  for (let i = 0; i < 6; i++) head.geo(new THREE.TorusGeometry(0.245, 0.006, 4, 24), 0, 0.25, 0, web, { ry: (i / 6) * Math.PI });
  head.geo(new THREE.SphereGeometry(0.09, 10, 8), 0.09, 0.3, 0.19, '#ffffff', { kind: 'glow', glow: 1.6 }).geo(new THREE.SphereGeometry(0.09, 10, 8), -0.09, 0.3, 0.19, '#ffffff', { kind: 'glow', glow: 1.6 })
    .box(0.06, 0.06, 0.06, 0.1, 0.36, 0.21, '#0a0a0a', { rz: 0.5 }).box(0.06, 0.06, 0.06, -0.1, 0.36, 0.21, '#0a0a0a', { rz: -0.5 });
  const mkArm = A => { A.box(0.15, 0.4, 0.16, 0, -0.08, 0, blue).box(0.14, 0.42, 0.15, 0, -0.45, 0, red); for (let i = 0; i < 4; i++) A.box(0.152, 0.012, 0.162, 0, -0.35 - i * 0.08, 0, web); return A; };
  const armR = mkArm(new P()), armL = mkArm(new P());
  const weapon = new P().box(0.05, 0.05, 0.05, 0, 0, 0.05, '#e0e0e0');
  return assemble({ h: 2.0, hipY: 0.92, neckY: 1.66, shY: 1.55, shX: 0.32, handY: -0.66, legX: 0.12, torso, head, armR, armL, legR, legL, weapon }, mats);
}

Object.assign(CHARS, {
  fizz: { id: 'fizz', name: 'FIZZ', title: 'The Walking Fuse', build: buildFizz, inspired: 'Minecraft creeper',
    color: '#4fd03c', w: 0.7, h: 1.82, weight: 0.95, run: 7.6, air: 6.2, jump: 16, dj: 14.5, grav: 1.0, fall: 16, jumps: 1, reach: 0.95, power: 1.05,
    stats: { power: 4, speed: 2, weight: 3, jump: 3 }, nSpecial: 'BIG FUSE', upSpecial: 'BLAST HOP', desc: 'Silent and green. Charges up and detonates. Hurts himself a little, hurts you a lot.', fx: ['#c8ff80', '#4fd03c'], keep: ['#101010'], unlock: { level: 2 } },
  rattle: { id: 'rattle', name: 'RATTLE', title: 'Bone Archer', build: buildRattle, inspired: 'Minecraft skeleton',
    color: '#bfe6ff', w: 0.55, h: 2.05, weight: 0.82, run: 8.8, air: 7.0, jump: 17, dj: 15.5, grav: 0.95, fall: 15.5, jumps: 1, reach: 1.0, power: 0.92,
    stats: { power: 2, speed: 4, weight: 1, jump: 4 }, nSpecial: 'BONE ARROW', upSpecial: 'RATTLE RISE', desc: 'Light and rattly. Keeps foes away with lightning-fast arrows.', fx: ['#e8f8ff', '#7fdcff'], keep: [], unlock: { level: 3 } },
  ironclad: { id: 'ironclad', name: 'IRONCLAD', title: 'Village Guardian', build: buildIronclad, inspired: 'Minecraft iron golem',
    color: '#e0dcd0', w: 1.2, h: 2.95, weight: 1.6, run: 6.4, air: 5.0, jump: 14.8, dj: 13, grav: 1.12, fall: 18, jumps: 1, reach: 1.45, power: 1.38,
    stats: { power: 5, speed: 1, weight: 5, jump: 1 }, nSpecial: 'IRON TOSS', upSpecial: 'IRON LEAP', desc: 'A walking wall of iron. Huge reach, colossal launches.', fx: ['#ffffff', '#ff5040'], keep: ['#e03030', '#e83a3a', '#ff3a2a'], unlock: { level: 5 } },
  bolt: { id: 'bolt', name: 'BOLT', title: 'Sonic-Speed Hedgehog', build: buildBolt, inspired: 'Sonic the Hedgehog',
    color: '#2a7aff', w: 0.75, h: 1.6, weight: 0.85, run: 13.5, air: 8.2, jump: 18, dj: 15.5, grav: 1.05, fall: 17, jumps: 1, reach: 0.85, power: 0.9,
    stats: { power: 2, speed: 5, weight: 2, jump: 4 }, nSpecial: 'SPIN DASH', upSpecial: 'SPRING BOOST', desc: 'Fastest thing alive. Revs up a spin dash and scatters rings when hit.', fx: ['#8ad0ff', '#2a7aff'], keep: ['#f2c894', '#ffffff', '#111111', '#f0f0f0'] },
  pipper: { id: 'pipper', name: 'PIPPER', title: 'Pipe-Fixing Hero', build: buildPipper, inspired: 'Mario',
    color: '#ff3a3a', w: 0.72, h: 1.72, weight: 1.0, run: 8.8, air: 6.8, jump: 18.5, dj: 16, grav: 1.05, fall: 16, jumps: 1, reach: 0.9, power: 1.0,
    stats: { power: 3, speed: 3, weight: 3, jump: 5 }, nSpecial: 'FIREBALL', upSpecial: 'COIN UPPERCUT', desc: 'Jumps higher than anyone. Bouncing fireballs and a coin-popping uppercut.', fx: ['#ffd040', '#ff6a20'], keep: ['#f2b88a', '#f0a070', '#1a1008', '#ffffff', '#5a3218', '#2040a0'] },
  webline: { id: 'webline', name: 'WEBLINE', title: 'Friendly Wall-Crawler', build: buildWebline, inspired: 'Spider-Man',
    color: '#ff2a3a', w: 0.6, h: 2.0, weight: 0.95, run: 9.6, air: 7.6, jump: 18, dj: 16, grav: 0.98, fall: 16, jumps: 1, reach: 1.0, power: 0.98,
    stats: { power: 3, speed: 4, weight: 2, jump: 5 }, nSpecial: 'WEB SHOT', upSpecial: 'WEB SWING', desc: 'Agile and tricky. Webs foes in place, then swings out of trouble.', fx: ['#ffffff', '#ff4050'], keep: ['#ffffff', '#0a0a0a'], unlock: { level: 4 } },
});
CHARS.blockjack.inspired = 'Minecraft Steve'; CHARS.bristle.inspired = 'Minecraft piglin'; CHARS.voidwalker.inspired = 'Minecraft enderman'; CHARS.gogo.inspired = 'Minions'; CHARS.malgore.inspired = 'Piglin warlord (Mal Gosha)';
CHARS.blockjack.keep = ['#c8936a', '#ffffff', '#3d33b8']; CHARS.bristle.keep = ['#e3a096', '#c9827a', '#f2b6aa', '#ffffff', '#f6ecd2'];
CHARS.voidwalker.keep = []; CHARS.gogo.keep = ['#ffffff', '#6b3d1c', '#0a0a0a', '#18181a']; CHARS.malgore.keep = ['#efe2c0'];
CHARS.malgore.unlock = null;
CHAR_ORDER.push('bolt', 'pipper', 'webline', 'fizz', 'rattle', 'ironclad');

// ---------------------------------------------------------------- palettes (skins)
const hsl = {};
const hueTo = (target, sat = null, lmul = 1) => (c) => { c.getHSL(hsl); c.setHSL(target, sat ?? Math.max(hsl.s, 0.35), Math.min(1, hsl.l * lmul)); };
export const PALETTES = {
  default: { name: 'CLASSIC', fn: null },
  shadow: { name: 'SHADOW', fn: c => { c.getHSL(hsl); c.setHSL(hsl.h, hsl.s * 0.25, hsl.l * 0.35); } },
  gold: { name: 'GILDED', fn: c => { c.getHSL(hsl); c.setHSL(0.12, 0.85, 0.25 + hsl.l * 0.55); } },
  frost: { name: 'FROST', fn: c => { c.getHSL(hsl); c.setHSL(0.55, 0.45, 0.35 + hsl.l * 0.6); } },
  crimson: { name: 'CRIMSON', fn: c => { c.getHSL(hsl); c.setHSL(0.99, 0.75, hsl.l * 0.85); } },
  neon: { name: 'NEON', fn: c => { c.getHSL(hsl); c.setHSL((hsl.h + 0.5) % 1, 1, Math.min(0.7, hsl.l * 1.2 + 0.1)); } },
  // signature alts
  greenbro: { name: 'GREEN BROTHER', only: 'pipper', fn: c => { c.getHSL(hsl); if ((hsl.h < 0.06 || hsl.h > 0.94) && hsl.s > 0.5) c.setHSL(0.36, 0.75, hsl.l * 0.85); } },
  darkhog: { name: 'DARK RIVAL', only: 'bolt', fn: c => { c.getHSL(hsl); if (hsl.h > 0.55 && hsl.h < 0.7) c.setHSL(0.66, 0.2, 0.08); else if (hsl.h < 0.05 && hsl.s > 0.5) c.setHSL(0.0, 0.9, 0.45); } },
  symbiote: { name: 'SYMBIOTE', only: 'webline', fn: c => { c.getHSL(hsl); c.setHSL(0.7, 0.15, hsl.l * 0.18); } },
  charged: { name: 'CHARGED', only: 'fizz', fn: c => { c.getHSL(hsl); c.setHSL(0.5, 0.9, hsl.l * 1.1); } },
  wither: { name: 'WITHERED', only: 'rattle', fn: c => { c.getHSL(hsl); c.setHSL(0, 0, hsl.l * 0.2); } },
  netherite: { name: 'NETHERITE', only: 'ironclad', fn: c => { c.getHSL(hsl); c.setHSL(0.8, 0.1, hsl.l * 0.3); } },
};
export const HATS = {
  none: { name: 'NONE' }, crown: { name: 'ROYAL CROWN' }, tophat: { name: 'TOP HAT' }, party: { name: 'PARTY HAT' }, halo: { name: 'HALO' },
  horns: { name: 'VIKING HORNS' }, shades: { name: 'COOL SHADES' }, phones: { name: 'HEADPHONES' }, propeller: { name: 'PROPELLER CAP' },
};
const HAT_FIT = { bolt: { y: 0.6, z: -0.05 }, gogo: { y: 0.55, k: 1.3, z: 0 }, malgore: { k: 1.6 }, pipper: { y: 0.66 }, bristle: { k: 1.3 } };
function buildHat(id, mats) {
  const p = new P();
  switch (id) {
    case 'crown': p.box(0.5, 0.14, 0.5, 0, 0.07, 0, '#f5c542', { kind: 'metal' }); for (let i = 0; i < 4; i++) p.box(0.09, 0.14, 0.09, Math.cos(i * 1.57) * 0.2, 0.2, Math.sin(i * 1.57) * 0.2, '#f5c542', { kind: 'metal' }); p.box(0.08, 0.08, 0.03, 0, 0.08, 0.26, '#ff2a4a', { kind: 'glow', glow: 2 }); break;
    case 'tophat': p.geo(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 16), 0, 0.02, 0, '#151515').geo(new THREE.CylinderGeometry(0.22, 0.22, 0.42, 16), 0, 0.23, 0, '#1a1a1a').geo(new THREE.CylinderGeometry(0.225, 0.225, 0.08, 16), 0, 0.08, 0, '#c0202a'); break;
    case 'party': p.geo(new THREE.ConeGeometry(0.2, 0.5, 12), 0, 0.25, 0, '#ff4ab0').geo(new THREE.SphereGeometry(0.06, 8, 6), 0, 0.52, 0, '#ffe040', { kind: 'glow', glow: 1.6 }); break;
    case 'halo': p.geo(new THREE.TorusGeometry(0.24, 0.035, 8, 24), 0, 0.22, 0, '#fff0a0', { kind: 'glow', glow: 3, rx: Math.PI / 2 }); break;
    case 'horns': p.geo(new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0, -0.02, 0, '#8a8f99', { kind: 'metal' }).geo(new THREE.ConeGeometry(0.07, 0.34, 8), 0.3, 0.14, 0, '#f0e8d0', { rz: -0.9 }).geo(new THREE.ConeGeometry(0.07, 0.34, 8), -0.3, 0.14, 0, '#f0e8d0', { rz: 0.9 }); break;
    case 'shades': p.box(0.46, 0.09, 0.03, 0, -0.16, 0.0, '#0a0a0a').box(0.18, 0.11, 0.035, 0.12, -0.17, 0.005, '#101828', { kind: 'metal' }).box(0.18, 0.11, 0.035, -0.12, -0.17, 0.005, '#101828', { kind: 'metal' }); break;
    case 'phones': p.geo(new THREE.TorusGeometry(0.3, 0.035, 6, 20, Math.PI), 0, -0.12, 0, '#202020').box(0.08, 0.18, 0.16, 0.3, -0.14, 0, '#ff3a5a').box(0.08, 0.18, 0.16, -0.3, -0.14, 0, '#ff3a5a'); break;
    case 'propeller': p.geo(new THREE.SphereGeometry(0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0, -0.02, 0, '#3a7aff').box(0.04, 0.12, 0.04, 0, 0.3, 0, '#ffd23a').box(0.5, 0.02, 0.08, 0, 0.36, 0, '#ff3a3a'); break;
    default: return null;
  }
  return p.mesh(mats);
}

export function buildChar(id, cos = {}) {
  const mats = makeMats();
  const c = CHARS[id];
  const pal = PALETTES[cos.skin] && PALETTES[cos.skin].fn;
  const keep = new Set((c.keep || []).map(k => k.toLowerCase()));
  CUR_XF = pal ? (col, hex, isGlow) => { if (!keep.has(hex) && !isGlow) pal(col); } : null;
  let rig;
  try { rig = c.build(mats); } finally { CUR_XF = null; }
  rig.mats = mats;
  if (cos.hat && cos.hat !== 'none') {
    const hat = buildHat(cos.hat, mats);
    if (hat) {
      const head = rig.head; head.updateMatrixWorld(true);
      const inv = new THREE.Matrix4().copy(head.matrixWorld).invert(), box = new THREE.Box3(), m4 = new THREE.Matrix4();
      head.traverse(o => { if (o.isMesh) { o.geometry.computeBoundingBox(); box.union(o.geometry.boundingBox.clone().applyMatrix4(m4.multiplyMatrices(inv, o.matrixWorld))); } });
      const fit = HAT_FIT[id] || {};
      const top = fit.y ?? box.max.y, cz = fit.z ?? (box.min.z + box.max.z) / 2;
      const k = fit.k ?? Math.max(0.75, Math.min(1.6, (box.max.x - box.min.x) / 0.62));
      hat.scale.setScalar(k); hat.position.set(fit.x ?? 0, top - 0.02, cz);
      if (cos.hat === 'shades' || cos.hat === 'phones') hat.position.y = box.min.y + (top - box.min.y) * 0.62 + 0.16 * k;
      if (cos.hat === 'shades') hat.position.z = (fit.front ?? box.max.z) - 0.01;
      rig.head.add(hat); rig.hat = hat;
    }
  }
  return rig;
}

// ================================================================ v3 roster: Venomaw + Gammoth (original homage designs)
// ---------------------------------------------------------------- Venomaw (glossy symbiote brawler)
function buildVenomaw(mats) {
  const blk = '#161826', blk2 = '#22253a', sheen = '#2c3150', white = '#f4f4f4', mouth = '#3a0610', tongue = '#d0305a', teeth = '#ffffff';
  const legR = new P(), legL = new P();
  for (const L of [legR, legL]) {
    L.geo(new THREE.CapsuleGeometry(0.15, 0.48, 6, 12), 0, -0.3, 0, blk, { kind: 'metal' })
      .geo(new THREE.CapsuleGeometry(0.12, 0.38, 6, 12), 0, -0.72, 0.02, blk2, { kind: 'metal' })
      .box(0.24, 0.1, 0.36, 0, -0.95, 0.07, blk);
    for (const s of [-0.07, 0, 0.07]) L.geo(new THREE.ConeGeometry(0.03, 0.1, 5), s, -0.97, 0.27, '#c8c8d0', { rx: Math.PI / 2 });
  }
  const torso = new P()
    .geo(new THREE.CapsuleGeometry(0.2, 0.3, 6, 14), 0, 0.22, 0, blk, { kind: 'metal' })
    .geo(new THREE.SphereGeometry(0.42, 18, 12), 0, 0.62, 0, blk, { kind: 'metal' })
    .box(0.86, 0.34, 0.42, 0, 0.66, -0.02, blk, { kind: 'metal' })
    .geo(new THREE.SphereGeometry(0.17, 12, 8), 0.2, 0.62, 0.22, sheen, { kind: 'metal' })
    .geo(new THREE.SphereGeometry(0.17, 12, 8), -0.2, 0.62, 0.22, sheen, { kind: 'metal' })
    .geo(new THREE.SphereGeometry(0.24, 12, 8), 0.4, 0.78, 0, blk2, { kind: 'metal' })
    .geo(new THREE.SphereGeometry(0.24, 12, 8), -0.4, 0.78, 0, blk2, { kind: 'metal' });
  // original emblem: three jagged white claw slashes across the chest
  for (const [x, rz] of [[-0.14, 0.5], [0, 0.42], [0.14, 0.34]]) {
    torso.box(0.06, 0.34, 0.03, x, 0.62, 0.39, white, { rz });
    torso.box(0.04, 0.12, 0.03, x + 0.08, 0.42, 0.37, white, { rz: rz + 0.5 });
  }
  const head = new P();
  const hg = new THREE.SphereGeometry(0.31, 18, 14); hg.scale(1.05, 1.08, 0.98);
  head.geo(hg, 0, 0.3, 0, blk, { kind: 'metal' });
  // big angled white eye patches
  for (const sx of [1, -1]) {
    const eg = new THREE.SphereGeometry(0.13, 14, 10); eg.scale(0.75, 1.25, 0.32);
    head.geo(eg, sx * 0.13, 0.4, 0.27, white, { rz: sx * 0.62, kind: 'glow', glow: 1.15 });
  }
  // huge toothy grin
  head.box(0.48, 0.16, 0.1, 0, 0.17, 0.25, mouth).box(0.4, 0.04, 0.08, 0, 0.11, 0.27, mouth);
  for (let i = 0; i < 9; i++) {
    const x = -0.22 + i * 0.055, curve = Math.abs(x) * 0.25;
    head.geo(new THREE.ConeGeometry(0.024, 0.09, 4), x, 0.225 + curve, 0.3, teeth, { rx: Math.PI });
    head.geo(new THREE.ConeGeometry(0.022, 0.08, 4), x + 0.027, 0.115 + curve, 0.3, teeth);
  }
  // long lolling tongue
  head.box(0.1, 0.05, 0.14, 0.05, 0.13, 0.35, tongue).box(0.09, 0.14, 0.05, 0.07, 0.04, 0.42, tongue, { rz: -0.2 }).box(0.08, 0.12, 0.05, 0.1, -0.07, 0.43, tongue, { rz: 0.25, rx: 0.3 });
  const mkArm = (A) => A.geo(new THREE.SphereGeometry(0.17, 12, 8), 0, 0, 0, blk2, { kind: 'metal' })
    .geo(new THREE.CapsuleGeometry(0.13, 0.36, 6, 12), 0, -0.28, 0, blk, { kind: 'metal' })
    .geo(new THREE.CapsuleGeometry(0.11, 0.3, 6, 12), 0, -0.64, 0.02, blk, { kind: 'metal' })
    .geo(new THREE.SphereGeometry(0.13, 10, 8), 0, -0.86, 0.03, blk2, { kind: 'metal' });
  const armR = mkArm(new P()), armL = mkArm(new P());
  for (const A of [armR, armL]) for (const s of [-0.07, 0, 0.07]) A.geo(new THREE.ConeGeometry(0.025, 0.18, 5), s, -1.0, 0.06, '#d8d8e0', { rx: Math.PI - 0.3 });
  // writhing tendrils on the back (uses the cape slot so they sway)
  const cape = new P();
  for (const [x, rz, len] of [[-0.25, 0.35, 0.9], [0, 0.0, 1.1], [0.25, -0.35, 0.9], [-0.12, 0.15, 0.7], [0.12, -0.15, 0.7]]) {
    cape.geo(new THREE.CylinderGeometry(0.035, 0.07, len, 6), x + Math.sin(rz) * len * 0.5, -len * 0.45, -0.05, blk2, { rz, kind: 'metal' });
  }
  return assemble({ h: 2.35, hipY: 1.0, neckY: 1.82, shY: 1.72, shX: 0.5, handY: -0.95, legX: 0.16, torso, head, armR, armL, legR, legL, cape, capeY: 1.75, capeZ: -0.3 }, mats);
}

// ---------------------------------------------------------------- Gammoth (gamma-charged brute)
function buildGammoth(mats) {
  const sk = '#5fae3a', skD = '#4a8f2c', skL = '#74c44a', shorts = '#5a2a8a', shortsD = '#43206a', hair = '#1c1a14';
  const legR = new P(), legL = new P();
  for (const L of [legR, legL]) {
    L.geo(new THREE.CapsuleGeometry(0.24, 0.3, 6, 12), 0, -0.3, 0, shorts)
      .geo(new THREE.CapsuleGeometry(0.21, 0.32, 6, 12), 0, -0.68, 0.02, sk)
      .box(0.36, 0.14, 0.52, 0, -0.93, 0.09, skD);
    // torn shorts hem
    for (let i = 0; i < 5; i++) L.box(0.1, 0.1 + (i % 2) * 0.08, 0.1, Math.cos(i * 1.26) * 0.22, -0.5 - (i % 2) * 0.04, Math.sin(i * 1.26) * 0.22, shortsD, { rz: (i - 2) * 0.2 });
  }
  const torso = new P()
    .geo(new THREE.CylinderGeometry(0.46, 0.4, 0.34, 16), 0, 0.02, 0, shorts)
    .geo(new THREE.CapsuleGeometry(0.42, 0.25, 8, 16), 0, 0.5, 0, sk)
    .box(1.36, 0.6, 0.72, 0, 0.98, -0.02, sk)
    .geo(new THREE.SphereGeometry(0.34, 14, 10), 0.26, 0.92, 0.2, skL)
    .geo(new THREE.SphereGeometry(0.34, 14, 10), -0.26, 0.92, 0.2, skL)
    .geo(new THREE.SphereGeometry(0.36, 14, 10), 0.62, 1.12, 0, sk)
    .geo(new THREE.SphereGeometry(0.36, 14, 10), -0.62, 1.12, 0, sk)
    .geo(new THREE.SphereGeometry(0.3, 12, 8), 0, 1.28, -0.05, skD); // traps
  for (let i = 0; i < 3; i++) torso.box(0.2, 0.12, 0.05, 0.11, 0.38 + i * 0.15, 0.4, skL).box(0.2, 0.12, 0.05, -0.11, 0.38 + i * 0.15, 0.4, skL);
  torso.box(0.98, 0.1, 0.92, 0, 0.12, 0, shortsD);
  const head = new P()
    .box(0.52, 0.5, 0.5, 0, 0.22, 0.06, sk)
    .box(0.58, 0.1, 0.12, 0, 0.36, 0.28, skD) // heavy brow
    .box(0.12, 0.05, 0.02, 0.12, 0.29, 0.315, '#c8ff6a', { kind: 'glow', glow: 3 }).box(0.12, 0.05, 0.02, -0.12, 0.29, 0.315, '#c8ff6a', { kind: 'glow', glow: 3 })
    .box(0.1, 0.12, 0.08, 0, 0.2, 0.33, skD)
    .box(0.32, 0.08, 0.04, 0, 0.08, 0.31, '#f2f2e6').box(0.32, 0.015, 0.045, 0, 0.08, 0.312, '#2a3a20')
    .box(0.6, 0.14, 0.4, 0, 0.0, 0.02, skD); // jaw
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; head.box(0.2, 0.16, 0.2, Math.cos(a) * 0.2, 0.5 + (i % 3) * 0.04, Math.sin(a) * 0.18 - 0.04, hair, { ry: a, rz: (i % 2 ? 0.3 : -0.3) }); }
  head.box(0.54, 0.14, 0.4, 0, 0.5, -0.08, hair).box(0.16, 0.12, 0.08, 0.1, 0.46, 0.27, hair, { rz: 0.4 });
  const mkArm = (A) => A.geo(new THREE.SphereGeometry(0.3, 12, 10), 0, -0.05, 0, sk)
    .geo(new THREE.CapsuleGeometry(0.26, 0.36, 6, 12), 0, -0.4, 0, sk)
    .geo(new THREE.CapsuleGeometry(0.24, 0.34, 6, 12), 0, -0.86, 0.03, skL)
    .box(0.48, 0.42, 0.46, 0, -1.2, 0.04, skD) // fist
    .box(0.5, 0.1, 0.2, 0, -1.08, 0.2, sk);
  const armR = mkArm(new P()), armL = mkArm(new P());
  return assemble({ h: 2.9, hipY: 1.05, neckY: 2.3, shY: 2.12, shX: 0.86, handY: -1.2, legX: 0.27, torso, head, armR, armL, legR, legL }, mats);
}

Object.assign(CHARS, {
  venomaw: { id: 'venomaw', name: 'VENOMAW', title: 'The Hungry Symbiote', build: buildVenomaw, inspired: 'Venom',
    color: '#9aa4ff', w: 0.8, h: 2.35, weight: 1.08, run: 9.8, air: 7.3, jump: 17.5, dj: 15.5, grav: 1.0, fall: 16.5, jumps: 1, reach: 1.22, power: 1.1, grabReach: 1.5,
    stats: { power: 4, speed: 4, weight: 3, jump: 4 }, nSpecial: 'TENDRIL SNARE', upSpecial: 'SYMBIOTE SWING', dSpecial: 'SYMBIOTE LUNGE',
    desc: 'Tendril whips, a long-range snare that reels foes in, wild claw flurries and a pouncing bite.', fx: ['#ffffff', '#6a70ff'],
    keep: ['#f4f4f4', '#ffffff', '#3a0610', '#d0305a', '#c8c8d0', '#d8d8e0'] },
  gammoth: { id: 'gammoth', name: 'GAMMOTH', title: 'The Gamma Juggernaut', build: buildGammoth, inspired: 'The Hulk',
    color: '#6adc3a', w: 1.3, h: 2.9, weight: 1.55, run: 7.8, air: 5.7, jump: 17.2, dj: 14, grav: 1.15, fall: 18.5, jumps: 1, reach: 1.42, power: 1.34, rage: true,
    stats: { power: 5, speed: 2, weight: 5, jump: 3 }, nSpecial: 'THUNDER CLAP', upSpecial: 'LEAP SMASH', dSpecial: 'GAMMA POUND',
    desc: 'Gamma rage. Super armor, shockwave claps and huge leaps. Hits harder the more hurt he is.', fx: ['#d8ff8a', '#6adc3a'],
    keep: ['#f2f2e6', '#2a3a20'] },
});
CHAR_ORDER.push('venomaw', 'gammoth');
Object.assign(PALETTES, {
  toxic: { name: 'TOXIC', only: 'venomaw', fn: c => { c.getHSL(hsl); c.setHSL(0.3, 0.8, 0.08 + hsl.l * 0.9); } },
  stonehide: { name: 'STONEHIDE', only: 'gammoth', fn: c => { c.getHSL(hsl); if (hsl.h > 0.2 && hsl.h < 0.45) c.setHSL(0.6, 0.06, hsl.l * 0.95); } },
});
Object.assign(HAT_FIT, { gammoth: { k: 1.15 }, venomaw: { k: 1.2 } });

Object.assign(CHARS, makeDemonHunters(P, assemble));
CHAR_ORDER.push(...DEMON_HUNTER_IDS);
Object.assign(HAT_FIT, {
  rumi: { y: 0.60, z: 0, front: 0.21 },
  mira: { y: 0.57, z: 0, front: 0.23 },
  zoey: { y: 0.56, z: 0, front: 0.22 },
  'gwi-ma': { y: 0.96, z: 0.02, front: 0.44, k: 1.60 },
});

Object.assign(CHARS, makeWorkshopFighters(P, assemble));
CHAR_ORDER.push(...WORKSHOP_IDS);
Object.assign(HAT_FIT, {
  cinderback: { y: 0.76, z: -0.015, front: 0.35, k: 1.35 },
  skiff: { y: 0.69, z: 0, front: 0.275, k: 0.85 },
  'hip-hop': { x: 0.24, y: 0.443, z: -0.103, front: 0.085, k: 0.72 },
  rivet: { y: 0.625, z: -0.02, front: 0.27 },
});

Object.assign(CHARS, makeShellFighters(P, assemble));
CHAR_ORDER.push(...SHELL_IDS);
Object.assign(PALETTES, SHELL_PALETTES);
Object.assign(HAT_FIT, {
  brimshell: { y: 0.66, z: 0.02, front: 0.36, k: 1.4 },
  nebulo: { y: 0.53, z: 0.02, front: 0.3, k: 1.0 },
});
