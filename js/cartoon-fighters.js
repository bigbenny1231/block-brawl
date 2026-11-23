// Builds the episode costumes and vehicles with Block Brawl's procedural voxel rig.
const METAL = { kind: 'metal' };
const GLOW = { kind: 'glow', glow: 1.55 };
const HIDE = '#265c43';
const MUZZLE = '#34744e';
const SCALE_SHADE = '#194638';
const GOLD = '#eabd54';
const TOOTH = '#fff2cd';

function costumeFace(P, small) {
  const scale = small ? 0.79 : 1;
  const face = new P();
  const box = (w, h, d, x, y, z, color, options) => face.box(
    w * scale, h * scale, d * scale, x * scale, y * scale, z * scale, color, options,
  );
  box(0.72, 0.46, 0.57, 0, 0.27, -0.02, HIDE);
  box(0.54, 0.157, 0.56, 0, 0.11, 0.243, SCALE_SHADE);
  box(0.50, 0.116, 0.47, 0, 0.202, 0.306, '#352230');
  box(0.59, 0.158, 0.57, 0, 0.294, 0.320, MUZZLE);
  box(0.50, 0.083, 0.17, 0, 0.325, 0.58, MUZZLE);
  for (const side of [-1, 1]) {
    box(0.174, 0.056, 0.152, side * 0.201, 0.456, 0.284, HIDE, { rz: side * 0.17 });
    box(0.129, 0.060, 0.035, side * 0.192, 0.414, 0.338, '#f5d46a', { rz: side * 0.14 });
    box(0.035, 0.055, 0.035, side * 0.170, 0.412, 0.358, '#211d24');
    box(0.06, 0.053, 0.05, side * 0.16, 0.337, 0.65, SCALE_SHADE, { rz: side * 0.37 });
    box(0.071, 0.123, 0.049, side * 0.18, 0.232, 0.584, TOOTH, { rz: side * 0.14 });
    box(0.072, 0.063, 0.075, side * 0.23, 0.153, 0.44, TOOTH, { rz: side * 0.12 });
  }
  return face;
}

export function buildCaptainKoopa(P, assemble, mats, h) {
  const navy = '#343366', purple = '#534b92', red = '#a23043', lining = '#545d87';
  const head = costumeFace(P, false)
    .box(0.82, 0.083, 0.67, 0, 0.456, -0.024, navy)
    .box(0.70, 0.31, 0.40, 0, 0.58, -0.012, purple)
    .box(0.82, 0.058, 0.46, 0, 0.729, -0.027, red)
    .box(0.67, 0.047, 0.073, 0, 0.475, 0.33, GOLD, METAL)
    .box(0.10, 0.082, 0.039, 0, 0.573, 0.20, GOLD, { ...METAL, rz: Math.PI / 4 });
  for (const side of [-1, 1]) {
    head.box(0.272, 0.22, 0.35, side * 0.246, 0.566, 0.017, purple, { rz: side * 0.26 })
      .box(0.063, 0.23, 0.41, side * 0.374, 0.576, -0.019, red, { rz: -side * 0.34 });
  }
  const torso = new P()
    .box(0.95, 0.87, 0.63, 0, 0.412, 0, navy)
    .box(0.97, 0.31, 0.60, 0, 0.720, -0.025, navy)
    .box(0.33, 0.49, 0.063, 0, 0.542, 0.317, '#b39873')
    .box(0.32, 0.18, 0.078, 0, 0.769, 0.33, '#eee1c8')
    .box(0.89, 0.105, 0.65, 0, 0.168, 0, '#29253e')
    .box(0.23, 0.131, 0.058, 0.05, 0.167, 0.35, GOLD, METAL)
    .box(0.13, 0.066, 0.062, 0.05, 0.167, 0.38, navy);
  for (const side of [-1, 1]) {
    torso.box(0.133, 0.65, 0.064, side * 0.20, 0.539, 0.327, lining, { rz: side * -0.13 })
      .box(0.046, 0.55, 0.047, side * 0.14, 0.551, 0.373, GOLD, { rz: side * -0.08 });
  }
  for (let i = 0; i < 3; i++) {
    torso.box(0.091, 0.115, 0.043, 0.223 + i * 0.077, 0.663, 0.37, i % 2 ? red : '#6463a7', { rz: 0.12 })
      .box(0.086, 0.076, 0.046, 0.231 + i * 0.075, 0.563, 0.386, GOLD, { ...METAL, rz: 0.39 });
  }
  const arm = () => {
    const part = new P()
      .box(0.295, 0.65, 0.32, 0, -0.23, 0, navy)
      .box(0.399, 0.13, 0.43, 0, 0.077, -0.021, GOLD)
      .box(0.285, 0.056, 0.32, 0, 0.16, -0.03, red)
      .box(0.32, 0.123, 0.35, 0, -0.49, 0.009, '#29253e')
      .box(0.31, 0.151, 0.32, 0, -0.60, 0.044, HIDE);
    for (let i = -1; i <= 1; i++) {
      part.box(0.042, 0.116, 0.036, i * 0.1, 0.019, 0.202, GOLD, METAL)
        .box(0.049, 0.055, 0.083, i * 0.085, -0.615, 0.211, TOOTH);
    }
    return part;
  };
  const leg = () => new P()
    .box(0.32, 0.69, 0.36, 0, -0.34, 0, navy)
    .box(0.337, 0.28, 0.43, 0, -0.604, 0.036, '#242337')
    .box(0.34, 0.068, 0.49, 0, -0.705, 0.055, '#181822')
    .box(0.114, 0.09, 0.025, 0, -0.57, 0.258, GOLD, METAL);
  const rapier = new P()
    .box(0.092, 0.094, 0.28, 0, 0, 0.034, red)
    .box(0.097, 0.235, 0.091, 0, 0.012, 0.19, GOLD, METAL)
    .box(0.071, 0.086, 0.83, 0, 0, 0.648, '#c4d5e6', METAL)
    .box(0.028, 0.041, 0.71, 0.038, 0.017, 0.626, '#e4f7ff', GLOW)
    .box(0.04, 0.049, 0.153, 0, -0.004, 1.116, '#e4f7ff', METAL);
  const coatTails = new P();
  for (const side of [-1, 1]) coatTails.box(0.41, 0.53, 0.09, side * 0.23, -0.235, 0, navy, { rz: side * 0.22 })
    .box(0.349, 0.071, 0.09, side * 0.26, -0.469, -0.015, red, { rz: side * 0.22 });
  return assemble({ h, hipY: 0.74, neckY: 1.74, shY: 1.51, shX: 0.585, handY: -0.61, legX: 0.249, torso, head,
    armR: arm(), armL: arm(), legR: leg(), legL: leg(), weapon: rapier,
    cape: coatTails, capeY: 0.94, capeZ: -0.31 }, mats);
}

