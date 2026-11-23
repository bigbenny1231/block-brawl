// Workshop roster models for the shared procedural voxel rig.
const METAL = { kind: 'metal' };
const GLOW = { kind: 'glow', glow: 1.65 };

function buildCinderback(P, assemble, mats, h) {
  const rock = '#4a252c', hide = '#ad4538', ridge = '#762a39', clay = '#df7351';
  const ember = '#ff9240', gold = '#ffc65b', tooth = '#ffe3ba';
  const torso = new P()
    .box(0.91, 0.83, 0.64, 0, 0.38, 0, hide)
    .box(1.02, 0.58, 0.68, 0, 0.67, -0.05, rock)
    .box(0.59, 0.54, 0.11, 0, 0.40, 0.326, clay)
    .box(0.74, 0.34, 0.59, 0, 0.94, 0.05, ridge)
    .box(0.60, 0.12, 0.09, 0, 0.59, 0.37, ember, { rz: -0.08 })
    .box(0.54, 0.10, 0.07, 0, 0.37, 0.38, clay)
    .box(0.48, 0.09, 0.06, 0, 0.16, 0.37, ridge);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const big = i % 2 === 0;
      torso.box(big ? 0.14 : 0.085, big ? 0.13 : 0.08, 0.07, side * (0.36 + i * 0.036),
        0.40 + i * 0.16, 0.28 - i * 0.09, big ? ember : gold, { ...GLOW, rz: side * (0.2 + i * 0.15) });
    }
  }

  // Flat jaw, mottled scales and the paired external gills of a salamander.
  const head = new P()
    .box(0.90, 0.42, 0.71, 0, 0.26, 0.035, hide)
    .box(0.93, 0.16, 0.56, 0, 0.46, -0.065, rock)
    .box(0.73, 0.18, 0.57, 0, 0.235, 0.39, clay)
    .box(0.69, 0.14, 0.48, 0, 0.04, 0.355, ridge)
    .box(0.61, 0.055, 0.28, 0, 0.137, 0.50, '#522139')
    .box(0.59, 0.027, 0.055, 0, 0.142, 0.645, ember, GLOW);
  for (const side of [-1, 1]) {
    head.box(0.17, 0.15, 0.20, side * 0.30, 0.36, 0.335, rock, { rz: side * 0.17 })
      .box(0.11, 0.077, 0.039, side * 0.30, 0.338, 0.439, gold, GLOW)
      .box(0.033, 0.068, 0.040, side * 0.305, 0.339, 0.460, rock)
      .box(0.057, 0.041, 0.035, side * 0.197, 0.264, 0.671, ridge)
      .box(0.060, 0.048, 0.040, side * 0.20, 0.162, 0.649, tooth);
    for (let i = 0; i < 3; i++) {
      const x = side * (0.53 + i * 0.05), y = 0.21 + i * 0.13;
      head.box(0.37 - i * 0.027, 0.102, 0.12, x, y, -0.13 - i * 0.062, ridge, { rz: side * (0.12 + i * 0.24), ry: side * 0.25 })
        .box(0.18, 0.055, 0.085, x + side * 0.125, y + i * 0.035, -0.09 - i * 0.064, i === 1 ? gold : ember,
          { ...GLOW, rz: side * (0.12 + i * 0.24), ry: side * 0.25 });
    }
  }

  const arm = () => {
    const p = new P()
      .box(0.39, 0.33, 0.47, 0, 0.03, -0.02, rock)
      .box(0.31, 0.68, 0.37, 0, -0.31, 0, hide)
      .box(0.38, 0.22, 0.44, 0, -0.63, 0.06, ridge)
      .box(0.22, 0.15, 0.06, 0, -0.49, 0.2, clay);
    for (let i = -1; i <= 1; i++) p.box(0.075, 0.083, 0.19, i * 0.102, -0.653, 0.295, tooth);
    return p;
  };
  const leg = () => {
    const p = new P()
      .box(0.43, 0.67, 0.43, 0, -0.315, -0.06, ridge, { rx: -0.16 })
      .box(0.43, 0.22, 0.59, 0, -0.60, 0.075, rock);
    for (let i = -1; i <= 1; i++) p.box(0.081, 0.077, 0.17, i * 0.116, -0.641, 0.348, tooth);
    return p;
  };
  const tail = new P();
  for (let i = 0; i < 5; i++) {
    const width = 0.40 - 0.059 * i, y = -0.09 - i * 0.093, z = -0.14 - i * 0.245;
    tail.box(width, width * 0.79, 0.34, i * i * 0.012, y, z, i % 2 ? ridge : hide, { rx: -0.38 + i * 0.065 })
      .box(width * 0.52, 0.073, 0.14, i * i * 0.012, y + width * 0.40, z, i % 2 ? gold : ember, GLOW);
  }
  return assemble({ h, hipY: 0.71, neckY: 1.74, shX: 0.61, shY: 1.57, handY: -0.63,
    legX: 0.265, torso, head, armR: arm(), armL: arm(), legR: leg(), legL: leg(), cape: tail, capeY: 1.02, capeZ: -0.30 }, mats);
}

