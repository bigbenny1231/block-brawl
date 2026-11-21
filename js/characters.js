// Block Brawl - procedural voxel character models (original homage designs)
import * as THREE from 'three';

const _c = new THREE.Color();
export const BASE_YAW = Math.PI / 2 - 0.52;

function paint(geo, color, jitter = 0.05, glow = 1) {
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  _c.set(color);
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

export function buildChar(id) {
  const mats = makeMats();
  const rig = CHARS[id].build(mats);
  rig.mats = mats;
  return rig;
}
