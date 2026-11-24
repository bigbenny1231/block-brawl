// Screen-inspired tributes built with the same procedural rig as the rest of the roster.
const FUR = '#f4ecdb';
const COAL = '#28252d';
const GOLD = '#eec453';
const METAL = { kind: 'metal' };
const GLOW = { kind: 'glow', glow: 1.35 };

function santaHat(head, red, brim, side) {
  head.box(0.73, 0.13, 0.64, 0, 0.56, 0, brim)
    .box(0.61, 0.21, 0.54, 0, 0.687, -0.01, red)
    .box(0.42, 0.24, 0.44, side * 0.089, 0.81, -0.04, red, { rz: -side * 0.30 })
    .box(0.23, 0.28, 0.31, side * 0.27, 0.79, -0.06, red, { rz: side * 0.79 })
    .box(0.157, 0.19, 0.186, side * 0.402, 0.711, -0.048, red, { rz: side * 0.39 })
    .box(0.21, 0.18, 0.22, side * 0.444, 0.609, -0.035, brim, { rz: side * 0.17 });
}

function buildGrinch(P, assemble, mats, h) {
  const green = '#88b93a', cheek = '#9dc54b', shadow = '#456928', fingers = '#a9c55c';
  const red = '#a62230', trim = '#e5ddbc', eyes = '#ffe368';
  const head = new P()
    .box(0.60, 0.47, 0.54, 0, 0.335, 0, green)
    .box(0.49, 0.20, 0.48, 0, 0.14, 0.087, green)
    .box(0.66, 0.17, 0.42, 0, 0.241, 0.126, cheek)
    .box(0.32, 0.115, 0.20, 0, 0.244, 0.323, cheek)
    .box(0.112, 0.073, 0.07, 0, 0.29, 0.418, shadow)
    .box(0.33, 0.032, 0.045, 0.015, 0.181, 0.371, '#314d26', { rz: -0.08 });
  for (const side of [-1, 1]) {
    head.box(0.18, 0.091, 0.051, side * 0.142, 0.374, 0.272, eyes, { rz: side * 0.22 })
      .box(0.059, 0.071, 0.027, side * 0.116, 0.369, 0.305, '#a64322')
      .box(0.025, 0.056, 0.031, side * 0.11, 0.368, 0.322, '#382133')
      .box(0.207, 0.071, 0.071, side * 0.147, 0.429, 0.279, shadow, { rz: side * 0.29 })
      .box(0.112, 0.033, 0.065, side * 0.205, 0.201 + side * 0.028, 0.339, '#314d26', { rz: side * 0.37 })
      .box(0.17, 0.078, 0.16, side * 0.312, 0.262, 0.098, green, { rz: side * 0.41 })
      .box(0.137, 0.071, 0.129, side * 0.297, 0.192, 0.154, cheek, { rz: side * 0.53 });
  }
  santaHat(head, red, trim, -1);

  const torso = new P()
    .box(0.53, 0.62, 0.41, 0, 0.378, 0, red)
    .box(0.69, 0.32, 0.50, 0, 0.224, 0.043, red)
    .box(0.68, 0.124, 0.51, 0, 0.069, 0.042, trim)
    .box(0.60, 0.1, 0.46, 0, 0.645, 0.026, trim)
    .box(0.082, 0.52, 0.048, 0.07, 0.365, 0.255, trim, { rz: 0.07 })
    .box(0.24, 0.19, 0.045, -0.188, 0.277, 0.268, '#7f212c', { rz: 0.14 });
  for (let i = -2; i <= 2; i++) torso.box(0.105, 0.068, 0.05, i * 0.12, 0.01 + (i % 2) * 0.018, 0.276, trim, { rz: 0.22 });

  const arm = () => {
    const part = new P()
      .box(0.19, 0.49, 0.22, 0, -0.19, 0, red)
      .box(0.202, 0.10, 0.231, 0, -0.42, 0.012, trim)
      .box(0.165, 0.165, 0.193, 0, -0.51, 0.037, green);
    for (let i = -1; i <= 1; i++) part.box(0.047, 0.154 + 0.012 * i, 0.064,
      i * 0.056, -0.596, 0.095, fingers, { rx: -0.27, rz: i * 0.17 });
    return part;
  };
  const leg = () => new P()
    .box(0.211, 0.69, 0.25, 0, -0.35, 0, green)
    .box(0.25, 0.13, 0.35, 0, -0.65, 0.058, cheek)
    .box(0.212, 0.10, 0.19, 0, -0.62, 0.209, fingers);
  const sack = new P()
    .box(0.25, 0.19, 0.41, 0, -0.025, 0.15, '#9d7145')
    .box(0.15, 0.17, 0.088, 0, -0.02, 0.29, '#e6be78')
    .box(0.41, 0.32, 0.36, 0, -0.095, 0.47, '#9d7145', { rx: 0.15 })
    .box(0.47, 0.36, 0.48, 0, -0.134, 0.69, '#855636', { rx: 0.22 })
    .box(0.38, 0.27, 0.14, 0, -0.147, 0.951, '#a57449')
    .box(0.16, 0.07, 0.17, 0.095, 0.08, 0.75, '#ce5d36', { rz: 0.19 });
  return assemble({ h, hipY: 0.72, neckY: 1.45, shY: 1.29, shX: 0.37, handY: -0.53, legX: 0.183,
    torso, head, armR: arm(), armL: arm(), legR: leg(), legL: leg(), weapon: sack }, mats);
}