function buildSkiff(P, assemble, mats, h) {
  const down = '#fce9b7', shade = '#dda573', teal = '#298890', deep = '#234b66';
  const hull = '#d08839', rubber = '#33394d', blue = '#78f4e8', sail = '#ff785e';
  const torso = new P()
    .box(0.86, 0.22, 0.82, 0, 0.15, -0.05, hull)
    .box(0.70, 0.14, 0.84, 0, 0.047, -0.055, deep)
    .box(0.68, 0.26, 0.29, 0, 0.15, 0.394, teal, { rx: 0.37 })
    .box(0.62, 0.075, 0.12, 0, 0.209, 0.54, blue, GLOW)
    .box(0.37, 0.44, 0.35, 0, 0.43, -0.04, down)
    .box(0.39, 0.27, 0.38, 0, 0.34, -0.049, '#efad43')
    .box(0.34, 0.075, 0.375, 0, 0.62, -0.045, sail)
    .box(0.18, 0.23, 0.20, 0, 0.30, 0.30, rubber);
  for (const side of [-1, 1]) {
    torso.box(0.11, 0.24, 0.67, side * 0.395, 0.20, -0.103, hull)
      .box(0.085, 0.053, 0.62, side * 0.447, 0.195, -0.092, '#efc56d')
      .box(0.125, 0.49, 0.29, side * 0.337, 0.37, -0.400, sail, { rz: -side * 0.28 })
      .box(0.17, 0.13, 0.16, side * 0.333, 0.212, 0.341, rubber)
      .box(0.10, 0.045, 0.075, side * 0.333, 0.291, 0.369, blue, GLOW);
  }
  const head = new P()
    .box(0.49, 0.44, 0.45, 0, 0.225, 0.025, down)
    .box(0.39, 0.12, 0.34, 0.03, 0.48, -0.04, '#fbce7a', { rz: 0.20 })
    .box(0.27, 0.109, 0.29, 0.025, 0.159, 0.253, '#ec9347', { rz: -0.07 })
    .box(0.245, 0.028, 0.039, 0.02, 0.123, 0.402, shade)
    .box(0.57, 0.095, 0.47, 0, 0.31, 0.02, deep);
  for (const side of [-1, 1]) {
    head.box(0.228, 0.172, 0.102, side * 0.139, 0.308, 0.275, rubber)
      .box(0.173, 0.117, 0.065, side * 0.139, 0.314, 0.322, teal, METAL)
      .box(0.058, 0.025, 0.012, side * 0.133 - 0.028, 0.343, 0.36, blue, { ...GLOW, rz: 0.23 })
      .box(0.154, 0.144, 0.214, side * 0.26, 0.20, -0.041, shade, { rz: side * 0.22 });
  }
  const arm = () => new P()
    .box(0.16, 0.26, 0.15, 0, -0.1, 0.035, down, { rx: -0.35 })
    .box(0.172, 0.12, 0.20, 0, -0.219, 0.10, hull);
  const pod = () => new P()
    .box(0.36, 0.28, 0.50, 0, -0.158, 0.004, teal)
    .box(0.36, 0.11, 0.43, 0, -0.29, 0.006, rubber)
    .box(0.25, 0.05, 0.32, 0, -0.363, -0.01, blue, GLOW)
    .box(0.26, 0.067, 0.06, 0, -0.17, -0.261, sail, GLOW);
  return assemble({ h, hipY: 0.41, neckY: 1.09, shX: 0.286, shY: 0.99, handY: -0.22,
    legX: 0.287, torso, head, armR: arm(), armL: arm(), legR: pod(), legL: pod() }, mats);
}

