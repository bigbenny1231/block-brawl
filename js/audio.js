// Block Brawl - WebAudio synthesized SFX + music (no external assets)
export class Sound {
  constructor() { this.ctx = null; this.muted = false; this.musicMode = null; this.step = 0; this.nextTime = 0; this.timer = null; }
  init() {
    if (this.ctx) { if (this.ctx.state !== 'running') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain(); this.master.gain.value = 0.8;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(comp); comp.connect(ctx.destination);
    this.sfxG = ctx.createGain(); this.sfxG.gain.value = 0.9; this.sfxG.connect(this.master);
    this.musG = ctx.createGain(); this.musG.gain.value = this.musicOn === false ? 0 : 0.32; this.musG.connect(this.master);
    // reverb send
    this.verb = ctx.createConvolver();
    const len = ctx.sampleRate * 1.8, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    this.verb.buffer = ir; this.verbG = ctx.createGain(); this.verbG.gain.value = 0.35; this.verb.connect(this.verbG); this.verbG.connect(this.master);
    const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.noiseBuf = nb;
    if (this.musicMode) { const m = this.musicMode; this.musicMode = null; this.music(m); }
  }
  setMusic(on) { this.musicOn = on; if (this.musG) this.musG.gain.value = on ? 0.32 : 0; }
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.8; }
  get t() { return this.ctx.currentTime; }
  tone(type, f0, f1, dur, vol, when = 0, dest = null, verb = 0) {
    if (!this.ctx) return; const t = this.t + when; const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfxG); if (verb) { const s = this.ctx.createGain(); s.gain.value = verb; g.connect(s); s.connect(this.verb); }
    o.start(t); o.stop(t + dur + 0.05);
  }
  noise(dur, vol, type, f0, f1, q = 1, when = 0, dest = null, verb = 0) {
    if (!this.ctx) return; const t = this.t + when; const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.sfxG); if (verb) { const sg = this.ctx.createGain(); sg.gain.value = verb; g.connect(sg); sg.connect(this.verb); }
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  sfx(name, k = 1) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'jump': this.tone('sine', 260, 560, 0.12, 0.18); this.noise(0.08, 0.06, 'highpass', 3000, 6000); break;
      case 'djump': this.tone('triangle', 380, 900, 0.16, 0.16); this.noise(0.14, 0.1, 'bandpass', 1500, 5000, 2); break;
      case 'swing': this.noise(0.13, 0.22, 'bandpass', 700, 3200, 1.5); break;
      case 'heavy': this.noise(0.22, 0.32, 'bandpass', 380, 1800, 1.2); this.tone('sine', 120, 70, 0.15, 0.1); break;
      case 'hit': {
        const s = Math.min(1, k);
        this.tone('sine', 170 - s * 40, 45, 0.12 + s * 0.15, 0.5 + s * 0.4);
        this.noise(0.06 + s * 0.12, 0.45 + s * 0.4, 'bandpass', 2400, 600, 0.9);
        this.tone('square', 900, 200, 0.05 + s * 0.05, 0.08 + s * 0.08);
        if (s > 0.55) { this.noise(0.5, 0.3, 'lowpass', 3000, 200, 0.7, 0, null, 0.6); this.tone('sawtooth', 220, 55, 0.35, 0.18, 0, null, 0.4); }
        break;
      }
      case 'shield': this.tone('sine', 1000, 760, 0.12, 0.2); this.tone('sine', 1500, 1300, 0.1, 0.1); break;
      case 'shieldbreak': this.tone('square', 600, 80, 0.6, 0.25, 0, null, 0.5); this.noise(0.5, 0.4, 'highpass', 4000, 800); break;
      case 'land': this.noise(0.07, 0.12, 'lowpass', 500, 200); break;
      case 'ko':
        this.noise(1.6, 0.8, 'lowpass', 2600, 60, 0.8, 0, null, 0.9);
        this.tone('sawtooth', 240, 30, 1.1, 0.4, 0, null, 0.8);
        this.tone('sine', 90, 28, 1.2, 0.7);
        for (let i = 0; i < 6; i++) this.tone('triangle', 1800 + i * 300, 2600 + i * 200, 0.2, 0.05, 0.05 + i * 0.05, null, 0.8);
        break;
      case 'tele': this.tone('sine', 1500, 180, 0.28, 0.22, 0, null, 0.5); this.noise(0.25, 0.15, 'bandpass', 4000, 500, 4); break;
      case 'throw': this.noise(0.15, 0.22, 'bandpass', 900, 2800, 1.5); this.tone('triangle', 300, 500, 0.1, 0.08); break;
      case 'blaster': this.tone('square', 900, 180, 0.15, 0.16); this.tone('sine', 1600, 400, 0.12, 0.12); break;
      case 'boom': this.noise(0.9, 0.9, 'lowpass', 900, 50, 0.7, 0, null, 0.7); this.tone('sine', 85, 26, 0.9, 0.9); this.tone('sawtooth', 120, 40, 0.5, 0.25); break;
      case 'fire': this.noise(0.6, 0.35, 'bandpass', 500, 1500, 0.7, 0, null, 0.3); this.tone('sawtooth', 90, 60, 0.4, 0.12); break;
      case 'rush': this.noise(0.4, 0.3, 'bandpass', 300, 1200, 1); this.tone('sawtooth', 70, 110, 0.3, 0.15); break;
      case 'spin': for (let i = 0; i < 4; i++) this.noise(0.08, 0.18, 'bandpass', 1200 + i * 300, 2600, 2, i * 0.07); break;
      case 'break': this.noise(0.18, 0.3, 'bandpass', 1800, 500, 1.2); this.tone('square', 300, 90, 0.12, 0.1); break;
      case 'respawn': for (let i = 0; i < 5; i++) this.tone('triangle', 520 * Math.pow(1.26, i), 520 * Math.pow(1.26, i), 0.18, 0.08, i * 0.06, null, 0.6); break;
      case 'move': this.tone('square', 660, 660, 0.04, 0.06); break;
      case 'select': this.tone('square', 660, 990, 0.09, 0.1); this.tone('triangle', 1320, 1320, 0.12, 0.06, 0.05); break;
      case 'back': this.tone('square', 500, 300, 0.08, 0.08); break;
      case 'count': this.tone('square', 440, 440, 0.18, 0.14, 0, null, 0.4); this.tone('sine', 880, 880, 0.18, 0.08); break;
      case 'go': [523, 659, 784, 1046].forEach((f, i) => this.tone('sawtooth', f, f, 0.6, 0.08, 0, null, 0.6)); this.noise(0.6, 0.3, 'highpass', 2000, 8000, 0.5, 0, null, 0.6); break;
      case 'game': [392, 494, 587, 784].forEach((f, i) => this.tone('sawtooth', f, f * 0.98, 1.2, 0.08, i * 0.02, null, 0.8)); this.noise(1.2, 0.4, 'lowpass', 3000, 200, 0.7, 0, null, 0.8); break;
      case 'fuse': this.noise(0.12, 0.12, 'highpass', 5000, 7000, 1); break;
      case 'rev': this.tone('sawtooth', 200, 520, 0.12, 0.1); this.noise(0.1, 0.08, 'bandpass', 2000, 4000, 2); break;
      case 'spring': this.tone('square', 200, 1200, 0.22, 0.14); this.tone('sine', 400, 1600, 0.2, 0.1, 0.03); break;
      case 'fireball': this.tone('square', 700, 300, 0.1, 0.12); this.noise(0.12, 0.12, 'bandpass', 1200, 600, 1.5); break;
      case 'coin': this.tone('square', 988, 988, 0.06, 0.09); this.tone('square', 1319, 1319, 0.2, 0.09, 0.06); break;
      case 'web': this.noise(0.14, 0.2, 'highpass', 3000, 1500, 1); this.tone('sine', 1800, 600, 0.1, 0.06); break;
      case 'item': [660, 880, 1320].forEach((f, i) => this.tone('triangle', f, f, 0.12, 0.1, i * 0.05)); break;
      case 'pickup': this.tone('square', 520, 1040, 0.12, 0.12); this.tone('triangle', 1040, 1560, 0.15, 0.08, 0.06); break;
      case 'heal': for (let i = 0; i < 6; i++) this.tone('sine', 600 + i * 120, 640 + i * 120, 0.15, 0.08, i * 0.05); break;
      case 'powerup': for (let i = 0; i < 8; i++) this.tone('square', 300 * Math.pow(1.12, i), 300 * Math.pow(1.12, i), 0.07, 0.07, i * 0.04); break;
      case 'zap': this.tone('sawtooth', 120, 90, 0.4, 0.2); this.noise(0.4, 0.3, 'highpass', 3000, 6000, 1); break;
      case 'levelup': [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone('square', f, f, 0.22, 0.09, i * 0.08, null, 0.6)); break;
      case 'tick': this.tone('square', 1200, 1200, 0.03, 0.05, 0, null, 0.6); break;
      case 'buy': this.tone('square', 988, 988, 0.08, 0.1, 0, null, 0.6); this.tone('square', 1568, 1568, 0.25, 0.1, 0.08, null, 0.6); break;
      case 'cheer': for (let i = 0; i < 30; i++) this.noise(0.4 + Math.random() * 0.5, 0.04, 'bandpass', 800 + Math.random() * 2000, 1000 + Math.random() * 1500, 3, Math.random() * 0.8, null, 0.5); break;
    }
  }
  // ---------- music: simple step sequencer
  music(mode) {
    if (this.musicMode === mode) return;
    this.musicMode = mode;
    if (!this.ctx) return;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (!mode) return;
    this.step = 0; this.nextTime = this.t + 0.08;
    this.timer = setInterval(() => this._sched(), 25);
  }
  _sched() {
    if (!this.ctx || this.muted) { if (this.ctx) this.nextTime = Math.max(this.nextTime, this.t); return; }
    const battle = this.musicMode === 'battle';
    const bpm = battle ? 140 : 100; const sp = 60 / bpm / 4;
    while (this.nextTime < this.t + 0.12) {
      this._note(this.step, this.nextTime - this.t, battle, sp);
      this.nextTime += sp; this.step++;
    }
  }
  _note(step, when, battle, sp) {
    // progression: Am F C G  (minor epic) ; 16 steps per bar
    const bar = Math.floor(step / 16) % 4, s = step % 16;
    const roots = [57, 53, 48, 55]; const r = roots[bar];
    const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
    const M = this.musG;
    // bass
    if (battle ? (s % 2 === 0) : (s % 4 === 0)) {
      const n = r - 12 + ((s % 8 === 6) ? 12 : 0);
      this.tone('sawtooth', mtof(n), mtof(n), sp * 1.8, 0.22, when, M);
    }
    // arp
    const chord = bar === 0 ? [0, 3, 7, 12] : [0, 4, 7, 12];
    if (battle || s % 2 === 0) {
      const n = r + 12 + chord[(s + (bar % 2)) % 4] + (s >= 8 ? 12 : 0) * (battle ? 0 : 0);
      this.tone(battle ? 'square' : 'triangle', mtof(n), mtof(n), sp * 0.9, battle ? 0.045 : 0.06, when, M, 0.3);
    }
    // pad on bar start
    if (s === 0) chord.slice(0, 3).forEach(c => this.tone('triangle', mtof(r + c), mtof(r + c), sp * 15, 0.035, when, M, 0.5));
    // lead melody in battle
    if (battle && (bar % 2 === 1) && [0, 3, 6, 10, 12].includes(s)) {
      const mel = [12, 15, 19, 17, 14][[0, 3, 6, 10, 12].indexOf(s)];
      this.tone('sawtooth', mtof(r + mel + 12), mtof(r + mel + 12), sp * 2.5, 0.04, when, M, 0.5);
    }
    // drums
    if (battle) {
      if (s % 4 === 0) this.tone('sine', 150, 40, 0.16, 0.6, when, M);
      if (s % 8 === 4) this.noise(0.14, 0.28, 'bandpass', 1800, 1200, 0.8, when, M, 0.3);
      if (s % 2 === 1) this.noise(0.03, 0.08, 'highpass', 7000, 7000, 1, when, M);
    } else if (s === 0 || s === 10) this.tone('sine', 120, 40, 0.2, 0.35, when, M);
  }
}