function buildSanta(P, assemble, mats, h) {
  const red = '#cf293a', deepRed = '#961928', skin = '#e9aa88', rosy = '#f0847c', beard = '#fff4e7';
  const head = new P()
    .box(0.59, 0.51, 0.54, 0, 0.306, 0, skin)
    .box(0.627, 0.25, 0.23, 0, 0.291, -0.197, FUR)
    .box(0.64, 0.225, 0.37, 0, 0.169, 0.173, beard)
    .box(0.52, 0.184, 0.35, 0, 0.007, 0.214, FUR)
    .box(0.35, 0.104, 0.29, 0, -0.118, 0.258, beard)
    .box(0.20, 0.046, 0.04, 0, 0.177, 0.362, '#87434c')
    .box(0.17, 0.112, 0.145, 0, 0.266, 0.323, rosy);
  for (const side of [-1, 1]) {
    head.box(0.13, 0.074, 0.04, side * 0.128, 0.367, 0.272, '#fff8e9')
      .box(0.054, 0.066, 0.024, side * 0.12, 0.366, 0.296, '#335379')
      .box(0.155, 0.051, 0.066, side * 0.136, 0.435, 0.274, beard, { rz: -side * 0.18 })
      .box(0.122, 0.075, 0.112, side * 0.239, 0.29, 0.225, rosy)
      .box(0.307, 0.091, 0.111, side * 0.153, 0.238, 0.344, beard, { rz: -side * 0.27 })
      .box(0.119, 0.241, 0.33, side * 0.292, 0.248, 0.104, FUR, { rz: side * 0.09 })
      .box(0.152, 0.164, 0.118, side * 0.153, -0.052, 0.346, beard, { rz: -side * 0.23 });
  }
  santaHat(head, red, beard, 1);

  const torso = new P()
    .box(0.89, 0.83, 0.62, 0, 0.413, 0, red)
    .box(0.98, 0.47, 0.68, 0, 0.312, 0.032, red)
    .box(0.97, 0.11, 0.69, 0, 0.05, 0.038, FUR)
    .box(0.64, 0.12, 0.49, 0, 0.795, 0.02, FUR)
    .box(0.12, 0.54, 0.039, 0, 0.418, 0.37, beard)
    .box(0.99, 0.15, 0.70, 0, 0.245, 0.036, COAL)
    .box(0.247, 0.19, 0.046, 0, 0.245, 0.407, GOLD, METAL)
    .box(0.14, 0.102, 0.05, 0, 0.245, 0.43, COAL)
    .box(0.10, 0.028, 0.055, 0.016, 0.245, 0.46, GOLD, METAL);
  const arm = () => new P()
    .box(0.293, 0.56, 0.318, 0, -0.188, 0, red)
    .box(0.31, 0.12, 0.34, 0, -0.437, 0.012, FUR)
    .box(0.263, 0.164, 0.297, 0, -0.567, 0.026, COAL)
    .box(0.092, 0.11, 0.152, -0.115, -0.537, 0.15, COAL);
  const leg = () => new P()
    .box(0.32, 0.68, 0.36, 0, -0.334, 0, deepRed)
    .box(0.345, 0.115, 0.398, 0, -0.464, 0.028, FUR)
    .box(0.34, 0.243, 0.486, 0, -0.613, 0.071, COAL)
    .box(0.354, 0.068, 0.512, 0, -0.703, 0.076, '#1d1920');
  const cane = new P().box(0.106, 0.101, 0.55, 0, 0, 0.256, beard);
  for (let i = 0; i < 4; i++) cane.box(0.118, 0.113, 0.055, 0, 0, 0.071 + i * 0.126, red, { ry: 0.22 });
  cane.box(0.106, 0.105, 0.18, 0.045, 0, 0.525, red, { ry: 0.69 })
    .box(0.191, 0.108, 0.104, 0.146, 0, 0.56, beard)
    .box(0.104, 0.102, 0.157, 0.234, 0, 0.495, red, { ry: -0.63 });
  return assemble({ h, hipY: 0.74, neckY: 1.59, shY: 1.43, shX: 0.49, handY: -0.571, legX: 0.237,
    torso, head, armR: arm(), armL: arm(), legR: leg(), legL: leg(), weapon: cane }, mats);
}

