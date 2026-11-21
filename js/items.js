// Block Brawl v2 - power-up items
import * as THREE from 'three';

export const ITEM_DEFS = {
  heal:    { name: 'HEART MELON', color: '#ff5a7a', w: 1.0, desc: 'Heals 40%' },
  power:   { name: 'RAGE ORB', color: '#ff4020', w: 1.0, desc: 'Damage x1.5 for 10s' },
  speed:   { name: 'DASH BOOTS', color: '#40b8ff', w: 1.0, desc: 'Speed x1.45 for 10s' },
  barrier: { name: 'BUBBLE SHIELD', color: '#7fe8ff', w: 0.9, desc: 'Blocks the next hit' },
  giant:   { name: 'GIGA SHROOM', color: '#ff3040', w: 0.7, desc: 'Grow huge for 9s' },
  bomb:    { name: 'TNT', color: '#ff6a30', w: 1.0, desc: 'Grab it, throw it, boom' },
  hammer:  { name: 'MEGA HAMMER', color: '#d0a060', w: 0.55, desc: 'Unstoppable swings for 8s' },
  star:    { name: 'RAINBOW STAR', color: '#ffe040', w: 0.5, desc: 'Invincible for 8s' },
};
export const ITEM_ORDER = Object.keys(ITEM_DEFS);
const FREQ = { off: 0, low: 20, med: 12, high: 6.5 };

const sm = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.1, ...o });
const glow = (c, k = 2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), toneMapped: false });
function box(g, mat, x, y, z, sx, sy, sz) { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; }

export function makeItemMesh(type) {
  const g = new THREE.Group();
  if (type === 'heal') {
    const r = sm('#ff3a5a', { emissive: '#600010' }), hl = sm('#ffb0c0');
    const rows = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];
    rows.forEach((row, y) => [...row].forEach((v, x) => { if (v === '1') box(g, (y === 1 && x === 1) ? hl : r, (x - 3) * 0.1, (2.5 - y) * 0.1 + 0.05, 0, 0.1, 0.1, 0.16); }));
  } else if (type === 'power') {
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), sm('#ff2a10', { emissive: '#a01000', metalness: 0.4 })));
    for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 4), glow('#ffb040', 1.6)); const a = i / 6 * Math.PI * 2; s.position.set(Math.cos(a) * 0.26, Math.sin(a) * 0.26, 0); s.rotation.z = a - Math.PI / 2; g.add(s); }
  } else if (type === 'speed') {
    const b = sm('#2a8aff', { metalness: 0.3 }), w = sm('#ffffff'), y = glow('#ffe040', 1.5);
    box(g, b, 0, 0, 0, 0.16, 0.34, 0.2); box(g, b, 0.1, -0.12, 0, 0.36, 0.12, 0.2); box(g, w, 0.1, -0.2, 0, 0.4, 0.05, 0.22);
    box(g, y, -0.12, 0.08, 0, 0.12, 0.05, 0.05); box(g, y, -0.15, 0.0, 0, 0.16, 0.05, 0.05);
  } else if (type === 'barrier') {
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 14), new THREE.MeshStandardMaterial({ color: '#80e8ff', transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.2, emissive: '#1a6080' })));
    g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), glow('#bff6ff', 1.6)));
  } else if (type === 'giant') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), sm('#e82838')); cap.position.y = 0.02; g.add(cap);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.2, 10), sm('#f4e8d0')); st.position.y = -0.08; g.add(st);
    for (const [x, y, z] of [[0, 0.24, 0.08], [0.17, 0.14, 0.12], [-0.17, 0.14, 0.12], [0.08, 0.12, -0.2], [-0.12, 0.1, -0.18]]) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), sm('#ffffff')); d.position.set(x, y, z); g.add(d); }
  } else if (type === 'bomb') {
    const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
    x.fillStyle = '#c8281e'; x.fillRect(0, 0, 32, 32); x.fillStyle = '#e8e0d0'; x.fillRect(0, 11, 32, 10); x.fillStyle = '#202020'; x.font = 'bold 10px Arial'; x.textAlign = 'center'; x.fillText('TNT', 16, 20);
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.46), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 })); m.castShadow = true; g.add(m);
    box(g, glow('#ffd060', 2), 0, 0.28, 0, 0.04, 0.1, 0.04);
  } else if (type === 'hammer') {
    box(g, sm('#8a5a2a'), 0, -0.1, 0, 0.07, 0.5, 0.07);
    box(g, sm('#c8ccd4', { metalness: 0.9, roughness: 0.25 }), 0, 0.2, 0, 0.34, 0.18, 0.2);
    box(g, glow('#ffd040', 1.2), 0, 0.2, 0.105, 0.2, 0.06, 0.02);
  } else if (type === 'star') {
    const sh = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.12 : 0.28; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }); geo.center();
    g.add(new THREE.Mesh(geo, sm('#ffd820', { emissive: '#b08000', metalness: 0.5, roughness: 0.25 })));
    box(g, new THREE.MeshBasicMaterial({ color: '#201000' }), -0.05, 0.03, 0.08, 0.03, 0.08, 0.01); box(g, new THREE.MeshBasicMaterial({ color: '#201000' }), 0.05, 0.03, 0.08, 0.03, 0.08, 0.01);
  }
  return g;
}

function haloTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}

export class Items {
  constructor(game, scene) {
    this.g = game; this.scene = scene; this.list = []; this.timer = 6; this.pops = [];
    this.halo = haloTex(); this.cfg = { freq: 'med', enabled: ITEM_ORDER.slice() };
    this.hammers = new Map(); this.heldMeshes = new Map();
  }
  configure(freq, enabled) { this.cfg.freq = freq || 'med'; if (enabled) this.cfg.enabled = enabled; this.timer = 4 + Math.random() * 3; }
  clear() {
    for (const it of this.list) this.scene.remove(it.grp);
    this.list = [];
    for (const [f, m] of this.hammers) m.parent && m.parent.remove(m); this.hammers.clear();
    for (const [f, m] of this.heldMeshes) this.scene.remove(m); this.heldMeshes.clear();
    for (const p of this.pops) this.scene.remove(p.s); this.pops = [];
  }
  spawn(type, x, y, vx = 0, vy = 0) {
    const def = ITEM_DEFS[type];
    const grp = new THREE.Group(); const mesh = makeItemMesh(type); mesh.scale.setScalar(1.35); grp.add(mesh);
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.halo, color: new THREE.Color(def.color).multiplyScalar(1.4), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    h.scale.setScalar(1.6); grp.add(h);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(def.color).multiplyScalar(1.5), transparent: true, opacity: 0.7, side: THREE.DoubleSide, toneMapped: false, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; grp.add(ring);
    grp.position.set(x, y, 0); this.scene.add(grp);
    const it = { type, x, y, vx, vy, grp, mesh, ring, halo: h, life: 60 * 16, grounded: false, alive: true, t: Math.random() * 6, plat: null };
    this.list.push(it); return it;
  }
  randomType() {
    const en = this.cfg.enabled.length ? this.cfg.enabled : ITEM_ORDER;
    let tot = 0; for (const k of en) tot += ITEM_DEFS[k].w;
    let r = Math.random() * tot; for (const k of en) { r -= ITEM_DEFS[k].w; if (r <= 0) return k; } return en[0];
  }
  dropRandom() {
    const st = this.g.stage, ps = st.plats.filter(p => p.x1 - p.x0 > 2);
    const p = ps[Math.random() < 0.6 ? 0 : Math.floor(Math.random() * ps.length)];
    const x = p.x0 + 0.8 + Math.random() * (p.x1 - p.x0 - 1.6);
    const it = this.spawn(this.randomType(), x, 13);
    this.g.fx.ring(x, 9, 0, 2, 0.4, ITEM_DEFS[it.type].color);
    this.g.sfx('item');
  }
  update(live) {
    const g = this.g, DT = 1 / 60;
    if (live && g.phase === 'fight' && FREQ[this.cfg.freq] > 0) {
      this.timer -= DT;
      if (this.timer <= 0) { if (this.list.length < 3) this.dropRandom(); this.timer = FREQ[this.cfg.freq] * (0.7 + Math.random() * 0.6); }
    }
    for (let i = this.list.length - 1; i >= 0; i--) {
      const it = this.list[i]; it.t += DT; it.life--;
      if (!it.grounded) {
        it.vy = Math.max(it.vy - 30 * DT, -9); const py = it.y; it.x += it.vx * DT; it.y += it.vy * DT; it.vx *= 0.99;
        if (it.vy <= 0) for (const p of g.stage.plats) { if (it.x >= p.x0 && it.x <= p.x1 && py >= p.y - 0.05 && it.y <= p.y) { it.y = p.y; it.grounded = true; it.plat = p; it.vx = 0; g.fx.dust(it.x, p.y, 4); break; } }
      } else if (it.plat) { it.y = it.plat.y; if (it.plat.dx) it.x += it.plat.dx; if (it.x < it.plat.x0 || it.x > it.plat.x1) { it.grounded = false; it.plat = null; } }
      it.grp.position.set(it.x, it.y + 0.45 + Math.sin(it.t * 3) * 0.08, 0);
      it.mesh.rotation.y = it.t * 2.2;
      it.ring.position.y = -0.4 - Math.sin(it.t * 3) * 0.08; it.ring.scale.setScalar(1 + (it.t * 1.5 % 1) * 0.6); it.ring.material.opacity = 0.7 * (1 - (it.t * 1.5 % 1));
      it.halo.material.opacity = 0.55 + Math.sin(it.t * 6) * 0.2;
      it.grp.visible = it.life > 120 || (it.life % 10) < 6;
      let gone = it.life <= 0 || it.y < -14 || Math.abs(it.x) > 30;
      if (!gone && it.grounded || (!gone && it.vy < 2)) {
        for (const f of g.fighters) {
          if (f.state === 'dead' || f.state === 'respawn' || f.state === 'grabbed') continue;
          if (it.type === 'bomb' && (f.held || f.buffs.hammer)) continue;
          if (Math.abs(f.x - it.x) < f.w * 0.5 + 0.5 && it.y + 0.4 > f.y - 0.2 && it.y < f.y + f.h) { this.pickup(f, it); gone = true; break; }
        }
      }
      if (gone) { it.alive = false; this.scene.remove(it.grp); this.list.splice(i, 1); }
    }
    // AI item interest
    if (g.frame % 30 === 0) for (let i = 0; i < g.fighters.length; i++) {
      const ai = g.ais[i], f = g.fighters[i];
      if (!ai || ai.itemTarget || f.held) continue;
      const near = this.list.filter(it => it.grounded && Math.abs(it.x - f.x) < 9 && Math.abs(it.y - f.y) < 4)[0];
      if (near && Math.random() < 0.55) ai.itemTarget = near;
    }
    // held bombs follow
    for (const [f, m] of this.heldMeshes) {
      if (f.held !== 'bomb' || f.state === 'dead') { this.scene.remove(m); this.heldMeshes.delete(f); if (f.state === 'dead') f.held = null; continue; }
      m.position.set(f.x + f.facing * 0.1, f.y + f.h + 0.35, 0.2); m.rotation.y += DT * 2;
    }
    // buff particles
    if (g.frame % 3 === 0) for (const f of g.fighters) {
      if (f.state === 'dead') continue; const b = f.buffs;
      const rx = f.x + (Math.random() - 0.5) * f.w * 1.6, ry = f.y + Math.random() * f.h;
      if (b.power) g.fx.spawn(rx, ry, 0.3, 0, 2.5, 0, 2.4, 0.5, 0.2, 0.5, 0.25, -1, 0, -0.5);
      if (b.speed && Math.abs(f.vx) > 3) g.fx.trail(f.x - f.facing * 0.3, f.y + f.h * 0.4, '#40b8ff', 0.6);
      if (b.star) { const c = new THREE.Color().setHSL(Math.random(), 1, 0.6); g.fx.spawn(rx, ry, 0.3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, 0, c.r * 2, c.g * 2, c.b * 2, 0.5, 0.3, 0, 1, -0.5); }
      if (b.giant && g.frame % 9 === 0 && f.grounded && Math.abs(f.vx) > 2) { g.fx.dust(f.x, f.y, 3); }
    }
    // pop texts
    for (let i = this.pops.length - 1; i >= 0; i--) {
      const p = this.pops[i]; p.t += DT; p.s.position.y += DT * 1.4; p.s.material.opacity = Math.min(1, (1.4 - p.t) * 3);
      const k = Math.min(1, p.t * 8); p.s.scale.set(p.w * (0.6 + 0.4 * k), p.h * (0.6 + 0.4 * k), 1);
      if (p.t > 1.4) { this.scene.remove(p.s); p.s.material.map.dispose(); p.s.material.dispose(); this.pops.splice(i, 1); }
    }
  }
  pop(x, y, text, color) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x2 = c.getContext('2d');
    x2.font = 'italic 900 34px "Arial Black", Arial, sans-serif'; x2.textAlign = 'center'; x2.textBaseline = 'middle';
    x2.lineWidth = 7; x2.strokeStyle = '#000'; x2.strokeText(text, 128, 34); x2.fillStyle = color; x2.fillText(text, 128, 34);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, toneMapped: false })); s.renderOrder = 30;
    s.position.set(x, y, 0.5); this.scene.add(s); this.pops.push({ s, t: 0, w: 3.2, h: 0.8 });
  }
  pickup(f, it) {
    const g = this.g, def = ITEM_DEFS[it.type], b = f.buffs;
    g.fx.burst(it.x, it.y + 0.5, 0.3, def.color, 26, 7, 0.5, 0.35);
    g.fx.ring(it.x, it.y + 0.5, 0.2, 2.2, 0.35, def.color);
    const ai = g.ais[g.fighters.indexOf(f)]; if (ai) ai.itemTarget = null;
    f.itemsTaken = (f.itemsTaken || 0) + 1;
    if (f.onItem) f.onItem(it.type);
    g.stats && g.stats.item(f, it.type);
    switch (it.type) {
      case 'heal': f.pct = Math.max(0, f.pct - 40); g.sfx('heal'); for (let k = 0; k < 4; k++) g.fx.burst(f.x, f.y + f.h * 0.5, 0.3, '#60ff90', 10, 4, 0.9, 0.3, { up: 3, grav: -1 }); break;
      case 'power': b.power = 600; g.sfx('powerup'); break;
      case 'speed': b.speed = 600; g.sfx('powerup'); break;
      case 'barrier': b.barrier = 1200; g.sfx('shield'); break;
      case 'giant': b.giant = 540; g.sfx('powerup'); g.shake(0.4); break;
      case 'star': b.star = 480; g.sfx('powerup'); break;
      case 'hammer': b.hammer = 480; this.setHammer(f, true); g.sfx('pickup'); break;
      case 'bomb': f.held = 'bomb'; { const m = makeItemMesh('bomb'); m.scale.setScalar(1.3); this.scene.add(m); this.heldMeshes.set(f, m); } g.sfx('pickup'); break;
    }
    this.pop(f.x, f.y + f.h + 0.9, def.name + '!', def.color);
    if (!f.cpu && navigator.vibrate && g.haptics) try { navigator.vibrate(25); } catch (_) {}
  }
  setHammer(f, on) {
    const old = this.hammers.get(f); if (old) { old.parent && old.parent.remove(old); this.hammers.delete(f); }
    if (on) { const m = makeItemMesh('hammer'); m.scale.setScalar(2.6 / f.size); m.position.set(0, -0.75, 0.15); m.rotation.x = Math.PI; f.rig.armR.add(m); this.hammers.set(f, m); }
  }
  throwHeld(f, inp) {
    if (f.held !== 'bomb') return;
    f.held = null; const m = this.heldMeshes.get(f); if (m) { this.scene.remove(m); this.heldMeshes.delete(f); }
    if (Math.abs(inp.x) > 0.3) f.facing = Math.sign(inp.x);
    const up = inp.y > 0.5, down = inp.y < -0.5;
    this.g.spawnProjectile(f, 'bomb', up ? { vx: f.facing * 3, vy: 16 } : down && !f.grounded ? { vx: 0, vy: -14 } : {});
    this.g.sfx('throw');
    f.setState('attack'); f.move = f.moves.ftilt; f.moveKey = 'ftilt'; f.stateT = 12; f.hitIds.clear();
    f.hitIds.add(f);
    for (const o of this.g.fighters) f.hitIds.add(o);
  }
  dropHeld(f) {
    if (f.held !== 'bomb') return;
    f.held = null; const m = this.heldMeshes.get(f); if (m) { this.scene.remove(m); this.heldMeshes.delete(f); }
    this.spawn('bomb', f.x, f.y + f.h, (Math.random() - 0.5) * 6, 6);
  }
}
