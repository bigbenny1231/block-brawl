// Film-inspired fighters built with Block Brawl's procedural geometry and shared rig.
import * as THREE from '../lib/three.module.min.js';

const GOLD = '#ffc75f';
const INK = '#201629';
const METAL = { kind: 'metal' };
const GLOW = { kind: 'glow', glow: 1.65 };

function headwear(head, id, hair, shade, highlight, height) {
  const y = height;
  if (id === 'rumi') {
    head.box(0.45, 0.17, 0.34, 0, y - 0.015, -0.05, hair, { rz: -0.11 });
    head.box(0.23, 0.16, 0.18, 0.09, y - 0.05, 0.15, highlight, { rz: -0.39 });
    for (let i = 0; i < 7; i++) {
      head.box(0.19 - i * 0.013, 0.16, 0.19, 0.19 + i * 0.027, y - 0.01 - i * 0.109, -0.20 + i * 0.008,
        i % 2 ? highlight : shade, { rz: i % 2 ? 0.35 : -0.3, ry: 0.25 });
    }
    head.box(0.105, 0.051, 0.11, 0.357, y - 0.723, -0.149, GOLD);
  } else if (id === 'mira') {
    head.box(0.31, 0.20, 0.20, 0.06, y - 0.02, -0.2, highlight, { rz: 0.40 });
    for (const side of [-1, 1]) {
      head.box(0.14, 0.54, 0.17, side * 0.25, y - 0.23, -0.18, hair, { rz: side * 0.12 });
      head.box(0.088, 0.45, 0.10, side * 0.30, y - 0.56, -0.12, highlight, { rz: side * 0.17 });
      head.box(0.114, 0.23, 0.08, side * 0.20, y - 0.105, 0.17, shade, { rz: side * 0.36 });
    }
  } else if (id === 'zoey') {
    for (const side of [-1, 1]) {
      head.box(0.18, 0.19, 0.20, side * 0.176, y + 0.05, -0.11, hair, { rz: side * 0.35 });
      head.box(0.15, 0.06, 0.17, side * 0.17, y + 0.015, -0.07, GOLD, { rz: side * 0.35 });
      head.box(0.13, 0.17, 0.10, side * 0.165, y - 0.087, 0.19, highlight, { rz: side * 0.36 });
      head.box(0.05, 0.17, 0.06, side * 0.22, y - 0.224, 0.17, shade);
    }
  } else if (id === 'mystery') {
    for (let i = 0; i < 5; i++) {
      head.box(0.114, 0.29 + i * 0.015, 0.106, (i - 2) * 0.095, y - 0.12, 0.198 + i * 0.006,
        i % 2 ? highlight : hair, { rz: -0.30 + i * 0.055 });
    }
    head.box(0.075, 0.28, 0.11, 0.21, y - 0.184, -0.08, shade);
  } else if (id === 'baby-saja') {
    head.box(0.49, 0.16, 0.46, 0, y + 0.006, -0.018, '#ffd370')
      .box(0.51, 0.055, 0.48, 0, y - 0.072, -0.018, '#eea952');
    for (let i = 0; i < 5; i++) {
      head.box(0.084, 0.105 + (i % 2) * 0.03, 0.066, (i - 2) * 0.084, y - 0.123, 0.204, i % 2 ? highlight : hair);
    }
  } else if (id === 'romance') {
    for (const side of [-1, 1]) {
      head.box(0.17, 0.187, 0.15, side * 0.103, y + 0.023, 0.168, highlight, { rz: side * -0.48 });
      head.box(0.15, 0.177, 0.11, side * 0.15, y - 0.062, 0.206, hair, { rz: side * 0.63 });
      head.box(0.09, 0.26, 0.23, side * 0.225, y - 0.09, -0.035, shade, { rz: side * 0.22 });
    }
  } else {
    const flip = id === 'abby' ? -1 : 1;
    head.box(0.25, 0.15, 0.29, 0.086 * flip, y + 0.018, -0.015, hair, { rz: 0.25 * flip })
      .box(0.19, 0.137, 0.12, 0.092 * flip, y - 0.047, 0.177, highlight, { rz: 0.39 * flip })
      .box(0.147, 0.10, 0.105, -0.112 * flip, y - 0.058, 0.18, shade, { rz: -0.34 * flip });
  }
}

