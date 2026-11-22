// Block Brawl v2 - special moves for the v2 roster
const approach = (v, t, s) => (v < t ? Math.min(t, v + s) : Math.max(t, v - s));
export const SPECIALS = {
  fizz(ft, inp, f, up, S, X) {
    const g = ft.game;
    if (!up) {
      ft.vx = approach(ft.vx, 0, 0.6);
      if (!ft.grounded) { ft.noGrav = true; ft.vy = Math.max(ft.vy - 0.6, -3); }
      ft.anim.fuse = f < 44 ? f / 44 : 0;
      if (f % 10 === 0 && f < 44) g.sfx('fuse');
      if (f === 44) {
        g.explode(ft.x, ft.y + ft.h * 0.5, ft, { dmg: 21, kb: 10, g: 1.65, a: 60 }, 2.8 * ft.size, false);
        ft.pct = Math.min(999, ft.pct + 6); ft.vy = 9; ft.grounded = false; ft.plat = null;
      }
      if (f >= 64) ft.setState(ft.grounded ? 'idle' : 'air');
    } else {
      if (f < 6) { ft.vx *= 0.7; ft.noGrav = true; ft.vy = 0; }
      if (f === 6) { X.launchUp(21); g.explode(ft.x, ft.y, ft, { dmg: 8, kb: 6.5, g: 0.8, a: 75 }, 1.4, false, true); }
      if (f > 6) X.drift(0.75);
      if (f >= 34) ft.toHelpless();
    }
  },
  rattle(ft, inp, f, up, S, X) {
    const g = ft.game;
    if (!up) {
      if (f === 9) { g.spawnProjectile(ft, 'arrow'); g.sfx('throw'); }
      if (!ft.grounded) { X.drift(0.7); if (f < 12 && ft.vy < 0) ft.vy *= 0.85; }
      if (f >= 22) ft.setState(ft.grounded ? 'idle' : 'air');
    } else {
      if (f < 5) { ft.vx *= 0.7; ft.noGrav = true; ft.vy = 0; }
      if (f === 5) { X.launchUp(17); g.sfx('spin'); }
      if (f > 5 && f < 30) { X.drift(0.8); if (f % 6 === 0) ft.hitIds.clear(); X.H({ r: 1.1, dmg: 2, kb: 3.5, g: 0, a: 92, weak: 1 }, ft.x, ft.y + ft.h * 0.55, 0); }
      if (f === 30) ft.hitIds.clear();
      if (f >= 30 && f <= 33) X.H({ r: 1.25, dmg: 5, kb: 7, g: 1.2, a: 70 }, ft.x, ft.y + ft.h * 0.6, 0);
      if (f >= 40) ft.toHelpless();
    }
  },
  ironclad(ft, inp, f, up, S, X) {
    const g = ft.game;
    if (!up) {
      if (!ft.grounded) X.drift(0.5);
      if (f === 11) g.sfx('heavy');
      if (f >= 12 && f <= 17) X.H({ r: 1.2 * ft.size, dmg: 15, kb: 9, g: 1.45, a: 82 }, ft.x + ft.facing * (ft.w * 0.5 + 0.9 * ft.size), ft.y + ft.h * 0.4, ft.facing);
      if (f === 14) { g.fx.dust(ft.x + ft.facing * 1.2, ft.y, 10); g.shake(0.3); }
      if (f >= 42) ft.setState(ft.grounded ? 'idle' : 'air');
    } else {
      if (f < 8) { ft.vx *= 0.7; ft.noGrav = true; ft.vy *= 0.4; }
      if (f === 8) { X.launchUp(18.5); g.sfx('heavy'); g.fx.dust(ft.x, ft.y, 12); }
      if (f >= 8 && f <= 18) X.H({ r: 1.4, dmg: 11, kb: 7.5, g: 1.25, a: 80 }, ft.x, ft.y + ft.h * 0.6, 0);
      if (f > 8) X.drift(0.6);
      if (f >= 40) ft.toHelpless();
    }
  },
  bolt(ft, inp, f, up, S, X) {
    const g = ft.game;
    if (!up) {
      if (f === 1 && !S.startGround) { S.weak = ft.rushUsed; ft.rushUsed = true; }
      if (f < 18) { ft.vx = approach(ft.vx, 0, 1.2); if (!ft.grounded) { ft.noGrav = true; ft.vy = approach(ft.vy, 0, 2); } if (f % 6 === 0) { g.sfx('rev'); if (ft.grounded) g.fx.dust(ft.x - ft.facing * 0.4, ft.y, 3); } if (Math.abs(inp.x) > 0.4) ft.facing = Math.sign(inp.x); }
      if (f >= 18 && f < 42) {
        ft.vx = ft.facing * (S.weak ? 9 : 21);
        if (!ft.grounded && !S.weak) { ft.noGrav = true; ft.vy = 0; }
        if (f % 8 === 0) ft.hitIds.clear();
        X.H({ r: 0.85, dmg: 6, kb: 6.5, g: 0.95, a: 40 }, ft.x, ft.y + 0.6, ft.facing);
        if (f % 2 === 0) g.fx.trail(ft.x - ft.facing * 0.3, ft.y + 0.6, '#5aa8ff', 0.7);
      }
      if (f >= 42) ft.vx = approach(ft.vx, 0, 1.5);
      if (f >= 50) ft.setState(ft.grounded ? 'idle' : 'air');
    } else {
      if (f === 3) { X.launchUp(23, inp.x * 3); g.sfx('spring'); g.spring(ft.x, ft.y); }
      if (f >= 3 && f <= 10) X.H({ r: 0.8, dmg: 6, kb: 6, g: 0.7, a: 85 }, ft.x, ft.y + 0.2, 0);
      if (f > 3) X.drift(0.9);
      if (f >= 20) ft.setState(ft.grounded ? 'idle' : 'air');
    }
  },
  pipper(ft, inp, f, up, S, X) {
    const g = ft.game;
    if (!up) {
      if (f === 10) { g.spawnProjectile(ft, 'fireball'); g.sfx('fireball'); }
      if (!ft.grounded) { X.drift(0.7); if (f < 12 && ft.vy < 0) ft.vy *= 0.85; }
      if (f >= 26) ft.setState(ft.grounded ? 'idle' : 'air');
    } else {
      if (f < 4) { ft.vx *= 0.7; ft.noGrav = true; ft.vy = 0; }
      if (f === 4) { X.launchUp(19, inp.x * 2.5); }
      if (f >= 4 && f < 20) { if (f % 4 === 0) { ft.hitIds.clear(); g.sfx('coin'); g.fx.burst(ft.x + ft.facing * 0.4, ft.y + ft.h, 0.3, '#ffd23a', 3, 4, 0.5, 0.3, { grav: 1 }); } X.H({ r: 0.85, dmg: 2, kb: 3, g: 0, a: 90, weak: 1 }, ft.x + ft.facing * 0.4, ft.y + ft.h * 0.9, 0); X.drift(0.6); }
      if (f === 20) ft.hitIds.clear();
      if (f >= 20 && f <= 22) X.H({ r: 1.0, dmg: 5, kb: 7, g: 1.1, a: 75 }, ft.x + ft.facing * 0.4, ft.y + ft.h, ft.facing);
      if (f >= 36) ft.toHelpless();
    }
  },
  webline(ft, inp, f, up, S, X) {
    const g = ft.game;
    if (!up) {
      if (f === 8) { g.spawnProjectile(ft, 'web'); g.sfx('web'); }
      if (!ft.grounded) { X.drift(0.7); if (f < 12 && ft.vy < 0) ft.vy *= 0.85; }
      if (f >= 26) ft.setState(ft.grounded ? 'idle' : 'air');
    } else {
      if (f === 1) { S.dir = Math.abs(inp.x) > 0.3 ? Math.sign(inp.x) : ft.facing; ft.facing = S.dir; }
      if (f < 5) { ft.noGrav = true; ft.vy *= 0.5; ft.vx *= 0.7; }
      if (f === 5) { S.ax = ft.x + S.dir * 3.5; S.ay = ft.y + ft.h + 7; g.sfx('web'); ft.grounded = false; ft.plat = null; }
      if (f >= 5 && f < 28) {
        const k = (f - 5) / 23;
        ft.noGrav = true; ft.vx = S.dir * (6 + 6 * Math.sin(k * Math.PI)); ft.vy = 17 * (1 - k) + 2; ft.kbx = ft.kby = 0;
        g.webLine(ft, S.ax, S.ay);
        if (f >= 8 && f <= 20) X.H({ r: 0.9, dmg: 5, kb: 6, g: 0.9, a: 60 }, ft.x, ft.y + ft.h * 0.5, S.dir);
      }
      if (f >= 28) ft.setState(ft.grounded ? 'idle' : 'air');
    }
  },
};
export const SPECIAL_POSES = {
  fizz(P, f, up) { P.crouch = up ? (f < 6 ? 0.6 : 0) : 0.3 + Math.sin(f * 0.8) * 0.1; P.hd = -0.2; },
  rattle(P, f, up) { if (!up) { P.aRx = -1.5; P.aLx = -1.4; P.aLz = -0.5; P.hy = -0.3; } else { P.aRz = -1.5; P.aLz = 1.5; } },
  ironclad(P, f, up) { if (!up) { const k = Math.min(1, f / 14); P.aRx = 0.3 - k * 3.2; P.aLx = 0.3 - k * 3.2; P.hx = 0.5 - k * 0.8; P.crouch = 0.5 * (1 - k); } else { P.aRx = -3.1; P.aLx = -3.1; P.crouch = f < 8 ? 0.6 : 0; } },
  bolt(P, f, up) { if (!up) { P.crouch = 1; P.hx = 1.2; P.aRx = -1.2; P.aLx = -1.2; P.lLx = -1.4; P.lRx = -1.4; } else { P.aRz = -1.6; P.aLz = 1.6; P.lLx = 0.2; P.lRx = -0.2; P.hd = -0.3; } },
  pipper(P, f, up) { if (!up) { P.aRx = f < 10 ? -0.8 : -1.6; P.hy = -0.4; P.hx = 0.2; } else { P.aRx = -3.2; P.aLx = 0.3; P.lLx = -0.8; P.hd = -0.4; } },
  webline(P, f, up) { if (!up) { P.aRx = -1.6; P.aLx = -0.4; P.hy = -0.3; } else { P.aRx = -3.0; P.aLx = -0.4; P.lLx = -0.7; P.lRx = 0.5; P.hx = -0.2; } },
};
export const VICTORY_POSES = {
  cheer(P, t) { const j = Math.abs(Math.sin(t * 5)); P.aRx = -3.0; P.aLx = -3.0; P.aRz = -0.3; P.aLz = 0.3; P.crouch = (1 - j) * 0.4; P.hd = -0.3; },
  dance(P, t) { const s = Math.sin(t * 6); P.hy = s * 0.5; P.aRx = -1.5 + s * 1.2; P.aLx = -1.5 - s * 1.2; P.lLx = s * 0.4; P.lRx = -s * 0.4; P.hd = s * 0.2; },
  flex(P, t) { P.aRz = -1.5; P.aLz = 1.5; P.aRx = -0.4 + Math.sin(t * 4) * 0.1; P.aLx = -0.4; P.crouch = 0.25; P.hx = 0.1; },
  wave(P, t) { P.aRx = -2.9; P.aRz = -0.5 + Math.sin(t * 8) * 0.5; P.aLz = 0.2; P.hd = -0.1; },
  spin(P, t) { P.spinY = (t * 4) % (Math.PI * 2); P.aRz = -1.3; P.aLz = 1.3; },
};

