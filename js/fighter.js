// Block Brawl - fighter state machine, physics, moves, procedural animation
import * as THREE from 'three';
import { CHARS, buildChar, BASE_YAW } from './characters.js';
import { SPECIALS, SPECIAL_POSES, VICTORY_POSES } from './specials.js';

export const DT = 1 / 60;
export const PCOLORS = ['#ff3b4e', '#3b8bff', '#ffc93b', '#3bdc6e'];
const approach = (v, t, s) => (v < t ? Math.min(t, v + s) : Math.max(t, v - s));
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeOut = t => 1 - (1 - t) * (1 - t);
const easeOutBack = t => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const smooth = t => t * t * (3 - 2 * t);

function moveset(c) {
  const s = c.reach, h = c.h, w = c.w * 0.5;
  return {
    jab: { t: 15, hb: [{ f0: 3, f1: 5, x: w + 0.45 * s, y: 0.55 * h, r: 0.6 * s, dmg: 3.5, kb: 4.5, g: 0.35, a: 40 }], anim: 'jab', sfx: 'swing' },
    ftilt: { t: 32, hb: [{ f0: 9, f1: 13, x: w + 0.75 * s, y: 0.5 * h, r: 0.8 * s, dmg: 12, kb: 7, g: 1.8, a: 38 }], anim: 'fsmash', sfx: 'heavy', lunge: 4, strong: true },
    utilt: { t: 30, hb: [{ f0: 7, f1: 13, x: 0.25 * s, y: h + 0.15 * s, r: 0.85 * s, dmg: 10, kb: 7, g: 1.55, a: 88 }], anim: 'usmash', sfx: 'heavy', strong: true },
    dtilt: { t: 22, hb: [{ f0: 6, f1: 9, x: w + 0.6 * s, y: 0.3, r: 0.62 * s, dmg: 7, kb: 5.5, g: 0.95, a: 28 }], anim: 'dtilt', sfx: 'swing' },
    nair: { t: 30, air: 1, hb: [{ f0: 5, f1: 16, x: 0, y: 0.5 * h, r: w + 0.65 * s, dmg: 8, kb: 5.5, g: 1.0, a: 45, radial: 1 }], anim: 'nair', sfx: 'swing', land: 6 },
    fair: { t: 32, air: 1, hb: [{ f0: 9, f1: 13, x: w + 0.65 * s, y: 0.5 * h, r: 0.8 * s, dmg: 11, kb: 6, g: 1.55, a: 42 }], anim: 'fair', sfx: 'heavy', land: 8 },
    bair: { t: 28, air: 1, hb: [{ f0: 7, f1: 11, x: -(w + 0.6 * s), y: 0.5 * h, r: 0.78 * s, dmg: 12, kb: 7, g: 1.6, a: 140 }], anim: 'bair', sfx: 'heavy', land: 8 },
    uair: { t: 26, air: 1, hb: [{ f0: 6, f1: 11, x: 0.1, y: h + 0.1 * s, r: 0.85 * s, dmg: 9, kb: 6, g: 1.3, a: 85 }], anim: 'uair', sfx: 'swing', land: 6 },
    dair: { t: 36, air: 1, hb: [{ f0: 12, f1: 17, x: 0.1, y: -0.05, r: 0.8 * s + w * 0.4, dmg: 12, kb: 6, g: 1.3, a: -80 }], anim: 'dair', sfx: 'heavy', land: 12 },
  };
}

const N0 = { aRx: 0, aRz: 0, aLx: 0, aLz: 0, hx: 0, hy: 0, lLx: 0, lRx: 0, crouch: 0, spinY: 0, hd: 0 };
const ANIMS = {
  jab: [{ aRx: 0.4, hy: 0.35 }, { aRx: -1.65, hy: -0.45, hx: 0.15, aLx: 0.3 }],
  fsmash: [{ aRx: -3.0, aLx: 0.6, hx: -0.28, hy: 0.55, lLx: 0.2 }, { aRx: -0.45, aLx: -0.7, hx: 0.5, hy: -0.45, lLx: -0.6, lRx: 0.55 }],
  usmash: [{ aRx: 0.5, aLx: 0.5, crouch: 0.45 }, { aRx: -3.15, aLx: -2.7, hx: -0.25, hd: -0.4 }],
  dtilt: [{ crouch: 0.6, aRx: 0.3, hx: 0.3 }, { crouch: 0.6, aRx: -1.35, hx: 0.55, aRz: -0.3, lRx: 0.6 }],
  nair: [{ aRz: -1.3, aLz: 1.3, lLx: -0.9, lRx: 0.9 }, { aRz: -1.3, aLz: 1.3, lLx: -0.9, lRx: 0.9, spinY: Math.PI * 2 }],
  fair: [{ aRx: -2.9, hx: -0.25, lLx: -0.3 }, { aRx: -0.2, hx: 0.55, lLx: -0.6, lRx: 0.4 }],
  bair: [{ aRx: -1.2, hy: -0.7 }, { aRx: 1.0, hy: 1.1, hx: -0.35, lRx: 1.1 }],
  uair: [{ aRx: -0.5, aLx: -0.5, lLx: 0.3 }, { aRx: -3.3, aLx: -3.0, hx: -0.4, hd: -0.5 }],
  dair: [{ aRx: -2.9, aLx: -2.9, hx: -0.35, lLx: -0.6, lRx: -0.6 }, { aRx: -0.2, aLx: -0.2, hx: 0.65, lLx: 0.2, lRx: 0.2 }],
  throw: [{ aRx: -3.0, hx: -0.3, hy: 0.4 }, { aRx: -0.6, hx: 0.4, hy: -0.4, lLx: -0.5 }],
  blast: [{ aRx: -1.4, hx: -0.05 }, { aRx: -1.55, hx: -0.25, hd: -0.1 }],
};