function hunterWeapon(P, id, light) {
  const weapon = new P();
  if (id === 'rumi') {
    return weapon.box(0.08, 0.09, 0.29, 0, 0, 0.04, '#623189')
      .box(0.11, 0.25, 0.073, 0, 0, 0.21, GOLD, METAL)
      .box(0.066, 0.20, 0.82, 0, 0, 0.66, '#b488fb', METAL)
      .box(0.026, 0.077, 0.79, 0.035, 0.063, 0.649, light, GLOW)
      .geo(new THREE.ConeGeometry(0.10, 0.25, 4).scale(0.49, 1, 1), 0, 0, 1.184, light, { ...GLOW, rx: Math.PI / 2 });
  }
  if (id === 'mira') {
    weapon.box(0.074, 0.075, 1.19, 0, 0, 0.17, '#6f214b')
      .box(0.078, 0.08, 0.12, 0, 0, -0.41, GOLD, METAL);
    for (let i = 0; i < 6; i++) {
      const t = i / 5, z = 0.69 + 0.12 * i, y = t * t * 0.28;
      weapon.box(0.070, 0.23 - t * 0.13, 0.153, 0, y, z, '#f358a8', { ...METAL, rx: -t * 0.7 })
        .box(0.026, 0.058, 0.149, 0.037, y + 0.075 - t * 0.04, z, light, { ...GLOW, rx: -t * 0.7 });
    }
    return weapon;
  }
  for (let i = -1; i <= 1; i++) {
    weapon.box(0.045, 0.065, 0.18, i * 0.08, -0.01, 0.11, GOLD, METAL)
      .geo(new THREE.ConeGeometry(0.087, 0.36, 4).scale(0.45, 1, 1), i * 0.10, 0.015, 0.355 - Math.abs(i) * 0.044, light,
        { ...GLOW, rx: Math.PI / 2, ry: i * 0.16 });
  }
  return weapon;
}