// ================================================================ v3: Venomaw + Gammoth
const tipHit = (ft, g, tx, ty, r = 0.55) => {
  for (const t of g.fighters) {
    if (t === ft || t.state === 'dead' || t.state === 'respawn' || t.invuln > 0 || ft.hitIds.has(t)) continue;
    const cx = Math.max(t.x - t.w / 2, Math.min(tx, t.x + t.w / 2)), cy = Math.max(t.y, Math.min(ty, t.y + t.h));
    if ((tx - cx) ** 2 + (ty - cy) ** 2 < r * r) return t;
  }
  return null;
};
function gammaWave(ft, g, big) {
  ft.hitIds.clear();
  g.hitCheck(ft, { r: big ? 3.3 : 2.6, dmg: big ? 15 : 10, kb: big ? 8.5 : 8, g: big ? 1.5 : 1.35, a: 68, radial: 1 }, ft.x, ft.y + 0.6, 0);
  // rolling ground wave: pops up anyone standing further out
  for (const t of g.fighters) {
    if (t === ft || t.state === 'dead' || !t.grounded || ft.hitIds.has(t)) continue;
    if (Math.abs(t.x - ft.x) < (big ? 6.5 : 5) && Math.abs(t.y - ft.y) < 1) { ft.hitIds.add(t); const res = t.takeHit(ft, { dmg: 5, kb: 7.5, g: 0.3, a: 82, weak: 1 }, Math.sign(t.x - ft.x) || 1, t.x, t.y); if (res && res !== 'shield') g.onHitFx(ft, res, t.x, t.y + 0.4); }
  }
  g.sfx('boom'); g.shake(big ? 1.0 : 0.7);
  g.fx.ring(ft.x, ft.y + 0.1, 0, big ? 7 : 5.5, 0.5, '#7dff4a', true); g.fx.ring(ft.x, ft.y + 0.5, 0.4, 3.4, 0.35, '#d8ff8a');
  g.fx.dust(ft.x, ft.y, big ? 26 : 18, '#a8c890', 3);
  for (let i = -6; i <= 6; i++) g.fx.burst(ft.x + i * 0.55, ft.y + 0.1, 0, i % 2 ? '#7dff4a' : '#5a4a3a', 3, 5, 0.6, 0.35, { up: 6, grav: 1.4 });
  g.fx.flash(ft.x, ft.y + 0.5, 0.6, 4, 0.25, '#9aff5a');
}
Object.assign(SPECIALS, {
  venomaw(ft, inp, f, up, S, X) {
    const g = ft.game, spec = ft.spec;
    if (spec === 'n') {
      // TENDRIL SNARE: shoot a tendril, reel the victim in, then bite
      if (!ft.grounded) { X.drift(0.45); if (ft.vy < 0) ft.vy *= 0.88; }
      if (f === 5) g.sfx('tendril');
      const hy = ft.y + ft.h * 0.6;
      if (!S.caught) {
        const reach = f < 6 ? 0 : f < 18 ? (f - 6) / 12 * 6.4 : Math.max(0, 6.4 - (f - 18) * 0.7);
        const tx = ft.x + ft.facing * (ft.w * 0.5 + 0.2 + reach);
        if (reach > 0.05) g.tendril(ft, tx, hy);
        if (f >= 6 && f <= 18) {
          const t = tipHit(ft, g, tx, hy);
          if (t) {
            ft.hitIds.add(t);
            const res = t.takeHit(ft, { dmg: 4, kb: 1, g: 0, a: 0, weak: 1 }, -ft.facing, tx, hy);
            if (res && res !== 'shield') { S.caught = t; S.cf = f; g.onHitFx(ft, res, tx, hy); g.sfx('tendril'); }
            else S.blocked = true;
          }
        }
        if (f >= 30) ft.setState(ft.grounded ? 'idle' : 'air');
      } else {
        const t = S.caught, k = f - S.cf;
        if (t.state === 'dead') { ft.setState(ft.grounded ? 'idle' : 'air'); return; }
        if (k < 14) {
          const gx = ft.x + ft.facing * (ft.w * 0.5 + t.w * 0.5 + 0.15);
          t.x += (gx - t.x) * 0.28; t.y += ((ft.grounded ? ft.y : ft.y) - t.y) * 0.2;
          t.vx = t.vy = t.kbx = t.kby = 0; t.hitstun = Math.max(t.hitstun, t.stateT + 6); t.noGrav = true;
          g.tendril(ft, t.x, t.y + t.h * 0.5);
        }
        if (k === 14) { ft.hitIds.clear(); g.sfx('chomp'); }
        if (k >= 14 && k <= 17) X.H({ r: 1.05 * ft.size, dmg: 11, kb: 8.5, g: 1.4, a: 42 }, ft.x + ft.facing * (ft.w * 0.5 + 0.5), ft.y + ft.h * 0.55, ft.facing);
        if (k === 15) g.fx.burst(ft.x + ft.facing * 0.9, ft.y + ft.h * 0.6, 0.3, '#ffffff', 14, 7, 0.4, 0.3);
        if (k >= 34) ft.setState(ft.grounded ? 'idle' : 'air');
      }
    } else if (spec === 'down') {
      // SYMBIOTE LUNGE: crouch, then pounce forward jaws-first
      if (f === 1) { S.weak = !S.startGround && ft.rushUsed; if (!S.startGround) ft.rushUsed = true; if (Math.abs(inp.x) > 0.3) ft.facing = Math.sign(inp.x); }
      if (f < 9) { ft.vx *= 0.6; if (!ft.grounded) { ft.noGrav = true; ft.vy *= 0.6; } }
      if (f === 9) { ft.vx = ft.facing * (S.weak ? 8 : 17); ft.vy = S.startGround ? 7.5 : 4; ft.grounded = false; ft.plat = null; ft.kbx = ft.kby = 0; g.sfx('rush'); g.fx.dust(ft.x, ft.y, 8); }
      if (f >= 9 && f <= 24) {
        X.H({ r: 0.95 * ft.size, dmg: 13, kb: 8.5, g: 1.4, a: 38 }, ft.x + ft.facing * (ft.w * 0.5 + 0.35), ft.y + ft.h * 0.55, ft.facing);
        if (f % 2 === 0) g.fx.trail(ft.x - ft.facing * 0.3, ft.y + ft.h * 0.55, '#3a3f70', 0.9);
        if (f === 12) g.sfx('chomp');
      }
      if (f > 24) { ft.vx *= 0.9; if (!ft.grounded) X.drift(0.5); }
      if (f >= 38) ft.setState(ft.grounded ? 'idle' : 'air');
    } else {
      // SYMBIOTE SWING: lash a tendril high above and swing up
      if (f === 1) { S.dir = Math.abs(inp.x) > 0.3 ? Math.sign(inp.x) : ft.facing; ft.facing = S.dir; }
      if (f < 5) { ft.noGrav = true; ft.vy *= 0.5; ft.vx *= 0.7; }
      if (f === 5) { S.ax = ft.x + S.dir * 3.2; S.ay = ft.y + ft.h + 7.5; g.sfx('tendril'); ft.grounded = false; ft.plat = null; }
      if (f >= 5 && f < 30) {
        const k = (f - 5) / 25;
        ft.noGrav = true; ft.vx = S.dir * (5 + 6 * Math.sin(k * Math.PI)); ft.vy = 18 * (1 - k) + 2; ft.kbx = ft.kby = 0;
        g.tendril(ft, S.ax, S.ay);
        if (f % 8 === 0) ft.hitIds.clear();
        if (f >= 8 && f <= 24) X.H({ r: 1.0, dmg: 5, kb: 6.5, g: 0.9, a: 65 }, ft.x, ft.y + ft.h * 0.5, S.dir);
      }
      if (f >= 30) ft.toHelpless();
    }
  },
  gammoth(ft, inp, f, up, S, X) {
    const g = ft.game, spec = ft.spec;
    if (spec === 'n') {
      // THUNDER CLAP: armored wind-up, then a clap that blasts a shockwave forward
      if (f <= 14) ft.armor = true;
      if (!ft.grounded) { X.drift(0.4); if (ft.vy < 0) ft.vy *= 0.85; }
      if (f === 4) g.sfx('roar');
      if (f === 14) {
        g.sfx('clap'); g.shake(0.6);
        const cx = ft.x + ft.facing * (ft.w * 0.5 + 0.8), cy = ft.y + ft.h * 0.62;
        g.fx.flash(cx, cy, 0.5, 3.5, 0.2, '#ffffff'); g.fx.ring(cx, cy, 0.3, 3.2, 0.3, '#d8ff8a');
        for (let i = 0; i < 3; i++) g.fx.ring(cx + ft.facing * (1 + i * 1.1), cy, 0.2, 1.2 + i * 0.6, 0.35 + i * 0.05, '#9aff5a');
        g.fx.burst(cx, cy, 0.3, '#eaffc0', 26, 11, 0.5, 0.35);
      }
      if (f >= 14 && f <= 17) X.H({ r: 1.3 * ft.size, dmg: 15, kb: 9.5, g: 1.5, a: 35 }, ft.x + ft.facing * (ft.w * 0.5 + 0.8), ft.y + ft.h * 0.6, ft.facing);
      if (f >= 15 && f <= 20) X.H({ r: 1.5, dmg: 4, kb: 9, g: 0.35, a: 22, weak: 1 }, ft.x + ft.facing * (ft.w * 0.5 + 3.0), ft.y + ft.h * 0.5, ft.facing);
      if (f >= 42) ft.setState(ft.grounded ? 'idle' : 'air');
    } else if (spec === 'down') {
      // GAMMA POUND: hop and slam the ground; shockwave on landing (SPECIAL_LAND)
      if (!S.phase) S.phase = S.startGround ? 'wind' : 'hover';
      if (f <= 10) ft.armor = true;
      if (S.phase === 'wind') { ft.vx *= 0.7; if (f >= 8) { X.launchUp(10, ft.facing * 1.5); S.phase = 'rise'; g.sfx('heavy'); g.fx.dust(ft.x, ft.y, 10, '#a8c890', 1.5); } }
      else if (S.phase === 'hover') { ft.noGrav = true; ft.vy = approach(ft.vy, 0, 2.5); ft.vx *= 0.9; if (f >= 8) S.phase = 'plunge'; }
      else if (S.phase === 'rise') { X.drift(0.35); if (ft.vy <= 2 || f > 30) S.phase = 'plunge'; }
      if (S.phase === 'plunge') {
        ft.vy = -30; ft.vx *= 0.9; ft.noGrav = true;
        if (f % 2 === 0) g.fx.trail(ft.x, ft.y + ft.h * 0.4, '#7dff4a', 1.1);
        X.H({ r: 1.25, dmg: 11, kb: 6, g: 1.0, a: -70 }, ft.x, ft.y + 0.3, ft.facing);
        if (f > 160) ft.toHelpless();
      }
    } else {
      // LEAP SMASH: armored crouch, huge leap, then a crashing landing
      if (f < 8) { ft.vx *= 0.7; ft.armor = true; if (!ft.grounded) { ft.noGrav = true; ft.vy *= 0.4; } }
      if (f === 8) { X.launchUp(23, inp.x * 7 + (Math.abs(inp.x) < 0.2 ? ft.facing * 2 : 0)); g.sfx('heavy'); g.fx.dust(ft.x, ft.y, 16, '#a8c890', 2); g.fx.ring(ft.x, ft.y + 0.1, 0, 3, 0.35, '#9aff5a', true); S.phase = 'leap'; }
      if (f >= 8 && f <= 18) X.H({ r: 1.4, dmg: 7, kb: 7, g: 1.0, a: 82 }, ft.x, ft.y + ft.h * 0.7, 0);
      if (f > 8) X.drift(0.7);
      if (S.phase === 'leap' && f > 18 && ft.vy < 0) { S.phase = 'fall'; ft.hitIds.clear(); }
      if (S.phase === 'fall') {
        ft.vy = Math.max(ft.vy - 0.8, -26); ft.noGrav = false;
        X.H({ r: 1.2, dmg: 9, kb: 6.5, g: 1.0, a: -65 }, ft.x, ft.y + 0.3, ft.facing);
        if (f % 3 === 0) g.fx.trail(ft.x, ft.y + ft.h * 0.5, '#7dff4a', 1);
        if (ft.tryLedge && ft.tryLedge()) return;
        if (f > 200) ft.toHelpless();
      }
    }
  },
});
// landing hooks for specials that end on touchdown. return true if handled.
export const SPECIAL_LAND = {
  gammoth(ft, g) {
    const S = ft.specData;
    if (ft.spec === 'down' && S.phase === 'plunge') { gammaWave(ft, g, true); ft.lag = 22; ft.setState('landing'); return true; }
    if (ft.spec === 'up' && (S.phase === 'fall' || (S.phase === 'leap' && ft.stateT > 12))) { gammaWave(ft, g, false); ft.lag = 18; ft.setState('landing'); return true; }
    return false;
  },
};
// per-fighter tweaks to the shared moveset
export const MOVE_MODS = {
  venomaw(m, s, h, w) {
    // WILD SLASHES: a fast claw flurry that ends in a launcher
    m.jab = { t: 26, rehit: 5, hb: [{ f0: 3, f1: 18, x: w + 0.5 * s, y: 0.55 * h, r: 0.62 * s, dmg: 2, kb: 2.2, g: 0.1, a: 35, weak: 1 }, { f0: 20, f1: 20, x: w + 0.55 * s, y: 0.55 * h, r: 0.75 * s, dmg: 5, kb: 6.5, g: 0.9, a: 40 }], anim: 'nair', sfx: 'swing' };
    // TENDRIL WHIP: long-range lash
    m.ftilt = { t: 34, hb: [{ f0: 10, f1: 13, x: w + 1.65 * s, y: 0.55 * h, r: 0.62 * s, dmg: 12, kb: 7.5, g: 1.65, a: 36 }, { f0: 10, f1: 13, x: w + 0.7 * s, y: 0.55 * h, r: 0.55 * s, dmg: 8, kb: 6, g: 1.1, a: 40 }], anim: 'fsmash', sfx: 'heavy', lunge: 2, strong: true,
      onFrame(ft, f, g) { if (f >= 8 && f <= 16 && g.tendril) { const k = f <= 12 ? (f - 7) / 5 : (17 - f) / 5; g.tendril(ft, ft.x + ft.facing * (ft.w * 0.5 + 0.3 + k * 1.9 * s * ft.size), ft.y + ft.h * 0.55); } } };
    m.dtilt = { t: 26, hb: [{ f0: 7, f1: 10, x: w + 1.35 * s, y: 0.3, r: 0.6 * s, dmg: 8, kb: 6, g: 1.0, a: 28 }], anim: 'dtilt', sfx: 'swing',
      onFrame(ft, f, g) { if (f >= 5 && f <= 12 && g.tendril) g.tendril(ft, ft.x + ft.facing * (ft.w * 0.5 + 1.6 * s * ft.size), ft.y + 0.3); } };
    m.fair = { t: 32, air: 1, hb: [{ f0: 9, f1: 13, x: w + 1.3 * s, y: 0.5 * h, r: 0.7 * s, dmg: 11, kb: 6.5, g: 1.5, a: 40 }], anim: 'fair', sfx: 'heavy', land: 8,
      onFrame(ft, f, g) { if (f >= 8 && f <= 14 && g.tendril) g.tendril(ft, ft.x + ft.facing * (ft.w * 0.5 + 1.6 * s * ft.size), ft.y + ft.h * 0.5); } };
    m.nair = { t: 30, air: 1, rehit: 6, hb: [{ f0: 4, f1: 17, x: 0, y: 0.5 * h, r: w + 0.65 * s, dmg: 3, kb: 3, g: 0.2, a: 50, radial: 1, weak: 1 }, { f0: 18, f1: 19, x: 0, y: 0.5 * h, r: w + 0.75 * s, dmg: 5, kb: 6, g: 1.0, a: 45, radial: 1 }], anim: 'nair', sfx: 'swing', land: 6 };
  },
  gammoth(m, s, h, w) {
    // GAMMA HAYMAKER: armored, slow, devastating
    m.ftilt = { t: 40, armor: [1, 13], hb: [{ f0: 13, f1: 17, x: w + 0.8 * s, y: 0.55 * h, r: 0.95 * s, dmg: 17, kb: 8, g: 1.85, a: 38 }], anim: 'fsmash', sfx: 'heavy', lunge: 3, strong: true };
    // TWIN-FIST UPPERCUT
    m.utilt = { t: 34, armor: [1, 9], hb: [{ f0: 9, f1: 15, x: 0.3 * s, y: h + 0.1 * s, r: 1.0 * s, dmg: 13, kb: 7.5, g: 1.6, a: 86 }], anim: 'usmash', sfx: 'heavy', strong: true };
    m.jab = { t: 20, hb: [{ f0: 5, f1: 7, x: w + 0.5 * s, y: 0.55 * h, r: 0.7 * s, dmg: 6, kb: 5.5, g: 0.6, a: 40 }], anim: 'jab', sfx: 'heavy' };
    m.dair = { t: 40, air: 1, hb: [{ f0: 13, f1: 19, x: 0.1, y: -0.05, r: 0.95 * s + w * 0.4, dmg: 15, kb: 6.5, g: 1.35, a: -80 }], anim: 'dair', sfx: 'heavy', land: 14 };
  },
};
Object.assign(SPECIAL_POSES, {
  venomaw(P, f, up, S, spec) {
    if (spec === 'down') { if (f < 9) { P.crouch = 0.8; P.hx = 0.6; P.aRx = 0.4; P.aLx = 0.4; } else { P.hx = 1.0; P.aRx = -1.7; P.aLx = -1.7; P.aRz = -0.3; P.aLz = 0.3; P.lLx = -1.0; P.lRx = 0.8; } }
    else if (!up) { P.aRx = -1.6; P.aLx = -0.3; P.hy = -0.3; P.hx = S && S.caught ? 0.4 : 0.15; P.crouch = 0.2; }
    else { P.aRx = -3.0; P.aLx = -0.5; P.lLx = -0.7; P.lRx = 0.5; P.hx = -0.2; }
  },
  gammoth(P, f, up, S, spec) {
    if (spec === 'down') { if (S && S.phase === 'plunge') { P.aRx = -0.5; P.aLx = -0.5; P.hx = 0.5; P.lLx = -0.5; P.lRx = -0.5; } else { P.aRx = -3.1; P.aLx = -3.1; P.hx = -0.3; P.crouch = f < 8 ? 0.6 : 0; } }
    else if (!up) { if (f < 14) { const k = Math.min(1, f / 10); P.aRz = -1.4 * k; P.aLz = 1.4 * k; P.aRx = -1.3 * k; P.aLx = -1.3 * k; P.hx = -0.2 * k; P.crouch = 0.3 * k; P.hd = -0.3 * k; } else { P.aRx = -1.55; P.aLx = -1.55; P.aRz = 0.2; P.aLz = -0.2; P.hx = 0.35; P.crouch = 0.25; } }
    else { if (f < 8) { P.crouch = 0.8; P.aRx = 0.5; P.aLx = 0.5; } else if (S && S.phase === 'fall') { P.aRx = -3.0; P.aLx = -3.0; P.hx = 0.3; P.lLx = -0.6; P.lRx = -0.6; } else { P.aRx = -3.1; P.aLx = -3.1; P.lLx = 0.4; P.lRx = -0.3; P.hd = -0.4; } }
  },
});
// signature victory animations used when the player has the default pose equipped
export const SIGNATURE_VICTORY = {
  venomaw(P, t) { P.crouch = 0.35; P.hx = 0.35 + Math.sin(t * 3) * 0.08; P.aRz = -0.9; P.aLz = 0.9; P.aRx = -0.7 + Math.sin(t * 5) * 0.25; P.aLx = -0.7 - Math.sin(t * 5) * 0.25; P.hy = Math.sin(t * 1.7) * 0.35; },
  gammoth(P, t) { const s = Math.sin(t * 7); P.aRx = -1.4 + s * 0.5; P.aLx = -1.4 - s * 0.5; P.aRz = -0.2; P.aLz = 0.2; P.hd = -0.5; P.crouch = 0.2 + Math.abs(s) * 0.1; },
};