export function buildNurseryKoopa(P, assemble, mats, h) {
  const pink = '#ed8daf', lightPink = '#ffe0e8', cream = '#fff1dd', pale = '#bacae6';
  const wood = '#8f5338', woodLight = '#cf8c52', orange = '#df9b4e';
  const hipY = 0.45, neckY = 1.33;
  const head = costumeFace(P, true)
    .box(0.59, 0.115, 0.58, 0, 0.395, -0.10, pink)
    .box(0.46, 0.28, 0.35, 0, 0.49, -0.137, pale)
    .box(0.105, 0.33, 0.12, 0.214, 0.536, 0.111, pink, { rz: -0.57 })
    .box(0.105, 0.33, 0.12, -0.214, 0.536, 0.111, pink, { rz: 0.57 })
    .box(0.14, 0.289, 0.09, -0.09, 0.557, 0.168, lightPink, { rz: 0.30 })
    .box(0.14, 0.289, 0.09, 0.09, 0.557, 0.168, lightPink, { rz: -0.30 })
    .box(0.116, 0.104, 0.145, 0, 0.52, 0.192, pink)
    .box(0.068, 0.204, 0.066, 0.229, 0.367, 0.21, pink, { rz: 0.26 });
  const torso = new P()
    .box(0.68, 0.54, 0.43, 0, 0.435, -0.048, orange)
    .box(0.56, 0.26, 0.44, 0, 0.738, -0.02, HIDE)
    .box(0.75, 0.289, 0.51, 0, 0.204, 0, cream)
    .box(0.764, 0.08, 0.521, 0, 0.327, 0, pale)
    .box(0.485, 0.30, 0.066, 0, 0.627, 0.211, pink, { rx: 0.09 })
    .box(0.399, 0.237, 0.069, 0, 0.622, 0.242, lightPink, { rx: 0.09 })
    .box(0.121, 0.116, 0.042, 0, 0.607, 0.284, '#b52f54', { rz: Math.PI / 4 })
    .box(0.082, 0.063, 0.043, -0.041, 0.653, 0.286, '#b52f54')
    .box(0.082, 0.063, 0.043, 0.041, 0.653, 0.286, '#b52f54')
    // Wooden rider, its long neck and the blue-painted bench.
    .box(0.75, 0.193, 1.02, 0, 0.018, -0.098, wood)
    .box(0.61, 0.149, 0.72, 0, 0.127, -0.103, '#486c9a')
    .box(0.303, 0.545, 0.29, 0, 0.271, 0.444, woodLight, { rx: -0.29 })
    .box(0.33, 0.26, 0.35, 0, 0.536, 0.525, woodLight)
    .box(0.264, 0.118, 0.237, 0, 0.482, 0.752, '#df9d47')
    .box(0.492, 0.069, 0.078, 0, 0.385, 0.504, wood);
  for (const side of [-1, 1]) {
    const x = side * 0.306;
    torso.box(0.118, 0.328, 0.126, x, -0.191, -0.31, woodLight)
      .box(0.118, 0.328, 0.126, x, -0.191, 0.36, woodLight)
      .box(0.046, 0.047, 0.09, side * 0.173, 0.554, 0.581, '#542e37')
      .box(0.13, 0.102, 0.211, side * 0.298, 0.075, 0.04, HIDE);
    for (let i = -3; i <= 3; i++) {
      torso.box(0.146, 0.113, 0.242, x, -0.39 + i * i * 0.012, i * 0.195, wood, { rx: -i * 0.14 });
    }
  }
  const arm = () => new P()
    .box(0.184, 0.315, 0.187, 0, -0.098, 0.049, HIDE, { rx: -0.31 })
    .box(0.192, 0.071, 0.197, 0, -0.219, 0.094, pink)
    .box(0.173, 0.12, 0.19, 0, -0.255, 0.138, MUZZLE);
  return assemble({ h, hipY, neckY, shX: 0.321, shY: 1.183, handY: -0.26, legX: 0,
    torso, head, armR: arm(), armL: arm(), legR: new P(), legL: new P() }, mats);
}