function buildGhostface(P, assemble, mats, h) {
  const black = '#201e29', fold = '#34313f', edge = '#484254';
  const mask = '#faf3e9', maskShade = '#cdcbd0', hollow = '#100e18';
  const head = new P()
    .box(0.65, 0.59, 0.62, 0, 0.31, -0.058, black)
    .box(0.51, 0.185, 0.54, 0, 0.572, -0.077, fold, { rx: -0.16 })
    .box(0.478, 0.33, 0.133, 0, 0.398, 0.269, mask)
    .box(0.387, 0.192, 0.12, 0, 0.231, 0.286, mask)
    .box(0.274, 0.243, 0.13, 0, 0.104, 0.276, mask)
    .box(0.212, 0.081, 0.11, 0, -0.024, 0.265, maskShade)
    .box(0.125, 0.22, 0.032, 0, 0.087, 0.348, hollow)
    .box(0.156, 0.108, 0.033, 0.003, 0.184, 0.349, hollow)
    .box(0.085, 0.054, 0.031, 0, 0.264, 0.353, hollow, { rz: 0.12 });
  for (const side of [-1, 1]) {
    head.box(0.128, 0.183, 0.035, side * 0.134, 0.387, 0.34, hollow, { rz: side * -0.43 })
      .box(0.066, 0.096, 0.037, side * 0.102, 0.335, 0.342, hollow, { rz: side * -0.41 })
      .box(0.106, 0.43, 0.13, side * 0.288, 0.303, 0.244, fold, { rz: side * 0.10 })
      .box(0.074, 0.26, 0.25, side * 0.287, 0.09, 0.166, black, { rz: -side * 0.23 })
      .box(0.048, 0.34, 0.078, side * 0.31, 0.357, 0.318, edge, { rz: side * 0.14 });
  }
  const torso = new P()
    .box(0.59, 0.83, 0.405, 0, 0.404, 0, black)
    .box(0.65, 0.233, 0.44, 0, 0.719, -0.02, fold);
  const cape = new P();
  for (const side of [-1, 1]) {
    torso.box(0.112, 0.70, 0.062, side * 0.167, 0.392, 0.209, fold, { rz: side * 0.14 });
    cape.box(0.33, 0.91, 0.09, side * 0.18, -0.331, 0, black, { rz: side * 0.14 })
      .box(0.23, 0.85, 0.069, side * 0.322, -0.505, -0.04, fold, { rz: side * 0.22 });
  }
  const arm = () => new P()
    .box(0.235, 0.59, 0.27, 0, -0.221, 0, black)
    .box(0.275, 0.275, 0.303, 0, -0.374, -0.019, fold)
    .box(0.203, 0.157, 0.23, 0, -0.567, 0.032, black)
    .box(0.085, 0.24, 0.082, 0.105, -0.515, -0.122, fold, { rz: 0.15 });
  const leg = () => new P()
    .box(0.234, 0.76, 0.28, 0, -0.378, 0, black)
    .box(0.26, 0.16, 0.39, 0, -0.683, 0.064, fold);
  const prop = new P()
    .box(0.097, 0.098, 0.235, 0, 0, 0, COAL)
    .box(0.138, 0.064, 0.08, 0, 0, 0.149, '#59505b', METAL)
    .box(0.128, 0.055, 0.33, 0, 0, 0.336, '#c9cbd6', METAL)
    .box(0.085, 0.048, 0.16, -0.024, 0, 0.538, '#dedde4', { ...METAL, ry: 0.27 });
  return assemble({ h, hipY: 0.76, neckY: 1.66, shY: 1.47, shX: 0.369, handY: -0.566, legX: 0.181,
    torso, head, armR: arm(), armL: arm(), legR: leg(), legL: leg(), weapon: prop,
    cape, capeY: 1.37, capeZ: -0.253 }, mats);
}