function buildIdol(P, assemble, mats, c) {
  const { id, h, look, fx } = c;
  const { skin, hair, shade, highlight, jacket, shirt, trim, bottoms, boots, frame } = look;
  const hunter = Boolean(look.hunter);
  const hipY = h * 0.416, neckY = h * 0.75, bodyH = neckY - hipY;
  const headH = h * 0.208, headD = 0.4, headW = frame * 0.72 + 0.1;
  const front = headD / 2;
  const depth = frame * 0.55;
  const torso = new P(), head = new P(), legR = new P(), legL = new P();
  const armWidth = frame * 0.33, handY = -bodyH * 0.82;
  torso.box(frame * 0.80, bodyH * 0.42, depth * 0.97, 0, bodyH * 0.20, 0, hunter ? skin : shirt)
    .box(frame, bodyH * (hunter ? 0.64 : 0.76), depth, 0, bodyH * 0.62, 0, jacket)
    .box(frame * 0.4, bodyH * 0.60, 0.037, 0, bodyH * 0.63, depth / 2, shirt)
    .box(0.18, 0.09, 0.183, 0, bodyH - 0.026, 0, skin)
    .box(frame * 0.84, 0.085, depth * 1.08, 0, 0.06, 0, bottoms)
    .box(0.10, 0.062, 0.035, 0, 0.065, depth * 0.56, trim, METAL);
  for (const side of [-1, 1]) {
    torso.box(0.044, bodyH * 0.5, 0.027, side * frame * 0.31, bodyH * 0.63, depth * 0.51, trim, { rz: side * 0.21 });
  }
  if (hunter) {
    torso.box(0.04, 0.15, 0.046, frame * 0.33, 0.0, depth / 2 + 0.015, trim, { rz: 0.11 });
    torso.geo(new THREE.OctahedronGeometry(0.047), frame * 0.34, -0.08, depth / 2 + 0.015, fx[0], GLOW);
  } else {
    torso.box(0.062, 0.062, 0.035, 0.02, bodyH * 0.56, depth / 2 + 0.029, trim, { ...METAL, rz: Math.PI / 4 });
    torso.box(0.035, 0.20, 0.02, 0.19, bodyH * 0.74, depth / 2 + 0.019, shade, { rz: -0.45 });
  }
  if (id === 'mira') {
    torso.box(frame * 1.04, 0.22, depth * 1.21, 0, -0.042, 0, bottoms);
    for (let i = -2; i <= 2; i++) torso.box(0.037, 0.21, 0.035, i * 0.093, -0.046, depth * 0.61, '#fbd16d', { rz: -i * 0.052 });
  } else if (id === 'abby') {
    for (let i = 0; i < 3; i++) torso.box(0.10, 0.04, 0.028, i * 0.1 - 0.16, 0.16 + i * 0.075, depth / 2, '#ffb5a8', { rz: 0.28 });
  }

  head.box(headW, headH, headD, 0, headH * 0.50, 0, skin)
    .box(headW * 1.04, headH * 0.34, headD * 1.08, 0, headH * 0.89, -0.017, hair)
    .box(headW * 1.02, headH * 0.71, 0.068, 0, headH * 0.54, -0.20, shade)
    .box(0.074, 0.056, 0.045, 0, headH * 0.37, front + 0.012, skin)
    .box(0.102, 0.024, 0.026, 0, headH * 0.205, front + 0.002, look.lips);
  for (const side of [-1, 1]) {
    const eyeX = side * headW * 0.25;
    head.box(0.057, 0.101, 0.09, side * headW * 0.51, headH * 0.44, -0.012, skin);
    if (id !== 'mystery') {
      head.box(0.092, 0.055, 0.024, eyeX, headH * 0.54, front + 0.004, '#fff7e9')
        .box(0.043, 0.052, 0.028, eyeX + 0.01, headH * 0.539, front + 0.01, look.eyes, hunter ? {} : GLOW)
        .box(0.105, 0.025, 0.028, eyeX, headH * 0.66, front + 0.007, INK, { rz: side * (look.brow ?? 0.11) });
    }
    head.box(0.042, 0.064, 0.035, side * headW * 0.51, headH * 0.285, 0.026, trim, METAL);
  }
  headwear(head, id, hair, shade, highlight, headH);
  if (id === 'rumi' || !hunter) {
    head.box(0.018, 0.077, 0.025, headW * 0.32, headH * 0.35, front + 0.004, fx[1], { ...GLOW, rz: 0.68 })
      .box(0.017, 0.052, 0.023, headW * 0.39, headH * 0.27, front + 0.004, fx[1], { ...GLOW, rz: -0.13 });
  }
  const sleeve = hunter ? 0.26 : 0.52;
  const arm = side => {
    const p = new P().box(armWidth, -handY, armWidth, 0, handY / 2, 0, skin)
      .box(armWidth * 1.15, bodyH * sleeve, armWidth * 1.12, 0, -bodyH * sleeve * 0.29, 0, jacket)
      .box(armWidth * 1.06, 0.078, armWidth * 1.06, 0, handY + 0.095, 0, trim)
      .box(armWidth * 1.07, 0.13, armWidth * 1.08, 0, handY + 0.006, 0.025, skin);
    if (id === 'zoey' || id === 'abby') p.box(armWidth * 1.06, 0.075, armWidth * 1.06, 0, handY * 0.55, 0, side < 0 ? shirt : trim);
    return p;
  };

  const legW = frame * 0.39, bootH = hunter && id !== 'zoey' ? hipY * 0.48 : hipY * 0.27;
  for (const [i, leg] of [legR, legL].entries()) {
    const exposed = id === 'rumi' || id === 'mira';
    leg.box(legW, hipY, legW * 1.02, 0, -hipY / 2, 0, exposed ? skin : bottoms)
      .box(legW * 1.03, hipY * 0.22, legW * 1.05, 0, -hipY * 0.11, 0, bottoms)
      .box(legW * 1.04, bootH, legW * 1.07, 0, -hipY + bootH / 2, 0, boots)
      .box(legW * 1.12, 0.105, legW * 1.49, 0, -hipY + 0.058, 0.049, boots)
      .box(legW * 1.13, 0.037, legW * 1.50, 0, -hipY + 0.02, 0.050, trim);
    for (let l = 0; l < 3; l++) leg.box(legW * 0.58, 0.021, 0.022, 0, -hipY + 0.125 + l * bootH / 6, legW * 0.55, trim);
    if (id === 'zoey') {
      for (let a = 0; a < 4; a++) leg.box(0.06, 0.073, 0.028, (a % 2 ? -1 : 1) * legW * 0.27, -0.21 - a * 0.12, legW * 0.51,
        (i + a) % 2 ? '#f3cf58' : '#82f0da', { rz: a % 2 ? 0.48 : -0.48 });
    }
  }

  const weapon = hunter ? hunterWeapon(P, id, fx[0]) : new P()
    .box(0.055, 0.053, 0.23, 0, 0, 0.083, shade)
    .box(0.092, 0.087, 0.09, 0, 0, 0.207, trim, METAL)
    .box(0.068, 0.068, 0.035, 0, 0, 0.258, fx[0], GLOW);
  return assemble({ h, hipY, neckY, shY: neckY - bodyH * 0.17, shX: frame * 0.62,
    handY, legX: frame * 0.227, torso, head, armR: arm(-1), armL: arm(1), legR, legL, weapon }, mats);
}

