// Block Brawl v2 - player profile, progression, unlocks, shop, daily challenges (localStorage)
import { CHARS, CHAR_ORDER, PALETTES, HATS } from './characters.js';
import { DEMON_HUNTER_IDS } from './demon-hunters.js';
import { WORKSHOP_IDS } from './workshop-fighters.js';

const KEY = 'bb.profile.v2';
export const KO_FX = { classic: { name: 'CLASSIC BEAM' }, fireworks: { name: 'FIREWORKS' }, lightning: { name: 'THUNDERCLAP' }, confetti: { name: 'CONFETTI' }, voidburst: { name: 'VOID BURST' }, pixels: { name: 'PIXEL SHATTER' } };
export const POSES = { default: { name: 'SIGNATURE' }, cheer: { name: 'VICTORY CHEER' }, dance: { name: 'BLOCK DANCE' }, flex: { name: 'POWER FLEX' }, wave: { name: 'FRIENDLY WAVE' }, spin: { name: 'TORNADO SPIN' } };
export const TITLES = { rookie: 'ROOKIE', brawler: 'BRAWLER', itemhoarder: 'ITEM HOARDER', speedster: 'SPEEDSTER', heavyhitter: 'HEAVY HITTER', champion: 'CHAMPION', bosslayer: 'BOSS SLAYER', legend: 'LEGEND', daily: 'DAILY GRINDER', collector: 'COLLECTOR', untouchable: 'UNTOUCHABLE' };

export const STARTERS = ['blockjack', 'bristle', 'voidwalker', 'gogo', 'malgore', 'bolt', 'pipper', 'venomaw', 'gammoth', ...DEMON_HUNTER_IDS, ...WORKSHOP_IDS];
// Added starters and cosmetics are granted to new and existing saves.
export const STARTER_PACK = {
  chars: ['venomaw', 'gammoth', ...DEMON_HUNTER_IDS, ...WORKSHOP_IDS],
  skin: ['frost', 'crimson', 'gold', 'toxic', 'stonehide'],
  hat: ['crown', 'shades', 'phones'],
  ko: ['fireworks', 'lightning', 'voidburst'],
  pose: ['cheer', 'dance', 'flex'],
  title: ['brawler', 'speedster', 'legend'],
};
// account level rewards
export const LEVEL_REWARDS = {
  2: [{ t: 'char', id: 'fizz' }, { t: 'hat', id: 'party' }],
  3: [{ t: 'char', id: 'rattle' }, { t: 'skin', id: 'frost' }],
  4: [{ t: 'char', id: 'webline' }, { t: 'ko', id: 'fireworks' }],
  5: [{ t: 'char', id: 'ironclad' }, { t: 'title', id: 'brawler' }, { t: 'pose', id: 'cheer' }],
  6: [{ t: 'hat', id: 'shades' }, { t: 'coins', n: 150 }],
  7: [{ t: 'skin', id: 'shadow' }, { t: 'pose', id: 'dance' }],
  8: [{ t: 'ko', id: 'lightning' }, { t: 'hat', id: 'phones' }],
  9: [{ t: 'skin', id: 'crimson' }, { t: 'coins', n: 250 }],
  10: [{ t: 'hat', id: 'crown' }, { t: 'title', id: 'legend' }, { t: 'ko', id: 'voidburst' }],
  12: [{ t: 'skin', id: 'gold' }, { t: 'pose', id: 'spin' }],
  15: [{ t: 'hat', id: 'halo' }, { t: 'coins', n: 500 }],
};
// fighter mastery rewards (per fighter)
export const MASTERY = { 2: 'coins40', 3: 'signature', 5: 'title', 7: 'coins120', 10: 'neon' };
export const SHOP = [
  { t: 'skin', id: 'frost', price: 150 }, { t: 'skin', id: 'crimson', price: 200 }, { t: 'skin', id: 'shadow', price: 250 }, { t: 'skin', id: 'neon', price: 400 }, { t: 'skin', id: 'gold', price: 600 },
  { t: 'hat', id: 'party', price: 100 }, { t: 'hat', id: 'tophat', price: 180 }, { t: 'hat', id: 'propeller', price: 200 }, { t: 'hat', id: 'horns', price: 250 }, { t: 'hat', id: 'shades', price: 220 }, { t: 'hat', id: 'phones', price: 260 }, { t: 'hat', id: 'halo', price: 500 }, { t: 'hat', id: 'crown', price: 800 },
  { t: 'ko', id: 'confetti', price: 250 }, { t: 'ko', id: 'pixels', price: 300 }, { t: 'ko', id: 'fireworks', price: 350 }, { t: 'ko', id: 'lightning', price: 450 }, { t: 'ko', id: 'voidburst', price: 600 },
  { t: 'pose', id: 'wave', price: 120 }, { t: 'pose', id: 'cheer', price: 150 }, { t: 'pose', id: 'flex', price: 200 }, { t: 'pose', id: 'dance', price: 250 }, { t: 'pose', id: 'spin', price: 300 },
  { t: 'title', id: 'speedster', price: 150 }, { t: 'title', id: 'heavyhitter', price: 150 }, { t: 'title', id: 'collector', price: 400 },
  { t: 'char', id: 'fizz', price: 300 }, { t: 'char', id: 'rattle', price: 400 }, { t: 'char', id: 'webline', price: 500 }, { t: 'char', id: 'ironclad', price: 600 },
];
export function rewardName(r) {
  if (r.t === 'char') return 'FIGHTER: ' + CHARS[r.id].name;
  if (r.t === 'skin') return 'SKIN: ' + PALETTES[r.id].name;
  if (r.t === 'hat') return 'HAT: ' + HATS[r.id].name;
  if (r.t === 'ko') return 'KO FX: ' + KO_FX[r.id].name;
  if (r.t === 'pose') return 'POSE: ' + POSES[r.id].name;
  if (r.t === 'title') return 'TITLE: ' + (TITLES[r.id] || r.id.toUpperCase());
  if (r.t === 'coins') return r.n + ' COINS';
  return r.t;
}
export const xpForLevel = n => 120 + (n - 1) * 70;
export const fxpForLevel = n => 90 + (n - 1) * 50;