const FLIGHT_SUIT = '#b2a189';
const SEAMS = '#83715e';
const STRAP = '#34343c';
const PACK = '#272933';
const PACK_EDGE = '#565763';

function ghostbusterHead(P, style) {
  const { skin, shade, hair, kind } = style;
  const head = new P()
    .box(0.51, 0.45, 0.469, 0, 0.308, 0, skin)
    .box(0.417, 0.17, 0.415, 0, 0.117, 0.024, skin)
    .box(0.101, 0.092, 0.091, 0, 0.232, 0.264, skin)
    .box(0.142, 0.024, 0.034, 0, 0.137, 0.241, shade)
    .box(0.52, 0.119, 0.469, 0, 0.498, -0.015, hair)
    .box(0.518, 0.245, 0.104, 0, 0.386, -0.198, hair);
  for (const side of [-1, 1]) {
    head.box(0.079, 0.115, 0.104, side * 0.271, 0.24, -0.012, skin)
      .box(0.051, 0.174, 0.292, side * 0.246, 0.407, -0.039, hair)
      .box(0.115, 0.055, 0.026, side * 0.109, 0.295, 0.241, '#fff3e5')
      .box(0.038, 0.051, 0.024, side * 0.103, 0.295, 0.259, '#372b29')
      .box(0.13, 0.035, 0.034, side * 0.117, 0.357, 0.244, hair, { rz: side * style.brows });
  }

  if (kind === 'peter') {
    head.box(0.36, 0.079, 0.326, -0.034, 0.556, -0.065, hair, { rz: -0.13 })
      .box(0.243, 0.077, 0.168, -0.119, 0.506, 0.171, hair, { rz: -0.17 })
      .box(0.102, 0.022, 0.036, 0.084, 0.149, 0.242, shade, { rz: 0.18 });
  } else if (kind === 'ray') {
    head.box(0.49, 0.105, 0.35, 0, 0.541, -0.099, hair, { rz: 0.08 })
      .box(0.563, 0.057, 0.487, 0, 0.459, -0.02, COAL)
      .box(0.386, 0.123, 0.112, 0, 0.468, 0.251, '#515b49');
    for (const side of [-1, 1]) head.box(0.127, 0.108, 0.10, side * 0.111, 0.472, 0.329, '#313c42', METAL)
      .box(0.082, 0.071, 0.035, side * 0.111, 0.472, 0.39, '#8abca1');
  } else if (kind === 'egon') {
    head.box(0.45, 0.153, 0.373, -0.007, 0.573, -0.013, hair, { rz: 0.09 })
      .box(0.354, 0.119, 0.197, -0.067, 0.649, 0.077, '#5a453b', { rz: 0.14 })
      .box(0.1, 0.027, 0.035, 0, 0.308, 0.304, COAL);
    for (const side of [-1, 1]) {
      const x = side * 0.122;
      for (const y of [0.246, 0.346]) head.box(0.182, 0.026, 0.034, x, y, 0.292, COAL);
      for (const dx of [-0.083, 0.083]) head.box(0.027, 0.104, 0.034, x + dx, 0.296, 0.292, COAL);
      head.box(0.036, 0.028, 0.215, side * 0.219, 0.325, 0.19, COAL);
    }
  } else {
    head.box(0.48, 0.081, 0.418, 0, 0.529, -0.016, hair)
      .box(0.207, 0.041, 0.054, 0, 0.184, 0.248, hair)
      .box(0.189, 0.051, 0.026, 0, 0.089, 0.244, shade);
  }
  return head;
}