function buildGwiMa(P, assemble, mats, c) {
  const coal = '#390c39', plum = '#791357', pink = '#fc418d', hot = '#ffb674', teeth = '#fff0cf';
  const { h } = c, hipY = 0.77, neckY = 1.85;
  const torso = new P().box(0.92, 0.80, 0.54, 0, 0.38, 0, coal)
    .box(1.24, 0.51, 0.56, 0, 0.78, 0, plum)
    .box(0.72, 0.16, 0.60, 0, 0.14, 0, plum)
    .geo(new THREE.OctahedronGeometry(0.30).scale(0.77, 1.22, 0.58), 0, 0.57, 0.3, pink, GLOW)
    .geo(new THREE.OctahedronGeometry(0.155).scale(0.77, 1.22, 0.58), 0, 0.61, 0.4, hot, GLOW);
  const head = new P()
    .box(1.22, 0.59, 0.62, 0, 0.28, -0.04, coal)
    .box(1.35, 0.17, 0.62, 0, 0.56, 0.02, plum)
    .box(1.16, 0.155, 0.61, 0, 0.002, 0.025, plum)
    .box(1.04, 0.35, 0.14, 0, 0.265, 0.296, '#1a051e')
    .box(1.02, 0.046, 0.12, 0, 0.456, 0.334, pink, GLOW)
    .box(1.08, 0.042, 0.12, 0, 0.076, 0.334, pink, GLOW);
  for (let i = -3; i <= 3; i++) {
    const edge = Math.abs(i), x = i * 0.151, upper = edge === 3 ? 0.28 : 0.168;
    head.geo(new THREE.ConeGeometry(0.065 + edge * 0.007, upper, 4).scale(1, 1, 0.72), x, 0.45 - upper / 2, 0.387 - edge * 0.01, teeth,
      { rx: Math.PI, rz: -i * 0.075 });
    head.geo(new THREE.ConeGeometry(0.058, 0.12 + edge * 0.023, 4).scale(1, 1, 0.74), x, 0.134 + edge * 0.009, 0.407 - edge * 0.013, teeth,
      { rz: i * 0.067 });
    const flameH = 0.23 + (3 - edge) * 0.115;
    head.geo(new THREE.ConeGeometry(0.17, flameH, 4), i * 0.19, 0.60 + flameH * 0.3, -0.05, edge % 2 ? plum : pink,
      { ...(edge % 2 ? {} : GLOW), rz: -i * 0.21, rx: -0.23 });
  }
  for (const side of [-1, 1]) {
    head.box(0.22, 0.098, 0.14, side * 0.575, 0.33, 0.28, pink, { ...GLOW, rz: side * 0.65 });
    torso.box(0.095, 0.36, 0.051, side * 0.43, 0.66, 0.285, pink, { ...GLOW, rz: side * 0.69 });
  }
  const arm = side => new P().box(0.35, 0.73, 0.36, 0, -0.26, 0, coal)
    .box(0.46, 0.28, 0.44, 0, 0.02, 0, plum)
    .box(0.36, 0.31, 0.37, 0, -0.61, 0.065, pink, GLOW)
    .geo(new THREE.ConeGeometry(0.19, 0.42, 4), side * 0.03, -0.77, 0.05, hot, { ...GLOW, rx: Math.PI, rz: side * 0.23 });
  const leg = () => new P().box(0.35, 0.62, 0.37, 0, -0.32, 0, coal)
    .box(0.43, 0.19, 0.45, 0, -0.61, 0.026, plum)
    .box(0.35, 0.085, 0.38, 0, -0.66, 0.081, pink, GLOW);
  const cape = new P();
  for (let i = -2; i <= 2; i++) {
    cape.geo(new THREE.ConeGeometry(0.29, 0.68 + (2 - Math.abs(i)) * 0.19, 4), i * 0.22, -0.43, -0.09, i % 2 ? plum : coal,
      { rx: Math.PI - 0.22, rz: i * 0.11 });
  }
  return assemble({ h, hipY, neckY, shY: 1.7, shX: 0.71, handY: -0.66, legX: 0.26, torso, head,
    armR: arm(-1), armL: arm(1), legR: leg(), legL: leg(), cape, capeY: 1.58, capeZ: -0.28 }, mats);
}