export class Fighter {
  constructor(game, slot, charId, cpu, level, cos = {}) {
    this.game = game; this.slot = slot; this.cpu = cpu; this.level = level; this.cos = cos;
    this.c = CHARS[charId]; this.id = charId;
    this.moves = moveset(this.c);
    this.baseSize = cos.size || 1; this.size = this.baseSize;
    this.buffs = { power: 0, speed: 0, giant: 0, star: 0, hammer: 0, barrier: 0 }; this.held = null;
    this.rig = buildChar(charId, cos);
    this.color = PCOLORS[slot];
    this.stocks = 3; this.kos = 0; this.falls = 0; this.dealt = 0;
    this.pose = { ...N0 };
    this.anim = { run: 0, t: Math.random() * 10, flip: 0, squash: 1, faceVis: 1, spinZ: 0, tint: 0, alpha: 1, hurtShake: 0 };
    this.hitIds = new Set();
    // shield bubble
    const sh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
      uniforms: { col: { value: new THREE.Color(this.color).multiplyScalar(1.6) }, k: { value: 1 } },
      vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform vec3 col; uniform float k; varying vec3 vN; varying vec3 vV; void main(){ float f = 1.0-abs(dot(vN,vV)); f = pow(f,2.2); gl_FragColor = vec4(col*(0.18+f*1.4)*k, 1.0); }`,
    }));
    sh.visible = false; this.shieldMesh = sh; this.rig.root.add(sh); sh.position.y = this.c.h * 0.5;
    // respawn halo
    const halo = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.7, 0.12, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(this.color).multiplyScalar(2), toneMapped: false, transparent: true, opacity: 0.9 }));
    halo.visible = false; this.halo = halo; this.rig.root.add(halo); halo.position.y = -0.08;
    this.reset(0, 0, 1);
  }
  get h() { return this.c.h * this.size; }
  get w() { return this.c.w * this.size; }
  get weight() { return this.c.weight * this.size * (this.buffs.giant ? 1.25 : 1) * (this.boss ? 1.6 : 1); }
  get spd() { return this.buffs.speed ? 1.45 : 1; }
  get powerMul() { return (this.buffs.power ? 1.5 : 1) * (this.buffs.giant ? 1.3 : 1) * (this.boss ? 1.25 : 1); }
  get dead() { return this.state === 'dead'; }
  get out() { return this.stocks <= 0 && this.state === 'dead'; }
  reset(x, y, facing) {
    Object.assign(this, { x, y, vx: 0, vy: 0, kbx: 0, kby: 0, facing, grounded: false, plat: null, jumps: this.c.jumps, pct: 0,
      state: 'air', stateT: 0, move: null, moveKey: null, invuln: 0, shieldHP: 100, hitstun: 0, launched: false, fastFall: false,
      dropT: 0, ledgeCD: 0, upUsed: false, airDodged: false, rushUsed: false, blinkUsed: false, lag: 0, spec: null, specData: {},
      lastHitter: null, lastHitT: 0, hitFlash: 0, noGrav: false, respawnT: 0, victory: false, ledgeSide: 0, shieldStun: 0, helplessT: 0, held: null, combo: 0, comboT: 0 });
    if (this.buffs) for (const k in this.buffs) this.buffs[k] = 0;
    this.size = this.baseSize || 1;
    this.rig.root.visible = true;
  }
  setState(s) { this.state = s; this.stateT = 0; }

  // ------------------------------------------------------------ update
  update(inp) {
    const g = this.game, c = this.c;
    this.anim.t += DT;
    if (this.hitFlash > 0) this.hitFlash--;
    if (this.state === 'dead') {
      if (this.stocks > 0 && --this.respawnT <= 0) this.respawn();
      return;
    }
    if (this.invuln > 0) this.invuln--;
    if (this.ledgeCD > 0) this.ledgeCD--;
    if (this.dropT > 0) this.dropT--;
    if (this.shieldStun > 0) this.shieldStun--;
    this.stateT++;
    this.noGrav = false;
    this.tickBuffs();
    if (this.state !== 'shield') this.shieldHP = Math.min(100, this.shieldHP + 0.14);
    const f = this.stateT;

    switch (this.state) {
      case 'respawn':
        this.vx = this.vy = 0; this.x = this.spawnX; this.y = this.spawnY; this.noGrav = true; this.invuln = Math.max(this.invuln, 100);
        if (f > 150 || (f > 20 && (Math.abs(inp.x) > 0.5 || inp.jumpP || inp.attackP || inp.y < -0.5))) { this.setState('air'); this.halo.visible = false; this.invuln = 100; }
        break;
      case 'idle': case 'run': case 'crouch':
        this.groundControl(inp); break;
      case 'jumpsquat':
        this.vx *= 0.85;
        if (f >= 3) {
          const short = !inp.jumpH;
          this.vy = c.jump * (short ? 0.72 : 1); this.grounded = false; this.plat = null; this.setState('air');
          if (Math.abs(inp.x) > 0.3) this.vx = inp.x * c.air * 1.05;
          g.sfx('jump'); g.fx.dust(this.x, this.y, 6); this.anim.squash = 1.25;
        }
        break;
      case 'landing':
        this.vx *= 0.8;
        if (f >= this.lag) this.setState('idle');
        break;
      case 'air':
        this.airControl(inp); this.tryLedge(); break;
      case 'helpless':
        this.airDrift(inp, 0.6); this.tryLedge(); this.helplessT++; break;
      case 'attack':
        this.updateAttack(inp); break;
      case 'special':
        this.updateSpecial(inp); break;
      case 'hitstun':
        if (f >= this.hitstun) { this.launched = false; this.setState(this.grounded ? 'idle' : 'air'); }
        if (this.launched && this.stateT % 2 === 0) g.fx.trail(this.x, this.y + this.h * 0.5, this.color, 0.7);
        if (!this.grounded && f > 10) this.tryLedge();
        break;
      case 'shield':
        this.updateShield(inp); break;
      case 'grab':
        this.vx *= 0.8; this.updateGrab(inp); break;
      case 'grabbed': {
        const gb = this.grabber;
        if (!gb || gb.state !== 'grab' || gb.grabbed !== this) { this.setState('air'); this.grabber = null; break; }
        if (inp.attackP || inp.jumpP || inp.specialP || Math.abs(inp.x) > 0.8) this.mashT = (this.mashT || 0) + 1;
        if (f > 90 + this.pct * 0.4 - (this.mashT || 0) * 6) { gb.grabbed = null; gb.setState('idle'); this.setState('air'); this.vx = -gb.facing * -4; this.grabber = null; this.mashT = 0; }
        return this.postMove();
      }
      case 'roll': {
        const d = this.rollDir; const k = f / 22;
        this.vx = d * 9 * Math.sin(Math.PI * Math.min(1, k)) * 1.2;
        if (this.plat && this.plat.main) { const m = this.plat; const lim = 0.3; if (this.x + this.vx * DT < m.x0 + lim || this.x + this.vx * DT > m.x1 - lim) this.vx = 0; }
        this.invuln = f > 3 && f < 17 ? 2 : this.invuln;
        if (f >= 22) { this.facing = -d; this.setState('idle'); }
        break;
      }
      case 'spotdodge':
        this.vx = 0; if (f > 3 && f < 16) this.invuln = 2; if (f >= 20) this.setState('idle'); break;
      case 'airdodge': {
        if (f < 14 && this.adx !== undefined) { this.noGrav = !!(this.adx || this.ady); const k = 1 - f / 14; this.vx = this.adx * 13 * k; this.vy = this.ady * 13 * k; }
        if (f > 2 && f < 18) this.invuln = 2;
        if (f >= 28) this.setState('air');
        this.tryLedge();
        break;
      }
      case 'ledge':
        this.updateLedge(inp); return this.postMove();
      case 'climb': {
        const k = Math.min(1, f / 14), m = g.stage.main, ex = this.ledgeSide < 0 ? m.x0 : m.x1;
        this.x = lerp(ex + this.ledgeSide * (this.w * 0.5 + 0.05), ex - this.ledgeSide * (this.w * 0.5 + 0.25), smooth(k));
        this.y = lerp(m.top - this.h * 0.85, m.top, easeOut(k)); this.vx = this.vy = 0;
        if (f >= 15) { this.grounded = true; this.plat = m; this.y = m.top; this.setState('idle'); }
        return this.postMove();
      }
      case 'dizzy':
        this.vx *= 0.9; if (f >= 160) { this.setState('idle'); this.shieldHP = 40; }
        if (f % 10 === 0) g.fx.burst(this.x, this.y + this.h + 0.3, 0.3, '#ffe060', 2, 2, 0.6, 0.3, { drag: 1 });
        break;
    }
    this.physics();
    this.postMove();
  }
  tickBuffs() {
    const b = this.buffs, g = this.game;
    for (const k in b) if (b[k] > 0) { b[k]--; if (b[k] === 0) this.onBuffEnd(k); }
    const tgt = this.baseSize * (b.giant ? 1.6 : 1);
    this.size += (tgt - this.size) * 0.12;
    if (b.star > 0) { this.invuln = Math.max(this.invuln, 2); this.contactHit({ r: 0.2, dmg: 10, kb: 8, g: 0.9, a: 50 }, 'star'); }
    if (b.hammer > 0) {
      if (this.stateT % 18 === 0) this.hitIds.clear();
      if (['idle', 'run', 'air', 'crouch', 'landing'].includes(this.state)) {
        const hx = this.x + this.facing * (this.w * 0.5 + 0.9), hy = this.y + this.h * 0.7;
        g.hitCheck(this, { r: 1.0, dmg: 14, kb: 9.5, g: 1.4, a: 50, weak: 1 }, hx, hy, this.facing);
        if (this.stateT % 18 === 9) g.sfx('swing');
      }
    }
    if (this.comboT > 0 && --this.comboT === 0) this.combo = 0;
  }
  contactHit(hb, tag) {
    const g = this.game;
    if (this.stateT % 12 === 0) this.hitIds.clear();
    g.hitCheck(this, { ...hb, r: Math.max(this.w * 0.5, this.h * 0.5) + 0.25, weak: 1 }, this.x, this.y + this.h * 0.5, 0);
  }
  onBuffEnd(k) { if (k === 'hammer') this.game.setHammer(this, false); }
  postMove() {
    const b = this.game.stage.blast;
    if (this.x < -b.x || this.x > b.x || this.y < b.bottom || this.y > b.top) this.game.ko(this);
  }

  // ------------------------------------------------------------ ground / air control
  itemAction(inp) {
    if (this.held && (inp.attackP || inp.specialP)) { this.game.throwHeld(this, inp); return true; }
    if (this.buffs.hammer && (inp.attackP || inp.specialP)) return true;
    return false;
  }
  groundControl(inp) {
    const c = this.c, g = this.game;
    if (this.itemAction(inp)) return;
    if (inp.specialP) return this.doSpecial(inp);
    if (inp.attackP && inp.shieldH) return this.doGrab();
    if (inp.attackP) return this.doAttack(inp);
    if (inp.jumpP) return this.setState('jumpsquat');
    if (inp.shieldH) { this.setState('shield'); this.vx *= 0.3; return; }
    if (inp.y < -0.65 && inp.downTap && this.plat && this.plat.soft) { this.grounded = false; this.plat = null; this.dropT = 14; this.y -= 0.05; this.setState('air'); return; }
    if (inp.y < -0.65 && Math.abs(inp.x) < 0.5) { this.vx = approach(this.vx, 0, 1.2); if (this.state !== 'crouch') this.setState('crouch'); return; }
    if (Math.abs(inp.x) > 0.2) {
      const turned = Math.sign(inp.x) !== this.facing;
      this.facing = Math.sign(inp.x);
      const target = inp.x * c.run * this.spd * (Math.abs(inp.x) > 0.75 ? 1 : 0.55);
      this.vx = approach(this.vx, target, c.run * this.spd * (turned ? 0.35 : 0.2));
      if (this.state !== 'run') { this.setState('run'); if (Math.abs(inp.x) > 0.75) g.fx.dust(this.x, this.y, 4); }
    } else {
      this.vx = approach(this.vx, 0, c.run * 0.14);
      if (this.state !== 'idle') this.setState('idle');
    }
  }
  airDrift(inp, k = 1) {
    const c = this.c;
    this.vx = approach(this.vx, inp.x * c.air * k * this.spd, c.air * 0.09 * this.spd);
    if (inp.y < -0.7 && this.vy + this.kby < 1.5 && !this.fastFall && this.state !== 'helpless') { this.fastFall = true; if (this.vy > -c.fall) this.vy = -c.fall * 1.2; }
  }
  airControl(inp) {
    const c = this.c, g = this.game;
    if (this.itemAction(inp)) return;
    if (inp.specialP) return this.doSpecial(inp);
    if (inp.attackP) return this.doAttack(inp);
    if (inp.jumpP && this.jumps > 0) {
      this.jumps--; this.vy = c.dj; this.kby = Math.max(0, this.kby * 0.3); this.kbx *= 0.5; this.fastFall = false; this.anim.flip = 1;
      if (Math.abs(inp.x) > 0.3) { this.vx = inp.x * c.air; this.facing = Math.sign(inp.x); }
      g.sfx('djump'); g.fx.ring(this.x, this.y + 0.1, 0, 1.6, 0.3, '#ffffff', true); this.anim.squash = 1.2;
      return;
    }
    if (inp.shieldP && !this.airDodged) {
      this.airDodged = true; this.setState('airdodge');
      const m = Math.hypot(inp.x, inp.y);
      if (m > 0.35) { this.adx = inp.x / m; this.ady = inp.y / m; this.fastFall = false; } else { this.adx = 0; this.ady = 0; }
      g.sfx('swing');
      return;
    }
    this.airDrift(inp);
  }

  // ------------------------------------------------------------ attacks
  doAttack(inp) {
    const ax = Math.abs(inp.x), ay = Math.abs(inp.y);
    let key;
    if (this.grounded) {
      if (inp.y > 0.55 && ay > ax) key = 'utilt';
      else if (inp.y < -0.55 && ay > ax) key = 'dtilt';
      else if (ax > 0.55) { this.facing = Math.sign(inp.x); key = 'ftilt'; }
      else key = 'jab';
      this.vx *= 0.3;
    } else {
      if (inp.y > 0.55 && ay > ax) key = 'uair';
      else if (inp.y < -0.55 && ay > ax) key = 'dair';
      else if (ax > 0.5) key = Math.sign(inp.x) === this.facing ? 'fair' : 'bair';
      else key = 'nair';
    }
    this.moveKey = key; this.move = this.moves[key]; this.hitIds.clear(); this.setState('attack');
  }
  updateAttack(inp) {
    const m = this.move, f = this.stateT, g = this.game;
    if (this.grounded) this.vx = approach(this.vx, 0, 0.9);
    else this.airDrift(inp, 0.8);
    if (m.lunge && f === m.hb[0].f0 - 2) this.vx = this.facing * m.lunge * 2;
    if (f === m.hb[0].f0 - 1) g.sfx(m.sfx);
    const sz = this.size;
    for (const hb of m.hb) if (f >= hb.f0 && f <= hb.f1) g.hitCheck(this, sz === 1 ? hb : { ...hb, r: hb.r * sz }, this.x + hb.x * sz * this.facing, this.y + hb.y * sz, hb.radial ? 0 : this.facing);
    if (f >= m.t) this.setState(this.grounded ? 'idle' : 'air');
  }

  // ------------------------------------------------------------ specials
  doSpecial(inp) {
    const up = inp.y > 0.5 && inp.y > Math.abs(inp.x) * 0.7;
    if (up) { if (this.upUsed) return; this.upUsed = true; this.spec = 'up'; }
    else { this.spec = 'n'; if (Math.abs(inp.x) > 0.3) this.facing = Math.sign(inp.x); }
    this.specData = { dirx: inp.x, diry: inp.y, startGround: this.grounded };
    this.hitIds.clear(); this.setState('special');
  }
  doGrab() {
    this.setState('grab'); this.grabbed = null; this.vx *= 0.2;
  }
  updateGrab(inp) {
    const g = this.game, f = this.stateT;
    if (!this.grabbed) {
      if (f >= 4 && f <= 8) {
        const gx = this.x + this.facing * (this.w * 0.5 + 0.45), gy = this.y + this.h * 0.5;
        for (const t of g.fighters) {
          if (t === this || t.state === 'dead' || t.invuln > 0 || t.state === 'ledge' || t.state === 'respawn') continue;
          if (Math.abs(t.x - gx) < 0.55 + t.w * 0.5 && gy > t.y - 0.3 && gy < t.y + t.h + 0.3) { this.grabbed = t; t.setState('grabbed'); t.grabber = this; t.vx = t.vy = t.kbx = t.kby = 0; g.sfx('land'); this.stateT = 0; break; }
        }
      }
      if (!this.grabbed && f >= 24) this.setState('idle');
      return;
    }
    const t = this.grabbed;
    if (t.state !== 'grabbed') { this.grabbed = null; this.setState('idle'); return; }
    t.x = this.x + this.facing * (this.w * 0.5 + t.w * 0.5 + 0.1); t.y = this.y; t.facing = -this.facing;
    if (f % 20 === 10 && inp.attackP) { t.pct += 2; g.fx.hitSpark(t.x, t.y + t.h * 0.5, 2, this.c.fx[0]); g.sfx('hit', 0.1); }
    let dir = 0, a = 0;
    if (inp.y > 0.5) { dir = this.facing; a = 88; } else if (inp.y < -0.5) { dir = this.facing; a = 70; } else if (Math.abs(inp.x) > 0.5) { dir = Math.sign(inp.x); a = 40; }
    if (!dir && f > 70) { dir = this.facing; a = 45; }
    if (dir) {
      t.setState('air'); t.grabber = null; this.grabbed = null; this.facing = dir; this.hitIds.clear();
      g.hitCheck(this, { r: 3, dmg: 9, kb: 8, g: 1.25, a }, t.x, t.y + t.h * 0.5, dir);
      g.sfx('throw'); this.setState('attack'); this.move = this.moves.ftilt; this.moveKey = 'ftilt'; this.stateT = 14;
    }
  }
  toHelpless() { if (this.grounded) this.setState('idle'); else { this.setState('helpless'); this.helplessT = 0; } }
  updateSpecial(inp) {
    const f = this.stateT, c = this.c, g = this.game, S = this.specData, id = c.id, up = this.spec === 'up';
    const H = (hb, x = this.x + hb.x * this.facing, y = this.y + hb.y, dir = this.facing) => g.hitCheck(this, hb, x, y, dir);
    const drift = (k = 0.7) => { this.vx = approach(this.vx, inp.x * c.air * k, c.air * 0.08); };
    if (this.grounded && !up) this.vx = approach(this.vx, 0, 0.8);
    const launchUp = (v, vx = inp.x * 3) => { this.vy = v; this.vx = vx; this.kbx = this.kby = 0; this.grounded = false; this.plat = null; this.fastFall = false; };

    if (SPECIALS[id]) { SPECIALS[id](this, inp, f, up, S, { H, drift, launchUp }); return; }
    if (id === 'blockjack') {
      if (!up) {
        if (f === 11) { g.spawnProjectile(this, 'block'); g.sfx('throw'); }
        if (!this.grounded) { drift(0.6); if (f < 14 && this.vy < 0) this.vy *= 0.85; }
        if (f >= 30) this.setState(this.grounded ? 'idle' : 'air');
      } else {
        if (f < 6) { this.vx *= 0.7; if (!this.grounded) { this.noGrav = true; this.vy = 0; } }
        if (f === 6) { launchUp(20); g.sfx('break'); g.pillarFx(this); }
        if (f >= 6 && f <= 14) H({ x: 0, y: 0.3, r: 1.0, dmg: 7, kb: 6, g: 0.8, a: 80 }, this.x, this.y + 0.4, 0);
        if (f > 6) drift(0.75);
        if (f >= 32) this.toHelpless();
      }
    } else if (id === 'bristle') {
      if (!up) {
        const airRush = !S.startGround;
        if (f === 1 && airRush) { S.weak = this.rushUsed; this.rushUsed = true; }
        if (f < 8) { this.vx *= 0.75; if (airRush) { this.noGrav = !S.weak; if (!S.weak) this.vy *= 0.6; } }
        if (f === 8) g.sfx('rush');
        if (f >= 8 && f < 30 && !S.hit) {
          this.vx = this.facing * (S.weak ? 8 : 15.5);
          if (airRush && !S.weak) { this.noGrav = true; this.vy = 0; }
          if (f % 2 === 0) { g.fx.trail(this.x - this.facing * 0.5, this.y + this.h * 0.45, '#ffcc40', 0.6); if (this.grounded) g.fx.dust(this.x, this.y, 2); }
          if (H({ x: this.w * 0.5 + 0.35, y: this.h * 0.5, r: 0.85, dmg: 12, kb: 8, g: 1.35, a: 35 })) S.hit = true;
        }
        if (f >= 30 || S.hit) { this.vx = approach(this.vx, 0, 1.2); }
        if (f >= 44 || (S.hit && f >= 30)) this.setState(this.grounded ? 'idle' : 'air');
        if (S.hit && !S.endSet) { S.endSet = true; this.stateT = Math.max(this.stateT, 30); }
      } else {
        if (f < 5) { this.vx *= 0.7; this.noGrav = true; this.vy = 0; }
        if (f === 5) { launchUp(16.5); g.sfx('spin'); }
        if (f > 5 && f < 34) { drift(0.8); if (f % 6 === 0) this.hitIds.clear(); H({ x: 0, y: this.h * 0.5, r: 1.15, dmg: 2, kb: 3.5, g: 0, a: 92, weak: 1 }, this.x, this.y + this.h * 0.55, 0); if (f % 5 === 0) g.sfx('swing'); }
        if (f === 34) this.hitIds.clear();
        if (f >= 34 && f <= 37) H({ x: 0, y: this.h * 0.6, r: 1.3, dmg: 5, kb: 7.5, g: 1.25, a: 70 }, this.x, this.y + this.h * 0.6, 0);
        if (f >= 44) this.toHelpless();
      }
    } else if (id === 'voidwalker') {
      const dist = up ? 6.8 : 4.6;
      if (f === 1 && !up && !S.startGround) { S.fizzle = this.blinkUsed; this.blinkUsed = true; }
      if (f < 10) { this.noGrav = true; this.vx *= 0.6; this.vy *= 0.5; this.anim.alpha = 1 - f / 10; if (f > 2) this.invuln = Math.max(this.invuln, 3); if (f % 2 === 0) g.fx.burst(this.x, this.y + this.h * 0.5, 0.2, '#b05cff', 4, 4, 0.5, 0.35); }
      if (f === 10) {
        let dx = S.dirx, dy = S.diry; const m = Math.hypot(dx, dy);
        if (m < 0.35) { dx = up ? 0 : this.facing; dy = up ? 1 : 0; } else { dx /= m; dy /= m; }
        if (up && dy < 0.2) dy = 0.2;
        const d = S.fizzle ? 0 : dist;
        g.fx.burst(this.x, this.y + this.h * 0.5, 0.2, '#c070ff', 26, 9, 0.6, 0.5); g.fx.ring(this.x, this.y + this.h * 0.5, 0.2, 2.2, 0.3, '#b05cff');
        let nx = this.x + dx * d, ny = this.y + dy * d;
        const mn = g.stage.main;
        if (nx > mn.x0 - this.w * 0.5 && nx < mn.x1 + this.w * 0.5 && ny < mn.top && ny > mn.bottom - this.h) ny = mn.top;
        if (S.startGround && Math.abs(dy) < 0.3 && this.plat) ny = this.plat.y;
        this.x = nx; this.y = ny; this.grounded = false; this.plat = null; this.vx = dx * 3; this.vy = up ? 3 : 0; this.kbx = this.kby = 0;
        if (Math.abs(dx) > 0.2) this.facing = Math.sign(dx);
        g.sfx('tele'); g.fx.burst(this.x, this.y + this.h * 0.5, 0.2, '#e08bff', 36, 11, 0.7, 0.55); g.fx.flash(this.x, this.y + this.h * 0.5, 0.4, 4, 0.25, '#b05cff');
      }
      if (f > 10) { this.anim.alpha = Math.min(1, (f - 10) / 5); }
      if (f >= 10 && f <= 14 && !S.fizzle) H({ x: 0, y: this.h * 0.5, r: 1.35, dmg: up ? 7 : 9, kb: 7, g: 1.2, a: 55 }, this.x, this.y + this.h * 0.5, 0);
      if (f >= 30) { this.anim.alpha = 1; if (up) this.toHelpless(); else this.setState(this.grounded ? 'idle' : 'air'); }
    } else if (id === 'gogo') {
      if (!up) {
        if (f === 8) { g.spawnProjectile(this, 'banana'); g.sfx('blaster'); g.fx.flash(this.x + this.facing * 0.9, this.y + this.h * 0.5, 0.4, 1.4, 0.12, '#ffe060'); }
        if (!this.grounded) { drift(0.7); if (f < 12 && this.vy < 0) this.vy *= 0.85; }
        if (f >= 24) this.setState(this.grounded ? 'idle' : 'air');
      } else {
        if (f < 6) { this.vx *= 0.7; this.noGrav = true; this.vy *= 0.5; }
        if (f === 6) { g.sfx('fire'); this.grounded = false; this.plat = null; }
        if (f >= 6 && f < 36) {
          this.noGrav = true; this.vy = 13.5; this.kby = 0; this.vx = approach(this.vx, inp.x * 5.5, 0.6);
          g.fx.fire(this.x, this.y - 0.1, 0.2, 3, 0.9);
          if (f % 7 === 0) this.hitIds.clear();
          H({ x: 0, y: this.h * 0.5, r: 1.0, dmg: 3, kb: 4.5, g: 0.35, a: 85, weak: 1 }, this.x, this.y + this.h * 0.4, 0);
        }
        if (f >= 40) this.toHelpless();
      }
    } else if (id === 'malgore') {
      if (!up) {
        if (!S.phase) S.phase = S.startGround ? 'wind' : 'hover';
        if (S.phase === 'wind') { this.vx *= 0.7; if (f >= 10) { launchUp(13, this.facing * 3.5); S.phase = 'rise'; g.sfx('heavy'); g.fx.dust(this.x, this.y, 10, '#ffb070', 1.5); } }
        else if (S.phase === 'hover') { this.noGrav = true; this.vy = approach(this.vy, 0, 2.5); this.vx *= 0.9; if (f >= 9) S.phase = 'plunge'; }
        else if (S.phase === 'rise') { drift(0.4); if (this.vy <= 2 || f > 34) S.phase = 'plunge'; }
        if (S.phase === 'plunge') {
          this.vy = -31; this.vx *= 0.9; this.noGrav = true;
          g.fx.fire(this.x, this.y + this.h * 0.4, 0.2, 2, 1.2);
          H({ x: 0, y: 0.2, r: 1.2, dmg: 10, kb: 6, g: 1.0, a: -70 }, this.x, this.y + 0.3, this.facing);
          if (f > 160) this.toHelpless();
        }
      } else {
        if (f < 8) { this.vx *= 0.7; this.noGrav = true; this.vy *= 0.4; if (f % 2 === 0) g.fx.fire(this.x, this.y, 0.2, 3, 1.2); }
        if (f === 8) { launchUp(20.5); g.sfx('fire'); g.fx.ring(this.x, this.y, 0, 3, 0.4, '#ff6a20', true); }
        if (f >= 8 && f <= 22) { g.fx.fire(this.x, this.y + 0.2, 0.2, 5, 1.6); H({ x: 0, y: this.h * 0.45, r: 1.45, dmg: 12, kb: 7.5, g: 1.3, a: 80 }, this.x, this.y + this.h * 0.4, 0); }
        if (f > 8) drift(0.6);
        if (f >= 42) this.toHelpless();
      }
    }
  }
  malgoreShockwave() {
    const g = this.game;
    this.hitIds.clear();
    g.hitCheck(this, { x: 0, y: 0.6, r: 3.2, dmg: 16, kb: 9, g: 1.6, a: 65, radial: 1 }, this.x, this.y + 0.6, 0);
    g.sfx('boom'); g.shake(1.0);
    g.fx.ring(this.x, this.y + 0.1, 0, 6, 0.5, '#ff6a20', true); g.fx.ring(this.x, this.y + 0.6, 0.5, 3.5, 0.35, '#ffd080');
    for (let i = 0; i < 14; i++) g.fx.fire(this.x + (i - 7) * 0.45, this.y + 0.1, 0.3 * ((i % 3) - 1), 3, 1.4);
    g.fx.dust(this.x, this.y, 22, '#ffa060', 3);
    g.fx.flash(this.x, this.y + 0.5, 0.6, 4, 0.25, '#ff8a30');
  }

  // ------------------------------------------------------------ shield / ledge
  updateShield(inp) {
    const g = this.game;
    this.vx = approach(this.vx, 0, 1.5);
    this.shieldHP -= 0.2;
    if (this.shieldHP <= 0) { this.setState('dizzy'); this.vy = 12; this.grounded = false; this.plat = null; g.sfx('shieldbreak'); g.fx.burst(this.x, this.y + this.h * 0.5, 0.3, this.color, 40, 12, 0.8, 0.6); return; }
    if (this.shieldStun > 0) return;
    if (inp.attackP) return this.doGrab();
    if (inp.jumpP) return this.setState('jumpsquat');
    if (!inp.shieldH) return this.setState('idle');
    if (Math.abs(inp.x) > 0.65 && inp.xTap) { this.rollDir = Math.sign(inp.x); this.setState('roll'); g.sfx('swing'); return; }
    if (inp.y < -0.65 && inp.downTap) { this.setState('spotdodge'); g.sfx('swing'); }
  }
  tryLedge() {
    if (this.ledgeCD > 0 || this.vy + this.kby > 0.5) return false;
    const m = this.game.stage.main;
    for (const side of [-1, 1]) {
      const ex = side < 0 ? m.x0 : m.x1;
      const dx = (this.x - ex) * side;
      if (dx < -0.3 || dx > 1.4) continue;
      const hy = this.y + this.h * 0.85;
      if (hy < m.top - 0.8 || hy > m.top + 0.6) continue;
      if (this.game.fighters.some(o => o !== this && o.state === 'ledge' && o.ledgeSide === side)) continue;
      this.setState('ledge'); this.ledgeSide = side; this.facing = -side;
      this.x = ex + side * (this.w * 0.5 + 0.05); this.y = m.top - this.h * 0.85;
      this.vx = this.vy = this.kbx = this.kby = 0; this.grounded = false; this.plat = null;
      this.jumps = this.c.jumps; this.upUsed = false; this.airDodged = false; this.rushUsed = false; this.blinkUsed = false; this.fastFall = false; this.launched = false;
      this.invuln = Math.max(this.invuln, 40);
      this.game.sfx('land');
      return true;
    }
    return false;
  }
  updateLedge(inp) {
    const f = this.stateT, side = this.ledgeSide, c = this.c, g = this.game;
    this.vx = this.vy = 0;
    if (f < 8) return;
    const toward = -side;
    if (inp.jumpP) {
      const m = g.stage.main;
      this.y = m.top + 0.05; this.x = (side < 0 ? m.x0 : m.x1) - side * 0.1; this.vy = c.jump * 1.05; this.vx = toward * 3; this.setState('air');
      this.ledgeCD = 30; g.sfx('jump'); return;
    }
    if ((Math.abs(inp.x) > 0.5 && Math.sign(inp.x) === toward) || inp.y > 0.5 || inp.attackP || inp.specialP) { this.setState('climb'); this.invuln = Math.max(this.invuln, 16); return; }
    if (inp.y < -0.5 || (Math.abs(inp.x) > 0.5 && Math.sign(inp.x) === side) || f > 300) { this.setState('air'); this.ledgeCD = 40; this.y -= 0.3; }
  }

  // ------------------------------------------------------------ physics
  physics() {
    const c = this.c;
    if (!this.grounded && !this.noGrav) {
      this.vy -= 50 * c.grav * DT;
      const maxF = this.fastFall ? c.fall * 1.6 : c.fall;
      if (this.vy < -maxF) this.vy = -maxF;
    }
    const kd = this.grounded ? 0.88 : 0.975;
    this.kbx *= kd; this.kby *= kd;
    if (Math.abs(this.kbx) < 0.2) this.kbx = 0; if (Math.abs(this.kby) < 0.2) this.kby = 0;
    const px = this.x, py = this.y;
    this.x += (this.vx + this.kbx) * DT; this.y += (this.vy + this.kby) * DT;
    this.collide(px, py);
  }
  collide(px, py) {
    const S = this.game.stage, m = S.main, hw = this.w * 0.5;
    if (this.grounded) {
      const p = this.plat;
      if (p.dx) this.x += p.dx;
      if (p.off || this.x < p.x0 - 0.1 || this.x > p.x1 + 0.1) { this.leaveGround(); }
      else if (this.vy + this.kby > 0.5) { this.grounded = false; this.plat = null; }
      else { this.y = p.y; this.vy = 0; if (this.kby < 0) this.kby = 0; }
    }
    if (!this.grounded) {
      if (this.vy + this.kby <= 0) {
        for (const p of S.plats) {
          if (p.soft && (this.dropT > 0 || (this.fastFall && this.cpu === false && this.downHeld))) continue;
          if (p.off) continue;
          if (this.x >= p.x0 - 0.1 && this.x <= p.x1 + 0.1 && py >= p.y - 0.05 - Math.max(0, p.dy || 0) && this.y <= p.y) { this.land(p); break; }
        }
      }
      if (!this.grounded && this.y < m.top && this.y + this.h > m.bottom && this.x + hw > m.x0 && this.x - hw < m.x1) {
        if (py + this.h <= m.bottom + 0.1) { this.y = m.bottom - this.h; if (this.vy > 0) this.vy = 0; if (this.kby > 0) this.kby = -this.kby * 0.4; }
        else if (px <= 0) { this.x = m.x0 - hw; if (this.kbx > 0) this.kbx = -this.kbx * 0.4; if (this.vx > 0) this.vx = 0; }
        else { this.x = m.x1 + hw; if (this.kbx < 0) this.kbx = -this.kbx * 0.4; if (this.vx < 0) this.vx = 0; }
      }
    }
  }
  leaveGround() {
    this.grounded = false; this.plat = null;
    if (['idle', 'run', 'crouch', 'landing', 'shield'].includes(this.state)) this.setState('air');
    if (this.state === 'roll' || this.state === 'spotdodge') this.setState('air');
  }
  land(p) {
    const g = this.game, vyT = this.vy + this.kby;
    if (this.state === 'hitstun' && this.launched && vyT < -9) {
      this.kby = Math.abs(this.kby) * 0.45; this.vy = Math.abs(this.vy) * 0.2; this.y = p.y + 0.01;
      g.fx.dust(this.x, p.y, 12, '#e0d0c0', 1.6); g.sfx('land'); g.shake(0.25); return;
    }
    this.grounded = true; this.plat = p; this.y = p.y; this.vy = 0; this.kby = 0;
    this.jumps = this.c.jumps; this.upUsed = false; this.airDodged = false; this.rushUsed = false; this.blinkUsed = false; this.fastFall = false;
    this.anim.squash = 0.78;
    if (this.state === 'special' && this.c.id === 'malgore' && this.spec === 'n' && this.specData.phase === 'plunge') { this.malgoreShockwave(); this.lag = 24; this.setState('landing'); return; }
    if (this.state === 'attack' && this.move && this.move.air) { this.lag = this.move.land; this.setState('landing'); }
    else if (this.state === 'helpless') { this.lag = 12; this.setState('landing'); }
    else if (this.state === 'air' || this.state === 'airdodge') { this.lag = this.state === 'airdodge' ? 8 : 3; this.setState('landing'); }
    else if (this.state === 'special') {
      // most specials end on landing
      if (this.spec === 'up' || this.c.id === 'blockjack' || this.c.id === 'gogo') { if (this.spec === 'up') { this.lag = 10; this.setState('landing'); } }
    }
    else if (this.state === 'hitstun') { /* slide */ }
    g.fx.dust(this.x, p.y, 5); g.sfx('land');
  }

  // ------------------------------------------------------------ getting hit
  takeHit(att, hb, dir, hx, hy) {
    const g = this.game;
    if (this.invuln > 0 || this.state === 'dead' || this.state === 'respawn' || this.state === 'ledge' && this.invuln > 0) return false;
    const pow = (att ? att.c.power : 1) * (att ? att.powerMul : 1);
    const dmg = hb.dmg * (hb.weak ? (att ? att.powerMul : 1) : pow);
    if (this.buffs.barrier > 0) {
      this.buffs.barrier = 0; g.sfx('shieldbreak'); g.fx.burst(this.x, this.y + this.h * 0.5, 0.3, '#7fd8ff', 40, 10, 0.6, 0.5); g.hitstop(4);
      this.invuln = 30; return 'shield';
    }
    if (this.state === 'shield') {
      this.shieldHP -= dmg * 1.3; this.shieldStun = Math.round(4 + dmg * 0.6);
      const d = dir || Math.sign(this.x - hx) || 1;
      this.vx = d * Math.min(10, 2 + dmg * 0.5);
      g.sfx('shield'); g.fx.burst(hx, hy, 0.5, this.color, 10, 6, 0.3, 0.35); g.hitstop(3);
      return 'shield';
    }
    this.pct = Math.min(999, this.pct + dmg);
    if (att) att.dealt += dmg;
    const d = dir || Math.sign(this.x - hx) || (att ? att.facing : 1);
    let spd = (hb.kb * (hb.weak ? 1 : (0.6 + 0.4 * pow)) + hb.g * this.pct * 0.155 * (hb.weak ? 0.2 : 1)) / this.weight;
    if (hb.web) spd = 3;
    let a = hb.a * Math.PI / 180;
    let kx = Math.cos(a) * spd * d, ky = Math.sin(a) * spd;
    if (this.grounded && ky < 0) { if (spd > 10) { ky = -ky * 0.7; } else ky = 0; }
    this.kbx = kx; this.kby = ky; this.vx = 0; this.vy = 0;
    if (ky > 0.5) { this.grounded = false; this.plat = null; }
    this.hitstun = Math.round(Math.max(8, spd * 1.25));
    if (hb.web) { this.hitstun = 48; this.webbed = 48; g.fx.burst(this.x, this.y + this.h * 0.5, 0.4, '#ffffff', 16, 4, 0.6, 0.3); }
    if (this.id === 'bolt' && dmg > 3) g.fx.burst(this.x, this.y + this.h * 0.5, 0.3, '#ffd23a', 14, 9, 0.9, 0.3, { grav: 1.2, drag: 1 });
    if (this.held) { g.dropHeld(this); }
    if (att) { att.combo = (att.comboT > 0 ? att.combo : 0) + 1; att.comboT = 70; }
    this.launched = spd > 15;
    this.setState('hitstun');
    this.upUsed = false; this.airDodged = false; this.rushUsed = false; this.blinkUsed = false; this.fastFall = false; this.anim.alpha = 1;
    if (att) { this.lastHitter = att; this.lastHitT = g.frame; } this.hitFlash = 6;
    if (spd > 13) this.facing = -Math.sign(kx) || this.facing;
    return { spd, dmg, kx, ky };
  }
  respawn() {
    const g = this.game;
    this.reset(0, 0, 1);
    this.spawnX = g.stage.spawns[this.slot][0] * 0.5; this.spawnY = 9;
    this.x = this.spawnX; this.y = this.spawnY; this.facing = this.spawnX > 0 ? -1 : 1;
    this.setState('respawn'); this.halo.visible = true; this.invuln = 150;
    g.sfx('respawn'); g.fx.burst(this.x, this.y + 1, 0, this.color, 40, 6, 0.8, 0.5);
  }

  // ------------------------------------------------------------ procedural animation
  animate(dt, time) {
    const r = this.rig, A = this.anim, st = this.state, c = this.c;
    r.root.visible = st !== 'dead';
    if (st === 'dead') return;
    const P = { ...N0 };
    let rate = 16;
    let bob = 0, lean = 0;
    const f = this.stateT;
    A.t += 0;
    const breathe = Math.sin(time * 3.2 + this.slot) * 0.5 + 0.5;
    if (this.victory) {
      this.victoryPose(P, time); rate = 10;
    } else if (this.buffs.hammer > 0 && ['idle', 'run', 'air', 'crouch', 'landing'].includes(st)) {
      const ph = (this.stateT % 18) / 18; P.aRx = -3.1 + Math.sin(ph * Math.PI) * 2.8; P.aLx = P.aRx; P.hx = Math.sin(ph * Math.PI) * 0.4; rate = 40;
      if (st === 'run') { A.run += Math.abs(this.vx) * dt * 1.55; const s2 = Math.sin(A.run * 2.2); P.lLx = s2; P.lRx = -s2; }
    } else switch (st) {
      case 'idle': case 'respawn': case 'landing': case 'jumpsquat': case 'dizzy':
        P.aRz = -0.15 - breathe * 0.05; P.aLz = 0.15 + breathe * 0.05; P.aRx = -0.25; P.aLx = 0.1; P.hx = 0.05; bob = breathe * 0.04;
        if (st === 'landing' || st === 'jumpsquat') P.crouch = 0.5;
        if (st === 'dizzy') { P.hy = Math.sin(time * 6) * 0.4; P.hd = 0.3; }
        break;
      case 'crouch': P.crouch = 0.65; P.hx = 0.35; P.aRx = -0.5; P.aLx = -0.4; break;
      case 'run': {
        A.run += Math.abs(this.vx) * dt * (c.id === 'gogo' ? 2.4 : 1.55);
        const s = Math.sin(A.run * 2.2);
        const sp = Math.min(1, Math.abs(this.vx) / c.run);
        P.lLx = s * 1.0 * sp; P.lRx = -s * 1.0 * sp; P.aLx = -s * 0.9 * sp; P.aRx = s * 0.9 * sp - 0.3; P.hx = 0.22 * sp; P.hy = s * 0.12;
        bob = Math.abs(Math.cos(A.run * 2.2)) * 0.09 * sp; rate = 24;
        break;
      }
      case 'air': case 'airdodge': {
        const up = this.vy > 0;
        P.lLx = up ? -0.7 : -0.25; P.lRx = up ? 0.35 : 0.2; P.aRz = up ? -0.9 : -0.5; P.aLz = up ? 0.9 : 0.5; P.aRx = -0.3; P.hx = up ? -0.05 : 0.08;
        if (st === 'airdodge') { P.crouch = 0.3; P.hx = 0.3; }
        break;
      }
      case 'helpless': P.aRx = -2.6; P.aLx = -2.6; P.lLx = 0.3; P.lRx = -0.2; P.hx = -0.2; break;
      case 'attack': {
        const m = this.move, hb = m.hb[0];
        const [pA, pB] = ANIMS[m.anim];
        this.phasePose(P, pA, pB, f, hb.f0, hb.f1 + 2, m.t);
        rate = 60;
        break;
      }
      case 'special': this.specialPose(P, f); rate = 40; break;
      case 'hitstun':
        P.aRx = -2.2 + Math.sin(time * 30) * 0.5; P.aLx = -1.8 + Math.cos(time * 27) * 0.5; P.aRz = -0.6; P.aLz = 0.6; P.hx = -0.45; P.hd = -0.4; P.lLx = -0.6; P.lRx = 0.4;
        rate = 30; break;
      case 'shield': P.crouch = 0.25; P.aRx = -1.3; P.aLx = -1.3; P.aRz = 0.5; P.aLz = -0.5; P.hx = 0.2; break;
      case 'roll': P.crouch = 0.6; P.hx = 0.7; P.spinY = 0; break;
      case 'spotdodge': P.crouch = 0.4; P.hy = 0.8; break;
      case 'ledge': P.aRx = -3.0; P.aLx = -3.0; P.lLx = 0.25; P.lRx = -0.15; P.hx = 0.15; P.hd = -0.3; break;
      case 'climb': P.aRx = -2.0; P.aLx = -2.0; P.crouch = 0.4; P.hx = 0.5; P.lLx = -1.0; break;
      case 'grab': P.aRx = -1.5; P.aLx = -1.5; P.hx = 0.3; P.aRz = 0.2; P.aLz = -0.2; break;
      case 'grabbed': P.aRx = -2.6 + Math.sin(time * 20) * 0.3; P.aLx = -2.4; P.hx = -0.3; P.hd = -0.3; break;
    }
    const k = 1 - Math.exp(-dt * rate);
    for (const key in P) this.pose[key] = lerp(this.pose[key], P[key], key === 'spinY' && st === 'attack' ? 1 : k);
    const p = this.pose;
    // apply
    r.armR.rotation.set(p.aRx, 0, -0.08 + p.aRz);
    r.armL.rotation.set(p.aLx, 0, 0.08 + p.aLz);
    r.hips.rotation.set(p.hx, p.hy, 0);
    r.head.rotation.set(p.hd, 0, 0);
    r.legL.rotation.x = p.lLx; r.legR.rotation.x = p.lRx;
    r.face.rotation.y = BASE_YAW + p.spinY;
    if (r.cape) r.cape.rotation.x = 0.12 + Math.max(0, Math.abs(this.vx) * 0.05) + (this.grounded ? 0 : 0.35) + Math.sin(time * 4) * 0.04;
    // facing flip
    A.faceVis = lerp(A.faceVis, this.facing, 1 - Math.exp(-dt * 22));
    const fv = Math.abs(A.faceVis) < 0.12 ? 0.12 * Math.sign(A.faceVis || 1) : A.faceVis;
    // squash
    A.squash = lerp(A.squash, 1, 1 - Math.exp(-dt * 12));
    const crouch = p.crouch * 0.16;
    const sy = A.squash * (1 - crouch), sxz = 1 / Math.sqrt(A.squash);
    r.inner.scale.set(fv * sxz, sy, sxz);
    // flips & spins
    if (A.flip > 0) { A.flip -= dt * 2.6; if (A.flip < 0) A.flip = 0; }
    let spinZ = 0;
    if (A.flip > 0) spinZ = -this.facing * (1 - A.flip) * Math.PI * 2 * (c.id === 'malgore' ? 0 : 1);
    if (st === 'hitstun' && this.launched) { A.spinZ += dt * 16 * (this.kbx > 0 ? -1 : 1); spinZ = A.spinZ; }
    else if (st === 'helpless') { A.spinZ = lerp(A.spinZ, 0, k); spinZ = Math.sin(time * 5) * 0.15; }
    else if (st === 'special' && this.c.id === 'bristle' && this.spec === 'up') spinZ = 0;
    else if (st === 'special' && this.c.id === 'bolt') { spinZ = this.spec === 'up' ? (f > 3 && f < 18 ? -this.facing * (f - 3) / 15 * Math.PI * 2 : 0) : -this.facing * f * (f < 18 ? 0.5 : 0.9); A.spinZ = 0; }
    else A.spinZ = 0;
    r.spin.rotation.z = spinZ;
    // special-specific spins around y
    if (st === 'special' && this.c.id === 'bristle' && this.spec === 'up') r.face.rotation.y = BASE_YAW + f * 0.7;
    if (st === 'roll') r.spin.rotation.z = -this.rollDir * (f / 22) * Math.PI * 2 * 0.0;
    // position
    let jx = 0;
    if (this.game.hitstopT > 0 && this.hitFlash > 0) jx = (Math.random() - 0.5) * 0.16;
    r.root.position.set(this.x + jx, this.y + bob, 0);
    const fz = A.fuse || 0; r.root.scale.setScalar(this.size * (1 + fz * 0.25 + (fz > 0 ? Math.sin(time * 40) * 0.03 * fz : 0)));
    // tint / flash
    const mats = r.mats;
    let em = 0, ec = 0xffffff;
    if (this.hitFlash > 0) em = this.hitFlash / 6 * 0.9;
    else if (A.fuse > 0) { em = (Math.sin(time * (10 + A.fuse * 30)) * 0.5 + 0.5) * A.fuse; }
    else if (this.buffs.star > 0) { em = 0.55; ec = new THREE.Color().setHSL((time * 2) % 1, 1, 0.5).getHex(); }
    else if (this.buffs.power > 0) { em = 0.25 + Math.sin(time * 12) * 0.1; ec = 0xff3020; }
    else if (this.webbed > 0) { em = 0.3; ec = 0xffffff; }
    else if (this.invuln > 0 && st !== 'ledge') { em = (Math.sin(time * 30) * 0.5 + 0.5) * 0.18; ec = 0x88ccff; }
    else if (st === 'helpless') { em = 0; }
    if (em > 0) { mats.matte.emissive.setHex(ec).multiplyScalar(em); mats.metal.emissive.setHex(ec).multiplyScalar(em); }
    else if (mats.matte.emissive.r !== 0) { mats.matte.emissive.setHex(0); mats.metal.emissive.setHex(0); }
    const darken = st === 'helpless' ? 0.45 : 1;
    if (mats.matte.color.r !== darken) { mats.matte.color.setScalar(darken); mats.metal.color.setScalar(darken); }
    // alpha (teleport)
    const al = A.alpha;
    const vis = al > 0.05;
    r.spin.visible = vis;
    if (vis && al < 1) r.inner.scale.multiplyScalar(0.4 + al * 0.6);
    // shield
    const sh = this.shieldMesh;
    if (st === 'shield') { sh.visible = true; const s = (Math.max(this.w, this.h * 0.55) * 0.75 + 0.2) * (0.4 + 0.6 * this.shieldHP / 100); sh.scale.setScalar(s / this.size); sh.material.uniforms.k.value = 0.6 + 0.4 * Math.sin(time * 20) * (this.shieldStun > 0 ? 1 : 0.2); }
    else sh.visible = false;
    if (this.halo.visible) this.halo.rotation.y += dt * 2;
    if (st !== 'special') A.fuse = 0;
    if (this.webbed > 0) this.webbed--;
    if (this.buffs.barrier > 0 && st !== 'shield') { sh.visible = true; sh.scale.setScalar((Math.max(this.w, this.h * 0.55) * 0.8 + 0.3) / this.size); sh.material.uniforms.k.value = 0.7; }
  }
  phasePose(P, pA, pB, f, f0, f1, t) {
    let from, to, k;
    if (f < f0) { from = N0; to = pA; k = easeOut(Math.min(1, f / f0)); }
    else if (f < f1) { from = pA; to = pB; k = easeOutBack(Math.min(1, (f - f0) / Math.max(1, f1 - f0))); }
    else { from = pB; to = N0; k = smooth(Math.min(1, (f - f1) / Math.max(1, t - f1))); }
    for (const key in N0) P[key] = lerp(from[key] ?? 0, to[key] ?? 0, k);
  }
  specialPose(P, f) {
    const id = this.c.id, up = this.spec === 'up', S = this.specData;
    if (SPECIAL_POSES[id]) return SPECIAL_POSES[id](P, f, up, S);
    if (id === 'blockjack') { if (!up) this.phasePose(P, ANIMS.throw[0], ANIMS.throw[1], f, 11, 15, 30); else { P.aRx = -3.0; P.aLx = -3.0; P.lLx = -0.4; P.crouch = f < 6 ? 0.6 : 0; } }
    else if (id === 'bristle') { if (!up) { P.hx = 0.75; P.crouch = 0.3; P.aRx = 0.6; P.aLx = -0.4; P.aRz = -0.3; const s = Math.sin(f * 0.9); P.lLx = s; P.lRx = -s; P.hd = -0.4; } else { P.aRz = -1.5; P.aLz = 1.4; P.aRx = -0.3; P.lLx = -0.3; } }
    else if (id === 'voidwalker') { P.aRz = -0.9; P.aLz = 0.9; P.aRx = -0.6; P.aLx = -0.6; P.hd = -0.3; P.hx = 0.1; }
    else if (id === 'gogo') { if (!up) this.phasePose(P, ANIMS.blast[0], ANIMS.blast[1], f, 8, 12, 24); else { P.aRz = -0.9; P.aLz = 0.9; P.lLx = 0.1; P.lRx = -0.1; P.hd = -0.2; } }
    else if (id === 'malgore') {
      if (!up) { if (S.phase === 'plunge') { P.aRx = -1.0; P.aLx = -1.0; P.hx = 0.6; P.lLx = -0.6; P.lRx = -0.6; } else { P.aRx = -3.1; P.aLx = -3.0; P.hx = -0.3; P.crouch = S.phase === 'wind' ? 0.5 : 0; } }
      else { P.aRx = -3.1; P.aLx = -3.1; P.crouch = f < 8 ? 0.6 : 0; P.hd = -0.4; }
    }
  }
  victoryPose(P, time) {
    const id = this.c.id, t = time;
    if (this.cos.pose && VICTORY_POSES[this.cos.pose]) return VICTORY_POSES[this.cos.pose](P, t);
    if (!['blockjack', 'bristle', 'voidwalker', 'gogo', 'malgore'].includes(id)) return VICTORY_POSES[{ bolt: 'wave', pipper: 'cheer', webline: 'flex', fizz: 'spin', rattle: 'dance', ironclad: 'flex' }[id]](P, t);
    if (id === 'blockjack') { P.aRx = -3.0 + Math.sin(t * 4) * 0.3; P.aLz = 0.6; P.hd = -0.2; P.hy = Math.sin(t * 2) * 0.3; }
    else if (id === 'bristle') { P.aRx = -2.6; P.aLx = -2.6; P.aRz = -0.9; P.aLz = 0.9; P.hx = -0.2 + Math.sin(t * 6) * 0.05; P.crouch = 0.2 + Math.sin(t * 6) * 0.1; }
    else if (id === 'voidwalker') { P.aRz = -1.3; P.aLz = 1.3; P.hd = -0.4 + Math.sin(t * 3) * 0.1; P.hy = Math.sin(t * 1.5) * 0.4; }
    else if (id === 'gogo') { const j = Math.abs(Math.sin(t * 6)); P.aRx = -3.0; P.aLx = -2.6 + Math.sin(t * 12) * 0.4; P.crouch = (1 - j) * 0.5; P.lLx = -j * 0.3; }
    else if (id === 'malgore') { P.aRx = -2.9; P.aLx = -0.9 + Math.sin(t * 8) * 0.3; P.hx = -0.25; P.hd = -0.5; P.aLz = 0.4; }
  }
}
