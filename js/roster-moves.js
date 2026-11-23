// Special moves share the fighter engine's hit checks, recovery and projectile pools.
const specials = {
  rumi: {
    neutral: { kind: 'projectile', start: 12, end: 30, shots: [{ kind: 'spiritBlade', speed: 19, dmg: 9, size: 0.46, y: 0.6 }] },
    up: { start: 6, end: 34, rise: 20.5, steer: 0.78, r: 1.06, dmg: 9, reach: 0.48 },
    victory: 'cheer',
  },
  mira: {
    neutral: { kind: 'strike', start: 11, end: 32, r: 0.98, dmg: 12, reach: 1.35, y: 0.48 },
    up: { start: 8, end: 32, rise: 19, steer: 0.74, r: 1.28, dmg: 8, reach: 0.45, spin: true },
    victory: 'spin',
  },
  zoey: {
    neutral: { kind: 'projectile', start: 7, end: 25, shots: [
      { kind: 'spiritBlade', speed: 22, rise: -2.6, dmg: 3, size: 0.27, y: 0.45 },
      { kind: 'spiritBlade', speed: 24, rise: 0, dmg: 3, size: 0.27, y: 0.53 },
      { kind: 'spiritBlade', speed: 21, rise: 3.4, dmg: 3, size: 0.27, y: 0.61 },
    ] },
    up: { start: 4, end: 28, rise: 19, steer: 0.98, r: 0.80, dmg: 5, reach: 0.25, spin: true },
    victory: 'dance',
  },
  jinu: {
    neutral: { kind: 'dash', start: 7, end: 29, r: 0.8, dmg: 10, reach: 0.63, y: 0.54, speed: 16 },
    up: { start: 5, end: 34, rise: 20, steer: 1.05, r: 1.02, dmg: 7, reach: 0.32 },
    victory: 'wave',
  },
  abby: {
    neutral: { kind: 'dash', start: 15, end: 42, r: 1.05, dmg: 15, reach: 0.75, y: 0.51, speed: 11.5 },
    up: { start: 9, end: 38, rise: 18.5, steer: 0.65, r: 1.07, dmg: 11, reach: 0.58 },
    victory: 'flex',
  },
  mystery: {
    neutral: { kind: 'burst', start: 9, end: 31, r: 1.58, dmg: 10, y: 0.52 },
    up: { start: 6, end: 33, rise: 20.5, steer: 0.9, r: 1.16, dmg: 7, reach: 0, spin: true },
    victory: 'wave',
  },
  romance: {
    neutral: { kind: 'projectile', start: 12, end: 32, shots: [{ kind: 'heart', speed: 12, rise: 0.85, dmg: 9, size: 0.48, y: 0.6 }] },
    up: { start: 7, end: 35, rise: 19.3, steer: 0.8, r: 1.29, dmg: 8, reach: 0.18, spin: true },
    victory: 'wave',
  },
  'baby-saja': {
    neutral: { kind: 'burst', start: 6, end: 22, r: 1.23, dmg: 7, y: 0.22 },
    up: { start: 5, end: 34, rise: 22, steer: 0.72, r: 0.92, dmg: 6, reach: 0 },
    victory: 'dance',
  },
  'gwi-ma': {
    neutral: { kind: 'projectile', start: 18, end: 44, shots: [{ kind: 'soulFire', speed: 14, rise: -0.6, dmg: 13, size: 0.64, y: 0.74 }] },
    up: { start: 10, end: 42, rise: 19.5, steer: 0.63, r: 1.4, dmg: 12, reach: 0 },
    victory: 'flex',
  },
  cinderback: {
    neutral: { kind: 'flame', start: 14, end: 43, active: 17, r: 1.12, dmg: 11, reach: 1.47, y: 0.65 },
    up: { start: 8, end: 38, rise: 20.4, steer: 0.70, r: 1.29, dmg: 11, reach: 0.1, sfx: 'fire' },
    victory: 'flex',
  },
  skiff: {
    neutral: { kind: 'dash', start: 6, end: 28, active: 12, r: 0.72, dmg: 8, reach: 0.53, y: 0.37, speed: 17.5, sfx: 'rush' },
    up: { start: 4, end: 38, rise: 16.5, steer: 1.12, r: 0.80, dmg: 6, reach: 0, jet: { speed: 14.5, frames: 15 }, sfx: 'rev' },
    victory: 'spin',
  },
  rivet: {
    neutral: { kind: 'projectile', start: 10, end: 31, armAim: -0.20, sfx: 'blaster',
      shots: [{ kind: 'rivetBolt', speed: 24, rise: -0.25, dmg: 8, size: 0.32, y: 0.56 }] },
    up: { start: 7, end: 35, rise: 21.3, steer: 0.8, r: 1.08, dmg: 9, reach: 0.30, sfx: 'spring' },
    victory: 'wave',
  },
};

