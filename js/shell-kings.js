// Brimshell and Nebulo: an original magma turtle king and his paint-slinging cosmic son.
// Models use the shared procedural voxel rig; moves plug into the fighter engine's special hooks.
import * as THREE from '../lib/three.module.min.js';

const METAL = { kind: 'metal' };
const glow = (g = 1.6) => ({ kind: 'glow', glow: g });
const approach = (v, t, s) => (v < t ? Math.min(t, v + s) : Math.max(t, v - s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const PAINT = ['#ff6fd8', '#7fe8ff', '#ffd76a', '#b28cff'];

// ---------------------------------------------------------------- Brimshell (magma turtle king)
const B = {
  hide: '#335a70', hideD: '#233f4f', snout: '#4a7489', belly: '#cdb88c', bellyD: '#a8946a',
  shell: '#1c1920', rim: '#3a323f', iron: '#3b3138', bone: '#efe6d0', magma: '#ff7a1a', ember: '#ffb347',
};

function buildBrimshell(P, assemble, mats, h) {
  const cone = (r, len, seg = 6) => new THREE.ConeGeometry(r, len, seg);
  const torso = new P()
    .box(1.02, 0.32, 0.8, 0, 0.08, 0, B.hideD)
    .box(1.18, 0.9, 0.82, 0, 0.55, 0, B.hide)
    .box(1.34, 0.32, 0.8, 0, 0.88, -0.02, B.hide)
    .box(1.22, 0.12, 0.86, 0, 0.2, 0, '#2a2028')
    .box(0.24, 0.16, 0.05, 0, 0.2, 0.44, B.magma, glow(1.7))
    // iron collar with spikes
    .box(0.92, 0.14, 0.74, 0, 1.0, -0.02, B.iron, METAL);
  // plated belly
  for (let i = 0; i < 3; i++) {
    torso.box(0.7 - i * 0.04, 0.2, 0.06, 0, 0.32 + i * 0.22, 0.42, B.belly)
      .box(0.72 - i * 0.04, 0.025, 0.065, 0, 0.215 + i * 0.22, 0.425, B.bellyD);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.26;
    torso.geo(cone(0.06, 0.2), Math.cos(a) * 0.46, 1.0, Math.sin(a) * 0.38 - 0.02, B.bone, { rz: -Math.cos(a) * 1.3, rx: Math.sin(a) * 1.3 });
  }
  // obsidian shell with magma seams and bone spikes
  torso.box(1.4, 1.16, 0.5, 0, 0.6, -0.6, B.shell, METAL)
    .box(1.48, 1.24, 0.12, 0, 0.6, -0.38, B.rim)
    .box(1.24, 0.16, 0.42, 0, 1.22, -0.55, B.rim);
  for (const x of [-0.3, 0.3]) torso.box(0.05, 1.0, 0.02, x, 0.6, -0.855, B.magma, glow(1.9));
  for (const y of [0.32, 0.88]) torso.box(1.16, 0.05, 0.02, 0, y, -0.855, B.magma, glow(1.9));
  for (const y of [0.32, 0.88]) for (const x of [-0.62, 0.62]) torso.box(0.02, 0.05, 0.4, x * 1.13, y, -0.62, B.magma, glow(1.6));
  for (const y of [0.18, 0.6, 1.02]) {
    for (const x of [-0.45, 0, 0.45]) {
      torso.box(0.24, 0.24, 0.06, x, y, -0.87, B.rim)
        .geo(cone(0.12, 0.38), x, y, -1.06, B.bone, { rx: -Math.PI / 2 });
    }
  }

  const head = new P()
    .box(0.78, 0.56, 0.66, 0, 0.32, 0, B.hide)
    .box(0.86, 0.14, 0.26, 0, 0.52, 0.22, B.hideD)
    .box(0.66, 0.3, 0.44, 0, 0.22, 0.42, B.snout)
    .box(0.62, 0.12, 0.46, 0, 0.04, 0.38, B.belly)
    .box(0.58, 0.035, 0.05, 0, 0.11, 0.63, '#2a1e22')
    .box(0.06, 0.05, 0.03, 0.12, 0.3, 0.645, '#1a1418')
    .box(0.06, 0.05, 0.03, -0.12, 0.3, 0.645, '#1a1418')
    // ember beard
    .box(0.52, 0.12, 0.2, 0, -0.06, 0.42, B.magma, glow(1.7))
    .box(0.34, 0.12, 0.16, 0, -0.16, 0.45, B.ember, glow(1.9))
    .box(0.14, 0.1, 0.12, 0, -0.26, 0.47, '#ff4a12', glow(1.8))
    // iron crown band with magma crystals
    .box(0.62, 0.1, 0.52, 0, 0.64, 0.02, B.iron, METAL)
    .geo(cone(0.08, 0.4, 5), 0, 0.88, 0.06, B.magma, glow(1.8))
    .geo(cone(0.065, 0.3, 5), 0.2, 0.83, 0.04, B.ember, glow(1.8))
    .geo(cone(0.065, 0.3, 5), -0.2, 0.83, 0.04, B.ember, glow(1.8));
  for (const side of [-1, 1]) {
    head.box(0.16, 0.09, 0.03, side * 0.2, 0.42, 0.335, '#ffb02e', glow(2.2))
      .box(0.035, 0.09, 0.035, side * 0.19, 0.42, 0.35, '#1a0a06')
      .box(0.2, 0.06, 0.05, side * 0.2, 0.5, 0.34, B.hideD, { rz: side * 0.32 })
      .geo(cone(0.04, 0.13, 4), side * 0.21, 0.06, 0.6, B.bone, { rx: Math.PI })
      .geo(cone(0.03, 0.09, 4), side * 0.08, 0.07, 0.63, B.bone, { rx: Math.PI })
      // swept horns
      .box(0.15, 0.36, 0.15, side * 0.4, 0.6, -0.06, B.bone, { rz: -side * 0.75 })
      .box(0.11, 0.3, 0.11, side * 0.58, 0.82, -0.16, B.bone, { rz: -side * 0.25, rx: -0.4 })
      .box(0.07, 0.16, 0.07, side * 0.63, 0.98, -0.25, '#d8ccb0', { rx: -0.7 });
  }
  for (let i = 0; i < 3; i++) head.geo(cone(0.06, 0.2, 5), 0, 0.5 - i * 0.14, -0.36 - i * 0.02, B.bone, { rx: -1.9 });

  const arm = () => {
    const p = new P()
      .box(0.5, 0.24, 0.5, 0, 0.04, 0, B.shell, METAL)
      .geo(cone(0.08, 0.26), 0, 0.26, 0, B.bone)
      .box(0.38, 0.5, 0.4, 0, -0.22, 0, B.hide)
      .box(0.42, 0.42, 0.44, 0, -0.62, 0.01, B.hide)
      .box(0.48, 0.18, 0.5, 0, -0.6, 0.01, B.iron, METAL)
      .box(0.36, 0.24, 0.38, 0, -0.92, 0.04, B.hideD);
    for (const [x, z] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      p.geo(cone(0.05, 0.16, 5), x * 0.3, -0.6, z * 0.31, B.bone, { rz: -x * Math.PI / 2, rx: z * Math.PI / 2 });
    }
    for (const x of [-0.11, 0, 0.11]) p.geo(cone(0.04, 0.16, 4), x, -1.08, 0.14, B.bone, { rx: Math.PI - 0.5 });
    return p;
  };
  const leg = () => {
    const p = new P()
      .box(0.44, 0.52, 0.48, 0, -0.26, 0, B.hide)
      .box(0.42, 0.36, 0.44, 0, -0.64, 0.01, B.hideD)
      .box(0.46, 0.12, 0.48, 0, -0.56, 0.01, B.iron, METAL)
      .box(0.48, 0.16, 0.64, 0, -0.9, 0.08, B.hideD);
    for (const x of [-0.14, 0, 0.14]) p.geo(cone(0.045, 0.14, 4), x, -0.92, 0.45, B.bone, { rx: Math.PI / 2 });
    return p;
  };
  const tail = new P()
    .box(0.38, 0.34, 0.42, 0, -0.04, -0.14, B.hide)
    .box(0.29, 0.27, 0.36, 0, -0.2, -0.48, B.hide)
    .box(0.2, 0.2, 0.3, 0, -0.35, -0.76, B.hideD);
  for (const [y, z] of [[0.15, -0.14], [-0.04, -0.48], [-0.22, -0.76]]) tail.geo(cone(0.06, 0.18, 5), 0, y + 0.02, z, B.bone);
  return assemble({ h, hipY: 0.98, neckY: 2.0, shY: 1.84, shX: 0.76, handY: -1.0, legX: 0.33,
    torso, head, armR: arm(), armL: arm(), legR: leg(), legL: leg(), cape: tail, capeY: 0.86, capeZ: -0.62 }, mats);
}

// ---------------------------------------------------------------- Nebulo (cosmic prince with a paintbrush)
const N = {
  hide: '#8b74e0', hideD: '#6a54c2', belly: '#fbefff', muzzle: '#e6d8ff', shell: '#151a44', rim: '#2b3378',
  star: '#fff6c8', ring: '#7fe8ff', pink: '#ff6fd8', violet: '#b28cff', gold: '#ffd76a', wood: '#b9773f',
};

function buildNebulo(P, assemble, mats, h) {
  const torso = new P()
    .box(0.6, 0.52, 0.48, 0, 0.27, 0, N.hide)
    .box(0.42, 0.4, 0.05, 0, 0.26, 0.245, N.belly)
    .box(0.2, 0.05, 0.03, 0, 0.3, 0.275, N.gold, glow(2))
    .box(0.05, 0.2, 0.03, 0, 0.3, 0.275, N.gold, glow(2))
    .box(0.1, 0.1, 0.03, 0, 0.3, 0.272, N.gold, { ...glow(2), rz: Math.PI / 4 })
    .box(0.52, 0.1, 0.46, 0, 0.53, 0, N.pink)
    .box(0.12, 0.2, 0.06, 0.1, 0.42, 0.23, N.pink, { rz: -0.3 })
    // star-flecked shell with a planet ring
    .box(0.66, 0.56, 0.3, 0, 0.3, -0.37, N.shell, METAL)
    .box(0.7, 0.6, 0.08, 0, 0.3, -0.22, N.rim)
    .geo(new THREE.TorusGeometry(0.5, 0.035, 6, 28), 0, 0.32, -0.37, N.ring, { ...glow(2), rx: Math.PI / 2 + 0.25, rz: 0.3 });
  const dots = [[-0.2, 0.46], [0.16, 0.5], [0.04, 0.32], [-0.1, 0.18], [0.22, 0.2], [-0.24, 0.3], [0.1, 0.08]];
  for (const [x, y] of dots) torso.box(0.045, 0.045, 0.02, x, y, -0.525, N.star, glow(2.4));
  torso.box(0.11, 0.025, 0.02, 0.16, 0.5, -0.526, N.star, glow(2)).box(0.025, 0.11, 0.02, 0.16, 0.5, -0.526, N.star, glow(2));
  for (const x of [-0.18, 0.18]) torso.geo(new THREE.ConeGeometry(0.05, 0.14, 5), x, 0.46, -0.55, '#c9b8ff', { rx: -Math.PI / 2 });

  const head = new P()
    .box(0.6, 0.5, 0.56, 0, 0.27, 0, N.hide)
    .box(0.64, 0.08, 0.2, 0, 0.44, 0.2, N.hideD)
    .box(0.46, 0.24, 0.28, 0, 0.15, 0.3, N.muzzle)
    .box(0.36, 0.03, 0.04, 0, 0.07, 0.445, '#3a2450')
    .box(0.04, 0.04, 0.03, 0.08, 0.2, 0.445, '#3a2450')
    .box(0.04, 0.04, 0.03, -0.08, 0.2, 0.445, '#3a2450')
    // comet tuft
    .box(0.16, 0.12, 0.22, 0, 0.56, 0.08, N.ring, { ...glow(1.8), rx: -0.3 })
    .box(0.13, 0.1, 0.22, 0, 0.61, -0.1, N.violet, { ...glow(1.8), rx: -0.15 })
    .box(0.09, 0.08, 0.2, 0, 0.62, -0.28, N.pink, glow(1.8))
    .box(0.05, 0.05, 0.12, 0, 0.62, -0.42, N.star, glow(2.2))
    // crescent moon crown
    .geo(new THREE.TorusGeometry(0.1, 0.03, 6, 14, Math.PI * 1.25), 0.03, 0.62, 0.22, N.gold, { ...glow(2.2), rz: -0.4 });
  for (const side of [-1, 1]) {
    head.box(0.16, 0.16, 0.03, side * 0.13, 0.32, 0.285, '#ffffff')
      .box(0.08, 0.1, 0.03, side * 0.12, 0.31, 0.3, '#40f0ff', glow(2))
      .box(0.03, 0.03, 0.02, side * 0.1, 0.35, 0.318, '#ffffff', glow(2.5))
      .geo(new THREE.ConeGeometry(0.035, 0.08, 4), side * 0.12, 0.05, 0.43, '#ffffff', { rx: Math.PI })
      .geo(new THREE.ConeGeometry(0.05, 0.14, 5), side * 0.22, 0.54, -0.02, '#c9b8ff', { rz: -side * 0.5 });
  }
  const arm = () => new P()
    .box(0.17, 0.24, 0.18, 0, -0.1, 0, N.hide)
    .box(0.2, 0.06, 0.2, 0, -0.24, 0, N.pink)
    .box(0.19, 0.17, 0.19, 0, -0.34, 0.01, N.hideD);
  const leg = () => new P()
    .box(0.22, 0.32, 0.24, 0, -0.18, 0, N.hide)
    .box(0.26, 0.12, 0.36, 0, -0.5, 0.05, N.hideD)
    .box(0.24, 0.04, 0.04, 0, -0.52, 0.24, '#f0e6ff');
  const brush = new P()
    .geo(new THREE.CylinderGeometry(0.035, 0.042, 0.8, 8), 0, 0, 0.26, N.wood, { rx: Math.PI / 2 })
    .box(0.1, 0.1, 0.16, 0, 0, -0.06, N.pink)
    .geo(new THREE.CylinderGeometry(0.065, 0.06, 0.12, 10), 0, 0, 0.68, N.gold, { ...METAL, rx: Math.PI / 2 })
    .box(0.16, 0.16, 0.18, 0, 0, 0.82, N.pink, glow(1.5))
    .box(0.13, 0.13, 0.14, 0, 0, 0.96, N.violet, glow(1.6))
    .geo(new THREE.ConeGeometry(0.065, 0.16, 6), 0, 0, 1.1, N.ring, { ...glow(2), rx: Math.PI / 2 })
    .box(0.04, 0.1, 0.04, 0.03, -0.11, 0.95, N.ring, glow(2));
  const tail = new P()
    .box(0.16, 0.14, 0.24, 0, -0.04, -0.08, N.hide)
    .box(0.11, 0.1, 0.18, 0, -0.12, -0.26, N.hideD)
    .box(0.07, 0.07, 0.07, 0, -0.16, -0.38, N.star, glow(2.2));
  return assemble({ h, hipY: 0.56, neckY: 1.12, shY: 1.04, shX: 0.39, handY: -0.42, legX: 0.16,
    torso, head, armR: arm(), armL: arm(), legR: leg(), legL: leg(), weapon: brush, cape: tail, capeY: 0.5, capeZ: -0.5 }, mats);
}

const SHELL_FIGHTERS = [
  { id: 'brimshell', name: 'BRIMSHELL', title: 'The Magma Shell Tyrant', model: buildBrimshell,
    color: '#ff8a3a', w: 1.36, h: 2.78, weight: 1.6, run: 7.3, air: 5.5, jump: 15.6, dj: 13.8,
    grav: 1.12, fall: 18.5, jumps: 1, reach: 1.36, power: 1.33, portraitSize: 0.95, grabReach: 1.25,
    stats: { power: 5, speed: 1, weight: 5, jump: 2 }, nSpecial: 'MAGMA BREATH', upSpecial: 'CINDER CYCLONE', dSpecial: 'BASALT BOMB',
    desc: 'A volcano-born king in an obsidian spiked shell. Breathes magma, spins up in a fiery shell and drops like a meteor.',
    fx: ['#ffd27a', '#ff6a1a'], keep: [B.bone, '#d8ccb0', '#ffb02e', '#1a0a06'] },
  { id: 'nebulo', name: 'NEBULO', title: 'Prince of the Painted Cosmos', model: buildNebulo,
    color: '#c58cff', w: 0.82, h: 1.78, weight: 0.84, run: 9.9, air: 7.6, jump: 17.6, dj: 15.6,
    grav: 0.98, fall: 15.8, jumps: 1, reach: 0.98, power: 0.92, portraitSize: 0.66,
    stats: { power: 2, speed: 4, weight: 1, jump: 4 }, nSpecial: 'STARDUST SPLAT', upSpecial: 'DOODLE ROCKET', dSpecial: 'COMET CRITTER',
    desc: 'The tyrant’s son paints with starlight. Sticky paint slows anyone it touches, and his doodles come alive.',
    fx: ['#ffd8f6', '#c58cff'], keep: ['#ffffff', '#40f0ff', '#3a2450', N.wood] },
];

export const SHELL_IDS = SHELL_FIGHTERS.map(c => c.id);

export function makeShellFighters(P, assemble) {
  return Object.fromEntries(SHELL_FIGHTERS.map(({ model, ...c }) => [c.id, { ...c, build: mats => model(P, assemble, mats, c.h) }]));
}

export const SHELL_PALETTES = {
  glacierking: { name: 'GLACIER KING', only: 'brimshell', fn: (c, hsl = {}) => { c.getHSL(hsl); if (hsl.h > 0.5 && hsl.h < 0.6) c.setHSL(0.58, 0.25, Math.min(0.85, hsl.l * 1.9)); else if (hsl.s > 0.2) c.setHSL(0.6, hsl.s * 0.6, hsl.l); } },
  supernova: { name: 'SUPERNOVA', only: 'nebulo', fn: (c, hsl = {}) => { c.getHSL(hsl); if (hsl.h > 0.65 && hsl.h < 0.8) c.setHSL(0.04, 0.85, Math.min(0.7, hsl.l * 1.05)); } },
};

// ---------------------------------------------------------------- moves
function eruption(ft, g) {
  ft.hitIds.clear();
  const s = ft.size;
  g.hitCheck(ft, { r: 3.0 * s, dmg: 15, kb: 8.6, g: 1.5, a: 70, radial: 1 }, ft.x, ft.y + 0.6, 0);
  // magma vents: pop up anyone standing further out
  for (const t of g.fighters) {
    if (t === ft || t.state === 'dead' || !t.grounded || ft.hitIds.has(t)) continue;
    if (Math.abs(t.x - ft.x) < 5.4 * s && Math.abs(t.y - ft.y) < 1) {
      ft.hitIds.add(t);
      const res = t.takeHit(ft, { dmg: 6, kb: 7.6, g: 0.35, a: 84, weak: 1 }, Math.sign(t.x - ft.x) || 1, t.x, t.y);
      if (res && res !== 'shield') g.onHitFx(ft, res, t.x, t.y + 0.4);
    }
  }
  g.sfx('boom'); g.shake(1.1);
  g.fx.ring(ft.x, ft.y + 0.1, 0, 6.5 * s, 0.5, '#ff6a1a', true); g.fx.ring(ft.x, ft.y + 0.6, 0.4, 3.4 * s, 0.35, '#ffd27a');
  for (let i = -4; i <= 4; i++) g.fx.fire(ft.x + i * 1.2 * s, ft.y + 0.1, 0.2 * ((i % 3) - 1), i === 0 ? 8 : 4, i === 0 ? 1.8 : 1.3);
  g.fx.dust(ft.x, ft.y, 24, '#6a5a50', 3);
  g.fx.flash(ft.x, ft.y + 0.5, 0.6, 4, 0.25, '#ffb060');
}

const SPECIALS = {
  brimshell(ft, inp, f, up, S, X) {
    const g = ft.game, spec = ft.spec, s = ft.size;
    if (spec === 'n') {
      // MAGMA BREATH: a held stream of fire that juggles, then a final blast
      if (!ft.grounded) { X.drift(0.35); if (ft.vy < 0) ft.vy *= 0.86; }
      if (f === 3) g.sfx('roar');
      if (f >= 12 && f <= 44) {
        if (f === 12 || f === 28) g.sfx('breath');
        S.aim = approach(S.aim || 0, clamp(inp.y, -1, 1) * 0.5, 0.05);
        const mx = ft.x + ft.facing * (ft.w * 0.5 + 0.2), my = ft.y + ft.h * 0.7;
        for (let i = 0; i < 3; i++) {
          const d = (0.8 + i * 0.85) * s;
          g.fx.fire(mx + ft.facing * d, my + S.aim * d * 0.6 - i * 0.08, 0.1, 2, 0.8 + i * 0.3);
        }
        if (f % 4 === 0 || f === 41) ft.hitIds.clear();
        const last = f >= 41;
        X.H(last ? { r: 1.35 * s, dmg: 4.5, kb: 7.6, g: 1.15, a: 40 } : { r: 1.2 * s, dmg: 1.3, kb: 2.2, g: 0.05, a: 20, weak: 1 },
          mx + ft.facing * 1.55 * s, my + S.aim * 1.0, ft.facing);
      }
      if (f >= 64) ft.setState(ft.grounded ? 'idle' : 'air');
    } else if (spec === 'down') {
      // BASALT BOMB: hop and crash shell-first; the eruption fires on landing (SPECIAL_LAND)
      if (!S.phase) S.phase = S.startGround ? 'wind' : 'hover';
      if (f <= 9) ft.armor = true;
      if (S.phase === 'wind') {
        ft.vx *= 0.7;
        if (f >= 9) { X.launchUp(11.5, ft.facing * 2); S.phase = 'rise'; g.sfx('heavy'); g.fx.dust(ft.x, ft.y, 10, '#8a7a6a', 1.5); }
      } else if (S.phase === 'hover') {
        ft.noGrav = true; ft.vy = approach(ft.vy, 0, 2.5); ft.vx *= 0.9; if (f >= 8) S.phase = 'plunge';
      } else if (S.phase === 'rise') {
        X.drift(0.35); if (ft.vy <= 2 || f > 32) S.phase = 'plunge';
      }
      if (S.phase === 'plunge') {
        ft.vy = -32; ft.vx *= 0.9; ft.noGrav = true;
        if (f % 2 === 0) g.fx.fire(ft.x, ft.y + ft.h * 0.5, 0.1, 2, 1.2);
        X.H({ r: 1.35 * s, dmg: 12, kb: 6.5, g: 1.05, a: -70 }, ft.x, ft.y + 0.4, ft.facing);
        if (f > 160) ft.toHelpless();
      }
    } else {
      // CINDER CYCLONE: tuck into the burning shell and spin upward, steering hard
      if (f < 5) { ft.vx *= 0.7; if (!ft.grounded) { ft.noGrav = true; ft.vy *= 0.4; } }
      if (f === 5) {
        X.launchUp(S.startGround ? 14 : 19.5, ft.facing * 2 + inp.x * 4);
        g.sfx('spin'); g.fx.ring(ft.x, ft.y + 0.3, 0.1, 2.8 * s, 0.35, '#ff7a1a', true);
      }
      if (f > 5 && f <= 36) {
        X.drift(1.05);
        if (f % 6 === 5 || f === 33) { ft.hitIds.clear(); if (f !== 33) g.sfx('spin'); }
        const last = f >= 33;
        X.H(last ? { r: 1.3 * s, dmg: 6, kb: 7.5, g: 1.15, a: 70 } : { r: 1.2 * s, dmg: 1.5, kb: 3, g: 0, a: 85, weak: 1 }, ft.x, ft.y + ft.h * 0.5, 0);
        if (f % 2 === 0) { g.fx.fire(ft.x, ft.y + ft.h * 0.4, 0.1, 2, 1); g.fx.trail(ft.x, ft.y + ft.h * 0.5, '#ff6a1a', 0.9); }
      }
      if (f >= 46) ft.toHelpless();
    }
  },
  nebulo(ft, inp, f, up, S, X) {
    const g = ft.game, spec = ft.spec, s = ft.size;
    const tipX = ft.x + ft.facing * (ft.w * 0.5 + 0.7 * s);
    if (spec === 'n') {
      // STARDUST SPLAT: flick a glob of sticky star paint that puddles where it lands
      if (!ft.grounded) { X.drift(0.7); if (f < 12 && ft.vy < 0) ft.vy *= 0.85; }
      if (f === 9) {
        g.spawnProjectile(ft, 'paintGlob');
        g.sfx('splat'); g.fx.burst(tipX, ft.y + ft.h * 0.75, 0.2, PAINT[0], 10, 4, 0.4, 0.24);
      }
      if (f >= 28) ft.setState(ft.grounded ? 'idle' : 'air');
    } else if (spec === 'down') {
      // COMET CRITTER: paint a doodle star that springs to life and bounds forward
      if (!ft.grounded) { X.drift(0.5); if (ft.vy < 0) ft.vy *= 0.88; }
      if (f === 4) g.sfx('sparkle');
      if (f >= 4 && f < 14 && f % 2 === 0) g.fx.burst(tipX, ft.y + 0.5, 0.2, PAINT[(f / 2) % 4], 4, 2.5, 0.35, 0.22);
      if (f === 14) { g.spawnProjectile(ft, 'doodle'); g.sfx('splat'); }
      if (f >= 34) ft.setState(ft.grounded ? 'idle' : 'air');
    } else {
      // DOODLE ROCKET: paint a rocket mid-air and ride it, then it bursts into stars
      if (f < 6) {
        ft.vx *= 0.7; ft.noGrav = true; ft.vy *= 0.4;
        if (f % 2 === 0) g.fx.burst(ft.x, ft.y + 0.2, 0.2, PAINT[f % 4], 5, 3, 0.35, 0.24);
      }
      if (f === 6) { X.launchUp(16, inp.x * 4); g.sfx('rev'); g.fx.ring(ft.x, ft.y + 0.2, 0.1, 2.4 * s, 0.35, PAINT[1], true); }
      if (f >= 6 && f < 22) {
        ft.vy = Math.max(ft.vy, 15.5 - (f - 6) * 0.2);
        X.drift(0.9);
        if (f % 2 === 0) g.fx.trail(ft.x - ft.facing * 0.1, ft.y + 0.1, PAINT[(f / 2) % 4], 0.8);
        if (f % 5 === 1) ft.hitIds.clear();
        X.H({ r: 1.0 * s, dmg: 2.5, kb: 4, g: 0.1, a: 88, weak: 1 }, ft.x + ft.facing * 0.2, ft.y + ft.h * 0.6, 0);
      }
      if (f === 22) {
        ft.hitIds.clear();
        X.H({ r: 1.45 * s, dmg: 6, kb: 7, g: 1.1, a: 80, radial: 1, paint: 90 }, ft.x, ft.y + ft.h * 0.6, 0);
        g.sfx('sparkle');
        for (let i = 0; i < 4; i++) g.fx.burst(ft.x, ft.y + ft.h * 0.6, 0.2, PAINT[i], 8, 7, 0.5, 0.3);
        g.fx.ring(ft.x, ft.y + ft.h * 0.6, 0.2, 3 * s, 0.3, PAINT[2]);
      }
      if (f > 22) X.drift(0.75);
      if (f >= 34) ft.toHelpless();
    }
  },
};

const SPECIAL_LAND = {
  brimshell(ft, g) {
    if (ft.spec === 'down' && ft.specData.phase === 'plunge') { eruption(ft, g); ft.lag = 24; ft.setState('landing'); return true; }
    return false;
  },
};

const paintTrail = (from, to) => function onFrame(ft, f, g) {
  if (f >= from && f <= to && f % 2 === 0) {
    g.fx.burst(ft.x + ft.facing * (ft.w * 0.5 + 0.95 * ft.size), ft.y + ft.h * 0.5, 0.2, PAINT[(f / 2) % 4], 3, 2, 0.4, 0.22, { grav: 1 });
  }
};

const MOVE_MODS = {
  brimshell(m, s, h, w) {
    m.jab = { t: 22, hb: [{ f0: 6, f1: 8, x: w + 0.55 * s, y: 0.55 * h, r: 0.75 * s, dmg: 6, kb: 5.5, g: 0.6, a: 40 }], anim: 'jab', sfx: 'heavy' };
    // KING'S RAKE: armored claw swipe
    m.ftilt = { t: 42, armor: [1, 12], hb: [{ f0: 13, f1: 17, x: w + 0.85 * s, y: 0.5 * h, r: 1.0 * s, dmg: 17, kb: 8, g: 1.85, a: 38 }], anim: 'fsmash', sfx: 'heavy', lunge: 3, strong: true };
    // HORN TOSS
    m.utilt = { t: 34, hb: [{ f0: 9, f1: 14, x: 0.25 * s, y: h + 0.05 * s, r: 1.0 * s, dmg: 13, kb: 7.5, g: 1.6, a: 88 }], anim: 'usmash', sfx: 'heavy', strong: true };
    // TAIL SWEEP: hits in front and behind
    m.dtilt = { t: 28, hb: [{ f0: 8, f1: 11, x: w + 0.9 * s, y: 0.3, r: 0.75 * s, dmg: 9, kb: 6, g: 1.0, a: 25 }, { f0: 8, f1: 11, x: -(w + 0.7 * s), y: 0.3, r: 0.7 * s, dmg: 8, kb: 6, g: 0.9, a: 155 }], anim: 'dtilt', sfx: 'swing' };
    // SHELL SPIN
    m.nair = { t: 34, air: 1, rehit: 6, hb: [{ f0: 5, f1: 22, x: 0, y: 0.5 * h, r: w + 0.6 * s, dmg: 3, kb: 3.2, g: 0.2, a: 50, radial: 1, weak: 1 }, { f0: 24, f1: 25, x: 0, y: 0.5 * h, r: w + 0.7 * s, dmg: 6, kb: 6.5, g: 1.1, a: 45, radial: 1 }], anim: 'nair', sfx: 'spin', land: 8 };
    m.bair = { t: 32, air: 1, hb: [{ f0: 9, f1: 13, x: -(w + 0.7 * s), y: 0.45 * h, r: 0.85 * s, dmg: 14, kb: 7, g: 1.7, a: 140 }], anim: 'bair', sfx: 'heavy', land: 10 };
    m.dair = { t: 42, air: 1, hb: [{ f0: 14, f1: 20, x: 0.1, y: -0.05, r: 0.95 * s + w * 0.4, dmg: 15, kb: 6.5, g: 1.35, a: -80 }], anim: 'dair', sfx: 'heavy', land: 16 };
  },
  nebulo(m, s, h, w) {
    m.jab = { t: 14, hb: [{ f0: 3, f1: 5, x: w + 0.55 * s, y: 0.55 * h, r: 0.55 * s, dmg: 3, kb: 4.2, g: 0.3, a: 40 }], anim: 'jab', sfx: 'swing' };
    // BRUSH SWEEP: long, paints the target
    m.ftilt = { t: 30, hb: [{ f0: 8, f1: 12, x: w + 1.0 * s, y: 0.5 * h, r: 0.75 * s, dmg: 10, kb: 6.8, g: 1.55, a: 38, paint: 90 }], anim: 'fsmash', sfx: 'swing', lunge: 3, strong: true, onFrame: paintTrail(7, 12) };
    m.utilt = { t: 28, hb: [{ f0: 6, f1: 12, x: 0.2 * s, y: h + 0.25 * s, r: 0.8 * s, dmg: 8, kb: 6.8, g: 1.45, a: 88 }], anim: 'usmash', sfx: 'swing', strong: true };
    m.fair = { t: 28, air: 1, hb: [{ f0: 7, f1: 11, x: w + 0.85 * s, y: 0.5 * h, r: 0.72 * s, dmg: 9, kb: 5.8, g: 1.4, a: 42, paint: 60 }], anim: 'fair', sfx: 'swing', land: 7, onFrame: paintTrail(6, 11) };
    m.nair = { t: 28, air: 1, hb: [{ f0: 4, f1: 14, x: 0, y: 0.5 * h, r: w + 0.7 * s, dmg: 7, kb: 5.2, g: 0.95, a: 48, radial: 1 }], anim: 'nair', sfx: 'spin', land: 5 };
    m.dair = { t: 34, air: 1, hb: [{ f0: 10, f1: 15, x: 0.05, y: -0.05, r: 0.65 * s + w * 0.4, dmg: 10, kb: 5.5, g: 1.2, a: -75, paint: 60 }], anim: 'dair', sfx: 'swing', land: 10 };
  },
};

const SPECIAL_POSES = {
  brimshell(P, f, up, S, spec) {
    if (spec === 'down') {
      if (S && S.phase === 'plunge') { P.aRx = -0.4; P.aLx = -0.4; P.aRz = -0.5; P.aLz = 0.5; P.hx = 0.45; P.lLx = -0.6; P.lRx = -0.6; P.crouch = 0.3; }
      else { P.aRx = -3.1; P.aLx = -3.1; P.hx = -0.3; P.crouch = f < 8 ? 0.6 : 0; }
    } else if (up) {
      P.crouch = 0.65; P.aRx = -0.4; P.aLx = -0.4; P.aRz = -0.5; P.aLz = 0.5; P.lLx = -0.9; P.lRx = -0.9; P.hd = 0.3;
      if (f > 5) P.spinY = (f - 5) * 0.8;
    } else if (f < 12) {
      const k = Math.min(1, f / 10); P.hd = -0.55 * k; P.hx = -0.25 * k; P.aRz = -0.9 * k; P.aLz = 0.9 * k; P.aRx = -0.8 * k; P.aLx = -0.8 * k;
    } else {
      P.hd = 0.18 + Math.sin(f * 1.7) * 0.04; P.hx = 0.4; P.crouch = 0.2; P.aRx = -0.7; P.aLx = -0.7; P.aRz = -0.3; P.aLz = 0.3;
    }
  },
  nebulo(P, f, up, S, spec) {
    if (spec === 'down') { P.crouch = 0.35; P.hx = 0.4; P.aRx = -1.1 + Math.sin(f * 0.9) * 0.6; P.aLx = -0.3; P.hy = -0.25; }
    else if (up) {
      if (f < 6) { P.crouch = 0.4; P.aRx = -1.6; P.aLx = -0.6; }
      else if (f < 22) { P.aRx = -3.1; P.aLx = -3.0; P.lLx = -0.5; P.lRx = 0.3; P.hd = -0.3; }
      else { P.aRz = -1.4; P.aLz = 1.4; P.lLx = -0.3; P.lRx = 0.3; P.hd = -0.2; }
    } else { P.aRx = f < 9 ? -2.7 : -0.9; P.aLx = -0.3; P.hx = f < 9 ? -0.2 : 0.35; P.hy = -0.3; }
  },
};

const SIGNATURE_VICTORY = {
  brimshell(P, t) { const s = Math.sin(t * 5); P.aRx = -2.5 + s * 0.3; P.aLx = -2.5 - s * 0.3; P.aRz = -0.6; P.aLz = 0.6; P.hd = -0.5 + Math.abs(s) * 0.15; P.crouch = 0.15; },
  nebulo(P, t) { P.aRx = -3.0 + Math.sin(t * 6) * 0.5; P.aRz = -0.3; P.aLz = 0.5; P.hy = Math.sin(t * 3) * 0.3; P.crouch = Math.abs(Math.sin(t * 6)) * 0.25; P.hd = -0.2; },
};

export function registerShellMoves(specials, poses, mods, land, victory) {
  Object.assign(specials, SPECIALS);
  Object.assign(poses, SPECIAL_POSES);
  Object.assign(mods, MOVE_MODS);
  Object.assign(land, SPECIAL_LAND);
  Object.assign(victory, SIGNATURE_VICTORY);
}

// CPU logic for the two fighters. Returns true when it set a special.
export function shellAI(f, t, inp, adx, dy, dir, edge) {
  const id = f.c.id;
  if (id === 'brimshell') {
    if (adx > 1.0 && adx < 3.5 && Math.abs(dy) < 1.3) { f.facing = dir; inp.x = dir * 0.3; inp.specialP = true; return true; }
    if (f.grounded && adx < 2.6 && Math.abs(dy) < 1.4) { f.facing = dir; inp.y = -1; inp.specialP = true; return true; }
    if (!f.grounded && adx < 1.8 && dy < -0.8 && Math.abs(f.x) < edge - 0.5) { inp.y = -1; inp.specialP = true; return true; }
  }
  if (id === 'nebulo') {
    if (f.grounded && adx > 2 && adx < 9 && Math.abs(dy) < 0.8 && Math.random() < 0.45) { f.facing = dir; inp.y = -1; inp.specialP = true; return true; }
    if (adx > 3 && adx < 9 && Math.abs(dy) < 2.2) { f.facing = dir; inp.x = dir * 0.3; inp.specialP = true; return true; }
  }
  return false;
}