// Robotnik's dark suit and swept hair from the first live-action Sonic film.
function buildRobotnik(P, assemble, mats, h) {
  const skin = '#d6a180', skinShade = '#bd876e', hair = '#271c24', hairLight = '#62404a';
  const coat = '#191923', lapel = '#3e3d4c', shirt = '#2b2b37', black = '#101017';
  const lens = '#22252e', frame = '#504d5d', red = '#f74857';
  const hipY = 0.87, neckY = 1.68;
  const torso = new P()
    .box(0.51, 0.71, 0.31, 0, 0.37, 0, coat)
    .box(0.60, 0.21, 0.32, 0, 0.656, -0.004, coat)
    .box(0.43, 0.18, 0.29, 0, 0.055, 0.014, coat)
    .box(0.20, 0.53, 0.054, 0, 0.437, 0.158, shirt)
    .box(0.048, 0.40, 0.04, 0, 0.483, 0.198, black)
    .box(0.058, 0.073, 0.046, 0, 0.709, 0.196, lapel, { rz: Math.PI / 4 })
    .box(0.18, 0.13, 0.20, 0, 0.762, 0.027, skin)
    .box(0.19, 0.058, 0.063, 0, 0.74, 0.16, lapel);
  for (const side of [-1, 1]) {
    torso.box(0.109, 0.299, 0.061, side * 0.124, 0.606, 0.167, lapel, { rz: side * -0.42 })
      .box(0.145, 0.045, 0.045, side * 0.183, 0.26, 0.166, lapel, { rz: side * 0.10 });
  }
  for (let i = 0; i < 3; i++) torso.box(0.027, 0.028, 0.023, -0.046, 0.166 + i * 0.083, 0.193, '#51505c');

  const head = new P()
    .box(0.43, 0.39, 0.40, 0, 0.276, 0, skin)
    .box(0.36, 0.15, 0.37, 0, 0.092, 0.016, skin)
    .box(0.30, 0.08, 0.33, 0, 0.033, 0.037, skinShade)
    .box(0.10, 0.114, 0.107, 0, 0.213, 0.219, skin, { rx: 0.17 })
    .box(0.128, 0.026, 0.035, 0, 0.084, 0.212, '#8b514d')
    .box(0.446, 0.114, 0.428, 0, 0.452, -0.027, hair)
    .box(0.419, 0.205, 0.138, 0, 0.355, -0.151, hair)
    .box(0.37, 0.134, 0.225, 0.024, 0.500, 0.057, hair, { rz: -0.162, rx: -0.18 })
    .box(0.215, 0.105, 0.166, 0.06, 0.553, 0.054, hairLight, { rz: -0.19, rx: -0.20 })
    .box(0.390, 0.021, 0.023, 0, 0.312, 0.221, frame);
  for (const side of [-1, 1]) {
    head.box(0.071, 0.111, 0.117, side * 0.223, 0.248, -0.025, skinShade)
      .box(0.049, 0.103, 0.181, side * 0.204, 0.387, -0.031, hair)
      .box(0.178, 0.079, 0.046, side * 0.109, 0.303, 0.224, frame)
      .box(0.151, 0.058, 0.019, side * 0.109, 0.304, 0.25, lens)
      .box(0.072, 0.012, 0.012, side * 0.115, 0.32, 0.263, '#697383', { rz: -0.1 })
      .box(0.061, 0.035, 0.105, side * 0.209, 0.308, 0.173, frame);
    head.box(0.124, 0.041, 0.041, side * 0.067, 0.152, 0.237, hair, { rz: side * -0.20 })
      .box(0.068, 0.035, 0.039, side * 0.142, 0.151, 0.229, hair, { rz: side * 0.42 })
      .box(0.041, 0.032, 0.037, side * 0.174, 0.174, 0.215, hair, { rz: side * 0.83 });
  }
  const arm = () => new P()
    .box(0.19, 0.55, 0.22, 0, -0.21, 0, coat)
    .box(0.198, 0.08, 0.226, 0, -0.461, 0.005, lapel)
    .box(0.182, 0.16, 0.205, 0, -0.553, 0.047, black);
  const remote = new P()
    .box(0.13, 0.074, 0.24, -0.009, 0.018, 0.114, frame, METAL)
    .box(0.105, 0.029, 0.185, -0.009, 0.066, 0.117, coat)
    .box(0.045, 0.025, 0.052, -0.01, 0.082, 0.16, red, GLOW);
  const leg = () => new P()
    .box(0.224, 0.82, 0.23, 0, -0.411, 0.006, shirt)
    .box(0.235, 0.13, 0.36, 0, -0.795, 0.061, black)
    .box(0.24, 0.038, 0.368, 0, -0.851, 0.062, lapel);
  const coatTails = new P();
  for (const side of [-1, 1]) {
    coatTails.box(0.237, 0.49, 0.077, side * 0.132, -0.203, 0, coat, { rz: side * 0.12 })
      .box(0.048, 0.433, 0.078, side * 0.22, -0.196, 0.014, lapel, { rz: side * 0.14 });
  }
  return assemble({ h, hipY, neckY, shX: 0.366, shY: 1.558, handY: -0.548,
    legX: 0.134, torso, head, armR: arm(), armL: arm(), legR: leg(), legL: leg(), weapon: remote,
    cape: coatTails, capeY: 1.08, capeZ: -0.18 }, mats);
}

