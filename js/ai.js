// Block Brawl - CPU opponents
import { canUseRosterSpecial } from './roster-moves.js';
import { shellAI } from './shell-kings.js';

const LEVELS = {
  easy: { react: 22, aggr: 0.35, shield: 0.05, special: 0.15, recover: 0.75, mistake: 0.25, strong: 0.25 },
  normal: { react: 12, aggr: 0.6, shield: 0.22, special: 0.22, recover: 0.95, mistake: 0.1, strong: 0.45 },
  hard: { react: 5, aggr: 0.85, shield: 0.45, special: 0.25, recover: 1.0, mistake: 0.02, strong: 0.6 },
};
const EMPTY = () => ({ x: 0, y: 0, attackP: false, specialP: false, jumpP: false, jumpH: false, shieldH: false, shieldP: false, xTap: false, downTap: false });

export class AI {
  constructor(f, level) {
    this.f = f; this.L = LEVELS[level] || LEVELS.normal;
    this.cool = 0; this.hold = null; this.holdT = 0; this.target = null; this.retarget = 0; this.ledgeWait = 0; this.jumpHeld = 0; this.wander = 0; this.wanderDir = 1;
  }
  think(game) {
    const f = this.f, L = this.L, inp = EMPTY(), m = game.stage.main;
    if (f.state === 'dead') return inp;
    if (this.jumpHeld > 0) { this.jumpHeld--; inp.jumpH = true; }
    if (this.holdT > 0) { this.holdT--; Object.assign(inp, this.hold); return inp; }
    // choose target
    if (--this.retarget <= 0 || !this.target || this.target.state === 'dead') {
      let best = null, bd = 1e9;
      for (const o of game.fighters) { if (o === f || o.state === 'dead') continue; const d = Math.abs(o.x - f.x) + Math.abs(o.y - f.y) * 0.7 + (o.cpu ? 2 : 0); if (d < bd) { bd = d; best = o; } }
      this.target = best; this.retarget = 60 + Math.random() * 90;
    }
    const t = this.target;
    if (f.state === 'respawn') { if (f.stateT > 30 + Math.random() * 60) inp.y = -1; return inp; }
    // ledge
    if (f.state === 'ledge') {
      if (this.ledgeWait <= 0) this.ledgeWait = 10 + Math.random() * L.react * 2;
      if (--this.ledgeWait <= 0) { const r = Math.random(); if (r < 0.5) inp.y = 1; else if (r < 0.8) { inp.jumpP = true; inp.jumpH = true; this.jumpHeld = 8; } else inp.attackP = true; }
      return inp;
    }
    const edge = m.x1;
    const offstage = !f.grounded && (Math.abs(f.x) > edge - 0.2 || f.y < m.top - 0.3);
    // recovery
    if (offstage && ['air', 'helpless', 'airdodge'].includes(f.state) || (f.state === 'hitstun' && f.stateT > f.hitstun - 2 && Math.abs(f.x) > edge)) {
      const dir = f.x > 0 ? -1 : 1;
      inp.x = dir;
      if (f.state === 'helpless') return inp;
      const dx = Math.abs(f.x) - edge, below = m.top - f.y;
      if (Math.random() > L.recover) return inp;
      if (f.jumps > 0 && f.vy < 2 && (below > -1.5 || dx > 4)) { inp.jumpP = true; inp.jumpH = true; this.jumpHeld = 10; return inp; }
      if (f.jumps === 0 && !f.upUsed && f.vy < 0 && (below > 0.3 || dx > 5)) {
        if (f.c.id === 'voidwalker') { const d = Math.hypot(dx + 1, below + 1); inp.x = dir * (dx + 1) / d; inp.y = Math.max(0.55, (below + 1) / d); }
        else if (f.c.id === 'bristle' && !f.rushUsed && dx > 3 && below < 2) { inp.x = dir; inp.y = 0; f.facing = dir; inp.specialP = true; return inp; }
        else inp.y = 1;
        inp.specialP = true; return inp;
      }
      return inp;
    }
    if (!t) { return inp; }
    if (f.state === 'grab' && f.grabbed) { if (f.stateT > 12 + Math.random() * 20) { const out = Math.sign(f.x) || f.facing; if (f.grabbed.pct > 90 && Math.random() < 0.5) inp.y = 1; else inp.x = Math.random() < 0.7 ? out : -out; } return inp; }
    if (f.state === 'grabbed') { if (Math.random() < 0.25 * (L.aggr + 0.2)) inp.attackP = true; return inp; }
    if (f.held && t && Math.abs(t.x - f.x) < 9 && Math.abs(t.y - f.y) < 3 && Math.random() < 0.08) { f.facing = Math.sign(t.x - f.x) || f.facing; inp.x = f.facing; inp.attackP = true; return inp; }
    if (this.itemTarget && !f.held && ['idle', 'run', 'air', 'landing'].includes(f.state)) {
      const it = this.itemTarget;
      if (!it.alive) this.itemTarget = null;
      else { const d = it.x - f.x; inp.x = Math.abs(d) > 0.3 ? Math.sign(d) : 0; if (it.y > f.y + 1.5 && f.grounded && Math.random() < 0.1) { inp.jumpP = true; inp.jumpH = true; this.jumpHeld = 12; } if (Math.abs(f.x) > m.x1 - 0.8 && Math.sign(inp.x) === Math.sign(f.x)) inp.x = 0; return inp; }
    }
    if (!['idle', 'run', 'crouch', 'air', 'shield', 'landing'].includes(f.state)) { if (f.state === 'attack' && !f.grounded) inp.x = Math.sign(t.x - f.x) * 0.5; return inp; }
    const dx = t.x - f.x, dy = (t.y + t.h * 0.4) - (f.y + f.h * 0.4), adx = Math.abs(dx), dir = Math.sign(dx) || 1;
    const reach = f.w * 0.5 + 0.9 * f.c.reach + t.w * 0.5;
    // defend
    if (f.grounded && adx < reach + 1.5 && (t.state === 'attack' || t.state === 'special') && t.stateT < 6 && Math.random() < L.shield * 0.5) {
      this.hold = { ...EMPTY(), shieldH: true }; this.holdT = 10 + Math.floor(Math.random() * 12); inp.shieldH = true; return inp;
    }
    if (f.state === 'shield') { if (Math.random() < 0.15) return inp; inp.shieldH = true; return inp; }
    if (this.cool > 0) this.cool--;
    // edge safety: don't walk off the stage
    const nearEdge = f.grounded && f.plat && f.plat.main && Math.abs(f.x) > edge - 1.2;
    const targetOff = t.state !== 'dead' && (Math.abs(t.x) > edge + 0.3 || t.y < -1);
    // Edge-guard: wait at edge, attack when target close
    if (targetOff) {
      const ex = Math.sign(t.x) * (edge - 1.0);
      if (Math.abs(ex - f.x) > 0.6) inp.x = Math.sign(ex - f.x);
      if (adx < reach + 1 && Math.abs(dy) < 2 && this.cool <= 0) { if (Math.random() < L.aggr) { inp.attackP = true; inp.x = dy < -0.8 ? 0 : dir; inp.y = dy < -0.8 ? -1 : 0; f.facing = dir; } this.cool = L.react; }
      return inp;
    }
    // attack decisions
    if (this.cool <= 0) {
      this.cool = L.react + Math.floor(Math.random() * L.react);
      const r = Math.random();
      if (r < L.mistake) { inp.jumpP = Math.random() < 0.5; inp.jumpH = true; return inp; }
      if (adx < reach && Math.abs(dy) < 1.4) {
        if (Math.random() < L.aggr) {
          f.facing = dir;
          if (Math.random() < L.strong || t.pct > 80) { inp.x = dir; } else if (Math.random() < 0.2) inp.y = -1;
          inp.attackP = true; return inp;
        }
      } else if (adx < reach + 0.5 && dy > 1.4 && dy < 5) {
        if (f.grounded) { if (dy < 2.6 && Math.random() < 0.5) { inp.y = 1; inp.attackP = true; } else { inp.jumpP = true; inp.jumpH = true; this.jumpHeld = 12; } }
        else { inp.y = 1; inp.attackP = true; }
        return inp;
      } else if (!f.grounded && adx < reach + 0.4 && dy < -1 && dy > -4) { inp.y = -1; inp.attackP = true; return inp; }
      else if (!f.grounded && adx < reach + 0.6 && Math.abs(dy) < 1.5) { inp.x = Math.sign(dx) === f.facing ? dir : dir; inp.attackP = true; return inp; }
      // specials at range
      if (Math.random() < L.special) {
        const id = f.c.id;
        if (canUseRosterSpecial(f, t, edge)) { f.facing = dir; inp.specialP = true; return inp; }
        if (shellAI(f, t, inp, adx, dy, dir, edge)) return inp;
        if ((id === 'blockjack' || id === 'gogo') && adx > 3 && adx < 11 && Math.abs(dy) < 2) { inp.x = dir * 0.5; inp.specialP = true; f.facing = dir; return inp; }
        if (id === 'bristle' && f.grounded && adx > 2 && adx < 8 && Math.abs(dy) < 1 && Math.abs(f.x + dir * 6) < edge + 1) { inp.x = dir * 0.5; inp.specialP = true; return inp; }
        if (id === 'voidwalker' && adx > 3 && adx < 7 && Math.abs(dy) < 1.5 && Math.abs(t.x) < edge - 0.5) { inp.x = dir; inp.specialP = true; return inp; }
        if (id === 'malgore' && f.grounded && adx < 3.2 && Math.abs(dy) < 1.5) { inp.specialP = true; return inp; }
        if ((id === 'rattle' || id === 'pipper' || id === 'webline') && adx > 3 && adx < 12 && Math.abs(dy) < 1.8) { f.facing = dir; inp.x = dir * 0.3; inp.specialP = true; return inp; }
        if (id === 'bolt' && f.grounded && adx > 3 && adx < 9 && Math.abs(dy) < 1 && Math.abs(f.x + dir * 7) < edge + 1) { f.facing = dir; inp.x = dir * 0.5; inp.specialP = true; return inp; }
        if (id === 'venomaw') {
          if (adx > 2.5 && adx < 7 && Math.abs(dy) < 1.4) { f.facing = dir; inp.x = dir * 0.3; inp.specialP = true; return inp; }
          if (f.grounded && adx > 1.6 && adx < 4.5 && Math.abs(dy) < 1 && Math.abs(f.x + dir * 4) < edge) { f.facing = dir; inp.y = -1; inp.specialP = true; return inp; }
        }
        if (id === 'gammoth') {
          if (adx < 3.6 && Math.abs(dy) < 1.5 && f.grounded) { f.facing = dir; if (Math.random() < 0.55) inp.x = dir * 0.3; else inp.y = -1; inp.specialP = true; return inp; }
          if (!f.grounded && adx < 1.6 && dy < -0.8) { inp.y = -1; inp.specialP = true; return inp; }
        }
        if ((id === 'fizz' || id === 'ironclad') && f.grounded && adx < (id === 'fizz' ? 2.4 : 2.8) && Math.abs(dy) < 1.5) { f.facing = dir; inp.specialP = true; return inp; }
      }
      if (adx < reach * 0.8 && Math.abs(dy) < 1 && f.grounded && (t.state === 'shield' || Math.random() < 0.08)) { f.facing = dir; inp.attackP = true; inp.shieldH = true; return inp;
      }
      // occasional jump toward
      if (dy > 1.5 && f.grounded && Math.random() < 0.5) { inp.jumpP = true; inp.jumpH = true; this.jumpHeld = 12; inp.x = dir; return inp; }
    }
    // movement
    if (adx > reach * 0.8) inp.x = dir;
    else if (adx < reach * 0.35) inp.x = -dir * 0.5;
    if (nearEdge && Math.sign(inp.x) === Math.sign(f.x)) inp.x = 0;
    if (!f.grounded) { if (dy < -1 && f.vy < 0 && Math.random() < 0.1) inp.y = -1; if (Math.abs(f.x) > edge - 1 && Math.sign(inp.x) === Math.sign(f.x)) inp.x = -Math.sign(f.x); }
    // drop through platforms toward target below
    if (f.grounded && f.plat && f.plat.soft && dy < -1.5 && Math.random() < 0.05) { inp.y = -1; inp.downTap = true; }
    return inp;
  }
}
