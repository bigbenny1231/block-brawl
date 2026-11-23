// Roster additions for the shared procedural voxel rig.
import { buildCaptainKoopa, buildNurseryKoopa, buildTwinRacers } from './cartoon-fighters.js';

const METAL = { kind: 'metal' };
const GLOW = { kind: 'glow', glow: 1.65 };

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
  // Keep both old slot IDs for selection, mastery, and cosmetics in existing saves.
  { id: 'cinderback', name: 'CAPTAIN KOOPA', title: 'Captain of the Sinister Star', model: buildCaptainKoopa,
    inspired: 'The Super Mario Bros. Super Show! (Rolling Down the River)',
    color: '#9c91e7', w: 1.14, h: 2.55, weight: 1.34, run: 7.65, air: 6.15, jump: 16.0, dj: 14.5,
    grav: 1.04, fall: 17.5, jumps: 1, reach: 1.32, power: 1.19, portraitSize: 0.89,
    stats: { power: 5, speed: 2, weight: 5, jump: 3 }, nSpecial: 'DECK SWEEP', upSpecial: 'MAST VAULT',
    desc: 'A riverboat captain with a long rapier. Keeps opponents at blade length and vaults up to recover.',
    fx: ['#e8f3ff', '#978de6'], keep: ['#265c43', '#34744e', '#194638', '#fff2cd', '#352230', '#211d24', '#f5d46a'] },
  { id: 'skiff', name: 'GOO GOO KOOPA', title: 'King of the Nursery', model: buildNurseryKoopa,
    inspired: 'King Goo Goo Ga Ga Koopa (Two Plumbers and a Baby)',
    color: '#f4a6cb', w: 0.92, h: 2.06, weight: 0.93, run: 9.65, air: 7.4, jump: 17.0, dj: 15.35,
    grav: 0.98, fall: 15.9, jumps: 1, reach: 0.99, power: 0.95, portraitSize: 0.78,
    stats: { power: 3, speed: 4, weight: 2, jump: 4 }, nSpecial: 'ROCKER SLAM', upSpecial: 'ROCKING LEAP',
    desc: 'The nursery king rides a wooden rocking horse. Sends a shockwave around it and springs upward.',
    fx: ['#fff0d3', '#f195b9'], keep: ['#265c43', '#34744e', '#194638', '#fff2cd', '#352230', '#211d24', '#f5d46a'] },
  { id: 'hip-hop', name: 'HIP & HOP', title: 'Race Car Twins', model: buildTwinRacers,
    inspired: 'The Adventures of Super Mario Bros. 3 (Misadventure of Mighty Plumber)',
    color: '#f4b96a', w: 1.25, h: 1.43, weight: 0.93, run: 11.25, air: 8.2, jump: 17.5, dj: 15.3,
    grav: 1.00, fall: 16.05, jumps: 1, reach: 1.07, power: 0.98, portraitSize: 0.79,
    stats: { power: 3, speed: 5, weight: 2, jump: 4 }, nSpecial: 'DOUBLE DASH', upSpecial: 'RAMP JUMP',
    desc: 'The twins brawl together in their toy race car. Charge through an opponent or take a ramp into the air.',
    fx: ['#fff3be', '#ed9958'], keep: ['#dfa554', '#dd9a52', '#ffeb9e', '#fff6e7', '#35435c'] },
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
