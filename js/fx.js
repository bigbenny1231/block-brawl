// Block Brawl - particles, sparks, shockwaves, KO blasts
import * as THREE from 'three';

const MAX = 2200;
export class FX {
  constructor(scene) {
    this.scene = scene;
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(MAX * 3); this.col = new Float32Array(MAX * 4); this.size = new Float32Array(MAX);
    this.vel = new Float32Array(MAX * 3); this.life = new Float32Array(MAX); this.max = new Float32Array(MAX);
    this.base = new Float32Array(MAX * 3); this.grav = new Float32Array(MAX); this.drag = new Float32Array(MAX); this.s0 = new Float32Array(MAX); this.grow = new Float32Array(MAX);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('acolor', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('size', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo = g;
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
      uniforms: { scale: { value: 400 } },
      vertexShader: `attribute float size; attribute vec4 acolor; varying vec4 vC; uniform float scale;
        void main(){ vC = acolor; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = clamp(size*scale/max(-mv.z,0.5), 0.0, 180.0); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `varying vec4 vC; void main(){ vec2 d = gl_PointCoord-0.5; float r = length(d); float a = smoothstep(0.5, 0.0, r); a = a*a; gl_FragColor = vec4(vC.rgb*a*vC.a, 1.0); }`,
    });
    // smoke uses normal blending
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; this.points.renderOrder = 5;
    scene.add(this.points);
    this.n = 0; this.cursor = 0;
    // smoke layer (normal blending) for dust clouds
    const SM = 400; this.SM = SM;
    const sg = new THREE.BufferGeometry();
    this.sp = new Float32Array(SM * 3); this.sv = new Float32Array(SM * 3); this.sc = new Float32Array(SM * 4); this.ss = new Float32Array(SM); this.sl = new Float32Array(SM); this.sm = new Float32Array(SM); this.s0s = new Float32Array(SM); this.sbase = new Float32Array(SM * 3);
    sg.setAttribute('position', new THREE.BufferAttribute(this.sp, 3).setUsage(THREE.DynamicDrawUsage));
    sg.setAttribute('acolor', new THREE.BufferAttribute(this.sc, 4).setUsage(THREE.DynamicDrawUsage));
    sg.setAttribute('size', new THREE.BufferAttribute(this.ss, 1).setUsage(THREE.DynamicDrawUsage));
    this.sgeo = sg; this.scur = 0;
    this.smat = this.mat.clone(); this.smat.blending = THREE.NormalBlending; this.smat.uniforms = this.mat.uniforms;
    this.smat.fragmentShader = `varying vec4 vC; void main(){ vec2 d = gl_PointCoord-0.5; float r = length(d); float a = smoothstep(0.5, 0.15, r); gl_FragColor = vec4(vC.rgb, vC.a*a*0.55); }`;
    this.smoke = new THREE.Points(sg, this.smat); this.smoke.frustumCulled = false; this.smoke.renderOrder = 4; scene.add(this.smoke);
    // rings & flashes
    this.rings = [];
    const ringGeo = new THREE.RingGeometry(0.7, 1, 40);
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }));
      m.visible = false; m.renderOrder = 6; scene.add(m); this.rings.push({ m, t: 0, d: 1, s: 1, active: false });
    }
    this.flashes = [];
    const starTex = makeStarTex();
    for (let i = 0; i < 10; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      s.visible = false; s.renderOrder = 7; scene.add(s); this.flashes.push({ s, t: 0, d: 1, size: 1, active: false, rot: 0 });
    }
    this.beams = [];
    const beamGeo = new THREE.ConeGeometry(1, 1, 24, 1, true); beamGeo.translate(0, -0.5, 0);
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }));
      m.visible = false; scene.add(m); this.beams.push({ m, t: 0, d: 1, active: false });
    }
  }
  setScale(px) { this.mat.uniforms.scale.value = px; }
  spawn(x, y, z, vx, vy, vz, r, g, b, life, size, grav = 0, drag = 0.0, grow = 0) {
    const i = this.cursor; this.cursor = (this.cursor + 1) % MAX;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.base[i * 3] = r; this.base[i * 3 + 1] = g; this.base[i * 3 + 2] = b;
    this.life[i] = life; this.max[i] = life; this.s0[i] = size; this.grav[i] = grav; this.drag[i] = drag; this.grow[i] = grow;
  }
  burst(x, y, z, color, n, speed, life = 0.5, size = 0.35, opts = {}) {
    const c = new THREE.Color(color); const k = opts.bright ?? 2.2;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.5) * (opts.flat ? 0.6 : 2.4);
      const sp = speed * (0.35 + Math.random() * 0.75);
      const dir = opts.dir;
      let vx = Math.cos(a) * Math.cos(e) * sp, vy = Math.sin(a) * Math.cos(e) * sp, vz = Math.sin(e) * sp * 0.6;
      if (dir) { vx = vx * 0.45 + dir[0] * sp; vy = vy * 0.45 + dir[1] * sp; }
      this.spawn(x, y, z, vx, vy + (opts.up || 0), vz, c.r * k, c.g * k, c.b * k, life * (0.6 + Math.random() * 0.6), size * (0.6 + Math.random() * 0.8), opts.grav ?? 0, opts.drag ?? 3, opts.grow ?? -0.5);
    }
  }
  hitSpark(x, y, strength, color = '#ffffff', dir = null) {
    const s = Math.min(1.6, 0.4 + strength / 18);
    this.burst(x, y, 0.4, '#ffffff', Math.floor(8 + 12 * s), 15 * s, 0.22, 0.22 * s, { drag: 6, bright: 1.8 });
    this.burst(x, y, 0.4, color, Math.floor(8 + 18 * s), 11 * s, 0.4, 0.3 * s, { drag: 4, bright: 1.6, dir });
    this.flash(x, y, 0.6, 1.6 * s + 0.5, 0.14 + 0.05 * s, '#ffffff');
    this.flash(x, y, 0.5, 2.4 * s, 0.2, color);
    if (strength > 9) this.ring(x, y, 0.3, 3.0 * s, 0.3, color);
  }
  dust(x, y, n = 8, color = '#d8c8b0', spread = 1) {
    const c = new THREE.Color(color);
    for (let i = 0; i < n; i++) {
      const d = (Math.random() - 0.5) * 2, j = this.scur; this.scur = (this.scur + 1) % this.SM;
      this.sp[j * 3] = x + d * 0.4 * spread; this.sp[j * 3 + 1] = y + 0.15; this.sp[j * 3 + 2] = (Math.random() - 0.5) * 1.2 + 0.3;
      this.sv[j * 3] = d * 3 * spread; this.sv[j * 3 + 1] = Math.random() * 1.6; this.sv[j * 3 + 2] = (Math.random() - 0.5);
      this.sbase[j * 3] = c.r; this.sbase[j * 3 + 1] = c.g; this.sbase[j * 3 + 2] = c.b;
      this.sl[j] = this.sm[j] = 0.5 + Math.random() * 0.35; this.s0s[j] = 0.5 + Math.random() * 0.4;
    }
  }
  trail(x, y, color, size = 0.6) {
    const c = new THREE.Color(color);
    this.spawn(x + (Math.random() - 0.5) * 0.3, y + (Math.random() - 0.5) * 0.3, 0.1, 0, 0, 0, c.r * 1.3, c.g * 1.3, c.b * 1.3, 0.45, size, 0, 0, -0.8);
    this.spawn(x, y, 0.15, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 0, 1.2, 1.2, 1.2, 0.2, size * 0.45, 0, 0, -1);
  }
  fire(x, y, z, n = 4, scale = 1) {
    for (let i = 0; i < n; i++) {
      const hot = Math.random();
      this.spawn(x + (Math.random() - 0.5) * 0.5 * scale, y, z + (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 1.2, 2 + Math.random() * 3 * scale, 0,
        1.9, 0.55 + hot * 0.6, 0.1 + hot * 0.12, 0.45 + Math.random() * 0.4, (0.3 + Math.random() * 0.3) * scale, 1.5, 1, -0.4);
    }
  }
  ring(x, y, z, size, dur, color, flat = false) {
    const r = this.rings.find(r => !r.active) || this.rings[0];
    r.active = true; r.t = 0; r.d = dur; r.s = size; r.m.visible = true; r.m.position.set(x, y, z);
    r.m.material.color.set(color).multiplyScalar(1.6);
    r.m.rotation.set(flat ? -Math.PI / 2 : 0, 0, 0);
    r.m.scale.setScalar(0.01);
  }
  flash(x, y, z, size, dur, color) {
    const f = this.flashes.find(f => !f.active) || this.flashes[0];
    f.active = true; f.t = 0; f.d = dur; f.size = size; f.s.visible = true; f.s.position.set(x, y, z);
    f.s.material.color.set(color).multiplyScalar(1.3); f.s.material.rotation = Math.random() * Math.PI;
  }
  koBlast(x, y, dirx, diry, color) {
    const b = this.beams.find(b => !b.active) || this.beams[0];
    b.active = true; b.t = 0; b.d = 1.3; b.m.visible = true;
    b.m.position.set(x, y, 0);
    // cone points along -y local; orient so it extends toward the stage
    const ang = Math.atan2(diry, dirx);
    b.m.rotation.set(0, 0, ang + Math.PI / 2);
    b.m.material.color.set(color).multiplyScalar(2.8);
    this.burst(x, y, 0, color, 110, 26, 1.1, 0.7, { drag: 1.5, bright: 2.2, dir: [dirx, diry] });
    this.burst(x, y, 0, '#ffffff', 50, 18, 0.7, 0.45, { drag: 2, bright: 2 });
    this.ring(x, y, 0, 6, 0.6, color);
  }
  update(dt) {
    let alive = 0;
    const p = this.pos, v = this.vel, col = this.col, sz = this.size;
    for (let i = 0; i < MAX; i++) {
      if (this.life[i] <= 0) { if (sz[i] !== 0) { sz[i] = 0; col[i * 4 + 3] = 0; } continue; }
      alive++;
      this.life[i] -= dt;
      const k = Math.max(0, this.life[i] / this.max[i]);
      const dr = Math.max(0, 1 - this.drag[i] * dt);
      v[i * 3] *= dr; v[i * 3 + 1] = v[i * 3 + 1] * dr - this.grav[i] * dt * 9; v[i * 3 + 2] *= dr;
      p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt;
      col[i * 4] = this.base[i * 3]; col[i * 4 + 1] = this.base[i * 3 + 1]; col[i * 4 + 2] = this.base[i * 3 + 2];
      col[i * 4 + 3] = Math.min(1, k * 1.6);
      sz[i] = Math.max(0, this.s0[i] * (1 + this.grow[i] * (1 - k)));
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.acolor.needsUpdate = true; this.geo.attributes.size.needsUpdate = true;
    for (let j = 0; j < this.SM; j++) {
      if (this.sl[j] <= 0) { if (this.ss[j] !== 0) { this.ss[j] = 0; this.sc[j * 4 + 3] = 0; } continue; }
      this.sl[j] -= dt; const k = Math.max(0, this.sl[j] / this.sm[j]); const dr = Math.max(0, 1 - 3 * dt);
      this.sv[j * 3] *= dr; this.sv[j * 3 + 1] = this.sv[j * 3 + 1] * dr + dt * 0.6; this.sv[j * 3 + 2] *= dr;
      for (let a = 0; a < 3; a++) this.sp[j * 3 + a] += this.sv[j * 3 + a] * dt;
      this.sc[j * 4] = this.sbase[j * 3]; this.sc[j * 4 + 1] = this.sbase[j * 3 + 1]; this.sc[j * 4 + 2] = this.sbase[j * 3 + 2]; this.sc[j * 4 + 3] = k;
      this.ss[j] = this.s0s[j] * (1 + 1.5 * (1 - k));
    }
    this.sgeo.attributes.position.needsUpdate = true; this.sgeo.attributes.acolor.needsUpdate = true; this.sgeo.attributes.size.needsUpdate = true;
    for (const r of this.rings) {
      if (!r.active) continue; r.t += dt; const k = r.t / r.d;
      if (k >= 1) { r.active = false; r.m.visible = false; continue; }
      const e = 1 - Math.pow(1 - k, 3); r.m.scale.setScalar(0.2 + e * r.s); r.m.material.opacity = (1 - k);
    }
    for (const f of this.flashes) {
      if (!f.active) continue; f.t += dt; const k = f.t / f.d;
      if (k >= 1) { f.active = false; f.s.visible = false; continue; }
      f.s.scale.setScalar(f.size * (0.6 + k * 0.8)); f.s.material.opacity = 1 - k;
    }
    for (const b of this.beams) {
      if (!b.active) continue; b.t += dt; const k = b.t / b.d;
      if (k >= 1) { b.active = false; b.m.visible = false; continue; }
      const e = 1 - Math.pow(1 - Math.min(1, k * 4), 2);
      b.m.scale.set(2.4 * (1 - k) + 0.3, 40 * e, 2.4 * (1 - k) + 0.3); b.m.material.opacity = (1 - k);
    }
    return alive;
  }
  clear() { this.life.fill(0); this.sl.fill(0); for (const r of this.rings) { r.active = false; r.m.visible = false; } for (const f of this.flashes) { f.active = false; f.s.visible = false; } for (const b of this.beams) { b.active = false; b.m.visible = false; } }
}

function makeStarTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.15, 'rgba(255,255,255,0.8)'); grd.addColorStop(0.4, 'rgba(255,255,255,0.15)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  g.globalCompositeOperation = 'lighter';
  g.translate(64, 64);
  for (let i = 0; i < 4; i++) {
    g.rotate(Math.PI / 4);
    const l = i % 2 ? 40 : 62;
    const gr = g.createLinearGradient(-l, 0, l, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(-l, 0); g.lineTo(0, -3.5); g.lineTo(l, 0); g.lineTo(0, 3.5); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