const QUEST_POOL = [
  { id: 'win', text: n => `Win ${n} matches`, n: [2, 3], reward: 80 },
  { id: 'kos', text: n => `Land ${n} KOs`, n: [8, 12], reward: 70 },
  { id: 'items', text: n => `Grab ${n} power-ups`, n: [5, 8], reward: 60 },
  { id: 'dmg', text: n => `Deal ${n}% damage`, n: [500, 800], reward: 70 },
  { id: 'play', text: n => `Play ${n} matches`, n: [3, 5], reward: 50 },
  { id: 'stage', text: (n, a) => `Win on ${a}`, n: [1], reward: 90, arg: 'stage' },
  { id: 'char', text: (n, a) => `Win as ${a}`, n: [1], reward: 90, arg: 'char' },
  { id: 'classic', text: n => `Clear Classic mode`, n: [1], reward: 150 },
];
function seeded(s) { let a = s; return () => { a = (a * 1664525 + 1013904223) % 4294967296; return a / 4294967296; }; }
const today = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };

function fresh() {
  return {
    v: 2, lvl: 1, xp: 0, coins: 200, fighters: {},
    own: { chars: [...STARTERS], skin: ['default'], hat: ['none'], ko: ['classic'], pose: ['default'], title: ['rookie'] },
    equip: {}, ko: 'classic', pose: 'default', title: 'rookie',
    stats: { games: 0, wins: 0, kos: 0, falls: 0, dmg: 0, items: 0, time: 0, classic: 0, bestCombo: 0, boss: 0 },
    daily: null, settings: { sound: true, music: true, haptics: true, quality: 'auto', tsize: 1, topac: 0.85, lefty: false, dmgNums: true },
    rules: { mode: 'stock', stocks: 3, time: 3, items: 'med', hazards: true, level: 'normal', rivals: [null, null, null], nRivals: 2 },
    last: { char: 'blockjack', stage: 'overworld' }, seenUnlocks: [],
  };
}
export class Profile {
  constructor() { this.d = fresh(); this.load(); this.migrate(); this.ensureDaily(); }
  // add new fighters + the starter cosmetics pack without touching existing progress
  migrate() {
    const own = this.d.own; let changed = false;
    for (const [k, ids] of Object.entries(STARTER_PACK)) {
      const arr = Array.isArray(own[k]) ? own[k] : (own[k] = []);
      for (const id of ids) if (!arr.includes(id)) { arr.push(id); changed = true; }
    }
    if (!this.d.pack3) { this.d.pack3 = true; changed = true; }
    if (changed) this.save();
  }
  load() {
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.v === 2) { const f = fresh(); this.d = { ...f, ...s, own: { ...f.own, ...s.own }, stats: { ...f.stats, ...s.stats }, settings: { ...f.settings, ...s.settings }, rules: { ...f.rules, ...s.rules }, last: { ...f.last, ...s.last } }; } } catch (_) {}
  }
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.d)); } catch (_) {} }
  reset() { this.d = fresh(); this.migrate(); this.ensureDaily(); this.save(); }
  get lvl() { return this.d.lvl; }
  fighter(id) { return this.d.fighters[id] || (this.d.fighters[id] = { xp: 0, lvl: 1, games: 0, wins: 0, kos: 0 }); }
  owns(t, id) { if (t === 'skin') { const p = PALETTES[id]; if (p && p.only) return (this.d.own.skin || []).includes(id); } return (this.d.own[t === 'char' ? 'chars' : t] || []).includes(id); }
  grant(r) {
    if (r.t === 'coins') { this.d.coins += r.n; return true; }
    const k = r.t === 'char' ? 'chars' : r.t; const arr = this.d.own[k] || (this.d.own[k] = []);
    if (arr.includes(r.id)) return false; arr.push(r.id); return true;
  }
  isUnlocked(id) { return this.owns('char', id); }
  unlockHint(id) { for (const [lv, rs] of Object.entries(LEVEL_REWARDS)) for (const r of rs) if (r.t === 'char' && r.id === id) return 'REACH LV ' + lv; return 'LOCKED'; }
  cos(id) { const e = this.d.equip[id] || {}; return { skin: e.skin || 'default', hat: e.hat || 'none', pose: this.d.pose, ko: this.d.ko }; }
  equip(id, t, v) { if (t === 'skin' || t === 'hat') { (this.d.equip[id] || (this.d.equip[id] = {}))[t] = v; } else this.d[t] = v; this.save(); }
  buy(item) {
    if (this.owns(item.t, item.id) || this.d.coins < item.price) return false;
    this.d.coins -= item.price; this.grant(item); this.save(); return true;
  }
  ensureDaily() {
    const t = today();
    if (this.d.daily && this.d.daily.date === t) return;
    const r = seeded(t * 7 + 13); const pool = [...QUEST_POOL]; const qs = [];
    while (qs.length < 3) {
      const q = pool.splice(Math.floor(r() * pool.length), 1)[0];
      const n = q.n[Math.floor(r() * q.n.length)];
      let arg = null;
      if (q.arg === 'stage') arg = ['overworld', 'nether', 'loop', 'castle', 'rooftops'][Math.floor(r() * 5)];
      if (q.arg === 'char') arg = STARTERS[Math.floor(r() * STARTERS.length)];
      qs.push({ id: q.id, n, arg, prog: 0, reward: q.reward, done: false, claimed: false });
    }
    this.d.daily = { date: t, quests: qs }; this.save();
  }
  questText(q, names) { const def = QUEST_POOL.find(p => p.id === q.id); return def.text(q.n, q.arg ? names(q) : ''); }
  // ---- apply a finished match. m = { char, won, kos, falls, dmg, items, stage, classic, classicClear, boss, combo, secs, mode }
  applyMatch(m) {
    const d = this.d, st = d.stats, out = { xp: 0, coins: 0, levelUps: [], fLevelUps: [], quests: [], before: { lvl: d.lvl, xp: d.xp }, fBefore: null };
    if (m.training) return out;
    const xp = Math.round(25 + m.kos * 18 + m.dmg * 0.22 + (m.won ? 70 : 0) + (m.classic ? 30 : 0) + (m.boss ? 120 : 0) + (m.classicClear ? 250 : 0));
    const coins = Math.round(12 + m.kos * 6 + (m.won ? 30 : 0) + (m.boss ? 60 : 0) + (m.classicClear ? 200 : 0));
    out.xp = xp; out.coins = coins;
    st.games++; if (m.won) st.wins++; st.kos += m.kos; st.falls += m.falls; st.dmg += Math.round(m.dmg); st.items += m.items; st.time += m.secs || 0;
    st.bestCombo = Math.max(st.bestCombo, m.combo || 0); if (m.classicClear) st.classic++; if (m.boss && m.won) st.boss++;
    const f = this.fighter(m.char); out.fBefore = { lvl: f.lvl, xp: f.xp };
    f.games++; if (m.won) f.wins++; f.kos += m.kos;
    // account XP
    d.xp += xp;
    while (d.xp >= xpForLevel(d.lvl)) { d.xp -= xpForLevel(d.lvl); d.lvl++; const rs = LEVEL_REWARDS[d.lvl] || [{ t: 'coins', n: 100 }]; const got = rs.filter(r => this.grant(r)); out.levelUps.push({ lvl: d.lvl, rewards: got }); }
    // fighter mastery
    f.xp += xp;
    while (f.lvl < 10 && f.xp >= fxpForLevel(f.lvl)) {
      f.xp -= fxpForLevel(f.lvl); f.lvl++; const rew = []; const k = MASTERY[f.lvl];
      if (k === 'coins40') { this.grant({ t: 'coins', n: 40 }); rew.push({ t: 'coins', n: 40 }); }
      if (k === 'coins120') { this.grant({ t: 'coins', n: 120 }); rew.push({ t: 'coins', n: 120 }); }
      if (k === 'signature') { const sig = Object.entries(PALETTES).find(([pid, p]) => p.only === m.char); if (sig && this.grant({ t: 'skin', id: sig[0] })) rew.push({ t: 'skin', id: sig[0] }); }
      if (k === 'title') { const tid = m.char + 'main'; TITLES[tid] = CHARS[m.char].name + ' MAIN'; if (this.grant({ t: 'title', id: tid })) rew.push({ t: 'title', id: tid }); }
      if (k === 'neon') { if (this.grant({ t: 'skin', id: 'neon' })) rew.push({ t: 'skin', id: 'neon' }); }
      out.fLevelUps.push({ lvl: f.lvl, rewards: rew });
    }
    if (f.lvl >= 10) f.xp = Math.min(f.xp, fxpForLevel(10));
    d.coins += coins;
    if (st.items >= 50) this.grant({ t: 'title', id: 'itemhoarder' });
    if (m.classicClear) this.grant({ t: 'title', id: 'champion' });
    if (m.boss && m.won) this.grant({ t: 'title', id: 'bosslayer' });
    if (m.won && m.falls === 0) this.grant({ t: 'title', id: 'untouchable' });
    // quests
    this.ensureDaily();
    for (const q of d.daily.quests) {
      if (q.done) continue;
      const add = { win: m.won ? 1 : 0, kos: m.kos, items: m.items, dmg: Math.round(m.dmg), play: 1, stage: m.won && m.stage === q.arg ? 1 : 0, char: m.won && m.char === q.arg ? 1 : 0, classic: m.classicClear ? 1 : 0 }[q.id] || 0;
      q.prog = Math.min(q.n, q.prog + add);
      if (q.prog >= q.n) { q.done = true; out.quests.push(q); }
    }
    d.last.char = m.char; this.save();
    return out;
  }
  claim(q) { if (!q.done || q.claimed) return 0; q.claimed = true; this.d.coins += q.reward; if (this.d.daily.quests.every(x => x.claimed)) this.grant({ t: 'title', id: 'daily' }); this.save(); return q.reward; }
}
export function titleName(id) { if (TITLES[id]) return TITLES[id]; if (id && id.endsWith('main') && CHARS[id.slice(0, -4)]) return CHARS[id.slice(0, -4)].name + ' MAIN'; return (id || '').toUpperCase(); }