function neutralSpecial(ft, f, X, m) {
  const game = ft.game;
  const y = ft.y + ft.h * (m.y ?? m.shots[0].y);
  const dir = ft.facing;
  const x = ft.x + (m.reach ?? 0) * ft.size * dir;
  const [light, accent] = ft.c.fx;
  const active = f >= m.start && f < m.start + (m.active ?? (m.kind === 'dash' ? 9 : 5));
  if (m.kind === 'dash' && active) {
    ft.vx = dir * (ft.grounded ? m.speed : m.speed * 0.7);
    if (f % 2 === 0) game.fx.trail(ft.x - dir * 0.28, y, accent, 0.7);
  } else if (!ft.grounded) {
    X.drift(0.63);
  }
  if (f === m.start) {
    game.sfx(m.sfx ?? (m.kind === 'projectile' ? 'throw' : m.kind === 'burst' ? 'boom' : m.kind === 'flame' ? 'fire' : 'heavy'));
    game.fx.burst(x, y, 0.2, light, 13, 4.5, 0.34, 0.27);
    if (m.kind === 'projectile') {
      for (const shot of m.shots) game.spawnProjectile(ft, shot.kind, shot);
    } else if (m.kind !== 'flame') {
      const spread = m.kind === 'burst';
      game.fx.ring(x, y, 0.2, m.r * ft.size * 2, 0.32, accent, spread && m.y < 0.3);
    }
  }
  if (m.kind === 'flame' && active && (f - m.start) % 2 === 0) {
    game.fx.burst(x, y, 0.15, accent, 5, 7, 0.31, 0.33 * ft.size, { dir: [dir, 0.12], bright: 1.55 });
    game.fx.fire(x - dir * 0.5, y, 0.12, 2, ft.size * 0.77);
  }
  if (m.kind !== 'projectile' && active) {
    const radial = m.kind === 'burst';
    X.H({ r: m.r * ft.size, dmg: m.dmg, kb: 5 + m.dmg * 0.19, g: 0.95, a: radial ? 65 : 43, radial }, x, y, radial ? 0 : dir);
  }
  if (f >= m.end) ft.setState(ft.grounded ? 'idle' : 'air');
}

function recoverySpecial(ft, f, X, m) {
  const game = ft.game;
  if (f < m.start) {
    ft.vx *= 0.7;
    if (!ft.grounded) { ft.noGrav = true; ft.vy = 0; }
  }
  if (f === m.start) {
    X.launchUp(m.rise);
    game.sfx(m.sfx ?? 'spin');
    game.fx.ring(ft.x, ft.y + 0.3, 0.1, 2.5 * ft.size, 0.35, ft.c.fx[1], true);
    game.fx.burst(ft.x, ft.y + 0.35, 0.2, ft.c.fx[0], 18, 5, 0.4, 0.28, { up: 2 });
  }
  if (f > m.start) X.drift(m.steer);
  if (m.jet && f >= m.start && f < m.start + m.jet.frames) {
    ft.vy = Math.max(m.jet.speed, ft.vy);
    if (f % 2 === 0) game.fx.burst(ft.x, ft.y + 0.1, 0.15, ft.c.fx[1], 5, 7, 0.3, 0.25, { dir: [0, -1] });
  }
  if (f >= m.start && f < m.start + 10) {
    const x = ft.x + ft.facing * m.reach * ft.size, y = ft.y + ft.h * 0.59;
    X.H({ r: m.r * ft.size, dmg: m.dmg, kb: 7.1, g: 0.96, a: 83 }, x, y, 0);
    if (f % 2 === 0) game.fx.trail(ft.x, ft.y + 0.18, ft.c.fx[1], 0.68);
  }
  if (f >= m.end) ft.toHelpless();
}

function specialPose(P, f, up, move) {
  if (up) {
    P.crouch = f < move.start ? 0.52 : 0;
    P.aRx = f < move.start ? 0.42 : -2.95;
    P.aLx = f < move.start ? 0.34 : -1.38;
    P.lLx = -0.48;
    P.lRx = 0.34;
    if (move.jet) { P.aRx = -0.65; P.aLx = -0.65; P.lLx = 0.18; P.lRx = 0.18; }
    if (move.spin && f >= move.start) P.spinY = Math.PI * 2 * Math.min(1, (f - move.start) / 17);
    return;
  }
  const charging = f < move.start;
  P.aRx = charging ? -0.65 : (move.armAim ?? -1.55);
  P.aLx = move.kind === 'burst' ? P.aRx : -0.40;
  P.aLz = move.kind === 'burst' ? 0.6 : 0.18;
  P.hy = charging ? 0.27 : -0.3;
  P.hx = move.kind === 'dash' && !charging ? 0.58 : 0.12;
  P.crouch = charging || move.y < 0.3 ? 0.26 : 0;
  if (move.kind === 'strike') P.aRz = charging ? -0.65 : 0.75;
  if (move.kind === 'flame') { P.aRx = 0.46; P.aLx = 0.42; P.hd = charging ? -0.35 : 0.31; P.hx = charging ? -0.12 : 0.47; }
}

export function registerRosterMoves(handlers, poses, victory, victoryPoses) {
  for (const [id, moves] of Object.entries(specials)) {
    handlers[id] = (ft, inp, f, up, state, X) => {
      if (up) recoverySpecial(ft, f, X, moves.up);
      else neutralSpecial(ft, f, X, moves.neutral);
    };
    poses[id] = (P, f, up) => specialPose(P, f, up, up ? moves.up : moves.neutral);
    victory[id] = victoryPoses[moves.victory];
  }
}

export function canUseRosterSpecial(fighter, target, stageEdge) {
  const move = specials[fighter.id]?.neutral;
  if (!move) return false;
  const dx = target.x - fighter.x;
  const dy = target.y + target.h * 0.45 - (fighter.y + fighter.h * (move.y ?? move.shots[0].y));
  const distance = Math.abs(dx);
  if (Math.abs(dy) > 1.45) return false;
  if (move.kind === 'projectile') return distance > 2.4 && distance < 10;
  const reach = ((move.reach ?? 0) + move.r) * fighter.size + target.w / 2;
  if (move.kind === 'dash') {
    const travel = move.speed * (move.active ?? 9) / 60;
    return fighter.grounded && distance < reach + travel && Math.abs(fighter.x + Math.sign(dx) * travel) < stageEdge - 0.2;
  }
  return distance < reach;
}
