// Block Brawl - keyboard + multi-touch virtual controls
export class Input {
  constructor() {
    this.keys = new Set(); this.edge = new Set();
    this.btnHeld = { attack: 0, special: 0, jump: 0, shield: 0, grab: 0 }; this.haptics = true; this.btnEdge = new Set();
    this.joy = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };
    this.prevY = 0; this.prevX = 0; this.yHist = [];
    this.override = null; this.usingTouch = false;
    const map = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', ' ': 'jump', j: 'attack', z: 'attack', g: 'grab', v: 'grab', k: 'special', x: 'special', l: 'shield', shift: 'shield', c: 'shield' };
    this.map = map;
    addEventListener('keydown', e => {
      const k = map[e.key.toLowerCase()]; if (!k) return;
      if (e.key === ' ' && e.target.closest?.('#select.show button')) return;
      if (!e.repeat) { this.edge.add(k); }
      this.keys.add(k); if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();
    });
    addEventListener('keyup', e => { const k = map[e.key.toLowerCase()]; if (k) this.keys.delete(k); });
    addEventListener('blur', () => { this.keys.clear(); for (const b in this.btnHeld) this.btnHeld[b] = 0; this.joy.active = false; });
  }
  bindTouch(root) {
    const zone = root.querySelector('#joyzone'), base = root.querySelector('#joybase'), knob = root.querySelector('#joyknob');
    this.joyEls = { zone, base, knob };
    const R = 56;
    const setKnob = () => { const j = this.joy; knob.style.transform = `translate(${j.x * R}px, ${-j.y * R}px)`; };
    zone.addEventListener('pointerdown', e => {
      e.preventDefault(); this.usingTouch = true;
      if (this.joy.active) return;
      const j = this.joy; j.active = true; j.id = e.pointerId; j.ox = e.clientX; j.oy = e.clientY; j.x = 0; j.y = 0;
      base.style.left = (e.clientX - 70) + 'px'; base.style.top = (e.clientY - 70) + 'px'; base.classList.add('on');
      try { zone.setPointerCapture(e.pointerId); } catch (_) {}
      setKnob();
    });
    const move = e => {
      const j = this.joy; if (!j.active || e.pointerId !== j.id) return;
      let dx = (e.clientX - j.ox) / R, dy = -(e.clientY - j.oy) / R;
      const m = Math.hypot(dx, dy);
      if (m > 1) {
        // drag the base along (floating stick)
        const over = (m - 1) * R; j.ox += (dx / m) * over; j.oy -= (dy / m) * over;
        base.style.left = (j.ox - 70) + 'px'; base.style.top = (j.oy - 70) + 'px';
        dx /= m; dy /= m;
      }
      j.x = dx; j.y = dy; setKnob();
    };
    const up = e => { const j = this.joy; if (e.pointerId !== j.id) return; j.active = false; j.x = j.y = 0; base.classList.remove('on'); setKnob(); };
    zone.addEventListener('pointermove', move); zone.addEventListener('pointerup', up); zone.addEventListener('pointercancel', up); zone.addEventListener('lostpointercapture', up);
    root.querySelectorAll('[data-btn]').forEach(el => {
      const b = el.dataset.btn; const ids = new Set();
      el.addEventListener('pointerdown', e => { e.preventDefault(); this.usingTouch = true; ids.add(e.pointerId); try { el.setPointerCapture(e.pointerId); } catch (_) {} if (!this.btnHeld[b]) this.btnEdge.add(b); this.btnHeld[b] = ids.size; el.classList.add('down'); if (this.haptics && navigator.vibrate) try { navigator.vibrate(8); } catch (_) {} });
      const rel = e => { if (!ids.has(e.pointerId)) return; ids.delete(e.pointerId); this.btnHeld[b] = ids.size; if (!ids.size) el.classList.remove('down'); };
      el.addEventListener('pointerup', rel); el.addEventListener('pointercancel', rel); el.addEventListener('lostpointercapture', rel);
      el.addEventListener('contextmenu', e => e.preventDefault());
    });
  }
  poll() {
    if (this.override) { const o = this.override(); if (o) return o; }
    const K = this.keys, E = this.edge, B = this.btnHeld, BE = this.btnEdge;
    let x = (K.has('right') ? 1 : 0) - (K.has('left') ? 1 : 0);
    let y = (K.has('up') ? 1 : 0) - (K.has('down') ? 1 : 0);
    if (this.joy.active) {
      const dz = 0.2; let jx = this.joy.x, jy = this.joy.y; const m = Math.hypot(jx, jy);
      if (m < dz) { jx = 0; jy = 0; } else { const s = Math.min(1, (m - dz) / (1 - dz)) / m; jx *= s; jy *= s; }
      x = jx; y = jy;
    }
    const keyUpTap = E.has('up');
    const yTap = (y > 0.7 && this.prevY < 0.45);
    const downTap = (y < -0.7 && this.prevY > -0.45) || E.has('down');
    const xTap = (Math.abs(x) > 0.7 && Math.abs(this.prevX) < 0.45) || E.has('left') || E.has('right');
    this.prevY = y; this.prevX = x;
    const out = {
      x, y,
      attackP: E.has('attack') || BE.has('attack') || BE.has('grab') || E.has('grab'),
      specialP: E.has('special') || BE.has('special'),
      jumpP: E.has('jump') || BE.has('jump') || keyUpTap || (this.joy.active && yTap),
      jumpH: K.has('jump') || B.jump > 0 || K.has('up') || (this.joy.active && y > 0.6),
      shieldH: K.has('shield') || B.shield > 0 || BE.has('grab') || E.has('grab'),
      shieldP: E.has('shield') || BE.has('shield'),
      xTap, downTap,
    };
    // tap-jump shouldn't fire when the player is doing an up-attack/up-special this frame
    if ((out.attackP || out.specialP) && (keyUpTap || yTap) && !E.has('jump') && !BE.has('jump')) out.jumpP = false;
    E.clear(); BE.clear();
    return out;
  }
  anyPressed() { return this.edge.size > 0 || this.btnEdge.size > 0; }
  clear() { this.edge.clear(); this.btnEdge.clear(); }
}