const fighters = [
  { id: 'rumi', name: 'RUMI', title: 'HUNTR/X Lead Singer', color: '#c99cff', h: 2.27, w: 0.69, weight: 1.00, run: 9.6, air: 7.2,
    jump: 18, dj: 16.2, grav: 1.0, fall: 16, jumps: 1, reach: 1.19, power: 1.06, stats: { power: 4, speed: 4, weight: 3, jump: 4 },
    nSpecial: 'HONMOON CUT', upSpecial: 'ASCENDING BLADE', desc: 'A balanced sword fighter. Sends a cut across the stage and slashes upward to recover.', fx: ['#d7f1ff', '#b76afa'],
    look: { hunter: true, frame: 0.54, skin: '#e2a37e', lips: '#90475a', eyes: '#412a48', hair: '#914bd6', shade: '#603299', highlight: '#ba76ff',
      jacket: '#f6b83c', shirt: '#f7eee4', trim: '#ffe39b', bottoms: '#242035', boots: '#262238' } },
  { id: 'mira', name: 'MIRA', title: 'HUNTR/X Lead Dancer', color: '#ff75bb', h: 2.30, w: 0.70, weight: 1.04, run: 8.8, air: 6.8,
    jump: 17, dj: 15.3, grav: 1.04, fall: 16.8, jumps: 1, reach: 1.35, power: 1.11, stats: { power: 4, speed: 3, weight: 3, jump: 3 },
    nSpecial: 'CRESCENT SWEEP', upSpecial: 'MOON VAULT', desc: 'Her curved blade controls space with a long sweep and a rising vault.', fx: ['#ffb9e6', '#f25a9d'],
    look: { hunter: true, frame: 0.56, skin: '#dd9d82', lips: '#963652', eyes: '#572747', brow: 0.28, hair: '#d12b79', shade: '#971956', highlight: '#ff70b3',
      jacket: '#251b2f', shirt: '#38254b', trim: '#fa6fae', bottoms: '#eeb333', boots: '#32253c' } },
  { id: 'zoey', name: 'ZOEY', title: 'HUNTR/X Rapper', color: '#57e6d2', h: 2.01, w: 0.62, weight: 0.81, run: 10.7, air: 8.2,
    jump: 18, dj: 15.6, grav: 0.96, fall: 15.4, jumps: 2, reach: 0.9, power: 0.90, stats: { power: 2, speed: 5, weight: 1, jump: 5 },
    nSpecial: 'SPIRIT BLADE VOLLEY', upSpecial: 'SYNC STEP', desc: 'Throws a quick spread of spirit blades. Two air jumps let her change lanes fast.', fx: ['#baffeb', '#36d8ce'],
    look: { hunter: true, frame: 0.49, skin: '#ecad89', lips: '#a44f66', eyes: '#433758', hair: '#283045', shade: '#151725', highlight: '#4d5270',
      jacket: '#167d97', shirt: '#44c5de', trim: '#ffd466', bottoms: '#3a465c', boots: '#eea840' } },
  { id: 'jinu', name: 'JINU', title: 'Saja Boys Leader', color: '#8cbaf5', h: 2.24, w: 0.68, weight: 0.99, run: 9.5, air: 7.6,
    jump: 17.7, dj: 16.4, grav: 0.98, fall: 16, jumps: 1, reach: 1.03, power: 1.0, stats: { power: 3, speed: 4, weight: 3, jump: 4 },
    nSpecial: 'SHADOW STEP', upSpecial: 'DEMON ASCENT', desc: 'A quick shadow rush closes the gap. His rising strike is easy to steer.', fx: ['#c2d7ff', '#6762dd'],
    look: { frame: 0.57, skin: '#eab394', lips: '#9b5965', eyes: '#ffd67f', hair: '#252335', shade: '#141423', highlight: '#434461',
      jacket: '#e8e3ed', shirt: '#b6afd4', trim: '#8fd1e9', bottoms: '#68779c', boots: '#ece8ef' } },
  { id: 'abby', name: 'ABBY SAJA', title: 'Saja Boys Powerhouse', color: '#ff8f78', h: 2.32, w: 0.81, weight: 1.22, run: 8.1, air: 6.1,
    jump: 16.8, dj: 14.8, grav: 1.08, fall: 17.6, jumps: 1, reach: 1.11, power: 1.16, stats: { power: 5, speed: 2, weight: 4, jump: 3 },
    nSpecial: 'POWER BREAK', upSpecial: 'LION UPPERCUT', desc: 'A heavy bruiser with a delayed shoulder smash and a close-range uppercut.', fx: ['#ffe0a7', '#ff816e'],
    look: { frame: 0.69, skin: '#d69877', lips: '#8f4550', eyes: '#ffce76', brow: 0.26, hair: '#b54e63', shade: '#733845', highlight: '#ec7b88',
      jacket: '#ee987a', shirt: '#ffd0a9', trim: '#f8db9f', bottoms: '#4c6377', boots: '#ffddd0' } },
  { id: 'mystery', name: 'MYSTERY SAJA', title: 'Saja Boys Enigma', color: '#b4a4fa', h: 2.19, w: 0.65, weight: 0.90, run: 9.8, air: 7.8,
    jump: 17.4, dj: 16.3, grav: 0.94, fall: 15.8, jumps: 1, reach: 1.10, power: 0.99, stats: { power: 3, speed: 4, weight: 2, jump: 4 },
    nSpecial: 'BLIND SPOT', upSpecial: 'VEIL LIFT', desc: 'Lets rivals come close, then attacks on both sides with a burst of shadow.', fx: ['#e0c9ff', '#9a62e4'],
    look: { frame: 0.52, skin: '#e8b2ae', lips: '#875666', eyes: '#ffd677', hair: '#a689ce', shade: '#77669e', highlight: '#d2b8ed',
      jacket: '#b4c8d7', shirt: '#d9b8c8', trim: '#e5d7ff', bottoms: '#a1aace', boots: '#d9e8ed' } },
  { id: 'romance', name: 'ROMANCE SAJA', title: 'Saja Boys Heartthrob', color: '#f79ec4', h: 2.23, w: 0.67, weight: 0.94, run: 9.0, air: 7.1,
    jump: 17.3, dj: 15.8, grav: 0.99, fall: 16, jumps: 1, reach: 1.04, power: 0.97, stats: { power: 3, speed: 3, weight: 2, jump: 4 },
    nSpecial: 'HEART BREAKER', upSpecial: 'ENCORE', desc: 'Controls the midrange with a slow-moving heart and a sweeping aerial recovery.', fx: ['#ffc0df', '#eb529c'],
    look: { frame: 0.55, skin: '#e9ab94', lips: '#ad576d', eyes: '#fed587', hair: '#dc6e9d', shade: '#ad4779', highlight: '#f9acd0',
      jacket: '#f0b0c4', shirt: '#f7d3a3', trim: '#ffdf95', bottoms: '#9f98c4', boots: '#ffe0e7' } },
  { id: 'baby-saja', name: 'BABY SAJA', title: 'Saja Boys Rapper', color: '#86e0b5', h: 1.98, w: 0.63, weight: 0.84, run: 10.4, air: 8.0,
    jump: 17.8, dj: 15.6, grav: 0.97, fall: 15.8, jumps: 1, reach: 0.93, power: 0.91, stats: { power: 2, speed: 5, weight: 1, jump: 4 },
    nSpecial: 'BASS DROP', upSpecial: 'BEAT BOUNCE', desc: 'A quick low burst catches close opponents. A strong vertical bounce gets him back onstage.', fx: ['#d2ffae', '#42d1a2'],
    look: { frame: 0.51, skin: '#efbb9e', lips: '#9e526f', eyes: '#ffdb7b', hair: '#399d9b', shade: '#257475', highlight: '#7bdbce',
      jacket: '#a7dec1', shirt: '#f1d382', trim: '#ffe9a0', bottoms: '#7186a5', boots: '#e3f2e0' } },
  { id: 'gwi-ma', name: 'GWI-MA', title: 'Demon King', color: '#ff578e', h: 2.83, w: 1.19, weight: 1.47, run: 6.8, air: 5.4,
    jump: 15.4, dj: 13.7, grav: 1.1, fall: 18.4, jumps: 1, reach: 1.31, power: 1.25, stats: { power: 5, speed: 1, weight: 5, jump: 2 },
    nSpecial: 'SOUL FIRE', upSpecial: 'INFERNAL PILLAR', desc: 'A heavyweight made of demon fire. Spits an ember and rises in a column of flame.', fx: ['#ffc17a', '#fa428a'] },
];

export const DEMON_HUNTER_IDS = fighters.map(c => c.id);

export function makeDemonHunters(P, assemble) {
  return Object.fromEntries(fighters.map(c => [c.id, {
    ...c,
    inspired: 'KPop Demon Hunters',
    portraitSize: c.look ? 0.57 : 1.04,
    keep: c.look ? [c.look.skin, c.look.eyes, c.look.lips, '#fff7e9'] : ['#fff0cf'],
    build: mats => c.look ? buildIdol(P, assemble, mats, c) : buildGwiMa(P, assemble, mats, c),
  }]));
}
