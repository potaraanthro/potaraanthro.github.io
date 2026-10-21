// The first battle: the Ghost of the Past blocks the way out of the old town.
// Its attacks are Despair, Hopelessness and Redundancy; the visitor answers with Optimism and Creativity,
// "You're right, it's useless" does nothing (it makes the ghost stronger), and Unlock Empathy, once its gloom is thin enough,
// turns the ghost back into who it really was: Yasin, the founder.
import { LW as W, LH as H, wait, after, tween, fx } from './core.js';
import { P, person, drawPerson, sheet, text, textW } from './art.js';
import { S } from '../data/script.js';
import { say, choose, closeDialogue, moveCard, hideMoveCard } from './ui.js';
import { audio } from './audio.js';

const GX = 232, GY = 88;             // the ghost's platform (centre, top)
const YX = 84, YY = 122;             // the visitor's platform (high enough to clear the dialogue box)
const lerp = (a, b, k) => a + (b - a) * k;

let whiteC = null;                   // the ghost as a white silhouette, for hit flashes and the reveal
function white(gi) {
  if (whiteC || !gi) return whiteC;
  const c = document.createElement('canvas'); c.width = gi.width; c.height = gi.height; const g = c.getContext('2d');
  g.drawImage(gi, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
  return whiteC = c;
}

function sunset(g, t, a) {
  g.globalAlpha = a;
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1e1b4b'); sky.addColorStop(.55, '#9d174d'); sky.addColorStop(1, '#f59e0b'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 6; i++) g.fillRect(((t / 40 + i * 70) % 380) - 40, 18 + i * 9, 50, 2);
  g.fillStyle = '#fde68a'; g.beginPath(); g.arc(250, 104, 30, Math.PI, 0); g.fill();
  g.fillStyle = '#134e4a'; g.fillRect(0, 104, W, 76); g.fillStyle = '#0f766e'; for (let x = 0; x < W; x += 6) g.fillRect(x, 102 + (x % 12 ? 0 : 2), 3, 4);
  g.globalAlpha = 1;
}
function night(g, t) {
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#05070f'); sky.addColorStop(.6, '#141b2e'); sky.addColorStop(1, '#242d45'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  // a sick moon behind thin cloud
  g.fillStyle = 'rgba(199,210,254,.12)'; g.beginPath(); g.arc(58, 34, 22, 0, 7); g.fill();
  g.fillStyle = '#d9def0'; g.beginPath(); g.arc(58, 34, 12, 0, 7); g.fill(); g.fillStyle = '#b8bfd6'; g.fillRect(52, 30, 3, 3); g.fillRect(60, 37, 4, 2);
  g.fillStyle = 'rgba(20,26,44,.85)'; for (let i = 0; i < 4; i++) g.fillRect(((t / 70 + i * 97) % 400) - 60, 26 + i * 7, 70, 4);
  // the old town on the horizon: dark roofs, a few weak windows, one pair of red eyes
  const houses = [[0, 92, 34], [30, 84, 26], [58, 96, 30], [90, 88, 22], [116, 98, 36], [150, 90, 28], [180, 100, 30], [212, 94, 24], [238, 86, 34], [274, 96, 26], [298, 90, 30]];
  for (const [x, y, w] of houses) {
    g.fillStyle = '#0b0f1a'; g.fillRect(x, y, w, 118 - y); g.beginPath(); g.moveTo(x - 2, y); g.lineTo(x + w / 2, y - 9); g.lineTo(x + w + 2, y); g.fill();
    for (let i = 0; i < 2; i++) { const lit = ((x * 7 + i * 13 + (t / 2200 | 0)) % 5) === 0; g.fillStyle = lit ? '#b49a4e' : '#1b2234'; g.fillRect(x + 5 + i * (w - 14), y + 6, 4, 4); }
  }
  if (Math.sin(t / 1300) > .7) { g.fillStyle = '#ff3b3b'; g.fillRect(155, 97, 2, 1); g.fillRect(159, 97, 2, 1); }
  g.fillStyle = '#1a2131'; g.fillRect(0, 118, W, 62); g.fillStyle = '#232c40'; for (let x = 0; x < W; x += 6) g.fillRect(x, 116 + (x % 12 ? 0 : 2), 3, 4);
  // fog and rain
  for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(190,200,228,.06)'; g.fillRect(((t / (60 + i * 15) + i * 120) % (W + 160)) - 140, 108 + i * 14, 140, 9); }
  g.fillStyle = 'rgba(190,204,238,.3)';
  for (let i = 0; i < 70; i++) { const rx = ((i * 41.3 + t * .08) % (W + 20)) - 10, ry = ((i * 29.7 + t * .4) % (H + 10)) - 5; g.fillRect(rx | 0, ry | 0, 1, 3); g.fillRect((rx | 0) - 1, (ry | 0) + 3, 1, 2); }
  const ph = t % 6100; if (ph < 55 || (ph > 120 && ph < 160)) { g.fillStyle = 'rgba(214,224,255,.22)'; g.fillRect(0, 0, W, H); }
}

export function ghostScene(lookKey) {
  const s = {
    legacy: true, t: 0, phase: 'ghost', gloom: 1, resolve: 1, show: { gloom: 1, resolve: 1 }, hit: 0, hurt: 0, grow: 0, glow: 0, reveal: 0, sun: 0, duoT: 0, lv: 1, parts: [],
    update(dt) {
      this.t += dt;
      for (const k of ['gloom', 'resolve']) this.show[k] += (this[k] - this.show[k]) * Math.min(1, dt / 220);
      this.hit = Math.max(0, this.hit - dt); this.hurt = Math.max(0, this.hurt - dt); this.grow = Math.max(0, this.grow - dt / 1400);
      for (const p of this.parts) { p.t += dt; if (p.vx !== undefined) { p.x += p.vx * dt / 16; p.y += p.vy * dt / 16; p.vy += (p.g || 0) * dt / 16; } }
      this.parts = this.parts.filter(p => p.t < p.life);
      if (this.phase === 'yasin') this.sun = Math.min(1, this.sun + dt / 1100);
    },
    // particle bursts for each move
    burst(kind) {
      const P0 = { x: YX + 10, y: YY - 40 }, P1 = { x: GX, y: GY - 40 }, add = o => this.parts.push({ t: 0, ...o });
      if (kind === 'sun') for (let i = 0; i < 18; i++) add({ kind, life: 650 + i * 22, delay: i * 22, a: P0, b: P1, arc: 18 + (i % 5) * 6, c: i % 3 ? '#ffd60a' : '#fff6c2' });
      if (kind === 'idea') for (let i = 0; i < 26; i++) { const an = Math.random() * 6.28, sp = 1 + Math.random() * 2.4; add({ kind: 'bit', life: 700 + Math.random() * 300, x: P1.x, y: P1.y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 1, g: .06, c: ['#f472b6', '#22d3ee', '#ffd60a', '#a855f7', '#4ade80'][i % 5], sz: 2 + (i % 2) }); }
      if (kind === 'drip') for (let i = 0; i < 10; i++) add({ kind, life: 900, delay: i * 50, a: P0, b: P1, arc: 4, c: '#64748b' });
      if (kind === 'gloom') for (let i = 0; i < 22; i++) add({ kind, life: 700 + i * 18, delay: i * 18, a: { x: GX, y: GY - 36 }, b: { x: YX + 18, y: YY - 36 }, arc: -10 - (i % 4) * 7, c: i % 2 ? '#312e81' : '#7c3aed' });
      if (kind === 'heart') for (let i = 0; i < 12; i++) add({ kind, life: 1300, delay: i * 70, a: P0, b: P1, arc: 30 + (i % 3) * 10, c: i % 2 ? '#f472b6' : '#fda4af' });
    },
    render(g) {
      const t = this.t;
      if (this.sun < 1) night(g, t);
      if (this.sun > 0) sunset(g, t, this.sun);
      const ell = (x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };
      const pc = (a, b) => this.sun ? (this.sun > .5 ? b : a) : a;
      ell(GX, GY - 6, 52, 12, pc('#232c40', '#0f766e')); ell(GX, GY - 8, 48, 9, pc('#334058', '#2f9e86'));
      ell(YX, YY, 64, 14, pc('#232c40', '#0f766e')); ell(YX, YY - 2, 60, 11, pc('#334058', '#2f9e86'));
      // the ghost (or, after the reveal, Yasin and his wolf)
      const gi = sheet('battle-ghost');
      if (this.phase !== 'yasin' && gi) {
        const fy = Math.round(Math.sin(t / 600) * 3) - 2, dx = this.hit > 0 ? ((t / 40 | 0) % 2 ? 3 : -3) : (this.reveal > 0 ? Math.round(Math.sin(t / 25) * this.reveal * 2) : 0);
        const sc = 1 + this.grow * .08, w = gi.width, h = gi.height, x0 = Math.round(GX - w * sc / 2) + dx, y0 = Math.round(GY - 4 - h * sc) + fy;
        // fax pages orbiting it: the ones behind first
        const pages = d => { for (let i = 0; i < 4; i++) { const a = t / 900 + i * 1.571, front = Math.sin(a) > 0; if (front !== d) continue; const px = Math.round(GX + Math.cos(a) * 34), py = Math.round(GY - 46 + Math.sin(a) * 9 + Math.sin(t / 300 + i) * 2);
          g.globalAlpha = front ? .85 : .45; g.fillStyle = P.ink; g.fillRect(px - 1, py - 1, 7, 9); g.fillStyle = '#cbd5e1'; g.fillRect(px, py, 5, 7); g.fillStyle = '#64748b'; g.fillRect(px + 1, py + 2, 3, 1); g.fillRect(px + 1, py + 4, 3, 1); g.globalAlpha = 1; } };
        pages(false);
        let a = .8 + .12 * Math.sin(t / 170); if ((t / 90 | 0) % 41 === 0) a = .35;
        g.globalAlpha = Math.max(a, this.reveal);
        for (let r = 0; r < h; r++) { const off = Math.round(Math.sin(t / 240 + r / 5) * (r > 44 ? 1 + (r - 44) / 10 : .4)); g.drawImage(gi, 0, r, w, 1, x0 + off, y0 + Math.round(r * sc), Math.round(w * sc), Math.ceil(sc)); }
        const wf = Math.max(this.hit / 420 * .8, this.reveal, this.glow);
        if (wf > 0) { g.globalAlpha = wf; g.drawImage(white(gi), x0, y0, Math.round(w * sc), Math.round(h * sc)); }
        g.globalAlpha = 1;
        pages(true);
      } else if (this.phase === 'yasin') {
        const duo = sheet('battle-yasin-wolf'), k = Math.min(1, (t - this.duoT) / 320), sq = k < 1 ? Math.sin(k * Math.PI) * .1 : 0, yb = k >= 1 ? Math.round(Math.sin(t / 400) * 1.5) : 0;
        if (duo) { const w = Math.round(duo.width * (1 + sq)), h = Math.round(duo.height * (1 - sq)); g.drawImage(duo, Math.round(GX - w / 2), GY - 4 - h + yb, w, h); }
        else drawPerson(g, person('yasin', 0, 0), GX - 27, GY - 82 + yb, 54, 78);
      }
      // the visitor and Nixy, from behind
      const hb = lookKey === 'hero' && sheet('battle-hero-back'), nb = sheet('battle-nixy-back'), bob = Math.round(Math.sin(t / 300) * 1.5);
      const hurtX = this.hurt > 0 ? ((t / 40 | 0) % 2 ? 2 : -2) : 0;
      if (this.hurt > 0 && (t / 70 | 0) % 2) g.globalAlpha = .45;
      if (hb) g.drawImage(hb, Math.round(YX - 20 - hb.width / 2) + hurtX, YY - hb.height);
      else { const ps = person(lookKey, 3, 0); g.drawImage(ps, Math.round(YX - 20 - ps.width) + hurtX, YY - ps.height * 2, ps.width * 2, ps.height * 2); } // whole-pixel 2x, never a blurry stretch
      g.globalAlpha = 1;
      if (nb) g.drawImage(nb, Math.round(YX + 28 - nb.width / 2), YY + 2 - nb.height + bob); else { const ns = person('nixy', 3, 0); g.drawImage(ns, Math.round(YX + 28 - ns.width), YY - ns.height * 2 + bob, ns.width * 2, ns.height * 2); }
      // particles
      for (const p of this.parts) {
        if (p.kind === 'bit') { g.fillStyle = p.c; g.globalAlpha = 1 - p.t / p.life; g.fillRect(p.x | 0, p.y | 0, p.sz, p.sz); g.globalAlpha = 1; continue; }
        const k = Math.max(0, Math.min(1, (p.t - (p.delay || 0)) / (p.life - (p.delay || 0) - 60))); if (p.t < (p.delay || 0)) continue;
        const x = lerp(p.a.x, p.b.x, k), y = lerp(p.a.y, p.b.y, k) - Math.sin(k * Math.PI) * p.arc;
        g.fillStyle = p.c;
        if (p.kind === 'heart') { const hx = x | 0, hy = y | 0; g.fillRect(hx - 2, hy - 1, 2, 2); g.fillRect(hx + 1, hy - 1, 2, 2); g.fillRect(hx - 2, hy, 5, 2); g.fillRect(hx - 1, hy + 2, 3, 1); g.fillRect(hx, hy + 3, 1, 1); }
        else if (p.kind === 'drip') { if (k > .45) continue; g.fillRect(x | 0, (y + k * 30) | 0, 2, 3); }
        else { g.fillRect(x | 0, y | 0, 3, 3); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(x | 0, y | 0, 1, 1); }
      }
      // status boxes
      const box = (x, y, name, lv, stat, frac, col) => {
        g.fillStyle = P.ink; g.fillRect(x - 2, y - 2, 110, 26); g.fillStyle = '#f8fafc'; g.fillRect(x, y, 106, 22);
        text(g, name, x + 4, y + 3, P.ink); text(g, lv, x + 102 - textW(lv), y + 3, P.ink);
        text(g, stat, x + 4, y + 13, '#334155'); g.fillStyle = '#334155'; g.fillRect(x + 44, y + 13, 58, 5); g.fillStyle = col; g.fillRect(x + 45, y + 14, Math.max(0, 56 * frac), 3);
      };
      if (this.phase === 'yasin') { box(14, 14, 'FOUNDER', 'LV30', 'VISION', 1, P.ok); box(198, 90, 'YOU', 'LV' + this.lv, 'CURIOSITY', .6 + .4 * this.sun, P.cyan); }
      else {
        box(14, 14, 'GHOST OF THE PAST', 'LV99', 'GLOOM', this.show.gloom, '#8b5cf6');
        box(198, 90, 'YOU', 'LV1', 'RESOLVE', this.show.resolve, this.show.resolve < .3 ? '#ef4444' : P.cyan);
      }
    },
  };
  return s;
}

// the fight itself; resolves once empathy has turned the ghost back into Yasin
export async function ghostBattle(sc) {
  audio.sfx('ghost');
  await say(S.ghostIntro);
  const order = ['despair', 'hope', 'redund'];
  let hp = 100, rs = 100, turn = 0, unlockedSaid = false, clingSaid = false;
  const shake = (n, ms) => { fx.shake = n; after(ms, () => fx.shake = 0); };
  for (; ;) {
    const unlocked = hp <= 45;
    if (unlocked && !unlockedSaid) { unlockedSaid = true; audio.sfx('heal'); await say(S.ghostUnlock); }
    const list = S.ghostMoves.map(m => ({ t: m.t, v: m.v, d: m.v === 'emp' && !unlocked ? m.locked : m.d, primary: true, locked: m.v === 'emp' && !unlocked, cls: m.v === 'emp' && unlocked ? 'ready' : m.v === 'use' ? 'weak' : '' }));
    const v = await choose(list, ['sys', S.ghostAsk], { grid: true });
    const mv = S.ghostMoves.find(m => m.v === v);
    if (v === 'emp' && !unlocked) { await say(S.ghostLocked); continue; }
    moveCard(mv.t, mv.d, 'you');
    if (v === 'emp') { sc.burst('heart'); audio.sfx('heal'); await wait(900); await say(S.ghostEmpathy); hideMoveCard(); break; }
    if (v === 'use') { sc.burst('drip'); await wait(500); hp = Math.min(100, hp + 12); sc.gloom = hp / 100; sc.grow = 1; audio.sfx('ghost'); }
    else {
      sc.burst(v === 'opt' ? 'sun' : 'idea'); await wait(v === 'opt' ? 620 : 120);
      const dmg = v === 'opt' ? 26 + Math.random() * 5 : 32 + Math.random() * 5;
      hp = Math.max(12, Math.round(hp - dmg)); sc.gloom = hp / 100; sc.hit = 420; shake(2.5, 180); audio.sfx('hit');
    }
    await say(S.ghostHit[v]); hideMoveCard();
    if (hp <= 12 && !clingSaid) { clingSaid = true; await say(S.ghostCling); }
    // the ghost's turn
    const a = S.ghostAttacks[order[turn % 3]], line = a.lines[Math.floor(turn / 3) % a.lines.length]; turn++;
    moveCard(a.t, a.d, 'enemy'); sc.burst('gloom'); audio.sfx('ghost'); await wait(650);
    rs = Math.max(0, rs - (16 + Math.random() * 8) * (v === 'use' ? 1.4 : 1)); sc.resolve = rs / 100; sc.hurt = 420; shake(2, 160);
    await say([['past', line]]); hideMoveCard();
    if (rs <= 0) { await say(S.ghostFaint); rs = 70; sc.resolve = .7; audio.sfx('heal'); }
  }
  // the reveal: the ghost glows white, shakes, flashes, and the founder is standing there instead
  closeDialogue();
  await tween(1500, k => { sc.reveal = k; fx.shake = k * 2; });
  fx.shake = 0; audio.sfx('swirl');
  await tween(160, k => fx.flash = k); sc.phase = 'yasin'; sc.duoT = sc.t; sc.lv = 2; sc.parts = [];
  await tween(500, k => fx.flash = 1 - k); fx.flash = 0;
  audio.music('battle'); audio.sfx('win');
  await say(S.ghostReveal);
}
