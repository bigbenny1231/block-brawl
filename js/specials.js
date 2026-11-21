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