export function buildTwinRacers(P, assemble, mats, h) {
  const enamel = '#e55a68', trim = '#ffc96b', charcoal = '#33334c', glass = '#81d4e1';
  const cream = '#ffeb9e', skin = '#dfa554', hipY = 0.43, neckY = 0.91;
  const torso = new P()
    .box(1.05, 0.27, 1.08, 0, 0.084, -0.058, enamel)
    .box(0.85, 0.13, 1.13, 0, -0.061, -0.059, charcoal)
    .box(0.68, 0.146, 0.49, 0, 0.114, 0.51, enamel, { rx: 0.14 })
    .box(0.69, 0.069, 0.092, 0, 0.061, 0.773, trim, METAL)
    .box(0.69, 0.17, 0.077, 0, 0.278, 0.38, glass, { rx: -0.23 })
    .box(0.76, 0.063, 0.076, 0, 0.369, 0.371, charcoal)
    .box(0.143, 0.073, 0.51, 0, 0.192, 0.046, trim)
    .box(0.99, 0.087, 0.23, 0, 0.321, -0.553, enamel)
    .box(0.096, 0.227, 0.18, 0.373, 0.202, -0.476, charcoal)
    .box(0.096, 0.227, 0.18, -0.373, 0.202, -0.476, charcoal);
  for (const side of [-1, 1]) {
    torso.box(0.101, 0.157, 0.8, side * 0.488, 0.204, -0.16, enamel)
      .box(0.029, 0.05, 0.66, side * 0.55, 0.133, -0.136, trim)
      .box(0.168, 0.076, 0.042, side * 0.256, 0.119, 0.766, '#fff5ba', GLOW)
      .box(0.34, 0.287, 0.284, side * 0.244, 0.272, -0.178, charcoal);
  }
  const head = new P();
  const riders = [
    { x: -0.24, z: 0.073, y: -0.068, snout: 0.228, headColor: skin, hair: ['#df5549', '#fcae50', '#73b375'] },
    { x: 0.24, z: -0.113, y: 0.021, snout: 0.214, headColor: '#dd9a52', hair: ['#507eb5', '#ee8750', '#eac853'] },
  ];
  for (const { x, y, z, snout, headColor, hair } of riders) {
    head.box(0.223, 0.259, 0.215, x, y - 0.08, z - 0.022, headColor)
      .box(0.345, 0.335, 0.299, x, y + 0.16, z, headColor)
      .box(0.287, 0.121, 0.213, x, y + 0.096, z + snout - 0.046, cream)
      .box(0.155, 0.034, 0.05, x, y + 0.051, z + snout + 0.061, '#733d44')
      .box(0.094, 0.035, 0.047, x, y + 0.067, z + snout + 0.063, TOOTH);
    for (const side of [-1, 1]) head.box(0.092, 0.097, 0.035, x + side * 0.074, y + 0.192, z + 0.151, '#fff6e7')
      .box(0.036, 0.062, 0.037, x + side * 0.075, y + 0.187, z + 0.175, '#35435c');
    for (let i = 0; i < hair.length; i++) head.box(0.075, 0.153 + 0.026 * (2 - i), 0.108,
      x + 0.012 * (i - 1), y + 0.338 - i * 0.026, z + 0.117 - i * 0.087, hair[i], { rx: 0.5 + i * 0.19, rz: 0.1 });
  }
  const arm = () => new P().box(0.142, 0.24, 0.14, 0, -0.075, 0.064, skin, { rx: -0.79 })
    .box(0.145, 0.10, 0.142, 0, -0.139, 0.162, '#efa957');
  for (const x of [-0.478, 0.478]) {
    for (const z of [-0.468, 0.458]) torso.box(0.206, 0.34, 0.32, x, -0.256, z, charcoal)
      .box(0.223, 0.18, 0.17, x, -0.255, z, '#8e91a5', METAL)
      .box(0.232, 0.082, 0.083, x, -0.255, z, trim, METAL);
  }
  return assemble({ h, hipY, neckY, shX: 0.426, shY: 0.911, handY: -0.14, legX: 0,
    torso, head, armR: arm(), armL: arm(), legR: new P(), legL: new P() }, mats);
}