function buildGhostbuster(P, assemble, mats, c) {
  const { look, h, fx } = c;
  const b = look.frame;
  const torso = new P()
    .box(b, 0.80, 0.426, 0, 0.40, 0, FLIGHT_SUIT)
    .box(b + 0.035, 0.126, 0.448, 0, 0.11, 0, STRAP)
    .box(0.138, 0.089, 0.038, 0, 0.116, 0.24, '#8f969a', METAL)
    .box(0.18, 0.072, 0.03, 0, 0.742, 0.222, '#4e4240')
    .box(0.024, 0.62, 0.023, 0, 0.455, 0.222, SEAMS)
    .box(0.16, 0.047, 0.031, -b * 0.288, 0.649, 0.232, '#5b3030')
    .box(0.11, 0.015, 0.035, -b * 0.288, 0.647, 0.248, '#f3bbb0')
    .box(0.485, 0.663, 0.253, 0, 0.419, -0.282, PACK)
    .box(0.47, 0.273, 0.123, 0, 0.619, -0.427, PACK_EDGE)
    .box(0.365, 0.352, 0.153, 0.045, 0.239, -0.443, PACK_EDGE)
    .box(0.256, 0.246, 0.054, 0.045, 0.239, -0.536, PACK)
    .box(0.07, 0.425, 0.085, -0.223, 0.338, -0.402, '#72706a', METAL)
    .box(0.176, 0.045, 0.108, -0.085, 0.721, -0.493, '#c2a046', METAL);
  for (const side of [-1, 1]) {
    torso.box(0.066, 0.56, 0.048, side * b * 0.369, 0.537, 0.233, STRAP, { rz: -side * 0.065 })
      .box(0.088, 0.064, 0.03, side * b * 0.35, 0.48, 0.261, PACK_EDGE)
      .box(0.187, 0.055, 0.05, side * b * 0.257, 0.332, 0.224, SEAMS, { rz: side * 0.21 });
    for (const y of [0.178, 0.3]) torso.box(0.037, 0.036, 0.027, 0.045 + side * 0.062, y, -0.57, '#f34c41', GLOW);
  }
  for (let i = 0; i < 3; i++) {
    torso.box(0.039, 0.089, 0.035, -0.067 + i * 0.055, 0.618, -0.495, '#72c8ef', GLOW);
  }
  if (look.kind === 'ray') {
    torso.box(0.217, 0.244, 0.355, -0.375, 0.134, -0.064, PACK)
      .box(0.099, 0.161, 0.046, -0.394, 0.228, 0.109, PACK_EDGE)
      .box(0.057, 0.212, 0.301, -0.471, 0.138, -0.064, '#a88737');
    for (const z of [-0.151, -0.07, 0.011]) {
      torso.box(0.026, 0.225, 0.039, -0.503, 0.138, z, PACK, { rx: 0.36 });
    }
  }
  const arm = (side) => {
    const sleeve = new P()
      .box(0.22, 0.574, 0.253, 0, -0.216, 0, FLIGHT_SUIT)
      .box(0.227, 0.09, 0.246, 0, -0.274, -0.006, SEAMS)
      .box(0.224, 0.084, 0.233, 0, -0.467, 0.013, STRAP)
      .box(0.187, 0.155, 0.209, 0, -0.553, 0.042, look.skin);
    if (side === -1) sleeve.box(0.033, 0.145, 0.151, -0.119, -0.105, 0.041, '#b43136')
      .box(0.035, 0.105, 0.101, -0.137, -0.105, 0.041, FUR)
      .box(0.042, 0.032, 0.148, -0.154, -0.105, 0.041, '#b43136', { rx: 0.73 });
    if (side === 1 && look.kind === 'egon') {
      sleeve.box(0.134, 0.113, 0.244, 0, -0.54, 0.216, PACK_EDGE)
        .box(0.092, 0.025, 0.063, 0, -0.475, 0.273, '#86e6ad', GLOW);
      for (const x of [-1, 1]) sleeve.box(0.035, 0.064, 0.19,
        x * 0.098, -0.52, 0.278, PACK, { ry: x * 0.41 });
    }
    return sleeve;
  };
  const leg = () => new P()
    .box(0.247, 0.673, 0.284, 0, -0.339, 0, FLIGHT_SUIT)
    .box(0.154, 0.198, 0.043, 0, -0.295, 0.151, '#9d8d77')
    .box(0.252, 0.254, 0.347, 0, -0.61, 0.027, STRAP)
    .box(0.259, 0.066, 0.416, 0, -0.72, 0.061, '#22232c');
  const wand = new P()
    .box(0.10, 0.106, 0.29, 0, 0, 0.034, STRAP)
    .box(0.175, 0.139, 0.355, 0, 0.042, 0.28, PACK_EDGE)
    .box(0.091, 0.098, 0.292, 0, 0.045, 0.512, PACK)
    .box(0.105, 0.098, 0.085, 0, 0.048, 0.675, '#969ca4', METAL)
    .box(0.067, 0.071, 0.045, 0, 0.048, 0.729, fx[0], GLOW)
    .box(0.09, 0.036, 0.048, 0, 0.126, 0.292, '#ffbf47', GLOW)
    .box(0.065, 0.081, 0.193, 0, -0.06, -0.156, PACK, { rx: -0.36 });
  return assemble({ h, hipY: 0.75, neckY: 1.587, shY: 1.431, shX: b / 2 + 0.068, handY: -0.54, legX: b * 0.275,
    torso, head: ghostbusterHead(P, look), armR: arm(-1), armL: arm(1), legR: leg(), legL: leg(), weapon: wand }, mats);
}