const WORKSHOP_FIGHTERS = [
  { id: 'cinderback', name: 'CINDERBACK', title: 'Caldera Salamander', model: buildCinderback,
    color: '#ff874d', w: 1.15, h: 2.28, weight: 1.42, run: 7.05, air: 5.6, jump: 15.8, dj: 13.7,
    grav: 1.10, fall: 18.1, jumps: 1, reach: 1.29, power: 1.25, portraitSize: 0.91,
    stats: { power: 5, speed: 2, weight: 5, jump: 2 }, nSpecial: 'EMBER BREATH', upSpecial: 'CALDERA LEAP',
    desc: 'A heavyweight salamander. Fans a stream of embers ahead and blasts upward in a fiery leap.',
    fx: ['#ffe093', '#ff7238'], keep: ['#ffe3ba', '#522139'] },
  { id: 'skiff', name: 'SKIFF', title: 'Hatchling Test Pilot', model: buildSkiff,
    color: '#6fe3d7', w: 0.79, h: 1.65, weight: 0.84, run: 10.3, air: 8.4, jump: 17.1, dj: 15.6,
    grav: 0.96, fall: 15.5, jumps: 1, reach: 0.85, power: 0.90, portraitSize: 0.67,
    stats: { power: 2, speed: 5, weight: 2, jump: 5 }, nSpecial: 'CROSSWIND DASH', upSpecial: 'LIFT JETS',
    desc: 'A daring hatchling in a scrap-built hovercraft. Skims through rivals and banks sharply in the air.',
    fx: ['#d8fffa', '#5fe3dc'], keep: ['#fce9b7', '#dda573'] },
  // Keep the old slot ID so saved selection, mastery, and cosmetics carry forward.
  { id: 'rivet', name: 'DR. ROBOTNIK', title: 'Drone Commander', model: buildRobotnik, inspired: 'Sonic the Hedgehog (2020 film)',
    color: '#ff6572', w: 0.69, h: 2.28, weight: 0.99, run: 8.55, air: 7.0, jump: 16.7, dj: 15.1,
    grav: 1.02, fall: 16.4, jumps: 1, reach: 1.03, power: 1.04, portraitSize: 0.62,
    stats: { power: 3, speed: 3, weight: 3, jump: 4 }, nSpecial: 'DRONE DISPATCH', upSpecial: 'THRUSTER ASSIST',
    desc: 'A fast-talking inventor in a black coat. Dispatches a pursuit drone and calls in a burst of thrust to recover.',
    fx: ['#ff8995', '#e92747'], keep: ['#d6a180', '#bd876e', '#271c24', '#62404a', '#22252e', '#8b514d'] },
];

export const WORKSHOP_IDS = WORKSHOP_FIGHTERS.map(c => c.id);

export function makeWorkshopFighters(P, assemble) {
  return Object.fromEntries(WORKSHOP_FIGHTERS.map(({ model, ...c }) => [c.id, {
    ...c,
    build: mats => model(P, assemble, mats, c.h),
  }]));
}