const fighters = [
  { id: 'grinch', name: 'THE GRINCH', cardName: 'GRINCH', title: 'Holiday Thief', inspired: 'How the Grinch Stole Christmas',
    build: buildGrinch, color: '#a8de49', h: 2.34, w: 0.76, weight: 0.91, run: 10.0, air: 7.7,
    jump: 17.2, dj: 15.9, grav: 0.96, fall: 16.0, reach: 1.19, power: 1.01,
    stats: { power: 3, speed: 4, weight: 2, jump: 4 }, portraitSize: 0.80, portraitLift: 0.25,
    nSpecial: 'SACK SWIPE', upSpecial: 'CHIMNEY LEAP', desc: 'Swings a sack of stolen gifts, then springs up with a corkscrew leap.',
    fx: ['#e9ff8f', '#8ec930'], keep: ['#88b93a', '#9dc54b', '#456928', '#a9c55c', '#ffe368'] },
  { id: 'santa', name: 'SANTA CLAUS', cardName: 'SANTA', title: 'North Pole Heavyweight',
    build: buildSanta, color: '#ff5453', h: 2.52, w: 1.03, weight: 1.36, run: 7.5, air: 5.7,
    jump: 15.8, dj: 14.0, grav: 1.05, fall: 17.8, reach: 1.32, power: 1.21,
    stats: { power: 5, speed: 2, weight: 5, jump: 3 }, portraitSize: 0.87, portraitLift: 0.23,
    nSpecial: 'SPECIAL DELIVERY', upSpecial: 'SLEIGH LIFT', desc: 'Tosses a wrapped present and rides a burst of holiday magic back to the stage.',
    fx: ['#ffe992', '#f63755'], keep: [FUR, '#e9aa88', '#f0847c', '#fff4e7'] },
  { id: 'ghostface', name: 'GHOSTFACE', title: 'The Masked Menace', inspired: 'Scream',
    build: buildGhostface, color: '#b6a6eb', h: 2.33, w: 0.71, weight: 0.87, run: 10.7, air: 7.5,
    jump: 16.9, dj: 15.4, grav: 1.0, fall: 17.0, reach: 1.12, power: 0.99,
    stats: { power: 3, speed: 5, weight: 2, jump: 3 }, portraitSize: 0.70,
    nSpecial: 'JUMP SCARE', upSpecial: 'CURTAIN RISE', desc: 'Closes distance in a flash and spins upward in a swirl of black fabric.',
    fx: ['#eee8ff', '#8266c8'], keep: ['#faf3e9', '#cdcbd0', '#100e18'] },
  { id: 'peter-venkman', name: 'PETER VENKMAN', cardName: 'VENKMAN', title: 'The Smooth Talker', build: buildGhostbuster,
    color: '#ffac65', h: 2.18, w: 0.77, weight: 1.00, run: 9.1, air: 7.0, jump: 16.7, dj: 15.1,
    grav: 1.0, fall: 16.7, reach: 1.12, power: 1.01, stats: { power: 3, speed: 3, weight: 3, jump: 3 },
    nSpecial: 'PROTON SNAP', upSpecial: 'PACK KICK', desc: 'Fires a quick proton shot and kicks upward on a short pack boost.', fx: ['#fff4bd', '#ff703b'],
    look: { kind: 'peter', frame: 0.60, skin: '#dfa98b', shade: '#925b50', hair: '#554238', brows: 0.12 } },
  { id: 'ray-stantz', name: 'RAY STANTZ', cardName: 'RAY', title: 'Heart of the Team', build: buildGhostbuster,
    color: '#ffd873', h: 2.17, w: 0.85, weight: 1.14, run: 8.4, air: 6.3, jump: 16.3, dj: 14.7,
    grav: 1.02, fall: 17.2, reach: 1.15, power: 1.10, stats: { power: 4, speed: 3, weight: 4, jump: 3 },
    nSpecial: 'TRAP SNAP', upSpecial: 'TRAP LIFT', desc: 'Springs a low ghost trap just ahead and uses the upward blast to recover.', fx: ['#fff2a6', '#f8b343'],
    look: { kind: 'ray', frame: 0.68, skin: '#e8b193', shade: '#9f6254', hair: '#663e29', brows: -0.13 } },
  { id: 'egon-spengler', name: 'EGON SPENGLER', cardName: 'EGON', title: 'Paranormal Scientist', build: buildGhostbuster,
    color: '#84d6ff', h: 2.29, w: 0.72, weight: 0.94, run: 8.9, air: 7.5, jump: 17.4, dj: 15.7,
    grav: 0.94, fall: 16.0, reach: 1.17, power: 0.98, stats: { power: 3, speed: 3, weight: 2, jump: 4 },
    nSpecial: 'PKE PULSE', upSpecial: 'VECTOR BOOST', desc: 'Sends a pulse in both directions and gets plenty of steering on his upward boost.', fx: ['#d8f6ff', '#6e8df9'],
    look: { kind: 'egon', frame: 0.54, skin: '#e9b899', shade: '#a26857', hair: '#49392f', brows: 0.06 } },
  { id: 'winston-zeddemore', name: 'WINSTON ZEDDEMORE', cardName: 'WINSTON', title: 'Field Specialist', build: buildGhostbuster,
    color: '#89e3bc', h: 2.20, w: 0.79, weight: 1.07, run: 9.5, air: 6.8, jump: 16.8, dj: 15.2,
    grav: 1.0, fall: 16.8, reach: 1.16, power: 1.07, stats: { power: 4, speed: 4, weight: 3, jump: 3 },
    nSpecial: 'CROSS CURRENT', upSpecial: 'PACK SURGE', desc: 'Fires a spread of three proton bolts and powers upward with a wide recovery hit.', fx: ['#e1fff0', '#50d6a0'],
    look: { kind: 'winston', frame: 0.63, skin: '#9b603f', shade: '#6b4034', hair: '#282227', brows: 0.07 } },
];

export const HOLIDAY_FIGHTER_IDS = fighters.map(c => c.id);

export function makeHolidayFighters(P, assemble) {
  return Object.fromEntries(fighters.map(c => [c.id, {
    ...c,
    jumps: 1,
    inspired: c.look ? 'Ghostbusters (1984)' : c.inspired,
    portraitSize: c.portraitSize ?? (c.look.kind === 'egon' ? 0.68 : 0.60),
    portraitLift: c.portraitLift ?? (c.look ? 0.10 : 0.08),
    keep: c.keep ?? [c.look.skin, c.look.shade, c.look.hair, '#fff3e5'],
    build: mats => c.look ? c.build(P, assemble, mats, c) : c.build(P, assemble, mats, c.h),
  }]));
}
